import { useEffect, useState, type ReactNode } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import { ApiError, billingCheckout, billingPix, getConfig, joinWaitlist, playVerify, type Config, type Me } from "@/lib/api";
import { isAppMode } from "@/lib/app-mode";
import { comprar, compraPendente, precoDoPlano, servicoPlay, type ItemPlay } from "@/lib/play-billing";
import { useApi } from "@/lib/useApi";
import { FOCUS } from "@/App";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// chave da persistência do "já entrei na lista" (spec §2.6)
const WAITLIST_KEY = "fx-pro-waitlist";

/* ── peças da anatomia comum dos cards (spec §2.3) ── */

// preço grande mono + sufixo na mesma baseline — a assinatura visual da página
function Price({ value, suffix }: { value: string; suffix: string }) {
  return (
    <div className="mt-3 flex items-baseline gap-2">
      <span className="font-mono text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums md:text-[40px]">{value}</span>
      <span className="font-mono text-[13px] text-muted-foreground">{suffix}</span>
    </div>
  );
}

// lista de features com ✓ — a comparação vive dentro do card
function Features({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-[13px]">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-domain" aria-hidden="true" />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const B = ({ children }: { children: ReactNode }) => <b className="font-medium text-foreground">{children}</b>;

// features — números são lei do PRICING.md
const FREE_FEATURES: ReactNode[] = [
  <><B>método completo</B> — revisões no tempo certo</>,
  <>revisões diárias <B>ilimitadas, pra sempre</B></>,
  <>até <B>2 temas</B> ativos</>,
  <>criação manual — prompt pronto + JSON</>,
  <><B>1 geração por IA</B> de degustação</>,
  <><B>5 correções do Tutor</B> de degustação</>,
  <>data da prova + meta diária</>,
  <>export dos seus dados, sempre</>,
];

const PRO_FEATURES: ReactNode[] = [
  <><B>temas ilimitados</B> — o grátis para em 2</>,
  <><B>geração por IA em 1 clique</B></>,
  <><B>30 gerações/mês</B> (máx. 10/dia)</>,
  <><B>correção do Tutor</B> — nota, acertos e gaps por IA</>,
  <><B>100 correções/mês</B></>,
  <>tudo do Grátis incluso</>,
];

// chip estático que ocupa o slot do CTA ("Seu plano atual" / "plano ativo na sua conta")
function StaticSlot({ tone, children }: { tone: "muted" | "domain"; children: ReactNode }) {
  const cls = tone === "domain"
    ? "border border-domain/40 bg-domain/10 text-sm font-medium text-domain"
    : "border border-border bg-muted/60 text-sm font-medium text-muted-foreground";
  return <div className={`mt-4 flex h-11 w-full select-none items-center justify-center gap-1.5 rounded-lg ${cls}`}>{children}</div>;
}

// CTA do Pro com os 4 estados da spec: idle → busy → enviado (persistido) · erro reabilita
// CTA real de assinatura (só quando o billing está configurado no server)
function SubscribeCta() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await billingCheckout();
      window.location.href = r.url; // checkout do Mercado Pago
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "não deu — tenta de novo");
      setBusy(false);
    }
  };
  return (
    <>
      <button onClick={go} disabled={busy} className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 ${FOCUS}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />} Assinar o Pro
      </button>
      {err
        ? <p className="mt-1.5 text-center text-xs text-destructive">{err}</p>
        : <p className="mt-1.5 text-center text-[11px] text-muted-foreground">pagamento pelo Mercado Pago — cancele quando quiser</p>}
    </>
  );
}

