# DESIGN-PLANOS.md — v2 (reescrita pós-reprovação)

> **Substitui integralmente a v1.** A v1 foi reprovada: cards pequenos e apertados + tabela comparativa separada = layout desconexo e datado; faixa de fundador espremida dentro do card; `max-w-xl` deixou tudo estreito e vertical no desktop; seção da landing genérica.
> **Régua de qualidade:** a Home logada (`DESIGN-HOME.md` — tokens, mono como face de dados, tríade violeta/âmbar/esmeralda). **Anatomia de referência:** pricing de ChatGPT/Figma/Gemini — uma fileira de cards autocontidos, preço grande, CTA full-width logo abaixo do preço, features com ✓ dentro do card, plano pago como herói.
> **Lei:** `docs/PRICING.md`. Todo número e copy de garantia vem de lá — divergência é bug. R$ 19,90/mês · R$ 149/ano (R$ 12,42/mês, ~2,5 meses grátis) · free = 2 temas + 1 geração de degustação + revisões ilimitadas pra sempre · Pro = temas ilimitados + 30 gerações/mês (fair use, máx 10/dia) · fundador R$ 14,90/mês pra sempre (primeiros 100 da lista) · **nunca "ilimitado" perto de geração** · **zero contador fake**.

---

## 1. Direção — o que muda da v1 pra v2

1. **A comparação vive DENTRO dos cards.** A tabela comparativa separada **morre**. Cada card carrega sua lista de features com ✓; no Pro, as exclusivas vêm primeiro. É o DNA ChatGPT/Figma/Gemini: o olho compara dois blocos lado a lado, não sobe e desce entre card e tabela.
2. **CTA sobe.** Anatomia fixa de card: nome → preço grande → tagline (1 linha) → CTA full-width → lista de features. O botão fica na dobra do preço, não enterrado no fim.
3. **Desktop-first.** A reclamação foi "pelo menos no pc". Preço a 40px+ mono, cards com `p-6`/28px de padding, container que respira. Mobile empilha (Pro primeiro).
4. **Pro é o herói; Grátis é quieto.** Borda violeta + sombra tintada + badge flutuando na borda superior no Pro; o Grátis é card neutro sem enfeite. **Proporções iguais (1fr 1fr)** — decisão: ChatGPT/Figma/Gemini não alargam o card pago; o destaque é cromático/elevação, não geométrico. Card mais largo com só 2 planos leria como layout quebrado.
5. **Fundador vira badge + 1 linha**, não caixa tracejada espremida. O badge do herói É a oferta ("preço de fundador"); uma linha curta acima do CTA dá o número e a honestidade.
6. **Fair use e garantia viram rodapé da seção** — 2 linhas discretas centradas, não cards separados.
7. **Honestidade intacta (lei):** sem contador de vagas, sem "ilimitado" em geração, garantia verbatim, pré-billing declarado ("sem cobrança agora — o e-mail só guarda seu lugar").

### 1.1 Decisão: **sem toggle mensal/anual** (vale pros dois lugares)

O segmented control do ChatGPT existe porque lá **vários planos pagos** repreçam de uma vez — o toggle paga o próprio custo. Aqui só o Pro tem preço: um toggle trocaria **um único número** e esconderia a economia anual atrás de um clique (além de exigir estado/JS na landing). Decisão: **mensal grande + anual como linha mono logo abaixo**, sempre visíveis — `R$ 19,90 /mês` + `ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)`. Zero estado, informação completa no primeiro olhar. (Se um dia houver 2º plano pago, reavaliar.)

---

## 2. (A) Tela /pro

### 2.1 Container e zonas

- Rota, pontos de entrada (pill do nav, link do NewTheme) e API (`getConfig`, `joinWaitlist`, `Me`) **como já implementados — não mexer**.
- **Container da página:** `mx-auto w-full max-w-3xl` (768px — sobe do `max-w-xl`/576px da v1; dentro do shell `max-w-4xl`, os 2 cards ficam com ~368px cada, a mesma largura de card do pricing do ChatGPT).
- Zonas, de cima pra baixo:

