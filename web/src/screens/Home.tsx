import type { MouseEvent } from "react";
import { useState } from "react";
import { BookOpen, CalendarClock, Flame, GraduationCap, Layers, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { deleteTrack, getStats, getTracks, getTrash, purgeTrash, restoreTrack, type Progress, type TrackSummary } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { navigate } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function Trash({ onChange }: { onChange: () => void }) {
  const { data, loading, refetch } = useApi(getTrash, []);
  const [open, setOpen] = useState(false);
  const items = data ?? [];
  if (loading || !items.length) return null;
  const restore = async (id: string) => { await restoreTrack(id); await refetch(true); onChange(); };
  const purge = async (id: string) => { if (!confirm("Apagar de vez? Isso é irreversível.")) return; await purgeTrash(id); await refetch(true); };
  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 p-3 text-left text-sm text-muted-foreground">
        <Trash2 className="h-4 w-4" /> Lixeira <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{items.length}</span>
        <span className="ml-auto text-xs">{open ? "ocultar" : "ver"}</span>
      </button>
      {open && (
        <div className="space-y-1.5 px-2 pb-2">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{t.counts.tasks} tasks · excluído {fmtDate(t.deletedAt)}</span>
              <button onClick={() => restore(t.id)} title="restaurar" className="grid h-7 w-7 shrink-0 place-items-center rounded text-emerald-500 hover:bg-emerald-500/10"><Undo2 className="h-4 w-4" /></button>
              <button onClick={() => purge(t.id)} title="apagar de vez" className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pct = (p: Progress) => (p.total ? Math.round((p.done / p.total) * 100) : 0);

function Bar({ p }: { p: Progress }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct(p)}%` }} />
    </div>
  );
}

function StatStrip() {
  const { data: s } = useApi(getStats, []);
  if (!s) return null;
  const items = [
    { ic: <Flame className="h-4 w-4" />, v: s.streak, l: s.streak === 1 ? "dia seguido" : "dias seguidos", c: "text-orange-400" },
    { ic: <RotateCcw className="h-4 w-4" />, v: s.dueToday, l: "revisar hoje", c: "text-amber-500", go: "/revisar" },
    { ic: <GraduationCap className="h-4 w-4" />, v: s.mastered, l: "dominadas", c: "text-emerald-500" },
    { ic: <Layers className="h-4 w-4" />, v: s.tasksDone, l: `de ${s.tasksTotal} tasks`, c: "text-primary" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <Card key={i} onClick={it.go ? () => navigate(it.go!) : undefined} className={`p-3.5 ${it.go ? "cursor-pointer transition hover:border-primary/50" : ""}`}>
          <div className={`flex items-center gap-1.5 ${it.c}`}>{it.ic}<span className="text-xl font-bold tabular-nums text-foreground">{it.v}</span></div>
          <div className="mt-0.5 text-xs text-muted-foreground">{it.l}</div>
        </Card>
      ))}
    </div>
  );
}

export function Home() {
  const { data, loading, error, refetch } = useApi(getTracks, []);
  const [rev, setRev] = useState(0);
  const bump = () => { refetch(true); setRev((v) => v + 1); };
  const del = async (e: MouseEvent, t: TrackSummary) => {
    e.stopPropagation();
    if (!confirm(`Mover "${t.title}" pra lixeira? Dá pra restaurar depois.`)) return;
    await deleteTrack(t.id);
    bump();
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
        <div className="mx-auto mt-6 max-w-md text-left"><Trash key={rev} onChange={bump} /></div>
      </div>
    );
  return (
    <div className="space-y-4">
      <StatStrip />
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-muted-foreground">Seus temas</h1>
      </div>
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
                {t.mastery > 0 && <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-500"><GraduationCap className="h-3 w-3" />{t.mastery}</span>}
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{t.progress.done}/{t.progress.total}</span>
              </div>
              {t.targetDate && t.daysLeft != null && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <CalendarClock className="h-3 w-3" />{t.daysLeft < 0 ? "prova passou" : t.daysLeft === 0 ? "prova hoje" : `prova em ${t.daysLeft}d`}
                </span>
              )}
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
      <Trash key={rev} onChange={bump} />
    </div>
  );
}
