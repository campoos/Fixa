# DESIGN-LICAO-UI.md — Spec visual da tela de Lição

> Spec de design pronta pra implementação. Escopo: **apresentação** da rota `/t/:trackId/l/:taskId`
> (a Lição), do peek/TaskRow na árvore (`Track.tsx`) e da sheet de correção do Tutor.
> **Comportamento é lei e mora em `DESIGN-LICAO-UX.md`** — fluxo, estados, validação, microcopy
> funcional: nada disso muda aqui; este doc só veste.
> Continuidade: tokens da `DESIGN-HOME.md` §2 (nenhum token novo), shell mobile da
> `DESIGN-SHELL-MOBILE.md`, e o player `Review.tsx` como **irmã direta** — a Lição é o segundo
> player do app (Revisar = player de sessão · Lição = player de estudo). Mock aprovado
> (`web/public/mock-tutor.html`, visão 1 + tela de correção) é a referência de linguagem;
> este doc o traduz pro vocabulário implementado.

---

## 1. Direção

A Lição é a **outra metade do par de players** do Fixa. O Revisar é âmbar (família revisão);
a Lição é **violeta** (família estudo/atividade — a mesma tinta do card "Continuar" da Home e
dos pontos-chave já implementados no Track). Mesma silhueta do irmão: coluna `max-w-xl`,
X no topo esquerdo, tab bar mobile oculta, dock ancorado no fundo — quem sai de uma sessão de
revisão e entra numa lição reconhece o lugar sem aprender nada novo.

A tela é um **diário de estudo, não um chat**: o transcript é uma coluna única de blocos
full-width (sem balões alternados, sem avatar do usuário), onde a regra de leitura de relance é
uma só — **bloco neutro (fundo card) = coisa sua · bloco tintado = coisa do conteúdo**
(violeta = pontos-chave, esmeralda = resposta-modelo — exatamente os dois tints que o
`TaskDetail` atual já usa; o transcript herda esse vocabulário, não inventa outro).
O presente (passo ativo) mora num dock de vidro no fundo; o passado empilha acima e nunca some.
Conclusão sóbria como a do Revisar: chip esmeralda + informação, zero confete.

### 1.1 Emendas/clarificações às specs anteriores (registrar, não esconder)

| Regra anterior | Emenda |
|---|---|
| DESIGN-REVISAR §1.1: "sólidos do app = `primary` (CTA) e `domain` (só o Acertei do player)" | Passa a: **`domain` sólido também no "Enviar e concluir" da Lição** — é o mesmo momento semântico do Acertei (fechamento do método) e usa o mesmo par AA `--domain/--domain-foreground`. Os envios intermediários são `bg-primary` (atividade em andamento). Âmbar segue **nunca sólido**. |
| DESIGN-SHELL-MOBILE §3.1: bar some só em `route.name === "revisar"` | Passa a: `route.name === "revisar" \|\| route.name === "licao"` — a Lição é player, mesmo racional (dock dono do fundo, sessão imersiva). Idem a regra de `pb` do `main` (§3.4): `licao` usa `pb-6` como `revisar`. |
| DESIGN-HOME §2.2: mono é a "face de dados" | Sem mudança — reforço: na Lição os timestamps do transcript, o indicador `2/3`, o crumb e a nota do Tutor são mono `tabular-nums`. |

---

## 2. Layout geral

- **Shell**: header do app (h-14, vidro) permanece; tab bar mobile não renderiza (emenda §1.1).
  A viewport meta ganha `interactive-widget=resizes-content` (ver §5.d — é o que garante o dock
  acima do teclado; afeta o app inteiro e é inócuo nas outras telas).
- **Container**: `mx-auto w-full max-w-xl` (576px) dentro do `main` existente — **idêntico ao
  player do Revisar**. Sem `justify-center` vertical (a Lição cresce; o Revisar centra porque é
  um card só).
- **Scroll**: da página, natural (sem região interna de scroll — o transcript é o documento).
- **Zonas verticais** (de cima pra baixo):

