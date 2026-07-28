# DESIGN-ENGAJAMENTO.md — o motivo de voltar amanhã

> Spec de design pronta pra implementação. **Escopo:** (1) o loop de volta — data da prova + progresso real na Home, meta do dia, sequência com folga e o fecho de sessão que comemora; (2) descobribilidade do botão de tema. **Fora de escopo:** notificação no celular (permissão, horário e copy são do dono, junto com a plumbing — este doc só assume que ela vai existir e não desenha nada dela), marca/wordmark, landing, SEO, cobrança.
>
> Referências: `DESIGN-HOME.md` (zonas, tokens, tipografia), `DESIGN-FILA-RETORNO.md` (lei da fila), `DESIGN-LEMBRETES-V2.md` (lei do tom de lembrete), `DESIGN-REVISAR.md` (player de sessão), `DESIGN-DESCOBRIBILIDADE.md` (regra transversal do `title`), `DESIGN-APP-MODE.md` (proibições do modo app). Convenção: Tailwind v4 + tokens existentes de `web/src/index.css`. **Nenhum token, cor, fonte ou dependência nova.** Alvo de layout: **360×800**.

---

## 1. Direção

A reclamação é "não to vendo motivo". O app tem o motivo mais forte que um app de estudo pode ter — **uma prova com data** — e hoje ele está escondido dentro do tema, a dois toques da Home. A resposta não é inventar urgência (é isso que o Duolingo faz porque idioma não tem prazo); é **mostrar a urgência que já existe** e fechar o dia com um sinal claro de que a parte de hoje acabou.

Três peças, nessa ordem de importância:

1. **A faixa da prova** na zona HOJE: quantos dias faltam e quanto você já domina *pra essa prova*. Aparece toda vez que o app abre, inclusive nos dias em que a pessoa não estuda.
2. **A meta do dia**, pequena e explícita, dentro dos cards que já existem — nunca um widget novo, nunca um número inventado.
3. **O fecho**, que hoje é mudo: a sessão acaba e o app diz "Sessão concluída". Passa a dizer o que aconteceu com o *dia*.

Mais duas correções de rota que sustentam o loop: a **sequência ganha uma folga** (quem estudou 7 dias cheios não perde a conta por causa de um dia vazio) e o **tema claro/escuro ganha palavra** numa seção de Ajuda, porque o único canal dele hoje é um ícone de 36px sem rótulo.

Volume baixo continua sendo a identidade: nada disso vira painel de métricas, nenhum elemento novo tem borda de card, nenhuma celebração usa confete.

---

## 2. Emendas às specs existentes (registrar, não esconder)

Mesmo padrão da `DESIGN-REVISAR §1.1`. Cada linha abaixo **substitui** o que está escrito no doc de origem.

| Origem | O que dizia | O que passa a valer | Por quê |
|---|---|---|---|
| `DESIGN-HOME §6.7` | "Sem gamificação extra na Home v1: nada de **metas diárias**, gráficos de linha, percentuais de crescimento, confete." | Meta diária **entra**, nos termos do §4 deste doc (derivada da data da prova, dois números dentro dos cards que já existem, nenhum widget novo). **Gráficos de linha, percentual de crescimento e confete seguem proibidos.** | A proibição foi escrita quando não havia data de prova na Home. Meta derivada de um prazo real não é gamificação — é a conta que a pessoa faria na mão. |
| `DESIGN-HOME §4.a` | A direita da linha de abertura da zona HOJE é a data (`sex, 11 jul`). | A direita mostra a data **ou** `dia fechado` (§4.3), nunca as duas. | A data é decorativa; o fecho do dia não é. |
| `DESIGN-HOME §4.b` | Sub-linha do card Continuar: `{done} de {total} tasks`. | Quando existe meta do dia, vira `meta de hoje · X/Y tasks` (§4.2). Sem meta, texto atual intocado. | O total migrou pra faixa, com propósito. |
| `DESIGN-HOME §4.c` | Tile de sequência mostra `s.streak`. | Mostra `—` quando `streak === 0` (§5.3) e ganha `title` novo. | Um `0` grande em cima de "dias seguidos" é placar de fracasso — proibido por `FILA-RETORNO §4`. |
| `DESIGN-DESCOBRIBILIDADE D17` | Toggle de tema Sun/Moon icon-only: COSMÉTICO, "registro consciente, sem ação". | **Reaberto.** Vira exceção (b) da regra transversal §D do próprio doc ("atalho de algo que tem casa com palavra"), com a casa criada em Ajuda › aparência (§7). | Convenção universal não cobre um alvo de 36px, sem rótulo, num cluster de três ícones iguais. O primeiro usuário a reclamar foi o dono. |

O que **não** muda e continua valendo inteiro: `FILA-RETORNO §6` (nada é apagado, pulado ou reagendado na fila — a folga do §5 é só do contador de sequência, nunca da fila), `LEMBRETES-V2 §4` (nenhuma tela ameaça a sequência, nem antes nem depois de ela quebrar) e `APP-MODE §3.4` (nenhum estado novo pode conter preço, "assinar" ou link de checkout).

---

## 3. A faixa da prova (zona HOJE)

**Decisão: uma faixa de três linhas entre o eyebrow `hoje` e os cards de ação. Sem card, sem borda, sem fundo — o objeto é a barra.**

