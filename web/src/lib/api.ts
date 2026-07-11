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
export interface Me { name: string }
export interface Counts { epics: number; stories: number; tasks: number; practice: number; theory: number }
export interface Progress { done: number; total: number }
export interface TrackSummary { id: string; title: string; summary: string; progress: Progress; mastery: number; due: number; counts: Counts }
export interface Comment { text: string; at: string; author: string }
export interface Review { box: number; next: string | null; graduated: boolean; due: boolean; ladder: number }
export interface Sample { q: string; a: string }
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
export interface Track { id: string; title: string; summary: string; epics: Epic[]; progress: Progress; mastery: number; review: { due: Due[]; ladder: number[] } }
export interface ReviewList { due: Due[]; ladder: number[] }

// ---- auth ----
export const getMe = () => api.get<Me>("/api/me");
export const login = (pass: string) => api.post<Me>("/api/login", { pass });
export const logout = () => api.post("/api/logout");

// ---- temas ----
export const getTracks = () => api.get<{ tracks: TrackSummary[] }>("/api/tracks").then((r) => r.tracks);
export const getTrack = (id: string) => api.get<Track>(`/api/track?id=${encodeURIComponent(id)}`);
export const deleteTrack = (id: string) => api.post("/api/track/delete", { id });
export interface TrashItem { id: string; title: string; deletedAt: string; counts: Counts }
export const getTrash = () => api.get<{ items: TrashItem[] }>("/api/trash").then((r) => r.items);
export const restoreTrack = (id: string) => api.post<{ ok: true; id: string }>("/api/track/restore", { id });
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
export const getReview = () => api.get<ReviewList>("/api/review");
export interface Stats { streak: number; dueToday: number; themes: number; tasksDone: number; tasksTotal: number; mastered: number }
export const getStats = () => api.get<Stats>("/api/stats");
