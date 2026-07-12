# DESIGN-NOVO-TEMA.md — Spec da tela /novo (criar tema)

> Última tela do UI pass. Escopo: `web/src/screens/NewTheme.tsx` apenas. Herda os tokens de `DESIGN-HOME.md` §2 (violeta/âmbar/esmeralda, mono como face de dados, eyebrows) — **zero classes `emerald-*`/`red-400` sobrevivem**.
> Lei de copy: `PRICING.md` via `DESIGN-PLANOS.md` — nunca "ilimitado" perto de geração, zero progresso/contador fake. API e lógica de import/geração **não mudam** (endpoints, `getConfig`, validação, mensagens do server ficam como estão).

---

## 1. Direção

A tela é um **criador**: um form protagonista no topo e, logo abaixo dele, o caminho de criação certo pro plano da pessoa. Quando a geração direta existe (pro, ou free com degustação), ela é o caminho dominante — 1 clique, CTA único e sólido — e o fluxo manual recolhe pra um disclosure discreto. Quando não existe, o fluxo manual assume como caminho principal, em 3 passos numerados no padrão novo (eyebrows mono, não círculos coloridos). A espera de 25–60s da geração é tratada como estado de primeira classe: cronômetro real, expectativa honesta, nada de barra inventada.

---

## 2. Layout

**Container:** `mx-auto w-full max-w-2xl` (672px — tela de form respira melhor mais estreita que o shell `max-w-4xl`; precedente: /pro usa `max-w-3xl`). Mobile: largura total do shell, convive com a bottom tab bar sem aba ativa (ok por spec do shell).

**Zonas** (de cima pra baixo, `space-y-4`; header com `space-y-1`):

```
1. HEADER    → h1 "Novo tema" + sub 1 linha
2. BANNER    → só plano free (§6)
3. FORM      → card único: campos + zona de ação (§3–§4)
4. CRIAÇÃO   → varia por capacidade (abaixo)
```

**Capacidade** — derivar uma única flag na tela, `canGenerate = cfg.genEnabled && (cfg.plan === "pro" || cfg.gen.used < cfg.gen.limit)` (é o `genEnabled` local atual, renomeado), e um `atThemeLimit = cfg.plan === "free" && cfg.themes >= cfg.freeLimit`. Quatro casos, duas arquiteturas:

| Caso | Arquitetura da zona 4 |
|---|---|
| **pro + genEnabled** | **modo direto**: CTA "Gerar tema" dentro do card do form (§4) · fluxo manual vira disclosure tracejado colapsado (§5.1) |
| **free com degustação** (gen.used < gen.limit) | **modo direto** igual, com microline de degustação sob o CTA (§4) e o mesmo disclosure manual |
| **free com degustação usada** | **modo manual**: sem CTA de gerar; o form é o "passo 01" e os passos 02/03 são a página (§5.2) · 1 linha quieta sobre a degustação usada (§7) |
| **sem GEMINI_API_KEY** (genEnabled=false, qualquer plano) | **modo manual** puro, sem linha de degustação — a geração direta simplesmente não é mencionada |

Enquanto `cfg === null` (config carregando): renderizar header + form; a zona de ação mostra `Skeleton h-11 rounded-lg`. Não chutar modo antes do config (evita CTA que troca na cara do usuário).

**Header:** `h1` `text-lg font-semibold` → **`Novo tema`**; sub `text-sm text-muted-foreground` → **`Descreva o assunto — a Fixa monta a trilha com revisão espaçada.`** (eco do empty state da Home). Sem eyebrow de página; os eyebrows moram nos cards de passo.

---

## 3. Form (campos)

Card único `Card p-4 space-y-3` (rounded-xl herdado). Em **modo manual**, o header do card ganha o eyebrow de passo: linha `flex items-baseline gap-2` com eyebrow `font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-muted-foreground` → **`passo 01`** + título `text-sm font-semibold` → **`Configure o tema`**. Em **modo direto**, sem numeração — o card não é um "passo", é o criador: só o título `text-sm font-semibold` → **`Configure o tema`** (opcional omitir; decidir na implementação — se o card abre a página logo sob o h1, o título pode sair pra não duplicar. Decisão: **omitir em modo direto**, manter em modo manual pela paridade dos passos).

