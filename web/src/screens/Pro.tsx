import { useState } from "react";
import { Check, Crown, Loader2, ShieldCheck, X } from "lucide-react";
import { getConfig, joinWaitlist, type Me } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { FOCUS } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// chave da persistência do "já entrei na lista" (spec §2.5)
const WAITLIST_KEY = "fx-pro-waitlist";

// tabela comparativa — números são lei do PRICING.md
const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Método completo (recall + revisão espaçada)", free: true, pro: true },
  { label: "Revisões diárias", free: "ilimitadas", pro: "ilimitadas" },
  { label: "Temas ativos", free: "até 2", pro: "ilimitados" },
  { label: "Criar tema manual (prompt pronto + JSON)", free: true, pro: true },
  { label: "Geração por IA em 1 clique", free: "1 degustação", pro: "30/mês" },
  { label: "Data da prova + meta diária", free: true, pro: true },
  { label: "Streak + heatmap de consistência", free: true, pro: true },
  { label: "Export dos seus dados", free: "sempre", pro: "sempre" },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-domain" aria-label="incluído" />;
  if (v === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="não incluído" />;
  return <span className="font-mono text-xs tabular-nums">{v}</span>;
}

// preço na anatomia comum aos dois cards (valor grande mono + sufixo)
function Price({ value, suffix }: { value: string; suffix: string }) {
  return (
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className="font-mono text-[28px] font-semibold leading-none tabular-nums tracking-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{suffix}</span>
    </div>
  );
}

// CTA do card Pro com os 4 estados da spec: idle → busy → enviado (persistido) · erro reabilita
function WaitlistCta({ email }: { email: string }) {
  const [sent, setSent] = useState(() => localStorage.getItem(WAITLIST_KEY) === "1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const join = async () => {
    setBusy(true);
    setErr(false);
    try {
      await joinWaitlist(email);
      localStorage.setItem(WAITLIST_KEY, "1");
      setSent(true);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };
  if (sent) {
    return (
      <div className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-domain/40 bg-domain/10 text-sm font-medium text-domain">
        <Check className="h-4 w-4" /> Na lista — te aviso em {email}
      </div>
    );
  }
  return (
    <>
      <button
        onClick={join}
        disabled={busy}
        className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 ${FOCUS}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />} Garantir preço de fundador
      </button>
      {err
        ? <p className="mt-1.5 text-center text-xs text-destructive">não deu — tenta de novo</p>
        : <p className="mt-1.5 text-center text-[11px] text-muted-foreground">sem cobrança agora — o e-mail só guarda seu lugar</p>}
    </>
  );
}

function PriceCards({ me }: { me: Me }) {
  const isPro = me.plan === "pro";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="gap-0 p-4">
        <div className="flex items-center">
          <span className="text-sm font-semibold">Grátis</span>
          {!isPro && <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">seu plano</span>}
        </div>
        <Price value="R$ 0" suffix="pra sempre" />
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">método completo, revisões ilimitadas, até 2 temas. Sem cartão, sem teste que expira.</p>
      </Card>
      <Card className="relative gap-0 border-primary/45 p-4 shadow-sm">
        <span className="absolute right-4 top-4 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">em breve</span>
        <span className="text-sm font-semibold">Pro</span>
        <Price value="R$ 19,90" suffix="/mês" />
        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)</p>
        <p className="mt-1.5 text-xs text-muted-foreground">menos de R$ 0,85 por dia.</p>
        {isPro ? (
          <div className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-domain/40 bg-domain/10 text-sm font-medium text-domain">
            <Check className="h-4 w-4" /> plano ativo na sua conta
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-lg border border-dashed border-recall/45 bg-recall/8 px-3 py-2.5">
              <p className="text-xs font-semibold text-recall">Preço de fundador: R$ 14,90/mês, pra sempre</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">pros primeiros 100 e-mails da lista. Sem contador de vagas aqui — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.</p>
            </div>
            <WaitlistCta email={me.email} />
          </>
        )}
      </Card>
    </div>
  );
}

function CompareTable() {
  return (
    <div>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid grid-cols-[1fr_5.25rem_5.25rem] items-center border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>o que tem</span><span className="text-center font-mono">free</span><span className="text-center font-mono text-primary">pro</span>
        </div>
        {ROWS.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_5.25rem_5.25rem] items-center border-b border-border/60 px-4 py-3 text-sm last:border-0">
            <span className="pr-2">{r.label}</span>
            <span className="text-center text-muted-foreground"><Cell v={r.free} /></span>
            <span className="text-center"><Cell v={r.pro} /></span>
          </div>
        ))}
      </Card>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">fair use da geração: 30 por mês, no máximo 10 por dia — quem estuda normal usa de 3 a 10. Revisar nunca conta.</p>
    </div>
  );
}

function ProSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-7 w-40" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
      <Skeleton className="mt-5 h-[340px] rounded-xl" />
      <Skeleton className="mt-5 h-[84px] rounded-xl" />
    </div>
  );
}

export function Pro({ me }: { me: Me }) {
  const { data: cfg, loading, error } = useApi(getConfig, []);
  const isPro = me.plan === "pro";
  if (loading && !cfg) return <ProSkeleton />;
  if (error && !cfg) return <div className="mx-auto w-full max-w-xl"><Card className="p-4 text-sm text-destructive">erro: {error}</Card></div>;
  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">plano</p>
        <div className="mt-1 flex items-center gap-2.5">
          <h1 className="text-lg font-semibold">{isPro ? "Você é Pro" : "Fixa Pro"}</h1>
          {isPro
            ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[11px] font-medium text-primary"><Crown className="h-3 w-3" /> pro</span>
            : <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">free · {cfg?.themes ?? 0}/{cfg?.freeLimit ?? 2} temas</span>}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isPro
            ? "Temas ilimitados e geração direta por IA liberados na sua conta."
            : "O método inteiro é grátis, pra sempre. O Pro tira o teto de temas e gera a trilha por IA em 1 clique — a assinatura ainda não abriu, mas dá pra travar o preço de fundador abaixo."}
        </p>
      </div>

      <PriceCards me={me} />
      <CompareTable />

      <Card className="flex-row items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-domain" />
        <div>
          <p className="text-sm font-medium">Garantia</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">Cancele quando quiser, em 2 cliques. Não fixou em 30 dias? Reembolso integral. E seus dados são seus — exporte tudo a qualquer momento, inclusive no grátis.</p>
        </div>
      </Card>
    </div>
  );
}
