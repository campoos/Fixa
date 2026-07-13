# Tutor — copy nas superfícies de plano e ajuda (spec cirúrgica)

> **Lei:** `docs/PRICING.md` — Tutor: free **5 de degustação** (lifetime) · Pro **100/mês** (fair use).
> Nome oficial da feature nas superfícies: **correção do Tutor** (o que ela devolve: nota 0–10, acertos, gaps com correção, dica de fixação — `DESIGN-TUTOR-IA.md` §3).
> Regras de tom: direto, sem exclamação, **nunca "ilimitado" perto de recurso medido**, `<B>`/`<b>` só no trecho forte, números em destaque.

---

## (a) `/pro` — `web/src/screens/Pro.tsx`

### FREE_FEATURES — 1 linha nova, posição 6 (logo após a linha da geração de degustação)

As duas degustações de IA ficam adjacentes, na mesma ordem da tabela do PRICING (geração → Tutor). Lista vai de 7 pra 8 itens.

```tsx
const FREE_FEATURES: ReactNode[] = [
  <><B>método completo</B> — revisões no tempo certo</>,
  <>revisões diárias <B>ilimitadas, pra sempre</B></>,
  <>até <B>2 temas</B> ativos</>,
  <>criação manual — prompt pronto + JSON</>,
  <><B>1 geração por IA</B> de degustação</>,
  <><B>5 correções do Tutor</B> de degustação</>,   // ← NOVA
  <>data da prova + meta diária</>,
  <>export dos seus dados, sempre</>,
];
```

### PRO_FEATURES — 2 linhas novas, posições 4 e 5 (depois da cota de gerações, antes de "tudo do Grátis incluso")

Mesmo padrão da geração: linha de capacidade + linha de cota. Exclusivas continuam antes do "tudo do Grátis incluso" (regra do `DESIGN-PLANOS.md`: exclusivas primeiro).

```tsx
const PRO_FEATURES: ReactNode[] = [
  <><B>temas ilimitados</B> — o grátis para em 2</>,
  <><B>geração por IA em 1 clique</B></>,
  <><B>30 gerações/mês</B> (máx. 10/dia)</>,
  <><B>correção do Tutor</B> — nota, acertos e gaps por IA</>,   // ← NOVA
  <><B>100 correções/mês</B></>,                                  // ← NOVA
  <>tudo do Grátis incluso</>,
];
```

> Sem "(fair use)" no card: o número mensal já é o limite comunicado; jargão em inglês não paga o espaço. O enforcement fica no server (PRICING).
> Nada mais muda em `Pro.tsx` — título, subs e CTAs ficam como estão.

---

## (b) Ajuda — `web/src/screens/Ajuda.tsx`

### FAQ nova — grupo **"o método"**, posição 3 (logo após "Qual a diferença entre concluída e dominada?")

Vai no grupo do método, não em "conta e plano": a correção é o fecho do passo Confere — os limites entram na resposta, mas a pergunta é sobre o que a feature é. Grupo passa de 5 pra 6 itens.

```tsx
{
  q: "O que é a correção do Tutor?",
  a: (
    <>
      Ao fechar uma task, o Tutor lê a resposta que você escreveu e devolve <B>nota 0–10</B>, os acertos, os gaps (com a correção) e uma dica de fixação. Ele corrige com base no material da task, não na internet — e a nota <B>não mexe nas caixas</B>: o Acertei/Errei da revisão continua sendo seu. No grátis você tem <B>5 correções</B> de degustação, uma cortesia única; no Pro, <B>100 por mês</B>. É correção por IA — pode errar; desconfie, confira, aprenda.
    </>
  ),
},
```

### FAQ existente "O que é grátis e o que é do Pro?" (grupo "conta e plano") — atualizar pra paridade

Resposta final (só as enumerações mudam):

```tsx
a: (
  <>
    O método inteiro é grátis pra sempre: <B>revisões ilimitadas</B>, até <B>2 temas</B> ativos, fluxo manual sem limite, <B>1 geração por IA</B> e <B>5 correções do Tutor</B> de degustação. O Pro tira o teto: <B>temas ilimitados</B>, <B>30 gerações por IA/mês</B> (máx. 10/dia) e <B>100 correções do Tutor/mês</B>. Os detalhes e preços estão na aba <B>Pro</B>.
  </>
),
```

### Card 02 do método ("Confere em dois tempos") — SIM, ganha 1 frase

Decisão: muda. O Tutor fecha exatamente o buraco que esse card descreve (a autoavaliação solitária do Confere — `DESIGN-TUTOR-IA.md` §1); ignorá-lo aqui deixaria a seção do método desatualizada com a feature no ar. Uma frase curta no fim, sem números (limite é assunto da FAQ/planos):

```tsx
{ n: "02", tag: "corrige", icon: Eye, t: "Confere em dois tempos", d: "Revele primeiro só os pontos-chave e ache o que faltou; responda de novo e só então confira a resposta. Erro percebido fixa mais que acerto fácil. No fim, o Tutor pode corrigir por IA — nota, acertos e gaps." },
```

Os outros 3 cards não mudam.

---

## (c) Landing — `web/public/fixa.html`

### Card Grátis (`.pcard`) — 1 `<li>` novo, logo após o `<li>` da "1 geração por IA de degustação" (hoje linha ~387)

```html
<li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg> <span><b>5 correções do Tutor</b> de degustação</span></li>
```

### Card Pro (`.pcard.pro`) — 2 `<li>` novos, entre "30 gerações/mês (máx. 10/dia)" e "tudo do Grátis incluso" (hoje entre as linhas ~404 e ~405)

```html
<li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg> <span><b>correção do Tutor</b> — nota, acertos e gaps por IA</span></li>
<li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg> <span><b>100 correções/mês</b></span></li>
```

### FAQ de preço da landing ("Quanto custa? O grátis expira?", `#duvidas`) — SIM, muda

Só a cláusula do Pro é enumerativa; ela ganha o Tutor. Texto final do `.ans`:

```html
<div class="ans">O grátis não expira: método completo, revisões ilimitadas e até 2 temas ativos — sem cartão. O Pro custa R$ 19,90/mês (ou R$ 149/ano) e libera temas ilimitados, 30 gerações por IA e 100 correções do Tutor por mês. Cancele quando quiser. Reembolso em até 30 dias. Seus dados são exportáveis, sempre.</div>
```

Nenhuma FAQ nova na landing — "o que é o Tutor" é conversa de produto logado; a landing só precisa da paridade de preço.

---

## (d) Checklist

- [ ] **Paridade com PRICING.md** — free `5` de degustação e Pro `100/mês` idênticos nas 3 superfícies (Pro.tsx, Ajuda.tsx, fixa.html) e nas 2 FAQs de plano; nenhum número inventado (sem cota diária pro Tutor — ela não existe no PRICING).
- [ ] **Zero "ilimitado" em recurso medido** — grep por `ilimitad` nos 3 arquivos: só pode aparecer em revisões e temas (Pro); nunca na mesma linha de geração ou correção.
- [ ] **Tom** — nenhuma exclamação nas inserções; listas em minúsculas no padrão vigente; `<B>`/`<b>` só no trecho forte; disclaimer "pode errar; desconfie, confira, aprenda" presente na FAQ do Tutor (Ajuda).
- [ ] **Padrão estrutural** — nas duas superfícies de card a anatomia é a mesma (degustações adjacentes no Grátis; no Pro, capacidade + cota antes de "tudo do Grátis incluso"); JSX usa `<B>`, HTML usa `<b>` + o mesmo `<svg>` de check das linhas vizinhas.
