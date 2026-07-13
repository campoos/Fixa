# Fila de retorno — anti-burnout da revisão (spec cirúrgica UX+UI)

> **Origem:** PARECER-CEO §3 P6 ("card mountain" — razão nº 1 de abandono de SR, fontes My
> Senpai/KevinMD), validado pelo dono (13/07): "tem esse problema mesmo".
> **O problema no código:** `review-engine.js` é Leitner puro `[1,2,3,4,7,15,21,30]`; due =
> `next <= hoje` SEM teto; usuário some 10 dias com 40 tasks na régua → volta pra parede de 40
> no badge, na Home e no player.
> **Lei de método (`METODO-CIENCIA-E-PRODUTO.md`):** honestidade — NUNCA apagar/pular revisão
> silenciosamente; o espaçamento é a promessa do produto. `gradeEntry` já recalcula de HOJE
> (sem cascata) — certo, não mexer.
> **Arquivos tocados:** `review-engine.js` (+ testes), `server.js`, `web/src/lib/api.ts`,
> `web/src/App.tsx`, `web/src/screens/Review.tsx`, `web/src/screens/Home.tsx`.
> `Track.tsx` NÃO muda (decisão §3).

---

## 1. Estratégia escolhida: SESSÃO DOSADA por fragilidade (uma linha, três modos)

**Decisão:** quando há backlog, a sessão do dia vira uma **dose fixa das mais frágeis**
(`REVIEW_DOSE = 12`), ordenadas por **caixa asc → next asc**; o resto **não é reagendado** —
continua devido, visível, e drena dose a dose (cada item avaliado sai da parede sozinho:
acertou → futuro, errou → amanhã). Quem quiser mais faz **outra dose em seguida** — escolha,
nunca obrigação.

**Por que esta linha e não as outras:**
- *Teto diário permanente* — rejeitado: em dia normal atrasaria revisão sistematicamente
  (fere "no ponto certo"). A dose só liga quando existe item **atrasado** (`next < hoje`) E a
  fila passa da dose — dia normal carregado (ex.: concluiu 20 tasks ontem) roda cheio.
- *Amortização explícita (reagendar o backlog em N dias)* — rejeitado: reagendar por decreto é
  mexer no `next` de item já vencido = adiar revisão sem avaliação. A amortização aqui é
  **emergente**: o grade reagenda, o plano não.
- *Amnesty (reset de caixas)* — rejeitado: apaga histórico de memória real; é a violação
  máxima da honestidade.
- *Priorização por atraso puro* — rejeitada em favor de **caixa primeiro**: retenção decai
  relativo à estabilidade (caixa baixa = intervalo curto = memória menos consolidada); com o
  mesmo atraso, a caixa 1 esqueceu muito mais que a caixa 6. Atraso (`next` asc) é o
  desempate. É o testing effect aplicado: o esforço de recuperar rende mais onde a memória
  está mais frágil — e recuperar 12 bem vale mais que 40 no piloto automático.
- *Interleaving mantido*: a **seleção** é por fragilidade; a **ordem** dentro da dose continua
  intercalável por tema (toggle atual) — 12 cards serão todos feitos, a ordem interna é livre.

**Modo prova (override):** se algum tema com due tem `targetDate` a **≤ 7 dias**, a dose
DESLIGA — fila inteira, ordenada por fragilidade, com copy própria. Perto da prova, cobertura
vence conforto: adiar revisão pra depois da prova é perdê-la.

Resumo dos três modos (função pura, decidida no server):

| Modo | Condição | Sessão | Copy |
|---|---|---|---|
| `normal` | sem atrasadas, OU total ≤ 12 | fila inteira (next asc, como hoje) | atual, intocada |
| `retorno` | ≥1 atrasada E total > 12 E sem prova ≤7d | 12 mais frágeis (box asc, next asc) | §4 |
| `prova` | ≥1 atrasada E total > 12 E prova ≤7d | fila inteira, box asc → next asc | §4 |

---

## 2. Motor e contratos

### 2.a `review-engine.js` — só ADIÇÕES puras (nada existente muda; os 11 testes passam intactos)

