# DESIGN-DESCOBRIBILIDADE — auditoria heurística EXAUSTIVA (feedback do Vini)

> **Origem:** primeiro usuário desconhecido (Vini, dev): "o único ponto que pega é a UI — não
> em ser bonitona, mas não ser intuitiva: botão muito escondido, função que você precisa
> procurar pra achar". **Escopo ampliado pelo dono:** "não pode ser só os 5 piores — rodar
> TUDO que for ruim".
> **Auditado (estado ATUAL do código, pós-fixes da 1ª rodada):** `App.tsx` (shell + auth),
> `Home.tsx`, `Track.tsx`, `Licao.tsx`, `Review.tsx`, `NewTheme.tsx`, `Ajuda.tsx`, `Pro.tsx`.
> **Equilíbrio de identidade:** minimalismo "cada tela um trabalho" — fixes preferem mover,
> abrir por padrão, ensinar uma vez (flag) ou dar palavra no contexto; nunca poluição
> generalizada nem redesign.

Severidades: **BLOQUEIA** (usuário não descobre o caminho/desiste) · **ATRASA** (descobre,
mas procurando) · **COSMÉTICO** (fricção menor ou convencionada).

---

## A. Da 1ª rodada — IMPLEMENTADOS ✓ (verificados no código em 14/07)

| ID | Achado | Fix aplicado (verificado) |
|---|---|---|
| D1 ✓ | Gesto primário invisível (título da row abre a Lição) — era BLOQUEIA | peek da 1ª task pendente nasce aberto (`Track.tsx:176/244/249` — cadeia `openTaskId`) expondo o CTA sólido "Estudar →"; hover de superfície no título (`Track.tsx:202`) |
| D2 ✓ | Conta/export enterrados — era ATRASA | seção "sua conta" na Ajuda com e-mail + exportar + sair COM palavra (`Ajuda.tsx:216–226`); ícones do header viraram atalhos |
| D3 ✓ | Escada Leitner sem ensino no mobile — era ATRASA | hint de 1ª sessão (`Review.tsx:361–364`), gravado como visto ao concluir a sessão (`Review.tsx:95`) |
| D4 ✓ | DoneBox mudo e pequeno — era ATRASA | `title="concluir sem estudar — a Lição registra a jornada"` + hit-area `before:-inset-1.5` (`Track.tsx:30–32`) |
| D5 ✓ | Editar task atrás de 2 passos mudos — era ATRASA | lápis saiu do cabeçalho da row; ação com palavra dentro do peek; chevron ganhou hit-area (`Track.tsx:220`) |

---

## B. NOVOS ACHADOS — por severidade, todos com fix

### BLOQUEIA

**D6 · Ajuda · A FAQ de senha NEGA uma feature que está no ar.**
`Ajuda.tsx:126–131`: *"Por enquanto **não existe recuperação automática** de senha… não dá
pra redefinir sozinho."* — mas o fluxo completo esqueci/redefinir EXISTE (`App.tsx:234–247`
modo `forgot`, rota `/redefinir`, link "esqueci a senha" no login `App.tsx:313–317`). Quem
consulta a Ajuda desiste de recuperar a conta; pior que botão escondido é documentação
mentindo. **Heurística:** help & documentation / match system–real world.
**Fix (copy final, trocar a resposta inteira):**
```tsx
{
  q: "Esqueci minha senha — e agora?",
  a: (
    <>
      Na tela de entrar, toque em <B>esqueci a senha</B>: enviamos um link por e-mail pra criar
      uma nova (vale <B>1 hora</B>). Não chegou? Confira o spam — e dá pra pedir outro link
      quando quiser. Logado, a troca de senha ainda não existe: saia da conta e use o mesmo fluxo.
    </>
  ),
},
```

### ATRASA

**D7 · Track · O chip do ícone do tema parece decorativo, não botão.**
Header do tema: o chip 9×9 violeta que abre o picker tem `title`/`aria-haspopup`, mas é
visualmente idêntico aos chips DECORATIVOS da Home (mesma anatomia, lá não-clicáveis) — o que
parece igual deve se comportar igual. **Heurística:** consistency; affordance.
**Fix:** afford de clique no próprio chip: `hover:bg-primary/15 hover:ring-2
hover:ring-primary/30 active:bg-primary/20` (anchor: botão do chip no Card do título do
`Track.tsx`). Mobile sem hover: aceito — trocar ícone é gesto raro; o ring confirma a
suspeita no desktop.

**D26 · NewTheme · "Importar tema" desabilitado sem razão perto do botão.**
`NewTheme.tsx:126`: com `atThemeLimit` o botão fica `disabled` mudo; a explicação mora só no
`FreeBanner` do topo — fora de vista no passo 03 em tela baixa. **Heurística:** visibility of
system status. **Fix:** linha condicional junto ao botão (dentro do `StepImport`):
```tsx
{atThemeLimit && (
  <p className="mt-1.5 text-xs text-recall">limite de 2 temas do grátis — exclua um tema ou <button onClick={() => navigate("/pro")} className={LINK}>veja o Pro</button></p>
)}
```
(+ `title="limite de temas do plano atingido"` no botão disabled.)

**D38 · Ajuda · FAQ do conteúdo aponta pra um lápis que não existe mais.**
`Ajuda.tsx:92`: *"tudo é editável depois — **lápis na task**…"* — o D5 matou o lápis da row;
a instrução manda procurar um ícone inexistente (literalmente a queixa do Vini).
**Heurística:** help & documentation. **Fix (trecho):** trocar por *"tudo é editável depois —
abra o detalhe da task (setinha à direita) e toque em **editar conteúdo**; e dá pra anexar
epics novos no fim da trilha."*

### COSMÉTICO — com fix de 1 linha

