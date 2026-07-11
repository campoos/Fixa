import type { MouseEvent } from "react";
import { BookOpen, Plus, RotateCcw, Trash2 } from "lucide-react";
import { deleteTrack, getTracks, type Progress, type TrackSummary } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { navigate } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const pct = (p: Progress) => (p.total ? Math.round((p.done / p.total) * 100) : 0);

function Bar({ p }: { p: Progress }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct(p)}%` }} />
    </div>
  );
}

export function Home() {
  const { data, loading, error, refetch } = useApi(getTracks, []);
  const del = async (e: MouseEvent, t: TrackSummary) => {
    e.stopPropagation();
    if (!confirm(`Excluir o tema "${t.title}" e todo o progresso?`)) return;
    await deleteTrack(t.id);
    refetch(true);
  };
  if (loading && !data) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (error) return <Card className="p-4 text-sm text-destructive">erro: {error}</Card>;
  const tracks = data ?? [];
  if (!tracks.length)
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 font-medium">Nenhum tema ainda</p>
        <p className="mb-4 text-sm text-muted-foreground">Gere um tema (qualquer assunto) e comece a estudar com o método.</p>
        <button onClick={() => navigate("/novo")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Criar primeiro tema
        </button>
      </div>
    );
  return (
    <div className="space-y-3">
      {tracks.map((t) => (
        <Card key={t.id} onClick={() => navigate(`/t/${encodeURIComponent(t.id)}`)} className="cursor-pointer p-4 transition hover:border-primary/50">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{t.title}</h2>
                {t.due > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                    <RotateCcw className="h-3 w-3" /> {t.due}
                  </span>
                )}
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{t.progress.done}/{t.progress.total}</span>
              </div>
              {t.summary && <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.summary}</p>}
              <div className="mt-2"><Bar p={t.progress} /></div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t.counts.epics} epics · {t.counts.stories} stories · {t.counts.tasks} tasks ({t.counts.practice} práticas)
              </p>
            </div>
            <button onClick={(e) => del(e, t)} title="excluir tema" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