Inserir após `gradeEntry` (hoje linha 37):

```js
// anti-burnout (DESIGN-FILA-RETORNO): a sessão do dia. Dose fixa quando há backlog;
// fila inteira em dia normal ou em reta final de prova. NUNCA reagenda nada — só seleciona.
export const REVIEW_DOSE = 12;
const byFragility = (a, b) => (a.box - b.box) || (a.next < b.next ? -1 : a.next > b.next ? 1 : 0);
export function planSession(due, today, minDaysLeft = null) {
  const overdue = due.filter((d) => d.next < today).length;
  const examSoon = minDaysLeft != null && minDaysLeft <= 7;
  if (!overdue || due.length <= REVIEW_DOSE)
    return { mode: "normal", session: due, rest: 0, overdue };
  const sorted = [...due].sort(byFragility);
  if (examSoon) return { mode: "prova", session: sorted, rest: 0, overdue };
  return { mode: "retorno", session: sorted.slice(0, REVIEW_DOSE), rest: due.length - REVIEW_DOSE, overdue };
}
```

**Testes novos** em `test/review-engine.test.mjs` (mínimo 6): fila vazia → `normal`/`[]`;
8 due c/ 3 atrasadas → `normal` cheia (≤ dose não faz cerimônia); 40 due/30 atrasadas →
`retorno` com 12, box asc, desempate por next asc, `rest: 28`; 20 due zero atrasadas →
`normal` cheia (teto não vira regime); prova em 5d + 50 due → `prova`, 50 ordenadas por
fragilidade, `rest: 0`; prova em 10d → `retorno` normal (7 é o corte).

### 2.b `server.js`

- **`globalReview`** (hoje linhas 306–320): após o `due.sort` atual, computar
  `minDaysLeft` (menor `daysBetween(today, targetDate)` ≥ 0 entre os tracks **que têm item na
  fila** e `targetDate`) e retornar o plano junto:
  ```js
  const plan = planSession(due, today, minDaysLeft);
  return { due, ladder: REVIEW_LADDER, mode: plan.mode, session: plan.session, rest: plan.rest };
  ```
- **`/api/stats`** (hoje linha 245): `dueToday` MANTÉM o total (é mapa); adicionar
  `doseToday: gr.session.length` e `dueMode: gr.mode` (onde `gr = globalReview(ud)` — já é
  chamado ali).
- **`/api/review`** (linha 615): sem mudança — já devolve o `globalReview` novo.
- **E-mail cron** (linhas 482–497): ver §5.

### 2.c `web/src/lib/api.ts`

- `ReviewList` (linha 64) → `{ due: Due[]; ladder: number[]; mode: "normal" | "retorno" | "prova"; session: Due[]; rest: number }`.
- `Stats` (linha 128) ganha `doseToday: number; dueMode: "normal" | "retorno" | "prova"`.

---

## 3. O número — regra única entre superfícies

**Número de AÇÃO = dose · número de MAPA = total.** Badge e CTA dizem "o que eu faço agora"
(a dose); mapa diz "o que existe" (o total). A parede nunca é escondida — ela só para de ser
a manchete.

| Superfície | Mostra | Mudança |
|---|---|---|
| Badge tab bar + nav desktop (`App.tsx`) | **dose** (`review.session.length`) | linha 68: `const dueCount = review?.session.length ?? 0;` — resto do badge intocado |
| Home `ReviewCard` | dose como manchete, total como contexto | §4.b |
| `/revisar` (player) | dose na sessão, total no banner | §4.a |
| `ThemeCard` (chip ↻ N) e `TaskPeek` | **total do tema** — inalterado | nenhuma (é mapa/inventário: "quanto este tema tem pendente" orienta escolha, não cobra) |
| E-mail | dose na manchete, total no corpo | §5 |

---

## 4. Copy do retorno — acolher, não culpar

Princípios: o streak zerado já doeu; nenhum "você sumiu", nenhum "atrasadas" como manchete.
A palavra da casa é **dose** (finita, saudável, escolhível) e a atitude é "voltar é o que
importa". Números sempre mono tabular.

