import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";
import { createHmac, timingSafeEqual, scrypt, randomBytes } from "node:crypto";
import { validateTrack, trackCounts } from "./study-schema.js";
import { buildPrompt } from "./prompt-template.js";
import { buildTutorPrompt } from "./prompt-tutor.js";
import { REVIEW_LADDER, REVIEW_DOSE, spDay, addDays, daysBetween, isGraduated, seedEntry, gradeEntry, planSession } from "./review-engine.js";
import { buildReminder, reminderCadence, daysInactive } from "./reminders.js";
import { emailEnabled, sendEmail, emailShell, emailButton } from "./email.js";

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
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest"; // alias evergreen (2.5-flash 404 pra keys novas)
// quando o principal está em "high demand" (503 que demora 70s pra chegar), o lite responde em ~1s
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
const GEN_ENABLED = Boolean(GEMINI_API_KEY);
const SSO_SECRET = process.env.SSO_SECRET || "dev-secret-troca-em-prod";
const APP_PASS = process.env.APP_PASS || "estudar";       // senha da conta fundadora (bootstrap)
const APP_USER = process.env.APP_USER || "João";           // nome da conta fundadora
const FOUNDER_EMAIL = (process.env.FOUNDER_EMAIL || "joao@fixa.app").toLowerCase();
const FREE_THEME_LIMIT = Number(process.env.FREE_THEME_LIMIT || 2); // plano free: nº máx de temas
const BASE_URL = (process.env.PUBLIC_URL || process.env.BASE_URL || "https://fixa-hbn1.onrender.com").replace(/\/+$/, "");
// impressão digital da chave de upload (android/android.keystore, alias fixa) — a do Play
// App Signing entra depois por ANDROID_CERT_FINGERPRINTS, sem novo deploy de código
const ANDROID_CERT_FALLBACK = "7D:0E:A7:FE:AE:D5:3E:FF:57:81:66:B8:57:8A:A5:92:BE:AD:CB:08:FF:38:03:1C:BA:08:6D:5C:5B:92:2C:AF";
// billing (Mercado Pago Assinaturas) — env-gated: sem credenciais, o /pro segue com a lista de espera
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_PLAN_ID = process.env.MP_PLAN_ID || "";
const BILLING_ENABLED = Boolean(MP_ACCESS_TOKEN && MP_PLAN_ID);
const CRON_SECRET = process.env.CRON_SECRET || "";
// limites de geração por IA (PRICING.md): free = 1 degustação lifetime; pro = fair use 30/mês, máx 10/dia
const GEN_FREE_LIFETIME = Number(process.env.GEN_FREE_LIFETIME || 1);
const GEN_PRO_MONTH = Number(process.env.GEN_PRO_MONTH || 30);
const GEN_PRO_DAY = Number(process.env.GEN_PRO_DAY || 10);
// correção do Tutor (DESIGN-TUTOR-IA §6): free = degustação lifetime; pro = fair use mensal
const TUTOR_FREE_LIFETIME = Number(process.env.TUTOR_FREE_LIFETIME || 5);
const TUTOR_PRO_MONTH = Number(process.env.TUTOR_PRO_MONTH || 100);
// a Lição tem SEMPRE 3 envios (método do dono): fria → com o contexto → final. v3 marca o contrato novo.
const LESSON_STAGES = 3;
// set curado de ícones de tema — DEVE espelhar TRACK_ICON_LIST do front (docs/DESIGN-TEMA-ICONE §1)
const TRACK_ICONS = new Set(["target","book-open","book-marked","library","notebook-pen","brain","puzzle","blocks","code","terminal","braces","database","server","cpu","bug","git-branch","atom","microscope","telescope","dna","calculator","sigma","chart-line","cloud","stethoscope","heart-pulse","pill","scale","gavel","landmark","scroll-text","shield","briefcase","coins","banknote","trending-up","languages","globe","map","compass","hourglass","palette","music","guitar","camera","film","drama","dumbbell","bike","trophy","medal","chef-hat","utensils-crossed","coffee","mountain","tree-pine","sprout","paw-print","wrench","rocket","zap","plane","car","award"]);
const DIST = join(__dirname, "web", "dist");

// chamada ao Gemini com retry + fallback de modelo: a 1ª tentativa usa o principal; se ele está
// sobrecarregado (503/429/timeout — visto em prod 13/07: 70s pra devolver 503), as seguintes caem
// pro lite, que responde em ~1s. 4xx de request (400/404) não se repetem.
async function callGemini(prompt, { temperature = 0.4, timeoutMs = 60000, tries = 3 } = {}) {
  const models = [GEMINI_MODEL];
  if (GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL) models.push(GEMINI_FALLBACK_MODEL);
  let last = { status: 0, error: "sem tentativa" };
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise((ok) => setTimeout(ok, 500 * i));
    const model = models[Math.min(i, models.length - 1)];
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature } }),
        signal: ac.signal,
      });
      if (!r.ok) { last = { status: r.status, error: `Gemini respondeu ${r.status}` }; if (r.status >= 500 || r.status === 429) continue; return { ok: false, status: r.status, error: last.error }; }
      const d = await r.json();
      const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
      if (!text.trim()) { last = { status: 502, error: "Gemini devolveu vazio" }; continue; }
      return { ok: true, text, model };
    } catch (e) {
      last = e.name === "AbortError" ? { status: 504, error: "timeout" } : { status: 502, error: `falha ao chamar o Gemini: ${e.message}` };
    } finally { clearTimeout(timer); }
  }
  return { ok: false, status: last.status || 502, error: last.error };
}

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
  async incr(key) {
    if (UPSTASH_URL) { await this._cmd(["INCR", key]); return; }
    const run = async () => {
      let all = {}; try { all = JSON.parse(await readFile(KV_FILE, "utf8")); } catch { /* primeiro */ }
      all[key] = (all[key] || 0) + 1; await writeFile(KV_FILE, JSON.stringify(all, null, 2));
    };
    this._writeQ = this._writeQ.then(run, run);
    return this._writeQ;
  },
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
const saveU = (uid, part) => kv.set(`u:${uid}:${part}`, dataCache.get(uid)[part]); // rejeita em falha (QA #7) — endpoints de escrita respondem 500 em vez de fingir ok

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

