import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, Check, ChevronDown, ChevronRight, FlaskConical, GraduationCap, Loader2, MessageSquarePlus, Pencil, PlusCircle, Trash2, X } from "lucide-react";
import {
  appendTrack, editTask, getTrack, removeTask, renameTrack, setTrackIcon, setTrackTarget, taskComment, taskCommentDelete, taskDone,
  ApiError, type Comment, type Epic, type Me, type Progress, type Story, type Task, type TaskPatch, type Track as TrackData,
} from "@/lib/api";
import { TrackIcon, TRACK_ICON_LIST } from "@/components/track-icon";
import { useApi } from "@/lib/useApi";
import { fmtNota, lessonStages, shortDate, timeAgo, QUIET_BTN } from "@/lib/lesson";
import { StepSegments } from "@/components/step-segments";
import { FOCUS, navigate } from "@/App";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// eyebrow padrão de zona (DESIGN-HOME §2.2) — mesma string da constante da Home
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

const pct = (p: Progress) => (p.total ? Math.round((p.done / p.total) * 100) : 0);
const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Bar({ p, className }: { p: Progress; className?: string }) {
  return <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}><div className="h-full rounded-full bg-domain transition-all" style={{ width: `${pct(p)}%` }} /></div>;
}
function DoneBox({ done, busy, onToggle }: { done: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      disabled={busy}
      title={done ? "reabrir a task" : "concluir sem estudar — a Lição registra a jornada"}
      aria-label={done ? "reabrir a task" : "concluir sem estudar — a Lição registra a jornada"}
      className={cn("relative grid h-7 w-7 shrink-0 place-items-center rounded-md border transition disabled:opacity-50 before:absolute before:-inset-1.5 before:content-['']", done ? "border-domain bg-domain text-domain-foreground" : "border-border hover:bg-accent", FOCUS)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done && <Check className="h-4 w-4" />}
    </button>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div><div className={`mb-1 ${EYEBROW}`}>{title}</div>{children}</div>;
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
            {c.author === meName && <button onClick={() => remove(i, c.at)} disabled={del !== null} className={`ml-auto grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 ${FOCUS}`}>{del === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>}
          </div>
          <p className="break-words whitespace-pre-wrap">{c.text}</p>
        </div>
      ))}
      <div className="flex items-end gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }} rows={2} placeholder="tua resposta / o que entendeu / generalização…" className="min-h-[40px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary" />
        <button onClick={submit} disabled={busy || !text.trim()} title="comentar (⌘/Ctrl+Enter)" className={`grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 ${FOCUS}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}

/* peek de leitura da task (DESIGN-LICAO-UX §1.3 / UI §7.b): só objetivo, estado da lição + CTA e anotações.
   Conteúdo pedagógico (questão, pontos-chave, resposta) mora SÓ na Lição — mostrar aqui é regressão. */
function TaskPeek({ task, meName, onStudy, onCorrection, onEdit, onComment, onDeleteComment }: { task: Task; meName: string; onStudy: () => void; onCorrection: () => void; onEdit: () => void; onComment: (t: string) => Promise<void>; onDeleteComment: (i: number, at: string) => Promise<void> }) {
  const total = lessonStages(task);
  const stage = task.lesson?.stage ?? 0;
  const inProgress = stage > 0 && stage < total;
  const concluded = stage >= total || task.done;
  const concludedAt = task.completedAt ?? task.lesson?.updatedAt ?? null;
  return (
    <div className="space-y-3 border-t border-border px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <Section title="Objetivo"><p className="text-sm leading-relaxed">{task.objective}</p></Section>
        <button onClick={onEdit} className={cn("shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline", FOCUS)}>editar conteúdo</button>
      </div>
      {/* estado da lição + CTA contextual — mesmo destino da row, redundância intencional */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {inProgress && <StepSegments current={stage} total={total} className="shrink-0" />}
          {inProgress ? (
            <span>você parou no passo <span className="font-mono tabular-nums">{stage + 1}</span> de <span className="font-mono tabular-nums">{total}</span>{task.lesson?.updatedAt && <> · {timeAgo(task.lesson.updatedAt)}</>}</span>
          ) : concluded ? (
            <>
              <span>{stage >= total ? "concluída" : "concluída sem registro de estudo"}{concludedAt && <> em <span className="font-mono tabular-nums">{shortDate(concludedAt)}</span></>}</span>
              {task.tutor && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-primary">Tutor <span className="font-mono tabular-nums">{fmtNota(task.tutor.nota)}/10</span></span>
                  <button onClick={onCorrection} className={cn("text-primary underline-offset-2 hover:underline", FOCUS)}>ver correção</button>
                </>
              )}
            </>
          ) : (
            <span>não iniciada</span>
          )}
        </div>
        {concluded && !inProgress ? (
          <button onClick={onStudy} className={cn("h-9 shrink-0", QUIET_BTN, FOCUS)}>Rever lição</button>
        ) : (
          <button onClick={onStudy} className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", FOCUS)}>
            {inProgress ? "Continuar lição" : "Estudar"} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Section title="Anotações"><Comments list={task.comments} meName={meName} onAdd={onComment} onDelete={onDeleteComment} /></Section>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";
function Fld({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1"><span className={EYEBROW}>{label}</span>{children}</label>;
}

/* editor inline da task — edita campos por tipo; remover mora aqui (exportado: a Lição reusa intocado — UI §5.c) */
export function TaskEditor({ trackId, task, onDone, onChanged }: { trackId: string; task: Task; onDone: () => void; onChanged: () => void }) {
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
        <button onClick={remove} disabled={busy} className={`ml-auto inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 ${FOCUS}`}>
          <Trash2 className="h-4 w-4" /> remover task
        </button>
      </div>
    </div>
  );
}

function TaskRow({ trackId, task, meName, defaultOpen = false, onChanged }: { trackId: string; task: Task; meName: string; defaultOpen?: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const toggleDone = async () => {
    setBusy(true);
    try {
      await taskDone(trackId, task.id, !task.done);
      const total = lessonStages(task);
      if (!task.done && (task.lesson?.stage ?? 0) < total) setAnnounce("concluída sem registro de estudo");
      onChanged();
    } finally { setBusy(false); }
  };
  const addC = async (t: string) => { await taskComment(trackId, task.id, t); onChanged(); };
  const delC = async (i: number, at: string) => { await taskCommentDelete(trackId, task.id, i, at); onChanged(); };
  // a row inteira é o convite pra Lição (UX §1.3): tocar no título ABRE a Lição; o chevron só espia
  const goLesson = () => navigate(`/t/${encodeURIComponent(trackId)}/l/${encodeURIComponent(task.id)}`);
  const total = lessonStages(task);
  const stage = task.lesson?.stage ?? 0;
  const inProgress = !task.done && stage > 0 && stage < total; // único estado com selo — o "você parou aqui" da árvore
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 p-2.5">
        <span aria-live="polite" className="sr-only">{announce}</span>
        <DoneBox done={task.done} busy={busy} onToggle={toggleDone} />
        <button onClick={goLesson} title="abrir a lição" className={`-mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left transition-colors hover:bg-accent/60 ${FOCUS}`}>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{task.id}</span>
          {task.type === "practice" && <span className="shrink-0" title="prática"><FlaskConical className="h-3.5 w-3.5 text-muted-foreground" aria-label="prática" /></span>}
          <span className={cn("min-w-0 flex-1 truncate text-sm", task.done && "text-muted-foreground line-through")}>{task.title}</span>
          {inProgress && (
            <span title={`você parou no passo ${stage + 1} de ${total}`} className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-primary/10 px-1.5 font-mono text-[10px] tabular-nums text-primary">{stage + 1}/{total}</span>
          )}
          {/* badge da nota (TUTOR-VISIBILIDADE §c): contornado = registro permanente; pill cheia = progresso transitório */}
          {task.tutor && (
            <span
              title={`correção do Tutor: ${fmtNota(task.tutor.nota)}/10`}
              className="inline-flex h-[18px] shrink-0 items-center rounded-[5px] border border-primary/25 bg-primary/5 px-1.5 font-mono text-[10px] tabular-nums text-primary"
            >
              {fmtNota(task.tutor.nota)}/10
            </span>
          )}
          {task.review?.graduated && <span className="shrink-0 text-domain" title="dominada"><GraduationCap className="h-3.5 w-3.5" aria-label="dominada" /></span>}
        </button>
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "fechar detalhes" : "ver detalhes"} title={open ? "fechar detalhes" : "ver detalhes"} className={cn("relative grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-accent hover:text-foreground", FOCUS)}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      {open && (editing
        ? <TaskEditor trackId={trackId} task={task} onDone={() => setEditing(false)} onChanged={onChanged} />
        : <TaskPeek task={task} meName={meName} onStudy={goLesson} onEdit={() => setEditing(true)} onCorrection={() => navigate(`/t/${encodeURIComponent(trackId)}/l/${encodeURIComponent(task.id)}?correcao=1`)} onComment={addC} onDeleteComment={delC} />)}
    </div>
  );
}

function StoryBlock({ trackId, story, meName, defaultOpen, openTaskId, onChanged }: { trackId: string; story: Story; meName: string; defaultOpen: boolean; openTaskId?: string; onChanged: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button onClick={() => setOpen(!open)} className={`flex w-full items-center gap-2 rounded-lg p-2.5 text-left ${FOCUS}`}>
        {story.progress.done === story.progress.total && story.progress.total > 0 && (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-domain text-domain-foreground" title="concluída"><Check className="h-3 w-3" /></span>
        )}
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{story.id}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{story.title}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{story.progress.done}/{story.progress.total}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />}
      </button>
      {open && <div className="space-y-2 px-1.5 pb-1.5 sm:px-2 sm:pb-2">{story.tasks.map((t) => <TaskRow key={t.id} trackId={trackId} task={t} meName={meName} defaultOpen={t.id === openTaskId} onChanged={onChanged} />)}</div>}
    </div>
  );
}

function EpicCard({ trackId, epic, meName, defaultOpen, openStoryId, openTaskId, onChanged }: { trackId: string; epic: Epic; meName: string; defaultOpen: boolean; openStoryId?: string; openTaskId?: string; onChanged: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden p-0">
      <button onClick={() => setOpen(!open)} className={`flex w-full items-start gap-2.5 p-3 text-left ${FOCUS}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {epic.progress.done === epic.progress.total && epic.progress.total > 0 && (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-domain text-domain-foreground" title="concluído"><Check className="h-3 w-3" /></span>
            )}
            <span className="font-mono text-xs text-muted-foreground">Epic {epic.id}</span>
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{epic.title}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{epic.progress.done}/{epic.progress.total}</span>
            {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />}
          </div>
          {epic.goal && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{epic.goal}</p>}
          <Bar p={epic.progress} className="mt-1.5" />
        </div>
      </button>
      {open && <div className="space-y-2 border-t border-border bg-background/40 p-2 sm:p-3">{epic.stories.map((s) => <StoryBlock key={s.id} trackId={trackId} story={s} meName={meName} defaultOpen={s.id === openStoryId} openTaskId={s.id === openStoryId ? openTaskId : undefined} onChanged={onChanged} />)}</div>}
    </Card>
  );
}