```
1. HEADER CENTRADO   → eyebrow · h1 · sub · chip de estado do plano
2. CARDS             → mt-8 · grid md:grid-cols-2 gap-4 · Grátis | Pro(herói)
3. RODAPÉ            → mt-8 · fair use (1 linha) + garantia (1-2 linhas), centrado
```

- Sem tabela, sem card de garantia, sem card "assinatura em breve" — as 3 zonas acima são a página inteira.

### 2.2 Header centrado (padrão pricing-hero)

`<div className="text-center">`:

- Eyebrow: `font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground` → **`planos`**.
- `h1`: `mt-2 text-2xl font-bold tracking-tight md:text-[28px]`
  - free: **`O método é grátis. O Pro tira o teto.`** (eco literal do h2 da landing — uma frase de marca, dita igual nos dois lugares)
  - pro: **`Você é Pro`**
- Sub: `mx-auto mt-2 max-w-md text-sm text-muted-foreground`
  - free: **`O método inteiro é grátis, pra sempre. A assinatura Pro ainda não abriu — mas dá pra travar o preço de fundador na lista.`**
  - pro: **`Temas ilimitados e geração direta por IA liberados na sua conta.`**
- Chip de estado: `mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums`
  - free: `bg-secondary text-muted-foreground` → **`free · {cfg.themes}/{cfg.freeLimit} temas ativos`** (uso real do `GET /api/config`)
  - pro: `bg-primary/12 text-primary` + `Crown h-3 w-3` → **`pro`**

### 2.3 Grid dos cards

`mt-8 grid gap-4 md:grid-cols-2` — colunas **iguais** (§1 item 4). Ordem DOM: Grátis → Pro. **No mobile o Pro sobe** (`max-md:order-first` no card Pro): empilhado, o herói abre a dobra — padrão ChatGPT mobile. O `mt-8` também dá folga pro badge que flutua a `-top-3`.

Anatomia comum (a MESMA nos dois cards — é isso que faz parecer sistema):

```
nome do plano        text-sm font-semibold
preço GRANDE         mt-3 · valor + sufixo na mesma baseline
linha-alt do preço   mt-2 · mono 12px (anual no Pro; "sem cartão" no Grátis — mantém os 2 blocos alinhados)
tagline              mt-2 · 1 linha, 13px muted · min-h-[2.5rem] (absorve 1–2 linhas sem desalinhar)
[fundador]           só no Pro · 1–2 linhas
CTA                  h-11 w-full
[microline]          só no Pro · 11px sob o CTA
divisor + features   mt-5 border-t border-border pt-4 · lista com ✓
```

- **Tipografia do preço** (o maior texto do card, e da página): valor `font-mono text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums md:text-[40px]`; sufixo `font-mono text-[13px] text-muted-foreground`, `flex items-baseline gap-2`. Mono porque na Fixa **número é mono** (face de dados da Home) — o preço a 40px vira a assinatura visual da página.
- **Lista de features:** `ul space-y-2.5 text-[13px]`; cada `li` = `flex items-start gap-2.5`; ícone `Check h-4 w-4 shrink-0 text-domain mt-0.5`; texto `text-muted-foreground` com os trechos-chave em `<b className="font-medium text-foreground">`.

### 2.4 Card Grátis (o quieto)

`Card p-6` (rounded-xl default, `border-border`, sem sombra extra, sem badge):

