import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Download, Eye, EyeOff, LogOut, PenLine, RotateCcw } from "lucide-react";
import { getConfig, setReminders, type Me } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { desligarPush, estadoPush, ligarPush, type EstadoPush } from "@/lib/push";
import { QUIET_BTN } from "@/lib/lesson";
import { FOCUS } from "@/App";
import { useTheme, type Modo } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// mesmas strings de Home/Review/Track (DESIGN-AJUDA §3)
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
const OVERLINE = "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70";

// destaque dentro das respostas — mesmo B do Pro
const B = ({ children }: { children: ReactNode }) => <b className="font-medium text-foreground">{children}</b>;
// números e réguas em mono
const Mono = ({ children }: { children: ReactNode }) => <span className="font-mono tabular-nums">{children}</span>;

/* ── O MÉTODO — o loop frio → corrige → generaliza → espaça ── */

const METHOD = [
  { n: "01", tag: "frio", icon: EyeOff, t: "Tenta de cabeça", d: "Responda a questão sem olhar nada. O esforço de puxar da memória — mesmo errando — é o que grava." },
  { n: "02", tag: "corrige", icon: Eye, t: "Confere em dois tempos", d: "Revele primeiro só os pontos-chave e ache o que faltou; responda de novo e só então confira a resposta. Erro percebido fixa mais que acerto fácil. No fim, o Tutor pode corrigir por IA — nota, acertos e gaps." },
  { n: "03", tag: "generaliza", icon: PenLine, t: "Comprime com a sua palavra", d: "Anote nas Anotações da task, em 2–4 frases, o que entendeu e onde errou. O cérebro esmaga o conteúdo no mínimo revisável." },
  { n: "04", tag: "espaça", icon: RotateCcw, t: "Revisa no tempo certo", d: "A task volta em intervalos crescentes: acertou, espaça mais; errou, volta amanhã. Acertou até a última caixa, ela está dominada." },
];

/* ── PERGUNTAS — 10 FAQs em 3 grupos (auditoria DESIGN-AJUDA §2.2/§4) ── */

type Faq = { q: string; a: ReactNode };

const FAQ_GROUPS: { label: string; items: Faq[] }[] = [
  {
    label: "o método",
    items: [
      {
        q: "Como funciona a revisão espaçada (as caixas)?",
        a: (
          <>
            Cada task concluída entra numa escada de <B>8 caixas</B>: <Mono>1 → 2 → 3 → 4 → 7 → 15 → 21 → 30</Mono> dias. Acertou na revisão, sobe de caixa e o intervalo cresce; errou, volta pra caixa 1 e reaparece amanhã. Acertou na última, a task <B>gradua</B>: vira dominada e sai da fila. A barrinha no topo de cada card de revisão mostra em que degrau ela está.
          </>
        ),
      },
      {
        q: "Qual a diferença entre concluída e dominada?",
        a: (
          <>
            <B>Concluída</B> é o checkbox: você estudou a task e marcou feita — ela entra na fila e volta <B>amanhã</B> pra primeira revisão. <B>Dominada</B> é prova real: você acertou essa task nas revisões até o topo da escada. Marcar feito não convence a Fixa — só o acerto repetido, com semanas de distância, conta como saber.
          </>
        ),
      },
      {
        q: "O que é a correção do Tutor?",
        a: (
          <>
            Ao fechar uma task, o Tutor lê a resposta que você escreveu e devolve <B>nota 0–10</B>, os acertos, os gaps (com a correção) e uma dica de fixação. Ele corrige com base no material da task, não na internet — e a nota <B>não mexe nas caixas</B>: o Acertei/Errei da revisão continua sendo seu. No grátis você tem <B>5 correções</B> de degustação, uma cortesia única; no Pro, <B>100 por mês</B>. É correção por IA — pode errar; desconfie, confira, aprenda.
          </>
        ),
      },
      {
        q: 'O que o botão "intercalar" faz na revisão?',
        a: (
          <>
            Com 2 ou mais temas na fila, ele <B>mistura os cards</B> em vez de agrupar por tema. Alternar assuntos força o cérebro a discriminar o contexto de cada resposta — fixa mais que revisar em bloco. Vem ligado; desligue se quiser um tema por vez (a sessão reinicia).
          </>
        ),
      },
      {
        q: "Posso sair no meio da sessão de revisão?",
        a: (
          <>
            Pode — o <B>X</B> no topo sai a qualquer momento. Cada card que você já avaliou foi salvo na hora; os que ficaram continuam na fila de hoje, te esperando.
          </>
        ),
      },
      {
        q: "O que muda quando eu coloco a data da prova?",
        a: (
          <>
            Duas coisas: o tema ganha uma <B>meta diária</B> (~N tasks/dia pra concluir tudo a tempo) e a agenda se adapta — <B>nenhuma revisão é marcada pra depois da prova</B>. Você define a data no cabeçalho da tela do tema, e pode editar ou remover quando quiser.
          </>
        ),
      },
    ],
  },
  {
    label: "conteúdo e temas",
    items: [
      {
        q: "De onde vem o conteúdo dos temas?",
        a: (
          <>
            Da IA, do jeito que você preferir. <B>"Gerar tema"</B> cria a trilha inteira em 1 clique (no grátis você tem 1 geração de degustação; no Pro, 30 por mês). O <B>fluxo manual</B> é grátis e sem limite: a Fixa monta um prompt, você cola no seu chat (ChatGPT, Gemini…) e importa o JSON que ele devolve. Nos dois casos tudo é editável depois — abra o detalhe da task (setinha à direita) e toque em <B>editar conteúdo</B>; e dá pra anexar epics novos no fim da trilha.
          </>
        ),
      },
      {
        q: "O import deu erro perto de um link — o que faço?",
        a: (
          <>
            O chat às vezes "linkifica" uma URL ao copiar e isso quebra o JSON. Apague o trecho <Mono>[...](...)</Mono> deixando só o texto simples, ou peça pro modelo responder sem links.
          </>
        ),
      },
      {
        q: "Excluí um tema sem querer — dá pra voltar?",
        a: (
          <>
            Dá. Excluir manda o tema pra <B>Lixeira</B>, no fim da tela de temas — restaurar traz tudo de volta, incluindo o progresso das revisões. Só "apagar de vez" é permanente.
          </>
        ),
      },
    ],
  },
  {
    label: "conta e plano",
    items: [
      {
        q: "O que é grátis e o que é do Pro?",
        a: (
          <>
            O método inteiro é grátis pra sempre: <B>revisões ilimitadas</B>, até <B>2 temas</B> ativos, fluxo manual sem limite, <B>1 geração por IA</B> e <B>5 correções do Tutor</B> de degustação. O Pro tira o teto: <B>temas ilimitados</B>, <B>30 gerações por IA/mês</B> (máx. 10/dia) e <B>100 correções do Tutor/mês</B>. Os detalhes e preços estão na aba <B>Pro</B>.
          </>
        ),
      },
      {
        q: "Dá pra usar no tema claro?",
        a: (
          <>
            Dá. Em <B>Ajuda › aparência</B> você escolhe entre automático, claro e escuro — automático segue o modo do celular. O sol/lua no canto superior direito faz a mesma troca em um toque.
          </>
        ),
      },
      {
        q: "Esqueci minha senha — e agora?",
        a: (
          <>
            Na tela de entrar, toque em <B>esqueci a senha</B>: enviamos um link por e-mail pra criar uma nova (vale <B>1 hora</B>). Não chegou? Confira o spam — e dá pra pedir outro link quando quiser. Logado, a troca de senha ainda não existe: saia da conta e use o mesmo fluxo.
          </>
        ),
      },
    ],
  },
];

