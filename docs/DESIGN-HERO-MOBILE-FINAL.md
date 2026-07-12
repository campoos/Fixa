# DESIGN — Hero mobile FINAL (≤560px)

> Iteração 5 e definitiva. Sintetiza o que o dono validou: o FLUXO do original + curva viva sem sujeira.
> Desktop (>560px) **não muda um pixel**.

## Composição decidida (racional em 3 linhas)

1. **Fluxo natural de volta** (tag → h1 → lead → CTAs a 28px do lead → 1 linha mono "revisa em"): era o que funcionava no original. Zero auto-margin, zero 100svh — o vão morto das iterações 2–4 nasceu de separar CTA do conteúdo; isso morre aqui.
2. **A curva ganha uma banda própria no PÉ do hero** (padding-bottom de 236px reserva o palco; o canvas comprime a geometria pra `H−216 … H−44` só no mobile). Ela nunca cruza texto, então o overlay que a matava vira um véu mínimo no topo e a curva aparece **inteira e viva** (opacity .8) — background de verdade, não banda separada no layout (aprendizado da iteração 3: continua sendo o mesmo canvas full-bleed do hero).
3. **Ruído resolvido sem perder identidade**: `.hero-note` ("// sem cartão…") morre de vez no mobile; a régua de chips vira **UMA linha compacta mono** — `REVISA EM 1d·2d·3d·4d·7d·15d·21d·30d` — reaproveitando o HTML existente (chips sem borda/fundo, separador `·` via CSS, chip "graduou" oculto pra caber em 320px). É o fecho do bloco de conteúdo e conversa com a curva logo abaixo.

Altura: **auto**. Com esse conteúdo + banda, o hero fecha em ~700–720px num phone de 360px — ocupa a tela quase inteira "por mérito", sem esticar à força.

## CSS — bloco @media 560 do hero, pronto pra colar

Substituir, dentro de `@media (max-width: 560px)` (hoje linhas ~212–220 de `web/public/fixa.html`), **todo o trecho do hero** (de `.hero-tag { font-size…` até `#memcanvas { opacity: .62; }`) por:

```css
    .hero-tag { font-size: 10.5px; letter-spacing: .07em; }
    /* hero FINAL: fluxo natural (tag→h1→lead→CTAs→régua) + banda da curva no pé.
       Nada de 100svh nem auto-margin: o conteúdo dita a altura, a curva fecha o quadro. */
    .hero { min-height: 0; padding: 48px 0 236px; display: block; }
    .hero .wrap { display: block; }
    .hero h1 { margin-top: 20px; }
    .hero p.lead { margin-top: 18px; }
    .hero-cta { margin-top: 28px; padding-top: 0; gap: 10px; }
    .hero-cta .btn { flex: 1; justify-content: center; min-width: 140px; }
    .hero-note { display: none; }               /* morto de vez no mobile */
    /* régua vira UMA linha mono compacta: REVISA EM 1d·2d·3d·4d·7d·15d·21d·30d */
    .ladder { display: flex; flex-wrap: nowrap; margin-top: 16px; gap: 0; overflow: hidden; }
    .ladder .lab { margin-right: 8px; flex: none; }
    .ladder .chip { border: 0; background: transparent; padding: 0; font-size: 11px;
      letter-spacing: .02em; color: var(--faint); border-radius: 0; }
    .ladder .chip.on { color: var(--recall); }
    .ladder .chip + .chip::before { content: '·'; margin: 0 4px; color: var(--faint); }
    .ladder .chip[style*="dashed"] { display: none; }  /* "graduou" não cabe em 320px */
    /* curva confinada à banda inferior (ver JS) → overlay vira só um véu no topo */
    .hero::before { background: linear-gradient(180deg, var(--bg) 0%, transparent 30%); }
    #memcanvas { opacity: .8; }
```

Observações:
- `display: block` desfaz o flex-column da iteração 4 nos dois níveis (`.hero` e `.wrap`).
- `padding-bottom: 236px` é o palco da curva (216px de banda + 20px de respiro até a próxima section). Sem `env(safe-area-inset-bottom)` — nada mais ancora no viewport.
- Os botões dividem uma linha em ≥360px (`flex: 1`) e quebram limpos em 320px (`min-width: 140px` + `flex-wrap` herdado).
- Nenhuma mudança de HTML: a linha "revisa em" é o `.ladder` existente re-estilizado.

## Canvas — mudança no JS (exata)

Em `yBase` (IIFE do `#memcanvas`, ~linha 547), trocar:

```js
    function yBase(f) {
      var top = H * 0.36, bottom = H * 0.88;
      return bottom - (bottom - top) * retention(f);
    }
```

por:

```js
    function yBase(f) {
      // mobile: a curva vive numa banda própria no pé do hero (o texto flui livre acima);
      // desktop: geometria original intocada.
      var top, bottom;
      if (W <= 560) { top = H - 216; bottom = H - 44; }
      else { top = H * 0.36; bottom = H * 0.88; }
      return bottom - (bottom - top) * retention(f);
    }
```

É a única mudança de JS. `W` já é atualizado por `size()` no resize, então a troca de geometria acompanha rotação/resize sozinha. A linha tracejada dos 100% (`yBase(0)`) passa a viver dentro da banda — nunca sob o texto. Amplitude da banda (172px) preserva o drama dos vales sem achatar a história da curva.

## Checklist (4 itens)

1. **360×740**: tag → título → lead → botões (1 linha) → `REVISA EM 1d·2d·…·30d` em fluxo contínuo sem vão morto; abaixo, a curva do esquecimento inteira e nítida na banda, pontos amarelos pulsando e tracejada dos 100% visível — nenhum traço do canvas cruza texto.
2. **320×568**: linha "revisa em" cabe em 1 linha ("graduou" oculto), botões quebram em 2 linhas sem overflow horizontal, hero termina e a section "O método" começa com respiro normal.
3. **Dark e light**: véu do topo (`--bg` → transparent a 30%) funde nav/tag com o fundo nos dois temas; curva a .8 de opacidade legível nos dois.
4. **Desktop 561px+ pixel-idêntico** (curva 36–88% da altura, overlay diagonal, nota `// sem cartão` e chips com borda visíveis) e `prefers-reduced-motion` continua sem canvas.
