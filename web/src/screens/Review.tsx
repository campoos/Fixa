import { useState } from "react";
import { Check, Eye, Loader2, PartyPopper, RotateCcw, X } from "lucide-react";
import { getReview, taskReview, type Due } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ReviewItem({ due, onGrade }: { due: Due; onGrade: (d: Due, r: "pass" | "fail") => Promise<void> }) {
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const grade = async (r: "pass" | "fail") => { if (busy) return; setBusy(true); try { await onGrade(due, r); } finally { setBusy(false); } };
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{due.id}</span>
        <span className="min-w-0 truncate">{due.trackTitle} · {due.epic}</span>
        <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-500">caixa {due.box + 1}/8</span>
      </div>
      <p className="text-sm font-medium">{due.sample.q}</p>
      {shown ? (
        <>
          <p className="mt-2 rounded-md border border-border bg-card p-2 text-sm text-muted-foreground"><span className="font-medium text-emerald-500">→ </span>{due.sample.a}</p>
          <div className="mt-2.5 flex gap-2">
            <button onClick={() => grade("pass")} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Acertei</button>
            <button onClick={() => grade("fail")} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-500/50 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"><X className="h-4 w-4" /> Errei</button>
          </div>
        </>
      ) : (
        <button onClick={() => setShown(true)} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-accent"><Eye className="h-4 w-4" /> Revelar resposta</button>
      )}
    </div>
  );
}

export function Review() {
  const { data, loading, error, refetch } = useApi(getReview, []);
  const onGrade = async (d: Due, r: "pass" | "fail") => { await taskReview(d.trackId, d.id, r); await refetch(true); };
  if (loading && !data) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (error) return <Card className="p-4 text-sm text-destructive">erro: {error}</Card>;
  const due = data?.due ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-amber-500" />
        <h1 className="text-lg font-semibold">Revisar hoje</h1>
        {due.length > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500 tabular-nums">{due.length}</span>}
      </div>
      {due.length === 0 ? (
        <Card className="p-8 text-center">
          <PartyPopper className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <p className="font-medium">Nada pra revisar agora 🎉</p>
          <p className="text-sm text-muted-foreground">Volte amanhã — as tasks concluídas reaparecem no tempo certo.</p>
        </Card>
      ) : (
        <div className="space-y-2">{due.map((d) => <ReviewItem key={`${d.trackId}-${d.id}`} due={d} onGrade={onGrade} />)}</div>
      )}
    </div>
  );
}
