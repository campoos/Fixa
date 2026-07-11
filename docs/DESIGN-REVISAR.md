# DESIGN-REVISAR.md — Spec da tela Revisar (player de sessão)

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/screens/Review.tsx`**. Nenhuma mudança em tokens (`index.css`), shell (`App.tsx`), API ou lógica de fila — só apresentação.
> Continuidade: esta spec **levanta oficialmente** a exceção do não-objetivo nº 4 da `DESIGN-HOME.md` ("não restilizar Review") — a Review agora entra no sistema. Tudo aqui usa os tokens e o vocabulário já implementados pela Home (`--recall`, `--domain`, neutros violeta, `FOCUS`, eyebrow mono).
> Dados disponíveis: `getReview() → { due: Due[], ladder: number[] }`, com `Due { trackId, trackTitle, id, title, sample{q,a}, type, epic, story, box, next }` e `ladder = [1,2,3,4,7,15,21,30]` (8 caixas; box 0–7; graduou no 8).

---

## 1. Direção

A Revisar é um **player**, não uma página: uma sessão linear, um card por vez, começo-meio-fim. É a tela mais usada do produto e a mais usada **no celular** — então tudo é otimizado pra uma mão: coluna estreita centrada, pergunta como protagonista absoluto, ações grandes ancoradas na zona do polegar. A identidade é a mesma da Home em volume ainda mais baixo: o cromo da sessão é âmbar (`recall` — é a família "revisão": barra, escada Leitner, Errei), o único elemento *loud* da tela é o **Acertei esmeralda sólido** (o momento de sucesso do método), e violeta aparece só no toggle ativo e nos anéis de foco. Nada de flip de card, confete ou vermelho: errar aqui não é falha, é agendamento — o design trata "Errei" como "volta pra amanhã".

### 1.1 Emendas/clarificações à DESIGN-HOME (registrar, não esconder)

| Regra da Home | Emenda |
|---|---|
| §2.1 "Único botão sólido do app: violeta `bg-primary`" | Passa a: **sólidos do app = `primary` (CTA) e `domain` (só o Acertei do player)**. Justificativa: Acertei é a ação mais pressionada do produto e o par `--domain`/`--domain-foreground` foi cunhado com AA pros dois temas exatamente pra "eventual fill sólido" (comentário do token). Âmbar **continua nunca-sólido**. |
| §2.1 "Barras de progresso: `bg-domain`" | Aquela regra cobre barras de **conclusão de conteúdo** (done/total do tema). A barra de **sessão de revisão** pertence à família revisão ⇒ **`bg-recall`**. Dois vocabulários distintos, cada um com uma cor: verde = domínio acumulado, âmbar = revisão em andamento. |

---

## 2. Layout geral

- **Container**: `mx-auto w-full max-w-xl` (576px) dentro do `main` existente (`max-w-4xl px-4 py-6` — não mexer). Justificativa: pergunta em 17px lê confortável a ~60ch; coluna estreita centrada dá cara de player e mantém os botões sob o polegar em qualquer viewport.
- **`h1` `sr-only`** = "Revisar hoje" (o eyebrow faz o papel visual, como na Home).
- **Zonas verticais** (de cima pra baixo):

```
1. CABEÇALHO DA SESSÃO  → linha eyebrow + toggle intercalar · linha barra + contador
2. CARD (protagonista)  → contexto/escada Leitner · pergunta · slot da resposta      (mt-5)
3. DOCK DE AÇÕES        → Revelar  ⇄  (Errei | Acertei) — sticky bottom              (mt-3)
4. HINT DE ATALHOS      → desktop only                                               (mt-3)
```

- **Estados de página** (mesmos moldes da Home):
  - Loading: skeletons na ordem/altura do layout final — `h-4 w-32` (eyebrow), `mt-3 h-1.5 w-full rounded-full` (barra), `mt-5 h-[280px] rounded-xl` (card), `mt-3 h-12 rounded-lg` (dock). Usa `Skeleton` existente.
  - Erro: `Card p-4 text-sm text-destructive` — `erro: {mensagem}` (único uso de destructive na tela).

---

## 3. Cabeçalho da sessão

**Linha 1** — `flex items-center justify-between gap-2`:
- Eyebrow (padrão §2.2 da Home): `h2` com `font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground` → texto **`revisão de hoje`**. (Mesma string de classes da constante `EYEBROW` da Home — pode extrair pra compartilhada, sem obrigação.)
- **Toggle intercalar** (só quando `trackCount > 1`, regra atual): pill `inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors` + `Shuffle h-3.5 w-3.5` + label fixo `intercalar` + `FOCUS`.
  - **Ligado**: `border-primary/40 bg-primary/10 text-primary` (violeta = feature/atividade, como hoje).
  - **Desligado**: `border-border text-muted-foreground hover:bg-accent hover:text-foreground`.
  - `aria-pressed={mix}` · `title="misturar os temas na sessão — fixa mais (reinicia a sessão)"`. O "reinicia a sessão" é honesto: alternar re-monta a fila (comportamento atual, manter).

**Linha 2** (`mt-3`) — barra + contador na mesma linha, padrão scrubber de player (`flex items-center gap-3`):
- **Barra**: `flex-1 h-1.5 overflow-hidden rounded-full bg-muted`; fill `h-full rounded-full bg-recall motion-safe:transition-[width] motion-safe:duration-300 ease-out` com `width: (pos/total)*100%` (avança **após** avaliar, como hoje). `role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos} aria-label="progresso da sessão"`.
- **Contador**: `shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground` → `{min(pos+1,total)}/{total}` (ex.: `3/12`). Some no fim de sessão (o placar assume); a barra fica em 100%.

**Placar parcial durante a sessão: NÃO.** Decisão: um contador de erros subindo ao vivo é exatamente o "assustador" que o método proíbe — pune a autoavaliação honesta. Progresso espacial (barra) + posição (contador) bastam; o placar aparece uma vez, no fim.

---

## 4. O card de revisão (protagonista)

Container: `Card` → `rounded-xl border-border bg-card shadow-sm p-5 min-h-[260px] sm:min-h-[280px]` (o `min-h` reduz o pulo de altura entre cards de tamanhos diferentes). `mt-5` do cabeçalho.

### 4.a Linha de contexto (topo, uma linha)

`flex items-center gap-2 text-[11px] text-muted-foreground min-w-0`:

1. **Tipo** (`shrink-0 inline-flex items-center gap-1`): ícone + palavra.
   - `theory` → `BookOpen h-3 w-3` + `teoria`
   - `practice` → `FlaskConical h-3 w-3` + `prática`
   - Ambos em `text-muted-foreground` (contexto é quieto — sem tint). Em `<sm` a palavra some (`hidden sm:inline`) e o ícone ganha `title="teoria"/"prática"`.
2. **Trilha**: `min-w-0 truncate` → `{trackTitle} · {epic}`.
3. **Escada Leitner** à direita (`ml-auto shrink-0`) — ver 4.b.

**Decisão: o `id` cru da task (ex.: `e2s1t3`) sai da tela.** Era debug; tema + epic + pergunta identificam. (Apresentação, não comportamento — a task continua a mesma.)

### 4.b Escada Leitner — decisão: **mini-steps, não pill**

"Caixa 3/8" como texto não mostra o que importa: **quanto falta pra dominar e o que está em jogo agora**. Vira uma escada de 8 degraus:

```tsx
<span role="img" aria-label={ariaLabel} title={ariaLabel} className="ml-auto flex shrink-0 items-center gap-1.5">
  <span className="flex items-center gap-[3px]">
    {/* ladder.length segmentos h-[5px] w-2.5 rounded-full */}
    {/* i < box  → bg-recall/40 (degraus vencidos)  */}
    {/* i === box → bg-recall    (degrau atual, mais forte) */}
    {/* i > box  → bg-secondary  (à frente)          */}
  </span>
  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{box + 1}/{ladder.length}</span>