// Pix: a assinatura do Mercado Pago só aceita cartão ou saldo, e quem estuda pra concurso muitas
// vezes não tem cartão. Aqui o Pix é compra avulsa de prazo — paga uma vez, fica Pro até a data.
// Fica abaixo da assinatura porque a recorrência é o caminho padrão; o Pix é a saída pra quem
// não pode usá-la.
function PixCta({ mes, ano }: { mes: number; ano: number }) {
  const [busy, setBusy] = useState<"mes" | "ano" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const emReais = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const go = async (plano: "mes" | "ano") => {
    setBusy(plano); setErr(null);
    try {
      const r = await billingPix(plano);
      window.location.href = r.url; // checkout do Mercado Pago, só com Pix habilitado
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "não deu — tenta de novo");
      setBusy(null);
    }
  };
  // min-h em vez de altura fixa: em 320–360px o preço quebra em duas linhas e com h-10 o texto
  // vazava pra fora da borda
  const btn = "inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 text-[13px] font-medium leading-none transition-colors hover:bg-secondary disabled:opacity-60";
  return (
    <div className="mt-3">
      <p className="text-center text-[11px] text-muted-foreground">não tem cartão? pague por Pix</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => go("mes")} disabled={busy !== null} className={`${btn} ${FOCUS}`}>
          {busy === "mes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>1 mês</span><span className="font-mono text-[11px] tabular-nums text-muted-foreground">{emReais(mes)}</span></>}
        </button>
        <button onClick={() => go("ano")} disabled={busy !== null} className={`${btn} ${FOCUS}`}>
          {busy === "ano" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>1 ano</span><span className="font-mono text-[11px] tabular-nums text-muted-foreground">{emReais(ano)}</span></>}
        </button>
      </div>
      {err
        ? <p className="mt-1.5 text-center text-xs text-destructive">{err}</p>
        : <p className="mt-1.5 text-center text-[11px] text-muted-foreground">pagamento único, não renova sozinho — o de 1 ano sai {emReais(ano / 12)}/mês</p>}
    </div>
  );
}

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
  if (sent) return <StaticSlot tone="domain"><Check className="h-4 w-4" /> Na lista — te aviso em {email}</StaticSlot>;
  return (
    <>
      <button
        onClick={join}
        disabled={busy}
        className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 ${FOCUS}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />} Garantir preço de fundador
      </button>
      {err
        ? <p className="mt-2 text-center text-xs text-destructive">não deu — tenta de novo</p>
        : <p className="mt-2 text-center text-[11px] text-muted-foreground">sem cobrança agora — o e-mail só guarda seu lugar</p>}
    </>
  );
}

/* ── os dois cards (spec §2.4 e §2.5) ── */

function FreeCard({ isPro }: { isPro: boolean }) {
  return (
    <Card className="gap-0 p-6">
      <p className="text-sm font-semibold">Grátis</p>
      <Price value="R$ 0" suffix="pra sempre" />
      <p className="mt-2 font-mono text-[12px] text-muted-foreground/80">sem cartão · sem teste que expira</p>
      <p className="mt-2 min-h-[2.5rem] text-[13px] text-muted-foreground">tudo que faz fixar: revisões no tempo certo, todo dia.</p>
      {!isPro && <StaticSlot tone="muted">Seu plano atual</StaticSlot>}
      <Features items={FREE_FEATURES} />
    </Card>
  );
}