Motivo: virar um terceiro card faria a zona HOJE ter três coisas clicáveis e nenhuma hierarquia; a faixa é *contexto* da zona, não ação. Sem moldura ela lê como legenda e some da consciência quando não interessa — mas o número de dias fica no topo da tela em toda abertura.

### 3.a Qual prova a faixa mostra

Sobre a lista de `tracks` que a Home já busca:

```ts
const comData = tracks.filter((t) => t.targetDate && t.daysLeft != null);
const futuras  = comData.filter((t) => t.daysLeft! >= 0).sort((a, b) => a.daysLeft! - b.daysLeft!);
const passadas = comData.filter((t) => t.daysLeft! < 0 && t.daysLeft! >= -14).sort((a, b) => b.daysLeft! - a.daysLeft!);
const exam   = futuras[0] ?? passadas[0] ?? null;   // a mais próxima; empate → a primeira da lista
const outras = Math.max(0, futuras.length - 1);
```

Uma faixa só, sempre. Outros temas com data continuam com o selo de prova no próprio card (`DESIGN-HOME §4.e`) — quando `outras > 0`, a linha 3 acrescenta `· +N com data`.

### 3.b Anatomia e medidas

```tsx
{/* faixa da prova — contexto da zona HOJE, não é card (DESIGN-ENGAJAMENTO §3) */}
<div className="mb-3">
  {/* L1 — 20px */}
  <div className="flex items-baseline justify-between gap-2">
    <p className={`text-[15px] font-semibold tracking-[-0.01em] ${tomL1}`}>{tituloL1}</p>
    <p className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
      <span className="text-domain">{exam.mastery}</span>/{exam.progress.total} dominadas
    </p>
  </div>
  {/* L2 — barra 6px, dois segmentos */}
  <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
       role="img" aria-label={`${exam.mastery} de ${exam.progress.total} tasks dominadas, ${exam.progress.done} concluídas`}>
    <div className="h-full bg-domain"    style={{ width: `${pctDominadas}%` }} />
    <div className="h-full bg-domain/30" style={{ width: `${Math.max(0, pctConcluidas - pctDominadas)}%` }} />
  </div>
  {/* L3 — 16px */}
  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
    <span className="min-w-0 truncate">{exam.title}{outras > 0 && ` · +${outras} com data`}</span>
    {dica && <span className="shrink-0 text-recall">{dica}</span>}
  </div>
</div>
```

- `pctDominadas = Math.round(mastery / total * 100)`, `pctConcluidas = Math.round(progress.done / total * 100)`. `total === 0` → a faixa não renderiza a barra (só L1 e L3).
- Altura total: **20 + 8 + 6 + 6 + 16 = 56px**, mais `mb-3`. Zona HOJE em 360×800 fica em `16 (eyebrow) + 12 + 56 + 12 + 76 + 12 + 76 = 260px` — cabe inteira abaixo do header de 56px sem rolar.
- Dois segmentos porque **dominada ≠ concluída** é a distinção central do produto (`Ajuda › o método`): o cheio é domínio real, o claro é o que só foi visto. Nunca inverter a ordem dos segmentos.
- A barra é a **do tema da prova**, não global. Os tiles da zona CONSISTÊNCIA continuam globais e não mudam (§2).

### 3.c Os cinco estados

| # | Condição | L1 (esquerda) | Tom de L1 | L3 (direita) |
|---|---|---|---|---|
| E1 | nenhum tema com data (nem passada ≤14d) | *(convite — §3.d)* | — | — |
| E2 | `daysLeft >= 8` | `prova em <mono>34</mono> dias` | `text-foreground` | *(vazio)* |
| E3 | `1 <= daysLeft <= 7` | `prova em <mono>3</mono> dias` · singular: `prova em <mono>1</mono> dia` | `text-recall` | `reta final` |
| E4 | `daysLeft === 0` | `a prova é hoje` | `text-recall` | `boa prova` |
| E5 | `-14 <= daysLeft <= -1` | `a prova passou` | `text-muted-foreground` | botão `marcar a próxima` |

- E5 depois de 14 dias vira E1.
- `marcar a próxima` em E5: `text-primary underline-offset-2 hover:underline`, alvo `min-h-[44px] px-1`, navega igual ao convite (§3.d).
- Nenhum estado usa `bg-destructive`, ponto de exclamação ou contagem regressiva grande. A cor âmbar em E3/E4 é a mesma semântica do resto do app (âmbar = tempo/revisão), não alarme.

### 3.d Estado E1 — convite pra marcar a data

Linha tracejada, 56px, no lugar exato da faixa:

```tsx
<div className="mb-3 flex min-h-[56px] items-center gap-3 rounded-lg border border-dashed border-border px-3">
  <button onClick={() => navigate(`/t/${encodeURIComponent(alvo.id)}?prova=1`)}
          className={`flex min-h-[44px] flex-1 items-center gap-3 rounded-md text-left ${FOCUS}`}>
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
      <CalendarClock className="h-[18px] w-[18px]" />
    </span>
    <span className="min-w-0">
      <span className="block text-[13px] font-medium">marque a data da prova</span>
      <span className="block text-[11px] text-muted-foreground">a meta do dia e a fila passam a ter conta</span>
    </span>
  </button>
  <button onClick={adiar} className={`inline-flex min-h-[44px] shrink-0 items-center rounded-md px-1 text-[11px] text-muted-foreground hover:text-foreground ${FOCUS}`}>
    agora não
  </button>
</div>
```

