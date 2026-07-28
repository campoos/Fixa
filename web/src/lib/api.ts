// Cliente da API do server.js. Sessão por cookie (ts_sess).
export class ApiError extends Error {
  status: number;
  errors?: string[];
  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin", headers: opts?.body ? { "Content-Type": "application/json" } : undefined, ...opts });
  const txt = await res.text();
  let data: unknown = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) {
    const d = data as { error?: string; errors?: string[] };
    throw new ApiError(res.status, d?.error || d?.errors?.join("; ") || res.statusText, d?.errors);
  }
  return data as T;
}
const api = {
  get: <T,>(p: string) => req<T>(p),
  post: <T,>(p: string, body?: unknown) => req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};

// ---- tipos ----
export interface Me { name: string; email: string; plan: "free" | "pro" }
export interface Counts { epics: number; stories: number; tasks: number; practice: number; theory: number }
export interface Progress { done: number; total: number }
export interface TrackSummary { id: string; title: string; summary: string; icon: string | null; progress: Progress; mastery: number; due: number; targetDate: string | null; daysLeft: number | null; dailyGoal: number | null; doneToday: number; counts: Counts }
export interface Comment { text: string; at: string; author: string }
export interface Review { box: number; next: string | null; graduated: boolean; due: boolean; ladder: number }
export interface Sample { q: string; a: string }
// a Lição (DESIGN-LICAO-UX §2.0): stage = quantas respostas já foram enviadas; resposta em branco = ""
export interface Lesson { stage: number; answers: string[]; gaps?: string; synthesis?: string; updatedAt: string }
// correção do Tutor (DESIGN-TUTOR-IA): salva por task, idempotente no server
export interface Tutor { nota: number; veredito: string; acertos: string[]; gaps: string[]; dica: string; at: string }
export interface Task {
  id: string;
  type: "theory" | "practice";
  title: string;
  objective: string;
  sample: Sample;
  done: boolean;
  completedAt: string | null;
  comments: Comment[];
  review: Review | null;
  lesson: Lesson | null;
  tutor: Tutor | null;
  // theory
  keyPoints?: string[];
  // practice
  language?: string | null;
  steps?: string[];
  hint?: string | null;
  expected?: string;
  snippet?: string | null;
}
export interface Story { id: string; title: string; tasks: Task[]; progress: Progress }
export interface Epic { id: string; title: string; goal: string; stories: Story[]; progress: Progress }
export interface Due { trackId: string; trackTitle?: string; id: string; title: string; sample: Sample; type: "theory" | "practice"; epic: string; story: string; box: number; next: string }
export interface Track { id: string; title: string; summary: string; icon: string | null; epics: Epic[]; progress: Progress; mastery: number; targetDate: string | null; daysLeft: number | null; dailyGoal: number | null; review: { due: Due[]; ladder: number[] } }
export interface ReviewList { due: Due[]; ladder: number[]; mode: "normal" | "retorno" | "prova"; session: Due[]; rest: number; dose: number }

// ---- auth ----
export const getMe = () => api.get<Me>("/api/me");
export const login = (email: string, pass: string) => api.post<Me>("/api/login", { email, pass });
// src = canal de origem guardado pela landing (funil first-party)
export const signup = (name: string, email: string, pass: string) => {
  let src = "";
  try { src = localStorage.getItem("fx-src") || ""; } catch { /* sem storage */ }
  return api.post<Me>("/api/signup", { name, email, pass, ...(src ? { src } : {}) });
};
export const logout = () => api.post("/api/logout");
export const forgotPass = (email: string) => api.post<{ ok: true }>("/api/forgot", { email });
export const resetPass = (token: string, pass: string) => api.post<Me>("/api/reset", { token, pass });
export const billingCheckout = () => api.post<{ ok: true; url: string }>("/api/billing/checkout");
// Pix: compra avulsa de prazo (1 mês ou 1 ano) — o retorno é o checkout hospedado do Mercado Pago
export const billingPix = (plano: "mes" | "ano") => api.post<{ ok: true; url: string; valor: number; dias: number }>("/api/billing/pix", { plano });

