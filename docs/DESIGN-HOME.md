# DESIGN-HOME.md — Spec da Home + Shell do app Fixa

> Spec de design pronta pra implementação. Escopo: tokens globais (`web/src/index.css`), shell/header (`App.tsx`) e tela Home (`screens/Home.tsx`). **Fora de escopo:** Review, Track, NewTheme, Ajuda, Login (só herdam os tokens novos — não restilizar).
> Referências de identidade: `web/public/fixa.html` (landing). Convenção: classes Tailwind v4 + tokens shadcn já existentes.

---

## 1. Direção

A landing é a marca em volume alto (dark índigo saturado, canvas animado, hero). O app é a mesma marca em volume baixo: **ferramenta de uso diário, Linear/GitHub vibes** — superfícies quase neutras com ~1,5–2% de croma violeta (nunca cinza puro, nunca o roxo saturado da landing), e os três acentos da identidade usados só com propósito: **violeta = marca/CTA/atividade**, **âmbar = revisão/consistência (inclui streak)**, **esmeralda = domínio/conclusão**. O monospace continua sendo a "face de dados": todo número, contador, label de eixo e eyebrow é mono tabular. Nada de gradientes, heros ou animação decorativa dentro do app — a densidade calma é o que faz a pessoa voltar todo dia.

---

## 2. Tokens (`web/src/index.css`)

**Como aplicar:** substituir o bloco final atual (`/* ── marca Fixa … ── */`, hoje 2 linhas) pelo bloco abaixo, no fim do arquivo. O bloco base shadcn (linhas 6–57) fica intocado — estes overrides vencem por vir depois. Registrar as cores novas num segundo `@theme inline` (Tailwind v4 permite múltiplos blocos).