- `alvo` = o mesmo tema do card Continuar (`next`); se todos estiverem concluídos, `tracks[0]`.
- `?prova=1`: o `TargetControl` (`Track.tsx:273`) **já** renderiza o `<input type="date">` quando o tema não tem `targetDate` — não precisa de modo novo. O parâmetro só faz o input dar `scrollIntoView({ block: "center" })` + `focus()` uma vez no mount, e some da URL com `replace: true`. Sem o parâmetro, nada muda no Track.
- A copy do `TargetControl` (`prova em {n} dias`, `meta ~{n}/dia pra dominar a tempo`) já é a mesma família da faixa — não reescrever nenhuma das duas pra "combinar melhor": elas já combinam.
- `adiar` grava `localStorage["fx-prova-adiado"] = String(Date.now() + 30 * 864e5)`. O convite só renderiza se `Date.now() > Number(localStorage["fx-prova-adiado"] || 0)`. **Não é dispensa permanente** — quem estuda sem prova não é hostilizado, e quem marcar uma data depois vê a faixa normal na hora.
- O convite **nunca** aparece junto com a faixa: é o estado E1, não um extra.

---

## 4. A meta do dia

**Decisão: não existe widget de meta. A meta são dois números, cada um dentro do card de ação que já o executa — e o dia "fecha" quando os dois zeram.**

Motivo: um número agregado ("faça 14 ações hoje") tem um defeito fatal no modo retorno — a cada dose concluída o plano serve outra dose, e a meta agregada cresceria junto, virando esteira. Isso é exatamente o que a `FILA-RETORNO` foi escrita pra impedir. Dois números independentes, cada um com seu teto natural, não têm esse defeito.

### 4.1 Meta de revisões — o card Revisar

Nada muda: o card já diz `12 tasks na fila` (normal), `hoje: 12 · na fila: 40` (retorno) e `40 na fila · reta final da prova` (prova). Esse já é o número de ação — não duplicar em lugar nenhum.

### 4.2 Meta de tasks novas — o card Continuar

A meta vem pronta do servidor: `dailyGoal = ceil((total − done) / daysLeft)` (`server.js:354`), a mesma conta que o Track já mostra. O que falta é encaminhá-la e contar o que já foi feito hoje (§6).

Sub-linha do card Continuar, na ordem de precedência:

| Condição | Texto |
|---|---|
| `next` é o tema da prova, `goal > 0`, `doneToday < goal` | `meta de hoje · <mono>{doneToday}/{goal}</mono> tasks` |
| `next` é o tema da prova, `goal > 0`, `doneToday >= goal` | `meta de hoje feita` |
| resto (sem prova, prova hoje/passada, outro tema) | `{done} de {total} tasks` *(texto atual, intocado)* |

Regra que amarra o card à meta: **quando existe prova futura com tasks pendentes, o card Continuar aponta pra ela**, não pro primeiro tema da lista.

```ts
const next = (exam && exam.daysLeft! >= 0 && exam.progress.done < exam.progress.total)
  ? exam
  : tracks.find((t) => t.progress.done < t.progress.total);
```

Sem isso a meta seria de um tema e o botão levaria a outro — a incoerência que faz o número perder o sentido.

### 4.3 "dia fechado"

```ts
const hoje       = s.days[s.days.length - 1];              // dia SP, autoridade do servidor
const acoesHoje  = hoje?.count ?? 0;
const filaFeita  = s.dueMode === "retorno"
  ? localStorage.getItem("fx-dose-feita") === hoje.day     // ver §4.4
  : s.dueToday === 0;
const metaFeita  = !goal || doneToday >= goal;
const diaFechado = acoesHoje > 0 && filaFeita && metaFeita;
```

Onde aparece — **um lugar só na Home**, a direita da linha de abertura da zona HOJE, no lugar da data:

```tsx
<span title="fila de hoje zerada e meta de tasks batida"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-domain">
  <Check className="h-3 w-3" /> dia fechado
</span>
```

`acoesHoje > 0` é obrigatório: quem tem fila vazia e nenhuma prova não "fecha o dia" sem ter feito nada.

### 4.4 A chave `fx-dose-feita`

No modo retorno a fila do dia nunca chega a zero por definição (a dose é um recorte de 12 — `FILA-RETORNO §1`), então o dia precisa de outra prova de que a parte de hoje foi feita. O `Review.tsx` grava, ao montar o `SessionDone` com pelo menos um card avaliado:

```ts
localStorage.setItem("fx-dose-feita", diaSP());   // "YYYY-MM-DD"
```

`diaSP()` é um helper de 1 linha em `web/src/lib/dia.ts`, espelho do `spDay()` do servidor:

```ts
export const diaSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
```

É a única peça deste doc que vive por dispositivo. Assumido de propósito: o que ela liga é **um rótulo verde**, não dado. Em outro aparelho o rótulo não aparece e nada mais muda — nenhum número, nenhuma fila, nenhuma sequência. Estado persistido no servidor pra isso não se paga.

---

## 5. A sequência e a folga

### 5.1 A regra

**Um dia vazio não zera a sequência se os 7 dias imediatamente anteriores a ele tiveram atividade.** Automática, grátis, sem nada pra comprar, equipar ou lembrar de usar.