// ---- temas ----
export const getTracks = () => api.get<{ tracks: TrackSummary[] }>("/api/tracks").then((r) => r.tracks);
export const getTrack = (id: string) => api.get<Track>(`/api/track?id=${encodeURIComponent(id)}`);
export const deleteTrack = (id: string) => api.post("/api/track/delete", { id });
export interface TrashItem { id: string; title: string; deletedAt: string; counts: Counts }
export const getTrash = () => api.get<{ items: TrashItem[] }>("/api/trash").then((r) => r.items);
export const restoreTrack = (id: string) => api.post<{ ok: true; id: string }>("/api/track/restore", { id });
export const setTrackTarget = (id: string, date: string | null) => api.post("/api/track/target", { id, date });
export const renameTrack = (id: string, title: string, summary?: string) => api.post("/api/track/rename", { id, title, summary });
export const setTrackIcon = (id: string, icon: string | null) => api.post("/api/track/icon", { id, icon });
export type TaskPatch = Partial<Pick<Task, "title" | "objective" | "keyPoints" | "steps" | "expected" | "hint" | "snippet" | "language">> & { sample?: Sample };
export const editTask = (trackId: string, taskId: string, patch: TaskPatch) => api.post("/api/task/edit", { trackId, taskId, patch });
export const removeTask = (trackId: string, taskId: string) => api.post("/api/task/remove", { trackId, taskId });
export const appendTrack = (id: string, jsonStr: string) => {
  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch (e) { return Promise.reject(new ApiError(400, `JSON inválido: ${(e as Error).message}`)); }
  return api.post<{ ok: true; added: Counts }>("/api/track/append", { id, json: parsed });
};
// geração direta (Gemini) — disponível quando o server tem GEMINI_API_KEY
// gen: uso real da geração por IA — free: used/limit lifetime (degustação); pro: used/limit no mês + dayUsed/dayLimit no dia
export interface GenUsage { used: number; limit: number; dayUsed?: number; dayLimit?: number }
// tutor: uso das correções do Tutor — free: lifetime (degustação); pro: no mês
export interface TutorUsage { used: number; limit: number }
export interface Config { genEnabled: boolean; billingEnabled: boolean; plan: "free" | "pro"; freeLimit: number; themes: number; gen: GenUsage; tutor: TutorUsage; price: number; fullPrice: number; yearPrice: number; fullYearPrice: number; founderLeft: number; proUntil: string | null; pushKey: string; pushSubs: number; remindersOn: boolean }
export const getConfig = () => api.get<Config>("/api/config");
// lembretes (DESIGN-PUSH.md): a inscrição do aparelho e o interruptor geral dos dois canais
export const pushSubscribe = (endpoint: string) => api.post<{ ok: true; subs: number }>("/api/push/subscribe", { endpoint });
export const pushUnsubscribe = (endpoint?: string) => api.post<{ ok: true; subs: number }>("/api/push/unsubscribe", endpoint ? { endpoint } : {});
export const setReminders = (on: boolean) => api.post<{ ok: true; on: boolean; subs: number }>("/api/reminders/prefs", { on });
// lista do Pro (pré-billing) — guarda o e-mail pra avisar quando abrir
export const joinWaitlist = (email: string) => api.post<{ ok: true }>("/api/waitlist", { email });
export const generateTrack = (p: PromptParams) =>
  api.post<{ ok: true; id: string; title: string; counts: Counts }>("/api/generate", p);
export const purgeTrash = (id?: string) => api.post("/api/trash/purge", id ? { id } : {});
export interface PromptParams { theme: string; level?: string; mode?: string; depth?: string }
export const getImportPrompt = (p: PromptParams) => {
  const qs = new URLSearchParams({ theme: p.theme, ...(p.level && { level: p.level }), ...(p.mode && { mode: p.mode }), ...(p.depth && { depth: p.depth }) });
  return api.get<{ prompt: string }>(`/api/import/prompt?${qs}`).then((r) => r.prompt);
};
export const importTrack = (jsonStr: string) => {
  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch (e) { return Promise.reject(new ApiError(400, `JSON inválido: ${(e as Error).message}`)); }
  return api.post<{ ok: true; id: string; title: string; counts: Counts }>("/api/import", { json: parsed });
};

// ---- ações de task ----
export const taskDone = (trackId: string, taskId: string, done: boolean) => api.post("/api/task/done", { trackId, taskId, done });
export const taskComment = (trackId: string, taskId: string, text: string) => api.post("/api/task/comment", { trackId, taskId, text });
export const taskCommentDelete = (trackId: string, taskId: string, index: number, at: string) => api.post("/api/task/comment/delete", { trackId, taskId, index, at });
export const taskReview = (trackId: string, taskId: string, result: "pass" | "fail") => api.post("/api/task/review", { trackId, taskId, result });
// a Lição: envia um estágio ('enviado é enviado'); blank registra em branco (só intermediário); restart refaz (Done permanece)
export const lessonSubmit = (trackId: string, taskId: string, p: { answer?: string; blank?: boolean; restart?: boolean; gaps?: string; synthesis?: string; expectedStage?: number }) =>
  api.post<{ ok: true; stage: number; done?: boolean; becameDone?: boolean }>("/api/task/lesson", { trackId, taskId, ...p });
// o Tutor: corrige a jornada completa (409 se incompleta · 402/429 limite · 502 transitório — retry manual)
export const tutorCorrect = (trackId: string, taskId: string) =>
  api.post<{ ok: true; tutor: Tutor; cached?: boolean }>("/api/task/tutor", { trackId, taskId });
export const getReview = () => api.get<ReviewList>("/api/review");
export interface Stats { streak: number; dueToday: number; doseToday: number; dueMode: "normal" | "retorno" | "prova"; themes: number; tasksDone: number; tasksTotal: number; mastered: number; days: { day: string; count: number }[] }
export const getStats = () => api.get<Stats>("/api/stats");
