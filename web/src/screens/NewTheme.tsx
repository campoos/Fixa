import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Check, ChevronDown, ClipboardCopy, Loader2, Sparkles, Upload, Wand2 } from "lucide-react";
import { ApiError, generateTrack, getConfig, getImportPrompt, importTrack, type Config } from "@/lib/api";
import { FOCUS, navigate } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LEVELS = ["iniciante", "intermediário", "avançado"];
const MODES = [
  { v: "mixed", l: "Misto" },
  { v: "theory", l: "Teórico" },
  { v: "practice", l: "Prático" },
];
const DEPTHS = [
  { v: "raso", l: "Raso (essencial)" },
  { v: "médio", l: "Médio" },
  { v: "profundo", l: "Profundo (granular)" },
];

// eyebrow padrão (spec DESIGN-HOME §2.2; tabular-nums pros "passo 0N")
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-muted-foreground";
const LINK = `rounded-sm text-xs text-primary underline-offset-2 hover:underline ${FOCUS}`;
// CTA sólido full-width do card do form (anatomia do /pro)
const CTA = `inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS}`;

function StepHeader({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={EYEBROW}>passo {n}</span>
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className={EYEBROW}>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, disabled, options }: { value: string; onChange: (v: string) => void; disabled: boolean; options: { v: string; l: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-10 w-full appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm outline-none focus:border-primary disabled:opacity-60 ${FOCUS}`}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ── banner de plano (só free): uso real de temas; no limite vira tint âmbar (recall) ── */
function FreeBanner({ themes, freeLimit, atLimit }: { themes: number; freeLimit: number; atLimit: boolean }) {
  const plans = <button onClick={() => navigate("/pro")} className={LINK}>ver planos</button>;
  if (atLimit)
    return (
      <div className="space-y-0.5 rounded-lg border border-recall/40 bg-recall/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-recall">free · {freeLimit}/{freeLimit} temas — limite do plano</span>
          <span className="flex-1" />
          {plans}
        </div>
        <p className="text-xs text-recall">exclua um tema pra criar outro, ou veja o Pro.</p>
      </div>
    );
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">free · {themes}/{freeLimit} temas</span>
      <span className="flex-1" />
      {plans}
    </div>
  );
}

/* ── passo 02: copiar o prompt gerado ── */
function StepCopy({ prompt, copied, onCopy, innerRef }: { prompt: string; copied: boolean; onCopy: () => void; innerRef: Ref<HTMLDivElement> }) {
  return (
    <Card ref={innerRef} className="gap-0 space-y-2 p-4">
      <StepHeader n="02" title="Copie e cole no seu chat" />
      <textarea readOnly value={prompt} rows={6} className="w-full resize-y rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed outline-none" />
      <div>
        <button onClick={onCopy} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent ${FOCUS}`}>
          {copied ? <><Check className="h-4 w-4 text-domain" /> copiado</> : <><ClipboardCopy className="h-4 w-4" /> copiar prompt</>}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">o modelo responde um JSON — copie a resposta inteira e cole no passo 03.</p>
    </Card>
  );
}