```css
/* ── marca Fixa: neutros com tinta violeta + acentos semânticos ── */
:root {
  /* neutros light — branco com véu violeta, nunca cinza puro */
  --background: oklch(0.975 0.005 290);        /* ≈ #f8f7fb */
  --foreground: oklch(0.235 0.03 290);         /* ≈ #231c39 (tinta índigo) */
  --card: oklch(1 0 0);                        /* card branco sobre fundo tingido */
  --card-foreground: oklch(0.235 0.03 290);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.235 0.03 290);
  --secondary: oklch(0.93 0.012 290);          /* ≈ #eae6f3 — pill ativa do nav */
  --secondary-foreground: oklch(0.235 0.03 290);
  --muted: oklch(0.955 0.008 290);             /* ≈ #f1eff7 */
  --muted-foreground: oklch(0.50 0.03 290);    /* ≈ #6a6285 — AA sobre bg e card */
  --accent: oklch(0.95 0.01 290);              /* ≈ #efecf6 — hover sutil */
  --accent-foreground: oklch(0.235 0.03 290);
  --border: oklch(0.905 0.012 290);            /* ≈ #e2deec */
  --input: oklch(0.905 0.012 290);
  --primary: oklch(0.58 0.23 287);             /* ≈ #6c47f0 (brand light da landing) */
  --primary-foreground: oklch(0.99 0 0);
  --ring: oklch(0.58 0.23 287);

  /* acentos semânticos */
  --recall: oklch(0.58 0.12 70);               /* ≈ #a06f0a — âmbar queimado, AA 4.5+ em texto 11px */
  --recall-foreground: oklch(0.99 0 0);
  --domain: oklch(0.52 0.10 168);              /* ≈ #0a7a58 — esmeralda escura, AA em texto 11px */
  --domain-foreground: oklch(0.99 0 0);

  /* heatmap — ramp violeta 5 níveis (light: clareia → satura) */
  --heat-0: oklch(0.94 0.012 290);             /* ≈ #eae7f2 (vazio, um passo abaixo do card) */
  --heat-1: oklch(0.87 0.06 290);              /* ≈ #d6c9f6 */
  --heat-2: oklch(0.76 0.12 289);              /* ≈ #ad90f0 */
  --heat-3: oklch(0.64 0.19 288);              /* ≈ #8257ec */
  --heat-4: oklch(0.50 0.24 287);              /* ≈ #5b2bd6 (máximo = violeta profundo) */
}

.dark {
  /* neutros dark — índigo-tinta dessaturado (a landing usa croma ~2×; aqui é tool) */
  --background: oklch(0.155 0.015 290);        /* ≈ #12101b */
  --foreground: oklch(0.93 0.01 290);          /* ≈ #eae7f3 */
  --card: oklch(0.19 0.018 290);               /* ≈ #1b1726 */
  --card-foreground: oklch(0.93 0.01 290);
  --popover: oklch(0.19 0.018 290);
  --popover-foreground: oklch(0.93 0.01 290);
  --secondary: oklch(0.275 0.02 290);          /* ≈ #2b2539 — pill ativa */
  --secondary-foreground: oklch(0.93 0.01 290);
  --muted: oklch(0.23 0.02 290);               /* ≈ #221d2e */
  --muted-foreground: oklch(0.665 0.03 292);   /* ≈ #9992b5 */
  --accent: oklch(0.235 0.02 290);             /* ≈ #231e30 — hover, mais sutil que secondary */
  --accent-foreground: oklch(0.93 0.01 290);
  --border: oklch(0.28 0.02 290);              /* ≈ #2e2839 — sólida (não alpha), corte nítido GitHub-like */
  --input: oklch(0.30 0.02 290);
  --primary: oklch(0.66 0.20 288);             /* ≈ #8b68fa (entre brand e brand-2 da landing) */
  --primary-foreground: oklch(0.99 0 0);
  --ring: oklch(0.66 0.20 288);

  --recall: oklch(0.82 0.14 80);               /* ≈ #f0b73e (o #f4b740 da landing) */
  --recall-foreground: oklch(0.25 0.05 80);    /* tinta escura p/ eventual fill sólido */
  --domain: oklch(0.77 0.13 168);              /* ≈ #33d0a1 (o #35d6a4 da landing) */
  --domain-foreground: oklch(0.20 0.04 168);

  /* heatmap — ramp violeta 5 níveis (dark: escurece → acende até o brand-2) */
  --heat-0: oklch(0.25 0.02 290);              /* ≈ #282235 (vazio, um passo acima do card) */
  --heat-1: oklch(0.35 0.09 292);              /* ≈ #40306b */
  --heat-2: oklch(0.47 0.14 290);              /* ≈ #5b429f */
  --heat-3: oklch(0.59 0.19 288);              /* ≈ #7852d9 */
  --heat-4: oklch(0.72 0.19 288);              /* ≈ #9c7bff (máximo = brand-2 #9d7bff) */
}

@theme inline {
  --color-recall: var(--recall);
  --color-recall-foreground: var(--recall-foreground);
  --color-domain: var(--domain);
  --color-domain-foreground: var(--domain-foreground);
  --color-heat-0: var(--heat-0);
  --color-heat-1: var(--heat-1);
  --color-heat-2: var(--heat-2);
  --color-heat-3: var(--heat-3);
  --color-heat-4: var(--heat-4);
}
```

### 2.1 Decisões e regras de uso

| Token/tema | Decisão |
|---|---|
| **Streak** | **Âmbar** (`recall`), não laranja. Consistência/streak pertence à família "revisão"; a landing não tem laranja — a tríade violeta/âmbar/esmeralda fica intacta. Remover `text-orange-400` da Home. |
| **Âmbar light ≠ landing** | Landing usa `#c88410` (3.0:1 no branco — reprova). No app, texto âmbar 11px precisa AA ⇒ `oklch(0.58 0.12 70)`. Mesma lógica pra esmeralda light. Delta deliberado. |
| **Âmbar nunca sólido em botão** | Âmbar aparece só como tint (`bg-recall/12` + `text-recall`), chip de ícone e badge. Sem botão sólido âmbar (contraste ruim no light). Único botão sólido do app: violeta `bg-primary`. |
| **Barras de progresso** | `bg-domain` (esmeralda) — troca o `bg-emerald-500` hardcoded. Track herda depois; vocabulário não muda. |
| **Destructive** | Mantém os defaults shadcn já presentes. Botões de excluir usam `text-destructive` / `hover:bg-destructive/10` (substituir `red-400/red-500` na Home). |
| **Radius** | `--radius: 0.625rem` mantido. Mapa: cards `rounded-xl` (14px), tiles/botões/pills `rounded-lg` (10px), inputs e controles pequenos `rounded-md` (8px), células heatmap `rounded-[2px]`, badges `rounded-full`. |
| **Sombras** | `shadow-sm` do Card no light; no dark a borda sólida já faz o corte (shadow-sm fica invisível — ok, não compensar). |

