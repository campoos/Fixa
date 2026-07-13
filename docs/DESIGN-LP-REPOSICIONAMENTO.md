# Reposicionamento da landing — beachhead cert + história de origem (spec cirúrgica)

> **Origem:** decisão do dono (13/07) pós `PARECER-CEO.md` (veredito §1 + P3 §3 + §8 item 2):
> o produto continua AMPLO, mas a **apresentação lidera com a história real** — "o Fixa nasceu
> quando eu quis tirar nota mais alta na certificação do Claude (Anthropic) — e me enquadrei
> no escopo de aprovação em 1,5 semana". Certificação de tecnologia/IA é a porta de entrada
> (early adopter, reprovação custa US$100–300 — CEO §4/§5); o "qualquer tema" vira segundo
> ato, não manchete.
> **Arquivo tocado:** `web/public/fixa.html` (somente TEXTO + 1 seção nova + 1 bloco de CSS
> novo). **Canvas/animação do hero e layout mobile do hero: INTOCÁVEIS** (congelados pelo dono).
> **Regras de verdade:** a prova AINDA NÃO foi feita — nunca escrever "passei/nota X"; a
> formulação verificável é "me enquadrei no escopo de aprovação em 1,5 semana".
> Tom: direto, zero exclamação, sem hype de IA, números em destaque mono.

---

## 0. Estratégia em 1 parágrafo (contra quem, pra quem)