Motivo: perder 40 dias de sequência por um plantão, um voo ou uma gripe é o momento em que a pessoa desinstala — e a punição não tem nenhuma relação com aprender. Mas perdoar sem critério transforma "dias seguidos" em mentira. A regra dos 7 dias cheios cobra o crédito antes de conceder a folga: só quem tinha ritmo ganha.

`server.js`, substituindo o `computeStreak` atual (linha 276):

```js
function computeStreak(ud) {
  let s = 0, d = spDay();
  if (!ud.activity[d]) d = addDays(d, -1);      // hoje ainda não estudou? conta a partir de ontem (comportamento atual)
  for (;;) {
    if (ud.activity[d]) { s++; d = addDays(d, -1); continue; }
    // dia vazio: a folga só cobre quem vinha de 7 dias cheios
    let cheio = true;
    for (let i = 1; i <= 7; i++) if (!ud.activity[addDays(d, -i)]) { cheio = false; break; }
    if (!cheio) break;
    d = addDays(d, -1);                          // folga: o dia não conta, mas a sequência segue
  }
  return s;
}
```

Consequências, todas desejadas: **dois dias vazidos seguidos sempre quebram** (o segundo reprova o teste dos 7); quem alterna dia sim/dia não nunca acumula sequência; o número exibido continua contando **só dias com atividade** — 11 cheios + 1 vazio + hoje = `12`, e isso é verdade.

`title` do tile passa a ser: `dias seguidos com atividade — um dia vazio não zera se os 7 antes dele tiveram estudo`.

### 5.2 A nota da folga (uma vez, no dia em que ela salva)

Quando a folga cobriu **ontem**, a Home mostra uma linha logo abaixo dos tiles:

> `ontem ficou vazio e a conta segurou — 7 dias cheios antes valem uma folga.`

`mt-2 text-[11px] text-muted-foreground`. Detecção 100% no cliente, a partir de `s.days` (sem API nova):

```ts
const d = s.days, n = d.length - 1;
const folgaOntem = d[n]?.count > 0 && d[n - 1]?.count === 0
  && Array.from({ length: 7 }, (_, i) => d[n - 2 - i]).every((x) => x && x.count > 0);
```

Mostra uma vez por dia (`localStorage["fx-folga-avisada"] === hoje.day` → não mostra; ao mostrar, grava). É a única vez que o mecanismo aparece escrito, e ele aparece **como boa notícia, depois do fato**. Nunca antes, nunca como aviso, nunca com contador de folgas restantes: ameaça de perda é proibida por `LEMBRETES-V2 §4.3`.

### 5.3 Sequência zerada

`streak === 0` → o tile mostra `—` (mesmo `font-mono text-xl`, cor `text-muted-foreground`), rótulo `dias seguidos`, `title` `sua sequência começa na primeira sessão de hoje`. Um travessão diz "não há sequência"; um `0` diz "você falhou".

---

## 6. Contrato de API

**Duas propriedades novas em `TrackSummary`. Mais nada** — nenhum endpoint novo, nenhuma mudança em `Stats`, nenhum shape alterado.

| Campo | Tipo | De onde vem |
|---|---|---|
| `dailyGoal` | `number \| null` | já é calculado em `buildTrack` (`server.js:354`) e devolvido no `Track`; `trackSummary()` (linha 357) só não encaminha. Encaminhar. |
| `doneToday` | `number` | tasks **deste tema** concluídas hoje (dia de calendário SP) |

```js
// server.js — dentro de trackSummary(ud, id)
const st = tState(ud, id), hoje = spDay();
let doneToday = 0;
for (const k of Object.keys(st.done)) if (spDay(new Date(st.done[k])) === hoje) doneToday++;
```

`s.done[taskId]` já guarda o ISO da conclusão (`server.js:1187` e `:1124`), então a conta é derivada — zero estado novo, zero migração, zero backfill.

`web/src/lib/api.ts`:

```ts
export interface TrackSummary { …; dailyGoal: number | null; doneToday: number }
```

Tudo o mais que este doc usa já existe: `targetDate`, `daysLeft`, `progress`, `mastery` (em `TrackSummary`) e `streak`, `dueToday`, `doseToday`, `dueMode`, `days` (em `Stats`).

---

## 7. O fecho de sessão

Hoje o `SessionDone` (`web/src/screens/Review.tsx:94`) diz **"Sessão concluída"** em todos os casos. Ele passa a dizer o que aconteceu com o dia.

### 7.1 Os dados

No mount, o `SessionDone` dispara `getStats()` e `getTracks()` **em paralelo e sem bloquear**: o card renderiza na hora com o estado neutro (o texto de hoje) e troca o título/sub quando os dados chegarem. Se qualquer uma das duas falhar, ele fica no estado neutro — o fecho nunca mostra spinner, nunca pula de altura, nunca quebra. Regra de zero regressão: **o pior caso do fecho novo é o fecho atual.**

### 7.2 Os quatro estados

