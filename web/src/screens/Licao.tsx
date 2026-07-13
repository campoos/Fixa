import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Eye, GraduationCap, Lightbulb, Loader2, Pencil, RefreshCw, TriangleAlert, X } from "lucide-react";
import { ApiError, getConfig, getTrack, lessonSubmit, taskComment, tutorCorrect, type Epic, type Story, type Task, type Track as TrackData, type Tutor } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { usePersistentState } from "@/lib/usePersistentState";
import { fmtNota, lessonStages, shortDate, timeAgo, QUIET_BTN } from "@/lib/lesson";
import { StepSegments } from "@/components/step-segments";
import { RichText } from "@/components/rich-text";
import { FOCUS, navigate } from "@/App";
import { TaskEditor } from "@/screens/Track";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* A Lição (DESIGN-LICAO-UX + DESIGN-LICAO-UI): o segundo player do app, irmão do Revisar em tinta violeta.
   Transcript-diário (neutro = usuário · violeta = pontos-chave · esmeralda = resposta-modelo) + dock de envio. */

// eyebrow dos blocos do transcript (UI §4) — um degrau menor que o de zona (10px)
const EYEBROW10 = "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground";
// chip de atalho de teclado dentro do botão de envio (UI §5.a) — desktop only, decorativo
const KBD = "hidden h-[18px] items-center rounded border border-transparent px-1 font-mono text-[10px] sm:inline-flex";
// válvula/ação secundária do dock (UI §5.a.4) — link de texto com área de toque estendida
const VALVE_BTN = "py-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50";
// animação do bloco recém-nascido (UI §4.h): fade in-place, sem slide — histórico renderiza sem replay
const BORN = "duration-200 motion-safe:animate-in motion-safe:fade-in";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── blocos do transcript (UI §4) ── */

// resposta enviada — somente leitura, sem nenhuma affordance de edição: enviado é enviado (UX §0.2)
function AnswerBlock({ label, text, when, className }: { label: string; text: string; when?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3.5", className)}>
      <div className="flex items-baseline gap-2">
        <p className={EYEBROW10}>{label}</p>
        {when && <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70">{when}</span>}
      </div>
      {text.trim() ? (
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{text}</p>
      ) : (
        <p className="mt-1.5 text-sm italic text-muted-foreground/70">(em branco — deu branco aqui)</p>
      )}
    </div>
  );
}

// slot de conteúdo faltando (UX §6.1): a lição não trava — avisa e oferece a edição
function MissingSlot({ text, onEdit, className }: { text: string; onEdit: () => void; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-muted/40 p-3.5 text-center", className)}>
      <p className="text-xs text-muted-foreground">{text}</p>
      <button onClick={onEdit} className={cn("mt-1 text-xs text-primary underline-offset-2 hover:underline", FOCUS)}>editar conteúdo da task</button>
    </div>
  );
}

// material de execução da prática: é o "contexto" do método — revelado após a tentativa fria, como os
// pontos-chave da teórica (mesma tinta violeta = conteúdo revelado)
function PracticeMaterial({ task, className }: { task: Task; className?: string }) {
  const sec = (title: string, body: ReactNode) => <div><p className={`mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary`}>{title}</p>{body}</div>;
  return (
    <div className={cn("space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5", className)}>
      {!!task.steps?.length && sec("passo a passo", (
        <ol className="space-y-1 text-sm leading-relaxed">{task.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span><RichText text={s} className="min-w-0 flex-1" /></li>)}</ol>
      ))}
      {task.hint && sec("dica", <RichText text={task.hint} className="text-muted-foreground" />)}
      {task.snippet && sec("exemplo", <pre className="overflow-x-auto rounded-md border border-border bg-background p-2.5 font-mono text-xs"><code>{task.snippet}</code></pre>)}
    </div>
  );
}

