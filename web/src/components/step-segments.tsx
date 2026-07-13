import { cn } from "@/lib/utils";

// segmentos do indicador de passos da Lição (DESIGN-LICAO-UI §3) — tinta violeta; miniatura reusada no peek da árvore (§7.b)
// current = passo ativo (0-based): vencidos apagados, atual forte, futuros neutros — gramática da escada Leitner
export function StepSegments({ current, total, className }: { current: number; total: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("h-[5px] w-3.5 rounded-full", i < current ? "bg-primary/40" : i === current ? "bg-primary" : "bg-secondary")} />
      ))}
    </span>
  );
}
