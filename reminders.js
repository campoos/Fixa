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

// dias sem atividade hoje (fallback: data de criação da conta)
export function daysInactive(ud, createdAt, today = spDay()) {
  const last = lastActiveDay(ud) ?? (createdAt || "").slice(0, 10) ?? today;
  return Math.max(0, daysBetween(last, today));
}
