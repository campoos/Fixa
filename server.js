import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";
import { validateTrack, trackCounts } from "./study-schema.js";
import { buildPrompt } from "./prompt-template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- .env (sem dependência) ----
async function loadEnv() {
  try {
    const raw = await readFile(join(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* sem .env */ }
}
await loadEnv();

const PORT = Number(process.env.PORT || 4022);
const HOST = process.env.HOST || "0.0.0.0";
const SSO_SECRET = process.env.SSO_SECRET || "dev-secret-troca-em-prod";
const APP_PASS = process.env.APP_PASS || "estudar";
const APP_USER = process.env.APP_USER || "João";
const DIST = join(__dirname, "web", "dist");

// ---- KV (Upstash REST ou arquivo local) ----
const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const KV_FILE = join(__dirname, "kv-store.json");
const kv = {
  async _cmd(args) {
    const r = await fetch(UPSTASH_URL, { method: "POST", headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    return (await r.json()).result;
  },
  async get(key) {
    if (UPSTASH_URL) { const v = await this._cmd(["GET", key]); return v ? JSON.parse(v) : null; }
    try { return JSON.parse(await readFile(KV_FILE, "utf8"))[key] ?? null; } catch { return null; }
  },
  _writeQ: Promise.resolve(),
  async set(key, val) {
    if (UPSTASH_URL) { await this._cmd(["SET", key, JSON.stringify(val)]); return; }
    // serializa TODAS as escritas de arquivo (evita read-modify-write concorrente corromper o kv-store.json)
    const run = async () => {
      let all = {}; try { all = JSON.parse(await readFile(KV_FILE, "utf8")); } catch { /* primeiro a escrever */ }
      all[key] = val; await writeFile(KV_FILE, JSON.stringify(all, null, 2));
    };
    this._writeQ = this._writeQ.then(run, run); // roda mesmo se a escrita anterior falhou
    return this._writeQ;
  },
};

// ---- estado em memória (persistido no KV) ----
let tracks = (await kv.get("theme:tracks")) || {}; // id -> conteúdo do tema
let state = (await kv.get("theme:state")) || {};   // trackId -> { done, comments, review }
let trash = (await kv.get("theme:trash")) || {};   // id -> { track, state, deletedAt } (lixeira reversível)
const saveTracks = () => kv.set("theme:tracks", tracks).catch((e) => console.error("[tracks]", e.message));
const saveState = () => kv.set("theme:state", state).catch((e) => console.error("[state]", e.message));
const saveTrash = () => kv.set("theme:trash", trash).catch((e) => console.error("[trash]", e.message));
const freeId = (base) => { let id = base, n = 2; while (tracks[id]) id = `${base}-${n++}`; return id; };
function tState(id) {
  const s = state[id] || (state[id] = { done: {}, comments: {}, review: {} });
  s.done ||= {}; s.comments ||= {}; s.review ||= {};
  return s;
}
const taskIdsOf = (track) => {
  const set = new Set();
  for (const e of track.epics) for (const st of e.stories) for (const t of st.tasks) set.add(t.id);
  return set;
};

// ---- repetição espaçada (Leitner) ----
const REVIEW_LADDER = [1, 2, 3, 4, 7, 15, 21, 30];
const STUDY_TZ = "America/Sao_Paulo";
const spDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: STUDY_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
const isGraduated = (rv) => rv.box >= REVIEW_LADDER.length;
function daysBetween(a, b) {
  const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
}
// agenda adaptativa (Cepeda): nenhuma revisão é agendada DEPOIS da data da prova — cai no máx no dia da prova
const clampNext = (next, targetDate) => (targetDate && next && next > targetDate ? targetDate : next);
function seedReview(s, id, fromDay, targetDate) {
  const day = fromDay || spDay();
  s.review[id] = { box: 0, last: day, next: clampNext(addDays(day, REVIEW_LADDER[0]), targetDate) };
}

// ---- atividade / streak (dias em que estudou/revisou) ----
let activity = new Set((await kv.get("theme:activity")) || []);
const markActive = () => { activity.add(spDay()); kv.set("theme:activity", [...activity]).catch((e) => console.error("[activity]", e.message)); };
function computeStreak() {
  let s = 0, d = spDay();
  if (!activity.has(d)) d = addDays(d, -1); // hoje ainda não estudou? conta a partir de ontem
  while (activity.has(d)) { s++; d = addDays(d, -1); }
  return s;
}
function computeStats() {
  let tasksDone = 0, mastered = 0, tasksTotal = 0;
  for (const id of Object.keys(tracks)) {
    const s = tState(id);
    for (const e of tracks[id].epics) for (const st of e.stories) for (const t of st.tasks) {
      tasksTotal++;
      if (s.done[t.id]) tasksDone++;
      const rv = s.review[t.id];
      if (rv && isGraduated(rv)) mastered++;
    }
  }
  return { streak: computeStreak(), dueToday: globalReview().due.length, themes: Object.keys(tracks).length, tasksDone, tasksTotal, mastered };
}

// ---- montagem ----
function taskWithState(t, s, epicTitle, storyTitle, today, dueBucket, trackId) {
  const done = !!s.done[t.id];
  const rv = s.review[t.id];
  let review = null;
  if (rv) {
    const graduated = isGraduated(rv);
    const due = !graduated && !!rv.next && rv.next <= today;
    review = { box: rv.box, next: rv.next, graduated, due, ladder: REVIEW_LADDER.length };
    if (due && dueBucket) dueBucket.push({ trackId, id: t.id, title: t.title, sample: t.sample, type: t.type, epic: epicTitle, story: storyTitle, box: rv.box, next: rv.next });
  }
  return { ...t, done, completedAt: s.done[t.id] || null, comments: s.comments[t.id] || [], review };
}
function buildTrack(id) {
  const track = tracks[id];
  if (!track) return null;
  const s = tState(id);
  const today = spDay();
  const due = [];
  const epics = track.epics.map((e) => {
    const stories = e.stories.map((st) => {
      const tasks = st.tasks.map((t) => taskWithState(t, s, e.title, st.title, today, due, id));
      return { id: st.id, title: st.title, tasks, progress: { done: tasks.filter((t) => t.done).length, total: tasks.length } };
    });
    const total = stories.reduce((a, p) => a + p.progress.total, 0);
    const dn = stories.reduce((a, p) => a + p.progress.done, 0);
    return { id: e.id, title: e.title, goal: e.goal, stories, progress: { done: dn, total } };
  });
  const total = epics.reduce((a, e) => a + e.progress.total, 0);
  const dn = epics.reduce((a, e) => a + e.progress.done, 0);
  // domínio = tasks que graduaram na revisão espaçada (recall consolidado), ≠ "concluído"
  let mastery = 0;
  for (const e of epics) for (const st of e.stories) for (const t of st.tasks) if (t.review && t.review.graduated) mastery++;
  due.sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : 0));
  const targetDate = track.targetDate || null;
  const daysLeft = targetDate ? daysBetween(spDay(), targetDate) : null;
  // meta diária pra dominar tudo a tempo (heurística: o que falta dominar ÷ dias restantes)
  const remaining = total - mastery;
  const dailyGoal = targetDate && daysLeft && daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;
  return { id, title: track.title, summary: track.summary, epics, progress: { done: dn, total }, mastery, targetDate, daysLeft, dailyGoal, review: { due, ladder: REVIEW_LADDER } };
}
function trackSummary(id) {
  const t = buildTrack(id);
  return { id, title: t.title, summary: t.summary, progress: t.progress, mastery: t.mastery, due: t.review.due.length, targetDate: t.targetDate, daysLeft: t.daysLeft, counts: trackCounts(tracks[id]) };
}
function globalReview() {
  const today = spDay();
  const due = [];
  for (const id of Object.keys(tracks)) {
    const s = tState(id);
    for (const e of tracks[id].epics) for (const st of e.stories) for (const t of st.tasks) {
      const rv = s.review[t.id];
      if (rv && !isGraduated(rv) && rv.next && rv.next <= today)
        due.push({ trackId: id, trackTitle: tracks[id].title, id: t.id, title: t.title, sample: t.sample, type: t.type, epic: e.title, story: st.title, box: rv.box, next: rv.next });
    }
  }
  due.sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : 0));
  return { due, ladder: REVIEW_LADDER };
}

