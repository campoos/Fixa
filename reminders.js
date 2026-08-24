// Lembretes v2 (DESIGN-LEMBRETES-V2): pool com rotação determinística + smart pause honesto.
// Puro e testável — o cron do server só orquestra. Lei da casa: 1 e-mail/dia no máximo,
// zero culpa, streak só quando vivo, "atrasadas" nunca como manchete.

import { spDay, daysBetween } from "./review-engine.js";

// rotação determinística: cicla o pool na ordem, com offset por usuário —
// nunca repete em dias consecutivos, zero Math.random, 100% testável
const hash = (s) => [...s].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
const dayN = (ymd) => Math.floor(Date.parse(ymd + "T00:00:00Z") / 86400000);
export const pickVariant = (pool, userId, ymd) => pool[(hash(userId) + dayN(ymd)) % pool.length];

export const rev = (n) => `${n} ${n === 1 ? "revisão" : "revisões"}`;

// último dia com atividade (maior chave de ud.activity com count>0); null se nunca estudou
export function lastActiveDay(ud) {
  let last = null;
  for (const [d, c] of Object.entries(ud.activity || {})) if (c > 0 && (!last || d > last)) last = d;
  return last;
}

// cadência derivada, sem contadores persistidos (§2): qualquer atividade reseta sozinha
export function reminderCadence(daysInactive) {
  if (daysInactive <= 6) return "daily";
  if (daysInactive === 7) return "pause-notice";
  if ([14, 21, 28].includes(daysInactive)) return "weekly";
  if ([58, 88].includes(daysInactive)) return "monthly";
  return "silent";
}

// ---- pools do diário (§1) — placeholders resolvidos em buildReminder ----
const NORMAL = [
  { s: (v) => `${rev(v.n)} te esperam hoje — Fixa`, t: (v) => `${rev(v.n)} no ponto certo.`, b: () => `Essas tasks voltaram hoje porque é agora que revisar rende mais — pouco antes de o cérebro soltar. Leva poucos minutos, e o dia conta pra sua consistência.` },
  { s: (v) => `Hoje: ${rev(v.n)}, poucos minutos — Fixa`, t: (v) => v.n === 1 ? `Poucos minutos hoje seguram 1 memória.` : `Poucos minutos hoje seguram ${v.n} memórias.`, b: () => `Revisar no dia certo é o que deixa o intervalo crescer — cada acerto de hoje empurra a task pra mais longe. É assim que ela gradua.` },
  { s: (v) => `A fila de hoje: ${v.n} — Fixa`, t: (v) => `${v.n} na fila — quase soltando.`, b: (v) => `A curva do esquecimento não espera, mas também não corre: essas ${rev(v.n)} estão exatamente no ponto em que relembrar fixa de vez.` },
  { s: (v) => `${rev(v.n)} — e a conta do dia fecha — Fixa`, t: (v) => `${rev(v.n)} e o dia está feito.`, b: () => `A sessão de hoje é curta. Abrir, responder de cabeça, conferir — o espaçamento faz o resto sozinho.` },
];
const RETORNO = [
  { s: (v) => `Sua dose de hoje: ${v.dose} revisões — Fixa`, t: (v) => `${v.dose} revisões — a dose de hoje.`, b: (v) => `A fila cresceu enquanto você esteve fora — acontece, e ela não cobra juros. A Fixa separou as ${v.dose} mais frágeis pra hoje; as outras ${v.rest} vão em doses, no seu ritmo.` },
  { s: (v) => `Recomeço leve: ${v.dose} revisões — Fixa`, t: (v) => `Só ${v.dose} hoje. O resto espera.`, b: (v) => `Voltar é o que importa. Começa pelas ${v.dose} mais frágeis; as ${v.rest} restantes têm vez — uma dose por dia até a fila voltar ao normal.` },
  { s: (v) => `${v.dose} agora, ${v.rest} depois — Fixa`, t: () => `A fila não é parede: é fila.`, b: (v) => `Hoje são ${v.dose} revisões, escolhidas pela memória mais frágil primeiro. Ninguém encara ${v.n} de uma vez — nem precisa.` },
];
const PROVA = [
  { s: (v) => `Reta final: ${rev(v.n)} antes da prova — Fixa`, t: (v) => `${rev(v.n)} entre você e a prova.`, b: () => `É a semana em que revisar mais rende — o que você refrescar agora chega vivo no dia. Hoje sem dose: a fila inteira, começando pelas mais frágeis.` },
  { s: (v) => v.d === 0 ? `A prova é hoje — a fila: ${v.n} — Fixa` : `Prova em ${v.d} ${v.d === 1 ? "dia" : "dias"} — a fila de hoje: ${v.n} — Fixa`, t: (v) => v.d === 0 ? `Hoje. ${v.n} revisões. Dá.` : `${v.d} ${v.d === 1 ? "dia" : "dias"}. ${v.n} revisões. Dá.`, b: () => `O espaçamento já fez a parte dele; a reta final é garantir que nada esfrie. Vale encarar a fila completa hoje.` },
];