### 4.a `/revisar` (`Review.tsx`)

1. **Fila da sessão** (anchor linha 146): `const base = [...data.due];` →
   `const base = [...data.session];` (interleave continua aplicando sobre `base`).
2. **Eyebrow** (linha 232): `revisão de hoje` vira por modo — `normal`: `revisão de hoje` ·
   `retorno`: `sessão de retorno` · `prova`: `reta final`.
3. **Banner de modo** (novo, entre o header e a barra de progresso — após a linha 247), só
   quando `mode !== "normal"`:
   ```tsx
   {data.mode === "retorno" && (
     <p className="mt-3 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs leading-relaxed text-recall">
       Você voltou — é o que importa. Hoje: as <span className="font-mono font-semibold tabular-nums">{data.session.length}</span> mais
       frágeis; as outras <span className="font-mono font-semibold tabular-nums">{data.rest}</span> seguem na fila, sem pressa.
     </p>
   )}
   {data.mode === "prova" && (
     <p className="mt-3 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs leading-relaxed text-recall">
       Prova chegando — hoje sem dose: a fila inteira, começando pelas mais frágeis.
     </p>
   )}
   ```
   (mesma moldura âmbar do banner de conflito da Lição — âmbar é a tinta da revisão/tempo;
   informativo, não erro.)
4. **`SessionDone`** (anchors linhas 94–121): ganha props `rest: number` e
   `onMore: () => void`. Quando `rest > 0` (só acontece em retorno):
   - linha de método (linha 114) vira: `Dose de hoje feita. {rest} seguem na fila — mais uma
     dose agora, se quiser; senão, amanhã tem mais.` (com `{rest}` mono tabular);
   - ações: botão **`Mais uma dose ({min(12, rest)})`** entra ANTES de "Voltar aos temas";
     `onMore = () => refetch()` — o refetch remonta a sessão com o plano novo (mecânica que o
     "Ver fila" atual já usa; o botão "Ver fila" é substituído por este quando `rest > 0`).
   Quando `rest === 0`: tudo como hoje.
5. **`EmptyQueue`** e o resto do player: intocados.

### 4.b Home (`Home.tsx`, `ReviewCard` linhas 27–48 + uso linha 362)

Props passam de `{ due: number }` pra `{ s: Stats }` (uso: `<ReviewCard s={s} />`). Fila
vazia: intocado. Com fila:

- `dueMode === "normal"`: card atual intocado (`{dueToday} tasks na fila`).
- `dueMode === "retorno"`:
  - título: **`Retomar revisões`**; chip da direita: **`Retomar`** (mesmas classes);
  - subtítulo: `hoje: {doseToday} · na fila: {dueToday}` (números mono tabular —
    `<span className="font-mono tabular-nums">`).
- `dueMode === "prova"`: título `Revisar hoje` (atual); subtítulo:
  `{dueToday} na fila · reta final da prova`.

### 4.c Microcopy consolidada

| Contexto | Texto |
|---|---|
| Eyebrow retorno / prova | "sessão de retorno" / "reta final" |
| Banner retorno | "Você voltou — é o que importa. Hoje: as {12} mais frágeis; as outras {28} seguem na fila, sem pressa." |
| Banner prova | "Prova chegando — hoje sem dose: a fila inteira, começando pelas mais frágeis." |
| Fim de sessão (rest>0) | "Dose de hoje feita. {28} seguem na fila — mais uma dose agora, se quiser; senão, amanhã tem mais." |
| Botão pós-dose | "Mais uma dose ({12})" |
| Home retorno | "Retomar revisões" · "hoje: {12} · na fila: {40}" · chip "Retomar" |
| Live region (fim, rest>0) | acrescentar "— {28} seguem na fila" à mensagem atual |

Proibido nesta copy: "atrasadas" como manchete, "você perdeu", qualquer culpa pelo streak.

---

## 5. E-mail de lembrete (server.js, linhas 482–497)

O cron passa a usar o plano (`gr = globalReview(ud)`; `due` continua sendo `gr.due.length`):

