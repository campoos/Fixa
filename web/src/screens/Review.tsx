import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { BookOpen, Check, Eye, EyeOff, FlaskConical, Loader2, RotateCcw, Shuffle, X } from "lucide-react";
import { getReview, taskReview, type Due } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { usePersistentState } from "@/lib/usePersistentState";
import { cn } from "@/lib/utils";
import { FOCUS, navigate } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RichText } from "@/components/rich-text";

// eyebrow padrão de zona (DESIGN-HOME §2.2) — mesma string da constante da Home
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
// botão quieto (fim de sessão / fila vazia — DESIGN-REVISAR §5/§6)
const QUIET_BTN = "inline-flex h-9 items-center rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-accent";
// chip de atalho de teclado (§4.e) — invisível no mobile, decorativo pro leitor de tela
const KBD = "hidden h-[18px] items-center rounded border border-transparent px-1 font-mono text-[10px] sm:inline-flex";

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

/* ── contexto do card (§4.a): tipo com ícone; a palavra some em <sm (o title assume) ── */

function TypeTag({ type }: { type: Due["type"] }) {
  const label = type === "theory" ? "teoria" : "prática";
  const Icon = type === "theory" ? BookOpen : FlaskConical;
  return (
    <span className="inline-flex shrink-0 items-center gap-1" title={label}>
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

/* ── escada Leitner (§4.b): degraus vencidos apagados, o atual forte, à frente neutro ── */

function LeitnerLadder({ box, ladder }: { box: number; ladder: number[] }) {
  const boxes = ladder.length;
  const label =
    box + 1 >= boxes
      ? `caixa ${box + 1} de ${boxes} · acertou → dominada (sai da fila) · errou → caixa 1 (amanhã)`
      : `caixa ${box + 1} de ${boxes} · acertou → caixa ${box + 2} (revisa em ${ladder[box + 1]}d) · errou → caixa 1 (amanhã)`;
  return (
    <span role="img" aria-label={label} title={label} className="ml-auto flex shrink-0 items-center gap-1.5">
      <span className="flex items-center gap-[3px]">
        {ladder.map((_, i) => (
          <span key={i} className={cn("h-[5px] w-2.5 rounded-full", i < box ? "bg-recall/40" : i === box ? "bg-recall" : "bg-secondary")} />
        ))}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{box + 1}/{boxes}</span>
    </span>
  );
}

/* ── estados de página (§2, §5, §6) ── */

function ReviewSkeleton() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-xl flex-col justify-center">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-5 h-[280px] rounded-xl" />
      <Skeleton className="mt-3 h-12 rounded-lg" />
    </div>
  );
}

function EmptyQueue({ ladder }: { ladder: number[] }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain"><Check className="h-5 w-5" /></div>
      <p className="mt-4 font-semibold">Fila limpa</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Nada pra revisar agora. As tasks concluídas voltam no tempo certo — é o espaçamento trabalhando.</p>
      <button onClick={() => navigate("/")} className={cn("mt-5", QUIET_BTN, FOCUS)}>Continuar estudando</button>
      {ladder.length > 0 && (
        <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">revisa em {ladder.map((d) => `${d}d`).join(" · ")}</p>
      )}
    </div>
  );
}