1. Nome: **`Grátis`**
2. Preço: **`R$ 0`** + sufixo **`pra sempre`**
3. Linha-alt: `font-mono text-[12px] text-muted-foreground/80` → **`sem cartão · sem teste que expira`**
4. Tagline: **`tudo que faz fixar: recall, revisão espaçada e a fila do dia.`**
5. CTA slot:
   - viewer **free**: chip estático (é o plano dele — padrão "Your current plan" do ChatGPT): `grid h-11 w-full place-items-center rounded-lg border border-border bg-muted/60 text-sm font-medium text-muted-foreground select-none` → **`Seu plano atual`** (é `<div>`, não botão)
   - viewer **pro**: **slot omitido** (a lista sobe; o card fica mais curto e tudo bem — o herói é o outro)
6. Features (`mt-5 border-t border-border pt-4`), conteúdo exato:
   - ✓ **método completo** — recall + revisão espaçada
   - ✓ revisões diárias **ilimitadas, pra sempre**
   - ✓ até **2 temas** ativos
   - ✓ criação manual — prompt pronto + importar JSON
   - ✓ **1 geração por IA** de degustação
   - ✓ data da prova + meta diária
   - ✓ export dos seus dados, sempre

### 2.5 Card Pro (o herói)

`Card relative p-6 border-primary/50 shadow-xl shadow-primary/10 max-md:order-first`:

1. **Badge flutuando na borda superior** (o tratamento de herói — e é a oferta, não um "MAIS POPULAR" inventado): `absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-primary-foreground`
   - viewer free: **`preço de fundador`**
   - viewer pro: **`seu plano`**
2. Nome: **`Pro`**
3. Preço: **`R$ 19,90`** + sufixo **`/mês`**
4. Linha-alt: `font-mono text-[12px] tabular-nums text-muted-foreground` → **`ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)`**
5. Tagline: **`sem teto de temas, trilha pronta em 1 clique — menos de R$ 0,85 por dia.`**
6. **Oferta de fundador — 1 linha, não caixa** (viewer free apenas): `mt-3 text-[13px] leading-relaxed text-muted-foreground` → **`<b class="font-semibold text-recall">Primeiros 100 da lista: R$ 14,90/mês, pra sempre.</b> Sem contador de vagas — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.`** (âmbar só no trecho forte, como texto; nada de borda tracejada, nada de fundo)
7. CTA (§2.6)
8. Features (`mt-5 border-t border-border pt-4`), **exclusivas primeiro**, conteúdo exato:
   - ✓ **temas ilimitados** — o grátis para em 2
   - ✓ **geração por IA em 1 clique** — a trilha nasce pronta, sem copiar e colar
   - ✓ **30 gerações/mês** — fair use: máx. 10/dia; revisar nunca conta
   - ✓ tudo do Grátis: método completo, revisões ilimitadas, export sempre

### 2.6 CTA + estados (lógica da v1 preservada, slot novo)

Slot fixo de `h-11 w-full` logo após tagline/linha de fundador. A máquina de estados do `WaitlistCta` atual (idle → busy → enviado persistido em `localStorage["fx-pro-waitlist"]="1"` · erro reabilita) **fica como está** — só o visual/posição mudam:

- **free / idle**: `inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 ${FOCUS}` + `Crown h-4 w-4` → **`Garantir preço de fundador`**. Microline embaixo: `mt-2 text-center text-[11px] text-muted-foreground` → **`sem cobrança agora — o e-mail só guarda seu lugar`**.
- **busy**: `disabled`, ícone vira `Loader2 h-4 w-4 animate-spin`, label não muda.
- **enviado** (e persistido no reload): mesmo slot `h-11`, `flex items-center justify-center gap-1.5 rounded-lg border border-domain/40 bg-domain/10 text-sm font-medium text-domain` + `Check h-4 w-4` → **`Na lista — te aviso em {me.email}`**. Microline some.
- **erro**: botão volta habilitado; `mt-2 text-center text-xs text-destructive` → **`não deu — tenta de novo`**.
- **viewer pro**: mesmo slot, chip estático `border border-domain/40 bg-domain/10 text-domain` + `Check` → **`plano ativo na sua conta`**. Sem linha de fundador, sem microline.