- **`mode === "normal"`** (ou fila ≤ dose): e-mail atual, intocado.
- **`mode === "retorno"`** — assunto e título trocam a parede pela dose; o total aparece no
  corpo (honestidade), nunca na manchete:
  - subject: `` `Sua dose de hoje: ${gr.session.length} revisões — Fixa` ``
  - title: `` `${gr.session.length} revisões — a dose de hoje.` ``
  - bodyHtml (parágrafo): `A fila cresceu enquanto você esteve fora — acontece, e ela não
    cobra juros. A Fixa separou as ${gr.session.length} mais frágeis pra hoje; as outras
    ${gr.rest} vão em doses, no seu ritmo. Leva poucos minutos.`
- **`mode === "prova"`**: subject `` `Reta final: ${due} revisões antes da prova — Fixa` ``;
  corpo atual + frase "prova chegando — vale encarar a fila inteira".
- Cadência diária e opt-out: **inalterados** (mudar cadência/digest é decisão separada —
  registrada em §6 como futuro, não neste escopo).

---

## 6. O que NÃO fazer (registrado, é lei)

1. **Nunca apagar, pular ou reagendar revisão sem avaliação.** `planSession` só SELECIONA;
   nenhum `next` é tocado fora do `gradeEntry`. Não existe "arquivar backlog", "perdoar fila"
   nem reset de caixa automático.
2. **Nunca esconder o total.** A dose é manchete; o total está sempre a um olhar (banner do
   player, subtítulo da Home, corpo do e-mail, chips por tema).
3. **Não mexer em `gradeEntry`/`seedEntry`/`clampNext`/régua** — o recálculo a partir de hoje
   (sem cascata) já é o comportamento certo e os 11 testes o protegem.
4. **Teto não vira regime**: dia normal (zero atrasadas) roda a fila inteira, sempre — mesmo
   com 20+ itens (coorte auto-infligida de quem concluiu muito ontem é honesta).
5. **Nota do Tutor continua fora da fila** (DESIGN-TUTOR-IA §5).
6. Futuro consciente (fora deste escopo): digest/cooldown do e-mail após N dias ignorados;
   dose configurável; sugestão de amnesty MANUAL (usuário escolhe resetar um tema) — cada um
   exige decisão própria.

---

## 7. Checklist de aceite (cenários do brief)

- [ ] **3 dias fora, 8 due (3 atrasadas):** modo `normal` — player, badge (8), Home e e-mail
  exatamente como hoje; nenhuma cerimônia de retorno.
- [ ] **10 dias fora, 40 due:** badge/nav mostram **12**; Home mostra "Retomar revisões ·
  hoje: 12 · na fila: 40"; player abre "sessão de retorno" com banner acolhedor e 12 cards
  (caixas mais baixas primeiro; empate = mais antiga primeiro); fim da sessão oferece "Mais
  uma dose (12)" que remonta a sessão com as 12 seguintes; nenhuma task teve `next` alterado
  sem grade; e-mail do dia lidera com 12 e menciona 28 no corpo.
- [ ] **50 due, nenhuma atrasada:** modo `normal`, fila inteira — o teto não dispara sem
  backlog.
- [ ] **Prova em 5 dias + backlog:** modo `prova` — fila inteira ordenada por fragilidade,
  eyebrow "reta final", banner próprio, badge com o total; e-mail "Reta final".
- [ ] **Honestidade auditável:** com 40 due, somar `session.length + rest === due.length`;
  grep no diff: nenhuma escrita em `rv.next` fora de `gradeEntry`/`seedEntry`.
- [ ] **Motor:** `npm test` verde — 11 testes antigos intocados + ≥6 novos de `planSession`
  (§2.a).
- [ ] **Interleaving:** toggle intercalar segue funcionando dentro da dose; desligado, a dose
  aparece em ordem de fragilidade pura.
- [ ] **Copy:** zero "atrasadas" como manchete, zero exclamação, zero culpa; "dose" é a
  palavra em todas as superfícies de retorno; números sempre `font-mono tabular-nums`.