```
1. HEADER DA LIÇÃO   → sticky sob o header do app: X + crumb · título + indicador de passos
2. TRANSCRIPT        → questão âncora · (material da prática) · blocos da jornada   (mt-4, space-y-3)
3. DOCK DO PASSO     → rótulo + textarea + enviar + válvula — sticky bottom          (mt-3)
   (na conclusão/leitura o dock não existe; o bloco terminal entra no fluxo do transcript)
```

- **Estados de página** (moldes do app):
  - Loading: skeletons na ordem/altura do layout final — `h-4 w-40` (crumb), `mt-2 h-5 w-64`
    (título), `mt-4 h-[120px] rounded-xl` (questão), `mt-3 h-[180px] rounded-lg` (dock).
  - Erro / task inexistente: `Card p-4 text-sm text-destructive` — `erro: {mensagem}` + botão
    quieto `Voltar ao tema` (`h-9 rounded-lg border border-border bg-card px-3.5 text-sm
    font-medium hover:bg-accent ${FOCUS}` — o `QUIET_BTN` do Review, extrair pra compartilhado).

---

## 3. Header da Lição

Sticky sob o header do app: `sticky top-14 z-20 -mx-4 bg-background/85 px-4 pb-3 pt-1
backdrop-blur-md` (mesma linguagem de vidro; `z-20` — abaixo do shell `z-30`, acima do dock `z-10`).

**Linha 1** — `flex items-center gap-2`:
- **X de sair**: `grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground
  transition-colors hover:bg-accent hover:text-foreground ${FOCUS}` + `X h-4 w-4` —
  **cópia exata do X do Revisar** (aria-label/title `sair da lição`). Sai sem diálogo (UX §2.7).
- **Crumb**: `min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground/70` →
  `{tema} · {epic ou story} · ` + `<span class="text-muted-foreground">task {id}</span>`
  (o id um degrau mais forte — é a âncora, como no mock).

**Linha 2** (`mt-1.5 flex items-center gap-3 pl-10` — alinhada com o crumb, não com o X):
- **Título da task**: `min-w-0 flex-1 truncate text-[15px] font-semibold` (escala de título de
  tema da Home; a protagonista da Lição é a questão em 17px, não o título).
- **Indicador de passos** (`shrink-0`) — mesma gramática da escada Leitner, tinta violeta:

```tsx
<span role="img" aria-label={`passo ${n} de ${m}`} title={...} className="flex shrink-0 items-center gap-1.5">
  <span className="flex items-center gap-[3px]">
    {/* m segmentos h-[5px] w-3.5 rounded-full */}
    {/* i < atual  → bg-primary/40 (vencidos) · i === atual → bg-primary · i > atual → bg-secondary */}
  </span>
  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{n}/{m}</span>
</span>
```

  - Segmentos `w-3.5` (mais largos que os do Leitner — são 2–3, não 8). `m` = 3 ou 2 (fluxo
    curto): o indicador simplesmente renderiza menos segmentos, nunca um "faltando" (UX §4).
  - **Task concluída**: o indicador inteiro vira `inline-flex items-center gap-1 text-[11px]
    font-medium text-domain` + `Check h-3.5 w-3.5` + `concluída · {data curta}` (mono no
    número da data). Nenhuma barra de progresso — 2–3 passos não precisam de scrubber.

---

## 4. Transcript

Container: `mt-4 space-y-3`. Ordem = UX §3.1. Regra de relance (imprimir na revisão de PR):
**neutro = usuário · violeta = pontos-chave · esmeralda = resposta-modelo · tracejado = convite/ação**.

### 4.a Questão-modelo (âncora, sempre o 1º bloco)

`Card` → `rounded-xl border-border bg-card p-4 shadow-sm`:
- Eyebrow `font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground` → `questão-modelo`.
- Pergunta `mt-1.5 text-[17px] font-semibold leading-snug text-balance` — **mesmo 17px do card
  do Revisar**: a pergunta é o produto nas duas telas, mesma voz.

