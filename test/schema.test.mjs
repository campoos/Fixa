// Testes do coração do import: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTrack, trackCounts } from "../study-schema.js";

const theory = { type: "theory", title: "T", objective: "obj", keyPoints: ["a"], sample: { q: "q?", a: "a." } };
const practice = { type: "practice", title: "P", objective: "obj", steps: ["s1"], expected: "ok" };
const track = (tasks) => ({ title: "Tema X", epics: [{ title: "E", stories: [{ title: "S", tasks }] }] });

test("track válido passa e ganha ids hierárquicos", () => {
  const r = validateTrack(track([theory, practice]));
  assert.equal(r.ok, true);
  const ts = r.track.epics[0].stories[0].tasks;
  assert.deepEqual(ts.map((t) => t.id), ["1.1.1", "1.1.2"]);
  assert.equal(r.track.id, "tema-x"); // slug
});

test("aceita string JSON e rejeita JSON quebrado", () => {
  assert.equal(validateTrack(JSON.stringify(track([theory]))).ok, true);
  const bad = validateTrack("{ not json");
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0], /JSON inválido/);
});

test("erros claros: sem título, sem epics, task teórica sem sample", () => {
  assert.equal(validateTrack({ title: "", epics: [] }).ok, false);
  const r = validateTrack(track([{ ...theory, sample: { q: "", a: "" } }]));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("sample")));
});

test("prática sem sample ganha auto-check derivado do expected", () => {
  const r = validateTrack(track([practice]));
  assert.equal(r.ok, true);
  const t = r.track.epics[0].stories[0].tasks[0];
  assert.match(t.sample.q, /Refaça de cabeça/);
  assert.equal(t.sample.a, "ok");
});

test("prática sem steps/expected é rejeitada", () => {
  const r = validateTrack(track([{ type: "practice", title: "P", objective: "o" }]));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("steps")));
  assert.ok(r.errors.some((e) => e.includes("expected")));
});

test("trackCounts conta certo", () => {
  const r = validateTrack(track([theory, practice, practice]));
  assert.deepEqual(trackCounts(r.track), { epics: 1, stories: 1, tasks: 3, practice: 2, theory: 1 });
});