### 2.2 Tipografia

- **Sans**: stack de sistema atual (sem webfont — não-objetivo).
- **Mono** (`font-mono` default do Tailwind) = "face de dados". Usar **sempre com `tabular-nums`** em: valores dos stat tiles, contadores `X/Y`, números de badges, labels de mês/dia e legenda do heatmap, eyebrows de seção, kicker de data, contadores da lixeira.
- **Eyebrow de seção** (padrão único, vem da landing): `font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground`.
- Escala da Home: eyebrow 11px · metadados 11px · corpo secundário 12px (`text-xs`) · corpo 13px (`text-[13px]`) · label de card 14px (`text-sm`) · título de tema 15px (`text-[15px] font-semibold`) · valor de stat 20px (`text-xl font-mono font-semibold tabular-nums`).

---

## 3. Shell / Header (`App.tsx`)

Estrutura atual mantida (sticky, blur, mesma ordem de elementos); refinamentos abaixo.

- **Container**: `sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md`. Inner: `mx-auto flex h-14 max-w-4xl items-center gap-2 px-4` (**56px** de altura, constante).
- **Marca**: botão → `/`. Logo loop existente **24px** + wordmark `text-[17px] font-extrabold tracking-[-0.02em]`. Em `<sm`, esconder o wordmark (`hidden sm:inline`) e manter só o loop — é o que libera espaço pros 3 itens de nav no mobile.
- **Nav** (Temas · Revisar · Ajuda): pills `h-8 px-3 rounded-lg text-sm`. Ativa: `bg-secondary font-medium text-foreground` + `aria-current="page"`. Inativa: `text-muted-foreground hover:bg-accent hover:text-foreground`. "Temas" ativa também na rota `t/:id` (comportamento atual).
- **Badge do Revisar**: `ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-recall/15 px-1 font-mono text-[11px] tabular-nums text-recall`. Oculto quando 0; exibir `99+` acima de 99. Mantém o listener `fx-review-changed` existente.
- **Cluster direito**: 
  - "Novo tema": **único elemento sólido do shell** — `h-9 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90`, ícone `Plus h-4 w-4`. Em `<sm` vira icon-button `h-9 w-9 rounded-lg` (já existe).
  - Tema e Sair: **sem borda** (mudança — hoje têm `border`): `h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground`, ícones `h-4 w-4`. Menos cromo, só o CTA pesa.
- **Foco**: todo interativo do app: `focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none`.
- **Main**: `mx-auto max-w-4xl px-4 py-6` (py sobe de 5→6). Não alargar o shell (não-objetivo).

---

## 4. Home — arquitetura e seções

**Ordem das zonas** (de cima pra baixo). Cada zona abre com o eyebrow padrão (§2.2) como `h2`; espaçamento: `space-y-8` entre zonas, `space-y-3` dentro da zona, eyebrow com `mb-3`. `h1` `sr-only` = "Início".

```
1. HOJE          → linha eyebrow + data · cards de ação (Revisar | Continuar)
2. CONSISTÊNCIA  → 4 stat tiles · heatmap GitHub-style
3. SEUS TEMAS    → lista de temas
4. (sem label)   → Lixeira, mt-10
```

### 4.a Saudação/contexto — decisão: **não há saudação com nome**

App-ferramenta não cumprimenta. O contexto é a linha de abertura da zona 1: eyebrow `HOJE` à esquerda e, na mesma linha à direita, a data — `font-mono text-[11px] text-muted-foreground/70 lowercase`, formato `sex, 11 jul` (`toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })`, sem pontos finais — `replace(/\./g, "")`).

### 4.b Zona HOJE — cards de ação

Grid `grid gap-3 sm:grid-cols-2` (empilha no mobile, Revisar primeiro). Anatomia comum: `Card` com `p-4`, min-height ~76px, conteúdo `flex items-center gap-3`; **o card inteiro é o hit-area** (um `<button>`), com um "chip-botão" visual à direita (é `<span>` estilizado, não botão aninhado). Chip: `h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium inline-flex items-center`.

