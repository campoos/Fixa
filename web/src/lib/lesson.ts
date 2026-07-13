import type { Task } from "@/lib/api";

// nº de envios da Lição (contrato do server): SEMPRE 3 — fria → com o contexto (pontos-chave/passo a passo) → final
export const lessonStages = (_task: Pick<Task, "type">) => 3;

// nota do Tutor formatada pt-BR — sempre em mono tabular no JSX
export const fmtNota = (n: number) => n.toLocaleString("pt-BR");

// data curta pt-BR ("12/07") — face de dados, sempre em mono tabular no JSX
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

// tempo relativo ("há 3 dias") — na retomada, o tempo passado é informação de estudo (UX §3.1)
export function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d === 1 ? "" : "s"}`;
  return `em ${shortDate(iso)}`;
}

// botão quieto (mesmo espécime do Revisar) — compartilhado entre Lição e peek da árvore
export const QUIET_BTN = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-accent";