**D8 · Track · Lápis de renomear tema icon-only.** `title` existe e o contexto (h1) está
colado nele; renomear é raro. **Fix:** só `aria-label="renomear tema"`.

**D12 · Home · Stat tiles sem definição ("dominadas", "ações").** A palavra é ensinada na FAQ
e no header do tema (hint "Dominar ≠ concluir" quando `mastery === 0`). **Fix:** `title` nos
4 tiles: "dias seguidos com atividade" · "avaliações e conclusões de hoje" · "tasks que
graduaram na revisão" · "concluídas do total". (Desktop-only por natureza — aceito.)

**D16 · Shell · Logout icon-only no header.** Agora é ATALHO — a casa com palavra é a Ajuda
(D2 ✓). **Fix:** `aria-label="sair da conta"` (hoje só `title="sair"`, `App.tsx:130`).

### COSMÉTICO — registro consciente, SEM ação (não "consertar")

| ID | Onde | Achado | Por que fica como está |
|---|---|---|---|
| D9 | Track `TargetControl` | editar data da prova é link pequeno "editar" | tem palavra + contexto + FAQ explica o efeito |
| D13 | Home heatmap | tooltip mouse-only | dado redundante (total no rodapé do card) |
| D17 | Shell | toggle de tema Sun/Moon icon-only | convenção universal |
| D18 | Review/Licao | X do player icon-only | convenção de player; FAQ "Posso sair no meio?" mata a ansiedade real |
| D20 | Home ThemeCard | Trash2 icon-only | destrutivo com rede (lixeira restaura + FAQ); `title` existe |
| D23 | Licao header | lápis "editar conteúdo" icon-only | secundário por design (UI §5.c); a tela de estudo não vende edição |
| D33 | Track row | pill `2/3` e badge `8/10` só com `title` | a palavra mora a 1 toque no peek ("você parou no passo 2 de 3" / "Tutor 8/10 · ver correção") — selo = resumo, peek = palavra |
| D34 | Track row | GraduationCap icon-only | o header do tema apresenta o MESMO glifo colado na palavra ("N dominadas") — uma superfície ensina a outra |
| D36 | Track anotações | atalho ⌘/Ctrl+Enter só no `title` | botão visível; atalho é bônus |
| D37 | NewTheme | selects sem explicar efeito | defaults sensatos; as opções se autoqualificam ("Raso (essencial)"…) |

---

## C. Padrões BONS encontrados (a referência da casa — não mexer)

1. **Empty states que ensinam o próximo passo:** Home vazia (CTA + régua do método), "Fila
   limpa", EmptyQueue, "concluída sem registro de estudo" + "Estudar mesmo assim".
2. **Vocabulário ensinado no uso, não em manual:** rótulos-frase do dock da Lição ("responda
   de cabeça… é isso que fixa", "o que FALTOU na sua fria?"), banner de dose do retorno,
   hint único da escada (D3 ✓).
3. **Primeiro uso auto-guiado sem tour:** Home vazia → criar tema → árvore com peek da 1ª
   pendente aberto (D1 ✓) → Lição se explica passo a passo → conclusão explica a revisão de
   amanhã → badge/ReviewCard fecham o loop. Nenhum coachmark necessário.
4. **Erro que ensina:** import com lista de erros + dica do link markdown; Tutor com
   disclaimer; 402/429 com a próxima ação no texto.

## D. Regra transversal (extraída da auditoria — vale pra todo PR futuro)

**`title` nunca é o único canal de uma função primária.** Ícone mudo só é aceitável quando:
(a) convenção universal (X, sol/lua); (b) atalho de algo que tem casa com palavra (logout →
Ajuda); ou (c) o glifo é apresentado com palavra numa superfície irmã (GraduationCap, selos ↔
peek). Fora disso: palavra, reposição ou hint de primeira vez — nessa ordem de preferência.

## E. Contagem e ordem de implementação

| Severidade | Qtde | IDs |
|---|---|---|
| BLOQUEIA | 1 | D6 |
| ATRASA | 3 | D7 · D26 · D38 |
| COSMÉTICO com fix | 3 | D8 · D12 · D16 |
| COSMÉTICO registro (sem ação) | 10 | D9 · D13 · D17 · D18 · D20 · D23 · D33 · D34 · D36 · D37 |
| Implementados 1ª rodada ✓ | 5 | D1–D5 |

Ordem: **D6 → D38** (as duas mentiras da Ajuda — mesmo arquivo, 1 PR) → **D26 → D7** →
**D8/D12/D16** (aria/title, 1 commit). Estimativa total: < 1h.

**IMPLEMENTADO (15/07):** D6 ✓ (FAQ senha descreve o fluxo real) · D38 ✓ (FAQ conteúdo → peek+editar) ·
D26 ✓ (razão do limite junto do botão Importar + title) · D7 ✓ (já tinha ring de hover — 1ª rodada) ·
D8 ✓ (já tinha aria) · D16 ✓ (aria logout) · D12 ✓ (title nos 4 stat tiles). Os 10 COSMÉTICO-registro
seguem intencionalmente como estavam.

## F. Checklist de aceite

- [ ] FAQ de senha descreve o fluxo real; teste manual "esqueci a senha" termina com senha
  nova funcionando e a resposta da FAQ confere com o que a tela mostra.
- [ ] FAQ de conteúdo não menciona "lápis na task"; descreve o caminho do peek.
- [ ] Free no limite vê a razão do bloqueio JUNTO do botão Importar (não só no topo).
- [ ] Chip do ícone do tema reage a hover como botão (ring violeta).
- [ ] `aria-label` em logout e renomear tema; `title` nos 4 stat tiles.
- [ ] Nenhum "fix" além desta lista — os padrões da seção C permanecem intactos.
