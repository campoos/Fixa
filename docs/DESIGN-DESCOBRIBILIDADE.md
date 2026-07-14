# DESIGN-DESCOBRIBILIDADE — auditoria heurística (feedback do Vini, 14/07)

> **Origem:** primeiro teste com usuário desconhecido (Vini, dev): "o único ponto que pega é a
> UI — não em ser bonitona, mas não ser intuitiva: tem botão muito escondido, função que você
> precisa procurar pra achar". Sem exemplos — auditoria completa, na pele de quem chega da
> landing.
> **Escopo auditado:** `App.tsx` (shell/auth), `Home.tsx`, `Track.tsx`, `Licao.tsx`,
> `Review.tsx`, `NewTheme.tsx`, `Ajuda.tsx`, `Pro.tsx`.
> **Equilíbrio:** o app é minimalista por identidade ("cada tela um trabalho") — as correções
> abaixo preferem MOVER, ABRIR POR PADRÃO ou ENSINAR UMA VEZ a poluir com rótulo permanente.
> Nenhum redesign de tela.

Severidades: **BLOQUEIA** (usuário novo não descobre o caminho principal) · **ATRASA**
(descobre, mas procurando) · **cosmético** (fricção menor/convencionada).

---

## OS 5 PIORES (fix detalhado)

### 1. O gesto primário do produto é invisível — BLOQUEIA

**Onde:** `Track.tsx` `TaskRow` (linhas 158–202). Tocar no TÍTULO da task abre a Lição — o
coração do produto — mas nada sinaliza isso: o botão do título não tem hover de superfície,
o `title="abrir a lição"` só existe no desktop, e os controles mais afford-antes da row são o
checkbox (esquerda) e o chevron (direita). Um usuário novo vê uma lista de afazeres com
caixinhas — e usa como lista de afazeres (provável experiência do Vini).
**Heurística violada:** affordance/visibility of system status + recognition over recall.
**Fix (cirúrgico, auto-ensina uma vez):**
1. **O peek da primeira task pendente do tema nasce ABERTO.** O `Track` já computa
   `firstPending` (linhas 341–343) pra abrir epic/story; estender à task: `TaskRow` ganha prop
   `defaultOpen` (alimenta o `useState(open)`) verdadeira quando `task.id === firstPending.t.id`.
   O peek aberto expõe o único botão sólido da árvore — **"Estudar →"** — que É o convite.
   Custo: zero chrome novo; a régua "primeira pendente" é determinística e re-ensina sempre
   que o usuário voltar.
2. **Hover de superfície na área do título** (desktop): adicionar `rounded-md px-1 -mx-1
   transition-colors hover:bg-accent/60` ao botão do título (linha 174) — o retângulo que
   acende diz "isto é clicável".

### 2. Conta e export de dados enterrados — ATRASA (e é promessa de marketing)

**Onde:** sair da conta = ícone `LogOut` sem rótulo no header (`App.tsx:130`, só `title`);
**exportar dados** — prometido na landing e no pricing ("export dos seus dados, sempre") —
existe SÓ como link de texto no rodapé do `/pro` (`Pro.tsx:219`). Não há nenhuma superfície
de "conta".
**Heurística:** recognition over recall; match between system and real world (todo app tem um
lugar de conta).
**Fix:** a **Ajuda vira a casa da conta** (sem tela nova): bloco "Sua conta" no fim de
`Ajuda.tsx`, após os grupos de FAQ — Card com e-mail logado (`me.email` — passar `me` como
prop na rota, `App.tsx:138`) + dois botões quietos com palavra: **"exportar meus dados"**
(`<a href="/api/export" download>` no espécime `QUIET_BTN`) e **"sair da conta"**
(`onLogout`). O ícone do header permanece (atalho, não único caminho).

### 3. A escada Leitner não é ensinada no mobile — ATRASA

