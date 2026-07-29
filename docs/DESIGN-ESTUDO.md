# DESIGN-ESTUDO.md — Spec da tela de Estudo (`/t/:id`)

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/screens/Track.tsx`**. Nenhuma mudança em tokens (`index.css`), API, rotas ou shell.
> Contexto: a Track foi construída **antes** do redesign (DESIGN-HOME/REVISAR/SHELL-MOBILE) — ainda fala o dialeto antigo (`emerald-500`, `amber-500`, `blue-400`, `red-400`, emoji 💬, labels sem mono). O dono gosta bastante da tela; a reclamação concreta é **"todas as tasks vêm abertas"** (epics e stories nascem com `useState(true)` e a tela vira um paredão).
> Referências: DESIGN-HOME §2 (tokens — a lei visual), `Home.tsx` e `Review.tsx` (vocabulário implementado), DESIGN-SHELL-MOBILE (a tela convive com a bottom tab bar em `<md`).
> **29/07 — §9 acrescenta uma segunda auditoria** sobre a mesma tela já refinada por §1–8: enxugamento adicional (auto-scroll de retomada, acento no caminho pendente, header de epic mais leve, TargetControl colapsável, goal truncado, anotações sob demanda, hierarquia story/task, IDs mono ocultos no mobile). Mesmo escopo (`Track.tsx`), mesmas leis.

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

---

## 9. Enxugamento pós-auditoria (29/07)

> Segunda passada, depois que o dono aprovou os achados de uma auditoria de UX sobre a tela já refinada pelo §1–8. Objetivo: menos peso visual por padrão, sem perder nenhuma função. Mesmas leis: zero cor hardcoded, zero re-layout de seções, `FOCUS`/`EYEBROW` reaproveitados.

### 9.1 Auto-scroll até o ponto de retomada

**Decisão (29/07):** ao montar `Track`, se existe `firstPending`, rolar até a `TaskRow` da própria task pendente (não até o epic nem até o header da story) — é o alvo mais específico e o mesmo nível que já ganha `defaultOpen` (peek aberto). Só dispara **se o elemento nasce fora da viewport**; e só uma vez, no mount.

```tsx
// Track.tsx — dentro de Track(), depois de calcular firstPending
const pendingRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!firstPending) return; // tema 100% concluído: nada a fazer
  requestAnimationFrame(() => {
    const el = pendingRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fora = r.top < 0 || r.top > window.innerHeight - 80; // 80 ≈ folga da bottom tab bar mobile
    if (fora) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data?.id]); // roda de novo só se trocar de tema, não a cada refetch
