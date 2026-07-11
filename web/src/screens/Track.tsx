import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Code2, Eye, GraduationCap, Loader2, MessageSquarePlus, Target, Trash2 } from "lucide-react";
import {
  getTrack, taskComment, taskCommentDelete, taskDone,
  type Comment, type Epic, type Me, type Progress, type Story, type Task, type Track as TrackData,
} from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { navigate } from "@/App";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const pct = (p: Progress) => (p.total ? Math.round((p.done / p.total) * 100) : 0);
const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Bar({ p, className }: { p: Progress; className?: string }) {
  return <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct(p)}%` }} /></div>;
}
function DoneBox({ done, busy, onToggle }: { done: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} disabled={busy} className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border transition disabled:opacity-50", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:bg-accent")}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done && <Check className="h-4 w-4" />}
    </button>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div><div className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{title}</div>{children}</div>;
}

function Comments({ list, meName, onAdd, onDelete }: { list: Comment[]; meName: string; onAdd: (t: string) => Promise<void>; onDelete: (i: number, at: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<number | null>(null);
  const submit = async () => { const t = text.trim(); if (!t || busy) return; setBusy(true); try { await onAdd(t); setText(""); } finally { setBusy(false); } };
  const remove = async (i: number, at: string) => { if (del !== null || !confirm("Excluir?")) return; setDel(i); try { await onDelete(i, at); } finally { setDel(null); } };
  return (
    <div className="space-y-2">
      {list.map((c, i) => (
        <div key={i} className="rounded-md border border-border bg-background p-2 text-sm">
          <div className="mb-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{c.author}</span><span>{fmt(c.at)}</span>
            {c.author === meName && <button onClick={() => remove(i, c.at)} disabled={del !== null} className="ml-auto grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50">{del === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>}
          </div>
          <p className="break-words whitespace-pre-wrap">{c.text}</p>
        </div>
      ))}
      <div className="flex items-end gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }} rows={2} placeholder="tua resposta / o que entendeu / generalização…" className="min-h-[40px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary" />
        <button onClick={submit} disabled={busy || !text.trim()} title="comentar (⌘/Ctrl+Enter)" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}

function TaskDetail({ task, meName, onComment, onDeleteComment }: { task: Task; meName: string; onComment: (t: string) => Promise<void>; onDeleteComment: (i: number, at: string) => Promise<void> }) {
  // recall forçado: a resposta (e os pontos-chave, na teórica) ficam ocultos até você tentar de cabeça
  const [reveal, setReveal] = useState(false);
  const isPractice = task.type === "practice";
  return (
    <div className="space-y-3 border-t border-border px-3 py-3">
      <Section title="Objetivo"><p className="text-sm leading-relaxed">{task.objective}</p></Section>

      {/* prática: os passos são pra fazer o exercício, então ficam visíveis */}
      {isPractice && (
        <>
          {!!task.steps?.length && (
            <Section title="Passos"><ol className="space-y-1 text-sm leading-relaxed">{task.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span><span>{s}</span></li>)}</ol></Section>
          )}
          {task.hint && <Section title="Dica"><p className="text-sm text-muted-foreground">{task.hint}</p></Section>}
          {task.snippet && <Section title="Exemplo"><pre className="overflow-x-auto rounded-md border border-border bg-background p-2.5 font-mono text-xs"><code>{task.snippet}</code></pre></Section>}
        </>
      )}

      <Section title="Responda de cabeça — depois revele">
        <div className="space-y-2 rounded-md border border-border bg-background p-2.5 text-sm">
          <p className="font-medium">{task.sample.q}</p>
          {reveal ? (
            <div className="space-y-2 border-t border-border pt-2">
              {!isPractice && !!task.keyPoints?.length && (
                <ul className="space-y-1">{task.keyPoints.map((k, i) => <li key={i} className="flex gap-2 text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><span>{k}</span></li>)}</ul>
              )}
              {isPractice && task.expected && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2"><span className="font-medium text-emerald-500">esperado: </span>{task.expected}</p>}
              <p className="text-muted-foreground"><span className="font-medium text-emerald-500">→ </span>{task.sample.a}</p>
            </div>
          ) : (
            <button onClick={() => setReveal(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <Eye className="h-3.5 w-3.5" /> tentei — revelar {isPractice ? "resposta" : "resposta e pontos-chave"}
            </button>
          )}
        </div>
      </Section>

      <Section title="Anotações / Generalização"><Comments list={task.comments} meName={meName} onAdd={onComment} onDelete={onDeleteComment} /></Section>
    </div>
  );
}

function TaskRow({ trackId, task, meName, onChanged }: { trackId: string; task: Task; meName: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toggleDone = async () => { setBusy(true); try { await taskDone(trackId, task.id, !task.done); onChanged(); } finally { setBusy(false); } };
  const addC = async (t: string) => { await taskComment(trackId, task.id, t); onChanged(); };
  const delC = async (i: number, at: string) => { await taskCommentDelete(trackId, task.id, i, at); onChanged(); };
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 p-2.5">
        <DoneBox done={task.done} busy={busy} onToggle={toggleDone} />
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="font-mono text-[11px] text-muted-foreground">{task.id}</span>
          {task.type === "practice" && <Code2 className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-label="prática" />}
          <span className={cn("min-w-0 flex-1 truncate text-sm", task.done && "text-muted-foreground line-through")}>{task.title}</span>
          {task.review?.graduated && <span className="shrink-0 text-[11px] text-emerald-500" title="dominada">✓ dominada</span>}
          {task.review?.due && <span className="shrink-0 text-[11px] text-amber-500">revisar</span>}
          {task.comments.length > 0 && <span className="shrink-0 text-[11px] text-muted-foreground">💬{task.comments.length}</span>}
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </button>
      </div>
      {open && <TaskDetail task={task} meName={meName} onComment={addC} onDeleteComment={delC} />}
    </div>
  );
}

function StoryBlock({ trackId, story, meName, onChanged }: { trackId: string; story: Story; meName: string; onChanged: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 p-2.5 text-left">
        <span className="font-mono text-[11px] text-muted-foreground">{story.id}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{story.title}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{story.progress.done}/{story.progress.total}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-2 px-2 pb-2">{story.tasks.map((t) => <TaskRow key={t.id} trackId={trackId} task={t} meName={meName} onChanged={onChanged} />)}</div>}
    </div>
  );
}

function EpicCard({ trackId, epic, meName, onChanged }: { trackId: string; epic: Epic; meName: string; onChanged: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Card className="overflow-hidden p-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-2.5 p-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Epic {epic.id}</span>
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{epic.title}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{epic.progress.done}/{epic.progress.total}</span>
            {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
          {epic.goal && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{epic.goal}</p>}
          <Bar p={epic.progress} className="mt-1.5" />
        </div>
      </button>
      {open && <div className="space-y-2 border-t border-border bg-background/40 p-2 sm:p-3">{epic.stories.map((s) => <StoryBlock key={s.id} trackId={trackId} story={s} meName={meName} onChanged={onChanged} />)}</div>}
    </Card>
  );
}

export function Track({ id, me }: { id: string; me: Me }) {
  const { data, loading, error, refetch } = useApi<TrackData>(() => getTrack(id), [id]);
  const changed = () => refetch(true);
  if (loading && !data) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (error) return <Card className="p-4 text-sm text-destructive">erro: {error}</Card>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> temas</button>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-500" />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{data.title}</h1>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">{data.progress.done}/{data.progress.total} · {pct(data.progress)}%</span>
        </div>
        {data.summary && <p className="mt-1 text-sm text-muted-foreground">{data.summary}</p>}
        <Bar p={data.progress} className="mt-3 h-2" />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">{data.progress.done} concluídas</span>
          <span className="inline-flex items-center gap-1 text-emerald-500"><GraduationCap className="h-3.5 w-3.5" />{data.mastery} dominadas</span>
          {data.review.due.length > 0 && <span className="text-amber-500">{data.review.due.length} pra revisar hoje</span>}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Dominar ≠ concluir: uma task vira “dominada” quando você acerta ela nas revisões espaçadas até graduar.</p>
      </Card>
      {data.epics.map((e) => <EpicCard key={e.id} trackId={id} epic={e} meName={me.name} onChanged={changed} />)}
    </div>
  );
}