- **Labels**: padrão do editor do Track (`Fld`): `<label className="block space-y-1">` com `<span>` no EYEBROW (`font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground`). Labels: `tema` · `nível` · `abordagem` · `profundidade` (minúsculas — o eyebrow já é uppercase via CSS).
- **Input do tema** (protagonista): `h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary ${FOCUS}`. Placeholder com exemplos que mostram o alcance (certificação, teoria, skill): **`ex.: AWS Solutions Architect, teoria dos grafos, inglês pra entrevistas`**. `autoFocus`.
- **Selects** (nível/abordagem/profundidade): grid `grid grid-cols-1 gap-2 sm:grid-cols-3`; select nativo `h-10 w-full appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm outline-none focus:border-primary ${FOCUS}` com `ChevronDown h-4 w-4 text-muted-foreground` posicionado à direita (`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2`) — wrapper `relative`. Options mantêm os valores/labels atuais (`LEVELS`, `MODES`, `DEPTHS`).
- Durante `aiBusy`: input e selects `disabled` + `opacity-60` (a config não pode mudar no meio da geração).

---

## 4. Ação "Gerar tema" (modo direto)

Vive **dentro do card do form**, após os selects, separada por `pt-1`.

**CTA (idle):** `inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS}` + `Wand2 h-4 w-4` → **`Gerar tema`**. Full-width = anatomia de CTA do card do /pro; é o único botão sólido da tela em modo direto. `disabled` quando `!theme.trim() || aiBusy || atThemeLimit`.

**Contador de uso (microline sob o CTA):** `mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground`:
- **pro**: **`{gen.used}/{gen.limit} gerações no mês · máx. {gen.dayLimit}/dia`** (ex.: `4/30 gerações no mês · máx. 10/dia`)
- **free (degustação disponível)**: **`sua degustação: 1 geração por IA — depois, o fluxo manual segue grátis`**

**Estado de espera (25–60s) — honesto, sem progresso inventado:**
- CTA vira `disabled` com `Loader2 h-4 w-4 animate-spin` → **`gerando a trilha…`**
- A microline de uso é substituída por um bloco de espera `mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-center`:
  - Linha 1: cronômetro **real** (`setInterval` de 1s, UI-only) — `font-mono text-[13px] tabular-nums text-foreground` → **`{s}s`**
  - Linha 2: `mt-0.5 text-xs text-muted-foreground` → **`costuma levar de 30 s a 1 min — o modelo escreve a trilha inteira de uma vez. Não feche a aba.`**
- Nada de porcentagem, nada de etapas fake ("analisando… estruturando…"), nada de barra: o único número exibido é o tempo decorrido, que é verdade. Sucesso navega pra `/t/:id` (comportamento atual).

**Erro da geração** (402/429/502/timeout — as mensagens do server já explicam o que houve e citam o fallback): substituir o `<p>` vermelho atual por bloco `mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive` com a mensagem do server e, abaixo dela, uma linha de ações `mt-2 flex flex-wrap gap-3 text-xs`:
- **`tentar de novo`** — botão-texto `font-medium underline-offset-2 hover:underline ${FOCUS}` (rechama `genDirect`)
- **`usar o fluxo manual`** — mesmo estilo; abre o disclosure do §5.1 e dá `scrollIntoView` nele. O fallback manual é sempre visível no erro — é o contrato do produto.

**No limite de temas** (`atThemeLimit`, free 2/2): CTA `disabled`; a explicação mora no banner (§6), não duplicar aqui.

---

## 5. Fluxo manual (3 passos)

### 5.1 Em modo direto — disclosure colapsado

Abaixo do card do form, o padrão do `AppendBlock` do Track (linha tracejada, quieta):

`<div className="rounded-lg border border-dashed border-border">` com botão-header `flex w-full items-center gap-2 rounded-lg p-3 text-left text-xs text-muted-foreground hover:text-foreground ${FOCUS}` + `ClipboardCopy h-3.5 w-3.5` + **`Fluxo manual — gere no seu próprio chat (grátis, sem limite)`** + `ChevronDown` (rotaciona `-rotate-90` fechado).

Aberto, revela dentro do container (`space-y-3 px-3 pb-3`): o botão **`Gerar prompt`** (secundário: `inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50 ${FOCUS}` + `Sparkles h-4 w-4`; `disabled` sem tema ou `genBusy`, spinner `Loader2` quando busy) e, conforme o estado, os passos 02 e 03 do §5.2 (sem renumerar: aqui os cards mantêm os eyebrows `passo 02`/`passo 03` — o "passo 01" é o form lá de cima, e o botão Gerar prompt fecha ele).