// ---- copies das cadências reduzidas (§2) ----
const SPECIAL = {
  "pause-notice": {
    s: () => `Vou dar um tempo nos lembretes — Fixa`,
    t: () => `Uma semana de lembrete sem sessão — vou espaçar.`,
    b: (v) => `Sete e-mails não trouxeram você de volta, então o problema não é lembrar — é momento, e tá tudo bem. Vou escrever só de vez em quando. Sua fila fica guardada (${rev(v.n)} esperam, sem juros), e qualquer sessão sua reativa o lembrete diário na hora. Espaçar funciona pra memória; deve funcionar pra lembrete também.`,
  },
  weekly: {
    s: () => `Sua fila continua guardada — Fixa`,
    t: (v) => `${rev(v.n)}, zero pressa.`,
    b: () => `Sem cobrança — só o registro de que sua trilha está inteira, do jeito que você deixou. Uma dose pequena já reativa o ritmo.`,
  },
  monthly: {
    s: () => `A Fixa continua aqui — Fixa`,
    t: () => `Sua trilha está guardada.`,
    b: (v) => `Duas linhas só pra dizer que nada se perdeu: ${rev(v.n)} guardadas e o método esperando. Quando fizer sentido, a primeira dose é pequena.`,
  },
  // ---- eventos pontuais do e-mail (v3) ----
  retorno: {
    s: () => `Sua fila está esperando — Fixa`,
    t: (v) => `${rev(v.n)} guardadas, sem juros.`,
    b: () => `Três dias sem sessão — nada se perdeu. Quando voltar, a Fixa separa as memórias mais frágeis primeiro e o resto vai em doses. Um e-mail só: o dia a dia mora na notificação.`,
  },
  prova: {
    s: (v) => (v.d === 1 ? `Amanhã é a prova — Fixa` : `Falta uma semana pra sua prova — Fixa`),
    t: (v) => (v.d === 1 ? `Amanhã. ${rev(v.n)} na fila.` : `Uma semana. ${rev(v.n)} na fila.`),
    b: (v) => (v.d === 1 ? `Hoje não é dia de matéria nova: é dia de refrescar o que já está quase pronto. A fila inteira, da mais frágil pra frente — é o que chega vivo amanhã.` : `A semana que mais rende começa agora. A partir daqui a Fixa solta a fila completa por dia, sem dose, pra nada esfriar antes da prova.`),
  },
  semanal: {
    s: (v) => `Sua semana no Fixa: ${rev(v.n)} — Fixa`,
    t: (v) => `${rev(v.n)} esperando.`,
    b: () => `Resumo de segunda, uma vez por semana. Se preferir o lembrete diário no aparelho, é só ligar a notificação em Ajuda — aí este e-mail some.`,
  },
};