### 2.7 Rodapé da seção — fair use + garantia (discretos, sem cards)

`mt-8 space-y-1.5 text-center`:

- Linha 1 (fair use): `font-mono text-[11px] text-muted-foreground` → **`fair use da geração: 30/mês, máx. 10/dia — quem estuda normal usa de 3 a 10; revisar nunca conta`**
- Linha 2 (garantia, **verbatim do PRICING.md**): `mx-auto max-w-xl text-xs leading-relaxed text-muted-foreground` → **`Cancele quando quiser, em 2 cliques. Não fixou em 30 dias? Reembolso integral. E seus dados são seus — exporte tudo a qualquer momento, inclusive no grátis.`**

### 2.8 Skeleton e erro

- Skeleton (mesma geometria do layout final, centrado): `mx-auto h-4 w-16` (eyebrow) · `mx-auto mt-3 h-8 w-72` (h1) · `mx-auto mt-3 h-4 w-96 max-w-full` (sub) · `mt-8 grid gap-4 md:grid-cols-2` com `2× h-[480px] rounded-xl` · `mx-auto mt-8 h-4 w-80` (rodapé). Tudo dentro do `max-w-3xl`.
- Erro de `getConfig`: `Card p-4 text-sm text-destructive` → `erro: {mensagem}` (molde da Home).

### 2.9 Microcopy consolidada /pro (pt-BR)

| Onde | Texto |
|---|---|
| Eyebrow | `planos` |
| h1 | `O método é grátis. O Pro tira o teto.` / `Você é Pro` |
| Sub | free: `O método inteiro é grátis, pra sempre. A assinatura Pro ainda não abriu — mas dá pra travar o preço de fundador na lista.` · pro: `Temas ilimitados e geração direta por IA liberados na sua conta.` |
| Chip | `free · {x}/{y} temas ativos` / `pro` |
| Grátis | `Grátis` · `R$ 0` `pra sempre` · `sem cartão · sem teste que expira` · tagline `tudo que faz fixar: recall, revisão espaçada e a fila do dia.` · CTA `Seu plano atual` |
| Pro | badge `preço de fundador` (pro: `seu plano`) · `Pro` · `R$ 19,90` `/mês` · `ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)` · tagline `sem teto de temas, trilha pronta em 1 clique — menos de R$ 0,85 por dia.` |
| Fundador | `Primeiros 100 da lista: R$ 14,90/mês, pra sempre.` + `Sem contador de vagas — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.` |
| CTA | `Garantir preço de fundador` · micro `sem cobrança agora — o e-mail só guarda seu lugar` · enviado `Na lista — te aviso em {email}` · erro `não deu — tenta de novo` · pro `plano ativo na sua conta` |
| Rodapé | fair use + garantia verbatim (§2.7) |

---

## 3. (B) Landing — seção `#planos`

### 3.1 O que fica e o que muda

**Fica:** posição (entre `#importar` e `#duvidas`), faixa `style="background:var(--bg-2);border-block:1px solid var(--line)"`, link `Planos` no nav, FAQ de preço, ajustes do `#cta` — tudo já no ar, **não tocar**.
**Muda:** o miolo da seção — mesma anatomia de card da /pro traduzida pro CSS próprio da landing. Header da seção passa a **centrado** (pricing pede simetria: cards centrados sob header à esquerda ficam desequilibrados); as demais seções continuam com sec-head à esquerda.

### 3.2 CSS — substituir o bloco `/* plans */` inteiro por este

