# DESIGN-LOGO — a identidade oficial do Fixa

> **Origem:** pedido do dono (14/07) — a identidade nunca passou pelo processo de design; com
> o domínio decidido (`fixaestudos.com.br`, `DECISAO-DOMINIO.md`) e o registro de **marca
> mista no INPI** no horizonte (exige o logo), este é o passe oficial.
> **Arquivos entregues:** `web/public/brand/logo.svg` · `logo-mono.svg` · `wordmark.svg` ·
> `lockup.svg` · `favicon.svg` — SVG puro (paths/círculos), zero raster, zero fonte embutida.
> **Restrições respeitadas:** paleta existente (violeta `#7C5CFC` · âmbar `#F4B740` ·
> neutros), sem gradiente, desenhável de memória, zero clichê de edtech.

---

## 1. Auditoria do que existia

Três espécimes do mesmo embrião, todos inconsistentes entre si:

| Onde | Geometria | Problema |
|---|---|---|
| `web/src/App.tsx` `Logo` (linhas 23–30) | arco R13 `M16 3a13 13 0 1 0 11.5 7`, traço 3.4, ponto (27, 6.5) r 3.6 | ponto FORA do anel (dist. 14,5 vs R 13); anel a 0,8px da borda do viewBox |
| `web/public/fixa.html` nav (252–256) e footer (479) | idem, traço 3.4 | idem |
| `web/public/favicon.svg` | idem, traço 3.6, ponto r 4 | terceira variação de pesos |

**Veredito:** a ideia embrionária estava CERTA (loop + ponto âmbar) — o que faltava era rigor.
O passe oficial **canoniza o conceito e refaz a geometria**: uma fonte de verdade, três pesos
deliberados (símbolo/favicon/wordmark), ponto NO anel, margens de respiro.

---

## 2. Conceito escolhido: **o retorno que crava o ponto**

O símbolo é **o anel da revisão** — a órbita do espaçamento — que dá a volta e termina no
**ponto âmbar** cravado no vão: a revisão que volta no tempo certo e fixa. É a mecânica do
produto em duas formas (um arco, um círculo), na semântica de cor que o app inteiro já usa
(âmbar = revisão/recall; violeta = a tinta da casa).

**Teste do guardanapo:** "um círculo quase fechado com um ponto no vão" — qualquer pessoa
desenha depois de ver uma vez.

**Metáforas rejeitadas (1 linha cada):**
- *Escada de intervalos* (1d·2d·4d…): em 16px vira gráfico de barras genérico de dashboard.
- *Caixa Leitner* (grade de caixinhas): grade = ícone de app de tarefas, não carrega o tempo.
- *Ponto sozinho* ("o que fixa"): abstrato demais — não conta a história sem o retorno.
- *Curva do esquecimento*: linha descendente lê como queda/negativo e morre em tamanho pequeno
  (ela já vive bem onde está: a animação do hero da landing).
- *Chapéu/lâmpada/cérebro*: clichês vetados; cérebro inclusive já é ícone de TEMA no catálogo
  (`track-icon.tsx`) — jamais pode ser a marca.

---

## 3. Geometria oficial (a fonte de verdade)

### 3.a Símbolo (`brand/logo.svg`) — uso geral, ≥20px

Grid 32×32 · centro (16,16) · **R 11** · **traço 4**, pontas redondas · violeta `#7C5CFC`.

- Arco de **290°**: vão de ±35° centrado a **nordeste (−45°)** — endpoints (26.83, 14.09) e
  (17.91, 5.17). Com as pontas redondas (+10,4° cada), o vão visual fica ~49°.
- **Ponto âmbar `#F4B740`**: centro (23.78, 8.22) — exatamente SOBRE a circunferência, no
  centro do vão — r 3.2 (diâmetro angular ~34°), com ~1,5px de luz pra cada ponta do arco.
- Margem externa: 3px de respiro em todos os lados do viewBox (anel + traço = raio 13).

### 3.b Favicon (`brand/favicon.svg`) — 16–32px

Mesmo desenho, mais denso pra sobreviver a 16px: arco de **270°** (endpoints (26.5, 16) e
(16, 5.5)), **traço 5**, ponto **r 4**. Substitui o `web/public/favicon.svg` atual (mesma URL,
`web/index.html` linha 5 não muda).

### 3.c Wordmark (`brand/wordmark.svg`)

**"fixa" minúsculo** (o produto fala em minúsculas — todo o copy do app), **monoline
geométrica desenhada em paths** (traço 3, pontas redondas — o mesmo DNA do símbolo), sem
nenhuma fonte: f = haste + gancho de quarto de círculo (R 5.5) + barra; i = haste com
**tittle âmbar r 2.4** — o ponto da marca assinando dentro do nome; x = duas diagonais;
a = bolha circular (R 6.75) + haste. x-height 13.5, ascendente 4.5, baseline 26.
Letras em `currentColor` (herdam a tinta do contexto — ink escuro no claro, claro no escuro);
**só o tittle é fixo em âmbar**.

