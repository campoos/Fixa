// Testes do motor Leitner: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { REVIEW_LADDER, addDays, daysBetween, isGraduated, clampNext, seedEntry, gradeEntry } from "../review-engine.js";

test("seed: caixa 0, revisa amanhã", () => {
  const rv = seedEntry("2026-07-11");
  assert.deepEqual(rv, { box: 0, last: "2026-07-11", next: "2026-07-12" });
});

test("pass sobe a régua inteira e gradua (1-2-3-4-7-15-21-30)", () => {
  let rv = seedEntry("2026-07-11");
  let day = "2026-07-12";
  const gaps = [];
  while (!isGraduated(rv)) {
    const prev = day;
    rv = gradeEntry(rv, "pass", day);
    if (rv.next) { gaps.push(daysBetween(prev, rv.next)); day = rv.next; }
  }
  assert.deepEqual(gaps, REVIEW_LADDER.slice(1)); // saltos seguem a régua a partir da caixa 1
  assert.equal(rv.next, null); // graduou: sai da fila
});

test("fail volta pra caixa 0 e revisa amanhã", () => {
  let rv = { box: 4, last: "2026-07-01", next: "2026-07-11" };
  rv = gradeEntry(rv, "fail", "2026-07-11");
  assert.deepEqual(rv, { box: 0, last: "2026-07-11", next: "2026-07-12" });
});

test("clamp: revisão nunca cai depois da prova", () => {
  // "hoje" explícito: sem ele o teste depende da data real e vira bomba-relógio — passou
  // até 15/08/2026 e falhava desde 16/08, porque prova no passado não clampa (QA #2).
  assert.equal(clampNext("2026-08-30", "2026-08-15", "2026-08-01"), "2026-08-15");
  assert.equal(clampNext("2026-08-01", "2026-08-15", "2026-08-01"), "2026-08-01");
  assert.equal(clampNext("2026-08-30", "2026-08-15", "2026-08-20"), "2026-08-30"); // prova já passou: ignora
  const rv = gradeEntry({ box: 6, last: "2026-07-01", next: "2026-07-11" }, "pass", "2026-07-11", "2026-07-20");
  assert.equal(rv.next, "2026-07-20"); // caixa 7 seria +30d → clampa na prova
});

test("addDays atravessa mês/ano", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-02-28", 2), "2026-03-02");
});

// ---- planSession (DESIGN-FILA-RETORNO): seleciona, nunca reagenda ----
import { REVIEW_DOSE, planSession } from "../review-engine.js";
const D = (box, next) => ({ box, next });
const HOJE = "2026-07-13";

test("planSession: fila vazia = normal", () => {
  assert.deepEqual(planSession([], HOJE), { mode: "normal", session: [], rest: 0, overdue: 0 });
});

test("planSession: fila pequena com atrasadas = normal cheia (≤ dose não faz cerimônia)", () => {
  const due = [D(1, "2026-07-10"), D(2, "2026-07-11"), D(0, "2026-07-13")];
  const p = planSession(due, HOJE);
  assert.equal(p.mode, "normal");
  assert.equal(p.session.length, 3);
  assert.equal(p.rest, 0);
});

test("planSession: backlog grande = retorno com dose por fragilidade (box asc, next asc)", () => {
  const due = [];
  for (let i = 0; i < 40; i++) due.push(D(i % 5, addDays("2026-06-20", i % 10)));
  const p = planSession(due, HOJE);
  assert.equal(p.mode, "retorno");
  assert.equal(p.session.length, REVIEW_DOSE);
  assert.equal(p.rest, 28);
  for (let i = 1; i < p.session.length; i++) {
    const a = p.session[i - 1], b = p.session[i];
    assert.ok(a.box < b.box || (a.box === b.box && a.next <= b.next), "ordem por fragilidade");
  }
  assert.equal(p.session.length + p.rest, due.length); // honestidade auditável
});

test("planSession: fila grande SEM atrasadas = normal cheia (teto não vira regime)", () => {
  const due = [];
  for (let i = 0; i < 20; i++) due.push(D(i % 4, HOJE));
  const p = planSession(due, HOJE);
  assert.equal(p.mode, "normal");
  assert.equal(p.session.length, 20);
});

test("planSession: prova em ≤7 dias desliga a dose — fila inteira por fragilidade", () => {
  const due = [];
  for (let i = 0; i < 50; i++) due.push(D(i % 6, addDays("2026-06-25", i % 12)));
  const p = planSession(due, HOJE, 5);
  assert.equal(p.mode, "prova");
  assert.equal(p.session.length, 50);
  assert.equal(p.rest, 0);
  assert.ok(p.session[0].box <= p.session[49].box);
});

test("planSession: prova em 10 dias NÃO desliga a dose (corte é 7)", () => {
  const due = [];
  for (let i = 0; i < 30; i++) due.push(D(i % 5, "2026-07-01"));
  const p = planSession(due, HOJE, 10);
  assert.equal(p.mode, "retorno");
  assert.equal(p.session.length, REVIEW_DOSE);
});