```css
/* plans */
.sec-head.center { margin-inline: auto; text-align: center; }
.sec-head.center p { margin-inline: auto; }
.plans { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch;
  max-width: 880px; margin: 48px auto 0; }
.pcard { position: relative; display: flex; flex-direction: column; background: var(--card);
  border: 1px solid var(--line); border-radius: var(--r); padding: 30px 28px; }
.pcard.pro { border-color: color-mix(in srgb, var(--brand) 60%, var(--line));
  box-shadow: 0 20px 60px -28px var(--brand); }
.flag { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); white-space: nowrap;
  background: var(--brand); color: var(--brand-ink); font-family: var(--mono); font-size: 10px;
  font-weight: 600; letter-spacing: .14em; text-transform: uppercase; padding: 5px 13px; border-radius: 999px; }
.plan-name { font-size: 16px; font-weight: 700; }
.price { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; }
.price b { font-family: var(--mono); font-size: clamp(40px, 4.6vw, 48px); font-weight: 700;
  letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
.price span { font-family: var(--mono); font-size: 13px; color: var(--muted); }
.price-alt { font-family: var(--mono); font-size: 12px; color: var(--faint); margin-top: 8px; min-height: 18px; }
.ptag { font-size: 14px; color: var(--muted); margin: 10px 0 0; min-height: 44px; }
.founder-line { font-size: 13px; color: var(--muted); line-height: 1.55; margin: 12px 0 0; }
.founder-line b { color: var(--recall); }
.pcard .btn { justify-content: center; width: 100%; margin-top: 16px; }
.pnote { font-family: var(--mono); font-size: 11px; color: var(--faint); text-align: center;
  margin-top: 10px; letter-spacing: .03em; }
.pfeat { list-style: none; margin: 22px 0 0; padding: 20px 0 0; border-top: 1px solid var(--line);
  display: grid; gap: 11px; font-size: 14.5px; color: var(--muted); align-content: start; }
.pfeat li { display: flex; align-items: flex-start; gap: 10px; }
.pfeat svg { flex: none; margin-top: 4px; color: var(--domain); }
.pfeat b { color: var(--ink); font-weight: 600; }
.plans-foot { margin-top: 28px; display: flex; flex-direction: column; gap: 8px;
  align-items: center; text-align: center; }
.plans-foot .cost { font-family: var(--mono); font-size: 13px; color: var(--recall); }
.plans-foot .g { color: var(--muted); font-size: 13.5px; max-width: 62ch; margin: 0; }
@media (max-width: 700px) { .plans { grid-template-columns: 1fr; } .pcard.pro { order: -1; }
  .ptag { min-height: 0; } }
```

Notas: `.founder`, `.soon` e as regras antigas **saem** (mortas). `.flag` sólido brand = mesma gramática do `.btn`; `min-height` em `.price-alt`/`.ptag` mantém os dois blocos de preço e os CTAs na mesma linha horizontal no desktop (o Pro desce só pela `.founder-line`, o que é aceitável — é o herói). Preço em `--mono` = face de dados da marca, agora também na landing. Check svg (inline por `li`): `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>`.

### 3.3 HTML da seção (substitui o miolo atual; `[✓]` = svg acima)

