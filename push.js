// Web Push (RFC 8030 + VAPID RFC 8292) em Node puro — sem dependência nova.
//
// Decisão de escopo: o push sai SEM payload. O service worker recebe o "toque" e busca o
// conteúdo em /api/push/payload com o cookie de sessão. Isso evita implementar a criptografia
// aes128gcm (RFC 8291) aqui dentro e, de quebra, faz a notificação mostrar o estado do
// momento em que ela aparece — não o de quando o cron rodou.
//
// O que este arquivo precisa saber do mundo: as chaves VAPID (env) e o endpoint da inscrição.
import { createSign, createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";

const b64u = (buf) => Buffer.from(buf).toString("base64url");

/** Gera um par VAPID novo — usado só pelo scripts/gen-vapid.mjs, nunca em runtime. */
export function generateVapidKeys() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = publicKey.export({ format: "jwk" });
  const priv = privateKey.export({ format: "jwk" });
  // chave pública = ponto não comprimido (0x04 || X || Y), 65 bytes — é o formato que o
  // navegador espera em applicationServerKey
  const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]);
  return { publicKey: b64u(pub), privateKey: priv.d };
}

/** Chave privada VAPID (d em base64url) → objeto de chave do Node. */
function privKeyFrom(d, publicKey) {
  const pub = Buffer.from(publicKey, "base64url");
  return createPrivateKey({
    key: { kty: "EC", crv: "P-256", d, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) },
    format: "jwk",
  });
}

/** JWT ES256 do VAPID: quem está mandando (aud = origem do serviço de push) e até quando vale. */
function vapidJwt({ audience, subject, publicKey, privateKey, expSeconds = 12 * 3600, now = Date.now() }) {
  const header = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64u(JSON.stringify({ aud: audience, exp: Math.floor(now / 1000) + expSeconds, sub: subject }));
  const sign = createSign("SHA256");
  sign.update(`${header}.${body}`);
  // dsaEncoding ieee-p1363 = R||S cru, que é o que o JWS pede (o default do Node é DER)
  const sig = sign.sign({ key: privKeyFrom(privateKey, publicKey), dsaEncoding: "ieee-p1363" });
  return `${header}.${body}.${b64u(sig)}`;
}

export const pushEnabled = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
export const pushPublicKey = () => process.env.VAPID_PUBLIC_KEY || "";

/**
 * Toca uma inscrição. Devolve { ok } ou { ok: false, gone } — `gone` é a inscrição morta
 * (404/410), que o chamador deve apagar: é assim que a lista se limpa sozinha.
 */
export async function sendPush(sub, { ttl = 6 * 3600, urgency = "normal", topic } = {}) {
  if (!pushEnabled()) return { ok: false, error: "VAPID não configurado" };
  if (!sub?.endpoint) return { ok: false, error: "inscrição sem endpoint" };
  const { origin } = new URL(sub.endpoint);
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const jwt = vapidJwt({
    audience: origin,
    subject: process.env.VAPID_SUBJECT || "mailto:contato@fixaestudos.com.br",
    publicKey,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  });
  const headers = {
    Authorization: `vapid t=${jwt}, k=${publicKey}`,
    TTL: String(ttl),
    Urgency: urgency,
    "Content-Length": "0",
  };
  if (topic) headers.Topic = topic; // mesma topic substitui a anterior na bandeja
  try {
    const r = await fetch(sub.endpoint, { method: "POST", headers });
    if (r.ok) return { ok: true };
    return { ok: false, status: r.status, gone: r.status === 404 || r.status === 410, error: await r.text().catch(() => "") };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// exportado só pros testes: valida a montagem do JWT sem bater na rede
export const _vapidJwt = vapidJwt;
export const _publicKeyFromPrivate = (d, publicKey) => b64u(createPublicKey(privKeyFrom(d, publicKey)).export({ format: "der", type: "spki" }));