### 4.b Material da prática (só `type === "practice"`, visível desde a entrada)

Um bloco único de **referência** logo abaixo da questão — superfície `muted`, deliberadamente
diferente do transcript (não é jornada, é bancada de trabalho):
`rounded-lg border border-border bg-muted/40 p-3.5 space-y-3`. Dentro, as seções atuais do
`TaskDetail` de prática, intocadas no vocabulário: eyebrow padrão + **Objetivo** (`text-sm
leading-relaxed`), **Passos** (`ol` com número `font-mono text-xs text-muted-foreground`),
**Dica** (`text-sm text-muted-foreground`), **Exemplo** (`pre` `overflow-x-auto rounded-md
border border-border bg-background p-2.5 font-mono text-xs`). O fundo `muted/40` é o que o
distingue de relance dos blocos brancos do usuário.

### 4.c Resposta enviada (somente leitura — a voz do usuário)

`rounded-lg border border-border bg-card p-3.5`:
- Linha de cabeçalho `flex items-baseline gap-2`: eyebrow (10px mono uppercase muted) →
  `sua resposta · frio` / `sua resposta · com os pontos-chave` / `sua resposta final`
  (prática: `seu relato`); à direita `ml-auto shrink-0 font-mono text-[10px] tabular-nums
  text-muted-foreground/70` → `há 3 dias` ou `12 jul`.
- Texto `mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground`.
- **Registrada em branco**: no lugar do texto, `mt-1.5 text-sm italic text-muted-foreground/70`
  → `(em branco — deu branco aqui)`. Sem borda de erro, sem âmbar: é registro legítimo.
- Sem hover, sem cursor-pointer, sem botão de editar — enviado é enviado (UX §0.2); a ausência
  total de affordance é o design.

### 4.d Pontos-chave revelados

Cópia do bloco já implementado no Track (estágio 1): `rounded-lg border border-primary/25
bg-primary/5 p-3.5 space-y-2` · eyebrow `font-mono text-[10px] uppercase tracking-[0.14em]
text-primary` → `pontos-chave` · itens `flex gap-2 text-sm text-muted-foreground` com bullet
`mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary`.

### 4.e Resposta-modelo

Cópia do slot revelado do Revisar: `rounded-lg border border-domain/25 bg-domain/5 p-3.5` ·
eyebrow `text-domain` → `resposta` · texto `text-sm leading-relaxed whitespace-pre-wrap
text-foreground`. Prática: sub-bloco **esperado** acima do texto — `rounded-md border
border-domain/25 bg-domain/5 p-2 text-sm` com prefixo `font-medium text-domain` `esperado: `
(vocabulário atual do Track, mantido).
- **Sem resposta-modelo** (UX §6.1): o slot vira `rounded-lg border border-dashed border-border
  bg-muted/40 p-3.5 text-center` → `text-xs text-muted-foreground` `esta task está sem
  resposta-modelo` + botão-texto `mt-1 text-xs text-primary underline-offset-2 hover:underline`
  `editar conteúdo da task`.

### 4.f Marcador "você parou aqui" (só na retomada)

Divisor entre passado e presente, âmbar (tempo/retomada é família revisão — mesma decisão do
mock): `my-1 flex items-center gap-3` com duas linhas `h-px flex-1 bg-recall/40` e label central
`shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-recall` →
`você parou aqui · há 3 dias`. `role="separator"`. É o **único âmbar da Lição** — por isso o
olho cai nele primeiro ao reabrir.

### 4.g Card da correção do Tutor (fim do transcript, quando houver)

Botão full-width, família do `.invite` do mock em tint violeta:
`flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5
p-3 text-left transition-colors hover:bg-primary/10 ${FOCUS}`:
- Nota: `font-mono text-xl font-semibold tabular-nums text-primary` `{nota}` +
  `font-mono text-[11px] text-muted-foreground` `/10`.
- Meio (`min-w-0 flex-1`): `text-sm font-semibold` `correção do Tutor` + veredito
  `truncate text-xs text-muted-foreground`.
