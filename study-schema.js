// Valida e normaliza o JSON de um tema importado (gerado por ChatGPT/Gemini a partir
// do prompt de prompt-template.js). Sem dependência externa. Retorna { ok, errors[], track }.
//
// Shape esperado (topo):
// { "title": str, "summary"?: str, "epics": [
//   { "title": str, "goal"?: str, "stories": [
//     { "title": str, "tasks": [
//        // teórica:
//        { "type":"theory", "title":str, "objective":str, "keyPoints":[str], "sample":{"q":str,"a":str} }
//        // prática:
//        { "type":"practice", "title":str, "objective":str, "language"?:str,
//          "steps":[str], "hint"?:str, "expected":str, "snippet"?:str,
//          "sample"?:{"q":str,"a":str} }  // sample opcional na prática (usado na revisão)
//   ] } ] } ] }

const isStr = (v) => typeof v === "string";
const clean = (v) => (isStr(v) ? v.trim() : "");
const arr = (v) => (Array.isArray(v) ? v : []);
const slug = (s) =>
  (clean(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "tema");

// valida uma task e devolve {task, errors}
function normTask(raw, id, path, errors) {
  const type = raw && raw.type === "practice" ? "practice" : "theory";
  const title = clean(raw && raw.title);
  const objective = clean(raw && raw.objective);
  if (!title) errors.push(`${path}: task sem "title"`);
  if (!objective) errors.push(`${path}: task "${title || id}" sem "objective"`);
  const base = { id, type, title: title || `Task ${id}`, objective };
  if (type === "practice") {
    const steps = arr(raw.steps).map(clean).filter(Boolean);
    const expected = clean(raw.expected);
    if (!steps.length) errors.push(`${path}: task prática "${title}" sem "steps"`);
    if (!expected) errors.push(`${path}: task prática "${title}" sem "expected"`);
    return {
      ...base,
      language: clean(raw.language) || null,
      steps,
      hint: clean(raw.hint) || null,
      expected,
      snippet: clean(raw.snippet) || null,
      // sample é opcional na prática; se vier, alimenta a revisão espaçada
      sample: raw.sample && (clean(raw.sample.q) || clean(raw.sample.a))
        ? { q: clean(raw.sample.q), a: clean(raw.sample.a) }
        : { q: `Refaça de cabeça: ${title}`, a: clean(raw.expected) || "Compare com o resultado esperado da task." },
    };
  }
  // teórica
  const keyPoints = arr(raw.keyPoints).map(clean).filter(Boolean);
  const q = clean(raw.sample && raw.sample.q);
  const a = clean(raw.sample && raw.sample.a);
  if (!q || !a) errors.push(`${path}: task "${title}" sem "sample.q"/"sample.a"`);
  return { ...base, keyPoints, sample: { q, a } };
}

export function validateTrack(input) {
  const errors = [];
  let data = input;
  if (isStr(input)) {
    try { data = JSON.parse(input); } catch (e) { return { ok: false, errors: [`JSON inválido: ${e.message}`], track: null }; }
  }
  if (!data || typeof data !== "object") return { ok: false, errors: ["JSON não é um objeto"], track: null };

  const title = clean(data.title);
  if (!title) errors.push('topo: falta "title" (nome do tema)');
  const epicsRaw = arr(data.epics);
  if (!epicsRaw.length) errors.push('topo: "epics" vazio ou ausente');

  const epics = epicsRaw.map((e, ei) => {
    const en = ei + 1;
    const eid = `${en}`;
    const storiesRaw = arr(e && e.stories);
    if (!clean(e && e.title)) errors.push(`epic ${en}: sem "title"`);
    if (!storiesRaw.length) errors.push(`epic ${en}: sem "stories"`);
    const stories = storiesRaw.map((s, si) => {
      const sn = si + 1;
      const sid = `${en}.${sn}`;
      const tasksRaw = arr(s && s.tasks);
      if (!clean(s && s.title)) errors.push(`story ${sid}: sem "title"`);
      if (!tasksRaw.length) errors.push(`story ${sid}: sem "tasks"`);
      const tasks = tasksRaw.map((t, ti) => normTask(t, `${sid}.${ti + 1}`, `story ${sid}`, errors));
      return { id: sid, title: clean(s && s.title) || `Story ${sid}`, tasks };
    });
    return { id: eid, title: clean(e && e.title) || `Epic ${en}`, goal: clean(e && e.goal), stories };
  });

  if (errors.length) return { ok: false, errors, track: null };

  const track = {
    id: slug(title),
    title,
    summary: clean(data.summary),
    // ícone sugerido pelo gerador (opcional) — o server valida contra o catálogo (TRACK_ICONS)
    icon: clean(data.icon).toLowerCase() || null,
    epics,
  };
  return { ok: true, errors: [], track };
}

// contagem rápida (pra prévia no import)
export function trackCounts(track) {
  let epics = 0, stories = 0, tasks = 0, practice = 0;
  for (const e of track.epics) {
    epics++;
    for (const s of e.stories) { stories++; for (const t of s.tasks) { tasks++; if (t.type === "practice") practice++; } }
  }
  return { epics, stories, tasks, practice, theory: tasks - practice };
}
