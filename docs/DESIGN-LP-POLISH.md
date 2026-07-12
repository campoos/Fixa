# DESIGN-LP-POLISH — Hero mobile + Footer da landing

Spec cirúrgica para `web/public/fixa.html`. Duas áreas: (A) hero no mobile, (B) footer.
Somente spec — nada foi aplicado no HTML ainda.

---

## (A) Hero mobile — decisão: **Opção 1, banda inferior com a curva**

### Diagnóstico (validado no código)

- O canvas `#memcanvas` cobre o hero inteiro (`inset: 0`) e a curva desenha na banda
  vertical `H*0.36 → H*0.88` (função `yBase`, no IIFE do canvas, ~linha 531).
- No mobile o texto ocupa 100% da largura exatamente sobre essa banda, e o overlay
  `.hero::before` (gradiente a `100deg`, calibrado para a coluna de texto à esquerda
  do desktop) apaga o que sobra. Resultado: caixa preta com texto, zero identidade.
- O vão CTAs → "O MÉTODO" soma ~122px vazios no mobile: `padding-bottom: 48px` do
  hero (media 560) + `padding: 74px 0` do `#metodo`.

A banda inferior resolve os dois problemas com um movimento só: a curva passa a
desenhar **abaixo dos CTAs**, sem competir com o texto, e o vão vazio vira o palco
dela. Glow radial (opção 2) preencheria, mas é genérico — a curva do esquecimento
sendo vencida É a marca; no mobile ela só precisa de um lugar próprio.

### Spec CSS

No bloco `@media (max-width: 560px)` já existente (~linha 200), alterar/adicionar:

```css
@media (max-width: 560px) {
  /* ...regras existentes... */
  .hero { padding-top: 56px; padding-bottom: 168px; }  /* era 48px: abre a banda da curva */
  /* overlay vira vertical: protege o texto em cima, libera a banda embaixo */
  .hero::before {
    background: linear-gradient(180deg,
      var(--bg) 0%,
      color-mix(in srgb, var(--bg) 85%, transparent) 52%,
      transparent 74%);
  }
  #memcanvas { opacity: .62; }  /* era .5 global: na banda não compete com nada, pode viver mais */
}
```

Racional dos valores:
- `padding-bottom: 168px` = ~120px de banda útil da curva + 30–40px de respiro até a
  borda do hero. Substitui o vão morto por conteúdo vivo — não estica a página.
- Gradiente `180deg`: opaco até ~52% da altura (onde ficam tag/título/lead/CTAs),
  transparente de 74% pra baixo (a banda). A transição fica no respiro entre CTAs
  e curva, então nunca há curva sob texto.
- `opacity .62` só no mobile; desktop permanece `.5`.

### Spec JS (canvas)

Em `web/public/fixa.html`, dentro do IIFE do canvas, **substituir apenas a função
`yBase`** (~linha 531):

```js
function yBase(f) {
  // mobile: banda inferior fixa em px (não compete com o texto);
  // desktop: banda proporcional original
  var top, bottom;
  if (W <= 560) { top = H - 130; bottom = H - 22; }
  else          { top = H * 0.36; bottom = H * 0.88; }
  return bottom - (bottom - top) * retention(f);
}
```

Notas de implementação:
- `W`/`H` já são atualizados pelo `size()` no `resize`, e `yBase` lê os dois a cada
  frame — a troca de banda é automática ao rotacionar/redimensionar, sem tocar mais nada.
- Banda mobile em **px absolutos** (108px de altura) e ancorada no fundo (`H - …`):
  fica determinística independente da altura total do hero.
- Amplitudes existentes cabem na banda: wobble ±4.5px, pontos r≈3.2px, anel até 20px —
  nada estoura os 108px nem os 22px de margem inferior.
- A linha tracejada dos 100% (`yBase(0)`) passa a emoldurar o topo da banda — manter,
  é sutil (alpha 0.12) e dá estrutura.
- `prefers-reduced-motion` continua escondendo o canvas (comportamento atual, ok) —
  o padding extra do hero vira só respiro, sem regressão.

---

## (B) Footer — redesenho

### Causa dos fios/sublinhados fantasmas (bug real, corrigir primeiro)

As colunas do footer são `<nav class="foot-col">` (linhas 453 e 459 do markup). O
seletor global **de elemento** escrito para o topo da página (~linha 42) vaza para elas:

```css
nav { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg) 82%, transparent); border-bottom: 1px solid var(--line); }
```

Cada coluna herda `border-bottom: 1px solid var(--line)` — o "sublinhado fantasma"
que aparece colado sob o último link de cada coluna — além de fundo translúcido com
blur e `position: sticky` que não deveriam estar ali. Não é decoração de link nem
`text-decoration` (o global `a` já zera): é vazamento de seletor.

