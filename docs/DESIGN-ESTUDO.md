# DESIGN-ESTUDO.md — Spec da tela de Estudo (`/t/:id`)

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/screens/Track.tsx`**. Nenhuma mudança em tokens (`index.css`), API, rotas ou shell.
> Contexto: a Track foi construída **antes** do redesign (DESIGN-HOME/REVISAR/SHELL-MOBILE) — ainda fala o dialeto antigo (`emerald-500`, `amber-500`, `blue-400`, `red-400`, emoji 💬, labels sem mono). O dono gosta bastante da tela; a reclamação concreta é **"todas as tasks vêm abertas"** (epics e stories nascem com `useState(true)` e a tela vira um paredão).
> Referências: DESIGN-HOME §2 (tokens — a lei visual), `Home.tsx` e `Review.tsx` (vocabulário implementado), DESIGN-SHELL-MOBILE (a tela convive com a bottom tab bar em `<md`).

---

## 1. Direção

**Refino conservador, não reinvenção.** Preserva-se tudo: a estrutura Epic→Story→Task, o header do tema (renomear, data da prova, meta diária), o loop de estudo do TaskDetail (objetivo → passos/dica/exemplo → questão-modelo com recall forçado → anotações), o TaskEditor e o AppendBlock — nenhuma seção muda de ordem, nenhuma feature sai. Corrige-se três coisas: (a) **defaults de expansão** — a tela abre escaneável e aponta pra onde o estudo parou, em vez de despejar tudo; (b) **coerência de tokens** — zero cor hardcoded, a tela passa a falar `domain`/`recall`/`primary`/`destructive` como Home e Revisar; (c) **micro-hierarquia** — eyebrows mono, badges na família das pills da Home, o slot de resposta igual ao do player do Revisar.

---

## 2. Política de expansão (a dor do dono)

### 2.1 Decisão: retomada inteligente, sem persistência

**Regra:** ao abrir `/t/:id`, nasce aberto **apenas o caminho até a primeira task pendente** (primeira task com `done === false` na ordem do documento): o epic que a contém e a story que a contém. Todo o resto nasce fechado. Tasks **sempre** nascem fechadas (comportamento atual do `TaskRow`, mantém).

| Nível | Default | Racional |
|---|---|---|
| **Epic** | fechado; **aberto** só o que contém a 1ª task pendente | o header colapsado já informa (id, título, goal, `done/total`, barra) — colapsado ≠ cego |
| **Story** | fechado; **aberto** só a que contém a 1ª task pendente | idem: header mostra `done/total` |
| **Task** | sempre fechado | abrir é 1 clique; o detalhe tem recall forçado — não deve vazar em massa |

**Casos de borda:**
- **Tema 100% concluído** → tudo fechado. A tela vira um sumário de barras cheias — é o estado certo pra quem volta só pra revisar (e revisão mora no `/revisar`).
- **Tema zerado** → primeiro epic + primeira story abertos (a regra geral já cobre: a 1ª pendente é a 1ª task).
- **Epic com goal longo**: o goal continua visível no header colapsado (é o que torna o colapso barato).

### 2.2 Implementação exata

- `EpicCard` e `StoryBlock` ganham prop `defaultOpen: boolean`; internamente `useState(defaultOpen)` (não controlado — o usuário manda depois do mount).
- No `Track`, computar uma vez por render:
  ```ts
  const firstPending = data.epics.flatMap((e) => e.stories.flatMap((s) => s.tasks.map((t) => ({ e: e.id, s: s.id, t })))).find((x) => !x.t.done);
  ```
  `EpicCard defaultOpen={e.id === firstPending?.e}` · `StoryBlock defaultOpen={s.id === firstPending?.s}`.
- As `key`s continuam sendo os ids (já são) — `refetch` após marcar done **não** re-colapsa nada (estado sobrevive porque o componente não remonta). O default só vale na entrada da tela. É o comportamento desejado: marcar a última task de uma story não fecha a tela na sua cara.

### 2.3 Persistir expansão entre visitas? **Não.**

Decidido contra `usePersistentState` por tema: (1) o default inteligente **recomputa** a cada visita e está sempre certo — o epic que você deixou aberto anteontem é informação velha, o que importa é onde o estudo está *hoje*; (2) persistir exigiria um mapa `{trackId: {epicId: bool, storyId: bool}}` com limpeza em remoção de task/epic e conflito com o default — complexidade real pra ganho negativo. O único estado persistido do app segue sendo o `fx-review-mix` do Revisar.

---

## 3. Coerência de tokens — mapa de substituição (item por item)

| # | Onde (código atual) | De | Para |
|---|---|---|---|
| 1 | `Bar` — fill da barra de progresso (tema, epic) | `bg-emerald-500` | `bg-domain` (lei do §2.1 da Home: barra de conclusão = esmeralda token) |
| 2 | `DoneBox` marcado | `border-emerald-500 bg-emerald-500 text-white` | `border-domain bg-domain text-domain-foreground` |
| 3 | `TaskDetail` — box "esperado" (prática) | `border-emerald-500/30 bg-emerald-500/5` + `text-emerald-500` | `border-domain/25 bg-domain/5` + `text-domain` (mesma família do slot de resposta do player) |
| 4 | `TaskDetail` — seta `→` da resposta | `text-emerald-500` | `text-domain` |
| 5 | `TaskRow` — ícone de prática | `Code2 text-blue-400` | `FlaskConical h-3.5 w-3.5 text-muted-foreground` — **o azul sai do app**. Prática usa o mesmo ícone do Revisar (`TypeTag`), e tipo é metadado, não estado: sem cor própria, `title="prática"` |
| 6 | `TaskRow` — "✓ dominada" | `text-emerald-500` + caractere ✓ | `GraduationCap h-3.5 w-3.5 shrink-0 text-domain` icon-only, `title="dominada"` (vocabulário da linha de badges da Home; texto sai — a linha respira) |
| 7 | `TaskRow` — "revisar" | `text-amber-500` texto solto | pill da Home: `inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full bg-recall/12 px-1.5 text-[10px] font-medium text-recall` com `RotateCcw h-3 w-3`, texto `revisar` em `hidden sm:inline`, `title="pra revisar hoje"`. Âmbar **nunca sólido** (lei) |
| 8 | `TaskRow` — contador de comentários | `💬{n}` (emoji) | `MessageSquare h-3.5 w-3.5 text-muted-foreground` + `font-mono text-[11px] tabular-nums text-muted-foreground` `{n}` — o tom do app não tem emoji |
| 9 | Header do tema — ícone `Target` | `text-emerald-500` | `text-primary` — identidade do tema é marca, não domínio; esmeralda fica reservada pra conclusão/domínio |
| 10 | Header — linha "N dominadas" (`GraduationCap`) | `text-emerald-500` | `text-domain` |
| 11 | Header — "N pra revisar hoje" | `text-amber-500` | `text-recall` |
| 12 | `Comments` — excluir comentário | `hover:bg-red-500/10 hover:text-red-400` | `hover:bg-destructive/10 hover:text-destructive` |
| 13 | `TaskEditor` — "remover task" | `border-red-500/40 text-red-400 hover:bg-red-500/10` | `border-destructive/40 text-destructive hover:bg-destructive/10` |
| 14 | `TargetControl` — "remover" (data) | `text-red-400` | `text-destructive` |
| 15 | `Section`/`Fld` — labels | `text-[11px] font-medium tracking-wide uppercase` | eyebrow padrão (§2.2 da Home): `font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground` — importar/duplicar a constante `EYEBROW` já usada em Home/Review |
| 16 | Contadores `done/total`, `{task.id}`, `%` | `font-mono` já ok | garantir `tabular-nums` em todos (falta no id da task e nos `done/total` de story/epic) |
| 17 | Foco | ausente na maioria dos botões | aplicar `FOCUS` (exportado do `App`) em: DoneBox, linha da task, header de story/epic, lápis, revelar, comentar, excluir, AppendBlock, back |

Depois disso, `grep -nE "emerald|amber|blue-4|red-4|red-5|💬" Track.tsx` tem que voltar vazio.

---

## 4. Micro-refinos (cirúrgicos, sem re-layout)

1. **Header do tema**: `Card p-4` mantém. Título mantém `text-lg font-semibold`. A frase "Dominar ≠ concluir…" **só renderiza enquanto `data.mastery === 0`** — é copy de onboarding; depois da primeira dominada vira ruído. Estilo dela: `text-[11px] text-muted-foreground/70` (hoje `text-muted-foreground`, pesa demais).
2. **Linha de stats do header** (concluídas / dominadas / revisar): números em `font-mono tabular-nums`; "N pra revisar hoje" vira link discreto pro `/revisar` (`underline-offset-2 hover:underline text-recall`) — a fila é acionável, não decorativa.
3. **Story header — sinal de revisão colapsado**: se a story tem alguma task com `review?.due`, mostrar antes do `done/total` um `RotateCcw h-3 w-3 text-recall` + `font-mono text-[10px] tabular-nums text-recall` `{n}` (`title="pra revisar hoje"`). Sem isso, a política de colapso esconderia o estado mais acionável da tela.
4. **Densidade da TaskRow**: mantém `p-2.5`; o botão-título ganha `min-h-[28px]` implícito atual — nada muda de tamanho. Única mudança: chevron sempre `text-muted-foreground/70` (hoje compete com os badges).
5. **Botão editar (lápis)**: mantém a regra "só aparece com a task aberta" (boa — edição é rara). Ganha `FOCUS` e `aria-label="editar task"`.
6. **AppendBlock**: mantém dashed; o botão de abrir desce pra voz da lixeira da Home: `text-xs text-muted-foreground hover:text-foreground` (hoje `text-sm` — pesa mais que "Seus temas"). Ícone `PlusCircle h-3.5 w-3.5`.
7. **Back "← temas"**: mantém (no mobile a aba Temas duplica, mas o back preserva o gesto de leitura no desktop); só ganha `FOCUS`.
8. **Aninhamento no mobile**: story interna `px-1.5 pb-1.5 sm:px-2 sm:pb-2` e epic interna mantém `p-2 sm:p-3` — recupera ~8px de largura útil por nível em 390px (ver §6).

Nada além disso: sem sticky header de epic, sem drag, sem colunas, sem contagem de tempo.

---

## 5. Estados

### 5.1 Na TaskRow (fechada) — sinalizar sem poluir

Ordem fixa na linha, depois do título: **dominada** (ícone domain, item 3.6) → **revisar** (pill recall, item 3.7) → **comentários** (ícone+n, item 3.8) → chevron. `done` mantém o par atual `line-through text-muted-foreground` no título + DoneBox preenchido (`bg-domain`). Uma task pode ser done+revisar ao mesmo tempo — os dois sinais convivem (é o estado real: concluída e vencida na escada).

### 5.2 Task aberta — o recall forçado coerente com o player

O bloco da questão-modelo passa a espelhar o vocabulário do Revisar (mesmos materiais, escala menor):

- **Container**: `rounded-lg border border-border bg-background p-3` (mantém posição e ordem das seções).
- **Pergunta**: `text-sm font-medium` (atual, mantém).
- **Não revelado**: no lugar do botão solto, o slot oculto do player em miniatura — `mt-2 grid min-h-[72px] place-items-center rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5`, dentro: `EyeOff h-4 w-4 text-muted-foreground/60` + `text-xs text-muted-foreground/70` "responda de cabeça — depois revela" + botão `inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium hover:bg-accent` com `Eye h-3.5 w-3.5` — label **"tentei — revelar"** (teoria e prática; o que vem junto está no title: `title="revela resposta e pontos-chave"` / `"revela a resposta"`).
- **Revelado**: slot do player — `mt-2 rounded-lg border border-domain/25 bg-domain/5 p-3` com eyebrow mono `font-mono text-[10px] uppercase tracking-[0.14em] text-domain` **"resposta"**; dentro, na ordem atual: pontos-chave (teoria), "esperado" (prática, item 3.3) e a resposta. A seta `→` sai — o container tintado já diz "isto é a resposta".
- `reveal` continua `useState(false)` por task aberta, reset ao fechar (atual — recall se repete a cada visita, é feature).

### 5.3 Loading / erro

Mantém skeletons e Card de erro atuais (já no padrão).

---

## 6. Mobile (`<md`, convive com a bottom tab bar)

- **Clearance**: o `main` do Shell já compensa a bar (`pb-[calc(5rem+env(safe-area-inset-bottom))]` fora de `/revisar`) — nada a fazer na tela; **não** adicionar padding próprio.
- **O que aperta hoje**: três níveis de borda aninhada (epic > story > task) comem ~24px de cada lado em 390px, e a linha da task (id + ícone + título + 2 badges + contador + chevron) trunca cedo. Ajustes: item 4.8 (padding interno), item 3.7 (label "revisar" some em `<sm`, fica o ícone tintado), item 3.6 (dominada já é icon-only).
- **Header do tema**: a linha título+lápis+contador já quebra bem (`truncate` + `shrink-0`); o `TargetControl` usa `flex-wrap` — mantém.
- **TaskEditor**: os grids `sm:grid-cols-2` já empilham — mantém.
- **Toque**: DoneBox 28px é o menor alvo da tela; aceito (está dentro de uma linha de 44px+ e afastado do botão-título). Não crescer — mudaria a densidade que o dono gosta.

---

## 7. Microcopy (só o que muda)

| Onde | De | Para |
|---|---|---|
| Seção da questão | "Responda de cabeça — depois revele" | **"Questão-modelo"** (eyebrow); o método vai pro slot oculto: "responda de cabeça — depois revela" (idêntico ao player) |
| Botão revelar | "tentei — revelar resposta e pontos-chave" / "…resposta" | **"tentei — revelar"** (o resto vira `title`) |
| Seção de anotações | "Anotações / Generalização" | **"Anotações"** (o placeholder do textarea já ensina: "tua resposta / o que entendeu / generalização…" — mantém) |
| Badge dominada | "✓ dominada" | sem texto; `title="dominada"` |
| Contador de comentários | `💬3` | ícone `MessageSquare` + `3` |

Todo o resto (Objetivo, Passos, Dica, Exemplo, esperado:, copy do TargetControl, do AppendBlock, confirms) fica como está. Tom: minúsculas em metadados, sem exclamação, sem emoji.

---

## 8. Não-objetivos + checklist de aceite

### Não-objetivos (segurar o dev)

1. **Não mexer em lógica nem API**: `getTrack`, `taskDone`, `editTask`, `appendTrack`, comments — intocados. Zero mudança de shape.
2. **Não reordenar as seções do TaskDetail** (objetivo → passos/dica/exemplo → questão → anotações) nem as do header do tema.
3. **Não reescrever TaskEditor nem AppendBlock** — só as classes listadas (§3.13, §4.6).
4. **Sem persistência de expansão** (decisão §2.3), sem "expandir tudo/recolher tudo", sem animação de collapse (corte seco, como o resto do app).
5. **Sem cores novas**: violeta/âmbar/esmeralda/destructive. O azul da prática **morre** (§3.5), não ganha token.
6. **Sem tocar** `App.tsx`, `index.css`, `Review.tsx`, `Home.tsx`.
7. **Sem virtualização/paginação** de epics — a política de colapso já resolve o paredão.

### Checklist de aceite

- [ ] **Abrir `/t/:id` não vem tudo expandido**: só o epic e a story da primeira task pendente nascem abertos; tasks todas fechadas; tema 100% concluído abre tudo colapsado.
- [ ] Marcar uma task como done (refetch) **não** colapsa nem expande nada que o usuário arrumou na sessão.
- [ ] `grep -nE "emerald|amber|blue-4|red-4|red-5|💬" web/src/screens/Track.tsx` → **zero resultados**; barras `bg-domain`, revisar `recall` tint (nunca sólido), destrutivos `destructive`.
- [ ] Task revelada mostra o slot `border-domain/25 bg-domain/5` com eyebrow mono "resposta" — lado a lado com o player do Revisar, é visivelmente a mesma linguagem.
- [ ] Story colapsada com tasks vencidas mostra o contador âmbar de revisão no header.
- [ ] Labels de seção (Objetivo, Questão-modelo, Anotações, campos do editor) usam o eyebrow mono padrão; todo contador numérico é mono `tabular-nums`.
- [ ] 390px: linha da task não estoura (label "revisar" oculto, dominada icon-only), último epic rola pra cima da tab bar, nada coberto.
- [ ] Todas as funcionalidades respondem como antes: renomear, data da prova, done, editar, remover task, comentar/excluir comentário, anexar epics, revelar por task.