### 3.d Lockup horizontal (`brand/lockup.svg`) — a marca mista

> **SUPERSEDED (emenda §8, 14/07):** a proporção 0.84 desta versão deixava o símbolo MENOR
> que o texto — reprovada pelo dono. A geometria vigente é a do **§8 (lockup-v2)**, baseada
> em pesquisa de guidelines públicos (Slack/Spotify). O que permanece daqui: o ponto âmbar
> aparece **duas vezes** (no vão do anel e no i) — assinatura da marca; nunca remover um deles.

### 3.e Versões

| Versão | Arquivo | Uso |
|---|---|---|
| Cor sobre fundo escuro | `logo.svg` / `lockup.svg` como estão | app (tema escuro), landing dark |
| Cor sobre fundo claro | mesmos arquivos — violeta/âmbar têm contraste AA nos dois fundos; letras `currentColor` viram ink `#1C1533` | landing light, docs |
| Monocromática (traço único) | `logo-mono.svg` (`currentColor` no anel E no ponto) | INPI, carimbo, gravação, marca d'água |

---

## 4. Aplicação — onde entra, o que substitui

| Superfície | Ação | Anchor |
|---|---|---|
| Favicon do app | **substituir** o conteúdo de `web/public/favicon.svg` pelo de `brand/favicon.svg` | `web/index.html:5` intocado |
| `Logo` do app | **atualizar geometria** pro §3.a: path `M26.83 14.09A11 11 0 1 1 17.91 5.17` traço 4 `var(--primary)` + circle (23.78, 8.22) r 3.2 `#F4B740` | `web/src/App.tsx:23–30` |
| Landing — nav e footer | mesmos path/circle novos (traço em `var(--brand)`, ponto `var(--recall)`), mantendo classe `.mark` e tamanhos | `web/public/fixa.html:252–256` e `:479` |
| Ícone PWA futuro (512px) | `logo.svg` centrado sobre quadrado `#0d0a1a`, símbolo a 60% da largura (padding seguro pra maskable) | quando o manifest existir |
| E-mails (`email.js` shell) | lockup horizontal como imagem inline futura — fora deste escopo | — |

**Clear space:** ~~¼~~ → **½ da altura do símbolo** em todos os lados (emenda §8.d, regra
Spotify); em co-branding, **1 símbolo inteiro** entre as marcas (regra Slack). Nada encosta
no anel, nem texto nem borda de container.
**Tamanhos mínimos:** símbolo 14px (abaixo de 20px, usar a variante favicon); lockup 20px de
altura; wordmark sozinho 12px de altura.

---

## 5. O que NÃO fazer

1. **Não rotacionar** — o vão mora a nordeste; girar muda a história (ponto "caindo").
2. **Não fechar o anel** nem remover o ponto — sem o vão não há retorno, sem o ponto não há fixa.
3. **Não trocar as cores dos elementos entre si** (anel âmbar/ponto violeta = inverte a
   semântica do app); versão de uma cor só = `logo-mono.svg`.
4. **Sem gradiente, sombra, contorno duplo, 3D** — duas formas chapadas, sempre.
5. **Não usar o símbolo como letra** ("f•xa", círculo no lugar do "a") — símbolo e wordmark
   se juntam apenas no lockup oficial.
6. **Não reintroduzir as geometrias antigas** (R13/traço 3.4/ponto fora do anel) — depois do
   passe, qualquer espécime divergente é regressão.
7. **Não usar o cérebro/chapéu/lâmpada** como apoio da marca em nenhum material.

---

## 6. Nota INPI (marca mista)

- A **marca mista** registrada é o **lockup horizontal** (`lockup.svg`): elemento nominativo
  "fixa" + figurativo (o anel com ponto).
- Depósito em **preto e branco** usando `logo-mono.svg` + wordmark em traço único protege a
  marca em qualquer cor (prática padrão); as versões em cor ficam como uso comercial.
- O elemento figurativo sozinho (`logo.svg`) pode ser objeto de registro figurativo separado
  no futuro — decisão de custo, não de design.

## 7. Checklist de aceite

- [ ] Os 5 SVGs abrem limpos (paths/círculos apenas; `grep -L "base64\|<image\|@font"` passa
  em todos) e renderizam idênticos em Chrome/Firefox/Safari.
- [ ] `favicon.svg` legível a 16px real: anel e ponto distinguíveis, vão visível.
- [ ] No lockup, centros ópticos alinhados e os DOIS pontos âmbar presentes.
- [ ] App, landing e favicon usando a MESMA geometria nova (zero espécimes R13 sobrando —
  grep por `11.5 7` no repo = 0 ocorrências fora do histórico).
