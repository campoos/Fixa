import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, PartyPopper, RotateCcw, Shuffle, X } from "lucide-react";
import { getReview, taskReview, type Due } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { usePersistentState } from "@/lib/usePersistentState";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// intercala a fila entre temas (round-robin) — força discriminar contextos (interleaving)
function interleave(due: Due[]): Due[] {
  const byTrack = new Map<string, Due[]>();
  for (const d of due) { if (!byTrack.has(d.trackId)) byTrack.set(d.trackId, []); byTrack.get(d.trackId)!.push(d); }
  const queues = [...byTrack.values()];
  const out: Due[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) { const item = q.shift(); if (item) { out.push(item); added = true; } }
  }
  return out;
}

export function Review() {
  const { data, loading, error, refetch } = useApi(getReview, []);
  const [mix, setMix] = usePersistentState("fx-review-mix", true);
  // fila da sessão: congelada no início (não re-embaralha a cada grade)
  const [queue, setQueue] = useState<Due[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const trackCount = useMemo(() => new Set((data?.due ?? []).map((d) => d.trackId)).size, [data]);

  // monta a sessão quando os dados chegam (ou quando muda o modo intercalado)
  useEffect(() => {
    if (!data) return;
    const base = [...data.due];
    setQueue(mix && trackCount > 1 ? interleave(base) : base);
    setPos(0); setShown(false); setHits(0); setMisses(0);
  }, [data, mix, trackCount]);

  const cur = queue && pos < queue.length ? queue[pos] : null;
  const grade = async (result: "pass" | "fail") => {
    if (!cur || busy) return;
    setBusy(true);
    try {
      await taskReview(cur.trackId, cur.id, result);
      window.dispatchEvent(new Event("fx-review-changed")); // badge do header acompanha
      if (result === "pass") setHits((h) => h + 1); else setMisses((m) => m + 1);
      setPos((p) => p + 1);
      setShown(false);
    } finally { setBusy(false); }
  };

  // atalhos: Espaço/Enter revela · 1 = errei · 2 = acertei
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cur) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setShown(true); }
      else if (shown && e.key === "1") { e.preventDefault(); grade("fail"); }
      else if (shown && e.key === "2") { e.preventDefault(); grade("pass"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading && !data) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (error) return <Card className="p-4 text-sm text-destructive">erro: {error}</Card>;

  const total = queue?.length ?? 0;
  const finished = queue !== null && pos >= total;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <RotateCcw className="h-5 w-5 text-amber-500" />
        <h1 className="text-lg font-semibold">Revisar hoje</h1>
        {total > 0 && !finished && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500 tabular-nums">{Math.min(pos + 1, total)}/{total}</span>
        )}
        {trackCount > 1 && (
          <button onClick={() => setMix(!mix)} title="intercalar entre temas (fixa mais)" className={cn("ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition", mix ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent")}>
            <Shuffle className="h-3.5 w-3.5" /> intercalar
          </button>
        )}
      </div>

      {/* barra de progresso da sessão */}
      {total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(pos / total) * 100}%` }} />
        </div>
      )}

      {total === 0 ? (
        <Card className="p-8 text-center">
          <PartyPopper className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <p className="font-medium">Nada pra revisar agora 🎉</p>
          <p className="text-sm text-muted-foreground">Volte amanhã — as tasks concluídas reaparecem no tempo certo.</p>
        </Card>
      ) : finished ? (
        <Card className="p-8 text-center">
          <PartyPopper className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <p className="font-medium">Sessão concluída!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-emerald-500">{hits} acerto{hits === 1 ? "" : "s"}</span> · <span className="font-medium text-red-400">{misses} erro{misses === 1 ? "" : "s"}</span>
            {misses > 0 && " — os erros voltam amanhã."}
          </p>
          <button onClick={() => refetch()} className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">ver fila</button>
        </Card>
      ) : cur ? (
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{cur.id}</span>
            <span className="min-w-0 truncate">{cur.trackTitle} · {cur.epic}</span>
            <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-500">caixa {cur.box + 1}/8</span>
          </div>
          <p className="text-base font-medium leading-relaxed">{cur.sample.q}</p>
          {shown ? (
            <>
              <p className="mt-3 rounded-md border border-border bg-background p-2.5 text-sm text-muted-foreground"><span className="font-medium text-emerald-500">→ </span>{cur.sample.a}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => grade("fail")} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-500/50 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                  <X className="h-4 w-4" /> Errei <kbd className="ml-1 hidden rounded bg-muted px-1 font-mono text-[10px] sm:inline">1</kbd>
                </button>
                <button onClick={() => grade("pass")} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Acertei <kbd className="ml-1 hidden rounded bg-emerald-600 px-1 font-mono text-[10px] sm:inline">2</kbd>
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setShown(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent">
              <Eye className="h-4 w-4" /> Revelar resposta <kbd className="ml-1 hidden rounded bg-muted px-1 font-mono text-[10px] sm:inline">espaço</kbd>
            </button>
          )}
        </Card>
      ) : null}

      {!finished && total > 0 && <p className="text-center text-[11px] text-muted-foreground">responda de cabeça antes de revelar · espaço revela · 1 errei · 2 acertei</p>}
    </div>
  );
}