| # | Condição | Marca | Título | Sub-linha |
|---|---|---|---|---|
| F1 | `rest > 0` | ✓ esmeralda 40px *(atual)* | `Dose de hoje feita` | `<mono>{rest}</mono> seguem na fila — mais uma dose agora, se quiser; senão, amanhã tem mais.` |
| F2 | `rest === 0` · `goal > 0` · `doneToday < goal` | ✓ esmeralda 40px | `Fila de hoje limpa` | `meta de hoje: <mono>{doneToday}/{goal}</mono> tasks — dá pra fechar agora.` |
| F3 | `rest === 0` · meta feita ou inexistente | **marca Fixa 34px, animada (§7.3)** | `Dia fechado` | `streak >= 3` → `meta de hoje feita · <mono>{streak}</mono> dias seguidos` · senão → linha do método atual (`Erros voltam amanhã — é assim que fixa.` / `Tudo subiu de caixa — os intervalos aumentam.`) |
| F4 | F3 **e** `0 <= examDaysLeft <= 7` | marca Fixa animada | `Reta final: fila de hoje feita` | `faltam <mono>{d}</mono> dias — o que você refrescou hoje chega vivo na prova.` · `d === 1` → `falta <mono>1</mono> dia — …` · `d === 0` → `a prova é hoje — boa prova.` |
| F0 | dados ainda não chegaram, ou erro | ✓ esmeralda 40px | `Sessão concluída` | copy atual |

Os dois tiles (acertos / erros) e o `localStorage["fx-hint-ladder"]` ficam exatamente como estão, em todos os estados.

Botões:

| Estado | Botões |
|---|---|
| F1 | `Mais uma dose ({min(dose, rest)})` *(QUIET_BTN)* · `Voltar aos temas` |
| F2 | **`Estudar 1 task`** — o único sólido: `inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90` — navega pro tema da prova · `Voltar aos temas` *(QUIET_BTN)* |
| F3 · F4 · F0 | `Voltar aos temas` · `Ver fila` *(atual)* |

O sólido em F2 é a única exceção: é o momento em que o app tem uma próxima ação certa e barata pra oferecer. Em F3 não há próxima ação — oferecer uma seria transformar "acabou" em "faça mais", que é a esteira que este doc recusa.

### 7.3 A comemoração

**É a própria marca se desenhando: o traço fecha o arco e o ponto âmbar crava.** Sem confete, sem som, sem número subindo, sem badge.

Motivo: é a única celebração que o app já sabe fazer, que ninguém precisa desenhar, que não infantiliza e que significa exatamente o que aconteceu — o retorno cravou o ponto. `DESIGN-HOME §6.7` proíbe confete e continua valendo.

Reaproveita os keyframes que já existem (`logo-desenha`, `logo-plim` — `index.css:238`), sem `logo-respira` (o boot respira porque está esperando; o fecho não espera nada):

```css
/* fecho de dia (DESIGN-ENGAJAMENTO §7.3): a marca do boot, uma vez só e mais rápida */
.fecho-traco { stroke-dasharray: 1; animation: logo-desenha 700ms cubic-bezier(0.55, 0, 0.35, 1) forwards; }
.fecho-ponto { transform-box: fill-box; transform-origin: center; opacity: 0;
               animation: logo-plim 620ms cubic-bezier(0.2, 0.8, 0.3, 1) 560ms forwards; }
@media (prefers-reduced-motion: reduce) {
  .fecho-traco, .fecho-ponto { animation: none; opacity: 1; stroke-dasharray: none; }
}
```

```tsx
<svg width={34} height={34} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="mx-auto">
  <path className="fecho-traco" pathLength={1} d="M26.83 14.09A11 11 0 1 1 17.91 5.17"
        stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
  <circle className="fecho-ponto" cx="23.78" cy="8.22" r="3.2" fill="#F4B740" />
</svg>
```

Duração total 1180ms, uma vez, sem loop. Com `prefers-reduced-motion: reduce` a marca aparece pronta. A live region da sessão (`DESIGN-REVISAR §8`) anuncia o título do estado — a animação é decorativa e não carrega informação.

---

## 8. Descobribilidade do tema claro/escuro

O botão existe desde sempre no header (`App.tsx`, `h-9 w-9`, `title="tema"`), sem `aria-label` e sem palavra. Três correções, da mais barata pra mais estrutural.

### 8.1 `aria-label` no botão do header (1 linha)

```tsx
<button onClick={toggle}
        title={theme === "dark" ? "tema claro" : "tema escuro"}
        aria-label={theme === "dark" ? "mudar para o tema claro" : "mudar para o tema escuro"} …>
```

Hoje um leitor de tela lê "botão" e nada mais. O rótulo diz o **destino**, não o estado — quem lê "tema escuro" com o app escuro não sabe se é o que está ou o que vai ficar.

### 8.2 Ajuda › aparência (a casa com palavra)

Seção nova em `Ajuda.tsx`, **imediatamente antes** de `sua conta` (configuração agrupada no rodapé, conta por último porque termina em "sair"):

```tsx
<section className="mt-10">
  <h2 className={EYEBROW}>aparência</h2>
  <Card className="mt-3 gap-0 p-4">
    <p className="text-sm">tema</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">o sol/lua no topo faz a mesma troca</p>
    <div role="radiogroup" aria-label="tema do app" className="mt-3 flex overflow-hidden rounded-lg border border-border">
      {MODOS.map((m) => (
        <button key={m.v} role="radio" aria-checked={modo === m.v} onClick={() => setModo(m.v)}
          className={`h-11 flex-1 border-r border-border text-[13px] transition-colors last:border-r-0 ${
            modo === m.v ? "bg-secondary font-medium text-foreground"
                         : "text-muted-foreground hover:bg-accent hover:text-foreground"} ${FOCUS}`}>
          {m.label}
        </button>
      ))}
    </div>
    <p className="mt-2 text-[11px] text-muted-foreground/70">automático segue o modo do seu celular.</p>
  </Card>
</section>
```

