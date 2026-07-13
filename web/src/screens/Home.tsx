import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Activity, CalendarClock, Check, ChevronDown, Flame, GraduationCap, Layers, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { TrackIcon } from "@/components/track-icon";
import { deleteTrack, getStats, getTracks, getTrash, purgeTrash, restoreTrack } from "@/lib/api";
import type { Progress, Stats, TrackSummary } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { FOCUS, Logo, navigate } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// eyebrow padrão de zona (spec §2.2)
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

// "sex, 11 jul" — pt-BR curto, sem pontos nem "de"
const fmtShort = (d: Date) =>
  d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "").replace(/ de /g, " ");
// "05 jul" — pra meta da lixeira
const fmtDayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(/\./g, "").replace(/ de /g, " ");
// "YYYY-MM-DD" (dia de calendário SP) → Date à meia-noite local, só pra formatar/weekday
const dateFromYmd = (ymd: string) => new Date(`${ymd}T00:00:00`);

const pct = (p: Progress) => (p.total ? Math.round((p.done / p.total) * 100) : 0);

/* ── zona HOJE — cards de ação ── */

function ReviewCard({ s }: { s: Stats }) {
  const due = s.dueToday;
  if (due === 0)
    return (
      <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-domain/12 text-domain"><Check className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Fila limpa</p>
          <p className="text-xs text-muted-foreground">Nada pendente. Amanhã tem mais.</p>
        </div>
      </div>
    );
  return (
    <button onClick={() => navigate("/revisar")} className={`flex min-h-[76px] items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-recall/50 ${FOCUS}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-recall/12 text-recall"><RotateCcw className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{s.dueMode === "retorno" ? "Retomar revisões" : "Revisar hoje"}</span>
        <span className="block text-xs text-muted-foreground">
          {s.dueMode === "retorno"
            ? <>hoje: <span className="font-mono tabular-nums">{s.doseToday}</span> · na fila: <span className="font-mono tabular-nums">{due}</span></>
            : s.dueMode === "prova"
              ? <><span className="font-mono tabular-nums">{due}</span> na fila · reta final da prova</>
              : <>{due} {due === 1 ? "task" : "tasks"} na fila</>}
        </span>
      </span>
      <span className="inline-flex h-8 shrink-0 items-center rounded-lg bg-recall/12 px-3 text-[13px] font-medium text-recall">{s.dueMode === "retorno" ? "Retomar" : "Revisar"}</span>
    </button>
  );
}

function ContinueCard({ next }: { next: TrackSummary | undefined }) {
  return (
    <button
      onClick={() => navigate(next ? `/t/${encodeURIComponent(next.id)}` : "/novo")}
      className={`flex min-h-[76px] items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/50 ${FOCUS}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {next ? <TrackIcon name={next.icon} className="h-[18px] w-[18px]" /> : <Plus className="h-[18px] w-[18px]" />}
      </span>
      {next ? (
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">continuar</span>
          <span className="block truncate text-sm font-semibold">{next.title}</span>
          <span className="block text-xs text-muted-foreground">{next.progress.done} de {next.progress.total} tasks</span>
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Tudo concluído</span>
          <span className="block text-xs text-muted-foreground">Crie outro tema ou adicione conteúdo.</span>
        </span>
      )}
      <span className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary/10 px-3 text-[13px] font-medium text-primary">{next ? "Abrir" : "Novo tema"}</span>
    </button>
  );
}

/* ── zona CONSISTÊNCIA — stat tiles + heatmap ── */

function StatTiles({ s }: { s: Stats }) {
  const today = s.days[s.days.length - 1]?.count ?? 0;
  const tiles = [
    { icon: <Flame className="h-4 w-4 text-recall" />, value: s.streak, label: s.streak === 1 ? "dia seguido" : "dias seguidos" },
    { icon: <Activity className="h-4 w-4 text-primary" />, value: today, label: today === 1 ? "ação hoje" : "ações hoje" },
    { icon: <GraduationCap className="h-4 w-4 text-domain" />, value: s.mastered, label: s.mastered === 1 ? "dominada" : "dominadas" },
    { icon: <Layers className="h-4 w-4 text-muted-foreground" />, value: s.tasksDone, label: `de ${s.tasksTotal} tasks` },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-border bg-card px-3.5 py-3">
          <div className="flex items-center gap-1.5">
            {t.icon}
            <span className="font-mono text-xl font-semibold tabular-nums text-foreground">{t.value}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

const HEAT = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
const heatLevel = (c: number) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 9 ? 3 : 4);
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DAY_LABELS: [string, number][] = [["seg", 3], ["qua", 5], ["sex", 7]];

/* heatmap GitHub-style: 52 semanas, colunas fluidas (minmax(10px, 1fr)) que enchem o card;
   rola horizontal só quando o mínimo (~704px) não cabe, ancorado nas semanas recentes */
function Heatmap({ days }: { days: Stats["days"] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // tooltip customizado: um único chip flutuante (fixed) que segue a célula sob o cursor
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const showTip = (text: string) => (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ text, x: r.left + r.width / 2, y: r.top });
  };
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: scrollerRef.current.scrollWidth });
  }, [days]);
  if (!days.length) return null;

  const startDow = dateFromYmd(days[0].day).getDay(); // 0 = dom (o server alinha no domingo)
  const weekCount = Math.ceil((startDow + days.length) / 7);
  const total = days.reduce((acc, d) => acc + d.count, 0);
  const trailing = weekCount * 7 - startDow - days.length; // dias futuros da semana corrente

  // labels de mês: semanas agrupadas pelo mês do seu domingo; segmento < 3 colunas é suprimido
  const segments: { start: number; month: number; len: number }[] = [];
  for (let w = 0; w < weekCount; w++) {
    const sundayIdx = Math.max(0, Math.min(w * 7 - startDow, days.length - 1));
    const month = dateFromYmd(days[sundayIdx].day).getMonth();
    const last = segments[segments.length - 1];
    if (!last || last.month !== month) segments.push({ start: w, month, len: 1 });
    else last.len++;
  }

  return (
    <Card className="gap-0 p-4">
      <div ref={scrollerRef} onScroll={() => setTip(null)} onMouseLeave={() => setTip(null)} className="scroll-custom overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={`Consistência: ${total} ${total === 1 ? "ação" : "ações"} nas últimas 52 semanas`}
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `28px repeat(${weekCount}, minmax(10px, 1fr))`, gridTemplateRows: "14px repeat(7, auto)" }}
        >
          {segments.filter((seg) => seg.len >= 3).map((seg) => (
            <div key={seg.start} style={{ gridRow: 1, gridColumn: `${seg.start + 2} / span ${Math.min(seg.len, 4)}` }} className="font-mono text-[10px] lowercase text-muted-foreground">
              {MONTHS[seg.month]}
            </div>
          ))}
          {DAY_LABELS.map(([label, row]) => (
            <div key={label} style={{ gridRow: row, gridColumn: 1 }} className="self-center pr-1.5 text-right font-mono text-[10px] leading-none text-muted-foreground/80">
              {label}
            </div>
          ))}
          {days.map((d, i) => {
            const slot = startDow + i;
            const isToday = i === days.length - 1;
            const cellTip = `${d.count === 0 ? "sem atividade" : d.count === 1 ? "1 ação" : `${d.count} ações`} · ${fmtShort(dateFromYmd(d.day))}`;
            return (
              <div
                key={d.day}
                style={{ gridRow: (slot % 7) + 2, gridColumn: Math.floor(slot / 7) + 2 }}
                onMouseEnter={showTip(cellTip)}
                className={`aspect-square w-full rounded-[2px] ${HEAT[heatLevel(d.count)]} ${isToday ? "outline outline-[1.5px] outline-offset-1 outline-primary" : "hover:outline hover:outline-1 hover:outline-foreground/30"}`}
              />
            );
          })}
          {Array.from({ length: trailing }).map((_, i) => {
            const slot = startDow + days.length + i;
            return (
              <div
                key={`future-${i}`}
                style={{ gridRow: (slot % 7) + 2, gridColumn: Math.floor(slot / 7) + 2, visibility: "hidden" }}
                className="aspect-square w-full rounded-[2px] bg-heat-0"
              />
            );
          })}
        </div>
      </div>
      {tip && (
        <div
          style={{ position: "fixed", left: tip.x, top: tip.y - 8, transform: "translate(-50%, -100%)" }}
          className="pointer-events-none z-50 rounded-md bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-background shadow-md"
        >
          {tip.text}
          <span className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-foreground" />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{total} {total === 1 ? "ação" : "ações"} no último ano</span>
        <div className="flex items-center gap-[3px]">
          <span className="mr-1 font-mono text-[10px] text-muted-foreground">menos</span>
          {HEAT.map((h) => <span key={h} className={`h-[10px] w-[10px] rounded-[2px] ${h}`} />)}
          <span className="ml-1 font-mono text-[10px] text-muted-foreground">mais</span>
        </div>
      </div>
    </Card>
  );
}