function SessionDone({ hits, misses, rest, dose, titleRef, onSeeQueue }: { hits: number; misses: number; rest: number; dose: number; titleRef: RefObject<HTMLParagraphElement | null>; onSeeQueue: () => void }) {
  useEffect(() => { localStorage.setItem("fx-hint-ladder", "1"); }, []); // 1ª sessão concluída — o hint da escada já ensinou
  const tiles = [
    { icon: <Check className="h-4 w-4 text-domain" />, value: hits, label: hits === 1 ? "acerto" : "acertos" },
    { icon: <RotateCcw className="h-4 w-4 text-recall" />, value: misses, label: misses === 1 ? "erro" : "erros" },
  ];
  return (
    <Card className="mt-5 gap-0 rounded-xl p-8 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain"><Check className="h-5 w-5" /></div>
      <p ref={titleRef} tabIndex={-1} className="mt-4 font-semibold outline-none">Sessão concluída</p>
      <div className="mx-auto mt-4 grid w-full max-w-[280px] grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border px-4 py-2.5 text-left">
            <div className="flex items-center gap-1.5">
              {t.icon}
              <span className="font-mono text-xl font-semibold tabular-nums text-foreground">{t.value}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {rest > 0
          ? <>Dose de hoje feita. <span className="font-mono tabular-nums">{rest}</span> seguem na fila — mais uma dose agora, se quiser; senão, amanhã tem mais.</>
          : misses > 0 ? "Erros voltam amanhã — é assim que fixa." : "Tudo subiu de caixa — os intervalos aumentam."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {rest > 0 && (
          <button onClick={onSeeQueue} className={cn(QUIET_BTN, FOCUS)}>Mais uma dose ({Math.min(dose, rest)})</button>
        )}
        <button onClick={() => navigate("/")} className={cn(QUIET_BTN, FOCUS)}>Voltar aos temas</button>
        {rest === 0 && <button onClick={onSeeQueue} className={cn(QUIET_BTN, FOCUS)}>Ver fila</button>}
      </div>
    </Card>
  );
}

/* ── Revisar: player de sessão (DESIGN-REVISAR) ── */

export function Review() {
  const { data, error, refetch } = useApi(getReview, []);
  const [mix, setMix] = usePersistentState("fx-review-mix", true);
  // fila da sessão: congelada no início (não re-embaralha a cada grade)
  const [queue, setQueue] = useState<Due[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState<"pass" | "fail" | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  // feedback não-visual (§8): live region + alvos de foco pós-ação
  const [live, setLive] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const gradedRef = useRef<Set<string>>(new Set()); // avaliados nesta visita — remontar a fila não os ressuscita (QA #3)

  const trackCount = useMemo(() => new Set((data?.due ?? []).map((d) => d.trackId)).size, [data]);

  // monta a sessão quando os dados chegam (ou quando muda o modo intercalado)
  // a fila da sessão é a DOSE do plano (FILA-RETORNO §1) — o total continua em data.due
  useEffect(() => {
    if (!data) return;
    const base = [...(data.session ?? data.due)].filter((d) => !gradedRef.current.has(`${d.trackId}:${d.id}`));
    setQueue(mix && trackCount > 1 ? interleave(base) : base);
    setPos(0); setShown(false); setHits(0); setMisses(0);
  }, [data, mix, trackCount]);

  const total = queue?.length ?? 0;
  const cur = queue && pos < queue.length ? queue[pos] : null;
  const grade = async (result: "pass" | "fail") => {
    if (!cur || busy) return;
    setBusy(result);
    try {
      await taskReview(cur.trackId, cur.id, result);
      gradedRef.current.add(`${cur.trackId}:${cur.id}`);
      window.dispatchEvent(new Event("fx-review-changed")); // badge do header acompanha
      const n = pos + 1;
      const newHits = hits + (result === "pass" ? 1 : 0);
      const newMisses = misses + (result === "fail" ? 1 : 0);
      setHits(newHits); setMisses(newMisses);
      // live region (§8): resultado a cada avaliação; na última, o placar do fim assume
      setLive(
        n >= total
          ? `sessão concluída — ${newHits} ${newHits === 1 ? "acerto" : "acertos"}, ${newMisses} ${newMisses === 1 ? "erro" : "erros"}`
          : result === "pass"
            ? `acerto registrado — ${n} de ${total}`
            : `erro registrado, volta amanhã — ${n} de ${total}`,
      );
      setPos((p) => p + 1);
      setShown(false);
    } finally { setBusy(null); }
  };

  // atalhos: Espaço/Enter revela · 1 = errei · 2 = acertei
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cur) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.target as HTMLElement)?.closest?.("button,a,select")) return; // Enter/Espaço num botão ativa o botão (QA #4)
      if (!shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setShown(true); }
      else if (shown && e.key === "1") { e.preventDefault(); grade("fail"); }
      else if (shown && e.key === "2") { e.preventDefault(); grade("pass"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ao revelar → foco no slot da resposta (leitor de tela lê antes de chegar em Errei/Acertei)
  useEffect(() => {
    if (shown) answerRef.current?.focus();
  }, [shown]);

  // ao avaliar → foco no Revelar do próximo card; no fim → foco no título do placar (§8)
  useEffect(() => {
    if (pos === 0 || total === 0) return; // montagem/reset de sessão: não roubar foco
    if (pos < total) revealRef.current?.focus();
    else doneRef.current?.focus();
  }, [pos, total]);

  if (error) return <div className="mx-auto w-full max-w-xl"><Card className="p-4 text-sm text-destructive">erro: {error}</Card></div>;
  if (queue === null) return <ReviewSkeleton />; // cobre loading inicial e o frame entre data → fila

  const finished = pos >= total;
  const ladder = data?.ladder ?? [];
  // consequência do Acertei (title, §4.e): próxima caixa ou graduação
  const passTitle = cur
    ? cur.box + 1 >= ladder.length
      ? "dominada — sai da fila"
      : `sobe pra caixa ${cur.box + 2} — revisa em ${ladder[cur.box + 1]}d`
    : undefined;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-xl flex-col justify-center">
      <h1 className="sr-only">Revisar hoje</h1>
      <div aria-live="polite" className="sr-only">{live}</div>

      {/* cabeçalho da sessão (§3) — some no vazio (não há sessão) */}
      {total > 0 && (
        <>
          <div className="flex items-center gap-2">
            {/* saída da sessão — no mobile a tab bar some nesta rota; padrão de player: X no topo */}
            <button
              onClick={() => navigate("/")}
              aria-label="sair da sessão"
              title="sair da sessão"
              className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", FOCUS)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className={EYEBROW}>{data?.mode === "retorno" ? "sessão de retorno" : data?.mode === "prova" ? "reta final" : "revisão de hoje"}</h2>
            {trackCount > 1 && (
              <button
                onClick={() => setMix(!mix)}
                aria-pressed={mix}
                title="misturar os temas na sessão — fixa mais (reinicia a sessão)"
                className={cn(
                  "ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  mix ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  FOCUS,
                )}
              >
                <Shuffle className="h-3.5 w-3.5" /> intercalar
              </button>
            )}
          </div>
          {/* banner de modo (FILA-RETORNO §4.a): âmbar informativo — acolhe, não culpa */}
          {data?.mode === "retorno" && (
            <p className="mt-3 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs leading-relaxed text-recall">
              Você voltou — é o que importa. Hoje: as <span className="font-mono font-semibold tabular-nums">{data.session.length}</span> mais
              frágeis; as outras <span className="font-mono font-semibold tabular-nums">{data.rest}</span> seguem na fila, sem pressa.
            </p>
          )}
          {data?.mode === "prova" && (
            <p className="mt-3 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs leading-relaxed text-recall">
              Prova chegando — hoje sem dose: a fila inteira, começando pelas mais frágeis.
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={pos}
              aria-label="progresso da sessão"
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-recall ease-out motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${(pos / total) * 100}%` }} />
            </div>
            {!finished && (
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{Math.min(pos + 1, total)}/{total}</span>
            )}
          </div>
        </>
      )}

      {total === 0 ? (
        <EmptyQueue ladder={ladder} />
      ) : finished ? (
        <SessionDone hits={hits} misses={misses} rest={data?.rest ?? 0} dose={data?.dose ?? 12} titleRef={doneRef} onSeeQueue={() => refetch()} />
      ) : cur ? (
        <>
          {/* card de revisão (§4) — min-h segura o pulo entre cards de tamanhos diferentes */}
          <Card className="mt-5 min-h-[260px] gap-0 rounded-xl border-border bg-card p-5 shadow-sm sm:min-h-[280px]">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
              <TypeTag type={cur.type} />
              <span className="min-w-0 truncate">{cur.trackTitle} · {cur.epic}</span>
              <LeitnerLadder box={cur.box} ladder={ladder} />
            </div>
            <p className="mt-4 text-[17px] font-semibold leading-snug text-balance">{cur.sample.q}</p>
            {/* slot da resposta (§4.d): mesmo min-h nos dois estados → revelar não move nada */}
            {shown ? (
              <div
                ref={answerRef}
                tabIndex={-1}
                className="mt-4 min-h-[96px] rounded-lg border border-domain/25 bg-domain/5 p-3.5 outline-none duration-200 motion-safe:animate-in motion-safe:fade-in"
              >
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-domain">resposta</p>
                <RichText text={cur.sample.a} className="text-foreground" />
              </div>
            ) : (
              <div className="mt-4 grid min-h-[96px] place-items-center rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <EyeOff className="h-4 w-4 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground/70">responda de cabeça — depois revela</p>
                </div>
              </div>
            )}
          </Card>

          {/* dock de ações (§4.e): sticky bottom, altura constante nos dois estados */}
          <div className="sticky bottom-0 z-10 -mx-4 mt-3 bg-background/85 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md">
            {!shown ? (
              <button
                ref={revealRef}
                onClick={() => setShown(true)}
                className={cn("flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent active:bg-accent", FOCUS)}
              >
                <Eye className="h-4 w-4" /> Revelar resposta
                <kbd aria-hidden="true" className={cn(KBD, "bg-muted text-muted-foreground")}>espaço</kbd>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => grade("fail")}
                  disabled={busy !== null}
                  title="volta pra caixa 1 — revisa amanhã"
                  className={cn("flex h-12 items-center justify-center gap-1.5 rounded-lg border border-recall/45 bg-recall/10 text-sm font-medium text-recall transition-colors hover:bg-recall/15 active:bg-recall/20 disabled:opacity-50", FOCUS)}
                >
                  {busy === "fail" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Errei
                  <kbd aria-hidden="true" className={cn(KBD, "bg-recall/15 text-recall")}>1</kbd>
                </button>
                <button
                  onClick={() => grade("pass")}
                  disabled={busy !== null}
                  title={passTitle}
                  className={cn("flex h-12 items-center justify-center gap-1.5 rounded-lg bg-domain text-sm font-medium text-domain-foreground transition-colors hover:bg-domain/90 active:bg-domain/85 disabled:opacity-50", FOCUS)}
                >
                  {busy === "pass" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Acertei
                  <kbd aria-hidden="true" className={cn(KBD, "bg-domain-foreground/20 text-domain-foreground")}>2</kbd>
                </button>
              </div>
            )}
          </div>

          {/* hint de atalhos (§4.f) — desktop only; no mobile o método já mora no slot oculto */}
          <p className="mt-3 hidden text-center font-mono text-[11px] text-muted-foreground/70 sm:block">espaço revela · 1 errei · 2 acertei</p>
          {/* hint de primeira sessão (DESCOBRIBILIDADE §3): ensina a escada UMA vez, depois some pra sempre */}
          {!localStorage.getItem("fx-hint-ladder") && (
            <p className="mt-3 text-center font-mono text-[11px] text-muted-foreground/70">a escada âmbar é a caixa da task — acertou sobe (espaça mais), errou volta pra 1</p>
          )}
        </>
      ) : null}
    </div>
  );
}