// monta o e-mail do dia (§5): cadence decide a família; no diário, o modo da fila decide o pool
export function buildReminder({ cadence, mode, n, dose, rest, daysLeft, streak, userId, ymd }) {
  const v = { n, dose, rest, d: daysLeft };
  if (cadence !== "daily") {
    const c = SPECIAL[cadence];
    if (!c) return null;
    return { subject: c.s(v), title: c.t(v), bodyP: c.b(v) };
  }
  const pool = mode === "retorno" ? RETORNO : mode === "prova" ? PROVA : NORMAL;
  const pick = pickVariant(pool, userId, ymd);
  let bodyP = pick.b(v);
  // streak vivo se celebra; zerado nunca é mencionado (FILA-RETORNO §4)
  if (streak >= 3) bodyP += ` Seu ritmo: <strong>${streak} dias seguidos</strong> — a sessão de hoje mantém a conta.`;
  return { subject: pick.s(v), title: pick.t(v), bodyP };
}

// ---------------------------------------------------------------------------
// v3 — dois canais (DESIGN-PUSH.md): push carrega o dia a dia, e-mail vira evento.
// As leis do §4 valem igual nos dois: zero culpa, zero mascote, streak só quando vivo,
// nada de FOMO. O que muda é a régua de frequência, não o tom.
// ---------------------------------------------------------------------------

// Cadência do push. Mais insistente que a do e-mail de propósito: o toque é barato de
// ignorar e mora no aparelho. Some do mesmo jeito quando vira ruído (>13 dias parado).
export function pushCadence(daysInactive) {
  if (daysInactive <= 13) return "daily";
  if ([21, 28].includes(daysInactive)) return "weekly";
  return "silent";
}

const dow = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay(); // 0=dom, 1=seg

/**
 * Qual evento justifica um e-mail hoje — ou null pra ficar quieto.
 * Nada disso é contador persistido: tudo sai de (dias parado, dias pra prova, dia da semana),
 * então cada evento dispara sozinho uma vez e se reseta quando a pessoa estuda.
 */
export function emailEvent({ daysInactive, daysLeft = null, hasPush = false, ymd = spDay() }) {
  const c = reminderCadence(daysInactive);
  if (c === "silent") return null;
  if (c !== "daily") return c; // pause-notice / weekly / monthly: o reengajamento continua sendo e-mail
  if (daysLeft === 7 || daysLeft === 1) return "prova"; // reta final: dois avisos, nas datas
  if (daysInactive === 3) return "retorno"; // a fila cresceu — um aviso, não sete
  if (!hasPush && dow(ymd) === 1) return "semanal"; // quem recusou push não fica no vácuo
  return null;
}

// ---- pools do push (§1 v3): título curto, corpo de uma linha ----
const NORMAL_PUSH = [
  { t: (v) => `${rev(v.n)} no ponto certo`, b: () => `Poucos minutos e a conta do dia fecha.` },
  { t: (v) => `Hoje: ${rev(v.n)}`, b: () => `Revisar agora é o que faz o intervalo crescer.` },
  { t: (v) => `${v.n} na fila — quase soltando`, b: () => `É agora que relembrar fixa de vez.` },
  { t: (v) => `A dose de hoje: ${rev(v.n)}`, b: () => `Abrir, responder de cabeça, conferir.` },
];
const RETORNO_PUSH = [
  { t: (v) => `Sua dose de hoje: ${v.dose}`, b: (v) => `As mais frágeis primeiro. As outras ${v.rest} esperam.` },
  { t: (v) => `Recomeço leve: ${v.dose} revisões`, b: () => `Voltar é o que importa — o resto vai em doses.` },
  { t: (v) => `${v.dose} agora, ${v.rest} depois`, b: () => `A fila não é parede: é fila.` },
];
const PROVA_PUSH = [
  { t: (v) => (v.d === 0 ? `A prova é hoje — ${v.n} na fila` : `Prova em ${v.d} ${v.d === 1 ? "dia" : "dias"} — ${v.n} na fila`), b: () => `Hoje vale encarar a fila inteira, da mais frágil pra frente.` },
  { t: (v) => `Reta final: ${rev(v.n)}`, b: () => `O que refrescar agora chega vivo no dia da prova.` },
];
// segundo toque do dia (§4 v3): só quando a fila continua intocada. Constata, não cobra.
const NOITE_PUSH = [
  { t: () => `A fila de hoje ainda está aberta`, b: (v) => `${rev(v.n)} — dá pra fechar em poucos minutos.` },
  { t: () => `Ainda dá tempo hoje`, b: (v) => `${rev(v.n)} esperando, do jeito que você deixou.` },
];