**Card Revisar** (usa `stats.dueToday`):
- `dueToday > 0`: ícone `RotateCcw h-[18px]` dentro de chip `h-9 w-9 rounded-lg bg-recall/12 text-recall grid place-items-center`. Texto: título `text-sm font-semibold` "Revisar hoje"; sub `text-xs text-muted-foreground` "N tasks na fila". Chip-botão: `bg-recall/12 text-recall` "Revisar". Hover do card: `hover:border-recall/50 transition-colors`. Navega pra `/revisar`.
- `dueToday === 0` (fila limpa): não-clicável (`div`), ícone `Check` em `bg-domain/12 text-domain`, título "Fila limpa", sub "Nada pendente. Amanhã tem mais.", sem chip-botão.

**Card Continuar** (`next` = primeiro tema com `done < total`, lógica atual):
- Existe `next`: ícone `BookOpen` em chip `bg-primary/10 text-primary`. Overline `font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground` "continuar"; título = título do tema, `text-sm font-semibold truncate`; sub `text-xs text-muted-foreground` "X de Y tasks". Chip-botão `bg-primary/10 text-primary` "Abrir". Hover `hover:border-primary/50`. Navega pra `/t/:id`.
- Sem `next` (tudo concluído, mas há temas): ícone `Plus` em `bg-primary/10 text-primary`, título "Tudo concluído", sub "Crie outro tema ou adicione conteúdo.", chip "Novo tema" → `/novo`.

### 4.c Zona CONSISTÊNCIA — stat tiles

Grid `grid grid-cols-2 gap-2.5 sm:grid-cols-4`, acima do heatmap (mesma zona, `space-y-3`).

Tile: `rounded-lg border border-border bg-card px-3.5 py-3` (~64px). Linha 1: ícone `h-4 w-4` colorido + valor `text-xl font-mono font-semibold tabular-nums text-foreground`. Linha 2: label `mt-0.5 text-[11px] text-muted-foreground`.

| # | Métrica | Fonte | Ícone (lucide) | Cor do ícone | Label |
|---|---|---|---|---|---|
| 1 | Sequência | `s.streak` | `Flame` | `text-recall` | "dia seguido"/"dias seguidos" |
| 2 | Ações hoje | `s.days` (último item) | `Activity` | `text-primary` | "ação hoje"/"ações hoje" |
| 3 | Dominadas | `s.mastered` | `GraduationCap` | `text-domain` | "dominadas" ("dominada" se 1) |
| 4 | Concluídas | `s.tasksDone` | `Layers` | `text-muted-foreground` | "de {tasksTotal} tasks" |

Nenhum tile é clicável (a ação de revisar já mora na zona HOJE — o tile "revisar hoje" atual **sai** da strip). Sem sparklines, sem variação percentual.

### 4.d Heatmap GitHub-style (o coração da spec)

**Requisito nº 1: o grid preenche 100% da largura interna do card em desktop.** Colunas fluidas `1fr`; scroll horizontal só quando o mínimo não couber.

**Janela de dados: 52 semanas** (colunas), da semana atual pra trás. Coluna 52 = semana corrente (parcial); dias futuros são renderizados com `visibility: hidden` (mantêm a malha). Linhas = dom(1)…sáb(7).

**Requisito de dados (backend):** `getStats().days` hoje devolve 119 dias (17 semanas). Passar a devolver **do domingo de 51 semanas atrás até hoje** (357–364 itens, `{ day: "YYYY-MM-DD", count }` contíguos). Sem mudança de shape.

**Estrutura DOM sugerida:**

```tsx
<Card className="p-4">
  {/* scroller: só rola em container estreito; estilo de scrollbar já existe */}
  <div ref={scrollerRef} className="scroll-custom overflow-x-auto pb-1">
    <div
      role="img"
      aria-label={`Consistência: ${total} ações nas últimas 52 semanas`}
      className="grid gap-[3px]"
      style={{
        gridTemplateColumns: "28px repeat(52, minmax(10px, 1fr))",
        gridTemplateRows: "14px repeat(7, auto)",
      }}
    >
      {/* labels de mês: row 1, posicionadas por coluna */}
      <div style={{ gridRow: 1, gridColumn: `${weekIdx + 2} / span 4` }}
           className="font-mono text-[10px] lowercase text-muted-foreground">jul</div>
      {/* labels de dia: col 1, rows 3/5/7 */}
      <div style={{ gridRow: 3, gridColumn: 1 }}
           className="pr-1.5 text-right font-mono text-[10px] leading-none text-muted-foreground/80 self-center">seg</div>
      {/* célula-dia: col = semana+2, row = weekday+2 */}
      <div
        style={{ gridRow: weekday + 2, gridColumn: weekIdx + 2 }}
        className={`aspect-square w-full rounded-[2px] ${HEAT[level]} ${isToday ? "outline outline-[1.5px] outline-offset-1 outline-primary" : ""}`}
        title={tooltip}
      />
    </div>
  </div>
  {/* rodapé: total à esquerda, legenda à direita */}
  <div className="mt-2 flex items-center justify-between gap-2">
    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{total} ações no último ano</span>
    <div className="flex items-center gap-[3px]">
      <span className="mr-1 font-mono text-[10px] text-muted-foreground">menos</span>
      {/* 5 swatches h-[10px] w-[10px] rounded-[2px] bg-heat-0..4 */}
      <span className="ml-1 font-mono text-[10px] text-muted-foreground">mais</span>
    </div>
  </div>
</Card>
```