// ---- geração por IA: uso e limites por usuário ----
function genUsage(u) {
  if (u.plan === "pro") {
    const day = spDay(), ym = day.slice(0, 7);
    const used = u.genMonth && u.genMonth.ym === ym ? u.genMonth.count : 0;
    const dayUsed = u.genDay && u.genDay.day === day ? u.genDay.count : 0;
    return { used, limit: GEN_PRO_MONTH, dayUsed, dayLimit: GEN_PRO_DAY };
  }
  return { used: u.genTotal || 0, limit: GEN_FREE_LIFETIME };
}
function tutorUsage(u) {
  if (u.plan === "pro") {
    const ym = spDay().slice(0, 7);
    const used = u.tutorMonth && u.tutorMonth.ym === ym ? u.tutorMonth.count : 0;
    return { used, limit: TUTOR_PRO_MONTH };
  }
  return { used: u.tutorTotal || 0, limit: TUTOR_FREE_LIFETIME };
}
function bumpTutor(u) {
  const ym = spDay().slice(0, 7);
  u.tutorTotal = (u.tutorTotal || 0) + 1;
  u.tutorMonth = u.tutorMonth && u.tutorMonth.ym === ym ? { ym, count: u.tutorMonth.count + 1 } : { ym, count: 1 };
  saveUsers();
}
// incrementa contadores — chamar SÓ quando a geração importou um tema com sucesso
function bumpGen(u) {
  const day = spDay(), ym = day.slice(0, 7);
  u.genTotal = (u.genTotal || 0) + 1;
  u.genMonth = u.genMonth && u.genMonth.ym === ym ? { ym, count: u.genMonth.count + 1 } : { ym, count: 1 };
  u.genDay = u.genDay && u.genDay.day === day ? { day, count: u.genDay.count + 1 } : { day, count: 1 };
  saveUsers();
}

// ---- helpers de domínio (operam no ud do usuário) ----
const freeId = (ud, base) => { let id = base, n = 2; while (ud.tracks[id]) id = `${base}-${n++}`; return id; };
function tState(ud, id) {
  const s = ud.state[id] || (ud.state[id] = { done: {}, comments: {}, review: {} });
  s.done ||= {}; s.comments ||= {}; s.review ||= {};
  s.lesson ||= {}; // taskId -> { stage, answers[], updatedAt } (a Lição — DESIGN-LICAO-UX)
  s.tutor ||= {};  // taskId -> { nota, veredito, acertos[], gaps[], dica, at }
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
  saveU(uid, "activity").catch((e) => console.error("[activity]", e.message)); // fire-and-forget consciente
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
  // heatmap: 52 semanas — do domingo da semana de 51 semanas atrás até hoje (alinha a grade dom→sáb do front)
  const days = [];
  const today = spDay();
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=dom … 6=sáb (dia de calendário, sem fuso)
  let d = addDays(today, -(51 * 7 + dow)); // sempre um domingo ⇒ coluna 52 = semana corrente (parcial)
  while (d <= today) { days.push({ day: d, count: ud.activity[d] || 0 }); d = addDays(d, 1); }
  const gr = globalReview(ud);
  return { streak: computeStreak(ud), dueToday: gr.due.length, doseToday: gr.session.length, dueMode: gr.mode, themes: Object.keys(ud.tracks).length, tasksDone, tasksTotal, mastered, days };
}

// ---- montagem ----
// migra lição de prática do contrato antigo (2 envios, material visível desde o início) pro atual (3):
// a resposta antiga já era "com o contexto" → vira answers[1]; a fria fica em branco. Idempotente via flag v3.
function migrateLesson(task, s, taskId) {
  const cur = s.lesson && s.lesson[taskId];
  if (!cur || cur.v3) return cur;
  if (task.type === "practice" && cur.stage > 0 && cur.stage <= 2) { cur.answers.unshift(""); cur.stage += 1; }
  cur.v3 = true;
  return cur;
}