`MODOS = [{ v: "auto", label: "automático" }, { v: "light", label: "claro" }, { v: "dark", label: "escuro" }]`. Altura 44px por opção (alvo de toque); em 360px as três cabem com folga (3 × ~101px).

### 8.3 O estado "automático" precisa existir de verdade

Hoje `theme.tsx` segue o aparelho **até o primeiro toque** e depois nunca mais — `localStorage["tv2-theme"]` fica gravado pra sempre e não há caminho de volta. Isso é um beco sem saída, não uma preferência. O `ThemeProvider` passa a expor:

```ts
type Modo = "auto" | "light" | "dark";
modo: Modo                       // = localStorage["tv2-theme"] ?? "auto"
setModo(m: Modo): void           // "auto" → localStorage.removeItem(KEY) + reaplica matchMedia
                                 // "light"|"dark" → grava e aplica
toggle(): void                   // inalterado (header): grava o oposto do tema atual, sai do auto
```

O listener de `prefers-color-scheme` que já existe (`theme.tsx:27`) continua exatamente como está — ele já só age quando não há escolha salva, que é a definição de `auto`.

### 8.4 FAQ

Item novo no grupo **conta e plano** de `Ajuda.tsx`:

> **Dá pra usar no tema claro?**
> Dá. Em **Ajuda › aparência** você escolhe entre automático, claro e escuro — automático segue o modo do celular. O sol/lua no canto superior direito faz a mesma troca em um toque.

Com isso o ícone do header passa a ser exceção **(b)** da regra transversal da `DESIGN-DESCOBRIBILIDADE §D` ("atalho de algo que tem casa com palavra"), igual ao logout. Sem a seção de Ajuda ele não se enquadrava em nenhuma exceção.

### 8.5 O que não fazer aqui

Nenhum coachmark, tooltip de primeira vez, badge "novo" ou tour apontando pro botão — `APP-MODE §5.2` proíbe e `DESCOBRIBILIDADE §C.3` documenta que o primeiro uso do app é auto-guiado sem tour. A correção é palavra, não seta.

---

## 9. Microcopy (pt-BR, texto final)

| Onde | Texto |
|---|---|
| Faixa E2 | `prova em {n} dias` · singular `prova em 1 dia` |
| Faixa E3 | `prova em {n} dias` + dica `reta final` |
| Faixa E4 | `a prova é hoje` + dica `boa prova` |
| Faixa E5 | `a prova passou` + ação `marcar a próxima` |
| Faixa, direita de L1 | `{mastery}/{total} dominadas` |
| Faixa, L3 com outros temas | `{título do tema} · +{n} com data` |
| Convite E1 | `marque a data da prova` / `a meta do dia e a fila passam a ter conta` / `agora não` |
| Card Continuar, com meta | `meta de hoje · {feitas}/{meta} tasks` |
| Card Continuar, meta batida | `meta de hoje feita` |
| Zona HOJE, direita | `dia fechado` (`title`: `fila de hoje zerada e meta de tasks batida`) |
| Tile de sequência, `title` | `dias seguidos com atividade — um dia vazio não zera se os 7 antes dele tiveram estudo` |
| Tile de sequência, zerada | valor `—`, `title` `sua sequência começa na primeira sessão de hoje` |
| Nota da folga | `ontem ficou vazio e a conta segurou — 7 dias cheios antes valem uma folga.` |
| Fecho F1 | `Dose de hoje feita` / `{n} seguem na fila — mais uma dose agora, se quiser; senão, amanhã tem mais.` |
| Fecho F2 | `Fila de hoje limpa` / `meta de hoje: {feitas}/{meta} tasks — dá pra fechar agora.` / botão `Estudar 1 task` |
| Fecho F3 | `Dia fechado` / `meta de hoje feita · {n} dias seguidos` |
| Fecho F4 | `Reta final: fila de hoje feita` / `faltam {n} dias — o que você refrescou hoje chega vivo na prova.` |
| Fecho F0 | `Sessão concluída` *(atual)* |
| Ajuda › aparência | `aparência` / `tema` / `o sol/lua no topo faz a mesma troca` / `automático` `claro` `escuro` / `automático segue o modo do seu celular.` |
| Header, `aria-label` | `mudar para o tema claro` · `mudar para o tema escuro` |

Tom: minúsculas em rótulos e metadados, sem exclamação, sem emoji, sem "você consegue". **Palavras banidas em qualquer estado novo:** `atrasado`, `atrasadas`, `você perdeu`, `não perca`, `você vai perder`, `parabéns`, `uau`, `sentimos sua falta`, `volte`, `ainda dá tempo`.

---

## 10. Estados vazios, de carregamento e de erro

