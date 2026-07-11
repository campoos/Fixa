import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";
import { createHmac, timingSafeEqual, scrypt, randomBytes } from "node:crypto";
import { validateTrack, trackCounts } from "./study-schema.js";
import { buildPrompt } from "./prompt-template.js";
import { REVIEW_LADDER, spDay, addDays, daysBetween, isGraduated, seedEntry, gradeEntry } from "./review-engine.js";

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
// geração direta (opcional): Gemini Flash — sem key o app segue 100% funcional no fluxo manual
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEN_ENABLED = Boolean(GEMINI_API_KEY);
const SSO_SECRET = process.env.SSO_SECRET || "dev-secret-troca-em-prod";
const APP_PASS = process.env.APP_PASS || "estudar";       // senha da conta fundadora (bootstrap)
const APP_USER = process.env.APP_USER || "João";           // nome da conta fundadora
const FOUNDER_EMAIL = (process.env.FOUNDER_EMAIL || "joao@fixa.app").toLowerCase();
const FREE_THEME_LIMIT = Number(process.env.FREE_THEME_LIMIT || 2); // plano free: nº máx de temas
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

// ---- usuários (multiusuário; senha com scrypt nativo) ----
let users = (await kv.get("users")) || {}; // emailLower -> { id, email, name, hash, salt, plan, createdAt }
const saveUsers = () => kv.set("users", users).catch((e) => console.error("[users]", e.message));
const userById = (id) => Object.values(users).find((u) => u.id === id) || null;
const hashPass = (pass, salt) => new Promise((resolve, reject) => scrypt(String(pass), salt, 64, (e, k) => (e ? reject(e) : resolve(k.toString("hex")))));
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
async function createUser(email, name, pass, plan = "free") {
  const salt = randomBytes(16).toString("hex");
  const hash = await hashPass(pass, salt);
  const u = { id: "u_" + randomBytes(8).toString("hex"), email, name, hash, salt, plan, createdAt: new Date().toISOString() };
  users[email] = u;
  await saveUsers();
  return u;
}
async function checkPass(u, pass) {
  const h = await hashPass(pass, u.salt);
  try { return timingSafeEqual(Buffer.from(h), Buffer.from(u.hash)); } catch { return false; }
}

// ---- dados por usuário (tracks/state/trash/activity) ----
const dataCache = new Map(); // uid -> { tracks, state, trash, activity }
async function udata(uid) {
  if (!dataCache.has(uid)) {
    const [tracks, state, trash, activity] = await Promise.all([
      kv.get(`u:${uid}:tracks`), kv.get(`u:${uid}:state`), kv.get(`u:${uid}:trash`), kv.get(`u:${uid}:activity`),
    ]);
    let act = activity || {};
    if (Array.isArray(act)) act = Object.fromEntries(act.map((d) => [d, 1])); // formato antigo
    dataCache.set(uid, { tracks: tracks || {}, state: state || {}, trash: trash || {}, activity: act });
  }
  return dataCache.get(uid);
}
const saveU = (uid, part) => kv.set(`u:${uid}:${part}`, dataCache.get(uid)[part]).catch((e) => console.error(`[u:${part}]`, e.message));

// ---- bootstrap: conta fundadora + migração do estado single-user antigo ----
if (!Object.keys(users).length) {
  const founder = await createUser(FOUNDER_EMAIL, APP_USER, APP_PASS, "pro");
  const legacy = await kv.get("theme:tracks");
  if (legacy && Object.keys(legacy).length) {
    const [st, tr, ac] = await Promise.all([kv.get("theme:state"), kv.get("theme:trash"), kv.get("theme:activity")]);
    await Promise.all([
      kv.set(`u:${founder.id}:tracks`, legacy),
      kv.set(`u:${founder.id}:state`, st || {}),
      kv.set(`u:${founder.id}:trash`, tr || {}),
      kv.set(`u:${founder.id}:activity`, Array.isArray(ac) ? Object.fromEntries(ac.map((d) => [d, 1])) : (ac || {})),
    ]);
    console.log(`[bootstrap] estado single-user migrado pra conta fundadora ${FOUNDER_EMAIL}`);
  }
  console.log(`[bootstrap] conta fundadora criada: ${FOUNDER_EMAIL} (plano pro)`);
}