O CEO §5 mostra: não dá pra ganhar de Anki (grátis+culto), QConcursos/Estratégia (conteúdo de
banca) nem Quizlet (volume). O vão real é **prep de certificação de TI/cloud/IA** — sem gigante
BR, dor em dólar, persona early adopter. A landing atual nomeia a TÉCNICA ("Aprendizado por
repetição espaçada") — ninguém acorda querendo técnica (CEO P3). O reposicionamento: hero nomeia
**persona + resultado** (prova com data, fixar até o dia), a **história de origem** vira a prova
social que não temos (P9: zero depoimentos — a história verdadeira é o único ativo de confiança
disponível), e o amplo entra como segundo ato onde já morava (`#recursos` "Qualquer tema…").

---

## (a) `<head>` — title + meta description (SEO)

Anchor: linha 2. O title muda e entra UMA meta nova logo após a meta viewport (hoje não existe
meta description — buscador está montando snippet sozinho).

```html
<title>Fixa — estude pra certificação de um jeito que fixa</title>
<meta name="description" content="Recall ativo e revisão espaçada pra quem tem prova com data. Nasceu na certificação do Claude (Anthropic): do zero ao escopo da prova em 1,5 semana. Grátis.">
```

- Title 52 chars, description 156 chars (≤160). Termos-alvo na ordem de intenção:
  "certificação" (title) · "certificação do Claude"/"Anthropic" (description) · "revisão
  espaçada"/"recall" mantidos pra cauda atual.
- Sem og:tags nesta rodada (registrado em §e — não inventar imagem social agora).

---

## (b) Hero — só texto, mesma silhueta

**Não tocar:** `<canvas id="memcanvas">`, `.ladder` inteira (markup e chips), os 2 botões
(destinos e classes), qualquer CSS do hero. As trocas abaixo mantêm o mesmo número de linhas
renderizadas (conferido contra `max-width: 15ch` do h1 e 46ch do lead).

### b.1 hero-tag (anchor: linha 275)

```html
<span class="hero-tag">Pra quem tem uma prova com data</span>
```

(31 chars vs 34 atuais — cabe no 10.5px do mobile 320px. Persona no lugar da técnica: é
exatamente a correção do P3.)

### b.2 manchete (anchor: linha 276)

```html
<h1>Estude pra certificação de um jeito que <span class="hl">fixa</span>.</h1>
```

(46 chars vs 49 — mesmas ~4 linhas no `15ch`. Mantém o momento de marca — o `.hl` no "fixa" —
e coloca "certificação" na primeira dobra. "— e volta na hora certa" migra pro lead.)

### b.3 lead (anchor: linha 277)

```html
<p class="lead">Trilha guiada do zero à prova e revisão no intervalo exato em que você ia esquecer. Nasceu preparando uma certificação de IA — e serve pra qualquer tema.</p>
```

(154 chars vs 156 — mesmas linhas no `46ch`. Primeira frase = resultado; segunda = história +
segundo ato na ordem certa: cert primeiro, amplo depois.)

### b.4 CTAs (anchor: linhas 278–281) — **mantidos, decidido**

`Começar de graça` (primário) e `Ver o método` (ghost) ficam **como estão**: o free é o
posicionamento anti-Quizlet (CEO §2.e) e o método é a prova da promessa — nenhum dos dois
melhora nomeando cert. Zero mudança nas duas linhas.

### b.5 hero-note (anchor: linha 282)

```html
<p class="hero-note">// sem cartão · nasceu preparando a certificação do Claude, da Anthropic — história real abaixo</p>
```

(96 chars vs 83 — 1 linha no desktop igual hoje; no mobile a note já é `display:none`, nada a
conferir.)

---

## (c) Seção nova — a história de origem (`#historia`)

**Posição:** logo após `</header>` (linha 290) e antes de `<section id="metodo">` (linha 292).
Racional da ordem: hero promete → história prova que é real → método explica como. É a única
prova social verdadeira que existe (CEO P9); vem antes da ciência.

### c.1 CSS novo (inserir após a regra `.loop-foot`, hoje linhas 97–98)

```css
/* origin story */
.story { margin-top: 42px; max-width: 720px; background: var(--card); border: 1px solid var(--line);
  border-left: 3px solid var(--brand); border-radius: var(--r); padding: 26px 28px; }
.story .q { margin: 0; font-size: 17px; line-height: 1.7; }
.story .num { font-family: var(--mono); color: var(--recall); font-weight: 700; white-space: nowrap; }
.story .who { margin: 16px 0 0; font-family: var(--mono); font-size: 12px; color: var(--faint); letter-spacing: .04em; }
.story .note { margin: 6px 0 0; font-family: var(--mono); font-size: 12px; color: var(--faint); letter-spacing: .04em; }
```

(Só tokens existentes; borda esquerda brand = voz do fundador; número em mono âmbar = a mesma
tinta de "número que importa" da faixa de custo dos planos.)

### c.2 Markup + copy final (colar entre as linhas 290 e 292)

```html
<section id="historia">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">A origem</span>
      <h2>Nasceu de uma prova de verdade.</h2>
    </div>
    <div class="story">
      <p class="q">"Eu não queria só passar na certificação do Claude, da Anthropic — queria nota alta. Cansei de reler e esquecer, então montei pra mim um sistema de recall ativo e revisão espaçada. Em <b class="num">1,5 semana</b> eu tinha me enquadrado no escopo de aprovação da prova. Esse sistema virou a Fixa — e hoje monta a trilha de qualquer prova ou tema."</p>
      <p class="who">— João, criador da Fixa</p>
      <p class="note">// a prova ainda vem — quando a nota sair, ela entra aqui.</p>
    </div>
  </div>
</section>
```

- **Verdade auditável:** "me enquadrado no escopo de aprovação" é a formulação do dono, sem
  inflar; a `.note` assume que a prova não aconteceu — honestidade que vira hook de retorno
  (a nota futura é o segundo capítulo da prova social).
- **Sem foto, sem logo da Anthropic** (não usar marca de terceiro como endosso — é história,
  não parceria).
- Nav **não** ganha link "História" (a seção está no caminho natural do scroll; o nav
  congelado evita reflow no mobile).

---

## (d) Coerência nas seções existentes

### d.1 Método (anchor: linha 297, `<p>` do sec-head)

Acrescentar UMA frase ao final do parágrafo (o resto do bloco `#metodo` intocado):

```html
<p>Reler dá a ilusão de que aprendeu. O que gruda é tentar puxar da memória antes de ver a resposta — e depois espaçar. Cada task roda esse loop — foi ele que enquadrou uma certificação em 1,5 semana.</p>
```

### d.2 Recursos — fcard "Feito pra prova" (anchor: linhas 341–343)

```html
<h3>Feito pra prova</h3>
<p>Nasceu preparando a certificação do Claude, da Anthropic. Ideal pra quem tem data marcada — cert de TI, concurso, faculdade — e não pode esquecer no dia.</p>
```

(O h2 da seção — "Qualquer tema vira uma trilha que você conclui." — **fica**: é o segundo ato,
no lugar certo.)

### d.3 Importar — istep 1 (anchor: linha 361)

```html
<div class="istep"><div class="num">1</div><h3>Descreve o tema</h3><p>"Certificação AWS", "API do Claude", "teoria dos grafos" — a prova que você vai fazer ou o assunto que quiser. Escolhe nível e profundidade.</p></div>
```

### d.4 FAQ — 1 nova + 1 reescrita

**Nova FAQ "Pra quem é?"** — inserir como SEGUNDO item, logo após o `</details>` da FAQ
"O que é revisão espaçada?" (após a linha 429):

```html
<details>
  <summary>Pra quem é a Fixa? <span class="plus">+</span></summary>
  <div class="ans">Pra quem tem uma prova com data — certificação de tecnologia e IA em primeiro lugar, que é onde a Fixa nasceu, mas também concurso, faculdade, idioma. E pra quem só quer aprender sem esquecer: o método serve pra qualquer tema.</div>
</details>
```

**FAQ "Serve pra passar numa certificação?"** (anchor: linhas 438–441) — resposta reescrita
com a história e o número:

```html
<div class="ans">É pra isso que ela nasceu: o criador montou a Fixa estudando pra certificação do Claude, da Anthropic, e se enquadrou no escopo de aprovação em 1,5 semana. Você monta a trilha da prova, estuda com o método, e a fila de revisão garante o conteúdo fresco no dia — em vez de decorar tudo na véspera.</div>
```

(As demais FAQs — espaçada, programar, conteúdo, preço, celular, import — ficam como estão;
a de preço já foi atualizada pelo `DESIGN-TUTOR-COPY.md` e segue coerente.)

---

## (e) O que conscientemente NÃO muda

1. **Canvas/animação do hero** (`#memcanvas` + todo o JS da curva) e **CSS do hero** incl. o
   bloco mobile `@media (max-width: 560px)` — congelados pelo dono após 5 iterações. O diff
   desta spec no hero é só conteúdo de 4 nós de texto (tag, h1, lead, note).
2. **Ladder** de intervalos (markup, chips, versão mobile) — é a assinatura visual do método.
3. **Os 2 CTAs do hero** (labels, destinos, classes) — racional em §b.4.
4. **Nav** (links e ordem) — sem item "História"; mobile 320px já está no limite.
5. **Pcards de preço e features** — atualizados há 1 dia pelo `DESIGN-TUTOR-COPY.md`; a faixa
   `plans-foot` ("reprovar numa certificação de US$ 100+ custa mais que 3 anos de Fixa") já
   era o ângulo cert e agora ganha contexto de graça.
6. **Seção #cta, waitlist e footer** — o funil de conversão não muda de forma nesta rodada.
7. **Nenhuma menção a nota/aprovação na prova** — não existe ainda; a `.note` da história é o
   compromisso público de atualizar quando existir.
8. **Sem og:image/social cards** — fica pra quando houver identidade de compartilhamento;
   inventar agora geraria asset descartável.

---

## (f) Checklist de aceite

- [ ] **Hero congelado de verdade:** `git diff` do `fixa.html` no bloco do hero mostra
  APENAS texto dentro de `.hero-tag`, `h1`, `.lead` e `.hero-note` — zero mudança em CSS,
  canvas, ladder ou botões; em 390px e 320px o hero renderiza com a mesma altura de antes
  (h1 segue ~4 linhas, tag numa linha).
- [ ] **Verdade:** a palavra "passei" e qualquer nota numérica da prova NÃO existem na página;
  as únicas alegações são "queria nota alta", "me enquadrei/enquadrado no escopo de aprovação"
  e "1,5 semana" — e a note "// a prova ainda vem" está presente na história.
- [ ] **Número em destaque:** "1,5 semana" aparece em mono (`.num`, âmbar) na história e em
  texto corrido no método e na FAQ de certificação — 3 ocorrências, mesmas palavras.
- [ ] **Ordem do argumento:** hero (persona+resultado) → #historia → #metodo; o amplo aparece
  depois (lead 2ª frase, #recursos h2, FAQ "Pra quem é?") — nunca como manchete.
- [ ] **SEO:** `<title>` novo + meta description ≤160 chars com "certificação", "Claude",
  "Anthropic", "revisão espaçada"; view-source mostra a meta logo após a viewport.
- [ ] **Tom:** zero "!", zero "revolucionário/turbine/IA mágica"; a Anthropic é citada como
  fato da história, nunca como endosso ou logo.
- [ ] **FAQ:** 8 itens (era 7), "Pra quem é?" em 2º; a resposta de certificação conta a
  história com o número.
- [ ] **Tema claro/escuro:** a `.story` legível nos dois (só tokens existentes; conferir o
  âmbar `--recall` no claro, que já é o escurecido `#c88410`).