</span>
```

- Largura total ≈ 101px de steps + ~24px de label — cabe ao lado do contexto truncado em 360px.
- **Tooltip/aria com a consequência** (computado do `ladder`, dado que já chega do server — só apresentação):
  - `box + 1 < ladder.length`: `caixa {box+1} de 8 · acertou → caixa {box+2} (revisa em {ladder[box+1]}d) · errou → caixa 1 (amanhã)`
  - `box + 1 === ladder.length` (caixa 8/8): `caixa 8 de 8 · acertou → dominada (sai da fila) · errou → caixa 1 (amanhã)`

### 4.c Pergunta

- `mt-4 text-[17px] font-semibold leading-snug text-balance` — o maior texto da página inteira (Home para em 15px): a pergunta é o produto. Sem truncate, sem clamp.
- Renderiza `cur.sample.q`.

### 4.d Slot da resposta — **estável nos dois estados** (anti-layout-shift nº 1)

Um único slot `mt-4 min-h-[96px] rounded-lg` presente **sempre**, com dois conteúdos:

- **Oculto** (`!shown`): `border border-dashed border-border bg-muted/40 grid place-items-center px-4 py-3`. Dentro, `flex flex-col items-center gap-1.5 text-center`: `EyeOff h-4 w-4 text-muted-foreground/60` + `text-xs text-muted-foreground/70` → **`responda de cabeça — depois revela`**. É o método impresso no lugar onde o olho está; o slot é decorativo (não clicável — o Revelar mora no dock, um único controle claro).
- **Revelado** (`shown`): `border border-domain/25 bg-domain/5 p-3.5` + `motion-safe:animate-in motion-safe:fade-in duration-200` (fade in-place; **sem slide/height animation** — movimento = shift). Conteúdo:
  - Eyebrow `font-mono text-[10px] uppercase tracking-[0.14em] text-domain mb-1.5` → `resposta`.
  - Texto `text-sm leading-relaxed whitespace-pre-wrap text-foreground` (tinta cheia — é o payload; hoje está em muted, sobe pra foreground). Sem altura máxima: resposta longa cresce o card pra baixo, e só pra baixo.
  - `tabIndex={-1}` (alvo de foco pós-revelação, §8).

**Por que não dá shift:** nada acima da pergunta muda entre estados; o slot tem o mesmo `min-h` oculto/revelado (respostas de até ~4 linhas = crescimento zero); os botões ficam **fora do card**, no dock de altura fixa (4.e). Resposta muito longa empurra apenas o rodapé da página — nunca os controles nem a pergunta.

### 4.e Dock de ações — sticky bottom (zona do polegar)

Fora do card, logo abaixo, **pinado no fundo do viewport quando o conteúdo passa da tela** (padrão de app de flashcard):

```tsx
<div className="sticky bottom-0 z-10 -mx-4 mt-3 bg-background/85 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md">
  {/* !shown → 1 botão · shown → grid grid-cols-2 gap-2.5 */}