function taskWithState(t, s, epicTitle, storyTitle, today, dueBucket, trackId) {
  migrateLesson(t, s, t.id);
  const done = !!s.done[t.id];
  const rv = s.review[t.id];
  let review = null;
  if (rv) {
    const graduated = isGraduated(rv);
    const due = !graduated && !!rv.next && rv.next <= today;
    review = { box: rv.box, next: rv.next, graduated, due, ladder: REVIEW_LADDER.length };
    if (due && dueBucket) dueBucket.push({ trackId, id: t.id, title: t.title, sample: t.sample, type: t.type, epic: epicTitle, story: storyTitle, box: rv.box, next: rv.next });
  }
  const lesson = s.lesson && s.lesson[t.id] ? s.lesson[t.id] : null;
  const tutor = s.tutor && s.tutor[t.id] ? s.tutor[t.id] : null;
  return { ...t, done, completedAt: s.done[t.id] || null, comments: s.comments[t.id] || [], review, lesson, tutor };
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
  return { id, title: track.title, summary: track.summary, icon: track.icon ?? null, epics, progress: { done: dn, total }, mastery, targetDate, daysLeft, dailyGoal, review: { due, ladder: REVIEW_LADDER } };
}
function trackSummary(ud, id) {
  const t = buildTrack(ud, id);
  return { id, title: t.title, summary: t.summary, icon: t.icon, progress: t.progress, mastery: t.mastery, due: t.review.due.length, targetDate: t.targetDate, daysLeft: t.daysLeft, counts: trackCounts(ud.tracks[id]) };
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
  // menor prazo de prova entre os temas COM item na fila — decide o modo "prova" do plano
  let minDaysLeft = null;
  for (const d of due) {
    const td = ud.tracks[d.trackId]?.targetDate;
    if (!td) continue;
    const left = daysBetween(today, td);
    if (left >= 0 && (minDaysLeft === null || left < minDaysLeft)) minDaysLeft = left;
  }
  const plan = planSession(due, today, minDaysLeft);
  return { due, ladder: REVIEW_LADDER, mode: plan.mode, session: plan.session, rest: plan.rest, daysLeft: minDaysLeft, dose: REVIEW_DOSE };
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
const signUid = (uid) => createHmac("sha256", SSO_SECRET).update(`rem:${uid}`).digest("base64url").slice(0, 22);
function sessionUser(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)ts_sess=([^;]+)/);
  const uid = m ? verify(m[1]) : null;
  return uid ? userById(uid) : null;
}
const setSession = (res, code, uid, body) => {
  res.writeHead(code, { "Content-Type": "application/json", "Set-Cookie": `ts_sess=${sign(uid)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000` });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => { b += c; if (b.length > 262144) { b = ""; req.destroy(); res({}); } }); req.on("end", () => { try { res(JSON.parse(b || "{}")); } catch { res({}); } }); }); // teto 256KB (QA #11)