/**
 * Monta a notificação. `slot` "manha" é o toque do dia; "noite" só existe pra fila intocada.
 * Devolve null quando não há o que dizer — o chamador não inventa fallback.
 */
export function buildPush({ cadence = "daily", mode, n, dose, rest, daysLeft, streak = 0, userId, ymd, slot = "manha" }) {
  const v = { n, dose, rest, d: daysLeft };
  if (!n) return null;
  if (cadence === "silent") return null;
  if (slot === "noite") {
    if (cadence !== "daily") return null; // à noite só o dia a dia; reengajamento nunca cutuca duas vezes
    const p = pickVariant(NOITE_PUSH, userId, ymd);
    return { title: p.t(v), body: p.b(v), tag: "fixa-noite", url: "/revisar" };
  }
  if (cadence === "weekly") return { title: `Sua fila continua guardada`, body: `${rev(n)} sem pressa. Uma dose pequena já reativa o ritmo.`, tag: "fixa-dia", url: "/revisar" };
  const pool = mode === "retorno" ? RETORNO_PUSH : mode === "prova" ? PROVA_PUSH : NORMAL_PUSH;
  const p = pickVariant(pool, userId, ymd);
  let body = p.b(v);
  if (streak >= 3) body += ` ${streak} dias seguidos.`; // streak vivo se celebra; zerado nem aparece
  return { title: p.t(v), body, tag: "fixa-dia", url: "/revisar" };
}

// dias sem atividade hoje (fallback: data de criação da conta)
export function daysInactive(ud, createdAt, today = spDay()) {
  const last = lastActiveDay(ud) ?? (createdAt || "").slice(0, 10) ?? today;
  return Math.max(0, daysBetween(last, today));
}

// ---- ativação: quem se cadastrou e nunca começou ----
// Todo o resto deste módulo pressupõe fila de revisão vencendo, e fila só nasce de tarefa
// concluída. Quem parou antes disso não era alcançado por nada — no teste fechado da Play,
// 10 dos 12 testadores. São dois toques e para: D+1, enquanto a intenção ainda é fresca, e
// D+3. Quem não voltou em três dias não volta por insistência, volta por produto melhor.
const ONBOARD = {
  "sem-tema": {
    d1: {
      subject: "Seu primeiro tema leva um minuto",
      title: "Falta escolher o que estudar",
      bodyP: "Você criou a conta e parou antes do primeiro tema. Descreva o assunto e, se tiver, a data da prova — a trilha sai pronta, dividida em tarefas curtas na ordem certa.",
    },
    d3: {
      subject: "Ainda dá tempo de começar",
      title: "Sua conta continua vazia",
      bodyP: "Nada foi criado por aqui ainda. Se travou em alguma coisa, a página de Ajuda explica o método em dois minutos. E se foi só falta de tempo: criar o primeiro tema leva um minuto.",
    },
  },
  "sem-estudo": {
    d1: {
      subject: "Sua trilha está pronta — falta a primeira tarefa",
      title: "A trilha está montada",
      bodyP: "Você montou o tema mas ainda não abriu a primeira tarefa. É dela que nasce a primeira revisão — e é a revisão no intervalo certo que faz o conteúdo grudar.",
    },
    d3: {
      subject: "A primeira tarefa continua te esperando",
      title: "Nenhuma tarefa concluída ainda",
      bodyP: "A trilha está lá, intacta. Uma tarefa só já coloca a revisão espaçada pra rodar: o Fixa devolve o conteúdo em 1, 2, 4, 7, 15 e 30 dias, sem você precisar lembrar de nada.",
    },
  },
};

export function buildOnboard({ variante, marco }) {
  return ONBOARD[variante]?.[marco] || null;
}