- `ArrowRight h-4 w-4 shrink-0 text-primary`. Toque abre a sheet (§6.c).

### 4.h Motion e scroll do transcript

- Bloco **novo** (revelado agora): `motion-safe:animate-in motion-safe:fade-in duration-200` —
  fade in-place, **sem slide/height animation** (regra anti-shift do Revisar). Como o bloco
  entra no fim, `scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion)").matches ?
  "auto" : "smooth", block: "nearest" })` no bloco + dock.
- **Retomada/leitura**: o transcript histórico renderiza **instantâneo, sem replay animado** —
  animação de entrada é só pra conteúdo que acabou de nascer. O scroll inicial posiciona o
  marcador §4.f no terço superior da viewport (transcript alcançável acima, dock visível abaixo).

---

## 5. Dock do passo ativo

Vidro sticky, irmão do dock do Revisar: `sticky bottom-0 z-10 -mx-4 mt-3 bg-background/85 px-4
pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md`. Só existe enquanto há
passo ativo (stage < M); na conclusão/leitura, desmonta.

### 5.a Anatomia

1. **Rótulo do método** (UX §7): `mb-2 text-[13px] leading-snug text-muted-foreground` —
   sentença, não eyebrow (os rótulos são frases; uppercase mono os mataria).
2. **Textarea**: `w-full resize-none rounded-lg border border-border bg-card px-3.5 py-3
   text-[16px] leading-relaxed outline-none transition-colors focus:border-primary
   focus:ring-2 focus:ring-ring/30 sm:text-sm` · `min-h-[88px]` com auto-grow por conteúdo até
   `max-h-[38svh]` (depois `overflow-y-auto`) — o teto garante que, com teclado aberto, ainda
   sobra transcript visível acima. **`text-[16px]` no mobile é obrigatório** (abaixo disso o
   iOS dá zoom na tela ao focar). Placeholder `text-muted-foreground/60`; passo 1:
   `escreve do jeito que sair…`; passo final: `o que você leva desta task?`.
3. **Botão de envio** (`mt-2.5`), full-width `flex h-12 w-full items-center justify-center
   gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${FOCUS}`:
   - Passos intermediários: `bg-primary text-primary-foreground hover:bg-primary/90
     active:bg-primary/85` + `Eye h-4 w-4` → `Enviar e ver pontos-chave` / `Enviar e revelar
     resposta`.
   - Passo final: `bg-domain text-domain-foreground hover:bg-domain/90 active:bg-domain/85` +
     `Check h-4 w-4` → `Enviar e concluir` (o ✓ do copy da UX vira o ícone `Check` — o app usa
     o glifo, não o caractere no label). Emenda §1.1 sanciona o sólido.
   - kbd chip `enter` dentro do botão, padrão do Revisar: `hidden h-[18px] items-center rounded
     border border-transparent px-1 font-mono text-[10px] sm:inline-flex` — no violeta:
     `bg-primary-foreground/20 text-primary-foreground`; no esmeralda:
     `bg-domain-foreground/20 text-domain-foreground`. `aria-hidden`.
4. **Linha inferior** (`mt-2 flex items-center justify-center gap-3 min-h-[18px]`):
   - **Válvula** (passos intermediários; nunca no final — UX §2.2/2.4): botão-texto
     `text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline
     ${FOCUS}` → `deu branco — mostrar pontos-chave` / `não mudou nada — revelar resposta` /
     `não consegui fazer — mostrar o esperado`.
   - **Ação secundária do passo final** (UX §2.4): mesmo estilo → `aproveitar minha resposta
     anterior` (some após usar).
   - **Hint de teclado** (desktop only): `hidden sm:inline font-mono text-[11px]
     text-muted-foreground/70` → `enter envia · shift+enter quebra linha`. No mobile a linha
     mostra só a válvula; sem válvula (passo final, resposta anterior já usada) a linha colapsa
     mantendo `min-h` zero shift? não — `min-h-[18px]` fixa a altura do dock (anti-shift).

