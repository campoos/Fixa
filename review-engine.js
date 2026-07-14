// Motor de revisão espaçada (Leitner) — puro e testável; o server só orquestra.
// box N = "no intervalo LADDER[N]"; acertou sobe; passou da última gradua; errou volta pra caixa 0.

export const REVIEW_LADDER = [1, 2, 3, 4, 7, 15, 21, 30];
export const STUDY_TZ = "America/Sao_Paulo";

// "hoje" (ou a data de um Date) como YYYY-MM-DD no fuso de SP — dia de calendário, não 24h corridas
export function spDay(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STUDY_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
  const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
}
export const isGraduated = (rv) => rv.box >= REVIEW_LADDER.length;
// agenda adaptativa: nenhuma revisão cai DEPOIS da data da prova.
// Prova no passado é ignorada (QA #2): clampar pra trás deixava a fila mentirosa e infinita.
export const clampNext = (next, targetDate, today = spDay()) =>
  (targetDate && targetDate > today && next && next > targetDate ? targetDate : next);

// nova entrada na fila (task recém-concluída): caixa 0, revisa amanhã (ou na prova, se antes)
export function seedEntry(fromDay, targetDate) {
  const day = fromDay || spDay();
  return { box: 0, last: day, next: clampNext(addDays(day, REVIEW_LADDER[0]), targetDate, day) };
}
// avalia uma revisão: pass sobe caixa (gradua no topo), fail volta pra caixa 0 (amanhã)
export function gradeEntry(rv, result, today, targetDate) {
  const day = today || spDay();
  if (result === "fail") return { box: 0, last: day, next: clampNext(addDays(day, REVIEW_LADDER[0]), targetDate, day) };
  const nb = rv.box + 1;
  if (nb >= REVIEW_LADDER.length) return { box: REVIEW_LADDER.length, last: day, next: null }; // graduou
  return { box: nb, last: day, next: clampNext(addDays(day, REVIEW_LADDER[nb]), targetDate, day) };
}

// anti-burnout (DESIGN-FILA-RETORNO): a sessão do dia. Dose fixa quando há backlog;
// fila inteira em dia normal ou em reta final de prova. NUNCA reagenda nada — só seleciona.
export const REVIEW_DOSE = 12;
const byFragility = (a, b) => (a.box - b.box) || (a.next < b.next ? -1 : a.next > b.next ? 1 : 0);
export function planSession(due, today, minDaysLeft = null) {
  const overdue = due.filter((d) => d.next < today).length;
  const examSoon = minDaysLeft != null && minDaysLeft <= 7;
  if (!overdue || due.length <= REVIEW_DOSE)
    return { mode: "normal", session: due, rest: 0, overdue };
  const sorted = [...due].sort(byFragility);
  if (examSoon) return { mode: "prova", session: sorted, rest: 0, overdue };
  return { mode: "retorno", session: sorted.slice(0, REVIEW_DOSE), rest: due.length - REVIEW_DOSE, overdue };
}