### 5.2 Em modo manual — os passos são a página

Form = **passo 01** (§3). Depois dele:

**Ação do passo 01** (dentro do card do form, mesmo slot do §4): botão primário `h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground` + `Sparkles h-4 w-4` → **`Gerar prompt`** (é o CTA da tela nesse modo). Sob ele, `mt-2 text-center text-[11px] text-muted-foreground` → **`o prompt é colado no ChatGPT ou Gemini — a resposta volta pra cá no passo 03`**.

**Passo 02 — copiar o prompt** (`Card p-4 space-y-2`, só renderiza quando `prompt` existe; ao nascer, `scrollIntoView({ block: "nearest" })`):
- Header: eyebrow **`passo 02`** + título `text-sm font-semibold` → **`Copie e cole no seu chat`**
- Bloco do prompt: `textarea readOnly rows={6}` `w-full resize-y rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed outline-none` (fundo `muted/40` = bloco de dado, não campo editável)
- Botão copiar: `inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent ${FOCUS}` + `ClipboardCopy h-4 w-4` → **`copiar prompt`**; feedback 1,5s: ícone `Check h-4 w-4 text-domain` + **`copiado`** (sem exclamação; verde = domínio/conclusão, ok como tint de texto)
- Nota: `text-xs text-muted-foreground` → **`o modelo responde um JSON — copie a resposta inteira e cole no passo 03.`**

**Passo 03 — colar o JSON** (`Card p-4 space-y-2`, sempre visível no modo manual e no disclosure aberto):
- Header: eyebrow **`passo 03`** + título → **`Cole o JSON e importe`**
- Textarea: `rows={7}` mesma classe do passo 02 porém editável (`bg-background`, `focus:border-primary ${FOCUS}`), placeholder `{ "title": "...", "epics": [ ... ] }` em mono
- **Dica do link linkificado** (fica, reformulada e sempre visível): `text-[11px] text-muted-foreground` → **`dica: se o import acusar erro perto de um link, o chat transformou uma URL em markdown ao copiar — apague o trecho`** `<code className="rounded bg-muted px-1 font-mono">[...](...)</code>` **`e deixe o texto simples.`**
- **Erros de validação**: `rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive` com header `mb-1 font-medium` → **`não deu pra importar — ajuste ou peça pro modelo corrigir:`** e `ul list-inside list-disc space-y-0.5` com até **8** erros; se houver mais: linha final `font-mono text-[11px]` → **`+ {n} erros`** (12 itens era parede de texto; 8 + contagem resolve)
- Botão importar: primário `inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 ${FOCUS}` + `Upload h-4 w-4` → **`Importar tema`**; busy = spinner, label mantém. `disabled` quando `!json.trim() || busy || atThemeLimit`. Sucesso navega pra `/t/:id` (atual).

**Círculos numerados emerald morrem.** A numeração é tipográfica (eyebrow mono `passo 0N`), não um chip colorido — mesma gramática dos eyebrows de zona da Home.

---

## 6. Banner de plano (free)

Substitui o `<p>` atual. Renderiza só com `cfg?.plan === "free"`, entre o header e o form.

- **Normal** (`themes < freeLimit`): linha `flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2`:
  - contador `font-mono text-[11px] tabular-nums text-muted-foreground` → **`free · {themes}/{freeLimit} temas`**
  - separador flex (`flex-1`)
  - link **`ver planos`** → `/pro`: `rounded-sm text-xs text-primary underline-offset-2 hover:underline ${FOCUS}` (mesmo botão-texto quieto do `+ novo tema` da Home)
- **No limite** (`atThemeLimit`): mesma anatomia com tint âmbar (tint, nunca sólido — regra dos tokens): `border-recall/40 bg-recall/10`; contador `text-recall` → **`free · {freeLimit}/{freeLimit} temas — limite do plano`**; texto extra `text-xs text-recall` na linha de baixo (banner vira `space-y-0.5` com a 1ª linha em flex) → **`exclua um tema pra criar outro, ou veja o Pro.`**; link `ver planos` mantém.

Pro não tem banner — o uso da geração já aparece na microline do §4.

---

## 7. Microcopy consolidada (pt-BR)