```

`pendingRef` é passado como prop (`scrollTargetRef`) só até o `TaskRow` cujo `task.id === firstPending?.t.id`, que o aplica na `div` raiz da linha. `reduced()` não existe em `Track.tsx` ainda — duplicar a mesma linha que já vive local em `Licao.tsx:29` (`window.matchMedia("(prefers-reduced-motion: reduce)").matches`); o repo não tem um `lib` compartilhado pra isso, então repetir é o padrão já estabelecido. **Justificativa:** rolar até o epic deixaria o usuário sem saber *qual* story/task olhar dentro dele; rolar até a task é o mesmo princípio do `markerRef` do `Licao.tsx:258` (retomada de passo) — reusar o idioma que a Lição já valida. O guard de viewport evita o salto brusco em temas curtos onde a task pendente já nasce visível (mesmo raciocínio do `reduced()` já usado em `Licao.tsx`/`NewTheme.tsx`).

### 9.2 Acento visual no caminho pendente

**Decisão (29/07):** `border-l-2 border-l-primary` substituindo a borda esquerda default em três níveis — `EpicCard`, `StoryBlock` e a `TaskRow` da task pendente — quando `id === firstPending?.{e,s,t.id}`. Sem tint de fundo, sem badge extra: uma borda é o menor sinal que ainda salta num scan vertical (o olho lê bordas esquerdas em lista antes de ler texto) e não compete com o badge âmbar de revisão (`recall`) nem com o pill `stage+1/total` que a task em progresso já tem — os três sinais convivem sem empilhar cor. **Justificativa:** `primary` é o token de "marca/atividade" (`DESIGN-HOME §1`); usar tint de fundo (`bg-primary/5`) foi descartado por brigar visualmente com o já-existente `bg-primary/10` do badge "stage" na `TaskRow` (dois primary-fills na mesma linha lê como ruído, não como sinal).

```tsx
// EpicCard / StoryBlock — className condicional na raiz
className={cn("...", e.id === firstPendingEpicId && "border-l-2 border-l-primary")}
// TaskRow raiz
className={cn("rounded-lg border bg-card", task.id === firstPending?.t.id ? "border-l-2 border-l-primary border-border" : "border-border")}
```

### 9.3 Header do epic mais leve

**Decisão (29/07):** a `Bar p={epic.progress}` sai do `EpicCard` inteiramente — o `done/total` mono que já está na linha do título basta, e o header do tema (`Track.tsx:458`) já tem a barra "de verdade" (progresso do tema todo). Layout final da linha do epic, sem mudança de ordem dos elementos que sobram: `[check se completo] Epic {id} · título · done/total mono · chevron`, com o `goal` (se existir) numa segunda linha truncada (§9.5). **Justificativa:** duas barras (tema + cada epic aberto) empilhadas é a mesma informação em duas resoluções — a do tema já responde "quanto falta"; a do epic só repetia o gesto visual sem acrescentar leitura que o `done/total` não desse em texto.

### 9.4 TargetControl colapsa por padrão

**Decisão (29/07):** com `targetDate` setado e fora do modo edição, o estado default mostra **só o chip** `prova em N dias` — ele vira `<button>` clicável (`aria-expanded`) que revela, numa segunda linha, a meta diária (se houver) e o link "editar". Fecha de novo ao tocar de novo (toggle simples, sem persistência — mesmo padrão do heatmap colapsável em `DESIGN-HOME §4.d`).

```tsx
function TargetControl({ track, onChange }: ...) {
  const [expanded, setExpanded] = useState(false);
  // ...
  if (track.targetDate && !editing) {
    const dl = track.daysLeft ?? 0;
    return (
      <div className="mt-2 text-xs">
        <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}
          className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/15", FOCUS)}>
          <CalendarClock className="h-3.5 w-3.5" />{dl < 0 ? "prova já passou" : dl === 0 ? "prova é hoje" : `prova em ${dl} dia${dl === 1 ? "" : "s"}`}
        </button>
        {expanded && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {track.dailyGoal ? <span className="text-muted-foreground">meta ~{track.dailyGoal}/dia pra dominar a tempo</span> : null}
            <button onClick={() => setEditing(true)} className={cn("text-muted-foreground underline-offset-2 hover:underline", FOCUS)}>editar</button>
          </div>
        )}
      </div>
    );
  }
  // ... resto (modo edição / sem data) intocado
}
```

`?prova=1` (o convite da Home, `DESIGN-ENGAJAMENTO §3.d`) continua indo direto pro modo edição (`veioDoConvite` já seta `editing=true`), sem passar pelo colapsado — o convite quer o input visível na hora, não um chip pra clicar de novo. **Justificativa:** o dono pediu 1 linha por padrão; meta+editar são ação/leitura secundária (editar é raro — mesma lógica já aplicada ao lápis de `TaskRow` no §4.5) e cabem atrás de um toque sem esconder a informação que importa todo dia (dias até a prova).

### 9.5 `epic.goal` truncado no card fechado

**Decisão (29/07):** `truncate` (1 linha, com `…`) quando `!open`; `leading-relaxed` (completo, sem limite) quando `open`. Sem tooltip novo — o `title` nativo do navegador já cobre o hover em desktop, e no fechado a informação central do card (id, título, contagem) não muda.

```tsx
{epic.goal && <p className={cn("mt-1 text-xs text-muted-foreground", open ? "leading-relaxed" : "truncate")}>{epic.goal}</p>}
```

**Justificativa:** consistente com §9.3 (header mais leve) — um goal de duas ou três linhas competindo com título+progresso no card fechado é o mesmo "paredão" que o §2 já corrigiu pra epics/stories; truncar é reversível com 1 clique (abrir o card), não perde informação.

### 9.6 Anotações do peek: "+ nota" quando vazio

**Decisão (29/07):** dentro de `Comments`, se `list.length === 0` e o usuário ainda não tocou em "+ nota" nesta sessão de peek aberto, renderiza só um link de texto — sem textarea, sem botão de enviar:

```tsx
function Comments({ list, meName, onAdd, onDelete }: ...) {
  const [revealing, setRevealing] = useState(list.length > 0);
  // ...
  if (!list.length && !revealing) {
    return (
      <button onClick={() => setRevealing(true)} className={cn("text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline", FOCUS)}>
        + nota
      </button>
    );
  }
  // ... markup atual (lista + textarea + botão), inalterado
}
```

Com notas existentes, `Comments` nasce já revelado (`revealing` inicia `true`) e se comporta exatamente como hoje — nada muda pra quem já anota. **O CTA Estudar/Continuar sobe**: não é reordenação de seções (a ordem Objetivo → estado da lição/CTA → Anotações do `TaskPeek` já tinha o CTA acima das anotações, e continua) — é consequência direta de colapsar o textarea vazio: o peek comum (task sem nota ainda, a maioria) fica ~80px mais baixo, então o CTA passa a ser a última coisa visível antes do fim do card sem precisar rolar. **Justificativa:** um textarea vazio + botão desabilitado em toda task aberta é convite falso (a maioria das tasks nunca ganha nota) e empurra o CTA de estudo pra baixo do fold em telas menores — o link é affordance suficiente pra quem quer anotar.

### 9.7 Hierarquia tipográfica story vs. task

**Decisão (29/07):** peso, não tamanho — mantém as três linhas em `text-sm` (trocar tamanho quebraria o alinhamento vertical com os badges/ícones que já são `text-sm`/`text-xs` fixos), mas separa por peso: **Epic** `font-semibold` (já é `text-base`, maior nível) → **Story** sobe de `font-medium` pra **`font-semibold`** → **Task** continua sem peso (`font-normal`, herdado). O indent já existe (padding aninhado de `EpicCard`→`StoryBlock`→`TaskRow`, §4.8) e não precisa de reforço.

```tsx
// StoryBlock — título
<span className="min-w-0 flex-1 truncate text-sm font-semibold">{story.title}</span>
```

**Justificativa:** com epic e story ambos `font-semibold` e só a task neutra, o escaneamento vertical lê "isto é um agrupador" (epic, story) vs. "isto é um item" (task) sem precisar comparar tamanhos — troca de tamanho de fonte em 3 níveis já foi tentada mentalmente e descartada porque `text-sm`→`text-xs` na story deixaria o `id` mono (que já é `text-[11px]`) maior que o próprio título, invertendo a hierarquia real.

### 9.8 IDs mono ocultos no mobile

**Decisão (29/07):** `hidden sm:inline` no `<span>` do `story.id` (`StoryBlock`) e no `<span>` do `task.id` (`TaskRow`) — ambos IDs compostos (`1.2`, `1.2.3`) que servem pra debug/referência, não pra leitura do dia a dia. O rótulo `Epic {epic.id}` do `EpicCard` **fica visível sempre** — é um único dígito e funciona como label da seção ("Epic 1"), não como ID técnico solto.

```tsx
// StoryBlock
<span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">{story.id}</span>
// TaskRow
<span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">{task.id}</span>
```

**Justificativa:** em 390px a linha da task já era o ponto mais apertado da tela (`§6` do doc original); o ID composto é o token de menor valor informacional na linha (ninguém memoriza "1.2.3") e o primeiro a poder sumir sem perda de função — continua acessível em `title` via o próprio texto do botão se precisar (não há necessidade de duplicar em `title`, o dado não é crítico).

### 9.9 Checklist de aceite — adendo (29/07)

- [ ] Ao abrir um tema com task pendente fora da dobra, a tela rola sozinha até a linha dela (peek já aberto); se a task pendente já está visível no primeiro paint, **não** rola.
- [ ] Epic, story e task do caminho de retomada mostram `border-l-2 border-l-primary`; nenhum outro epic/story/task ganha a borda.
- [ ] `EpicCard` fechado não mostra barra de progresso própria — só `done/total` mono; a barra do header do tema continua.
- [ ] `TargetControl` com prova marcada nasce mostrando só o chip; tocar revela meta+editar; `?prova=1` continua indo direto pro input de data, sem passar pelo chip.
- [ ] `epic.goal` trunca em 1 linha no card fechado e mostra completo no aberto.
- [ ] Task sem nota mostra só o link "+ nota" (sem textarea); tocar revela o campo; task com nota já nasce revelada como hoje.
- [ ] Story e task têm o mesmo `text-sm`, mas story é `font-semibold` e task é `font-normal` — a diferença é perceptível num scan rápido.
- [ ] Em `<sm` (mobile), o `id` mono de story e task some; o rótulo "Epic N" continua visível em qualquer largura.