### 5.b Estados

| Estado | Visual |
|---|---|
| Vazio/só espaços | Botão `disabled` (opacity-50); textarea normal; válvula ativa (é a saída honesta). |
| Busy (enviando) | Botão `disabled`, ícone → `Loader2 h-4 w-4 animate-spin`, label mantido; textarea `readOnly` + `opacity-70`; válvula `disabled` + `opacity-50`. |
| Erro de envio | Linha `mt-2 text-xs text-destructive` acima do botão → `não consegui salvar — tenta de novo`; botão reabilita; **texto permanece no campo** (UX §2.4). |
| Conflito de aba (UX §6.4) | Banner acima do rótulo: `mb-2 rounded-lg border border-recall/40 bg-recall/10 p-2.5 text-xs text-recall` → `esta lição avançou em outra aba — atualizei aqui`. Some no próximo envio. |
| Foco | Textarea recebe foco na entrada/avanço de passo (UX §2.1); anel `FOCUS` padrão em botão/válvula. |

### 5.c Overflow do header (editar conteúdo durante a lição — UX §6.1)

No header §3, à direita do indicador: icon-button `grid h-8 w-8 place-items-center rounded-lg
text-muted-foreground hover:bg-accent hover:text-foreground ${FOCUS}` + `Pencil h-3.5 w-3.5`
(title `editar conteúdo da task`) → abre o `TaskEditor` atual em bloco no topo do transcript
(mesmo componente, intocado). Sem menu de overflow novo — só há uma ação secundária; um lápis
quieto resolve (o app não tem dropdown e não vai ganhar um por isso).

### 5.d Teclado mobile — o requisito nº 1

1. `<meta name="viewport" … interactive-widget=resizes-content>`: o teclado **encolhe o layout
   viewport** → o dock `sticky bottom-0` pousa em cima do teclado, não embaixo dele.
2. No `focus` do textarea: `requestAnimationFrame(() => textarea.scrollIntoView({ block:
   "nearest" }))` — cobre o iOS Safari antigo onde o resize é do visual viewport.
3. `max-h-[38svh]` no textarea (item 5.a.2) impede o campo de comer a tela.
4. Header sticky (h≈72px) + dock: em 390×844 com teclado aberto sobram ≥ ~180px de transcript —
   suficiente pra reler o bloco anterior enquanto digita (o requisito da retomada).

---

## 6. Conclusão e correção

### 6.a O momento Done (estado terminal, no fluxo do transcript)

O dock desmonta; entra no fim do transcript (com o fade §4.h + scroll até ele):

`Card` → `mt-3 rounded-xl p-6 text-center`:
1. Chip `mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain` +
   `Check h-5 w-5` — **eco exato** do "Sessão concluída"/"Fila limpa". O chip É o ✓ do copy.
2. Título `mt-4 font-semibold` → `Task concluída` (`tabIndex={-1}`, recebe foco — padrão do
   fim de sessão do Revisar).
3. Método `mt-1 text-sm text-muted-foreground` → `ela volta pra revisão amanhã — é o
   espaçamento trabalhando.`
4. **Convite do Tutor** (`mt-4`, o `.invite` do mock traduzido): botão full-width
   `flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/40
   bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10 ${FOCUS}`:
   - Avatar: `grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary
     text-primary-foreground` + `GraduationCap h-4 w-4` (sem emoji — o 🎓 do mock vira o ícone
     que já significa "domínio/professor" no app).
   - Texto: `text-sm font-semibold` `Ver correção do Tutor` + `text-xs text-muted-foreground`
     `nota + o que acertou e o que faltou`.
   - `ArrowRight h-4 w-4 shrink-0 text-primary`.
   - Contador de plano abaixo do convite: `mt-2 font-mono text-[11px] tabular-nums
     text-muted-foreground/70 text-center` → `correções: 2/5 da degustação`.
   - **Limite esgotado**: o convite vira bloco informativo não-interativo `rounded-lg border
     border-border bg-muted/40 p-3 text-xs text-muted-foreground text-center` →
     `correções da degustação esgotadas · ` + link `text-primary underline-offset-2
     hover:underline` `conhecer o Pro` (→ `/pro`).