// preço e vagas vêm do servidor: é o mesmo número que o checkout vai cobrar, e a promessa
// dos 100 primeiros desaparece sozinha quando as vagas acabam (PRICING.md)
function ProCard({ me, billing, cfg }: { me: Me; billing: boolean; cfg?: Config }) {
  const isPro = me.plan === "pro";
  const cheio = cfg?.fullPrice ?? 19.9;
  const preco = cfg?.price ?? cheio;
  const fundador = preco < cheio;
  const emReais = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  return (
    <Card className="relative gap-0 border-primary/50 p-6 shadow-xl shadow-primary/10 max-md:order-first">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-primary-foreground">
        {isPro ? "seu plano" : fundador ? "preço de fundador" : "assinatura"}
      </span>
      <p className="text-sm font-semibold">Pro</p>
      <Price value={emReais(preco)} suffix="/mês" />
      {fundador && <p className="mt-2 font-mono text-[12px] tabular-nums text-muted-foreground">depois das 100 primeiras assinaturas, {emReais(cheio)}/mês</p>}
      <p className="mt-2 min-h-[2.5rem] text-[13px] text-muted-foreground">sem teto de temas, trilha pronta em 1 clique — menos de R$ 0,85 por dia.</p>
      {isPro ? (
        <>
          <StaticSlot tone="domain"><Check className="h-4 w-4" /> plano ativo na sua conta</StaticSlot>
          {/* prazo só existe em compra por Pix — assinatura no cartão não tem data de fim */}
          {cfg?.proUntil && <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground">até {new Date(cfg.proUntil).toLocaleDateString("pt-BR")}</p>}
        </>
      ) : (
        <>
          {fundador && (
            <p className="mt-3 text-[13px] leading-relaxed">
              <b className="font-semibold text-recall">
                {cfg?.founderLeft === 100 ? "Primeiros 100: " : `Restam ${cfg?.founderLeft} vagas: `}
                {emReais(preco)}/mês, pra sempre.
              </b>
            </p>
          )}
          {billing ? <><SubscribeCta /><PixCta mes={preco} ano={cfg?.yearPrice ?? cfg?.fullYearPrice ?? 149} /></> : <WaitlistCta email={me.email} />}
        </>
      )}
      <Features items={PRO_FEATURES} />
    </Card>
  );
}

/* ── modo app: a tela não vende, informa o plano da conta (DESIGN-APP-MODE §3) ── */

// medidor de consumo: mono tabular, âmbar quando o limite estourou
function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const full = used >= limit;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[13px] tabular-nums ${full ? "text-recall" : "text-foreground"}`}>{used}/{limit}</span>
    </div>
  );
}

function UsageMeters({ cfg }: { cfg: Config }) {
  return (
    <div className="mt-4 space-y-2">
      <UsageRow label="temas ativos" used={cfg.themes} limit={cfg.freeLimit} />
      <UsageRow label="gerações por IA" used={cfg.gen.used} limit={cfg.gen.limit} />
      <UsageRow label="correções do Tutor" used={cfg.tutor.used} limit={cfg.tutor.limit} />
    </div>
  );
}

/* ── compra dentro do app, pelo Play Billing (PLAY-STORE.md §6) ──
   Enquanto o serviço de Digital Goods não existe — navegador, PWA, ou app anterior ao
   playBilling — este componente devolve o bloco informativo de sempre, e a tela continua
   sendo exatamente a que a spec §3.2 descreve. O CTA só nasce quando há produto de verdade
   no catálogo da Play, e o preço exibido é o que a Play devolve, nunca o nosso. */
function PlayCta({ cfg, onPro }: { cfg: Config; onPro: () => void }) {
  const [item, setItem] = useState<ItemPlay | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const svc = await servicoPlay();
      if (!svc || !cfg.play.enabled) return;
      const preco = await precoDoPlano(svc, cfg.play.produto);
      if (vivo) setItem(preco);
      // compra que ficou pendurada (app fechou entre pagar e confirmar): resgata sozinha,
      // senão a pessoa pagou e continua free
      const pendente = await compraPendente(svc, cfg.play.produto);
      if (pendente) { try { await playVerify(pendente); if (vivo) onPro(); } catch { /* tenta na próxima */ } }
    })();
    return () => { vivo = false; };
  }, [cfg.play.enabled, cfg.play.produto, onPro]);

  const assinar = async () => {
    setBusy(true); setErr(null);
    try {
      const token = await comprar(cfg.play.produto, cfg.play.oferta ?? cfg.play.mes);
      if (!token) return;                       // fechou o checkout: desistência, não erro
      await playVerify(token);
      onPro();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "não deu pra concluir a compra — tenta de novo");
    } finally { setBusy(false); }
  };

  // sem serviço ou sem produto publicado: a tela de sempre, sem preço e sem CTA
  if (!item) {
    return (
      <div className="mt-4 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">Fixa Pro</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Temas ilimitados, geração por IA em 1 clique e correção do Tutor. Disponível para contas Pro.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">A assinatura é administrada fora do aplicativo.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-primary/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">Fixa Pro</p>
        <p className="font-mono text-[13px] tabular-nums text-foreground">{item.price.value} {item.price.currency}/mês</p>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Temas ilimitados, geração por IA em 1 clique e correção do Tutor.
      </p>
      <button
        onClick={assinar}
        disabled={busy}
        className={`mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />} Assinar o Pro
      </button>
      {err && <p className="mt-2 text-xs text-recall">{err}</p>}
      <p className="mt-2 text-xs text-muted-foreground">Cobrança e cancelamento pelo Google Play.</p>
    </div>
  );
}