function TargetControl({ track, onChange }: { track: TrackData; onChange: () => void }) {
  // ?prova=1 vem do convite da Home (DESIGN-ENGAJAMENTO §3.d): abre o campo já na tela e em
  // foco, uma vez só. Sem o parâmetro nada muda aqui.
  const [veioDoConvite] = useState(() => new URLSearchParams(window.location.search).has("prova"));
  const [editing, setEditing] = useState(veioDoConvite);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const dataRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!veioDoConvite) return;
    navigate(window.location.pathname, { replace: true }); // o parâmetro some da URL
    requestAnimationFrame(() => { dataRef.current?.scrollIntoView({ block: "center" }); dataRef.current?.focus(); });
  }, [veioDoConvite]);
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
      <input ref={dataRef} type="date" min={today} defaultValue={track.targetDate ?? ""} disabled={busy}
        onChange={(e) => e.target.value && save(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
      <span className="text-muted-foreground">data da prova — as revisões se ajustam a ela</span>
      {track.targetDate && <button onClick={() => save(null)} className="text-destructive hover:underline">remover</button>}
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
      <button onClick={() => setOpen(!open)} className={`flex w-full items-center gap-2 rounded-lg p-3 text-left text-xs text-muted-foreground hover:text-foreground ${FOCUS}`}>
        <PlusCircle className="h-3.5 w-3.5" /> Adicionar conteúdo (colar JSON de epics)
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

/* picker de ícone do tema (DESIGN-TEMA-ICONE §9): sheet de tela cheia no idioma da TutorSheet;
   salva sozinho ao tocar e fecha; X/Esc fecham sem trocar */
function IconPicker({ track, onChanged, onClose }: { track: TrackData; onChanged: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const currentRef = useRef<HTMLButtonElement>(null);
  const current = track.icon ?? "target";
  useEffect(() => { currentRef.current?.focus(); }, []); // entra com foco na célula selecionada
  const pick = async (name: string) => {
    if (busy) return;
    setBusy(name);
    try { await setTrackIcon(track.id, name); onChanged(); onClose(); } finally { setBusy(null); }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="escolher ícone do tema"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
    >
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-4">
        <div className="flex items-center gap-2">
          <button onClick={onClose} aria-label="fechar sem trocar" title="fechar sem trocar" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">ícone do tema · {track.title}</p>
        </div>
        <div className="mt-6 grid grid-cols-6 justify-items-center gap-2 sm:grid-cols-8">
          {TRACK_ICON_LIST.map(([name, Icon, label]) => (
            <button
              key={name}
              ref={name === current ? currentRef : undefined}
              onClick={() => pick(name)}
              disabled={!!busy}
              aria-label={label}
              aria-pressed={name === current}
              title={label}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-lg border transition-colors disabled:opacity-50",
                name === current ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                FOCUS,
              )}
            >
              {busy === name ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Track({ id, me }: { id: string; me: Me }) {
  const { data, loading, error, refetch } = useApi<TrackData>(() => getTrack(id), [id]);
  const [renaming, setRenaming] = useState(false);
  const [picking, setPicking] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const changed = () => refetch(true);
  const closePicker = () => { setPicking(false); requestAnimationFrame(() => chipRef.current?.focus()); };
  if (loading && !data) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (error) return <Card className="p-4 text-sm text-destructive">erro: {error}</Card>;
  if (!data) return null;
  // retomada inteligente (DESIGN-ESTUDO §2): só o caminho até a 1ª task pendente nasce aberto.
  // defaultOpen alimenta o useState inicial; keys estáveis garantem que refetch não re-colapsa o que o usuário abriu.
  const firstPending = data.epics
    .flatMap((e) => e.stories.flatMap((s) => s.tasks.map((t) => ({ e: e.id, s: s.id, t }))))
    .find((x) => !x.t.done);
  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/")} className={`inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground ${FOCUS}`}><ArrowLeft className="h-4 w-4" /> temas</button>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <button
            ref={chipRef}
            onClick={() => setPicking(true)}
            aria-haspopup="dialog"
            aria-label="escolher ícone do tema"
            title="escolher ícone do tema"
            className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary/15 hover:ring-2 hover:ring-primary/30", FOCUS)}
          >
            <TrackIcon name={data.icon} className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{data.title}</h1>
          <button onClick={() => setRenaming(!renaming)} title="renomear tema" aria-label="renomear tema" className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent ${FOCUS}`}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">{data.progress.done}/{data.progress.total} · {pct(data.progress)}%</span>
        </div>
        {renaming && <RenameBlock track={data} onChanged={changed} onClose={() => setRenaming(false)} />}
        {data.summary && !renaming && <p className="mt-1 text-sm text-muted-foreground">{data.summary}</p>}
        <Bar p={data.progress} className="mt-3 h-2" />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground"><span className="font-mono tabular-nums">{data.progress.done}</span> concluídas</span>
          <span className="inline-flex items-center gap-1 text-domain"><GraduationCap className="h-3.5 w-3.5" /><span className="font-mono tabular-nums">{data.mastery}</span> dominadas</span>
        </div>
        {data.mastery === 0 && <p className="mt-1 text-[11px] text-muted-foreground/70">Dominar ≠ concluir: uma task vira “dominada” quando você acerta ela nas revisões espaçadas até graduar.</p>}
        <TargetControl track={data} onChange={changed} />
      </Card>
      {data.epics.map((e) => (
        <EpicCard key={e.id} trackId={id} epic={e} meName={me.name} defaultOpen={e.id === firstPending?.e} openStoryId={e.id === firstPending?.e ? firstPending?.s : undefined} openTaskId={e.id === firstPending?.e ? firstPending?.t.id : undefined} onChanged={changed} />
      ))}
      <AppendBlock trackId={id} onChanged={changed} />
      {picking && <IconPicker track={data} onChanged={changed} onClose={closePicker} />}
    </div>
  );
}