**Regras de layout (o porquê dos números):**
- `minmax(10px, 1fr)` faz as colunas **esticarem até encher o card** quando há espaço, e travarem em 10px quando não há — o grid então tem min-width intrínseco de `28 + 3 + 52×10 + 51×3 = 704px` e o wrapper rola. Zero media queries.
- No shell `max-w-4xl`: largura interna do card = 896 − 32 (px da page) − 32 (p-4 do card) = **832px** ⇒ células de ~12,5px, bloco com ~122px de altura. Preenche a largura toda em viewport ≥ 768px; abaixo disso rola.
- Célula: `aspect-square w-full` (quadrada em qualquer largura de coluna), `rounded-[2px]`.
- **Scroll inicial à direita** (semanas recentes visíveis no mobile): `useEffect(() => { scrollerRef.current?.scrollTo({ left: scrollerRef.current.scrollWidth }); }, [days])`.

**Níveis de intensidade** (5, determinísticos — não usar quartis):

| Nível | count | Classe |
|---|---|---|
| 0 | 0 | `bg-heat-0` |
| 1 | 1–2 | `bg-heat-1` |
| 2 | 3–5 | `bg-heat-2` |
| 3 | 6–9 | `bg-heat-3` |
| 4 | ≥10 | `bg-heat-4` |

**Labels de mês:** semanas agrupadas pelo mês do seu domingo; nova label na primeira semana em que o mês muda; **suprimir segmento com < 3 colunas** (evita colisão nas bordas). Texto: `jan fev mar abr mai jun jul ago set out nov dez`, `font-mono text-[10px] lowercase text-muted-foreground`, alinhado à esquerda da coluna inicial.

**Labels de dia:** só `seg` (row 3), `qua` (row 5), `sex` (row 7), no gutter de 28px, `text-right pr-1.5 font-mono text-[10px] text-muted-foreground/80 self-center`.

**Hoje:** sempre com ring — `outline outline-[1.5px] outline-offset-1 outline-primary` (o offset deixa 1px do card aparecer entre célula e anel). Vale inclusive com count 0.

**Hover (desktop):** `hover:outline hover:outline-1 hover:outline-foreground/30` nas células sem ring de hoje.

**Tooltip:** nativo (`title`), sem lib e sem tooltip flutuante custom. Formato: `"3 ações · qua, 08 jul"`; count 0 → `"sem atividade · seg, 06 jul"`; singular `"1 ação · …"`. Data: `toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })` sem pontos.

**Acessibilidade:** o grid inteiro é `role="img"` com `aria-label` resumindo (total + janela); células são decorativas (o `title` é affordance de mouse). Não criar 364 tab-stops. Sem animação de entrada (nada a fazer pra `prefers-reduced-motion`).

### 4.e Zona SEUS TEMAS — lista

Header da zona: eyebrow `SEUS TEMAS` + contador `· N` (mono, mesmo estilo) à esquerda; à direita, botão-texto quieto `+ novo tema` (`text-xs text-primary hover:underline underline-offset-2`) → `/novo`.

Lista: `space-y-2.5`. Card do tema: `Card p-4 rounded-xl cursor-pointer transition-colors hover:border-primary/40` (navega pro tema; role de botão, foco visível §3).

