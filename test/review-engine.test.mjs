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
  assert.equal(clampNext("2026-08-30", "2026-08-15"), "2026-08-15");
  assert.equal(clampNext("2026-08-01", "2026-08-15"), "2026-08-01");
  const rv = gradeEntry({ box: 6, last: "2026-07-01", next: "2026-07-11" }, "pass", "2026-07-11", "2026-07-20");
  assert.equal(rv.next, "2026-07-20"); // caixa 7 seria +30d → clampa na prova
});

test("addDays atravessa mês/ano", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-02-28", 2), "2026-03-02");
});