// ---- estático (SPA + landing pública na raiz) ----
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
// extensões que são arquivo de verdade. O id de task tem ponto ("2.1.1"), então /t/x/l/2.1.1 tem
// "extensão" .1 — sem essa lista o deep link da lição morria em 404 em vez de cair no SPA.
const EXT_ARQUIVO = new Set([...Object.keys(MIME), ".txt", ".xml", ".map", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".woff", ".ttf", ".mp4", ".pdf", ".csv"]);
// utm_source saneado pra chave de contador ([a-z0-9-], máx 24)
const cleanSrc = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
async function serveStatic(url, res, authed) {
  let p = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  // visitante deslogado na raiz vê a landing; logado cai no app
  if (p === "/" && !authed) p = "/fixa.html";
  // política de privacidade: página própria, exigida pela Google Play (URL pública)
  if (p === "/privacidade") p = "/privacidade.html";
  let file = join(DIST, p === "/" ? "index.html" : p);
  if (!file.startsWith(DIST)) file = join(DIST, "index.html");
  try {
    let data = await readFile(file);
    const ext = extname(file);
    // cache na edge (LAUNCH §5): assets hasheados e marca são imutáveis; HTML nunca cacheia
    // sw.js nunca cacheia: com cache longo o app fica preso numa versão velha do service worker
    const cache = p === "/sw.js"
      ? "no-cache"
      : p.startsWith("/assets/") || p.startsWith("/brand/") || p.startsWith("/icons/") || p === "/apple-touch-icon.png"
      ? "public, max-age=31536000, immutable"
      : ext === ".html" || p === "/" ? "no-cache" : "public, max-age=3600";
    if (file.endsWith("privacidade.html")) {
      data = data.toString("utf8").replaceAll("__BASE_URL__", BASE_URL);
    }
    if (file.endsWith("fixa.html")) {
      // landing: og:url/canonical nascem certos pra qualquer domínio (LAUNCH §1) + funil (§2)
      data = data.toString("utf8").replaceAll("__BASE_URL__", BASE_URL);
      const src = cleanSrc(url.searchParams.get("utm_source"));
      const day = spDay();
      kv.incr(`lp:${day}`).catch(() => {});
      if (src) kv.incr(`lp:${day}:src:${src}`).catch(() => {});
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": cache });
    return res.end(data);
  } catch {
    // arquivo com extensão inexistente = 404 de verdade (LAUNCH §6); rota de app cai no SPA
    if (EXT_ARQUIVO.has(extname(p).toLowerCase())) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404"); }
    try { const html = await readFile(join(DIST, "index.html")); res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" }); return res.end(html); }
    catch { res.writeHead(404); return res.end("build ausente — rode: cd web && npm run build"); }
  }
}
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };

// ---- servidor ----
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    // domínio próprio no ar (PUBLIC_URL ≠ onrender): o endereço antigo redireciona 301 —
    // exceto /api/* (health do keep-alive e cron dos lembretes continuam batendo no onrender)
    const host = String(req.headers.host || "");
    if (host.endsWith(".onrender.com") && !BASE_URL.includes(".onrender.com") && !path.startsWith("/api/") && req.method === "GET") {
      res.writeHead(301, { Location: `${BASE_URL}${req.url}` });
      return res.end();
    }
    // Digital Asset Links: prova pro Android que este site e o app br.com.fixaestudos.app
    // são do mesmo dono. Sem isso o TWA abre com a barra do navegador por cima.
    // Aceita várias impressões digitais porque o Play re-assina o app: a chave local
    // (upload) e a que o Google gera no Play App Signing precisam valer as duas.
    if (path === "/.well-known/assetlinks.json") {
      const fps = (process.env.ANDROID_CERT_FINGERPRINTS || ANDROID_CERT_FALLBACK)
        .split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" });
      return res.end(JSON.stringify([{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: process.env.ANDROID_PACKAGE_ID || "br.com.fixaestudos.app", sha256_cert_fingerprints: fps },
      }], null, 2));
    }
    if (path === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" });
      return res.end(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${BASE_URL}/sitemap.xml\n`);
    }
    if (path === "/sitemap.xml") {
      res.writeHead(200, { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" });
      return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${BASE_URL}/</loc></url></urlset>\n`);
    }
    if (!path.startsWith("/api/")) return serveStatic(url, res, Boolean(sessionUser(req)));

    if (path === "/api/health") return json(res, 200, { ok: true });
    // beacon do funil (LAUNCH §2): contadores agregados por dia, sem cookie/UA/IP — LGPD-friendly
    if (path === "/api/e" && req.method === "POST") {
      const n = cleanSrc(url.searchParams.get("n"));
      const src = cleanSrc(url.searchParams.get("src"));
      if (n === "cta") { const day = spDay(); kv.incr(`cta:${day}`).catch(() => {}); if (src) kv.incr(`cta:${day}:src:${src}`).catch(() => {}); }
      res.writeHead(204); return res.end();
    }
    if (path === "/api/signup" && req.method === "POST") {
      const { name, email, pass, src } = await readBody(req);
      const em = String(email || "").trim().toLowerCase();
      if (!String(name || "").trim()) return json(res, 400, { error: "nome obrigatório" });
      if (!validEmail(em)) return json(res, 400, { error: "e-mail inválido" });
      if (String(pass || "").length < 6) return json(res, 400, { error: "senha precisa de 6+ caracteres" });
      if (users[em]) return json(res, 409, { error: "já existe conta com esse e-mail — faça login" });
      const u = await createUser(em, String(name).trim(), pass, "free");
      const source = cleanSrc(src);
      if (source) { u.src = source; saveUsers(); } // atribuição de canal (LAUNCH §2 / CPO #3)
      const day = spDay();
      kv.incr(`signup:${day}`).catch(() => {});
      if (source) kv.incr(`signup:${day}:src:${source}`).catch(() => {});
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
    // recuperação de senha (pública; nunca revela se o e-mail existe)
    if (path === "/api/forgot" && req.method === "POST") {
      if (!emailEnabled()) return json(res, 503, { error: "recuperação por e-mail indisponível no momento" });
      const { email } = await readBody(req);
      const em = String(email || "").trim().toLowerCase();
      const u = users[em];
      if (u) {
        const token = randomBytes(24).toString("base64url");
        await kv.set(`reset:${token}`, { email: em, exp: Date.now() + 3600_000 }); // 1h
        const link = `${BASE_URL}/redefinir?token=${token}`;
        const r = await sendEmail({
          to: em,
          subject: "Redefinir sua senha — Fixa",
          html: emailShell({
            preheader: "O link vale por 1 hora e funciona uma única vez.",
            eyebrow: "redefinir senha",
            title: "Vamos criar uma senha nova.",
            bodyHtml: `<p style="margin:0;font-size:14px;line-height:1.65;color:#5c5480;">Recebemos um pedido pra redefinir a senha da sua conta. O botão abaixo vale por <strong style="font-weight:600;color:#231c39;">1&nbsp;hora</strong> e funciona uma única vez.</p>
${emailButton(link, "Criar nova senha")}
<p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#8b83ab;">Se o botão não abrir, copie e cole este link no navegador:<br><a href="${link}" style="color:#6c47f0;word-break:break-all;">${link}</a></p>
<div style="border-top:1px solid #eeeaf5;padding-top:14px;">
  <p style="margin:0;font-size:12px;line-height:1.6;color:#8b83ab;">Se não foi você, ignore este e-mail — sua senha continua a mesma.</p>
</div>`,
            footnoteHtml: "Você recebeu este e-mail porque alguém pediu a redefinição de senha desta conta.",
          }),
        });
        if (!r.ok) console.error("[forgot] envio falhou:", r.reason, "| link:", link);
      }
      return json(res, 200, { ok: true }); // resposta idêntica com ou sem conta
    }
    if (path === "/api/reset" && req.method === "POST") {
      const { token, pass } = await readBody(req);
      if (String(pass || "").length < 6) return json(res, 400, { error: "senha precisa de 6+ caracteres" });
      const t = token ? await kv.get(`reset:${token}`) : null;
      if (!t || Date.now() > t.exp || !users[t.email]) return json(res, 400, { error: "link inválido ou expirado — peça outro" });
      const u = users[t.email];
      u.salt = randomBytes(16).toString("hex");
      u.hash = await hashPass(pass, u.salt);
      await saveUsers();
      await kv.set(`reset:${token}`, { exp: 0 }); // invalida
      return setSession(res, 200, u.id, { name: u.name, email: u.email, plan: u.plan });
    }
    // webhook do Mercado Pago: confirma/cancela assinatura → plan pro/free
    if (path === "/api/billing/webhook" && req.method === "POST") {
      const body = await readBody(req);
      const preId = body?.data?.id;
      const type = body?.type || body?.action || "";
      if (BILLING_ENABLED && preId && String(type).includes("preapproval")) {
        try {
          const r = await fetch(`https://api.mercadopago.com/preapproval/${preId}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } });
          if (r.ok) {
            const pre = await r.json();
            const u = userById(pre.external_reference) || users[String(pre.payer_email || "").toLowerCase()];
            if (u) {
              const newPlan = pre.status === "authorized" ? "pro" : (["cancelled", "paused"].includes(pre.status) ? "free" : u.plan);
              if (newPlan !== u.plan) {
                u.plan = newPlan;
                u.mpPreapprovalId = pre.id;
                await saveUsers();
                console.log(`[billing] ${u.email} → ${newPlan} (preapproval ${pre.status})`);
              }
            }
          }
        } catch (e) { console.error("[billing] webhook:", e.message); }
      }
      return json(res, 200, { ok: true }); // MP exige 200 sempre
    }
    // cron de lembretes (GitHub Action diária): ?key=CRON_SECRET
    if (path === "/api/cron/reminders") {
      if (!CRON_SECRET || url.searchParams.get("key") !== CRON_SECRET) return json(res, 401, { error: "não autorizado" });
      if (!emailEnabled()) return json(res, 200, { ok: true, sent: 0, reason: "e-mail não configurado" });
      let sent = 0, skipped = 0;
      for (const u of Object.values(users)) {
        if (u.remindersOff) { skipped++; continue; }
        const ud = await udata(u.id);
        const gr = globalReview(ud);
        const due = gr.due.length;
        if (!due) continue;
        const offLink = `${BASE_URL}/api/reminders/off?u=${u.id}&sig=${signUid(u.id)}`;
        // Lembretes v2 (DESIGN-LEMBRETES-V2): cadência derivada da atividade (smart pause honesto)
        // + pool com rotação determinística por (usuário, dia); streak só quando vivo
        const inactive = daysInactive(ud, u.createdAt);
        const cadence = reminderCadence(inactive);
        if (cadence === "silent") { skipped++; continue; }
        const m = buildReminder({
          cadence, mode: gr.mode, n: due, dose: gr.session.length, rest: gr.rest,
          daysLeft: gr.daysLeft, streak: computeStreak(ud), userId: u.id, ymd: spDay(),
        });
        if (!m) { skipped++; continue; }
        const { subject, title, bodyP } = m;
        const r = await sendEmail({
          to: u.email,
          subject,
          html: emailShell({
            preheader: "Revisar no tempo certo é o que faz fixar. Leva poucos minutos.",
            eyebrow: "revisão do dia",
            title,
            bodyHtml: `<p style="margin:0;font-size:14px;line-height:1.65;color:#5c5480;">${bodyP}</p>
${emailButton(`${BASE_URL}/revisar`, "Revisar agora")}
<div style="border-top:1px solid #eeeaf5;padding-top:14px;">
  <p style="margin:0;font-size:12px;line-height:1.6;color:#8b83ab;">Prefere revisar no seu ritmo, sem lembrete? <a href="${offLink}" style="color:#8b83ab;text-decoration:underline;">Parar de receber lembretes</a></p>
</div>`,
            footnoteHtml: "Você recebeu este lembrete porque tem revisões agendadas no Fixa.",
          }),
        });
        if (r.ok) sent++;
      }
      return json(res, 200, { ok: true, sent, skipped });
    }
    // opt-out de lembretes: GET mostra confirmação (scanners de e-mail prefetcham GET — QA #5);
    // só o POST assinado desliga de verdade
    if (path === "/api/reminders/off") {
      const uid = url.searchParams.get("u"), sig = url.searchParams.get("sig");
      const u = uid && sig === signUid(uid) ? userById(uid) : null;
      if (!u) return json(res, 400, { error: "link inválido" });
      if (req.method === "POST") {
        u.remindersOff = true;
        await saveUsers();
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f3fa;color:#1c1533"><div style="text-align:center"><p style="font-weight:600">Lembretes desligados.</p><p style="font-size:14px;color:#5c5480">Você pode continuar revisando em <a href="${BASE_URL}/revisar" style="color:#6c47f0">${BASE_URL.replace("https://", "")}/revisar</a></p></div>`);
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f3fa;color:#1c1533"><form method="POST" action="/api/reminders/off?u=${encodeURIComponent(uid)}&sig=${encodeURIComponent(sig)}" style="text-align:center"><p style="font-weight:600">Parar de receber lembretes?</p><p style="font-size:14px;color:#5c5480">Sua fila continua guardada — só o e-mail diário para.</p><button type="submit" style="margin-top:8px;padding:10px 18px;border:0;border-radius:11px;background:#6c47f0;color:#fff;font-weight:600;cursor:pointer">Parar lembretes</button></form>`);
    }

    // daqui pra baixo exige sessão
    const me = sessionUser(req);
    if (!me) return json(res, 401, { error: "login requerido" });
    const ud = await udata(me.id);
    const isPro = me.plan === "pro";

    if (path === "/api/me") return json(res, 200, { name: me.name, email: me.email, plan: me.plan });
    if (path === "/api/config") return json(res, 200, { genEnabled: GEN_ENABLED, billingEnabled: BILLING_ENABLED, plan: me.plan, freeLimit: FREE_THEME_LIMIT, themes: Object.keys(ud.tracks).length, gen: genUsage(me), tutor: tutorUsage(me) });
    // geração direta: monta o prompt, chama o Gemini, valida e importa — 1 clique
    // free: 1 degustação lifetime · pro: fair use 30/mês + máx 10/dia (PRICING.md)
    if (path === "/api/generate" && req.method === "POST") {
      if (!GEN_ENABLED) return json(res, 400, { error: "geração direta não configurada (GEMINI_API_KEY)" });
      const usage = genUsage(me);
      if (!isPro) {
        if (usage.used >= usage.limit)
          return json(res, 402, { error: "sua geração de degustação já foi usada — o fluxo manual continua grátis e sem limite, e o Pro (em breve) libera 30 gerações por mês" });
        if (Object.keys(ud.tracks).length >= FREE_THEME_LIMIT)
          return json(res, 402, { error: `plano free vai até ${FREE_THEME_LIMIT} temas — exclua um tema pra usar sua geração de degustação` });
      } else {
        if (usage.used >= usage.limit)
          return json(res, 429, { error: `você já usou as ${GEN_PRO_MONTH} gerações deste mês — renova no dia 1º do mês que vem; até lá, o fluxo manual segue liberado` });
        if (usage.dayUsed >= usage.dayLimit)
          return json(res, 429, { error: `você já usou as ${GEN_PRO_DAY} gerações de hoje — amanhã renova; o fluxo manual segue liberado` });
      }
      const { theme, level, mode, depth } = await readBody(req);
      if (!theme || !String(theme).trim()) return json(res, 400, { error: "tema obrigatório" });
      const prompt = buildPrompt({ theme, level, mode, depth });
      // abordagem pedida é contrato: em "só teórico"/"só prático" o gerador às vezes devolve
      // misto. Confere o que voltou e dá UMA segunda chance apontando o desvio, em vez de
      // gravar a trilha errada (a geração só é contabilizada quando o tema entra de fato).
      const tipoExigido = mode === "practice" ? "practice" : mode === "theory" ? "theory" : null;
      let v = null;
      for (let tentativa = 0; tentativa < (tipoExigido ? 2 : 1); tentativa++) {
        const reforco = tentativa === 0 ? "" : `\n\nATENÇÃO: a resposta anterior misturou os tipos de task. Refaça a trilha inteira com "type": "${tipoExigido}" em TODAS as tasks, sem nenhuma exceção.`;
        const g = await callGemini(prompt + reforco, { temperature: 0.4, timeoutMs: 120000, tries: 2 });
        if (!g.ok) {
          if (g.status === 429) return json(res, 429, { error: "limite do Gemini atingido — tenta de novo em instantes ou usa o fluxo manual" });
          return json(res, 502, { error: g.status === 504 ? "geração demorou demais (timeout) — tenta de novo" : `${g.error} — tenta de novo` });
        }
        // remove cercas de markdown se vierem, e valida
        const cleaned = g.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
        const parcial = validateTrack(cleaned);
        if (!parcial.ok) return json(res, 422, { error: "o conteúdo gerado veio fora do formato — tenta de novo ou usa o fluxo manual", errors: parcial.errors.slice(0, 8) });
        v = parcial;
        if (!tipoExigido) break;
        const c = trackCounts(parcial.track);
        if ((tipoExigido === "practice" ? c.theory : c.practice) === 0) break;
      }
      const id = freeId(ud, v.track.id);
      v.track.id = id;
      v.track.createdAt = new Date().toISOString();
      v.track.generatedBy = GEMINI_MODEL;
      if (!v.track.icon || !TRACK_ICONS.has(v.track.icon)) delete v.track.icon; // ícone sugerido: só entra se está no catálogo
      ud.tracks[id] = v.track;
      tState(ud, id);
      await Promise.all([saveU(me.id, "tracks"), saveU(me.id, "state")]);
      bumpGen(me); // conta só quando o tema de fato entrou
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
      if (!v.track.icon || !TRACK_ICONS.has(v.track.icon)) delete v.track.icon; // idem geração: catálogo ou nada
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
      if (!isPro && Object.keys(ud.tracks).length >= FREE_THEME_LIMIT)
        return json(res, 402, { error: `plano free vai até ${FREE_THEME_LIMIT} temas — exclua um tema pra restaurar este` });
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
    // billing: cria a assinatura no Mercado Pago e devolve a URL de checkout
    if (path === "/api/billing/checkout" && req.method === "POST") {
      if (!BILLING_ENABLED) return json(res, 400, { error: "assinatura ainda não está aberta" });
      if (me.plan === "pro") return json(res, 400, { error: "sua conta já é Pro" });
      try {
        const r = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            preapproval_plan_id: MP_PLAN_ID,
            payer_email: me.email,
            external_reference: me.id,
            back_url: `${BASE_URL}/pro`,
          }),
        });
        const pre = await r.json();
        if (!r.ok || !pre.init_point) {
          console.error("[billing] checkout:", r.status, JSON.stringify(pre).slice(0, 200));
          return json(res, 502, { error: "não deu pra iniciar o checkout — tenta de novo" });
        }
        return json(res, 200, { ok: true, url: pre.init_point });
      } catch (e) {
        console.error("[billing] checkout:", e.message);
        return json(res, 502, { error: "não deu pra iniciar o checkout — tenta de novo" });
      }
    }
    // métricas de produto (founder-only) — os 3 números do PARECER-CEO §8.3:
    // ativação (criou tema + estudou), retenção D7 e uso do teto free. Sem isso, post = tiro no escuro.
    if (path === "/api/admin/metrics") {
      if (me.email !== FOUNDER_EMAIL) return json(res, 403, { error: "só o fundador" });
      const today = spDay();
      const rows = [];
      for (const u of Object.values(users)) {
        const d = await udata(u.id);
        const themes = Object.keys(d.tracks).length;
        const actDays = Object.keys(d.activity).sort();
        let tasksDone = 0, reviewed = 0; // reviewed = tasks que já subiram pelo menos 1 caixa
        for (const s of Object.values(d.state)) {
          tasksDone += Object.keys(s.done || {}).length;
          for (const rv of Object.values(s.review || {})) if (rv.box > 0) reviewed++;
        }
        const signupDay = (u.createdAt || "").slice(0, 10);
        const d7day = signupDay ? addDays(signupDay, 7) : null;
        rows.push({
          email: u.email, plan: u.plan, signup: signupDay,
          themes, tasksDone, reviewed, daysActive: actDays.length,
          lastActive: actDays[actDays.length - 1] || null,
          activated: themes > 0 && actDays.length > 0,
          d7Eligible: !!d7day && d7day <= today,
          d7Retained: !!d7day && actDays.some((day) => day >= d7day),
        });
      }
      const free = rows.filter((r) => r.plan === "free");
      const eligible = rows.filter((r) => r.d7Eligible);
      const pctFmt = (a, b) => (b ? Math.round((a / b) * 100) : null);
      return json(res, 200, {
        at: new Date().toISOString(),
        users: rows.length,
        byPlan: rows.reduce((m, r) => ((m[r.plan] = (m[r.plan] || 0) + 1), m), {}),
        signupsLast7d: rows.filter((r) => r.signup && r.signup >= addDays(today, -7)).length,
        activesLast7d: rows.filter((r) => r.lastActive && r.lastActive >= addDays(today, -7)).length,
        activation: { activated: rows.filter((r) => r.activated).length, of: rows.length, pct: pctFmt(rows.filter((r) => r.activated).length, rows.length) },
        d7: { retained: eligible.filter((r) => r.d7Retained).length, of: eligible.length, pct: pctFmt(eligible.filter((r) => r.d7Retained).length, eligible.length) },
        freeLimit: { atLimit: free.filter((r) => r.themes >= FREE_THEME_LIMIT).length, of: free.length },
        rows: rows.sort((a, b) => (a.signup < b.signup ? 1 : -1)),
      });
    }
    // funil da landing (founder-only, LAUNCH §2): visitas → cliques de CTA → signups, por dia e por canal
    if (path === "/api/admin/funnel") {
      if (me.email !== FOUNDER_EMAIL) return json(res, 403, { error: "só o fundador" });
      const today = spDay();
      const SRCS = [...new Set([...Object.values(users).map((u) => u.src).filter(Boolean), "linkedin", "reddit", "telegram", "twitter", "devto", "tabnews"])];
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const day = addDays(today, -i);
        const [lp, cta, signup] = await Promise.all([kv.get(`lp:${day}`), kv.get(`cta:${day}`), kv.get(`signup:${day}`)]);
        const bySrc = {};
        for (const src of SRCS) {
          const [l, c, g] = await Promise.all([kv.get(`lp:${day}:src:${src}`), kv.get(`cta:${day}:src:${src}`), kv.get(`signup:${day}:src:${src}`)]);
          if (l || c || g) bySrc[src] = { lp: l || 0, cta: c || 0, signup: g || 0 };
        }
        days.push({ day, lp: lp || 0, cta: cta || 0, signup: signup || 0, bySrc });
      }
      const signupsBySrc = {};
      for (const u of Object.values(users)) if (u.src) signupsBySrc[u.src] = (signupsBySrc[u.src] || 0) + 1;
      return json(res, 200, { at: new Date().toISOString(), days, signupsBySrc });
    }
    // export completo dos dados do usuário (a promessa "seus dados são exportáveis, sempre")
    if (path === "/api/export") {
      const payload = {
        app: "fixa", exportedAt: new Date().toISOString(),
        account: { name: me.name, email: me.email, plan: me.plan, createdAt: me.createdAt },
        tracks: ud.tracks, state: ud.state, trash: ud.trash, activity: ud.activity,
      };
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="fixa-export-${spDay()}.json"`,
      });
      return res.end(JSON.stringify(payload, null, 2));
    }
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
    // ícone do tema (DESIGN-TEMA-ICONE): o picker salva sozinho ao tocar; null volta ao padrão
    if (path === "/api/track/icon" && req.method === "POST") {
      const { id, icon } = await readBody(req);
      if (!ud.tracks[id]) return json(res, 404, { error: "tema não encontrado" });
      if (icon == null) delete ud.tracks[id].icon;
      else if (typeof icon === "string" && TRACK_ICONS.has(icon)) ud.tracks[id].icon = icon;
      else return json(res, 400, { error: "ícone fora do catálogo" });
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
      // campos obrigatórios não aceitam vazio — e o usuário fica sabendo (QA #10)
      if (typeof p.title === "string" && !p.title.trim()) return json(res, 400, { error: "a task precisa de um título" });
      if (typeof p.objective === "string" && !p.objective.trim()) return json(res, 400, { error: "a task precisa de um objetivo" });
      setStr("title"); setStr("objective");
      if (p.sample && typeof p.sample.q === "string" && typeof p.sample.a === "string" && p.sample.q.trim() && p.sample.a.trim())
        target.sample = { q: p.sample.q.trim(), a: p.sample.a.trim() };
      if (target.type === "theory") {
        if (Array.isArray(p.keyPoints)) target.keyPoints = p.keyPoints.map((s) => String(s).trim()).filter(Boolean);
      } else {
        if (Array.isArray(p.steps)) { const st = p.steps.map((s) => String(s).trim()).filter(Boolean); if (st.length) target.steps = st; }
        setStrOpt("expected"); setStrOpt("hint"); setStrOpt("snippet"); setStrOpt("language"); // expected pode ser limpo (QA #10)
      }
      await saveU(me.id, "tracks");
      return json(res, 200, { ok: true });
    }
    // remove uma task (ids das demais ficam estáveis; estado da task some junto)
    if (path === "/api/task/remove" && req.method === "POST") {
      const { trackId, taskId } = await readBody(req);
      const track = ud.tracks[trackId];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      // valida ANTES de mutar (QA #1): mutar e depois falhar corrompia o cache — e o KV na próxima escrita
      const ids = taskIdsOf(track);
      if (!ids.has(taskId)) return json(res, 404, { error: "task não encontrada" });
      if (ids.size === 1) return json(res, 400, { error: "não dá pra remover a última task do tema — exclua o tema" });
      for (const e of track.epics) for (const st of e.stories) {
        const i = st.tasks.findIndex((t) => t.id === taskId);
        if (i >= 0) st.tasks.splice(i, 1);
      }
      // poda stories/epics vazios
      for (const e of track.epics) e.stories = e.stories.filter((st) => st.tasks.length);
      track.epics = track.epics.filter((e) => e.stories.length);
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

    // A LIÇÃO (DESIGN-LICAO-UX): envio de um estágio; 'enviado é enviado'; Done automático no final
    if (path === "/api/task/lesson" && req.method === "POST") {
      const { trackId, taskId, answer, blank, restart, gaps, synthesis, expectedStage } = await readBody(req);
      const track = ud.tracks[trackId];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      let target = null;
      for (const e of track.epics) for (const st of e.stories) for (const t of st.tasks) if (t.id === taskId) target = t;
      if (!target) return json(res, 404, { error: "task não encontrada" });
      const s = tState(ud, trackId);
      const maxStages = LESSON_STAGES; // 3 pra todo tipo: fria → com o contexto (pontos-chave/passo a passo) → final
      let cur = migrateLesson(target, s, taskId) || { stage: 0, answers: [], v3: true };
      if (restart) {
        // refazer zera a lição E a correção (o front já arquivou ambas nas anotações) —
        // sem isso o Tutor devolveria pra sempre a correção velha em cache (idempotência)
        cur = { stage: 0, answers: [], v3: true };
        s.lesson[taskId] = cur;
        delete s.tutor[taskId];
        await saveU(me.id, "state");
        return json(res, 200, { ok: true, stage: 0 });
      }
      if (cur.stage >= maxStages) return json(res, 409, { error: "lição já concluída — use restart pra refazer" });
      if (expectedStage !== undefined && Number(expectedStage) !== cur.stage)
        return json(res, 409, { error: "esta lição avançou em outra aba" }); // QA #6 — o front já trata 409
      const text = String(answer || "").trim().slice(0, 10000); // teto (QA #11): paste gigante não pode inutilizar o state
      const isFinal = cur.stage === maxStages - 1;
      if (!text && !(blank === true && !isFinal)) {
        return json(res, 400, { error: isFinal ? "a resposta final é a que consolida — escreve com a tua palavra" : "escreve algo, ou toca em 'deu branco' pra seguir" });
      }
      // Lição v2 (DESIGN-LICAO-V2-METODO): lacunas acompanham a reescrita ("" = disse que não faltou
      // nada — registro honesto); a generalização fecha o envio final e é obrigatória
      if (cur.stage === 1 && gaps !== undefined) cur.gaps = String(gaps).trim().slice(0, 2000);
      if (isFinal) {
        const syn = String(synthesis || "").trim();
        if (!syn) return json(res, 400, { error: "fecha com o essencial em 1 frase — é ela que você leva" });
        cur.synthesis = syn.slice(0, 140);
      }
      cur.answers.push(text);
      cur.stage += 1;
      cur.updatedAt = new Date().toISOString();
      s.lesson[taskId] = cur;
      let becameDone = false;
      if (cur.stage >= maxStages && !s.done[taskId]) {
        s.done[taskId] = new Date().toISOString(); // Done automático na última resposta (decisão do dono)
        if (!s.review[taskId]) seedReview(s, taskId, null, track.targetDate);
        becameDone = true;
      }
      if (cur.stage >= maxStages) markActive(ud, me.id);
      await saveU(me.id, "state");
      return json(res, 200, { ok: true, stage: cur.stage, done: cur.stage >= maxStages, becameDone });
    }
    // O TUTOR: correção da jornada (pós-lição; medido por plano; idempotente — devolve a salva)
    if (path === "/api/task/tutor" && req.method === "POST") {
      if (!GEN_ENABLED) return json(res, 400, { error: "correção por IA não configurada no servidor" });
      const { trackId, taskId } = await readBody(req);
      const track = ud.tracks[trackId];
      if (!track) return json(res, 404, { error: "tema não encontrado" });
      let target = null;
      for (const e of track.epics) for (const st of e.stories) for (const t of st.tasks) if (t.id === taskId) target = t;
      if (!target) return json(res, 404, { error: "task não encontrada" });
      const s = tState(ud, trackId);
      if (s.tutor[taskId]) return json(res, 200, { ok: true, tutor: s.tutor[taskId], cached: true });
      const cur = migrateLesson(target, s, taskId);
      if (!cur || cur.stage < LESSON_STAGES) return json(res, 409, { error: "termina a lição primeiro — o Tutor corrige a jornada completa" });
      const tu = tutorUsage(me);
      if (tu.used >= tu.limit) {
        return json(res, me.plan === "pro" ? 429 : 402, {
          error: me.plan === "pro"
            ? `suas ${tu.limit} correções do mês acabaram — renova no dia 1º`
            : `suas ${tu.limit} correções de degustação acabaram — no Pro são ${TUTOR_PRO_MONTH}/mês`,
        });
      }
      const prompt = buildTutorPrompt({ task: target, answers: cur.answers, gaps: cur.gaps, synthesis: cur.synthesis, comments: s.comments[taskId] });
      const g = await callGemini(prompt, { temperature: 0.3, timeoutMs: 25000, tries: 3 });
      if (!g.ok) {
        if (g.status === 429) return json(res, 429, { error: "o Tutor está sobrecarregado — tenta de novo em instantes" });
        return json(res, 502, { error: g.status === 504 ? "a correção demorou demais — tenta de novo" : `Tutor indisponível (${g.status}) — tenta de novo` });
      }
      const text = g.text;
      let parsed;
      try { parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")); } catch { parsed = null; }
      const notaOk = parsed && typeof parsed.nota === "number" && parsed.nota >= 0 && parsed.nota <= 10;
      if (!notaOk || !parsed.veredito || !Array.isArray(parsed.acertos) || !Array.isArray(parsed.gaps)) {
        return json(res, 502, { error: "a correção veio fora do formato — tenta de novo" });
      }
      const tutor = {
        nota: Math.round(parsed.nota * 2) / 2,
        veredito: String(parsed.veredito).slice(0, 300),
        acertos: parsed.acertos.slice(0, 5).map((x) => String(x).slice(0, 400)),
        gaps: parsed.gaps.slice(0, 5).map((x) => String(x).slice(0, 400)),
        dica: String(parsed.dica || "").slice(0, 400),
        at: new Date().toISOString(),
      };
      s.tutor[taskId] = tutor;
      bumpTutor(me);
      await saveU(me.id, "state");
      return json(res, 200, { ok: true, tutor });
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
      if ((path === "/api/task/done" && body.done) || path === "/api/task/review") markActive(ud, me.id); // conta o dia pro streak (desmarcar não é estudo)
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