- [ ] Versão mono em traço único disponível pro INPI; nenhuma cor fora da paleta em nenhum
  arquivo (`#7C5CFC`, `#F4B740`, `currentColor` apenas).
- [ ] Teste do guardanapo com alguém que nunca viu: descreve "círculo aberto com ponto" e
  desenha de memória.

---

## 8. EMENDA (14/07) — lockup-v2: proporções por convenção de mercado

**Feedback do dono:** símbolo aprovado; o lockup v1 não convenceu ("posicionamento, tamanho
da logo em relação a texto"). Pedido: pesquisar como marcas famosas fazem e replicar.
`lockup.svg` foi RECONSTRUÍDO; símbolo e `wordmark.svg` standalone intocados como formas.

### 8.a O que a pesquisa encontrou (fontes)

| Regra | Convenção | Fonte |
|---|---|---|
| Tamanho símbolo × texto | "Both logos should feel of equal size" — igualdade **óptica**, não métrica; o octothorpe ocupa a altura ascendente→baseline do logotype | [Slack Brand Guidelines set/2020](https://a.slack-edge.com/4d5bb/marketing/img/media-kit/slack_brand_guidelines_september2020.pdf), pp. 33–35 (páginas lidas) |
| Gap símbolo↔texto | Slack: distância fixa "A", unidade tirada do próprio desenho (~0.4× o símbolo) · Spotify: **gap = o counter do 'o' do wordmark** | Slack pp. 33–34 · [Spotify Design Guidelines](https://developer.spotify.com/documentation/design) |
| Alinhamento | Referência é a **baseline óptica do logotype** (Slack p. 35); formas redondas exigem overshoot pra parecerem do mesmo tamanho que formas retas | Slack p. 35 |
| Clear space | Spotify: **½ altura do ícone** · Slack (co-branding): **1 octothorpe inteiro** | Spotify · Slack p. 35 |
| Hierarquia ícone/nome | "o ícone pode existir sem o wordmark; o wordmark nunca sem o ícone" | Spotify |

### 8.b Diagnóstico do v1 e a regra adotada

O erro do v1: símbolo a 0.84 → tinta de 21.8 unidades contra 24.5 do wordmark — **o símbolo
ficava subordinado ao texto**, o inverso da convenção (é o símbolo que carrega a marca e
existe sozinho). O gap (~11) media contra um símbolo encolhido.

**Regra adotada:** símbolo em tinta = **1.06× a altura ascendente→baseline do wordmark**
(overshoot óptico de círculo: 0.75 por lado — círculo "do mesmo tamanho" que letra precisa
vazar); **centro do símbolo cravado no ponto médio exato ascendente↔baseline do texto**;
**gap = o counter do 'a' do wordmark** (10.5 unidades, regra Spotify) — que converge com o
"A" do Slack (≈0.40× a altura do símbolo). Duas convenções, o mesmo número.

### 8.c Antes → depois (números do `lockup.svg`)

| Medida | v1 | v2 |
|---|---|---|
| Escala do símbolo | 0.84 (tinta 21.8 — MENOR que o texto) | **1.0** (tinta 26 = 1.06× as 24.5 do texto) |
| Traço efetivo do símbolo | 3.36 | **4** (peso oficial; texto segue 3 — símbolo mais denso, como o octothorpe vs o Hellix do Slack) |
| Alinhamento vertical | centros "≈" (15.75 vs 16) | centro do símbolo = **15.25 exato** (ponto médio do texto); overshoot simétrico de 0.75 acima e abaixo |
| Gap símbolo→texto | ~11, medido irregular | **10.5 = counter do 'a'**, tinta a tinta (x 29 → 39.5) |
| viewBox | 0 0 91 32 | **0 0 95 32** |
| Wordmark no lockup | idêntico ao standalone | **idêntico ao standalone** — na proporção nova, o traço 3 casou opticamente com o símbolo em 4; nenhum ajuste de peso foi necessário |

### 8.d Ajustes decorrentes no sistema

- **Clear space** (§4 já corrigido): ½ altura do símbolo em todos os lados; 1 símbolo inteiro
  em co-branding.
- Lei herdada da Spotify: **o wordmark nunca aparece sem o símbolo** em material oficial novo;
  o inverso é permitido (o símbolo vive sozinho no favicon e no app).
- Checklist adicional: [ ] no lockup renderizado, o anel vaza 0.75 acima do topo do "f" e
  0.75 abaixo da baseline (o overshoot é visível com régua, invisível a olho — se "parecer"
  maior que o texto, está errado; deve parecer IGUAL).