function ProAppScreen({ me, cfg }: { me: Me; cfg: Config }) {
  const isPro = me.plan === "pro";
  const temasNoTeto = !isPro && cfg.themes >= cfg.freeLimit;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">plano</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[28px]">{isPro ? "Você é Pro" : "Seu plano"}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {isPro
            ? "Temas ilimitados e geração direta por IA liberados na sua conta."
            : "Revisões diárias ilimitadas, com o método completo."}
        </p>
        {isPro && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary"><Crown className="h-3 w-3" /> pro</span>
        )}
      </div>

      <div className="mt-8">
        {isPro ? (
          <Card className="gap-0 border-primary/50 p-6">
            <p className="text-sm font-semibold">Pro</p>
            <StaticSlot tone="domain"><Check className="h-4 w-4" /> plano ativo na sua conta</StaticSlot>
            {cfg.proUntil && <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground">até {new Date(cfg.proUntil).toLocaleDateString("pt-BR")}</p>}
            <Features items={PRO_FEATURES} />
          </Card>
        ) : (
          <>
            <Card className="gap-0 p-6">
              <p className="text-sm font-semibold">Grátis</p>
              <StaticSlot tone="muted">Seu plano atual</StaticSlot>
              <UsageMeters cfg={cfg} />
              {temasNoTeto && (
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  Limite de temas ativos atingido. Arquive um tema para criar outro.
                </p>
              )}
              <Features items={FREE_FEATURES} />
            </Card>
            <PlayCta cfg={cfg} onPro={() => window.location.reload()} />
          </>
        )}
      </div>

      {isPro && <p className="mt-6 text-center text-xs text-muted-foreground">Assinatura administrada fora do aplicativo.</p>}
      <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
        Seus dados são{" "}
        <a href="/api/export" download className={`underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground ${FOCUS}`}>exportáveis</a>, sempre.
      </p>
    </div>
  );
}

/* ── estados da página ── */

function ProSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Skeleton className="mx-auto h-4 w-16" />
      <Skeleton className="mx-auto mt-3 h-8 w-72" />
      <Skeleton className="mx-auto mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[480px] rounded-xl" />
        <Skeleton className="h-[480px] rounded-xl" />
      </div>
      <Skeleton className="mx-auto mt-8 h-4 w-80" />
    </div>
  );
}

export function Pro({ me }: { me: Me }) {
  const { data: cfg, loading, error } = useApi(getConfig, []);
  const isPro = me.plan === "pro";
  if (loading && !cfg) return <ProSkeleton />;
  if (error && !cfg) return <div className="mx-auto w-full max-w-3xl"><Card className="p-4 text-sm text-destructive">erro: {error}</Card></div>;
  // no app Android nada pode empurrar pra checkout externo: a tela vira status do plano
  if (isAppMode && cfg) return <ProAppScreen me={me} cfg={cfg} />;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">planos</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[28px]">
          {isPro ? "Você é Pro" : "O método é grátis. O Pro tira o teto."}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {isPro
            ? "Temas ilimitados e geração direta por IA liberados na sua conta."
            : "Revisar todo dia é grátis, pra sempre. O Pro é a trilha pronta em 1 clique."}
        </p>
        {isPro ? (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary"><Crown className="h-3 w-3" /> pro</span>
        ) : (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
            free · {cfg?.themes ?? 0}/{cfg?.freeLimit ?? 2} temas ativos
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <FreeCard isPro={isPro} />
        {/* no app Android o checkout externo é proibido (conteúdo digital exige Google Play
            Billing) — o CTA de assinatura só existe na web até o billing do Play entrar */}
        <ProCard me={me} billing={!isAppMode && (cfg?.billingEnabled ?? false)} cfg={cfg ?? undefined} />
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
        Cancele quando quiser. Reembolso em até 30 dias. Seus dados são{" "}
        <a href="/api/export" download className={`underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground ${FOCUS}`}>exportáveis</a>, sempre.
      </p>
    </div>
  );
}
