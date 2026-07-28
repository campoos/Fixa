// Testes do push v3 (DESIGN-PUSH.md): cadência, split de canal, copy e assinatura VAPID.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPush, pushCadence, emailEvent, buildReminder } from "../reminders.js";
import { generateVapidKeys, _vapidJwt } from "../push.js";
import { createVerify, createPublicKey } from "node:crypto";

const base = { mode: "normal", n: 3, dose: 3, rest: 0, daysLeft: null, userId: "u_abc", ymd: "2026-07-28" };

test("cadência do push é mais longa que a do e-mail, mas também acaba", () => {
  assert.equal(pushCadence(0), "daily");
  assert.equal(pushCadence(13), "daily"); // o e-mail já tinha parado no dia 7
  assert.equal(pushCadence(14), "silent");
  assert.equal(pushCadence(21), "weekly");
  assert.equal(pushCadence(60), "silent");
});

test("e-mail só sai em evento: nunca no dia a dia de quem tem push", () => {
  const push = { hasPush: true, ymd: "2026-07-28" }; // terça
  assert.equal(emailEvent({ daysInactive: 0, ...push }), null);
  assert.equal(emailEvent({ daysInactive: 1, ...push }), null);
  assert.equal(emailEvent({ daysInactive: 3, ...push }), "retorno");
  assert.equal(emailEvent({ daysInactive: 7, ...push }), "pause-notice");
  assert.equal(emailEvent({ daysInactive: 14, ...push }), "weekly");
  assert.equal(emailEvent({ daysInactive: 58, ...push }), "monthly");
  assert.equal(emailEvent({ daysInactive: 40, ...push }), null); // silêncio continua silêncio
  assert.equal(emailEvent({ daysInactive: 0, daysLeft: 7, ...push }), "prova");
  assert.equal(emailEvent({ daysInactive: 0, daysLeft: 1, ...push }), "prova");
  assert.equal(emailEvent({ daysInactive: 0, daysLeft: 4, ...push }), null); // só D-7 e D-1
});

test("quem não tem push recebe um resumo semanal — na segunda, e só", () => {
  assert.equal(emailEvent({ daysInactive: 0, hasPush: false, ymd: "2026-07-27" }), "semanal"); // segunda
  assert.equal(emailEvent({ daysInactive: 0, hasPush: false, ymd: "2026-07-28" }), null); // terça
  assert.equal(emailEvent({ daysInactive: 0, hasPush: true, ymd: "2026-07-27" }), null);
});

test("todo evento de e-mail tem copy montável", () => {
  for (const ev of ["retorno", "prova", "semanal", "pause-notice", "weekly", "monthly"]) {
    const m = buildReminder({ cadence: ev, mode: "normal", n: 3, dose: 3, rest: 0, daysLeft: 1, streak: 0, userId: "u_a", ymd: "2026-07-28" });
    assert.ok(m && m.subject && m.title && m.bodyP, `sem copy pra ${ev}`);
  }
});

test("push: fila vazia não vira notificação", () => {
  assert.equal(buildPush({ ...base, n: 0 }), null);
  assert.equal(buildPush({ ...base, cadence: "silent" }), null);
});

test("push do modo retorno fala da dose, não do total", () => {
  const m = buildPush({ ...base, cadence: "daily", mode: "retorno", n: 40, dose: 8, rest: 32 });
  assert.ok(m.title.includes("8") || m.body.includes("8"));
  assert.ok(!m.title.includes("40")); // 40 na manchete é parede, não fila
});

test("slot da noite só existe no dia a dia, e nunca cobra", () => {
  const noite = buildPush({ ...base, slot: "noite" });
  assert.equal(noite.tag, "fixa-noite");
  assert.equal(buildPush({ ...base, cadence: "weekly", slot: "noite" }), null);
  const proibido = /perdeu|perdendo|falhou|culpa|desistiu|zerou|quebrou/i;
  assert.ok(!proibido.test(`${noite.title} ${noite.body}`));
});

test("streak vivo aparece; zerado nunca é mencionado", () => {
  assert.ok(buildPush({ ...base, streak: 5 }).body.includes("5 dias seguidos"));
  assert.ok(!/seguidos/.test(buildPush({ ...base, streak: 0 }).body));
  assert.ok(!/seguidos/.test(buildPush({ ...base, streak: 2 }).body));
});

test("push leva pra fila e substitui o toque anterior em vez de empilhar", () => {
  const m = buildPush({ ...base });
  assert.equal(m.url, "/revisar");
  assert.equal(m.tag, "fixa-dia");
});

test("VAPID: o JWT é ES256 verificável pela chave pública do par", () => {
  const { publicKey, privateKey } = generateVapidKeys();
  const jwt = _vapidJwt({ audience: "https://fcm.googleapis.com", subject: "mailto:a@b.c", publicKey, privateKey, now: 1_700_000_000_000 });
  const [h, b, sig] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url").toString()), { typ: "JWT", alg: "ES256" });
  const claims = JSON.parse(Buffer.from(b, "base64url").toString());
  assert.equal(claims.aud, "https://fcm.googleapis.com");
  assert.equal(claims.exp, 1_700_000_000 + 12 * 3600);
  const pub = Buffer.from(publicKey, "base64url");
  assert.equal(pub.length, 65); // ponto não comprimido, como o navegador exige
  const key = createPublicKey({ key: { kty: "EC", crv: "P-256", x: pub.subarray(1, 33).toString("base64url"), y: pub.subarray(33, 65).toString("base64url") }, format: "jwk" });
  const v = createVerify("SHA256");
  v.update(`${h}.${b}`);
  assert.ok(v.verify({ key, dsaEncoding: "ieee-p1363" }, Buffer.from(sig, "base64url")));
});