// ---- helpers de domínio (operam no ud do usuário) ----
const freeId = (ud, base) => { let id = base, n = 2; while (ud.tracks[id]) id = `${base}-${n++}`; return id; };
function tState(ud, id) {
  const s = ud.state[id] || (ud.state[id] = { done: {}, comments: {}, review: {} });
  s.done ||= {}; s.comments ||= {}; s.review ||= {};
  return s;
}
const taskIdsOf = (track) => {
  const set = new Set();
  for (const e of track.epics) for (const st of e.stories) for (const t of st.tasks) set.add(t.id);
  return set;
};
function seedReview(s, id, fromDay, targetDate) {
  s.review[id] = seedEntry(fromDay, targetDate);
}
function markActive(ud, uid) {
  const d = spDay();
  ud.activity[d] = (ud.activity[d] || 0) + 1;
  saveU(uid, "activity");
}
function computeStreak(ud) {
  let s = 0, d = spDay();
  if (!ud.activity[d]) d = addDays(d, -1); // hoje ainda não estudou? conta a partir de ontem
  while (ud.activity[d]) { s++; d = addDays(d, -1); }
  return s;
}
function computeStats(ud) {
  let tasksDone = 0, mastered = 0, tasksTotal = 0;
  for (const id of Object.keys(ud.tracks)) {
    const s = tState(ud, id);
    for (const e of ud.tracks[id].epics) for (const st of e.stories) for (const t of st.tasks) {
      tasksTotal++;
      if (s.done[t.id]) tasksDone++;
      const rv = s.review[t.id];
      if (rv && isGraduated(rv)) mastered++;
    }
  }
  // heatmap: últimos 119 dias (17 semanas)
  const days = [];
  let d = addDays(spDay(), -118);
  for (let i = 0; i < 119; i++) { days.push({ day: d, count: ud.activity[d] || 0 }); d = addDays(d, 1); }
  return { streak: computeStreak(ud), dueToday: globalReview(ud).due.length, themes: Object.keys(ud.tracks).length, tasksDone, tasksTotal, mastered, days };
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
function buildTrack(ud, id) {
  const track = ud.tracks[id];
  if (!track) return null;
  const s = tState(ud, id);
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
function trackSummary(ud, id) {
  const t = buildTrack(ud, id);
  return { id, title: t.title, summary: t.summary, progress: t.progress, mastery: t.mastery, due: t.review.due.length, targetDate: t.targetDate, daysLeft: t.daysLeft, counts: trackCounts(ud.tracks[id]) };
}
function globalReview(ud) {
  const today = spDay();
  const due = [];
  for (const id of Object.keys(ud.tracks)) {
    const s = tState(ud, id);
    for (const e of ud.tracks[id].epics) for (const st of e.stories) for (const t of st.tasks) {
      const rv = s.review[t.id];
      if (rv && !isGraduated(rv) && rv.next && rv.next <= today)
        due.push({ trackId: id, trackTitle: ud.tracks[id].title, id: t.id, title: t.title, sample: t.sample, type: t.type, epic: e.title, story: st.title, box: rv.box, next: rv.next });
    }
  }
  due.sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : 0));
  return { due, ladder: REVIEW_LADDER };
}

// ---- sessão (cookie assinado; payload = id do usuário) ----
const b64u = (s) => Buffer.from(s).toString("base64url");
const TTL = 30 * 86400 * 1000;
function sign(uid) {
  const p = b64u(JSON.stringify({ u: uid, e: Date.now() + TTL }));
  return p + "." + createHmac("sha256", SSO_SECRET).update(p).digest("base64url");
}
function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [p, sig] = token.split(".");
  const exp = createHmac("sha256", SSO_SECRET).update(p).digest("base64url");
  try { if (sig.length !== exp.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null; } catch { return null; }
  let d; try { d = JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
  if (!d || !d.u || !d.e || Date.now() > d.e) return null;
  return d.u;
}
function sessionUser(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)ts_sess=([^;]+)/);
  const uid = m ? verify(m[1]) : null;
  return uid ? userById(uid) : null;
}
const setSession = (res, code, uid, body) => {
  res.writeHead(code, { "Content-Type": "application/json", "Set-Cookie": `ts_sess=${sign(uid)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000` });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { res(JSON.parse(b || "{}")); } catch { res({}); } }); });

