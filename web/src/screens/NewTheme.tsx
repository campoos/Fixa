import { useState, type ReactNode } from "react";
import { Check, ClipboardCopy, Loader2, Sparkles, Upload } from "lucide-react";
import { ApiError, getImportPrompt, importTrack } from "@/lib/api";
import { navigate } from "@/App";
import { Card } from "@/components/ui/card";

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
const selCls = "w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-primary";

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

  const gen = async () => {
    if (!theme.trim()) return;
    setGenBusy(true);
    try { setPrompt(await getImportPrompt({ theme, level, mode, depth })); } finally { setGenBusy(false); }
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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Novo tema</h1>

      {/* passo 1: configurar + gerar prompt */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-500">1</span> Configure e gere o prompt</div>
        <Field label="Tema (qualquer assunto)"><input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="ex.: consumo de API no front, teoria dos grafos, SQL joins…" className={selCls} /></Field>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Field label="Nível"><select value={level} onChange={(e) => setLevel(e.target.value)} className={selCls}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
          <Field label="Abordagem"><select value={mode} onChange={(e) => setMode(e.target.value)} className={selCls}>{MODES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}</select></Field>
          <Field label="Profundidade"><select value={depth} onChange={(e) => setDepth(e.target.value)} className={selCls}>{DEPTHS.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}</select></Field>
        </div>
        <button onClick={gen} disabled={!theme.trim() || genBusy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar prompt
        </button>
      </Card>

      {/* passo 2: copiar prompt */}
      {prompt && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-500">2</span> Copie e cole no ChatGPT / Gemini</div>
          <textarea readOnly value={prompt} rows={7} className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none" />
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
            {copied ? <><Check className="h-4 w-4 text-emerald-500" /> copiado!</> : <><ClipboardCopy className="h-4 w-4" /> copiar prompt</>}
          </button>
          <p className="text-xs text-muted-foreground">O modelo responde um JSON. Copie a resposta inteira e cole abaixo.</p>
        </Card>
      )}

      {/* passo 3: colar JSON e importar */}
      <Card className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-500">3</span> Cole o JSON e importe</div>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={7} placeholder='{ "title": "...", "epics": [ ... ] }' className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none focus:border-primary" />
        {errors.length > 0 && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-400">
            <div className="mb-1 font-medium">Não deu pra importar — ajuste ou peça pro modelo corrigir:</div>
            <ul className="list-inside list-disc space-y-0.5">{errors.slice(0, 12).map((er, i) => <li key={i}>{er}</li>)}</ul>
          </div>
        )}
        <button onClick={doImport} disabled={busy || !json.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importar tema
        </button>
      </Card>
    </div>
  );
}