Anatomia (uma coluna de conteúdo + ação de excluir à direita, `flex items-start gap-3`):
1. **Linha do título**: título `text-[15px] font-semibold truncate flex-1 min-w-0` · badges à direita (ordem fixa): 
   - **prova**: pill `h-[20px] rounded-full px-2 text-[11px] font-medium inline-flex items-center gap-1` com `CalendarClock h-3 w-3`. Cor por urgência: `daysLeft > 7` → `bg-primary/10 text-primary` "prova em {X}d"; `1–7` → `bg-recall/12 text-recall` "prova em {X}d"; `0` → `bg-recall/12 text-recall` "prova hoje"; `< 0` → `bg-muted text-muted-foreground` "prova passou". (Sobe da posição atual — badge de prova pertence à linha do título.)
   - **revisar**: pill `bg-recall/12 text-recall` com `RotateCcw h-3 w-3` + `{due}` (mono tabular) + `title="pra revisar hoje"`. Só se `due > 0`.
   - **dominadas**: sem pill — `inline-flex items-center gap-1 text-[11px] font-medium text-domain` com `GraduationCap h-3 w-3` + `{mastery}`. Só se `> 0`.
   - **contador**: `font-mono text-xs tabular-nums text-muted-foreground` "{done}/{total}".
2. **Resumo** (se houver): `mt-1 text-xs text-muted-foreground truncate` (1 linha).
3. **Barra de progresso**: `mt-2 h-1.5 rounded-full bg-muted overflow-hidden` com fill `bg-domain rounded-full transition-all` a `{pct}%`.
4. **Counts**: `mt-1.5 text-[11px] text-muted-foreground` — "{e} epics · {s} stories · {t} tasks ({p} práticas)".

**Excluir**: icon-button à direita, **sempre visível mas apagado** (sem jogo de hover-only — touch existe): `h-8 w-8 rounded-md grid place-items-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10`, `Trash2 h-4 w-4`, `title="mover pra lixeira"`, `stopPropagation`. Confirm mantém o texto atual.

No mobile os badges quebram: linha do título usa `flex flex-wrap items-center gap-x-2 gap-y-1` — título ocupa a primeira linha inteira quando não couber (mantém `min-w-0`).

### 4.f Lixeira — discreta

Zona sem eyebrow, `mt-10`, **sem card/borda** no estado fechado: uma linha `flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground` com `Trash2 h-3.5 w-3.5`, texto "Lixeira", contador mono `({n})` e chevron. Renderiza **somente se n > 0** (comportamento atual). 

Aberta: lista `mt-2 space-y-1.5`; item = row atual (`rounded-md border border-border bg-card p-2 text-sm`) com título truncado, meta `"{t} tasks · excluído {dd mmm}"` em `text-[11px] text-muted-foreground`, ações: restaurar (`Undo2`, `text-domain hover:bg-domain/10`) e apagar de vez (`X`, `text-muted-foreground hover:text-destructive hover:bg-destructive/10`).

### 4.g Empty state (zero temas)

Substitui a página inteira (sem HOJE/CONSISTÊNCIA — zeros não motivam). Container: `rounded-xl border border-dashed border-border px-6 py-14 text-center`.
- Logo loop da marca (componente `Logo` existente) a **32px** com `opacity-70`, centrado.
- Título `mt-4 font-semibold` "Nenhum tema ainda".
- Sub `mt-1 text-sm text-muted-foreground max-w-sm mx-auto` "Descreva um assunto e a Fixa monta a trilha — com revisão espaçada pra você não esquecer."
- CTA `mt-5` sólido primary (mesmo estilo do header) "Criar primeiro tema" com `Plus`.
- Eco da identidade: `mt-6 font-mono text-[11px] text-muted-foreground/70` — `revisa em 1d · 2d · 4d · 7d · 15d · 30d`.
- Lixeira (se houver itens) abaixo, `mt-8 max-w-md mx-auto text-left`.

### 4.h Loading e erro

- Skeletons na ordem/altura do layout final: ação `2× h-[76px]` (grid 2 cols), tiles `4× h-[64px]`, heatmap `1× h-[180px]`, temas `3× h-[120px]`. Usa `Skeleton`/`.skel` existentes.
- Erro: `Card p-4 text-sm text-destructive` — "erro: {mensagem}" (atual, mantém).

---

## 5. Microcopy (pt-BR)