| Situação | Comportamento |
|---|---|
| Zero temas | `EmptyState` atual substitui a página inteira — **sem faixa, sem convite, sem meta**. `DESIGN-HOME §4.g` intocado. |
| Carregando a Home | `HomeSkeleton` ganha um `Skeleton h-[56px] rounded-lg` antes dos dois de 76px, na posição da faixa — sem pulo de layout quando os dados chegam. |
| `getTracks` falha | Card de erro atual; a faixa não renderiza. |
| `getStats` falha | Faixa e cards de tema renderizam normalmente (a faixa só depende de `tracks`); o card Revisar e os tiles não aparecem, como hoje. |
| Tema da prova com `total === 0` | Faixa sem barra (só L1 e L3); `{0}/{0} dominadas` não é impresso — a direita de L1 fica vazia. |
| `dailyGoal` nulo ou `0` | Card Continuar volta pro texto atual; `metaFeita = true` (o dia pode fechar só com a fila). |
| Fila vazia + sem prova + zero ações hoje | Card `Fila limpa`, sem `dia fechado`, sem nota nenhuma. O app não comemora inatividade. |
| Volta depois de 20 dias sumido | `dueMode === "retorno"`: card `Retomar revisões · hoje: 12 · na fila: 40` (atual, `FILA-RETORNO`); faixa mostra os dias que sobraram e a meta diária sobe sozinha (é `remaining/daysLeft`) — **essa é a única mensagem sobre a ausência**; sequência em `—`, sem uma palavra sobre ela; fecho da dose em F1. |
| `prefers-reduced-motion: reduce` | Marca do fecho estática; nenhuma outra animação nova existe. |
| Modo app | Nada neste doc renderiza preço, "assinar", link externo ou menção a pagamento (`APP-MODE §3.4`). |

---

## 11. Descartado e por quê

### 11.1 Do Duolingo

| Mecânica | Por que não |
|---|---|
| Ligas, ranking, amigos, FOMO social | Não existe grafo social no produto, e quem estuda pra concurso/certificação não quer ser comparado a estranhos. Além disso a métrica que importa já tem um placar real: a prova. `LEMBRETES-V2 §4.5` já proíbe. |
| XP, pontos, gemas, moeda | Placar inventado competindo com o placar verdadeiro (`dominadas`). Dois placares fazem a pessoa otimizar o falso. |
| Corações / vidas / limite de erro | Errar é o mecanismo do método (`Ajuda › a ciência`: recall ativo, o erro percebido fixa). Punir erro seria vender o contrário do produto. |
| Streak freeze comprável, com loja e "equipar" | Economia de jogo dentro de uma ferramenta de prova. A folga do §5 é automática, grátis, e tem um critério que se explica numa frase. |
| Aviso de streak em risco ("faltam 3h") | `LEMBRETES-V2 §4.3` é lei: sequência viva se celebra, sequência em risco ou zerada não se menciona. **Nunca.** |
| Mascote / personagem passivo-agressivo | `LEMBRETES-V2 §4.2`. |
| Confete, som, animação grande | `DESIGN-HOME §6.7` mantido. A marca cravando o ponto (§7.3) faz o mesmo trabalho e é a identidade. |
| Badges e conquistas colecionáveis | Inflação de recompensa sem relação com retenção real. `dominada` já é a conquista — e ela é verdadeira. |
| Meta diária em minutos (5/10/15/20) | O app não mede tempo e não deveria começar a medir: tempo sentado não é aprendizado. Ele mede revisões e tasks, que é o que sabe medir com honestidade. |
| Meta diária escolhida pelo usuário | A meta aqui é **derivada da data da prova**. Deixar escolher a meta é deixar escolher o prazo — e o prazo já é escolhido, no lugar certo (a data). |
| Widget de sequência na tela inicial do Android | TWA não faz widget sem app nativo. |

### 11.2 Alternativas de design que foram consideradas e recusadas

| Alternativa | Por que não |
|---|---|
| Faixa como um terceiro **card** na zona HOJE | Três objetos com borda e nenhuma hierarquia; a zona vira painel. Faixa é contexto, não ação. |
| Faixa mostrando **progresso global** em vez do tema da prova | A pergunta que a faixa responde é "estou pronto **pra essa prova**". Progresso global já mora nos tiles. |
| **Um número agregado** de meta ("14 ações hoje") | No modo retorno a meta cresceria a cada dose — esteira, exatamente o que `FILA-RETORNO` impede. |
| **Tirar os tiles** `dominadas` e `concluídas` pra evitar redundância com a faixa | Layout condicional (4 tiles às vezes, 2 outras) é como spec apodrece. A redundância é aceita: a faixa é "pra esta prova", o tile é "no total" — com 2+ temas os números nem batem. |
| Contador regressivo grande no topo ("34" gigante) | Vira relógio de ansiedade; e a Home é ferramenta de uso diário, não pôster. |
| **Folga explícita** ("você tem 1 folga esta semana", com contador) | Exige estado persistido, vira economia, e transforma a folga em algo que a pessoa administra — administrar folga é lembrar do risco o tempo todo. A regra derivada dos 7 dias cheios não precisa de nada disso. |
| **Perdoar a fila** (limpar atrasadas de quem sumiu) | Proibido por `FILA-RETORNO §6`. A folga é do contador de sequência, nunca da fila. O `retorno` com dose de 12 já é a resposta certa pra quem voltou. |
| Meta do dia numa **barra de progresso própria** | Terceira barra na mesma tela (faixa + cards de tema). Dois números em texto bastam. |
| Persistir "dose feita" **no servidor** | Estado novo, migração e endpoint pra ligar um rótulo verde. `localStorage` é proporcional ao que está em jogo (§4.4). |
| **Coachmark** apontando pro botão de tema | `APP-MODE §5.2` e `DESCOBRIBILIDADE §C.3`: primeiro uso é auto-guiado, sem tour. Palavra, não seta. |