**Fix (1 linha, sem tocar no markup):** escopar o seletor para o nav de topo:

```css
body > nav { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg) 82%, transparent); border-bottom: 1px solid var(--line); }
```

O nav do topo é filho direto de `body`; os do footer estão aninhados em
`footer > .wrap > .foot-top`, então param de casar. Cinto e suspensório na própria
regra nova do footer: `.foot-col { position: static; border: 0; background: none; }`
e `.foot-col a { text-decoration: none; border: 0; }`.

### Spec completa (substituir o bloco de CSS do footer, ~linhas 180–191)

Mantém exatamente o conteúdo atual (marca+tagline, colunas produto/conta, © + tagline
mono). Fundo `--bg-2` para peso de fechamento — mesma lógica das seções `#recursos`
e `#planos`, fechando a página no mesmo ritmo de alternância.

```css
footer { background: var(--bg-2); border-top: 1px solid var(--line);
  padding: 64px 0 36px; color: var(--faint); font-size: 14px; }
.foot-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 40px 48px; align-items: start; }
.foot-top .brand { font-size: 17px; }
.foot-tag { font-family: var(--mono); font-size: 12px; color: var(--muted);
  margin: 12px 0 0; letter-spacing: .04em; line-height: 1.6; max-width: 26ch; }
.foot-col { display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
  position: static; border: 0; background: none; }
.foot-h { font-family: var(--mono); font-size: 11px; text-transform: uppercase;
  letter-spacing: .16em; color: var(--brand-2); margin-bottom: 4px; }
.foot-col a { color: var(--muted); font-size: 14px; line-height: 1.2; padding: 2px 0;
  text-decoration: none; border: 0; }
.foot-col a:hover { color: var(--ink); }
.foot-bottom { display: flex; flex-wrap: wrap; gap: 10px 16px; justify-content: space-between;
  align-items: baseline; border-top: 1px solid var(--line); margin-top: 48px; padding-top: 24px; }
.foot-bottom > span:first-child { color: var(--muted); font-size: 13px; }
.disc { font-family: var(--mono); font-size: 11px; color: var(--faint); letter-spacing: .04em; }
@media (max-width: 560px) {
  footer { padding: 48px 0 32px; }
  .foot-top { grid-template-columns: 1fr 1fr; gap: 32px 24px; }
  .foot-top > div:first-child { grid-column: 1 / -1; }
  .foot-bottom { margin-top: 40px; }
}
```

O que muda e por quê:
- **Fundo `--bg-2` + padding 64/36**: fechamento com peso, ecoando `#recursos`/`#planos`.
- **Headers `.foot-h`**: sobem de 10px `--faint` (apagados) para 11px **`--brand-2`**,
  tracking .16em — mesma família visual do `.eyebrow` das seções; hierarquia clara sem
  gritar.
- **Links**: 13.5px→14px, cor `--muted`→`--ink` no hover (já era), `gap` 9px→12px +
  `padding: 2px 0` — ritmo firme e alvo de toque ≥24px no mobile.
- **Tagline**: `--faint`→`--muted`, 11→12px, `line-height 1.6`, `max-width: 26ch` e
  `margin-top: 12px` — respira sob a marca em vez de ficar espremida.
- **Colunas**: `1fr auto auto` → `1.5fr 1fr 1fr` com gap fixo — colunas com corpo em
  vez de encostadas na direita.
- **Linha do ©**: `margin-top` 32→48px, `padding-top` 18→24px, © em `--muted` 13px
  (âncora), `.disc` mono permanece `--faint` (assinatura), alinhados por `baseline`.
- **Mobile ≤560px**: marca+tagline em largura cheia, colunas produto/conta lado a lado
  (2 col), padding reduzido — mesmo breakpoint que já existia, agora com gaps explícitos.

---

## Checklist de verificação (5 itens)

1. **Mobile ≤560px**: curva desenha viva na banda sob os CTAs, nenhum trecho dela
   passa por baixo de texto, e o vão CTAs→"O MÉTODO" não parece mais vazio.
2. **Desktop >560px**: hero idêntico ao atual (banda `0.36H–0.88H`, overlay `100deg`,
   opacity .5) — zero regressão; redimensionar a janela cruzando 560px troca a banda
   sem quebrar a animação.
3. **Footer sem fios**: nenhum traço/borda sob os links das colunas em dark e light
   (inspecionar `.foot-col`: sem `border-bottom`, sem `backdrop-filter`, `position: static`).
4. **Hierarquia do footer**: headers PRODUTO/CONTA legíveis em `--brand-2`, links com
   ritmo de 12px de gap, tagline com respiro sob a marca, © com 24px acima — nos dois temas.
5. **Nav do topo intacto**: sticky, blur e border-bottom continuam funcionando após o
   escopo `body > nav`; `prefers-reduced-motion` segue sem canvas e sem buraco estranho.