// ---- sessão (cookie assinado) ----
const b64u = (s) => Buffer.from(s).toString("base64url");
const TTL = 30 * 86400 * 1000;
function sign() {
  const p = b64u(JSON.stringify({ u: APP_USER, e: Date.now() + TTL }));
  return p + "." + createHmac("sha256", SSO_SECRET).update(p).digest("base64url");
}
function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [p, sig] = token.split(".");
  const exp = createHmac("sha256", SSO_SECRET).update(p).digest("base64url");
  try { if (sig.length !== exp.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null; } catch { return null; }
  let d; try { d = JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
  if (!d || !d.e || Date.now() > d.e) return null;
  return d.u;
}
const userOf = (req) => { const m = (req.headers.cookie || "").match(/(?:^|;\s*)ts_sess=([^;]+)/); return m ? verify(m[1]) : null; };
const readBody = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { res(JSON.parse(b || "{}")); } catch { res({}); } }); });

// ---- estático (SPA) ----
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
async function serveStatic(url, res) {
  let p = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  let file = join(DIST, p === "/" ? "index.html" : p);
  if (!file.startsWith(DIST)) file = join(DIST, "index.html");
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    return res.end(data);
  } catch {
    try { const html = await readFile(join(DIST, "index.html")); res.writeHead(200, { "Content-Type": "text/html" }); return res.end(html); }
    catch { res.writeHead(404); return res.end("build ausente — rode: cd web && npm run build"); }
  }
}
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };

// ---- servidor ----
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    if (!path.startsWith("/api/")) return serveStatic(url, res);

    if (path === "/api/health") return json(res, 200, { ok: true });
    if (path === "/api/login" && req.method === "POST") {
      const { pass } = await readBody(req);
      if (pass !== APP_PASS) return json(res, 401, { error: "senha inválida" });
      res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": `ts_sess=${sign()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000` });
      return res.end(JSON.stringify({ name: APP_USER }));
    }
    if (path === "/api/logout") { res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "ts_sess=; HttpOnly; Path=/; Max-Age=0" }); return res.end("{}"); }

    // daqui pra baixo exige sessão
    const me = userOf(req);
    if (!me) return json(res, 401, { error: "login requerido" });

    if (path === "/api/me") return json(res, 200, { name: me });
    if (path === "/api/import/prompt") {
      const prompt = buildPrompt({ theme: url.searchParams.get("theme") || "", level: url.searchParams.get("level") || undefined, mode: url.searchParams.get("mode") || undefined, depth: url.searchParams.get("depth") || undefined });
      return json(res, 200, { prompt });
    }
    if (path === "/api/import" && req.method === "POST") {
      const { json: raw } = await readBody(req);
      const v = validateTrack(raw);
      if (!v.ok) return json(res, 400, { ok: false, errors: v.errors });
      let id = v.track.id, n = 2;
      while (tracks[id]) id = `${v.track.id}-${n++}`; // não sobrescreve tema existente
      v.track.id = id;
      v.track.createdAt = new Date().toISOString();
      tracks[id] = v.track;
      tState(id);
      await Promise.all([saveTracks(), saveState()]);
      return json(res, 200, { ok: true, id, title: v.track.title, counts: trackCounts(v.track) });
    }
    if (path === "/api/tracks") return json(res, 200, { tracks: Object.keys(tracks).map(trackSummary) });
    if (path === "/api/track") { const t = buildTrack(url.searchParams.get("id")); return t ? json(res, 200, t) : json(res, 404, { error: "tema não encontrado" }); }
    if (path === "/api/track/delete" && req.method === "POST") {
      const { id } = await readBody(req);
      if (!tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      // soft-delete: vai pra lixeira (reversível), não some
      trash[id] = { track: tracks[id], state: state[id] || { done: {}, comments: {}, review: {} }, deletedAt: new Date().toISOString() };
      delete tracks[id]; delete state[id];
      await Promise.all([saveTracks(), saveState(), saveTrash()]);
      return json(res, 200, { ok: true });
    }
    if (path === "/api/trash") {
      const items = Object.entries(trash).map(([id, t]) => ({ id, title: t.track.title, deletedAt: t.deletedAt, counts: trackCounts(t.track) }))
        .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
      return json(res, 200, { items });
    }
    if (path === "/api/track/restore" && req.method === "POST") {
      const { id } = await readBody(req);
      const t = trash[id];
      if (!t) return json(res, 404, { error: "não está na lixeira" });
      const newId = tracks[id] ? freeId(id) : id; // se recriaram um tema com o mesmo id, restaura com sufixo
      t.track.id = newId;
      tracks[newId] = t.track; state[newId] = t.state || { done: {}, comments: {}, review: {} };
      delete trash[id];
      await Promise.all([saveTracks(), saveState(), saveTrash()]);
      return json(res, 200, { ok: true, id: newId });
    }
    if (path === "/api/trash/purge" && req.method === "POST") {
      const { id } = await readBody(req);
      if (id) delete trash[id]; else trash = {};
      await saveTrash();
      return json(res, 200, { ok: true });
    }
    if (path === "/api/review") return json(res, 200, globalReview());
    if (path === "/api/stats") return json(res, 200, computeStats());
    if (path === "/api/track/target" && req.method === "POST") {
      const { id, date } = await readBody(req);
      if (!tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "data inválida (use YYYY-MM-DD)" });
      if (date) tracks[id].targetDate = date; else delete tracks[id].targetDate;
      await saveTracks();
      return json(res, 200, { ok: true });
    }

    // ações por task (validam trackId + taskId)
    if (path.startsWith("/api/task/") && req.method === "POST") {
      const body = await readBody(req);
      const { trackId, taskId } = body;
      const track = tracks[trackId];
      if (!track || !taskIdsOf(track).has(taskId)) return json(res, 400, { error: "trackId/taskId inválido" });
      const s = tState(trackId);
      if (path === "/api/task/done") {
        if (body.done) { s.done[taskId] = new Date().toISOString(); if (!s.review[taskId]) seedReview(s, taskId, null, track.targetDate); }
        else { delete s.done[taskId]; delete s.review[taskId]; }
      } else if (path === "/api/task/comment") {
        const text = (body.text || "").trim();
        if (!text) return json(res, 400, { error: "texto obrigatório" });
        (s.comments[taskId] ||= []).push({ text, at: new Date().toISOString(), author: me });
      } else if (path === "/api/task/comment/delete") {
        const arr = s.comments[taskId] || [];
        const c = arr[body.index];
        if (!c || (body.at && c.at !== body.at)) return json(res, 409, { error: "comentário não encontrado" });
        arr.splice(body.index, 1);
      } else if (path === "/api/task/review") {
        const rv = s.review[taskId];
        if (!rv) return json(res, 409, { error: "task não está na fila" });
        if (body.result !== "pass" && body.result !== "fail") return json(res, 400, { error: "result pass|fail" });
        const today = spDay();
        if (body.result === "fail") { rv.box = 0; rv.last = today; rv.next = clampNext(addDays(today, REVIEW_LADDER[0]), track.targetDate); }
        else { const nb = rv.box + 1; rv.last = today; if (nb >= REVIEW_LADDER.length) { rv.box = REVIEW_LADDER.length; rv.next = null; } else { rv.box = nb; rv.next = clampNext(addDays(today, REVIEW_LADDER[nb]), track.targetDate); } }
      } else return json(res, 404, { error: "rota inválida" });
      if (path === "/api/task/done" || path === "/api/task/review") markActive(); // conta o dia pro streak
      await saveState();
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: "rota inválida" });
  } catch (e) {
    console.error("[erro]", e);
    return json(res, 500, { error: "erro interno" });
  }
});
server.listen(PORT, HOST, () => console.log(`theme-studies em http://${HOST}:${PORT}`));