### 11.3 Fora deste doc

A **notificação no celular** (pedido de permissão, horário, frequência e copy) é do dono e sai junto com a plumbing. Este doc não desenha nada dela e não depende dela: tudo aqui funciona com a pessoa abrindo o app por conta própria. Quando ela existir, a lei que vale é a `DESIGN-LEMBRETES-V2 §4`, e o único ponto de contato com este doc é que **`dia fechado` é o sinal de que não há mais nada a lembrar hoje**.

---

## 12. Checklist de aceite

- [ ] Em **360×800**, com prova marcada, a faixa e os dois cards de ação aparecem **sem rolar** (zona HOJE ≤ 260px abaixo do header).
- [ ] A faixa não tem borda, fundo nem sombra — só a barra de 6px separa visualmente.
- [ ] A barra tem dois segmentos, o segundo mais claro que o primeiro; com `mastery = 0` e `done = 0` ela fica 100% `bg-muted`.
- [ ] Os cinco estados da faixa aparecem nas cinco condições (`daysLeft` = 34 · 3 · 0 · −2 · sem data), com o tom de cor da tabela §3.c.
- [ ] Sem nenhum tema com data: aparece a linha tracejada; tocar leva ao tema com o campo de data **visível na tela e em foco** (sem rolar na mão); `agora não` some com ela por 30 dias e a faixa volta sozinha se uma data for marcada.
- [ ] Com meta, o card Continuar mostra `meta de hoje · X/Y tasks`, vira `meta de hoje feita` quando `X ≥ Y`, e **aponta pro tema da prova**.
- [ ] Fila zerada + meta batida + pelo menos 1 ação hoje: a direita do eyebrow `hoje` mostra `dia fechado` em esmeralda, **no lugar da data**.
- [ ] Em modo retorno, o dia só fecha depois de uma dose concluída neste dispositivo; em outro dispositivo nenhum número muda por causa disso.
- [ ] Sequência: 11 dias cheios + 1 vazio + hoje cheio → tile mostra `12`. 11 cheios + **2** vazios + hoje → tile mostra `1`. 3 cheios + 1 vazio + hoje → tile mostra `1`.
- [ ] `streak === 0` → tile mostra `—`, nunca `0`.
- [ ] A nota da folga aparece **uma vez no dia** em que ela cobriu ontem, e não aparece em nenhum outro dia.
- [ ] `grep -rniE "atrasad|você perdeu|não perca|vai perder|sentimos sua falta"` nos arquivos tocados = **0 ocorrências**.
- [ ] Fecho de sessão: os cinco estados (F0–F4) aparecem nas cinco condições; com `getStats` **e** `getTracks` falhando, o card mostra o texto de hoje e nada quebra.
- [ ] A marca do fecho anima **uma vez** (sem loop) e fica estática com `prefers-reduced-motion: reduce`.
- [ ] Ajuda › aparência: três opções de 44px, `role="radiogroup"` + `aria-checked` corretos; escolher `automático` faz o app voltar a seguir o aparelho (**trocar o modo do sistema muda o app com ele**).
- [ ] O botão do header tem `aria-label` que diz o destino, e ele muda quando o tema muda.
- [ ] Nenhuma cor nova: `grep -nE "#[0-9a-f]{3,6}|amber-|orange-|emerald-|red-"` nos arquivos tocados = 0, exceto o `#F4B740` já existente do ponto da marca.
- [ ] Nenhum estado novo mostra preço, "assinar", link externo ou menção a pagamento.
- [ ] Foco visível (`FOCUS`) em: convite da faixa, `agora não`, `marcar a próxima`, os três botões de aparência e `Estudar 1 task`.
- [ ] Textos de 11px em âmbar e esmeralda passam AA no tema claro (tokens `--recall` / `--domain`, não `amber-500`).

---

## 13. Ordem de implementação

| # | Entrega | Custo | Por que nessa ordem |
|---|---|---|---|
| 1 | `aria-label` do header + Ajuda › aparência + `modo` no `ThemeProvider` + FAQ | ~40 min | Resolve uma reclamação inteira, não toca em dado nenhum e conserta um beco sem saída (não dá pra voltar pro automático). |
| 2 | `dailyGoal` + `doneToday` no `TrackSummary` e a **faixa da prova** | ~2 h | É a mudança que funciona **até nos dias em que a pessoa não estuda** — o motivo aparece na abertura do app. |
| 3 | Meta no card Continuar + `next` apontando pro tema da prova + `dia fechado` no eyebrow | ~1 h | Depende de 2; fecha o par "o que falta hoje / acabou". |
| 4 | Fecho de sessão (F1–F4 + marca animada + `fx-dose-feita`) | ~2 h | O momento de recompensa; depende de 3 pra saber o que é "dia fechado". |
| 5 | `computeStreak` com folga + tile `—` + nota da folga | ~1 h | Sozinha não traz ninguém de volta, mas impede a saída de quem já estava dentro. |