/* ── zona SEUS TEMAS — card de tema ── */

// sem pill e sem label (pedido do dono 13/07): ícone + dias — o title carrega a frase completa
function ExamBadge({ daysLeft }: { daysLeft: number }) {
  const tone = daysLeft < 0 ? "text-muted-foreground" : daysLeft > 7 ? "text-primary" : "text-recall";
  const title = daysLeft < 0 ? "prova passou" : daysLeft === 0 ? "prova hoje" : `prova em ${daysLeft} dias`;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ${tone}`} title={title}>
      <CalendarClock className="h-3 w-3" /><span className="font-mono tabular-nums">{daysLeft < 0 ? "—" : `${daysLeft}d`}</span>
    </span>
  );
}

function ThemeCard({ t, onDelete }: { t: TrackSummary; onDelete: (e: MouseEvent<HTMLButtonElement>, t: TrackSummary) => void }) {
  const open = () => navigate(`/t/${encodeURIComponent(t.id)}`);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // Enter no botão de excluir não abre o tema
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  };
  return (
    <Card role="button" tabIndex={0} onClick={open} onKeyDown={onKey} className={`cursor-pointer rounded-xl p-4 transition-colors hover:border-primary/40 ${FOCUS}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <TrackIcon name={t.icon} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{t.title}</h3>
            {t.targetDate && t.daysLeft != null && <ExamBadge daysLeft={t.daysLeft} />}
            {t.due > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-recall" title="pra revisar hoje">
                <RotateCcw className="h-3 w-3" /><span className="font-mono tabular-nums">{t.due}</span>
              </span>
            )}
            {t.mastery > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-domain" title="dominadas">
                <GraduationCap className="h-3 w-3" /><span className="font-mono tabular-nums">{t.mastery}</span>
              </span>
            )}
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{t.progress.done}/{t.progress.total}</span>
          </div>
          {t.summary && <p className="mt-1 truncate text-xs text-muted-foreground">{t.summary}</p>}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-domain transition-all" style={{ width: `${pct(t.progress)}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {t.counts.epics} epics · {t.counts.stories} stories · {t.counts.tasks} tasks ({t.counts.practice} práticas)
          </p>
        </div>
        <button
          onClick={(e) => onDelete(e, t)}
          title="mover pra lixeira"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive ${FOCUS}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