5. **Saídas** `mt-5 flex flex-wrap items-center justify-center gap-2.5`, ambas quietas
   (`QUIET_BTN` + `FOCUS`): `Voltar ao tema` primeiro; depois, quando existir,
   `Próxima: {id} {título}` (`max-w-[240px] truncate` no título) + `ArrowRight h-3.5 w-3.5`.
   Nenhuma das duas é sólida — o loop de estudo é convite, não funil.

### 6.b Task Done reaberta (modo leitura) e refazer

- Header: indicador no estado "concluída ✓" (§3). Sem dock. Transcript completo + card do
  Tutor (§4.g) se houver.
- Rodapé de ações no fluxo (`mt-3 flex flex-wrap items-center gap-2.5`):
  - `Ver correção do Tutor` — o convite §6.a.4 completo (se ainda não corrigiu e há saldo).
  - **`Refazer lição`** — quieto com `RefreshCw h-4 w-4` (**não** `RotateCcw`, que é o glifo do
    Errei/revisão — refazer é re-estudo, não reagendamento). Confirmação via `confirm()` nativo
    (padrão do app) com o texto da UX §7.
  - `Estudar mesmo assim` (Done só por checkbox — UX §5): o modo leitura mostra, no lugar do
    transcript, bloco vazio `rounded-xl border border-dashed border-border px-6 py-10
    text-center` com `text-sm text-muted-foreground` `concluída sem registro de estudo` e o
    botão quieto abaixo (`mt-4`).
- **Bloqueio sem questão-modelo** (UX §6.1): mesma moldura tracejada — `esta task ainda não tem
  questão-modelo` + ações `editar conteúdo` (quieto) e `Voltar ao tema` (quieto).

### 6.c Sheet de correção do Tutor (tradução do mock aprovado)

Overlay de tela cheia **em cima da Lição**: `fixed inset-0 z-50 overflow-y-auto bg-background`
(acima do shell z-30), conteúdo `mx-auto w-full max-w-xl px-4 pb-10 pt-4`. Entrada
`motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-300`.

- **Topo**: X (mesmo espécime §3) + eyebrow `font-mono text-[11px] uppercase tracking-[0.14em]
  text-muted-foreground` → `correção do tutor · task {id}`.
- **Estado "lendo"**: centrado `py-16 text-center` — avatar `mx-auto grid h-14 w-14
  place-items-center rounded-2xl bg-primary text-primary-foreground motion-safe:animate-pulse`
  + `GraduationCap h-7 w-7` (o wiggle do mock vira pulse — sóbrio), `mt-4 text-sm
  text-muted-foreground` `lendo sua jornada nesta task…`, `mt-1.5 font-mono text-[11px]
  text-muted-foreground/70` `resposta fria + reescrita + resposta final`.
- **Nota-hero**: `text-center` — `font-mono text-[56px] font-semibold leading-none
  tracking-[-0.04em] text-primary tabular-nums` `{nota}` + `font-mono text-sm
  text-muted-foreground` `/10`. Veredito `mx-auto mt-2 max-w-[40ch] text-center text-[15px]
  font-semibold text-balance`.
- **Sua resposta final**: bloco do usuário §4.c reaproveitado, com eyebrow `sua resposta final`.
- **fb-items** (`mt-4 grid gap-2`): `flex gap-2.5 rounded-lg border border-border bg-card p-3
  text-[13px] leading-relaxed text-muted-foreground`; ícone `h-4 w-4 shrink-0 mt-0.5` —
  acerto `Check text-domain` · gap `TriangleAlert text-recall` · dica `Lightbulb text-primary`
  (os ✓/⚠/💡 do mock viram lucide). Trechos fortes `font-medium text-foreground`.
