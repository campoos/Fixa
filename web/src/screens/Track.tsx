import { useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarClock, Check, ChevronDown, ChevronRight, Code2, Eye, GraduationCap, Loader2, MessageSquarePlus, Pencil, PlusCircle, Target, Trash2 } from "lucide-react";
import {
  appendTrack, editTask, getTrack, removeTask, renameTrack, setTrackTarget, taskComment, taskCommentDelete, taskDone,
  ApiError, type Comment, type Epic, type Me, type Progress, type Story, type Task, type TaskPatch, type Track as TrackData,
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

const inputCls = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";
function Fld({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1"><span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>{children}</label>;
}

/* editor inline da task — edita campos por tipo; remover mora aqui */
function TaskEditor({ trackId, task, onDone, onChanged }: { trackId: string; task: Task; onDone: () => void; onChanged: () => void }) {
  const [f, setF] = useState({
    title: task.title, objective: task.objective, q: task.sample.q, a: task.sample.a,
    keyPoints: (task.keyPoints ?? []).join("\n"), steps: (task.steps ?? []).join("\n"),
    expected: task.expected ?? "", hint: task.hint ?? "", snippet: task.snippet ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      const patch: TaskPatch = { title: f.title, objective: f.objective, sample: { q: f.q, a: f.a } };
      if (task.type === "theory") patch.keyPoints = f.keyPoints.split("\n").map((s) => s.trim()).filter(Boolean);
      else { patch.steps = f.steps.split("\n").map((s) => s.trim()).filter(Boolean); patch.expected = f.expected; patch.hint = f.hint; patch.snippet = f.snippet; }
      await editTask(trackId, task.id, patch);
      onChanged(); onDone();
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm(`Remover a task "${task.title}"? O progresso dela some junto.`)) return;
    setBusy(true);
    try { await removeTask(trackId, task.id); onChanged(); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2.5 border-t border-border px-3 py-3">
      <Fld label="Título"><input value={f.title} onChange={set("title")} className={inputCls} /></Fld>
      <Fld label="Objetivo"><textarea value={f.objective} onChange={set("objective")} rows={2} className={inputCls} /></Fld>
      {task.type === "theory" ? (
        <Fld label="Pontos-chave (um por linha)"><textarea value={f.keyPoints} onChange={set("keyPoints")} rows={4} className={inputCls} /></Fld>
      ) : (
        <>
          <Fld label="Passos (um por linha)"><textarea value={f.steps} onChange={set("steps")} rows={4} className={inputCls} /></Fld>
          <Fld label="Resultado esperado"><textarea value={f.expected} onChange={set("expected")} rows={2} className={inputCls} /></Fld>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Fld label="Dica (opcional)"><input value={f.hint} onChange={set("hint")} className={inputCls} /></Fld>
            <Fld label="Snippet (opcional)"><input value={f.snippet} onChange={set("snippet")} className={`${inputCls} font-mono text-xs`} /></Fld>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Fld label="Questão-modelo"><textarea value={f.q} onChange={set("q")} rows={2} className={inputCls} /></Fld>
        <Fld label="Resposta"><textarea value={f.a} onChange={set("a")} rows={2} className={inputCls} /></Fld>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar
        </button>
        <button onClick={onDone} disabled={busy} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50">cancelar</button>
        <button onClick={remove} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50">
          <Trash2 className="h-4 w-4" /> remover task
        </button>
      </div>
    </div>
  );
}

function TaskRow({ trackId, task, meName, onChanged }: { trackId: string; task: Task; meName: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
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
        {open && (
          <button onClick={() => setEditing(!editing)} title={editing ? "fechar edição" : "editar task"} className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent", editing && "border-primary text-primary")}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && (editing
        ? <TaskEditor trackId={trackId} task={task} onDone={() => setEditing(false)} onChanged={onChanged} />
        : <TaskDetail task={task} meName={meName} onComment={addC} onDeleteComment={delC} />)}
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

function TargetControl({ track, onChange }: { track: TrackData; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const save = async (date: string | null) => { setBusy(true); try { await setTrackTarget(track.id, date); onChange(); setEditing(false); } finally { setBusy(false); } };
  if (track.targetDate && !editing) {
    const dl = track.daysLeft ?? 0;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
          <CalendarClock className="h-3.5 w-3.5" />{dl < 0 ? "prova já passou" : dl === 0 ? "prova é hoje" : `prova em ${dl} dia${dl === 1 ? "" : "s"}`}
        </span>
        {track.dailyGoal ? <span className="text-muted-foreground">meta ~{track.dailyGoal}/dia pra dominar a tempo</span> : null}
        <button onClick={() => setEditing(true)} className="text-muted-foreground underline-offset-2 hover:underline">editar</button>
      </div>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
      <input type="date" min={today} defaultValue={track.targetDate ?? ""} disabled={busy}
        onChange={(e) => e.target.value && save(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
      <span className="text-muted-foreground">data da prova — as revisões se ajustam a ela</span>
      {track.targetDate && <button onClick={() => save(null)} className="text-red-400 hover:underline">remover</button>}
    </div>
  );
}

/* anexar epics novos colando JSON (mesmo shape do import; título ignorado) */
function AppendBlock({ trackId, onChanged }: { trackId: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [jsonStr, setJsonStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const doAppend = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await appendTrack(trackId, jsonStr);
      setMsg(`adicionado: ${r.added.epics} epic(s), ${r.added.tasks} task(s) ✓`);
      setJsonStr("");
      onChanged();
    } catch (e) {
      setMsg(e instanceof ApiError && e.errors?.length ? e.errors.slice(0, 6).join(" · ") : e instanceof Error ? e.message : "falhou");
    } finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg border border-dashed border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 p-3 text-left text-sm text-muted-foreground hover:text-foreground">
        <PlusCircle className="h-4 w-4" /> Adicionar conteúdo (colar JSON de epics)
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          <p className="text-xs text-muted-foreground">Gere mais epics com o mesmo prompt (em “Novo tema” → prompt manual) e cole aqui — eles entram no fim da trilha.</p>
          <textarea value={jsonStr} onChange={(e) => setJsonStr(e.target.value)} rows={5} placeholder='{ "epics": [ ... ] }' className={`${inputCls} font-mono text-xs`} />
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
          <button onClick={doAppend} disabled={busy || !jsonStr.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Anexar
          </button>
        </div>
      )}
    </div>
  );
}

function RenameBlock({ track, onChanged, onClose }: { track: TrackData; onChanged: () => void; onClose: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [summary, setSummary] = useState(track.summary ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try { await renameTrack(track.id, title.trim(), summary.trim()); onChanged(); onClose(); } finally { setBusy(false); }
  };
  return (
    <div className="mt-2 space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="título" />
      <input value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} placeholder="resumo (opcional)" />
      <div className="flex gap-2">
        <button onClick={save} disabled={busy || !title.trim()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">salvar</button>
        <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">cancelar</button>
      </div>
    </div>
  );
}

export function Track({ id, me }: { id: string; me: Me }) {
  const { data, loading, error, refetch } = useApi<TrackData>(() => getTrack(id), [id]);
  const [renaming, setRenaming] = useState(false);
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
          <button onClick={() => setRenaming(!renaming)} title="renomear tema" className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">{data.progress.done}/{data.progress.total} · {pct(data.progress)}%</span>
        </div>
        {renaming && <RenameBlock track={data} onChanged={changed} onClose={() => setRenaming(false)} />}
        {data.summary && !renaming && <p className="mt-1 text-sm text-muted-foreground">{data.summary}</p>}
        <Bar p={data.progress} className="mt-3 h-2" />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">{data.progress.done} concluídas</span>
          <span className="inline-flex items-center gap-1 text-emerald-500"><GraduationCap className="h-3.5 w-3.5" />{data.mastery} dominadas</span>
          {data.review.due.length > 0 && <span className="text-amber-500">{data.review.due.length} pra revisar hoje</span>}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Dominar ≠ concluir: uma task vira “dominada” quando você acerta ela nas revisões espaçadas até graduar.</p>
        <TargetControl track={data} onChange={changed} />
      </Card>
      {data.epics.map((e) => <EpicCard key={e.id} trackId={id} epic={e} meName={me.name} onChanged={changed} />)}
      <AppendBlock trackId={id} onChanged={changed} />
    </div>
  );
}