/* ── lixeira discreta ── */

function Trash({ onChange }: { onChange: () => void }) {
  const { data, loading, refetch } = useApi(getTrash, []);
  const [open, setOpen] = useState(false);
  const items = data ?? [];
  if (loading || !items.length) return null;
  const restore = async (id: string) => { await restoreTrack(id); await refetch(true); onChange(); };
  const purge = async (id: string) => { if (!confirm("Apagar de vez? Não dá pra desfazer.")) return; await purgeTrash(id); await refetch(true); };
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={`flex items-center gap-2 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}>
        <Trash2 className="h-3.5 w-3.5" /> Lixeira <span className="font-mono tabular-nums">({items.length})</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{t.counts.tasks} tasks · excluído {fmtDayMonth(t.deletedAt)}</span>
              <button onClick={() => restore(t.id)} title="restaurar" className={`grid h-7 w-7 shrink-0 place-items-center rounded text-domain hover:bg-domain/10 ${FOCUS}`}><Undo2 className="h-4 w-4" /></button>
              <button onClick={() => purge(t.id)} title="apagar de vez" className={`grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${FOCUS}`}><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── estados da página ── */

function EmptyState({ trashKey, onTrashChange }: { trashKey: number; onTrashChange: () => void }) {
  return (
    <>
      <h1 className="sr-only">Início</h1>
      <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <div className="flex justify-center opacity-70"><Logo size={32} /></div>
        <p className="mt-4 font-semibold">Nenhum tema ainda</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Descreva um assunto e a Fixa monta a trilha — com revisão espaçada pra você não esquecer.</p>
        <button onClick={() => navigate("/novo")} className={`mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 ${FOCUS}`}>
          <Plus className="h-4 w-4" /> Criar primeiro tema
        </button>
        <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">revisa em 1d · 2d · 4d · 7d · 15d · 30d</p>
        <div className="mx-auto mt-8 max-w-md text-left"><Trash key={trashKey} onChange={onTrashChange} /></div>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-xl" />)}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[64px] rounded-lg" />)}
        </div>
        <Skeleton className="h-[180px] rounded-xl" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
      </div>
    </div>
  );
}

/* ── Home ── */

export function Home() {
  const tracksQ = useApi(getTracks, []);
  const statsQ = useApi(getStats, []);
  const [rev, setRev] = useState(0);
  const bump = () => { tracksQ.refetch(true); statsQ.refetch(true); setRev((v) => v + 1); };
  const del = async (e: MouseEvent<HTMLButtonElement>, t: TrackSummary) => {
    e.stopPropagation();
    if (!confirm(`Mover "${t.title}" pra lixeira? Dá pra restaurar depois.`)) return;
    await deleteTrack(t.id);
    bump();
  };

  if ((tracksQ.loading && !tracksQ.data) || (statsQ.loading && !statsQ.data)) return <HomeSkeleton />;
  if (tracksQ.error) return <Card className="p-4 text-sm text-destructive">erro: {tracksQ.error}</Card>;

  const tracks = tracksQ.data ?? [];
  const s = statsQ.data;
  if (!tracks.length) return <EmptyState trashKey={rev} onTrashChange={bump} />;
  const next = tracks.find((t) => t.progress.done < t.progress.total);

  return (
    <div>
      <h1 className="sr-only">Início</h1>
      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className={EYEBROW}>hoje</h2>
            <span className="font-mono text-[11px] lowercase text-muted-foreground/70">{fmtShort(new Date())}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {s && <ReviewCard s={s} />}
            <ContinueCard next={next} />
          </div>
        </section>
        {s && (
          <section>
            <h2 className={`mb-3 ${EYEBROW}`}>consistência</h2>
            <div className="space-y-3">
              <StatTiles s={s} />
              <Heatmap days={s.days} />
            </div>
          </section>
        )}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={EYEBROW}>seus temas · <span className="tabular-nums">{tracks.length}</span></h2>
            <button onClick={() => navigate("/novo")} className={`rounded-sm text-xs text-primary underline-offset-2 hover:underline ${FOCUS}`}>+ novo tema</button>
          </div>
          <div className="space-y-2.5">
            {tracks.map((t) => <ThemeCard key={t.id} t={t} onDelete={del} />)}
          </div>
        </section>
      </div>
      <div className="mt-10"><Trash key={rev} onChange={bump} /></div>
    </div>
  );
}