| Onde | Texto |
|---|---|
| h1 / sub | `Novo tema` · `Descreva o assunto — a Fixa monta a trilha com revisão espaçada.` |
| Banner free | `free · {x}/{y} temas` · link `ver planos` · no limite: `free · 2/2 temas — limite do plano` + `exclua um tema pra criar outro, ou veja o Pro.` |
| Labels do form | `tema` · `nível` · `abordagem` · `profundidade` |
| Placeholder tema | `ex.: AWS Solutions Architect, teoria dos grafos, inglês pra entrevistas` |
| CTA direto | `Gerar tema` · busy `gerando a trilha…` |
| Microline pro | `{u}/{l} gerações no mês · máx. 10/dia` |
| Microline free | `sua degustação: 1 geração por IA — depois, o fluxo manual segue grátis` |
| Espera | `{s}s` · `costuma levar de 30 s a 1 min — o modelo escreve a trilha inteira de uma vez. Não feche a aba.` |
| Erro geração | mensagem do server, verbatim · ações `tentar de novo` · `usar o fluxo manual` |
| Degustação usada (modo manual, free) | linha quieta sob o header, `text-xs text-muted-foreground`: `sua geração de degustação já foi usada — o fluxo manual é grátis e sem limite. O Pro libera 30 por mês —` + link `ver planos` |
| Disclosure manual | `Fluxo manual — gere no seu próprio chat (grátis, sem limite)` |
| Passo 01 | eyebrow `passo 01` · `Configure o tema` · CTA `Gerar prompt` · micro `o prompt é colado no ChatGPT ou Gemini — a resposta volta pra cá no passo 03` |
| Passo 02 | eyebrow `passo 02` · `Copie e cole no seu chat` · botão `copiar prompt` → `copiado` · `o modelo responde um JSON — copie a resposta inteira e cole no passo 03.` |
| Passo 03 | eyebrow `passo 03` · `Cole o JSON e importe` · dica do link (§5.2, verbatim) · erros `não deu pra importar — ajuste ou peça pro modelo corrigir:` (+ `+ {n} erros`) · CTA `Importar tema` |

Tom: direto, sem exclamação, sem emoji, sem prometer o que não faz (a espera diz "costuma levar", não "leva"; a degustação diz o que acontece depois).

---

## 8. Não-objetivos + checklist

### Não-objetivos (segurar o dev)

1. **Zero mudança de API/lógica**: endpoints, validação de import, mensagens de erro do server, `getConfig`, limites — intocados. A tela só re-renderiza o que já existe.
2. **Sem wizard multi-tela**: /novo continua uma página só; os "passos" são cards na mesma rota.
3. **Sem progresso inventado**: nada de barra de %, etapas fake ou tempo estimado regressivo — só cronômetro real crescente + frase de expectativa.
4. **Sem streaming/polling** da geração (SSE é outra entrega); a espera é um estado do botão + bloco.
5. **Sem upsell além do especificado**: banner free + linha de degustação usada + link no erro do server. Nenhum card de Pro no meio do fluxo.
6. **Sem tokens/cores novas**: violeta/âmbar/esmeralda/destructive dos tokens; âmbar só como tint.

### Checklist de aceite

- [ ] **Zero emerald/cores hardcoded antigas**: grep em `NewTheme.tsx` não acha `emerald`, `red-400`, círculos numerados coloridos; erros usam `destructive`, sucesso usa `domain`, alerta de limite usa `recall` como tint.
- [ ] **Estado de espera comunica tempo honestamente**: cronômetro real em segundos + "costuma levar de 30 s a 1 min", form desabilitado, nenhum progresso fake; sucesso navega pro tema.
- [ ] Pro com gen: "Gerar tema" é o único CTA sólido visível no load; fluxo manual está colapsado no disclosure tracejado e abre com os passos 02/03 funcionais.
- [ ] Free com degustação: mesmo layout do pro + microline de degustação; free sem degustação e servidor sem GEMINI_API_KEY caem no modo manual com passos 01–03 numerados por eyebrow mono.
- [ ] Erro de geração mostra a mensagem do server + ações "tentar de novo" e "usar o fluxo manual" (que abre e rola até o disclosure).
- [ ] Import inválido lista até 8 erros + "+ n erros", com a dica do link linkificado visível; "copiar prompt" dá feedback "copiado" por 1,5s.
- [ ] Banner free mostra uso real `{x}/{y} temas` com link /pro; em 2/2 vira tint âmbar e os CTAs de criar ficam desabilitados.
- [ ] Foco visível (`FOCUS`) em input, selects, todos os botões, links e no header do disclosure; tela ok em 390px com a bottom tab bar (nenhuma aba ativa).