// ---- estático (SPA + landing pública na raiz) ----
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
async function serveStatic(url, res, authed) {
  let p = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  // visitante deslogado na raiz vê a landing; logado cai no app
  if (p === "/" && !authed) p = "/fixa.html";
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
    if (!path.startsWith("/api/")) return serveStatic(url, res, Boolean(sessionUser(req)));

    if (path === "/api/health") return json(res, 200, { ok: true });
    if (path === "/api/signup" && req.method === "POST") {
      const { name, email, pass } = await readBody(req);
      const em = String(email || "").trim().toLowerCase();
      if (!String(name || "").trim()) return json(res, 400, { error: "nome obrigatório" });
      if (!validEmail(em)) return json(res, 400, { error: "e-mail inválido" });
      if (String(pass || "").length < 6) return json(res, 400, { error: "senha precisa de 6+ caracteres" });
      if (users[em]) return json(res, 409, { error: "já existe conta com esse e-mail — faça login" });
      const u = await createUser(em, String(name).trim(), pass, "free");
      return setSession(res, 200, u.id, { name: u.name, email: u.email, plan: u.plan });
    }
    if (path === "/api/login" && req.method === "POST") {
      const { email, pass } = await readBody(req);
      const em = String(email || "").trim().toLowerCase();
      const u = users[em];
      if (!u || !(await checkPass(u, pass || ""))) return json(res, 401, { error: "e-mail ou senha inválidos" });
      return setSession(res, 200, u.id, { name: u.name, email: u.email, plan: u.plan });
    }
    if (path === "/api/logout") { res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "ts_sess=; HttpOnly; Path=/; Max-Age=0" }); return res.end("{}"); }
    // waitlist pública da landing
    if (path === "/api/waitlist" && req.method === "POST") {
      const { email } = await readBody(req);
      const em = String(email || "").trim().toLowerCase();
      if (!validEmail(em)) return json(res, 400, { error: "e-mail inválido" });
      const list = (await kv.get("waitlist")) || [];
      if (!list.some((x) => x.email === em)) {
        if (list.length >= 5000) return json(res, 429, { error: "lista cheia" });
        list.push({ email: em, at: new Date().toISOString() });
        await kv.set("waitlist", list);
      }
      return json(res, 200, { ok: true });
    }

    // daqui pra baixo exige sessão
    const me = sessionUser(req);
    if (!me) return json(res, 401, { error: "login requerido" });
    const ud = await udata(me.id);
    const isPro = me.plan === "pro";

    if (path === "/api/me") return json(res, 200, { name: me.name, email: me.email, plan: me.plan });
    if (path === "/api/config") return json(res, 200, { genEnabled: GEN_ENABLED, plan: me.plan, freeLimit: FREE_THEME_LIMIT, themes: Object.keys(ud.tracks).length });
    // geração direta: monta o prompt, chama o Gemini, valida e importa — 1 clique (Pro)
    if (path === "/api/generate" && req.method === "POST") {
      if (!GEN_ENABLED) return json(res, 400, { error: "geração direta não configurada (GEMINI_API_KEY)" });
      if (!isPro) return json(res, 402, { error: "geração direta é do plano Pro — use o fluxo manual (grátis) abaixo" });
      const { theme, level, mode, depth } = await readBody(req);
      if (!theme || !String(theme).trim()) return json(res, 400, { error: "tema obrigatório" });
      const prompt = buildPrompt({ theme, level, mode, depth });
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 120000);
      let text = "";
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
          signal: ac.signal,
        });
        if (r.status === 429) return json(res, 429, { error: "limite do Gemini atingido — tenta de novo em instantes ou usa o fluxo manual" });
        if (!r.ok) return json(res, 502, { error: `Gemini respondeu ${r.status}` });
        const d = await r.json();
        text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
      } catch (e) {
        return json(res, 502, { error: e.name === "AbortError" ? "geração demorou demais (timeout) — tenta de novo" : `falha ao chamar o Gemini: ${e.message}` });
      } finally { clearTimeout(timer); }
      if (!text.trim()) return json(res, 502, { error: "Gemini devolveu vazio — tenta de novo" });
      // remove cercas de markdown se vierem, e valida
      const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const v = validateTrack(cleaned);
      if (!v.ok) return json(res, 422, { error: "o conteúdo gerado veio fora do formato — tenta de novo ou usa o fluxo manual", errors: v.errors.slice(0, 8) });
      const id = freeId(ud, v.track.id);
      v.track.id = id;
      v.track.createdAt = new Date().toISOString();
      v.track.generatedBy = GEMINI_MODEL;
      ud.tracks[id] = v.track;
      tState(ud, id);
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state")]);
      return json(res, 200, { ok: true, id, title: v.track.title, counts: trackCounts(v.track) });
    }
    if (path === "/api/import/prompt") {
      const prompt = buildPrompt({ theme: url.searchParams.get("theme") || "", level: url.searchParams.get("level") || undefined, mode: url.searchParams.get("mode") || undefined, depth: url.searchParams.get("depth") || undefined });
      return json(res, 200, { prompt });
    }
    if (path === "/api/import" && req.method === "POST") {
      if (!isPro && Object.keys(ud.tracks).length >= FREE_THEME_LIMIT)
        return json(res, 402, { error: `plano free vai até ${FREE_THEME_LIMIT} temas — exclua um tema ou aguarde o Pro` });
      const { json: raw } = await readBody(req);
      const v = validateTrack(raw);
      if (!v.ok) return json(res, 400, { ok: false, errors: v.errors });
      const id = freeId(ud, v.track.id);
      v.track.id = id;
      v.track.createdAt = new Date().toISOString();
      ud.tracks[id] = v.track;
      tState(ud, id);
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state")]);
      return json(res, 200, { ok: true, id, title: v.track.title, counts: trackCounts(v.track) });
    }
    if (path === "/api/tracks") return json(res, 200, { tracks: Object.keys(ud.tracks).map((id) => trackSummary(ud, id)) });
    if (path === "/api/track") { const t = buildTrack(ud, url.searchParams.get("id")); return t ? json(res, 200, t) : json(res, 404, { error: "tema não encontrado" }); }
    if (path === "/api/track/delete" && req.method === "POST") {
      const { id } = await readBody(req);
      if (!ud.tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      // soft-delete: vai pra lixeira (reversível), não some
      ud.trash[id] = { track: ud.tracks[id], state: ud.state[id] || { done: {}, comments: {}, review: {} }, deletedAt: new Date().toISOString() };
      delete ud.tracks[id]; delete ud.state[id];
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state"), saveU(me.id, "trash")]);
      return json(res, 200, { ok: true });
    }
    if (path === "/api/trash") {
      const items = Object.entries(ud.trash).map(([id, t]) => ({ id, title: t.track.title, deletedAt: t.deletedAt, counts: trackCounts(t.track) }))
        .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
      return json(res, 200, { items });
    }
    if (path === "/api/track/restore" && req.method === "POST") {
      const { id } = await readBody(req);
      const t = ud.trash[id];
      if (!t) return json(res, 404, { error: "não está na lixeira" });
      const newId = ud.tracks[id] ? freeId(ud, id) : id; // se recriaram um tema com o mesmo id, restaura com sufixo
      t.track.id = newId;
      ud.tracks[newId] = t.track; ud.state[newId] = t.state || { done: {}, comments: {}, review: {} };
      delete ud.trash[id];
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state"), saveU(me.id, "trash")]);
      return json(res, 200, { ok: true, id: newId });
    }
    if (path === "/api/trash/purge" && req.method === "POST") {
      const { id } = await readBody(req);
      if (id) delete ud.trash[id]; else ud.trash = {};
      await saveU(me.id, "trash");
      return json(res, 200, { ok: true });
    }
    if (path === "/api/review") return json(res, 200, globalReview(ud));
    if (path === "/api/stats") return json(res, 200, computeStats(ud));
    if (path === "/api/track/target" && req.method === "POST") {
      const { id, date } = await readBody(req);
      if (!ud.tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "data inválida (use YYYY-MM-DD)" });
      if (date) ud.tracks[id].targetDate = date; else delete ud.tracks[id].targetDate;
      await saveU(me.id, "tracks");
      return json(res, 200, { ok: true });
    }
    if (path === "/api/track/rename" && req.method === "POST") {
      const { id, title, summary } = await readBody(req);
      if (!ud.tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      if (title && String(title).trim()) ud.tracks[id].title = String(title).trim();
      if (summary !== undefined) ud.tracks[id].summary = String(summary || "").trim();
      await saveU(me.id, "tracks");
      return json(res, 200, { ok: true });
    }
    // edita campos de uma task (whitelist por tipo)
    if (path === "/api/task/edit" && req.method === "POST") {
      const { trackId, taskId, patch } = await readBody(req);
      const track = ud.tracks[trackId];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      let target = null;
      for (const e of track.epics) for (const st of e.stories) for (const t of st.tasks) if (t.id === taskId) target = t;
      if (!target) return json(res, 404, { error: "task não encontrada" });
      const p = patch || {};
      const setStr = (k) => { if (typeof p[k] === "string" && p[k].trim()) target[k] = p[k].trim(); };
      const setStrOpt = (k) => { if (k in p) target[k] = typeof p[k] === "string" && p[k].trim() ? p[k].trim() : null; };
      setStr("title"); setStr("objective");
      if (p.sample && typeof p.sample.q === "string" && typeof p.sample.a === "string" && p.sample.q.trim() && p.sample.a.trim())
        target.sample = { q: p.sample.q.trim(), a: p.sample.a.trim() };
      if (target.type === "theory") {
        if (Array.isArray(p.keyPoints)) target.keyPoints = p.keyPoints.map((s) => String(s).trim()).filter(Boolean);
      } else {
        if (Array.isArray(p.steps)) { const st = p.steps.map((s) => String(s).trim()).filter(Boolean); if (st.length) target.steps = st; }
        setStr("expected"); setStrOpt("hint"); setStrOpt("snippet"); setStrOpt("language");
      }
      await saveU(me.id, "tracks");
      return json(res, 200, { ok: true });
    }
    // remove uma task (ids das demais ficam estáveis; estado da task some junto)
    if (path === "/api/task/remove" && req.method === "POST") {
      const { trackId, taskId } = await readBody(req);
      const track = ud.tracks[trackId];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      let removed = false;
      for (const e of track.epics) for (const st of e.stories) {
        const i = st.tasks.findIndex((t) => t.id === taskId);
        if (i >= 0) { st.tasks.splice(i, 1); removed = true; }
      }
      if (!removed) return json(res, 404, { error: "task não encontrada" });
      // poda stories/epics vazios
      for (const e of track.epics) e.stories = e.stories.filter((st) => st.tasks.length);
      track.epics = track.epics.filter((e) => e.stories.length);
      if (!track.epics.length) return json(res, 400, { error: "não dá pra remover a última task do tema — exclua o tema" });
      const s = tState(ud, trackId);
      delete s.done[taskId]; delete s.comments[taskId]; delete s.review[taskId];
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state")]);
      return json(res, 200, { ok: true });
    }
    // anexa epics novos (JSON no mesmo shape do import, só a parte de epics) — renumera a partir do fim
    if (path === "/api/track/append" && req.method === "POST") {
      const { id, json: raw } = await readBody(req);
      const track = ud.tracks[id];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      let data = raw;
      if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return json(res, 400, { ok: false, errors: [`JSON inválido: ${e.message}`] }); } }
      if (data && typeof data === "object" && !data.title) data = { ...data, title: track.title }; // título é ignorado no append
      const v = validateTrack(data);
      if (!v.ok) return json(res, 400, { ok: false, errors: v.errors });
      const base = track.epics.length;
      const renumbered = v.track.epics.map((e, ei) => {
        const en = base + ei + 1;
        return { ...e, id: `${en}`, stories: e.stories.map((st, si) => ({ ...st, id: `${en}.${si + 1}`, tasks: st.tasks.map((t, ti) => ({ ...t, id: `${en}.${si + 1}.${ti + 1}` })) })) };
      });
      track.epics.push(...renumbered);
      await saveU(me.id, "tracks");
      return json(res, 200, { ok: true, added: trackCounts({ epics: renumbered }) });
    }

    // ações por task (validam trackId + taskId)
    if (path.startsWith("/api/task/") && req.method === "POST") {
      const body = await readBody(req);
      const { trackId, taskId } = body;
      const track = ud.tracks[trackId];
      if (!track || !taskIdsOf(track).has(taskId)) return json(res, 400, { error: "trackId/taskId inválido" });
      const s = tState(ud, trackId);
      if (path === "/api/task/done") {
        if (body.done) { s.done[taskId] = new Date().toISOString(); if (!s.review[taskId]) seedReview(s, taskId, null, track.targetDate); }
        else { delete s.done[taskId]; delete s.review[taskId]; }
      } else if (path === "/api/task/comment") {
        const text = (body.text || "").trim();
        if (!text) return json(res, 400, { error: "texto obrigatório" });
        (s.comments[taskId] ||= []).push({ text, at: new Date().toISOString(), author: me.name });
      } else if (path === "/api/task/comment/delete") {
        const arr = s.comments[taskId] || [];
        const c = arr[body.index];
        if (!c || (body.at && c.at !== body.at)) return json(res, 409, { error: "comentário não encontrado" });
        arr.splice(body.index, 1);
      } else if (path === "/api/task/review") {
        const rv = s.review[taskId];
        if (!rv) return json(res, 409, { error: "task não está na fila" });
        if (body.result !== "pass" && body.result !== "fail") return json(res, 400, { error: "result pass|fail" });
        s.review[taskId] = gradeEntry(rv, body.result, spDay(), track.targetDate);
      } else return json(res, 404, { error: "rota inválida" });
      if (path === "/api/task/done" || path === "/api/task/review") markActive(ud, me.id); // conta o dia pro streak
      await saveU(me.id, "state");
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: "rota inválida" });
  } catch (e) {
    console.error("[erro]", e);
    return json(res, 500, { error: "erro interno" });
  }
});
server.listen(PORT, HOST, () => console.log(`fixa em http://${HOST}:${PORT}`));