| Onde | Texto |
|---|---|
| Kicker | `HOJE` · `sex, 11 jul` |
| Revisar (com fila) | título **Revisar hoje** · sub `{n} tasks na fila` (`1 task na fila`) · chip **Revisar** |
| Revisar (vazio) | título **Fila limpa** · sub `Nada pendente. Amanhã tem mais.` |
| Continuar | overline `continuar` · título `{título do tema}` · sub `{x} de {y} tasks` · chip **Abrir** |
| Tudo concluído | título **Tudo concluído** · sub `Crie outro tema ou adicione conteúdo.` · chip **Novo tema** |
| Tiles | `dias seguidos` / `ações hoje` / `dominadas` / `de {n} tasks` (singular: `dia seguido`, `ação hoje`, `dominada`) |
| Zona 2 eyebrow | `CONSISTÊNCIA` |
| Heatmap rodapé | `{n} ações no último ano` · legenda `menos` … `mais` |
| Heatmap tooltip | `{n} ações · qua, 08 jul` · `1 ação · …` · `sem atividade · …` |
| Zona 3 eyebrow | `SEUS TEMAS · {n}` · link `+ novo tema` |
| Badges do tema | `prova em {x}d` / `prova hoje` / `prova passou` · pill revisar: `{n}` (title `pra revisar hoje`) · dominadas: `{n}` (title `dominadas`) |
| Counts do tema | `{e} epics · {s} stories · {t} tasks ({p} práticas)` |
| Confirm excluir | `Mover "{título}" pra lixeira? Dá pra restaurar depois.` |
| Lixeira | `Lixeira ({n})` · item `{t} tasks · excluído {dd mmm}` · titles `restaurar` / `apagar de vez` · confirm `Apagar de vez? Não dá pra desfazer.` |
| Empty | `Nenhum tema ainda` · `Descreva um assunto e a Fixa monta a trilha — com revisão espaçada pra você não esquecer.` · CTA `Criar primeiro tema` · `revisa em 1d · 2d · 4d · 7d · 15d · 30d` |

Tom: minúsculas em subs e metadados, sem exclamação, sem emoji, sem "você consegue!".

---

## 6. Não-objetivos (segurar o dev)

1. **Nada da landing em volume alto**: sem canvas animado, gradientes, hero, glow — a identidade entra por tinta de cor, mono e os 3 acentos.
2. **Sem laranja** e sem cores novas: violeta/âmbar/esmeralda/destructive, ponto. Streak é âmbar.
3. **Heatmap sem lib** (nada de recharts/nivo), **sem tooltip custom flutuante** (title nativo), **sem animação de entrada**, **sem seletor de período**.
4. **Não restilizar** Review/Track/NewTheme/Ajuda/Login nesta entrega — eles só herdam tokens. (Exceção permitida: nada.)
5. **Não mudar API** além de estender a janela de `days` para 52 semanas.
6. **Não alargar o shell** (`max-w-4xl` fica) nem criar sidebar.
7. **Sem gamificação extra** na Home v1: nada de metas diárias, gráficos de linha, percentuais de crescimento, confete.
8. **Sem webfonts** — stacks de sistema.

---

## 7. Checklist de aceite

- [ ] Dark e light: fundo/card/borda com tinta violeta perceptível lado a lado com cinza puro (não é `oklch(x 0 0)` em nenhum neutro).
- [ ] **Heatmap encosta no padding interno do card nos dois lados em viewport ≥ 768px** (célula fluida, sem faixa morta à direita — a reclamação nº 1).
- [ ] Heatmap em 390px: rola horizontalmente, **já aberto nas semanas recentes**, células 10px.
- [ ] 52 colunas; labels de mês corretas na virada; `seg/qua/sex` à esquerda; legenda menos→mais à direita do rodapé; total à esquerda.
- [ ] Hoje tem anel violeta visível nos dois temas, mesmo com count 0.
- [ ] 5 níveis distinguíveis nos dois temas (conferir heat-1 vs heat-0 no light).
- [ ] Zona HOJE responde "o que eu faço agora" sem scroll em laptop 1366×768.
- [ ] Nenhum botão sólido âmbar; único sólido da página além do CTA de header/empty é o chip visual dos action cards (tintado, não sólido).
- [ ] Textos âmbar/esmeralda de 11px passam AA no light (tokens novos, não `amber-500`).
- [ ] Foco visível (ring) em: pills do nav, cards de ação, cards de tema, excluir, lixeira.