- **Ações** (`mt-4 grid gap-2.5`): `salvar dica nas anotações` quieto + `voltar ao estudo`
  sólido `bg-primary` h-12 (o retorno é o CTA — devolve pro loop).
- **Disclaimer**: `mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70` →
  `correção por IA — pode errar; desconfie, confira, aprenda. O Tutor corrige com base no
  material da task.`
- **Erro/sem rede**: no lugar do resultado — `text-sm text-destructive text-center` +
  `tentar de novo` quieto (a Lição já está concluída; a sheet nunca ameaça nada).

---

## 7. Árvore: TaskRow + peek de leitura

### 7.a TaskRow (`Track.tsx`)

- Estrutura atual mantida (checkbox `DoneBox`, id mono, ícone de prática, título, badges).
  **A área do título passa a navegar pra Lição** (gesto primário — UX §1.3); o chevron vira um
  botão separado à direita que abre/fecha o peek (affordance de "espiar" ≠ "estudar").
- **Marcador de lição em andamento** (o único estado que ganha selo): pill
  `inline-flex h-[18px] shrink-0 items-center rounded-full bg-primary/10 px-1.5 font-mono
  text-[10px] tabular-nums text-primary` → `2/3` · `title="você parou no passo 2 de 3"`.
  Entra entre o título e os badges existentes (dominada, anotações). Não iniciada/concluída:
  nenhum selo novo (o check já conta a história).

### 7.b Peek (substitui o `TaskDetail` inline)

Mesma moldura do detail atual: `border-t border-border px-3 py-3 space-y-3`.

1. **Objetivo**: `Section` atual (eyebrow + `text-sm leading-relaxed`).
2. **Estado da lição + CTA** — um bloco `flex items-center justify-between gap-3 rounded-lg
   border border-border bg-background p-3`:
   - Esquerda: `text-xs text-muted-foreground` → `não iniciada` / `você parou no passo 2 de 3
     · há 3 dias` / `concluída em 12/07` (números/data em mono tabular). Em andamento, os
     mini-segmentos §3 (violeta) podem preceder o texto — mesmo componente, `shrink-0`.
   - Direita, o CTA contextual:
     - **Estudar** / **Continuar lição**: sólido `inline-flex h-9 shrink-0 items-center gap-1.5
       rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground
       hover:bg-primary/90 ${FOCUS}` + `ArrowRight h-3.5 w-3.5` — o único sólido da árvore
       inteira: é O convite.
     - **Rever lição**: quieto (`QUIET_BTN` h-9) — rever não compete com estudar as pendentes.
3. **Anotações**: componente `Comments` atual, intocado.
4. **Editar**: o lápis continua no cabeçalho da row (comportamento atual, abre `TaskEditor`).

O que o peek **não** mostra, por lei da UX §1.3: questão, pontos-chave, resposta, passos —
se aparecer conteúdo pedagógico além do objetivo num PR, é regressão.

---

## 8. Acessibilidade e motion

- **Live region** `sr-only aria-live="polite"` (padrão do Revisar): anuncia a cada envio —
  `resposta enviada — pontos-chave revelados` / `… resposta-modelo revelada` /
  `task concluída — ela volta pra revisão amanhã`.
- **Foco**: entrada e avanço de passo → textarea (UX §2.1); conclusão → título "Task concluída"
  (`tabIndex={-1}`); fechar a sheet → devolve ao card do Tutor no transcript. Anel `FOCUS`
  (constante do App) em todo interativo.
- **Enter envia / Shift+Enter quebra** dentro do textarea (o listener global de atalhos do app
  já ignora TEXTAREA — sem conflito com espaço/1/2 do Revisar).
- **Indicador de passos**: `role="img"` + `aria-label` (segmentos decorativos, sem tab-stops);
  marcador de retomada `role="separator"`.
- **Contraste**: só tokens existentes (primary/recall/domain AA nos dois temas em 10–11px+;
  sólidos com os pares `-foreground` cunhados pra isso). Nenhuma cor nova.