```html
<section id="planos" style="background:var(--bg-2);border-block:1px solid var(--line)">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Planos</span>
      <h2>O método é grátis. O Pro tira o teto.</h2>
      <p>Revisar todo dia não custa nada — é o hábito que faz fixar. O Pro é a trilha pronta em 1 clique, por menos de R$ 0,85 por dia.</p>
    </div>
    <div class="plans">
      <div class="pcard">
        <div class="plan-name">Grátis</div>
        <div class="price"><b>R$ 0</b><span>pra sempre</span></div>
        <div class="price-alt">sem cartão · sem teste que expira</div>
        <p class="ptag">Tudo que faz fixar: recall, revisão espaçada e a fila de revisão do dia.</p>
        <a href="/temas" class="btn ghost">Começar grátis</a>
        <ul class="pfeat">
          <li>[✓] <span><b>método completo</b> — recall + revisão espaçada</span></li>
          <li>[✓] <span>revisões diárias <b>ilimitadas, pra sempre</b></span></li>
          <li>[✓] <span>até <b>2 temas</b> ativos</span></li>
          <li>[✓] <span>criação manual — prompt pronto + importar JSON</span></li>
          <li>[✓] <span><b>1 geração por IA</b> de degustação</span></li>
          <li>[✓] <span>data da prova + meta diária</span></li>
          <li>[✓] <span>export dos seus dados, sempre</span></li>
        </ul>
      </div>
      <div class="pcard pro">
        <span class="flag">preço de fundador</span>
        <div class="plan-name">Pro</div>
        <div class="price"><b>R$ 19,90</b><span>/mês</span></div>
        <div class="price-alt">ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)</div>
        <p class="ptag">Sem teto de temas e com a trilha nascendo pronta, em 1 clique.</p>
        <p class="founder-line"><b>Primeiros 100 da lista: R$ 14,90/mês, pra sempre.</b> Sem contador de vagas — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.</p>
        <a href="#cta" class="btn">Garantir preço de fundador</a>
        <div class="pnote">// ainda não cobramos nada — o e-mail só guarda seu lugar</div>
        <ul class="pfeat">
          <li>[✓] <span><b>temas ilimitados</b> — o grátis para em 2</span></li>
          <li>[✓] <span><b>geração por IA em 1 clique</b> — a trilha nasce pronta, sem copiar e colar</span></li>
          <li>[✓] <span><b>30 gerações/mês</b> — fair use: máx. 10/dia; revisar nunca conta</span></li>
          <li>[✓] <span>tudo do Grátis: método completo, revisões ilimitadas, export sempre</span></li>
        </ul>
      </div>
    </div>
    <div class="plans-foot">
      <span class="cost">reprovar numa certificação de US$ 100+ custa mais que 3 anos de Fixa</span>
      <p class="g">Cancele quando quiser, em 2 cliques. Não fixou em 30 dias? Reembolso integral. E seus dados são seus — exporte tudo a qualquer momento, inclusive no grátis.</p>
    </div>
  </div>
</section>
```

### 3.4 CTAs da landing

- **Grátis** → `/temas` (`btn ghost`) — mesmo destino do resto da página.
- **Pro** → âncora **`#cta`** (`btn` sólido) — reaproveita o form de e-mail existente; um form, um endpoint, zero JS novo. A copy do `#cta` já fala do preço de fundador (fecha o circuito), **não mexer**.
- `.plans-foot` = rodapé de fair use/garantia da landing: a linha "reprovar custa mais" (âmbar mono, eco do `.loop-foot` do método) + garantia verbatim. Fair use na landing mora na própria feature do Pro (linha 3) — não repetir.

---

## 4. (C) Coerência entre superfícies

1. **Sem toggle mensal/anual em lugar nenhum** (§1.1) — os dois preços sempre visíveis, mesma fórmula (`19,90 grande` + linha anual mono) nos dois lugares.
2. **Mesma anatomia de card** nos dois lugares: nome → preço grande mono → linha-alt → tagline → [fundador] → CTA full-width → divisor → features com ✓ exclusivas-primeiro no Pro. Mesmo herói (borda brand + sombra tintada + badge `preço de fundador` flutuante), mesmo mobile (Pro primeiro).
3. **Nav e links inalterados**: pill `Pro` no app, link `Planos` no nav da landing, banner do NewTheme, rota — tudo como está. Esta entrega só troca o miolo visual das duas seções.
4. **Strings compartilhadas** (grep deve achar idênticas nos dois lugares): h2/h1 `O método é grátis. O Pro tira o teto.` · linha anual · linha de fundador · `Garantir preço de fundador` · garantia verbatim · `sem cartão · sem teste que expira`.

---

## 5. Não-objetivos (segurar o dev)