/* ── passo 03: colar o JSON e importar ── */
function StepImport({ json, setJson, errors, busy, atThemeLimit, onImport }: {
  json: string; setJson: (v: string) => void; errors: string[]; busy: boolean; atThemeLimit: boolean; onImport: () => void;
}) {
  const shown = errors.slice(0, 8);
  return (
    <Card className="gap-0 space-y-2 p-4">
      <StepHeader n="03" title="Cole o JSON e importe" />
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={7}
        placeholder='{ "title": "...", "epics": [ ... ] }'
        className={`w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-primary ${FOCUS}`}
      />
      <p className="text-[11px] text-muted-foreground">
        dica: se o import acusar erro perto de um link, o chat transformou uma URL em markdown ao copiar — apague o trecho{" "}
        <code className="rounded bg-muted px-1 font-mono">[...](...)</code> e deixe o texto simples.
      </p>
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="mb-1 font-medium">não deu pra importar — ajuste ou peça pro modelo corrigir:</div>
          <ul className="list-inside list-disc space-y-0.5">{shown.map((er, i) => <li key={i}>{er}</li>)}</ul>
          {errors.length > shown.length && <div className="mt-1 font-mono text-[11px]">+ {errors.length - shown.length} erros</div>}
        </div>
      )}
      <div>
        <button onClick={onImport} disabled={!json.trim() || busy || atThemeLimit} className={`inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 ${FOCUS}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importar tema
        </button>
      </div>
    </Card>
  );
}

export function NewTheme() {
  const [theme, setTheme] = useState("");
  const [level, setLevel] = useState("intermediário");
  const [mode, setMode] = useState("mixed");
  const [depth, setDepth] = useState("médio");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [json, setJson] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const disclosureRef = useRef<HTMLDivElement>(null);
  const stepCopyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getConfig().then(setCfg).catch(() => {}); }, []);

  // pro sempre; free enquanto a degustação (1 geração lifetime) não foi usada — o server valida de novo
  const canGenerate = Boolean(cfg?.genEnabled && (cfg.plan === "pro" || (cfg.gen && cfg.gen.used < cfg.gen.limit)));
  const atThemeLimit = Boolean(cfg && cfg.plan === "free" && cfg.themes >= cfg.freeLimit);
  const manualMode = cfg !== null && !canGenerate; // sem config ainda, não chutar modo
  const tastingUsed = Boolean(cfg && cfg.plan === "free" && cfg.genEnabled && cfg.gen && cfg.gen.used >= cfg.gen.limit);

  // cronômetro real da espera (UI-only), limpo no unmount / fim da geração
  useEffect(() => {
    if (!aiBusy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [aiBusy]);

  // passo 02 nasce → rola até ele
  useEffect(() => {
    if (prompt) stepCopyRef.current?.scrollIntoView({ block: "nearest" });
  }, [prompt]);

  const gen = async () => {
    if (!theme.trim()) return;
    setGenBusy(true);
    try { setPrompt(await getImportPrompt({ theme, level, mode, depth })); } finally { setGenBusy(false); }
  };
  const genDirect = async () => {
    if (!theme.trim() || aiBusy) return;
    setAiBusy(true); setAiError(null);
    try {
      const r = await generateTrack({ theme, level, mode, depth });
      navigate(`/t/${encodeURIComponent(r.id)}`);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "falha na geração");
    } finally { setAiBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard bloqueado */ }
  };
  const doImport = async () => {
    setBusy(true); setErrors([]);
    try {
      const r = await importTrack(json);
      navigate(`/t/${encodeURIComponent(r.id)}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) setErrors(e.errors);
      else setErrors([e instanceof Error ? e.message : "falha ao importar"]);
    } finally { setBusy(false); }
  };
  // fallback do erro de geração: abre o fluxo manual e rola até ele
  const goManual = () => {
    setManualOpen(true);
    requestAnimationFrame(() => disclosureRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  // botão "Gerar prompt" secundário (disclosure do modo direto)
  const genPromptSecondary = (
    <div>
      <button onClick={gen} disabled={!theme.trim() || genBusy} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50 ${FOCUS}`}>
        {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar prompt
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Novo tema</h1>
        <p className="text-sm text-muted-foreground">Descreva o assunto — a Fixa monta a trilha com revisão espaçada.</p>
        {tastingUsed && (
          <p className="text-xs text-muted-foreground">
            sua geração de degustação já foi usada — o fluxo manual é grátis e sem limite. O Pro libera 30 por mês —{" "}
            <button onClick={() => navigate("/pro")} className={LINK}>ver planos</button>
          </p>
        )}
      </header>

      {cfg?.plan === "free" && <FreeBanner themes={cfg.themes} freeLimit={cfg.freeLimit} atLimit={atThemeLimit} />}

      {/* form — em modo manual é o passo 01; em modo direto é o criador */}
      <Card className="gap-0 space-y-3 p-4">
        {manualMode && <StepHeader n="01" title="Configure o tema" />}
        <Field label="tema">
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={aiBusy}
            autoFocus
            placeholder="ex.: AWS Solutions Architect, teoria dos grafos, inglês pra entrevistas"
            className={`h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60 ${FOCUS}`}
          />
        </Field>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Field label="nível"><Select value={level} onChange={setLevel} disabled={aiBusy} options={LEVELS.map((l) => ({ v: l, l }))} /></Field>
          <Field label="abordagem"><Select value={mode} onChange={setMode} disabled={aiBusy} options={MODES} /></Field>
          <Field label="profundidade"><Select value={depth} onChange={setDepth} disabled={aiBusy} options={DEPTHS} /></Field>
        </div>

        {/* zona de ação: skeleton enquanto o config carrega — não chutar modo */}
        <div className="pt-1">
          {cfg === null ? (
            <Skeleton className="h-11 rounded-lg" />
          ) : canGenerate ? (
            <>
              <button onClick={genDirect} disabled={!theme.trim() || aiBusy || atThemeLimit} className={CTA}>
                {aiBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> gerando a trilha…</> : <><Wand2 className="h-4 w-4" /> Gerar tema</>}
              </button>
              {aiBusy ? (
                // espera honesta: só o tempo decorrido (verdade) + expectativa — zero progresso inventado
                <div className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-center">
                  <div className="font-mono text-[13px] tabular-nums text-foreground">{elapsed}s</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">costuma levar de 30 s a 1 min — o modelo escreve a trilha inteira de uma vez. Não feche a aba.</p>
                </div>
              ) : aiError ? (
                <div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {aiError}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <button onClick={genDirect} className={`rounded-sm font-medium underline-offset-2 hover:underline ${FOCUS}`}>tentar de novo</button>
                    <button onClick={goManual} className={`rounded-sm font-medium underline-offset-2 hover:underline ${FOCUS}`}>usar o fluxo manual</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
                  {cfg.plan === "pro"
                    ? `${cfg.gen.used}/${cfg.gen.limit} gerações no mês${cfg.gen.dayLimit ? ` · máx. ${cfg.gen.dayLimit}/dia` : ""}`
                    : "sua degustação: 1 geração por IA — depois, o fluxo manual segue grátis"}
                </p>
              )}
            </>
          ) : (
            <>
              <button onClick={gen} disabled={!theme.trim() || genBusy} className={CTA}>
                {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar prompt
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">o prompt é colado no ChatGPT ou Gemini — a resposta volta pra cá no passo 03</p>
            </>
          )}
        </div>
      </Card>

      {/* criação: disclosure (modo direto) ou passos na página (modo manual) */}
      {cfg !== null && (canGenerate ? (
        <div ref={disclosureRef} className="rounded-lg border border-dashed border-border">
          <button
            onClick={() => setManualOpen(!manualOpen)}
            aria-expanded={manualOpen}
            className={`flex w-full items-center gap-2 rounded-lg p-3 text-left text-xs text-muted-foreground hover:text-foreground ${FOCUS}`}
          >
            <ClipboardCopy className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Fluxo manual — gere no seu próprio chat (grátis, sem limite)</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${manualOpen ? "" : "-rotate-90"}`} />
          </button>
          {manualOpen && (
            <div className="space-y-3 px-3 pb-3">
              {genPromptSecondary}
              {prompt && <StepCopy prompt={prompt} copied={copied} onCopy={copy} innerRef={stepCopyRef} />}
              <StepImport json={json} setJson={setJson} errors={errors} busy={busy} atThemeLimit={atThemeLimit} onImport={doImport} />
            </div>
          )}
        </div>
      ) : (
        <>
          {prompt && <StepCopy prompt={prompt} copied={copied} onCopy={copy} innerRef={stepCopyRef} />}
          <StepImport json={json} setJson={setJson} errors={errors} busy={busy} atThemeLimit={atThemeLimit} onImport={doImport} />
        </>
      ))}
    </div>
  );
}