/* ── acordeão nativo — <details> sem lib, sem animação (corte seco) ── */

function FaqItem({ q, a }: Faq) {
  return (
    <details className="group rounded-lg border border-border bg-card">
      <summary className={cn("flex cursor-pointer list-none items-center gap-2 rounded-lg p-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden", FOCUS)}>
        <span className="flex-1">{q}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-3.5 pb-3.5 text-sm leading-relaxed text-muted-foreground">{a}</div>
    </details>
  );
}

/* ── aparência — a casa com palavra do sol/lua do header (DESIGN-ENGAJAMENTO §8.2) ── */

const MODOS: { v: Modo; label: string }[] = [
  { v: "auto", label: "automático" },
  { v: "light", label: "claro" },
  { v: "dark", label: "escuro" },
];

function Aparencia() {
  const { modo, setModo } = useTheme();
  return (
    <section className="mt-10">
      <h2 className={EYEBROW}>aparência</h2>
      <Card className="mt-3 gap-0 p-4">
        <p className="text-sm">tema</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">o sol/lua no topo faz a mesma troca</p>
        <div role="radiogroup" aria-label="tema do app" className="mt-3 flex overflow-hidden rounded-lg border border-border">
          {MODOS.map((m) => (
            <button
              key={m.v}
              role="radio"
              aria-checked={modo === m.v}
              onClick={() => setModo(m.v)}
              className={cn(
                "h-11 flex-1 border-r border-border text-[13px] transition-colors last:border-r-0",
                modo === m.v ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                FOCUS,
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">automático segue o modo do seu celular.</p>
      </Card>
    </section>
  );
}

/* ── lembretes — a casa de quem recusou o convite da primeira abertura (DESIGN-PUSH.md §5) ── */

const LINHA = "flex items-center justify-between gap-3";

function Lembretes() {
  const { data: cfg, refetch } = useApi(getConfig, []);
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [indo, setIndo] = useState(false);
  useEffect(() => { estadoPush().then(setEstado); }, []);
  if (!cfg?.pushKey) return null; // servidor sem VAPID: não prometer o que não existe

  const on = cfg.remindersOn;
  const alterna = async () => {
    setIndo(true);
    try {
      setEstado(estado === "on" ? await desligarPush() : await ligarPush(cfg.pushKey));
      refetch(true);
    } finally { setIndo(false); }
  };
  const desligarTudo = async (ligado: boolean) => {
    setIndo(true);
    try {
      await setReminders(ligado);
      if (!ligado && estado === "on") setEstado(await desligarPush());
      refetch(true);
    } finally { setIndo(false); }
  };
  const rotulo = estado === "on" ? "desligar" : "ativar";
  return (
    <section className="mt-10">
      <h2 className={EYEBROW}>lembretes</h2>
      <Card className="mt-3 gap-0 p-4">
        <div className={LINHA}>
          <div className="min-w-0">
            <p className="text-sm">notificação no aparelho</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {estado === "sem-suporte"
                ? "este navegador não recebe notificação — funciona no app da Play e no Chrome do Android"
                : estado === "negado"
                  ? "bloqueada nas permissões deste site — libere no cadeado da barra de endereço"
                  : "um toque por dia, na hora em que revisar rende mais"}
            </p>
          </div>
          {on && estado !== "sem-suporte" && estado !== "negado" && (
            <button onClick={alterna} disabled={indo} className={cn("inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-[13px] font-medium disabled:opacity-60", estado === "on" ? "bg-secondary text-foreground" : "bg-primary/10 text-primary", FOCUS)}>
              {indo ? "…" : rotulo}
            </button>
          )}
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm">e-mail</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            deixou de ser diário: chega quando a fila cresce depois de uns dias parado, na reta final da prova e no aviso de pausa. Sem notificação ligada, vira um resumo toda segunda.
          </p>
        </div>
        <div className={cn("mt-3 border-t border-border pt-3", LINHA)}>
          <div className="min-w-0">
            <p className="text-sm">receber lembretes</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">desligado aqui, nenhum dos dois canais fala. Sua fila continua guardada.</p>
          </div>
          <button
            role="switch"
            aria-checked={on}
            aria-label="receber lembretes"
            onClick={() => desligarTudo(!on)}
            disabled={indo}
            className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60", on ? "bg-primary" : "bg-muted", FOCUS)}
          >
            <span className={cn("inline-block h-5 w-5 rounded-full bg-background shadow transition-transform", on ? "translate-x-[22px]" : "translate-x-0.5")} />
          </button>
        </div>
      </Card>
    </section>
  );
}

export function Ajuda({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Como estudar na Fixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Não é releitura — é esforço de lembrar. Cada task roda este loop.</p>
      </div>

      <section>
        <h2 className={`mb-3 ${EYEBROW}`}>o método</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METHOD.map((m) => (
            <Card key={m.n} className="p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><m.icon className="h-4 w-4" /></span>
                <span className="font-mono text-xs tabular-nums text-primary">{m.n}</span>
                <span className={OVERLINE}>{m.tag}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{m.t}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{m.d}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] tabular-nums text-muted-foreground/70">revisa em 1d · 2d · 3d · 4d · 7d · 15d · 21d · 30d</p>
      </section>

      <section>
        <h2 className={`mb-3 ${EYEBROW}`}>a ciência</h2>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">A Fixa não inventou moda — é feita das duas únicas técnicas de estudo que a ciência classifica como de alta utilidade:</p>
          <ul className="mt-2.5 space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>
                <B>Recall ativo:</B> tentar lembrar — mesmo errando — grava mais que reler. Por isso a resposta nasce escondida, em todas as telas. <span className="font-mono text-[11px] text-muted-foreground/70">(Roediger &amp; Karpicke, 2006)</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-recall" />
              <span>
                <B>Revisão espaçada:</B> rever no intervalo em que você está quase esquecendo é o que fixa de vez. Por isso a fila "Revisar hoje" traz cada task na hora certa. <span className="font-mono text-[11px] text-muted-foreground/70">(Cepeda et al., 2006)</span>
              </span>
            </li>
          </ul>
          <p className="mt-3 border-t border-border pt-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground/70">Dunlosky et al., 2013 — num ranking de 10 técnicas, só estas duas são 'alta utilidade'. Reler e grifar, o que a maioria faz, ficaram no fim da lista.</p>
        </Card>
      </section>

      <section>
        <h2 className={`mb-3 ${EYEBROW}`}>perguntas</h2>
        <div className="space-y-5">
          {FAQ_GROUPS.map((g) => (
            <div key={g.label}>
              <p className={`mb-2 ${OVERLINE}`}>{g.label}</p>
              <div className="space-y-2">
                {g.items.map((f) => (
                  <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Lembretes />

      <Aparencia />

      {/* a casa da conta (DESCOBRIBILIDADE §2): as ações com PALAVRA — o ícone do header vira atalho */}
      <section className="mt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">sua conta</h2>
        <Card className="mt-3 gap-0 p-4">
          <p className="text-sm">logado como <span className="font-medium">{me.email}</span></p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <a href="/api/export" download className={cn(QUIET_BTN, FOCUS)}><Download className="h-4 w-4" /> exportar meus dados</a>
            <button onClick={onLogout} className={cn(QUIET_BTN, FOCUS)}><LogOut className="h-4 w-4" /> sair da conta</button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/70">o export baixa um JSON com todos os seus temas, respostas e progresso — seus dados são seus, sempre.</p>
        </Card>
      </section>
    </div>
  );
}