1. **Zero tabela comparativa separada** — se sobreviver qualquer `<table>`/grid de comparação fora dos cards, a entrega está errada. Apagar `ROWS`, `Cell` e `CompareTable` do `Pro.tsx`.
2. **Sem toggle/segmented control** mensal-anual — decisão fechada (§1.1).
3. **Nada de billing**: sem checkout, sem cartão — Stripe/Mercado Pago é outra entrega.
4. **Zero urgência fabricada**: sem contador regressivo, sem "restam X vagas", sem "só hoje" — em nenhuma superfície. A expiração da oferta é a remoção manual do aviso (documentado na copy).
5. **Nunca "ilimitado" encostado em geração por IA** (lei do PRICING) — conferir cada string contra §2.9/§3.3.
6. **Sem "MAIS POPULAR"** ou social proof inventado — o badge do herói é a oferta real (`preço de fundador`).
7. **Sem comparação com Anki**/concorrentes; a única comparação é com o custo de reprovar.
8. **Sem API nova** (`GET /api/config` e `POST /api/waitlist` como estão) e sem mudar a máquina de estados do waitlist — só reposicionar/reestilizar.
9. **Sem webfonts/tokens novos no app**; na landing, só o bloco `/* plans */` do §3.2 (remover `.founder`/`.soon` mortos). Hero, nav, FAQ, `#cta`, footer: intocados.
10. **Sem upsell fora daqui**: Home, Revisar e Track não ganham banner/CTA de plano.

---

## 6. Checklist de aceite

- [ ] **No desktop 1440px a seção parece uma página de pricing de produto sério, no nível visual da Home logada** — cards ~368px lado a lado, preço mono 40px+ dominando cada card, CTA na dobra do preço, ar entre os blocos. Teste do estranho: um print da /pro ao lado do pricing do ChatGPT não parece duas gerações de produto diferentes.
- [ ] **Zero tabela separada** — a comparação inteira vive nas listas dos cards; `CompareTable`/`ROWS`/`Cell` não existem mais no código.
- [ ] Anatomia idêntica nos 2 cards e nas 2 superfícies: nome → preço → linha-alt → tagline → CTA full-width → divisor → features ✓; Pro com exclusivas primeiro e badge `preço de fundador` flutuando na borda superior.
- [ ] **Paridade com PRICING.md** (grep nas duas superfícies): `19,90` · `149` · `12,42` · `14,90` · `até 2` · `1 geração por IA` · `30` · `10/dia` · `0,85` — nenhum número divergente, nenhum "ilimitado" encostado em geração, **nenhum contador/timer renderizado**.
- [ ] **Garantia oficial verbatim** no rodapé da /pro e no `.plans-foot` da landing — sem paráfrase; fair use legível sem interação (linha do rodapé na /pro; feature do card Pro na landing).
- [ ] Fundador = badge + 1 linha de texto; **não existe mais caixa tracejada** dentro do card.
- [ ] /pro free: chip `free · {x}/{y} temas ativos` com uso real; card Grátis mostra `Seu plano atual` estático; CTA do Pro roda idle → busy → enviado (persistido em `fx-pro-waitlist` no reload) → erro reabilita com mensagem.
- [ ] /pro pro: h1 `Você é Pro`, badge `seu plano`, chip `plano ativo na sua conta`; sem linha de fundador e sem waitlist em lugar nenhum.
- [ ] Landing: header da seção centrado; faixa `bg-2` e posição entre `#importar`/`#duvidas` mantidas; CTA Grátis → `/temas`, CTA Pro → `#cta`; `.founder`/`.soon` removidos do CSS; íntegra nos temas claro e escuro (checar `.flag` e sombra do `.pcard.pro` no light).
- [ ] Mobile 390px: cards empilham com **Pro primeiro** nas duas superfícies; badge não corta; CTAs com 44px de altura e foco visível (`FOCUS` do App na /pro; `:focus-visible` global na landing).
- [ ] Skeleton da /pro tem a geometria do layout final (header centrado + 2 cards `~h-[480px]` + rodapé) — sem pulo de layout na carga.
