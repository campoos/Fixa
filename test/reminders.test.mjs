// Testes dos lembretes v2 (DESIGN-LEMBRETES-V2): node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickVariant, reminderCadence, lastActiveDay, buildReminder, daysInactive, rev, buildOnboard } from "../reminders.js";

const POOL = ["a", "b", "c", "d"];

test("rotação: estável por (user, dia) e sem repetir em dias consecutivos", () => {
  const u = "u_abc123";
  assert.equal(pickVariant(POOL, u, "2026-07-14"), pickVariant(POOL, u, "2026-07-14")); // determinismo
  const d1 = pickVariant(POOL, u, "2026-07-14");
  const d2 = pickVariant(POOL, u, "2026-07-15");
  assert.notEqual(d1, d2); // dias consecutivos ciclam o pool
});

test("rotação: usuários diferentes tendem a variantes diferentes no mesmo dia", () => {
  const day = "2026-07-14";
  const picks = new Set(["u_1", "u_22", "u_333", "u_4444"].map((u) => pickVariant(POOL, u, day)));
  assert.ok(picks.size >= 2);
});

test("cadence: 0-6 diário, 7 aviso de pausa", () => {
  for (let d = 0; d <= 6; d++) assert.equal(reminderCadence(d), "daily");
  assert.equal(reminderCadence(7), "pause-notice");
});

test("cadence: semanal 14/21/28, silêncio nos demais", () => {
  for (const d of [14, 21, 28]) assert.equal(reminderCadence(d), "weekly");
  for (const d of [8, 10, 13, 15, 30, 45]) assert.equal(reminderCadence(d), "silent");
});

test("cadence: mensal 58/88, silêncio perpétuo depois", () => {
  for (const d of [58, 88]) assert.equal(reminderCadence(d), "monthly");
  for (const d of [59, 90, 200]) assert.equal(reminderCadence(d), "silent");
});

test("lastActiveDay: maior dia com count>0; null sem atividade", () => {
  assert.equal(lastActiveDay({ activity: { "2026-07-01": 2, "2026-07-10": 1, "2026-07-05": 3 } }), "2026-07-10");
  assert.equal(lastActiveDay({ activity: { "2026-07-10": 0 } }), null);
  assert.equal(lastActiveDay({ activity: {} }), null);
});

test("daysInactive: usa a última atividade; fallback createdAt", () => {
  assert.equal(daysInactive({ activity: { "2026-07-10": 1 } }, "2026-07-01T00:00:00Z", "2026-07-14"), 4);
  assert.equal(daysInactive({ activity: {} }, "2026-07-07T12:00:00.000Z", "2026-07-14"), 7);
});

test("streak: linha só com streak >= 3; zerado nunca aparece", () => {
  const base = { cadence: "daily", mode: "normal", n: 5, dose: 5, rest: 0, daysLeft: null, userId: "u_x", ymd: "2026-07-14" };
  assert.ok(buildReminder({ ...base, streak: 5 }).bodyP.includes("dias seguidos"));
  assert.ok(!buildReminder({ ...base, streak: 0 }).bodyP.includes("dias seguidos"));
  assert.ok(!buildReminder({ ...base, streak: 2 }).bodyP.includes("streak"));
});

test("modos: retorno lidera com a dose; prova cita a fila; pause-notice é honesto", () => {
  const r = buildReminder({ cadence: "daily", mode: "retorno", n: 40, dose: 12, rest: 28, daysLeft: null, streak: 0, userId: "u_r", ymd: "2026-07-14" });
  assert.ok(r.subject.includes("12") || r.title.includes("12"));
  const p = buildReminder({ cadence: "daily", mode: "prova", n: 30, dose: 30, rest: 0, daysLeft: 5, streak: 0, userId: "u_p", ymd: "2026-07-14" });
  assert.ok(p.subject.includes("30") || p.title.includes("30"));
  const pause = buildReminder({ cadence: "pause-notice", mode: "normal", n: 9, dose: 9, rest: 0, daysLeft: null, streak: 0, userId: "u_z", ymd: "2026-07-14" });
  assert.ok(pause.bodyP.includes("Espaçar funciona pra memória"));
});

test("singular: n=1 vira '1 revisão' em todas as famílias", () => {
  assert.equal(rev(1), "1 revisão");
  for (const cadence of ["weekly", "monthly", "pause-notice"]) {
    const m = buildReminder({ cadence, mode: "normal", n: 1, dose: 1, rest: 0, daysLeft: null, streak: 0, userId: "u_s", ymd: "2026-07-14" });
    assert.ok(!m.bodyP.includes("1 revisões") && !m.title.includes("1 revisões"));
  }
  const d = buildReminder({ cadence: "daily", mode: "normal", n: 1, dose: 1, rest: 0, daysLeft: null, streak: 0, userId: "u_s", ymd: "2026-07-14" });
  assert.ok(!d.subject.includes("1 revisões"));
});

// ---- ativação (quem se cadastrou e nunca começou) ----
import { daysBetween } from "../review-engine.js";

test("ativação: as 4 combinações têm copy completa e distinta", () => {
  const combos = [["sem-tema", "d1"], ["sem-tema", "d3"], ["sem-estudo", "d1"], ["sem-estudo", "d3"]];
  const assuntos = new Set();
  for (const [variante, marco] of combos) {
    const m = buildOnboard({ variante, marco });
    assert.ok(m, `${variante}/${marco} existe`);
    for (const campo of ["subject", "title", "bodyP"]) assert.ok(m[campo]?.trim(), `${variante}/${marco}.${campo}`);
    assuntos.add(m.subject);
  }
  assert.equal(assuntos.size, 4, "cada toque tem assunto próprio — repetido vira spam");
});

test("ativação: variante ou marco desconhecido não inventa e-mail", () => {
  assert.equal(buildOnboard({ variante: "sem-tema", marco: "d7" }), null);
  assert.equal(buildOnboard({ variante: "ativo", marco: "d1" }), null);
  assert.equal(buildOnboard({ variante: undefined, marco: undefined }), null);
});

test("ativação: só D+1 e D+3 disparam — o resto é silêncio", () => {
  const marcoDe = (cadastro, hoje) => ({ 1: "d1", 3: "d3" })[daysBetween(cadastro, hoje)];
  assert.equal(marcoDe("2026-08-20", "2026-08-21"), "d1");
  assert.equal(marcoDe("2026-08-20", "2026-08-23"), "d3");
  for (const hoje of ["2026-08-20", "2026-08-22", "2026-08-24", "2026-09-20"])
    assert.equal(marcoDe("2026-08-20", hoje), undefined, `${hoje} não dispara`);
});