// convite do Tutor (UI §6.a.4) — tracejado violeta, opcional, nunca bloqueia
function TutorInvite({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={cn("flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10", FOCUS)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Ver correção do Tutor</span>
        <span className="block text-xs text-muted-foreground">nota + o que acertou e o que faltou</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
    </button>
  );
}

/* sheet de correção do Tutor (UI §6.c) — overlay em cima da Lição; fechar devolve à Lição concluída */
function TutorSheet({ taskId, tutor, busy, error, finalAnswer, dicaSaved, dicaBusy, onSaveDica, onRetry, onClose }: {
  taskId: string; tutor: Tutor | null; busy: boolean; error: string | null; finalAnswer: string;
  dicaSaved: boolean; dicaBusy: boolean; onSaveDica: () => void; onRetry: () => void; onClose: () => void;
}) {
  const items = tutor
    ? [
        ...tutor.acertos.map((t) => ({ icon: <Check className="mt-0.5 h-4 w-4 shrink-0 text-domain" aria-hidden="true" />, text: t, key: `a${t}` })),
        ...tutor.gaps.map((t) => ({ icon: <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-recall" aria-hidden="true" />, text: t, key: `g${t}` })),
        ...(tutor.dica ? [{ icon: <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />, text: tutor.dica, key: "dica" }] : []),
      ]
    : [];
  return (
    <div role="dialog" aria-modal="true" aria-label="correção do Tutor" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} className="fixed inset-0 z-50 overflow-y-auto bg-background duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-4">
        <div className="flex items-center gap-2">
          <button onClick={onClose} aria-label="voltar ao estudo" title="voltar ao estudo" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">correção do tutor · task {taskId}</p>
        </div>
        {busy ? (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground motion-safe:animate-pulse"><GraduationCap className="h-7 w-7" /></div>
            <p className="mt-4 text-sm text-muted-foreground">lendo sua jornada nesta task…</p>
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/70">resposta fria + reescrita + resposta final</p>
          </div>
        ) : error ? (
          // a Lição já está concluída — a sheet nunca ameaça nada; retry é manual (502 transitório)
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={onRetry} className={cn("mt-4", QUIET_BTN, FOCUS)}>tentar de novo</button>
          </div>
        ) : tutor ? (
          <>
            <div className="mt-8 text-center">
              <p><span className="font-mono text-[56px] font-semibold leading-none tracking-[-0.04em] text-primary tabular-nums">{fmtNota(tutor.nota)}</span><span className="font-mono text-sm text-muted-foreground">/10</span></p>
              <p className="mx-auto mt-2 max-w-[40ch] text-center text-[15px] font-semibold text-balance">{tutor.veredito}</p>
            </div>
            <AnswerBlock className="mt-6" label="sua resposta final" text={finalAnswer} />
            <div className="mt-4 grid gap-2">
              {items.map((it) => (
                <div key={it.key} className="flex gap-2.5 rounded-lg border border-border bg-card p-3 text-[13px] leading-relaxed text-muted-foreground">
                  {it.icon}<span>{it.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2.5">
              {tutor.dica && (
                <button onClick={onSaveDica} disabled={dicaSaved || dicaBusy} className={cn("w-full justify-center disabled:opacity-60", QUIET_BTN, FOCUS)}>
                  {dicaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : dicaSaved ? <Check className="h-4 w-4 text-domain" /> : null}
                  {dicaSaved ? "dica salva nas anotações" : "salvar dica nas anotações"}
                </button>
              )}
              <button onClick={onClose} className={cn("flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/85", FOCUS)}>
                voltar ao estudo
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
              correção por IA — pode errar; desconfie, confira, aprenda. O Tutor corrige com base no material da task.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function LicaoSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-5 w-64" />
      <Skeleton className="mt-4 h-[120px] rounded-xl" />
      <Skeleton className="mt-3 h-[180px] rounded-lg" />
    </div>
  );
}

/* ── a tela ── */

export function Licao({ trackId, taskId }: { trackId: string; taskId: string }) {
  const { data, error, refetch } = useApi<TrackData>(() => getTrack(trackId), [trackId]);
  const { data: config, refetch: refetchConfig } = useApi(getConfig, []);

  // rascunho não enviado persiste localmente por task (UX §2.0) — nunca vira registro
  const [draft, setDraft] = usePersistentState(`fx-licao-draft-${trackId}:${taskId}`, "");
  // override otimista da lesson: o envio atualiza na hora; o refetch silencioso confirma
  const [override, setOverride] = useState<{ stage: number; answers: string[]; updatedAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [live, setLive] = useState("");
  const [bornStage, setBornStage] = useState<number | null>(null); // stage recém-atingido nesta sessão (anima só o novo)
  const [acted, setActed] = useState(false); // já enviou/refez nesta sessão? (o marcador de retomada some no 1º gesto)
  const [justConcluded, setJustConcluded] = useState(false);
  const [reused, setReused] = useState(false);
  const [studying, setStudying] = useState(false); // Done sem lesson → "Estudar mesmo assim" (UX §5)
  const [editing, setEditing] = useState(false);
  // Tutor
  const [sheet, setSheet] = useState(false);
  const [tutorLocal, setTutorLocal] = useState<Tutor | null>(null);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorErr, setTutorErr] = useState<string | null>(null);
  const [dicaSaved, setDicaSaved] = useState(false);
  const [dicaBusy, setDicaBusy] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const doneTitleRef = useRef<HTMLParagraphElement>(null);
  const tutorCardRef = useRef<HTMLButtonElement>(null);
  const initRef = useRef(false);

  // localizar a task (loop barato — os temas têm dezenas de tasks, não milhares)
  let found: { epic: Epic; story: Story; task: Task } | null = null;
  if (data) {
    for (const e of data.epics) for (const s of e.stories) for (const t of s.tasks) if (t.id === taskId) found = { epic: e, story: s, task: t };
  }

  const task = found?.task ?? null;
  const isPractice = task?.type === "practice";
  const M = task ? lessonStages(task) : 3;
  const lesson = override ?? task?.lesson ?? null;
  const stage = Math.min(lesson?.stage ?? 0, M);
  const answers = lesson?.answers ?? [];
  const complete = stage >= M;
  const hasKeys = !!task && !isPractice && !!task.keyPoints?.length;
  const hasQuestion = !!task?.sample.q.trim();
  const tutor = tutorLocal ?? task?.tutor ?? null;
  const usage = config?.tutor ?? null;
  const saldo = usage ? usage.used < usage.limit : true; // config ainda carregando: otimista — o server é quem barra
  const isPro = config?.plan === "pro";

  type Mode = "blocked" | "reading" | "doneNoLesson" | "active";
  const mode: Mode = !task ? "active"
    : !hasQuestion && stage === 0 && !complete ? "blocked"
    : complete ? "reading"
    : task.done && stage === 0 && !studying ? "doneNoLesson"
    : "active";

  // próxima pendente depois desta — o loop de sessão de estudo (UX §2.5)
  const flat = data ? data.epics.flatMap((e) => e.stories.flatMap((s) => s.tasks)) : [];
  const curIdx = flat.findIndex((t) => t.id === taskId);
  const next = curIdx >= 0 ? flat.slice(curIdx + 1).find((t) => !t.done) ?? null : null;

  const exit = () => navigate(`/t/${encodeURIComponent(trackId)}`); // sai sem diálogo — nada a perder (UX §2.7)

  // posicionamento inicial: retomada acha o presente sem scroll manual (UX §3.2 / UI §4.h)
  useEffect(() => {
    if (!found || initRef.current) return;
    initRef.current = true;
    const t = found.task;
    const m = lessonStages(t);
    const st = Math.min(t.lesson?.stage ?? 0, m);
    // deep-link da árvore (TUTOR-VISIBILIDADE §b): abre direto a sheet da correção, se ela existe
    const wantsSheet = new URLSearchParams(window.location.search).get("correcao") === "1";
    requestAnimationFrame(() => {
      // passo 2 retomado: campo pré-preenchido com a resposta fria, se não há rascunho local
      if (st === 1 && !draft) setDraft(t.lesson?.answers[0] ?? "");
      if (st >= m) { if (wantsSheet && t.tutor) { setSheet(true); return; } topRef.current?.focus(); return; }
      if (t.done && st === 0) return; // "concluída sem registro": não rouba foco
      if (!t.sample.q.trim()) return; // bloqueio sem questão-modelo
      if (st > 0) markerRef.current?.scrollIntoView({ block: "center" });
      taRef.current?.focus({ preventScroll: st > 0 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found]);

  // avanço de passo: foco no campo + dock em vista; conclusão: foco no título (UI §8)
  useEffect(() => {
    if (bornStage === null) return;
    requestAnimationFrame(() => {
      if (bornStage >= M) { doneTitleRef.current?.focus(); doneTitleRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "nearest" }); }
      else {
        dockRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "nearest" });
        taRef.current?.focus({ preventScroll: true });
      }
    });
  }, [bornStage, M]);

  // auto-grow do textarea até o teto (max-h clampa via CSS) — o teto garante transcript visível com teclado aberto
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, stage, mode]);

  const doSubmit = async (allowBlank: boolean) => {
    if (busy || !task) return;
    const text = draft.trim();
    const isFinal = stage === M - 1;
    if (!text && (!allowBlank || isFinal)) return; // final nunca tem válvula — vazia não conclui (UX §2.4)
    setBusy(true); setErr(null);
    try {
      const r = await lessonSubmit(trackId, taskId, { answer: text, ...(text ? {} : { blank: true }) });
      setOverride({ stage: r.stage, answers: [...answers, text], updatedAt: new Date().toISOString() });
      setBornStage(r.stage);
      setActed(true); // passado e presente se fundem no primeiro envio da sessão
      setConflict(false);
      if (r.stage >= M) {
        setDraft("");
        setJustConcluded(true);
        setLive("task concluída — ela volta pra revisão amanhã");
        if (r.becameDone) window.dispatchEvent(new Event("fx-review-changed"));
      } else {
        if (r.stage === M - 1) setDraft(""); // passo final começa vazio (a resposta é SUA palavra)
        setLive(r.stage === 1
          ? (isPractice ? "resposta enviada — passo a passo revelado" : hasKeys ? "resposta enviada — pontos-chave revelados" : "resposta enviada")
          : "resposta enviada — resposta-modelo revelada");
      }
      refetch(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // esta lição avançou em outra aba — recarrega o estado do server (UX §6.4)
        setOverride(null); setConflict(true); setActed(true); refetch(true);
      } else {
        setErr("não consegui salvar — tenta de novo"); // texto permanece no campo, nada é descartado
      }
    } finally { setBusy(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSubmit(false); } // Enter envia · Shift+Enter quebra
  };

  const requestTutor = async () => {
    setTutorBusy(true); setTutorErr(null);
    try {
      const r = await tutorCorrect(trackId, taskId);
      setTutorLocal(r.tutor);
      refetch(true); refetchConfig(true);
    } catch (e) {
      setTutorErr(e instanceof ApiError ? e.message : "falha ao chamar o Tutor — tenta de novo");
    } finally { setTutorBusy(false); }
  };
  const openSheet = () => { setSheet(true); if (!tutor && !tutorBusy) requestTutor(); };
  const closeSheet = () => {
    if (window.location.search) window.history.replaceState({}, "", window.location.pathname); // refresh não reabre a sheet
    setSheet(false); setTutorErr(null);
    requestAnimationFrame(() => tutorCardRef.current?.focus()); // devolve o foco ao card do Tutor (UI §8)
  };
  const saveDica = async () => {
    if (!tutor?.dica || dicaSaved || dicaBusy) return;
    setDicaBusy(true);
    try { await taskComment(trackId, taskId, `dica do Tutor: ${tutor.dica}`); setDicaSaved(true); refetch(true); } finally { setDicaBusy(false); }
  };

  // refazer (UX §5): resposta final + correção viram anotações; lesson reinicia; Done permanece
  const refazer = async () => {
    if (busy || !lesson) return;
    if (!confirm("Refazer substitui suas respostas desta lição — a resposta final e a correção anterior ficam nas anotações. O Done permanece.")) return;
    setBusy(true);
    try {
      const finalAnswer = answers[answers.length - 1] ?? "";
      if (finalAnswer.trim()) await taskComment(trackId, taskId, `resposta final anterior: ${finalAnswer}`);
      if (tutor) await taskComment(trackId, taskId, `correção do Tutor anterior — nota ${fmtNota(tutor.nota)}/10: ${tutor.veredito}${tutor.dica ? `\ndica: ${tutor.dica}` : ""}`);
      await lessonSubmit(trackId, taskId, { restart: true });
      setOverride({ stage: 0, answers: [], updatedAt: new Date().toISOString() });
      // a task segue Done + stage 0 = mesmo shape do "doneNoLesson" — studying diz que a lição está ATIVA
      setStudying(true);
      setJustConcluded(false); setBornStage(null); setActed(true); setReused(false); setDraft("");
      setLive("lição reiniciada — responda de cabeça");
      refetch(true);
      requestAnimationFrame(() => taRef.current?.focus());
    } finally { setBusy(false); }
  };

  /* ── estados de página ── */
  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Card className="gap-0 p-4 text-sm text-destructive">erro: {error}</Card>
        <button onClick={exit} className={cn("mt-3", QUIET_BTN, FOCUS)}>Voltar ao tema</button>
      </div>
    );
  }
  if (!data) return <LicaoSkeleton />;
  if (!task) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Card className="gap-0 p-4 text-sm text-destructive">esta task não existe mais</Card>
        <button onClick={exit} className={cn("mt-3", QUIET_BTN, FOCUS)}>Voltar ao tema</button>
      </div>
    );
  }

  const concludedAt = task.completedAt ?? lesson?.updatedAt ?? null;
  const answerLabels = isPractice ? ["sua tentativa · frio", "sua tentativa · com o passo a passo", "sua resposta final"] : ["sua resposta · frio", "sua resposta · com os pontos-chave", "sua resposta final"];
  const when = (i: number) => (lesson && i === answers.length - 1 ? timeAgo(lesson.updatedAt) : undefined);
  const born = (s: number) => (bornStage === s ? BORN : "");
  const modelRevealAt = 2;
  const prevAnswer = (answers[M - 2] ?? "").trim();

  // rótulo/botão/válvula do passo ativo (microcopy UX §7; retomada ajusta o rótulo — UX §3.2)
  const isFinal = stage === M - 1;
  const meta = isFinal
    ? { label: "agora que conferiu: reescreve com a TUA palavra — é o que você leva desta task", btn: "Enviar e concluir", valve: null as string | null, placeholder: "o que você leva desta task?" }
    : stage === 0
      ? isPractice
        ? { label: "tenta fazer de cabeça, sem ver o passo a passo — é isso que fixa", btn: "Enviar e ver passo a passo", valve: "deu branco — mostrar passo a passo", placeholder: "escreve o que você fez ou tentaria fazer…" }
        : { label: "responda de cabeça, escrevendo — é isso que fixa", btn: hasKeys ? "Enviar e ver pontos-chave" : "Enviar e continuar", valve: hasKeys ? "deu branco — mostrar pontos-chave" : "deu branco — continuar", placeholder: "escreve do jeito que sair…" }
      : isPractice
        ? { label: "agora com o passo a passo: fez? conta o que você fez e o que deu", btn: "Enviar e revelar resposta", valve: "não consegui fazer — mostrar o esperado", placeholder: "escreve do jeito que sair…" }
        : {
            label: !acted ? "releia sua resposta acima — achou gaps? reescreve completa" : "achou gaps? reescreve a resposta — agora completa",
            btn: "Enviar e revelar resposta", valve: "não mudou nada — revelar resposta", placeholder: "escreve do jeito que sair…",
          };

  const counter = usage && (
    <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground/70">
      correções: {usage.used}/{usage.limit} {isPro ? "do mês" : "da degustação"}
    </p>
  );
  const exhausted = (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
      {isPro ? (
        <>correções do mês esgotadas — renova no dia 1º</>
      ) : (
        <>correções da degustação esgotadas · <button onClick={() => navigate("/pro")} className={cn("text-primary underline-offset-2 hover:underline", FOCUS)}>conhecer o Pro</button></>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="sr-only">Lição — {task.title}</h1>
      <div aria-live="polite" className="sr-only">{live}</div>

      {/* header da Lição (UI §3) — sticky sob o header do app, mesma linguagem de vidro */}
      <div className="sticky top-14 z-20 -mx-4 bg-background/85 px-4 pb-3 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={exit} aria-label="sair da lição" title="sair da lição" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground/70">
            {data.title} · {found!.story.title} · <span className="text-muted-foreground">task {task.id}</span>
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-3 pl-10">
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{task.title}</p>
          {complete || (task.done && mode !== "active") ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-domain">
              <Check className="h-3.5 w-3.5" /> concluída{concludedAt && <> · <span className="font-mono tabular-nums">{shortDate(concludedAt)}</span></>}
            </span>
          ) : (
            <span role="img" aria-label={`passo ${stage + 1} de ${M}`} title={`passo ${stage + 1} de ${M}`} className="flex shrink-0 items-center gap-1.5">
              <StepSegments current={stage} total={M} />
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{stage + 1}/{M}</span>
            </span>
          )}
          <button onClick={() => setEditing(!editing)} aria-label="editar conteúdo da task" title="editar conteúdo da task" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", editing && "text-primary", FOCUS)}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* edição de conteúdo durante a lição (UX §6.1): TaskEditor intocado, em bloco no topo do transcript */}
      {editing && (
        <div className="mt-4 rounded-lg border border-border bg-card">
          <TaskEditor trackId={trackId} task={task} onDone={() => setEditing(false)} onChanged={() => refetch(true)} />
        </div>
      )}

      {mode === "blocked" ? (
        // único caso em que a Lição não abre o passo 1: sem questão-modelo não há o que perguntar (UX §6.1)
        <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">esta task ainda não tem questão-modelo</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {!editing && <button onClick={() => setEditing(true)} className={cn(QUIET_BTN, FOCUS)}>editar conteúdo</button>}
            <button onClick={exit} className={cn(QUIET_BTN, FOCUS)}>Voltar ao tema</button>
          </div>
        </div>
      ) : mode === "doneNoLesson" ? (
        // Done só pelo checkbox: sem transcript — a Lição continua disponível como re-estudo (UX §5)
        <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">concluída sem registro de estudo</p>
          <button onClick={() => { setStudying(true); requestAnimationFrame(() => taRef.current?.focus()); }} className={cn("mt-4", QUIET_BTN, FOCUS)}>Estudar mesmo assim</button>
        </div>
      ) : (
        <>
          {/* transcript (UI §4): neutro = usuário · violeta = pontos-chave · esmeralda = resposta-modelo */}
          <div ref={topRef} tabIndex={-1} className="mt-4 space-y-3 outline-none">
            {/* capa do modo leitura (TUTOR-VISIBILIDADE §a.1): quem reabre lição corrigida vê a nota de cara */}
            {complete && tutor && !justConcluded && (
              <button ref={tutorCardRef} onClick={openSheet} className={cn("flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10", FOCUS)}>
                <span className="shrink-0"><span className="font-mono text-xl font-semibold tabular-nums text-primary">{fmtNota(tutor.nota)}</span><span className="font-mono text-[11px] text-muted-foreground">/10</span></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">correção do Tutor</span>
                  <span className="block truncate text-xs text-muted-foreground">{tutor.veredito}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </button>
            )}
            <Card className="gap-0 rounded-xl border-border bg-card p-4 shadow-sm">
              <p className={EYEBROW10}>{isPractice ? "exercício" : "questão-modelo"}</p>
              <p className="mt-1.5 text-[17px] font-semibold leading-snug text-balance">{isPractice ? task.objective : task.sample.q}</p>
              {isPractice && <p className="mt-1.5 text-sm text-muted-foreground">{task.sample.q}</p>}
            </Card>

            {stage >= 1 && <AnswerBlock label={answerLabels[0]} text={answers[0] ?? ""} when={when(0)} className={born(1)} />}

            {isPractice && stage >= 1 && <PracticeMaterial task={task} className={born(1)} />}

            {!isPractice && stage >= 1 && (hasKeys ? (
              <div className={cn("space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3.5", born(1))}>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">pontos-chave</p>
                <ul className="space-y-1">{task.keyPoints!.map((k, i) => <li key={i} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><RichText text={k} className="min-w-0 flex-1" /></li>)}</ul>
              </div>
            ) : (
              <MissingSlot text="esta task está sem pontos-chave" onEdit={() => setEditing(true)} className={born(1)} />
            ))}

            {stage >= 2 && <AnswerBlock label={answerLabels[1]} text={answers[1] ?? ""} when={when(1)} className={born(2)} />}

            {stage >= modelRevealAt && (task.sample.a.trim() ? (
              <div className={cn("rounded-lg border border-domain/25 bg-domain/5 p-3.5", born(modelRevealAt))}>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-domain">resposta</p>
                {isPractice && task.expected && <div className="mt-1.5 rounded-md border border-domain/25 bg-domain/5 p-2 text-sm"><p className="mb-0.5 font-medium text-domain">esperado</p><RichText text={task.expected} /></div>}
                <RichText text={task.sample.a} className="mt-1.5 text-foreground" />
              </div>
            ) : (
              <MissingSlot text="esta task está sem resposta-modelo" onEdit={() => setEditing(true)} className={born(modelRevealAt)} />
            ))}

            {stage >= M && <AnswerBlock label="sua resposta final" text={answers[M - 1] ?? ""} when={when(M - 1)} className={born(M)} />}

            {/* marcador de retomada (UI §4.f) — o único âmbar da Lição: o olho cai nele primeiro */}
            {!acted && stage > 0 && stage < M && lesson && (
              <div ref={markerRef} role="separator" className="my-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-recall/40" />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-recall">você parou aqui · {timeAgo(lesson.updatedAt)}</span>
                <span className="h-px flex-1 bg-recall/40" />
              </div>
            )}

          </div>

          {mode === "reading" && justConcluded ? (
            /* o momento Done (UI §6.a): sóbrio — chip esmeralda + método; convite do Tutor discreto e opcional */
            <Card className={cn("mt-3 gap-0 rounded-xl p-6 text-center", born(M))}>
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain"><Check className="h-5 w-5" /></div>
              <p ref={doneTitleRef} tabIndex={-1} className="mt-4 font-semibold outline-none">Task concluída</p>
              <p className="mt-1 text-sm text-muted-foreground">ela volta pra revisão amanhã — é o espaçamento trabalhando.</p>
              {tutor ? (
                /* slot corrigido (TUTOR-VISIBILIDADE §a.2): a nota é a protagonista — a correção já foi gasta */
                <div className="mt-4">
                  <p>
                    <span className="font-mono text-4xl font-semibold leading-none tracking-[-0.02em] text-primary tabular-nums">{fmtNota(tutor.nota)}</span>
                    <span className="font-mono text-xs text-muted-foreground">/10</span>
                  </p>
                  <p className="mx-auto mt-1.5 max-w-[40ch] text-sm text-muted-foreground text-balance">{tutor.veredito}</p>
                  <button ref={tutorCardRef} onClick={openSheet} className={cn("mt-2 text-xs text-primary underline-offset-2 hover:underline", FOCUS)}>
                    ver correção completa
                  </button>
                </div>
              ) : (
                <div className="mt-4">{saldo ? <><TutorInvite onOpen={openSheet} />{counter}</> : exhausted}</div>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button onClick={exit} className={cn(QUIET_BTN, FOCUS)}>Voltar ao tema</button>
                {next && (
                  <button onClick={() => navigate(`/t/${encodeURIComponent(trackId)}/l/${encodeURIComponent(next.id)}`)} className={cn(QUIET_BTN, FOCUS)}>
                    Próxima: <span className="font-mono text-xs tabular-nums">{next.id}</span> <span className="max-w-[240px] truncate">{next.title}</span> <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={refazer} disabled={busy} className={cn("disabled:opacity-50", QUIET_BTN, FOCUS)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refazer lição
                </button>
              </div>
            </Card>
          ) : mode === "reading" ? (
            /* task Done reaberta (UI §6.b): modo leitura + correção pendente + refazer */
            <div className="mt-3 space-y-2.5">
              {!tutor && (saldo ? <div><TutorInvite onOpen={openSheet} />{counter}</div> : exhausted)}
              <div className="flex flex-wrap items-center gap-2.5">
                <button onClick={refazer} disabled={busy} className={cn("disabled:opacity-50", QUIET_BTN, FOCUS)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refazer lição
                </button>
              </div>
            </div>
          ) : (
            /* dock do passo ativo (UI §5): vidro sticky, irmão do dock do Revisar */
            <div ref={dockRef} className="sticky bottom-0 z-10 -mx-4 mt-3 bg-background/85 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md">
              {conflict && <div className="mb-2 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs text-recall">esta lição avançou em outra aba — atualizei aqui</div>}
              <p className="mb-2 text-[13px] leading-snug text-muted-foreground">{meta.label}</p>
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={(e) => { const el = e.currentTarget; requestAnimationFrame(() => el.scrollIntoView({ block: "nearest" })); }}
                readOnly={busy}
                placeholder={meta.placeholder}
                aria-label={meta.label}
                className={cn(
                  "max-h-[38svh] min-h-[88px] w-full resize-none overflow-y-auto rounded-lg border border-border bg-card px-3.5 py-3 text-[16px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30 sm:text-sm",
                  busy && "opacity-70",
                )}
              />
              {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
              <button
                onClick={() => doSubmit(false)}
                disabled={busy || !draft.trim()}
                className={cn(
                  "mt-2.5 flex h-12 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                  isFinal
                    ? "bg-domain text-domain-foreground hover:bg-domain/90 active:bg-domain/85" // fechamento do método = mesmo sólido do Acertei (emenda UI §1.1)
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85",
                  FOCUS,
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isFinal ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {meta.btn}
                <kbd aria-hidden="true" className={cn(KBD, isFinal ? "bg-domain-foreground/20 text-domain-foreground" : "bg-primary-foreground/20 text-primary-foreground")}>enter</kbd>
              </button>
              <div className="mt-2 flex min-h-[18px] items-center justify-center gap-3">
                {meta.valve && (
                  <button onClick={() => doSubmit(true)} disabled={busy} className={cn(VALVE_BTN, FOCUS)}>{meta.valve}</button>
                )}
                {isFinal && !reused && !!prevAnswer && (
                  <button onClick={() => { setDraft(prevAnswer); setReused(true); taRef.current?.focus(); }} disabled={busy} className={cn(VALVE_BTN, FOCUS)}>
                    aproveitar minha resposta anterior
                  </button>
                )}
                <span className="hidden font-mono text-[11px] text-muted-foreground/70 sm:inline">enter envia · shift+enter quebra linha</span>
              </div>
            </div>
          )}
        </>
      )}

      {sheet && (
        <TutorSheet
          taskId={task.id}
          tutor={tutor}
          busy={tutorBusy}
          error={tutorErr}
          finalAnswer={answers[M - 1] ?? ""}
          dicaSaved={dicaSaved}
          dicaBusy={dicaBusy}
          onSaveDica={saveDica}
          onRetry={requestTutor}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
