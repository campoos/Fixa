# DESIGN-LEMBRETES-V2 — variedade, cadência honesta e o que aprender (e não) com o Duolingo

> **Origem:** pedido do dono (14/07): "variar datas, várias mensagens, algo pique Duolingo —
> baita inspiração". **Lei da casa que limita a inspiração:** FILA-RETORNO §4 — acolher, não
> culpar; zero culpa pelo streak; "atrasadas" nunca como manchete.
> **O que existe:** cron GitHub Actions 11:23 UTC → `POST /api/cron/reminders` (`server.js`
> ~490–540): 1 e-mail/dia por usuário com `due>0` e sem `remindersOff`; 1 variante por modo
> (normal/retorno/prova); opt-out assinado; shell em `email.js`. Sem tracking de opens — o
> único sinal é `ud.activity` (já existe, por dia).
> **Arquivos tocados:** `reminders.js` (NOVO, puro e testável), `server.js` (cron +
> `globalReview` devolve `daysLeft`), `test/reminders.test.mjs` (novo).

---

## 0. O que a pesquisa achou no Duolingo — e o veredito de cada item

| Mecânica Duolingo | Fonte | Veredito pro Fixa |
|---|---|---|
| **Cap rígido: 2 pushes/dia, cada slot com um propósito** | [Deconstructor of Fun — notifications](https://duolingo.deconstructoroffun.com/mechanics/notifications) | Adotar mais rígido ainda: **1 e-mail/dia, sempre** (e-mail ≠ push; a caixa não perdoa) |
| **Timing por janela de hábito** ("praticou 18h ontem → push 17h30 hoje"; zero broadcast de relógio) | idem | **Não dá hoje** — `activity` guarda contagem por DIA, sem hora. Fica registrado pra V3 (§3) |
| **Variedade de templates renovada** pra matar fadiga de notificação | [How Duolingo Perfected Push Notifications](https://tinomwadeyi.substack.com/p/how-duolingo-perfected-the-art-of) | **Adotar** — pool por modo com rotação determinística (§1) |
| **Streak como motor de retorno** (lembrete cita o streak vivo) | [Deconstructor — streaks](https://duolingo.deconstructoroffun.com/mechanics/streaks) | Adotar SÓ o lado bom: **celebrar streak vivo; streak zerado nunca é mencionado** (lei da casa) |
| **"Smart pause"**: "These reminders don't seem to be working. We'll stop sending them for now." | [Solve Marketing — case Duolingo](https://solve-marketing.agency/blog/en/ads-cases/duolingo-en/) · [Debugger/Medium](https://debugger.medium.com/duolingo-needs-to-chill-8f1832745ca0) | **Adotar a versão honesta** — é a melhor ideia deles: o app admite que insistir não funciona (§2) |
| Culpa/chantagem ("You made Duo sad", coruja passivo-agressiva, streak-terror 23h) | Debugger/Medium (a crítica) | **NÃO copiar — nunca** (§4) |

---

## 1. Pool de mensagens — rotação determinística

### 1.a Mecânica (em `reminders.js`, puro)

```js
// rotação determinística: cicla o pool na ordem, com offset por usuário —
// nunca repete em dias consecutivos, zero Math.random, 100% testável
const hash = (s) => [...s].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
const dayN = (ymd) => Math.floor(Date.parse(ymd + "T00:00:00Z") / 86400000);
export const pickVariant = (pool, userId, ymd) => pool[(hash(userId) + dayN(ymd)) % pool.length];
```

Placeholders: `{n}` = fila total · `{dose}`/`{rest}` = FILA-RETORNO · `{d}` = dias pra prova ·
plural tratado por helper (`rev(n)` = "1 revisão"/"N revisões"). Números sempre em destaque
(no título eles são o começo da frase; no corpo, `<strong>`).

### 1.b NORMAL — 4 variantes

| # | Assunto | Título | Corpo |
|---|---|---|---|
| N1 | `{rev(n)} te esperam hoje — Fixa` | `{n} revisões no ponto certo.` | Essas tasks voltaram hoje porque é agora que revisar rende mais — pouco antes de o cérebro soltar. Leva poucos minutos, e o dia conta pra sua consistência. |
| N2 | `Hoje: {rev(n)}, poucos minutos — Fixa` | `Poucos minutos hoje seguram {n} memórias.` | Revisar no dia certo é o que deixa o intervalo crescer — cada acerto de hoje empurra a task pra mais longe. É assim que ela gradua. |
| N3 | `A fila de hoje: {n} — Fixa` | `{n} na fila — quase soltando.` | A curva do esquecimento não espera, mas também não corre: essas {rev(n)} estão exatamente no ponto em que relembrar fixa de vez. |
| N4 | `{rev(n)} — e a conta do dia fecha — Fixa` | `{n} revisões e o dia está feito.` | A sessão de hoje é curta. Abrir, responder de cabeça, conferir — o espaçamento faz o resto sozinho. |

**Linha de streak** (anexada ao corpo, só quando `streak >= 3` — streak vivo se celebra;
zerado não existe): `Seu ritmo: <strong>{streak} dias seguidos</strong> — a sessão de hoje
mantém a conta.` (Nota: na cadência não-diária o streak já está zerado por definição — a
linha nunca aparece lá, de graça.)

### 1.c RETORNO — 3 variantes (dose como manchete, total honesto no corpo)

| # | Assunto | Título | Corpo |
|---|---|---|---|
| R1 | `Sua dose de hoje: {dose} revisões — Fixa` | `{dose} revisões — a dose de hoje.` | A fila cresceu enquanto você esteve fora — acontece, e ela não cobra juros. A Fixa separou as {dose} mais frágeis pra hoje; as outras {rest} vão em doses, no seu ritmo. |
| R2 | `Recomeço leve: {dose} revisões — Fixa` | `Só {dose} hoje. O resto espera.` | Voltar é o que importa. Começa pelas {dose} mais frágeis; as {rest} restantes têm vez — uma dose por dia até a fila voltar ao normal. |
| R3 | `{dose} agora, {rest} depois — Fixa` | `A fila não é parede: é fila.` | Hoje são {dose} revisões, escolhidas pela memória mais frágil primeiro. Ninguém encara {n} de uma vez — nem precisa. |

### 1.d PROVA — 2 variantes (urgência factual, sem pânico)

| # | Assunto | Título | Corpo |
|---|---|---|---|
| P1 | `Reta final: {rev(n)} antes da prova — Fixa` | `{n} revisões entre você e a prova.` | É a semana em que revisar mais rende — o que você refrescar agora chega vivo no dia. Hoje sem dose: a fila inteira, começando pelas mais frágeis. |
| P2 | `Prova em {d} dias — a fila de hoje: {n} — Fixa` | `{d} dias. {n} revisões. Dá.` | O espaçamento já fez a parte dele; a reta final é garantir que nada esfrie. Vale encarar a fila completa hoje. |

(Pra P2 o `globalReview` passa a devolver `daysLeft` — o `minDaysLeft` que ele já computa
internamente desde FILA-RETORNO §2.b entra no objeto de retorno.)

---

## 2. Cadência — o smart pause honesto (sem estado novo)

**Sinal:** atividade no app (`ud.activity`), não opens. **Zero campo novo**: a cadência é uma
função pura de `daysInactive = daysBetween(lastActiveDay(ud) ?? createdAt, hoje)` — qualquer
atividade reseta sozinha, porque o número é recomputado a cada cron.

```js
// reminders.js — cadência derivada, sem contadores persistidos
export function reminderCadence(daysInactive) {
  if (daysInactive <= 6) return "daily";
  if (daysInactive === 7) return "pause-notice";     // o e-mail honesto, exatamente 1 dia
  if ([14, 21, 28].includes(daysInactive)) return "weekly";
  if ([58, 88].includes(daysInactive)) return "monthly";
  return "silent"; // nos demais dias (e após ~90d, pra sempre até atividade nova)
}
```

- **Dias 1–6 sem atividade:** diário normal (só dispara com `due > 0`, como hoje).
- **Dia 7:** o **aviso de pausa** — a homenagem honesta ao Duolingo, sem coruja:
  - Assunto: `Vou dar um tempo nos lembretes — Fixa`
  - Título: `Uma semana de lembrete sem sessão — vou espaçar.`
  - Corpo: `Sete e-mails não trouxeram você de volta, então o problema não é lembrar — é
    momento, e tá tudo bem. Vou escrever só de vez em quando. Sua fila fica guardada
    ({n} revisões esperam, sem juros), e qualquer sessão sua reativa o lembrete diário na
    hora. Espaçar funciona pra memória; deve funcionar pra lembrete também.`
  - (opt-out padrão no rodapé, como em todos.)
- **Dias 14/21/28:** semanal — assunto `Sua fila continua guardada — Fixa`, título
  `{n} revisões, zero pressa.`, corpo curto: `Sem cobrança — só o registro de que sua trilha
  está inteira, do jeito que você deixou. Uma dose pequena já reativa o ritmo.`
- **Dias 58/88:** mensal — assunto `A Fixa continua aqui — Fixa`, título `Sua trilha está
  guardada.`, corpo: `Duas linhas só pra dizer que nada se perdeu: {n} revisões guardadas e o
  método esperando. Quando fizer sentido, a primeira dose é pequena.`
- **Depois de ~90 dias:** silêncio total (respeito > insistência). Atividade a qualquer
  momento → `daysInactive` zera → diário de volta, sem cerimônia.
- Best-effort consciente: se o cron falhar no dia 7 exato, o aviso de pausa não é reenviado
  (o semanal assume) — aceitável, registrado.
- `remindersOff` continua soberano e checado ANTES de tudo (contrato intocado).

---

## 3. Horário — fixo, decidido (a variedade fica nas mensagens)

**Mantém 11:23 UTC (8h23 BRT), um disparo por dia.** Racional:
1. A janela de hábito do Duolingo (push 30min antes do horário do usuário) exige timestamp
   de atividade por HORA — `ud.activity` só tem contagem por dia. Implementar variação sem o
   dado é variação aleatória, e aleatório em horário = imprevisível pro usuário (o oposto de
   hábito).
2. E-mail não é push: é lido em batch na caixa; o ganho de timing fino é minoritário perto
   do custo. Manhã BR é o slot certo pro "plano do dia".
3. GitHub Actions cron é best-effort (atrasa minutos até horas) — multiplicar schedules
   multiplicaria imprevisibilidade, não precisão.
4. **Uma variável por vez**: esta versão muda conteúdo (pool) e cadência (pause). Medir antes
   de mexer no relógio.
- **V3 registrado:** quando `markActive` guardar hora (mudança de 1 linha + migração), janela
  por usuário vira candidata — com o mesmo desenho do Duolingo (enviar pouco antes da hora
  habitual de estudo).

---

## 4. O que do Duolingo NÃO copiar (lei, não sugestão)

1. **Culpa e chantagem emocional** ("You made Duo sad", "Don't let Duo down") — a casa acolhe;
   o usuário não deve nada ao app.
2. **Mascote passivo-agressivo** — o Fixa não tem mascote e não vai ganhar um pra fazer
   olhinhos tristes.
3. **Streak-terror** (push 23h "você vai PERDER seu streak de 47 dias") — streak vivo se
   celebra de manhã; streak em risco/zerado não é mencionado, nunca (FILA-RETORNO §4).
4. **2 disparos/dia** — cap do Fixa é 1 e-mail/dia, e a cadência só DIMINUI a partir daí.
5. **FOMO social/ligas** — não existe ranking no produto; não inventar no e-mail.

---

## 5. Contratos e implementação

| Onde | Mudança |
|---|---|
| `reminders.js` (NOVO) | `pickVariant(pool, userId, ymd)` · `reminderCadence(daysInactive)` · `lastActiveDay(ud)` (maior chave de `ud.activity` com count>0, `null` se vazio) · pools/copies §1–§2 · `buildReminder({ cadence, mode, n, dose, rest, daysLeft, streak, userId, ymd })` → `{ subject, title, bodyP }` |
| `server.js` cron (~490) | substitui o bloco de subject/title/bodyP por: calcular `daysInactive` (fallback `u.createdAt`), `cadence`; `silent` → skip; `daily` usa o modo da fila (normal/retorno/prova); `pause-notice`/`weekly`/`monthly` usam as copies próprias §2. Shell/rodapé/opt-out intocados. |
| `server.js` `globalReview` | devolve também `daysLeft` (o `minDaysLeft` já computado) — consumido por P2 e pelo front se quiser |
| Estado persistido | **NENHUM campo novo** — cadência 100% derivada de `ud.activity`; `remindersOff` intocado |
| `test/reminders.test.mjs` | mínimo 8: rotação cicla o pool sem repetir dias consecutivos e é estável por (user, dia); cadence 0–6→daily, 7→pause-notice, 10→silent, 14/21/28→weekly, 58/88→monthly, 200→silent; streak line só com streak≥3; singular n=1 em todas as variantes |

## 6. Checklist de aceite

- [ ] Dois usuários diferentes no mesmo dia recebem variantes (provavelmente) diferentes; o
  MESMO usuário recebe variantes diferentes em dias consecutivos, e reexecutar o cron no
  mesmo dia gera o MESMO e-mail (determinismo).
- [ ] Usuário ativo ontem com streak 5: e-mail diário com a linha de ritmo; streak 0: nenhuma
  menção a streak em lugar nenhum (grep "streak|dias seguidos" no corpo gerado = 0).
- [ ] Usuário inativo há 7 dias: recebe o aviso de pausa (1 vez); dias 8–13: nada; dia 14:
  semanal; dia 30: nada; dia 58: mensal; dia 100: nada. Uma revisão feita no dia 40 →
  no dia 41 volta o diário.
- [ ] Modos da fila continuam respeitados no diário (retorno lidera com dose; prova com a
  fila e `daysLeft`); zero "atrasadas" como manchete; zero exclamação em todas as copies.
- [ ] `remindersOff` bloqueia TODAS as cadências, inclusive o aviso de pausa.
- [ ] `npm test` verde com os testes novos de `reminders.js`.