</div>
```

- Mesma linguagem de vidro do header (`bg-background/85 backdrop-blur-md`), sem borda — quando não está pinado (desktop, conteúdo curto) lê como uma linha de botões normal sob o card. `z-10` (header é `z-30`).
- Troca `1 botão full-width ⇄ 2 botões de meia largura` **na mesma linha de h-12**: a altura do dock nunca muda ⇒ zero shift nos controles ao revelar.
- Renderiza só enquanto há card corrente (`cur`); some no fim de sessão e no vazio.

**Botão Revelar** (estado oculto):
- `flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent active:bg-accent ${FOCUS}` + `Eye h-4 w-4` + **`Revelar resposta`** + kbd `espaço`.
- **Deliberadamente quieto** (não-violeta, não-sólido): o ato celebrado do método é *tentar lembrar*, não revelar. Full-width h-12 já é óbvio e alcançável; a fricção é só a de uma decisão consciente.

**Botões de avaliação** (estado revelado, `grid grid-cols-2 gap-2.5`, ordem fixa Errei | Acertei — casa com as teclas 1 | 2 e cria memória muscular):

| Botão | Classes | Ícone | Racional |
|---|---|---|---|
| **Errei** | `h-12 rounded-lg border border-recall/45 bg-recall/10 text-recall text-sm font-medium hover:bg-recall/15 active:bg-recall/20 disabled:opacity-50 ${FOCUS}` | `RotateCcw h-4 w-4` | **Âmbar, não vermelho, ícone de retorno — não de X.** Errar devolve o item à família revisão (caixa 1, amanhã); vermelho/destructive puniria a autoavaliação honesta que o método exige. Tint, nunca sólido (regra da Home intacta). |
| **Acertei** | `h-12 rounded-lg bg-domain text-domain-foreground text-sm font-medium hover:bg-domain/90 active:bg-domain/85 disabled:opacity-50 ${FOCUS}` | `Check h-4 w-4` | Esmeralda **sólida** (emenda §1.1) — o único elemento loud da tela, no momento de sucesso. AA nos dois temas via `--domain-foreground`. |

- `title` dinâmico (desktop): Errei → `volta pra caixa 1 — revisa amanhã`; Acertei → `sobe pra caixa {box+2} — revisa em {ladder[box+1]}d` (na caixa 8: `dominada — sai da fila`).
- **Busy**: ao avaliar, ambos `disabled`; o pressionado troca o ícone por `Loader2 h-4 w-4 animate-spin` (guardar `busy: "pass" | "fail" | null` — presentacional). Sem troca de label.
- **kbd chips** (todos `aria-hidden`, `hidden sm:inline-flex` — invisíveis no mobile): `h-[18px] items-center rounded border px-1 font-mono text-[10px]`. Em superfície quieta (Revelar/Errei): `border-transparent bg-muted text-muted-foreground` (no Errei: `bg-recall/15 text-recall`). No Acertei sólido: `border-transparent bg-domain-foreground/20 text-domain-foreground`.

### 4.f Hint de atalhos (rodapé)

`mt-3 hidden sm:block text-center font-mono text-[11px] text-muted-foreground/70` → **`espaço revela · 1 errei · 2 acertei`**. Escondido no mobile (touch não tem teclado; o lembrete de método já mora no slot oculto). Some no fim/vazio.

---

## 5. Fim de sessão

`Card` centrado: `mt-5 rounded-xl p-8 text-center`. Barra do cabeçalho em 100% âmbar, contador oculto. Sem `PartyPopper`, sem emoji, sem exclamação — a comemoração é a informação.

1. **Ícone**: chip `mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain` + `Check h-5 w-5` (eco exato do "Fila limpa" da Home).
2. **Título**: `mt-4 font-semibold` → **`Sessão concluída`**.
3. **Placar** — mini-tiles no vocabulário dos stat tiles da Home: `mx-auto mt-4 grid max-w-[280px] grid-cols-2 gap-2.5`; cada tile `rounded-lg border border-border px-4 py-2.5 text-left`:
   - Linha 1: ícone `h-4 w-4` + valor `font-mono text-xl font-semibold tabular-nums`; linha 2: label `mt-0.5 text-[11px] text-muted-foreground`.
   - **Acertos**: `Check text-domain` + `{hits}` + label `acertos` (`acerto` se 1).
   - **Erros**: `RotateCcw text-recall` + `{misses}` + label `erros` (`erro` se 1). **Decisão: erros em `recall`, não destructive** — mesmo racional do botão: erro = item reagendado pra amanhã, não falha; destructive fica reservado a ações irreversíveis (padrão da Home). O ícone de retorno reforça a leitura.
4. **Linha de método**: `mt-3 text-sm text-muted-foreground` —
   - `misses > 0`: **`Erros voltam amanhã — é assim que fixa.`**
   - `misses === 0`: **`Tudo subiu de caixa — os intervalos aumentam.`**
5. **Ações**: `mt-5 flex flex-wrap items-center justify-center gap-2.5`, ambas quietas `h-9 rounded-lg border border-border bg-card px-3.5 text-sm font-medium hover:bg-accent ${FOCUS}`:
   - **`Voltar aos temas`** → `navigate("/")` (primeira da ordem: sessão acabou, o método diz "vai viver" — não convida a grind).
   - **`Ver fila`** → `refetch()` (comportamento atual; se nada novo venceu, cai no estado vazio).

---

## 6. Estado vazio (zero due)

Mesma linguagem do empty da Home (borda tracejada = "nada aqui"): `mt-5 rounded-xl border border-dashed border-border px-6 py-14 text-center`. Cabeçalho da sessão some (sem barra/contador/toggle — não há sessão).

1. Chip `mx-auto grid h-10 w-10 place-items-center rounded-xl bg-domain/12 text-domain` + `Check h-5 w-5`.
2. Título `mt-4 font-semibold` → **`Fila limpa`** (eco literal do card da Home — mesmo estado, mesmas palavras).
3. Sub `mx-auto mt-1 max-w-sm text-sm text-muted-foreground` → **`Nada pra revisar agora. As tasks concluídas voltam no tempo certo — é o espaçamento trabalhando.`**
4. CTA quieto `mt-5`: `h-9 rounded-lg border border-border bg-card px-3.5 text-sm font-medium hover:bg-accent ${FOCUS}` → **`Continuar estudando`** → `navigate("/")` (a Home já tem o card "Continuar" apontando pra task certa — não duplicar essa inteligência aqui).
5. Eco da identidade `mt-6 font-mono text-[11px] text-muted-foreground/70`, **gerado do `ladder` real da API**: `revisa em 1d · 2d · 3d · 4d · 7d · 15d · 21d · 30d` (`ladder.map(d => d + "d").join(" · ")`).

**Decisões (o que NÃO mostrar):** próxima revisão futura exigiria endpoint novo (não-objetivo); streak aqui duplicaria a zona Consistência da Home e, num dia sem ação ainda, lê como "streak em risco" — ansiedade grátis. O vazio tem um trabalho: confirmar que o sistema está cuidando do calendário e devolver a pessoa pro estudo.

---

## 7. Microcopy (pt-BR)

| Onde | Texto |
|---|---|
| `h1` (sr-only) | `Revisar hoje` |
| Eyebrow | `revisão de hoje` |
| Contador | `{n}/{total}` (mono tabular) |
| Toggle | `intercalar` · title `misturar os temas na sessão — fixa mais (reinicia a sessão)` |
| Contexto | `teoria` / `prática` · `{trackTitle} · {epic}` |
| Escada (title/aria) | `caixa {x} de 8 · acertou → caixa {x+1} (revisa em {n}d) · errou → caixa 1 (amanhã)` · topo: `… acertou → dominada (sai da fila) …` |
| Slot oculto | `responda de cabeça — depois revela` |
| Slot revelado | eyebrow `resposta` |
| Botões | `Revelar resposta` · `Errei` · `Acertei` · kbds `espaço` / `1` / `2` |
| Titles dos botões | Errei: `volta pra caixa 1 — revisa amanhã` · Acertei: `sobe pra caixa {x+1} — revisa em {n}d` / `dominada — sai da fila` |
| Hint desktop | `espaço revela · 1 errei · 2 acertei` |
| Fim — título | `Sessão concluída` |
| Fim — tiles | `{n}` `acertos`/`acerto` · `{n}` `erros`/`erro` |
| Fim — método | `Erros voltam amanhã — é assim que fixa.` · sem erros: `Tudo subiu de caixa — os intervalos aumentam.` |
| Fim — ações | `Voltar aos temas` · `Ver fila` |
| Vazio | `Fila limpa` · `Nada pra revisar agora. As tasks concluídas voltam no tempo certo — é o espaçamento trabalhando.` · `Continuar estudando` · `revisa em 1d · 2d · 3d · 4d · 7d · 15d · 21d · 30d` |
| Live region (sr-only) | `acerto registrado — {n} de {total}` / `erro registrado, volta amanhã — {n} de {total}` · fim: `sessão concluída — {hits} acertos, {misses} erros` |
| Erro de API | `erro: {mensagem}` |

Tom (herdado da Home): minúsculas em metadados/subs, **sem exclamação, sem emoji** (saem o `🎉` e o `PartyPopper` atuais), sem "parabéns!".

---

## 8. Acessibilidade + atalhos

- **Atalhos intocados** (espaço/Enter revela · 1 errei · 2 acertei, listener global com guarda de INPUT/TEXTAREA — manter exatamente como está). Os kbd chips são `aria-hidden` e só ≥`sm`.
- **Live region**: um `div` `sr-only` com `aria-live="polite"` atualizado a cada avaliação e no fim (textos na tabela §7). É o feedback não-visual do resultado — a UI visual pula direto pro próximo card.
- **Foco**:
  - Ao revelar → foco programático no slot da resposta (`tabIndex={-1}`), pra leitor de tela ler a resposta antes de alcançar Errei/Acertei no Tab.
  - Ao avaliar → foco no botão **Revelar** do próximo card (mesmo slot do DOM); teclado nunca fica órfão.
  - Ao terminar → foco no título "Sessão concluída" (`tabIndex={-1}` no `p`/`h2`).
- **Barra**: `role="progressbar"` + `aria-valuemin/max/now` + `aria-label="progresso da sessão"`.
- **Toggle**: `aria-pressed`; **Escada**: `role="img"` + `aria-label` (segmentos decorativos, sem 8 tab-stops).
- **Alvos de toque**: dock h-12 (48px) nos 3 botões; gap-2.5 entre Errei/Acertei evita toque fantasma; dock acima da safe-area (`pb-[max(env(safe-area-inset-bottom),0.75rem)]`).
- **Contraste**: já garantido pelos tokens da Home (recall/domain AA em texto 11px+; `domain` sólido + `domain-foreground` AA nos dois temas). Nenhuma cor nova.
- **Motion**: transições só de opacidade/width com `motion-safe:` — em `prefers-reduced-motion` tudo aparece instantâneo, sem quebra.
- Foco visível: todo interativo com `FOCUS` (constante do App).

---

## 9. Não-objetivos (segurar o dev)

1. **Lógica intocada**: fila congelada na montagem, algoritmo de interleave (round-robin), persistência `fx-review-mix`, reset da sessão ao alternar o toggle, `taskReview`, evento `fx-review-changed`, mapeamento de teclas. Zero mudança de comportamento — só apresentação.
2. **Zero mudança de API** — inclusive não criar endpoint de "próxima revisão futura" pro estado vazio.
3. **Sem gestos de swipe** (Tinder-like), sem flip 3D de card, sem confete/sons/haptics, sem auto-avanço por timer.
4. **Sem undo** de avaliação (mudaria fluxo/API).
5. **Sem placar parcial** numérico durante a sessão (decisão §3).
6. **Sem tokens novos, sem webfonts**: só o que existe em `index.css`. Âmbar segue **nunca sólido**; a emenda §1.1 libera sólido apenas pro `domain` no Acertei.
7. **Não tocar** em `App.tsx` (header/badge/nav) nem restilizar outras telas.
8. **Sem limite/seletor de tamanho de sessão** ("revisar só 10") — v1 revisa a fila inteira.

---

## 10. Checklist de aceite

- [ ] **Revelar não move nada**: em 390×844, com resposta de 12+ linhas, nenhum elemento acima da pergunta se desloca ao revelar; Errei/Acertei permanecem visíveis (dock pinado) e o dock mantém a mesma altura nos dois estados.
- [ ] **Polegar**: os 3 botões do dock têm 48px de altura (h-12), Errei/Acertei lado a lado com gap-2.5, dock respeita a safe-area do iPhone.
- [ ] **Escada Leitner**: `box=2` renderiza 3 segmentos âmbar (o 3º mais forte) + `3/8` mono; title correto em box 0, box intermediário e box 7 (`acertou → dominada`).
- [ ] **Zero vermelho na sessão**: Errei em âmbar tint com `RotateCcw`; `destructive` aparece só no estado de erro de API.
- [ ] **Acertei** é `bg-domain` sólido com `text-domain-foreground`, legível (AA) nos temas claro e escuro; nenhum botão sólido âmbar existe na tela.
- [ ] **Nada regrediu**: espaço/1/2 funcionam, toggle intercalar persiste e reinicia a sessão como hoje, `fx-review-changed` segue disparando (badge do header cai a cada avaliação), kbd hints invisíveis em `<sm`.
- [ ] **Tom**: nenhum emoji/exclamação em nenhum estado (sessão, fim, vazio); números em mono `tabular-nums` (contador não muda de largura de `1/12` a `12/12`).
- [ ] **A11y**: live region anuncia cada resultado e o fim; após avaliar, foco cai no Revelar do próximo card; barra expõe `role="progressbar"`.
