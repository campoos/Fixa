# DESIGN-SHELL-MOBILE.md — Spec do shell mobile (header + bottom tab bar)

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/App.tsx`** (componente `Shell`: header, nav e `main`). Nenhuma mudança em tokens (`index.css`), telas, API ou rotas. **Desktop (≥`md`) fica exatamente como está.**
> Problema que resolve: em `<sm` o header estoura — logo + 3 pills (Temas / Revisar+badge / Ajuda) + 3 botões de 36px não cabem em 360px, o wordmark some, e **Pro fica inacessível no mobile** (pill `hidden sm:`).
> Continuidade: usa só os tokens e o vocabulário já implementados (`--primary`, `--recall`, neutros violeta, `FOCUS`, mono `tabular-nums`). Régua de qualidade: Home logada.

---

## 1. Decisão: (A) bottom tab bar em `<md`

**Direção A — bottom tab bar** com 4 abas (Temas · Revisar · Ajuda · Pro), header mobile reduzido a marca + ações, e a bar **escondida na rota `/revisar`** (o dock de avaliação assume o fundo da tela).

**Justificativa (3 linhas):**
1. O Fixa é usado **todo dia no celular, com uma mão**: navegação primária tem que morar na zona do polegar, não no topo — é o padrão que todo app de hábito diário treina no usuário (e o dock do Revisar já apontou o caminho: as ações mais usadas do produto já estão embaixo).
2. Resolve o aperto **pela raiz** (tira a nav do header em vez de espremê-la): o wordmark volta pro mobile, cada alvo vira ≥48px, e **Pro passa a existir no mobile** — hoje não há caminho pra ele em `<sm`.
3. A opção (B) header compacto exigiria um popover overflow novo (o projeto não tem dropdown) pra esconder itens atrás de um toque extra — mais código pra uma experiência pior; a (A) convive com o dock do Revisar com uma regra de uma linha (`route.name === "revisar"` → sem bar) e **zero mudança no `Review.tsx`**.

### 1.1 Convivência com o dock do Revisar (decisão)

Na rota `/revisar` (em `<md`) **a tab bar não renderiza** e o dock sticky do player continua dono do `bottom-0` + safe-area, como hoje.

- **Por quê esconder e não empilhar**: dock (h-12 + paddings ≈ 72px) sobre bar (64px + safe-area) = ~130px+ de cromo no rodapé da tela mais focada do app, com Errei/Acertei encostados nas abas — um toque fantasma em "Temas" no meio da sessão é inaceitável. Sessão de revisão é imersiva (a spec do player já a trata como começo-meio-fim); esconder tabs durante a "lição" é o padrão consagrado dos apps de estudo.
- **Por quê a rota inteira** (e não "só com card ativo"): o estado da sessão vive dentro do `Review`; vazar `cur !== null` pro Shell criaria acoplamento (evento/contexto novo) pra ganhar quase nada. Nos estados vazio/fim, a saída já existe na própria tela (`Continuar estudando` / `Voltar aos temas`) e o logo do header sempre leva pra Home.
- Em `/novo`, `/ajuda`, `/pro`, `/`, `/t/:id` a bar aparece normalmente (em `/novo` nenhuma aba fica ativa — ok, é uma tela de ação alcançada pelo CTA).

---

## 2. Header mobile (`<md`)

Mesmo elemento `header` atual (sticky, `h-14`, vidro `bg-background/92 backdrop-blur-md` + `pt-[env(safe-area-inset-top)]`, `z-30`). Muda só o conteúdo em `<md`:

```
[ Logo + Fixa ]                    [ (+) Novo tema ] [ tema ] [ sair ]
```

- **Marca**: botão logo + wordmark → **remover `hidden sm:` do wordmark** (`<span className="text-[17px] font-extrabold tracking-[-0.02em]">Fixa</span>` sempre visível). Com a nav fora do header, cabe com folga até em 320px.
- **Nav de pills**: `nav` vira `hidden md:flex items-center gap-1`. Dentro dela, o `NavBtn` do Pro **perde o override** `display="hidden sm:inline-flex"` (a prop `display` do `NavBtn` pode ser removida — a nav inteira já só existe em ≥`md`).
- **Cluster direito** (inalterado em estrutura): CTA Novo tema (ícone-só `h-9 w-9` em `<sm`, texto+ícone em ≥`sm`, `bg-primary` — segue o único sólido violeta do shell), `ThemeButton` `h-9 w-9`, sair `h-9 w-9`. Gap `gap-2`.
- Orçamento em 360px: marca ≈ 90px + cluster ≈ 124px (3×36 + gaps) → sobra ≈ 100px de respiro. Em ≥`sm` o CTA com texto (~120px) também cabe.

Nada muda em ≥`md`: pills, badge no pill Revisar, CTA completo, tudo como hoje.

---

## 3. Bottom tab bar (`<md`)

### 3.1 Container

```tsx
{route.name !== "revisar" && (
  <nav aria-label="navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/92 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-2px_10px_-4px_oklch(0.235_0.03_290/0.18)] backdrop-blur-md md:hidden">
    <div className="mx-auto grid h-16 max-w-4xl grid-cols-4">
      {/* 4 TabBtn */}
    </div>
  </nav>
)}
```

- `fixed` (não sticky): a bar nunca sai da tela ao rolar. Mesma linguagem de vidro do header; `border-t` espelha o `border-b` do topo. `z-30` (nunca coexiste com o dock `z-10` — rota `/revisar` não tem bar).
- Altura de conteúdo **h-16 (64px)** + no mínimo **8px** embaixo (`max(safe-area, 0.5rem)`), fora do grid: 72px no total, entre a navigation bar do Material 3 (80dp) e a tab bar do iOS (49+34pt). Com 56px rente à borda o rodapé caía na faixa do gesto do Android — e em aparelho sem entalhe a safe-area é 0, por isso o piso de 8px.
- **Vidro a 92%, não 85%**: a 85% sobre fundo claro a barra ficava quase da cor do conteúdo e o card cortado lia como colisão. A sombra rasa pra cima é a pista de que o conteúdo passa por baixo.
- Nada disso existe sem **`viewport-fit=cover`** na meta viewport (`web/index.html`): sem ele todo `env(safe-area-inset-*)` vale 0.
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
| **Ajuda** | `/ajuda` | `ajuda` | `CircleHelp` `h-[22px] w-[22px]` | convenção universal |
| **Pro** | `/pro` | `pro` | `Gem` `h-[22px] w-[22px]` | premium sem gritar (nada de coroa dourada) |

**Estados:**
- **Ativa**: `text-primary` (ícone + label juntos) + `aria-current="page"`. Violeta em volume baixo — só tinta, **sem** pill/fundo/sublinha (a pill `bg-secondary` fica sendo vocabulário do desktop).
- **Inativa**: `text-muted-foreground` (AA garantido pelo token), `hover:text-foreground` (desktop estreito/pointer).
- **Foco**: `FOCUS` (anel violeta padrão do app) sobre o `rounded-lg`.
- **Peso constante**: `font-medium` sempre (ativa muda só cor) — troca de peso mexeria na largura do label.
- **Alvo de toque**: a célula inteira do grid (≈ 82–96px × 64px em 330–390px de viewport) — ≥48px com folga, sem gap fantasma entre abas.

### 3.3 Badge do Revisar

- Mesmo dado do header (`dueCount`, já no `Shell`; o evento `fx-review-changed` já o mantém vivo). Mesma família visual do badge atual: tint `bg-recall/15 text-recall`, mono `tabular-nums`, cap `99+` — âmbar **nunca sólido** (regra de identidade intacta).
- `h-4 min-w-4` ancorado no canto superior-direito do ícone (`absolute -right-3.5 -top-1.5`). `aria-hidden` no span (o número já está no `aria-label` do botão — leitor de tela ouve "Revisar, 7 pendentes", não "Revisar sete").
- `dueCount === 0` → badge não renderiza (sem bolinha vazia).

### 3.4 Compensação de layout no `main`

A bar é `fixed`, então o conteúdo precisa de respiro embaixo em `<md` (exceto em `/revisar`, onde não há bar):

```tsx
<main className={`mx-auto max-w-4xl px-4 pt-6 ${route.name === "revisar" ? "pb-6" : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6"}`}>
```

- `6rem` = 64px da bar + 8px do piso de respiro + 24px do `py-6` original; ≥`md` volta ao `pb-6` de sempre.
- `scroll-margin`/âncoras: não há âncoras no app — nada a fazer.

---

## 4. Impacto no `Review.tsx`

**Nenhuma linha muda.** Invariantes que esta spec preserva (e que o dev deve conferir, não "corrigir"):

- O dock sticky (`bottom-0 z-10` + `pb-[max(env(safe-area-inset-bottom),0.75rem)]`) continua dono do fundo da tela em `/revisar` — a bar não renderiza nessa rota.
- O `min-h-[calc(100svh-6.5rem)]` do player continua correto: header 56px + paddings do `main` (o `main` mantém `pb-6` em `/revisar`).
- `fx-review-changed` segue sendo a fonte do badge — agora alimenta pill (desktop) **e** aba (mobile) pelo mesmo `dueCount` do `Shell`.

---

## 5. Microcopy (pt-BR)

| Onde | Texto |
|---|---|
| Abas | `Temas` · `Revisar` · `Ajuda` · `Pro` (labels curtos, sem ícone órfão — ícone-só em tab bar é adivinhação) |
| Badge | `{n}` / `99+` (mono tabular) |
| `aria-label` da bar | `navegação principal` |
| `aria-label` da aba Revisar com fila | `Revisar, {n} pendente(s)` |
| CTA header (inalterado) | `Novo tema` (≥`sm`) · `title="Novo tema"` no ícone-só |
| Botões do header (inalterados) | `title="tema"` · `title="sair"` |

Tom herdado: sem exclamação, sem emoji; números em mono `tabular-nums`.

---

## 6. Acessibilidade

- **Dois `nav`s, papéis claros**: o desktop (pills) e a bar mobile nunca são visíveis ao mesmo tempo, mas ambos ficam no DOM — dar `aria-label="navegação principal"` à bar e manter o `nav` do header sem conflito (opcional: `aria-label="navegação"` nele). `aria-current="page"` na aba/pill ativa, como hoje.
- **Alvos**: 64px de altura × ≥82px de largura por aba; nada de alvos de 36px na navegação primária mobile.
- **Foco visível**: `FOCUS` em todas as abas (anel violeta, offset sobre o vidro).
- **Leitor de tela**: badge `aria-hidden` + contagem no `aria-label` do botão (um anúncio só, sem número solto).
- **Contraste**: só tokens existentes — `muted-foreground`, `primary` e `recall` já são AA nos dois temas em 10–11px (foi o critério de cunhagem deles).
- **Motion**: `transition-colors` apenas; nenhuma animação de entrada/saída da bar (a troca `/revisar` ⇄ resto é corte seco — animar altura de viewport útil = layout shift gratuito).

---

## 7. Não-objetivos (segurar o dev)

1. **Não tocar em `Review.tsx`** nem em nenhuma tela — escopo é o `Shell` do `App.tsx`.
2. **Sem router lib, sem componente de dropdown/popover** — a direção (B) foi descartada justamente pra não criar esse componente.
3. **Sem auto-hide da bar no scroll** (padrão frágil, briga com o sticky header e com leitores de tela).
4. **Sem 5ª aba "Novo"**: criar tema é ação rara — continua no CTA do header; a bar é só navegação.
5. **Sem mudar desktop ≥`md`**: pills, badge, CTA e cluster direito intactos.
6. **Sem tokens novos, sem sólido âmbar** (badge segue tint), sem mexer no `z-index` do header/dock.
7. **Sem estado "sessão ativa" vazando do `Review` pro `Shell`** — a regra é por rota, ponto.

---

## 8. Checklist de aceite

- [ ] **360×800 (e 320px)**: header mostra Logo + wordmark "Fixa" + CTA + tema + sair sem overflow nem truncar; nenhuma pill de nav visível; bar com 4 abas visível.
- [ ] **Bar some em `/revisar`**: na sessão de revisão o dock Revelar/Errei/Acertei fica colado no fundo com safe-area, sem bar atrás nem por cima; ao navegar de volta (logo ou `Voltar aos temas`) a bar reaparece.
- [ ] **Badge**: com 7 pendentes, aba Revisar mostra `7` em âmbar tint mono no canto do ícone; ao avaliar um card e voltar, o número caiu (evento `fx-review-changed`); com 0, sem badge; com 120, `99+`; leitor de tela anuncia "Revisar, 7 pendentes".
- [ ] **Ativa certa em toda rota**: `/` e `/t/:id` → Temas; `/revisar` → (sem bar); `/ajuda` → Ajuda; `/pro` → Pro (agora alcançável no mobile); `/novo` → nenhuma aba ativa, bar visível.
- [ ] **Sem conteúdo engolido**: no fim da Home (e de `/pro`, a mais longa) o último elemento rola pra cima da bar (`pb` do `main` correto), inclusive com safe-area de iPhone.
- [ ] **Desktop intacto (≥768px)**: header idêntico ao atual (pills + badge + CTA completo), zero bar, `main` com `pb-6`.
- [ ] **A11y/identidade**: abas com anel `FOCUS` no teclado, `aria-current` na ativa, ativa em violeta tinta (sem fundo), nenhum emoji/exclamação, números mono `tabular-nums`.