- **Motion**: só `fade-in`/`transition-colors` com `motion-safe:`; scroll smooth condicionado a
  `prefers-reduced-motion`; pulse do Tutor idem. Histórico renderiza sem animação (§4.h).
- **Alvos de toque**: botão de envio h-12; CTAs h-9+; válvulas são links de texto mas com
  `py-1` de área estendida (hit ≥ 28px — aceitável pra ação secundária rara).

---

## 9. Não-objetivos (segurar o dev)

1. **Zero mudança de comportamento**: fluxo, validação, válvulas, Done automático, retomada,
   rascunho local, conflito de abas — tudo é da `DESIGN-LICAO-UX.md`, já decidido.
2. **Sem UI de chat**: nada de balões alternados, avatar do usuário, "digitando…", timestamps
   por mensagem estilo messenger. É diário de estudo em coluna única.
3. **Sem tokens novos, sem webfonts, sem emoji** (o 🎓/✓/⚠/💡 do mock viram lucide;
   ✓ visual = ícone `Check`). Âmbar segue nunca-sólido; sólidos = `primary` + `domain`
   (emenda §1.1).
4. **Sem gamificação da conclusão**: confete, streak inline, sons, haptics — a celebração é o
   chip esmeralda + informação (decisão de tom da UX §8).
5. **Sem animação de replay** do transcript na retomada e sem auto-scroll contínuo tipo chat —
   um posicionamento inicial e pronto.
6. **Não tocar no Revisar** nem no `TaskEditor`; o `TaskDetail` atual morre, mas `Comments`,
   `DoneBox`, `Section` e o editor são reaproveitados como estão.
7. **Sem dropdown/overflow novo** no header da Lição — a ação de editar é um lápis quieto (§5.c).
8. **Conteúdo/limites da correção** (prompt, nota, contadores) = `DESIGN-TUTOR-IA.md`; aqui só
   a casca visual da sheet.

## 10. Checklist de aceite visual

- [ ] **Parece irmã do player do Revisar**: lado a lado em 390px, `/revisar` e a Lição têm a
  mesma coluna (`max-w-xl`), o mesmo X, a mesma linguagem de vidro no topo/fundo e a mesma
  família de dock — muda a tinta (âmbar ⇄ violeta), não a silhueta.
- [ ] **Input nunca coberto pelo teclado mobile**: em 390×844 (iOS e Android), focar o textarea
  em qualquer passo deixa campo + botão de envio inteiramente visíveis acima do teclado, com
  pelo menos um bloco do transcript ainda legível acima; nenhum zoom de página ao focar (fonte
  16px no mobile).
- [ ] **Transcript legível de relance**: com a lição completa na tela, dá pra apontar sem ler —
  o que é do usuário (blocos neutros) vs do conteúdo (violeta/esmeralda); resposta em branco
  aparece em itálico apagado, sem tom de erro.
- [ ] **Retomada acha o presente em 1s**: reabrindo no passo 2, o marcador âmbar "você parou
  aqui" é o único âmbar da tela e está visível junto com o dock, sem nenhum scroll manual.
- [ ] **Sequencial sem shift**: enviar um passo adiciona blocos apenas abaixo (fade in-place);
  nada acima do bloco novo se move; a altura do dock não muda entre estados (vazio/busy/erro).
- [ ] **Sólidos certos**: os únicos botões sólidos da rota são o envio violeta, o "Enviar e
  concluir" esmeralda e o "voltar ao estudo" da sheet; convite do Tutor é tracejado violeta em
  tint; nenhum sólido âmbar existe.
- [ ] **Conclusão sóbria**: momento Done = chip esmeralda + "Task concluída" + 1 linha de
  método; zero emoji, zero exclamação, zero confete; convite do Tutor discreto e opcional
  abaixo, saídas quietas.
- [ ] **Árvore limpa e com o convite certo**: a row em andamento mostra a pill violeta `2/3`;
  o peek mostra só objetivo + estado/CTA + anotações + editar (nenhum conteúdo pedagógico);
  o CTA "Estudar/Continuar lição" é o único botão sólido visível na árvore.
