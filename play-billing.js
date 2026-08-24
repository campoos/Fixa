// Google Play Billing — verificação de assinatura pela Play Developer API (REST, sem dependência).
//
// Por que existe: a Play exige que conteúdo digital consumido no app seja vendido pelo Play
// Billing (PLAY-STORE.md §6). O checkout em si é nativo — quem cobra é o Google, dentro do app.
// O que sobra pro servidor é o que importa: confirmar que o token de compra que o front mandou
// é real, e continuar sabendo disso quando a assinatura renovar, for cancelada ou expirar.
//
// Env-gated igual ao email.js: sem PLAY_SERVICE_ACCOUNT_JSON, playEnabled() = false e quem
// chama decide o fallback. O app roda igual, só sem venda dentro do Android.
import { createSign } from "node:crypto";

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

// leitura LAZY: este módulo é importado antes do loadEnv() do server popular o process.env
const sa = () => {
  try { return JSON.parse(process.env.PLAY_SERVICE_ACCOUNT_JSON || "null"); } catch { return null; }
};
export const playPackage = () => process.env.ANDROID_PACKAGE_ID || "br.com.fixaestudos.app";
export const playEnabled = () => { const c = sa(); return Boolean(c?.client_email && c?.private_key); };

// ---- token de acesso (JWT RS256 assinado com a chave da service account) ----
// O Google troca um JWT auto-assinado por um access_token de 1h. Cache em memória com folga
// de 60s: o processo do Render é único e reinicia sozinho, não vale a pena persistir.
let cache = { token: "", exp: 0 };
async function token() {
  const c = sa();
  if (!c) return null;
  if (cache.token && Date.now() < cache.exp) return cache.token;

  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const claim = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: c.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  })}`;
  // a private_key vem do JSON com \n literais quando passa por env var de painel
  const pem = String(c.private_key).replace(/\\n/g, "\n");
  const jwt = `${claim}.${createSign("RSA-SHA256").update(claim).sign(pem).toString("base64url")}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) {
    console.error("[play] token:", r.status, JSON.stringify(d).slice(0, 200));
    return null;
  }
  cache = { token: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
  return cache.token;
}

async function call(path, { method = "GET" } = {}) {
  const t = await token();
  if (!t) return { ok: false, status: 401, error: "service account não configurada" };
  const r = await fetch(`${API}/applications/${playPackage()}${path}`, {
    method, headers: { Authorization: `Bearer ${t}` },
  });
  if (r.status === 204) return { ok: true, data: {} };
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("[play]", method, path.slice(0, 60), r.status, JSON.stringify(data).slice(0, 200));
    return { ok: false, status: r.status, error: data?.error?.message || `Play respondeu ${r.status}` };
  }
  return { ok: true, data };
}

/** Estado de uma assinatura pelo token de compra (subscriptionsv2). */
export const getSubscription = (purchaseToken) =>
  call(`/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);

/** Confirma o recebimento. Sem isso em 3 dias o Google estorna a compra sozinho. */
export const acknowledge = (productId, purchaseToken) =>
  call(`/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, { method: "POST" });

// ---- leitura do estado ----
// A v2 devolve um estado por assinatura e a validade no lineItem. "Pro" aqui é generoso de
// propósito: quem cancelou mas ainda tem prazo pago continua Pro até expirar, e quem está em
// período de carência (cartão recusado, Google tentando de novo) não perde acesso no susto.
const ATIVOS = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_CANCELED",     // cancelou a renovação, mas o prazo pago vale até o fim
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
]);

export function readSubscription(d) {
  const item = d?.lineItems?.[0] || {};
  const state = d?.subscriptionState || "";
  return {
    state,
    ativa: ATIVOS.has(state),
    productId: item.productId || null,
    basePlanId: item.offerDetails?.basePlanId || null,
    offerId: item.offerDetails?.offerId || null,
    expiraEm: item.expiryTime || null,
    orderId: d?.latestOrderId || null,
    precisaConfirmar: d?.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING",
    // é aqui que a compra encontra a conta do Fixa: o front manda o id do usuário no
    // obfuscatedAccountId do PaymentRequest, e ele volta intacto na verificação
    uid: d?.externalAccountIdentifiers?.obfuscatedExternalAccountId || null,
  };
}

// ---- RTDN (Real-time developer notifications, via push do Pub/Sub) ----
// O Pub/Sub entrega {message:{data:<base64 do JSON>}}. É por aqui que renovação, cancelamento
// e expiração chegam sem a pessoa abrir o app — sem isso, um cancelamento só seria notado no
// próximo login, e um estorno nunca.
export function decodeRtdn(body) {
  try {
    const raw = body?.message?.data;
    if (!raw) return null;
    const d = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    const n = d.subscriptionNotification;
    if (!n) return null; // notificação de teste ou de produto avulso: ignora
    return { tipo: n.notificationType, purchaseToken: n.purchaseToken, productId: n.subscriptionId, pacote: d.packageName };
  } catch { return null; }
}