**Onde:** `Review.tsx` `LeitnerLadder` (linhas 49–65): o significado ("caixa 3 de 8 · acertou
→ …") vive num `title` — hover-only, inexistente no toque. No primeiro contato, os
segmentinhos âmbar e o `3/8` mono são ruído decorativo; "caixa" só é explicado na FAQ.
**Heurística:** recognition over recall; help users learn the system.
**Fix (ensinar uma vez):** hint de primeira sessão — em `Review`, acima do dock (junto do
hint de atalhos, linha 336), quando `localStorage["fx-hint-ladder"]` ausente:
`<p className="mt-3 text-center font-mono text-[11px] text-muted-foreground/70">a escada âmbar
é a caixa da task — acertou sobe (espaça mais), errou volta pra 1</p>` — visível em TODAS as
larguras; grava a flag ao concluir a primeira sessão (`SessionDone` mount). Some pra sempre
depois. FAQ continua sendo a referência completa.

### 4. Marcar Done sem estudar é o caminho mais afford-ante — ATRASA (dilui o método)

**Onde:** `Track.tsx` `DoneBox` (linhas 24–30): o checkbox é o PRIMEIRO controle da row, sem
`title` nenhum, e conclui a task sem passar pela Lição. Decisão UX §6.3 mantém o checkbox
(migração/uso lista) — mas hoje ele compete de igual pra igual com um gesto invisível (achado
1). Usuário novo dá check em tudo e o produto vira todo-list.
**Heurística:** visibility of consequences.
**Fix (sem remover — é lei):** (a) `title="concluir sem estudar — a Lição registra a
jornada"` + `aria-label` no `DoneBox`; (b) ao marcar via checkbox uma task SEM `lesson`, a
linha de estado do peek (se aberto) e a live region anunciam `concluída sem registro de
estudo` — vocabulário que já existe no modo leitura da Lição (consistência, não invenção).
O fix real do desequilíbrio é o achado 1 (dar affordance ao gesto certo, não esconder o errado).

### 5. Editar task: dois passos não sinalizados até um ícone mudo — ATRASA

**Onde:** `Track.tsx:188–192` — o lápis de editar só RENDERIZA com o peek aberto (chevron
primeiro), é icon-only (`title` hover) e fica no cabeçalho da row, longe do conteúdo que edita.
**Heurística:** recognition over recall.
**Fix:** o lápis sai do cabeçalho da row; **"editar conteúdo" vira ação textual dentro do
`TaskPeek`** — botão-texto quieto (`text-xs text-muted-foreground underline-offset-2
hover:underline`) alinhado à direita da `Section` "Objetivo" (linha 70). Um lugar, com
palavra, no contexto do que edita. (O lápis do header da **Lição** fica — lá ele tem `title`,
é secundário por design UI §5.c, e a Lição é a tela de estudo, não de gestão.)

---

## Os demais achados (tabela)

| # | Onde (anchor) | Achado | Severidade | Heurística | Correção |
|---|---|---|---|---|---|
| 6 | `Track.tsx:349` (chip do ícone do tema) | chip violeta do picker parece decorativo, não botão | cosmético | affordance | já tem `title`/`aria-haspopup` (TEMA-ICONE §9); adicionar `hover:ring-2 hover:ring-primary/30` — anel no hover = "isto abre algo" |
| 7 | `Track.tsx:351` (lápis renomear tema) | icon-only, hover-only | cosmético | recognition | manter (título do tema ao lado é o contexto); `aria-label="renomear tema"` |
| 8 | `App.tsx:54` (Sun/Moon tema) | icon-only | cosmético | — | convenção universal; nada a fazer |
| 9 | `App.tsx:130` (LogOut) | coberto no achado 2 | — | — | ícone fica como atalho |
| 10 | `Review.tsx:224` / `Licao.tsx:417` (X do player) | X icon-only pra sair | cosmético | — | convenção de player + `title`; saídas rotuladas existem no fim de sessão |
| 11 | `Home.tsx:248–254` (Trash2 do ThemeCard) | excluir mais visível que renomear (que só existe dentro do tema) | cosmético | consistency | aceitável — excluir tem undo (lixeira); renomear é raro; nada a fazer |
| 12 | `Home.tsx:262–289` (Lixeira) | colapsada no rodapé, só quando não-vazia | cosmético | — | correto: aparece exatamente quando é relevante |
| 13 | `Track.tsx:24–30` (DoneBox h-7=28px) e chevron h-7 | alvo de toque < 44px | ATRASA (mobile) | fat-finger | estender área: `before:absolute before:-inset-1.5` ou padding invisível; sem mudança visual |
| 14 | `Home.tsx:108–199` (heatmap) | tooltip só com mouse | cosmético | — | dado redundante (total no rodapé do card); nada a fazer |
| 15 | `Review.tsx:234–246` (intercalar) | toggle com title hover-only | cosmético | — | tem rótulo escrito ("intercalar") + FAQ própria; ok |
| 16 | `Track.tsx:264–272` (TargetControl) | "editar" da data da prova é link pequeno | cosmético | — | tem palavra, tem contexto; ok |
| 17 | `NewTheme.tsx:295–312` (fluxo manual) | disclosure fechada esconde o caminho grátis ilimitado | cosmético | — | rotulada com frase inteira + "grátis, sem limite"; o erro de geração já oferece `goManual`; ok |
| 18 | `Licao.tsx` válvulas/refazer/tutor | — | — | — | já cobertos por DESIGN-TUTOR-VISIBILIDADE e LICAO-V2 |
| 19 | Vocabulário "dose" (FILA-RETORNO) | nasce explicado no próprio banner de retorno | ok | — | nada a fazer |
| 20 | `Home.tsx` EmptyState / `Review` EmptyQueue | ambos ensinam o próximo passo (CTA + 1 linha de método) | ok | — | manter como referência de padrão |

---

## O que NÃO fazer (equilíbrio com a identidade)

1. **Nada de tour/coachmarks multi-passo** — o app ensina no contexto (rótulos de método na
   Lição, banner de retorno, hints de primeira vez que somem). Um tour é confessar que a UI
   falhou.
2. **Nada de rótulo permanente ao lado de todo ícone** — os fixes acima usam: abrir por
   padrão (1), mover pra onde há palavra (2, 5), ensinar uma vez com flag local (3), title/aria
   (4, 6, 7). O minimalismo fica; a mudez vai embora.
3. **Não remover o checkbox Done** (UX §6.3, decidido) nem o chevron do peek.

## Checklist de aceite

- [ ] Usuário novo cria o 1º tema e vê, sem nenhum toque, o peek aberto da primeira task com
  o botão sólido "Estudar →"; tocar no título de qualquer row acende hover no desktop.
- [ ] Ajuda mostra "Sua conta" com e-mail + exportar (download real) + sair, com palavras.
- [ ] Primeira sessão de revisão exibe a linha da escada em mobile e desktop; segunda sessão
  não exibe mais (flag gravada).
- [ ] DoneBox tem title/aria; marcar sem lesson anuncia "concluída sem registro de estudo".
- [ ] "editar conteúdo" aparece escrito dentro do peek; o lápis da row sumiu; o da Lição fica.
- [ ] Alvos de toque da row (checkbox/chevron) ≥ 40px de área efetiva sem mudança visual.
