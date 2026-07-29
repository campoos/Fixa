# DESIGN-SHELL-MOBILE.md — Spec do shell mobile (header + bottom tab bar)

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/App.tsx`** (componente `Shell`: header, nav e `main`). Nenhuma mudança em tokens (`index.css`), telas, API ou rotas. **Desktop (≥`md`) fica exatamente como está.**
> Problema que resolve: em `<sm` o header estoura — logo + 3 pills (Temas / Revisar+badge / Ajuda) + 3 botões de 36px não cabem em 360px, o wordmark some, e **Pro fica inacessível no mobile** (pill `hidden sm:`).
> Continuidade: usa só os tokens e o vocabulário já implementados (`--primary`, `--recall`, neutros violeta, `FOCUS`, mono `tabular-nums`). Régua de qualidade: Home logada.

---

## 1. Decisão: (A) bottom tab bar em `<md`

**Direção A — bottom tab bar** com **3 abas (Temas · Revisar · Pro)** — 29/07: eram 4, `Ajuda` saiu, ver §1.2 — header mobile reduzido a marca + ações, e a bar **escondida na rota `/revisar`** (o dock de avaliação assume o fundo da tela).

**Justificativa (3 linhas):**
1. O Fixa é usado **todo dia no celular, com uma mão**: navegação primária tem que morar na zona do polegar, não no topo — é o padrão que todo app de hábito diário treina no usuário (e o dock do Revisar já apontou o caminho: as ações mais usadas do produto já estão embaixo).
2. Resolve o aperto **pela raiz** (tira a nav do header em vez de espremê-la): o wordmark volta pro mobile, cada alvo vira ≥48px, e **Pro passa a existir no mobile** — hoje não há caminho pra ele em `<sm`.
3. A opção (B) header compacto exigiria um popover overflow novo (o projeto não tem dropdown) pra esconder itens atrás de um toque extra — mais código pra uma experiência pior; a (A) convive com o dock do Revisar com uma regra de uma linha (`route.name === "revisar"` → sem bar) e **zero mudança no `Review.tsx`**.

### 1.2 Emenda 29/07 — `Ajuda` sai da tab bar (e da nav de pills do desktop)

**Decisão: `Ajuda` deixa de ser aba/pill e vira um icon-button no cluster direito do header — mesmo lugar, mesmo tratamento, nos dois breakpoints.**

Por quê:
- `Ajuda` é a tela mais **lida uma vez, não revisitada todo dia** do app (`DESIGN-AJUDA §1`: "a única tela do app que é leitura, não ferramenta"). Ocupar um dos 4 slots da zona do polegar — o espaço mais caro da tela, reservado a navegação **diária** — pra uma tela de referência era o item errado ali.
- O ícone `CircleHelp` já era descrito na própria `DESIGN-AJUDA §92` como "convenção universal": ponto de interrogação em círculo não precisa de rótulo ao lado nem de uma "casa com palavra" pra virar exceção (ao contrário do toggle de tema, que precisou da seção `Ajuda › aparência` pra justificar ser ícone-só — `DESIGN-ENGAJAMENTO §8`). `Ajuda` como ícone no header já é auto-explicativo.
- Um único lugar em vez de dois: hoje o desktop tinha `Ajuda` na nav de pills e o mobile teria na tab bar — dois pontos de entrada diferentes pra mesma tela é inconsistência sem motivo. O icon-button no cluster direito do header existe **igual nos dois breakpoints** (`DESIGN-HOME §3`), então vira a casa única.
- Conta/e-mail/export/sair continuam alcançáveis: `Ajuda` não perdeu rota nem conteúdo, só o ponto de entrada mudou de "aba" pra "ícone no header" — um toque a mais em lugar nenhum, porque o header é visível em **toda tela**, inclusive dentro de `/ajuda` (ao contrário da tab bar, que também aparece em toda tela — a troca é neutra em alcance).

**Pro fica.** Ele entrou na tab bar justamente porque não existia *nenhum* caminho pra `/pro` no mobile (`§1` item 2) — meta diferente da de `Ajuda`, que sempre teve pill no desktop. Tirar `Ajuda` sem tirar `Pro` resolve o aperto sem reabrir o problema que a v1 desta spec já corrigiu.

Consequência na nav de pills do **desktop** (`≥md`, `DESIGN-HOME §3`): `Ajuda` some de lá também — não é só um ajuste de mobile, é o item saindo de "navegação primária" em qualquer largura e virando "acesso secundário" nos dois. A pill vira ícone no cluster direito do header, igual ao mobile.

### 1.1 Convivência com o dock do Revisar (decisão)

Na rota `/revisar` (em `<md`) **a tab bar não renderiza** e o dock sticky do player continua dono do `bottom-0` + safe-area, como hoje.

- **Por quê esconder e não empilhar**: dock (h-12 + paddings ≈ 72px) sobre bar (64px + safe-area) = ~130px+ de cromo no rodapé da tela mais focada do app, com Errei/Acertei encostados nas abas — um toque fantasma em "Temas" no meio da sessão é inaceitável. Sessão de revisão é imersiva (a spec do player já a trata como começo-meio-fim); esconder tabs durante a "lição" é o padrão consagrado dos apps de estudo.
- **Por quê a rota inteira** (e não "só com card ativo"): o estado da sessão vive dentro do `Review`; vazar `cur !== null` pro Shell criaria acoplamento (evento/contexto novo) pra ganhar quase nada. Nos estados vazio/fim, a saída já existe na própria tela (`Continuar estudando` / `Voltar aos temas`) e o logo do header sempre leva pra Home.
- Em `/novo`, `/ajuda`, `/pro`, `/`, `/t/:id` a bar aparece normalmente (em `/novo` nenhuma aba fica ativa — ok, é uma tela de ação alcançada pelo CTA).

---

## 2. Header mobile (`<md`)

Mesmo elemento `header` atual (sticky, `h-14`, vidro `bg-background/92 backdrop-blur-md` + `pt-[env(safe-area-inset-top)]`, `z-30`). O `pt-[env(safe-area-inset-top)]` resolve 0 sem `viewport-fit=cover` — fica como seguro, e sem `max()` nunca vira folga fantasma. Muda só o conteúdo em `<md`:

```
[ Logo + Fixa ]          [ (+) Novo tema ] [ ajuda ] [ tema ] [ sair ]
```

- **Marca**: botão logo + wordmark → **remover `hidden sm:` do wordmark** (`<span className="text-[17px] font-extrabold tracking-[-0.02em]">Fixa</span>` sempre visível). Com a nav fora do header, cabe com folga até em 320px.
- **Nav de pills**: `nav` vira `hidden md:flex items-center gap-1`. Dentro dela, o `NavBtn` do Pro **perde o override** `display="hidden sm:inline-flex"` (a prop `display` do `NavBtn` pode ser removida — a nav inteira já só existe em ≥`md`). **(29/07)** a pill `Ajuda` **sai** desta nav também (não só do mobile) — vira icon-button no cluster direito, ver §1.2 e item abaixo.
- **Cluster direito** (**29/07: ganha um item, `Ajuda`** — estrutura descrita em `DESIGN-HOME §3`): CTA Novo tema (ícone-só `h-9 w-9` em `<sm`, texto+ícone em ≥`sm`, `bg-primary` — segue o único sólido violeta do shell), `Ajuda` **novo** (`CircleHelp h-9 w-9`, `title/aria-label="Ajuda"`, → `/ajuda`), `ThemeButton` `h-9 w-9`, sair `h-9 w-9`. Gap `gap-2`. Ordem: Novo tema → Ajuda → tema → sair (ação primeiro, depois os três de "acesso secundário").
- Orçamento em 360px: marca ≈ 90px + cluster ≈ 168px (4×36 + 3×gap-2) → sobra ≈ 70px de respiro (era ≈100px com 3 ícones; ainda folgado). Em ≥`sm` o CTA com texto (~120px) também cabe, cluster ≈ 252px.

Nada muda em ≥`md`: pills, badge no pill Revisar, CTA completo, tudo como hoje.

---

## 3. Bottom tab bar (`<md`)

### 3.1 Container

```tsx
{route.name !== "revisar" && (
  <nav aria-label="navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_-4px_oklch(0.235_0.03_290/0.18)] backdrop-blur-md md:hidden">
    <div className="mx-auto grid h-[72px] max-w-4xl grid-cols-3">
      {/* 3 TabBtn — 29/07: era grid-cols-4 com Ajuda; Ajuda virou ícone do header (§1.2) */}
    </div>
  </nav>
)}
```

- `fixed` (não sticky): a bar nunca sai da tela ao rolar. Mesma linguagem de vidro do header; `border-t` espelha o `border-b` do topo. `z-30` (nunca coexiste com o dock `z-10` — rota `/revisar` não tem bar).
- Altura de conteúdo **72px** + `border-t` 1px = **73px**. O respiro fica **dentro** dos 72 (bloco de 39px centralizado → 16,5px em cima e embaixo), nunca como `padding-bottom` externo — padding fora do grid dá folga só embaixo e o rodapé lê torto. Fica entre a navigation bar do Material 3 (80dp) e a tab bar do iOS (49+34pt).
- **Vidro a 92%, não 85%**: a 85% sobre fundo claro a barra ficava quase da cor do conteúdo e o card cortado lia como colisão. A sombra rasa pra cima é a pista de que o conteúdo passa por baixo.
- **Não usar `viewport-fit=cover`**. Ele põe a página edge-to-edge no Android e o sistema desenha um scrim claro atrás da barra de gestos — faixa fina visível embaixo do rodapé. No TWA a faixa já é pintada por `navigationColor` (`android/twa-manifest.json`), então o `cover` não compra nada. Consequência assumida: `env(safe-area-inset-*)` vale 0; os `env()` que restam no shell são seguro, **sempre sem piso em px**.
- `md:hidden` — desktop nunca vê a bar.

### 3.2 Aba (`TabBtn`)

```tsx
const TabBtn = ({ to, active, icon, label, badge }: { to: string; active: boolean; icon: ReactNode; label: string; badge?: number }) => (
  <button
    onClick={() => navigate(to)}
    aria-current={active ? "page" : undefined}
    aria-label={badge ? `${label}, ${badge} ${badge === 1 ? "pendente" : "pendentes"}` : label}
    className={`relative flex h-full flex-col items-center justify-center gap-1.5 rounded-lg transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${FOCUS}`}
  >
    <span className="relative">
      {icon /* h-[22px] w-[22px] */}
      {badge ? (
        <span aria-hidden="true" className="absolute -right-3.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-recall/15 px-1 font-mono text-[10px] tabular-nums text-recall">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </span>
    <span className="text-[11px] font-medium leading-none">{label}</span>
  </button>
);
```

| Aba | `to` | `active` | Ícone (lucide) | Racional do ícone |
|---|---|---|---|---|
| **Temas** | `/` | `home \|\| track` | `Library` `h-[22px] w-[22px]` | coleção de temas/trilhas |
| **Revisar** | `/revisar` | `revisar` | `Layers` `h-[22px] w-[22px]` | eco das caixas Leitner (identidade da revisão) |
| **Pro** | `/pro` | `pro` | `Gem` `h-[22px] w-[22px]` | premium sem gritar (nada de coroa dourada) |

**(29/07) `Ajuda` saiu da tabela acima** — não é mais aba, é icon-button do header (`CircleHelp`, mesma convenção universal, ver §1.2 e `DESIGN-HOME §3`). A rota `/ajuda` continua existindo igual; só o ponto de entrada mudou.

**Estados:**
- **Ativa**: `text-primary` (ícone + label juntos) + `aria-current="page"`. Violeta em volume baixo — só tinta, **sem** pill/fundo/sublinha (a pill `bg-secondary` fica sendo vocabulário do desktop).
- **Inativa**: `text-muted-foreground` (AA garantido pelo token), `hover:text-foreground` (desktop estreito/pointer).
- **Foco**: `FOCUS` (anel violeta padrão do app) sobre o `rounded-lg`.
- **Peso constante**: `font-medium` sempre (ativa muda só cor) — troca de peso mexeria na largura do label.
- **Alvo de toque**: a célula inteira do grid (≈ 82–96px × 72px em 330–390px de viewport) — ≥48px com folga, sem gap fantasma entre abas.

### 3.3 Badge do Revisar

- Mesmo dado do header (`dueCount`, já no `Shell`; o evento `fx-review-changed` já o mantém vivo). Mesma família visual do badge atual: tint `bg-recall/15 text-recall`, mono `tabular-nums`, cap `99+` — âmbar **nunca sólido** (regra de identidade intacta).
- `h-4 min-w-4` ancorado no canto superior-direito do ícone (`absolute -right-3.5 -top-1.5`). `aria-hidden` no span (o número já está no `aria-label` do botão — leitor de tela ouve "Revisar, 7 pendentes", não "Revisar sete").
- `dueCount === 0` → badge não renderiza (sem bolinha vazia).

### 3.4 Compensação de layout no `main`

A bar é `fixed`, então o conteúdo precisa de respiro embaixo em `<md` (exceto em `/revisar`, onde não há bar):

```tsx
<main className={`mx-auto max-w-4xl px-4 pt-6 ${route.name === "revisar" ? "pb-6" : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6"}`}>
```

- `6rem` = 72px da bar + 24px de respiro; ≥`md` volta ao `pb-6` de sempre.
- `scroll-margin`/âncoras: não há âncoras no app — nada a fazer.

---

## 4. Impacto no `Review.tsx`

**Nenhuma linha muda.** Invariantes que esta spec preserva (e que o dev deve conferir, não "corrigir"):

- O dock sticky (`bottom-0 z-10` + `pb-[max(env(safe-area-inset-bottom),0.75rem)]`) continua dono do fundo da tela em `/revisar` — a bar não renderiza nessa rota. (Sem `cover`, esse `max()` resolve nos 12px de piso — o comportamento pré-safe-area, que é o correto.)
- O `min-h-[calc(100svh-6.5rem)]` do player continua correto: header 56px + paddings do `main` (o `main` mantém `pb-6` em `/revisar`).
- `fx-review-changed` segue sendo a fonte do badge — agora alimenta pill (desktop) **e** aba (mobile) pelo mesmo `dueCount` do `Shell`.

---

## 5. Microcopy (pt-BR)

| Onde | Texto |
|---|---|
| Abas | `Temas` · `Revisar` · `Pro` (29/07: `Ajuda` saiu; labels curtos, sem ícone órfão — ícone-só em tab bar é adivinhação) |
| Badge | `{n}` / `99+` (mono tabular) |
| `aria-label` da bar | `navegação principal` |
| `aria-label` da aba Revisar com fila | `Revisar, {n} pendente(s)` |
| CTA header (inalterado) | `Novo tema` (≥`sm`) · `title="Novo tema"` no ícone-só |
| Botão de Ajuda no header (novo, 29/07) | `title="Ajuda"` `aria-label="Ajuda"` |
| Botões do header (inalterados) | `title="tema"` · `title="sair"` |

Tom herdado: sem exclamação, sem emoji; números em mono `tabular-nums`.

---

## 6. Acessibilidade

- **Dois `nav`s, papéis claros**: o desktop (pills) e a bar mobile nunca são visíveis ao mesmo tempo, mas ambos ficam no DOM — dar `aria-label="navegação principal"` à bar e manter o `nav` do header sem conflito (opcional: `aria-label="navegação"` nele). `aria-current="page"` na aba/pill ativa, como hoje.
- **Alvos**: 72px de altura × ≥82px de largura por aba; nada de alvos de 36px na navegação primária mobile.
- **Foco visível**: `FOCUS` em todas as abas (anel violeta, offset sobre o vidro).
- **Leitor de tela**: badge `aria-hidden` + contagem no `aria-label` do botão (um anúncio só, sem número solto).
- **Contraste**: só tokens existentes — `muted-foreground`, `primary` e `recall` já são AA nos dois temas em 10–11px (foi o critério de cunhagem deles).
- **Motion**: `transition-colors` apenas; nenhuma animação de entrada/saída da bar (a troca `/revisar` ⇄ resto é corte seco — animar altura de viewport útil = layout shift gratuito).

---

## 7. Não-objetivos (segurar o dev)

1. **Não tocar em `Review.tsx`** nem em nenhuma tela — escopo é o `Shell` do `App.tsx`.
2. **Sem router lib, sem componente de dropdown/popover** — a direção (B) foi descartada justamente pra não criar esse componente.
3. **Sem auto-hide da bar no scroll** (padrão frágil, briga com o sticky header e com leitores de tela).
4. **Sem 4ª aba de volta**: o slot que `Ajuda` deixou não recebe substituto — 3 é a contagem honesta de destinos de uso diário (§1.2). Criar tema continua fora da bar, no CTA do header.
5. **Sem mudar desktop ≥`md` além do combinado em 29/07**: badge, CTA continuam intactos; a única mudança é `Ajuda` saindo das pills e entrando no cluster direito como ícone (mesma mudança dos dois breakpoints, ver §1.2) — não reabrir mais nada da nav desktop além disso.
6. **Sem tokens novos, sem sólido âmbar** (badge segue tint), sem mexer no `z-index` do header/dock.
7. **Sem estado "sessão ativa" vazando do `Review` pro `Shell`** — a regra é por rota, ponto.

---

## 8. Checklist de aceite

- [ ] **360×800 (e 320px)**: header mostra Logo + wordmark "Fixa" + CTA + **Ajuda** + tema + sair sem overflow nem truncar; nenhuma pill de nav visível; bar com **3 abas** visível (29/07, era 4).
- [ ] **Bar some em `/revisar`**: na sessão de revisão o dock Revelar/Errei/Acertei fica colado no fundo com safe-area, sem bar atrás nem por cima; ao navegar de volta (logo ou `Voltar aos temas`) a bar reaparece.
- [ ] **Badge**: com 7 pendentes, aba Revisar mostra `7` em âmbar tint mono no canto do ícone; ao avaliar um card e voltar, o número caiu (evento `fx-review-changed`); com 0, sem badge; com 120, `99+`; leitor de tela anuncia "Revisar, 7 pendentes".
- [ ] **Ativa certa em toda rota**: `/` e `/t/:id` → Temas; `/revisar` → (sem bar); `/pro` → Pro (agora alcançável no mobile); `/novo` → nenhuma aba ativa, bar visível. **(29/07) `/ajuda` não tem mais aba** — chega pelo ícone do header, visível (e clicável) em qualquer rota, inclusive dentro da própria Ajuda.
- [ ] **Sem conteúdo engolido**: no fim da Home (e de `/pro`, a mais longa) o último elemento rola pra cima da bar (`pb` do `main` correto); e conferir no aparelho que **não há faixa clara** abaixo do rodapé, no claro e no escuro.
- [ ] **(29/07) Ajuda alcançável nos dois breakpoints**: ícone `CircleHelp` no cluster direito do header em `<md` **e** `≥md`; `title`/`aria-label` "Ajuda"; navega pra `/ajuda`; conta (e-mail/export/sair) continua acessível de dentro da tela Ajuda, sem regressão.
- [ ] **Desktop (≥768px)**: header com pills **Temas · Revisar** (sem `Ajuda`), badge, CTA completo, zero bar, `main` com `pb-6`, cluster direito com o ícone novo de Ajuda.
- [ ] **A11y/identidade**: abas com anel `FOCUS` no teclado, `aria-current` na ativa, ativa em violeta tinta (sem fundo), nenhum emoji/exclamação, números mono `tabular-nums`.
