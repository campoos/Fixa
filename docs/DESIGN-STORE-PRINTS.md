# DESIGN-STORE-PRINTS — as molduras dos screenshots da Play

> **Origem:** pedido do dono (27/07) — os 5 prints da ficha (`docs/store/screenshots/`) são
> capturas cruas, sem moldura e sem texto; ao lado de qualquer concorrente parecem print de
> bug report. Pedido: "molduras legais", com a hipótese de que o **tema escuro** ficaria melhor.
> **Entregue:** este spec + `molduras.html` (render local, Chrome headless) → `docs/store/frames/`.
> **Restrições respeitadas:** paleta e tokens existentes (`web/src/index.css`, bloco `.dark` a
> partir da linha 344), marca do `DESIGN-LOGO.md`, **zero fonte externa** (o render é offline),
> zero CDN, zero JS.

---

## 0. O único teste que vale: 150 px

No carrossel da ficha da Play o print é visto com **~150 px de largura** — 13,9% do 1080.
Toda decisão aqui foi tomada e conferida nesse tamanho, não em 1080. Consequências diretas,
antes de qualquer estética:

| A 1080 px | A 150 px | Portanto |
|---|---|---|
| Headline 74px | 10,3px | **é o teto do que dá pra ler**; nada menor que isso pode carregar informação |
| Subtítulo 40px | 5,6px | ilegível — decoração inútil (§4) |
| Texto da UI do app (~28px) | ~4px | vira **textura**, não conteúdo — o print comunica *estrutura e organização*, não frases |
| Raio de canto 44px | 6,1px | lê como "arredondado" sem custo |
| Fio de 1px | 0,14px | some — separação tem que vir de **luminância**, não de contorno |

O print não é lido: é **reconhecido**. Quem lê é a headline.

---

## 1. Tema — a hipótese do dono está meio certa

**Decisão: moldura escura + prints em tema CLARO.** O escuro é trabalho da moldura, não da tela.

O instinto de "escuro fica melhor" está certo sobre o **fundo** e errado sobre o **print**.
Isso não é opinião — foi medido. Rodei o mesmo quadro com o mesmo print de home nos dois
temas do app (captura dark real, `.dark` do `index.css`) e medi o contraste entre o **canvas
da moldura** e a **área da tela**:

| Combinação | Canvas | Tela | Contraste |
|---|---|---|---|
| Moldura escura + **print claro** | `#1a152f` | `#f0f0f3` | **15,5 : 1** |
| Moldura escura + print escuro | `#1a152f` | `#19181f` | **1,00 : 1** |

1,00:1 significa literalmente **nenhuma borda**: a 150px o print escuro não é um aparelho
sobre um fundo, é um buraco. O rodapé some, a silhueta some, e sobram só os respingos âmbar
e violeta boiando no escuro. O print claro vira um retângulo brilhante e nítido — a 150px a
pessoa vê *um app*, com hierarquia e cards, antes de ler qualquer coisa.

Somam-se três argumentos que não dependem de medição:

1. **A página da Play é branca** (no tema claro, que é o padrão da maioria). A moldura escura
   é o que recorta o card contra ela — é ela que impede o efeito "print solto no meio do nada"
   que os prints crus têm hoje. Moldura clara + print claro = uma mancha pálida sem aresta,
   dissolvida na página. Esse é o defeito real de hoje, e é de contraste, não de falta de texto.
2. **A Play também tem tema escuro.** Um conjunto todo escuro desaparece nele. Moldura escura
   com miolo claro sobrevive nos dois — o miolo claro é o que garante a leitura em qualquer
   página.
3. **Não exige recapturar nada.** Os 5 PNGs de hoje já são do tema claro e continuam válidos.

### O que fazer com os prints de hoje: nada

Ficam como estão. **Não recapturar em dark.** Se algum dia for preciso refazer (mudança de UI),
recapturar **em tema claro**, mesmas 5 telas, 1080×1920.

**Ressalva honesta, pro dono decidir com o dado na mão:** o app é *dark-first* —
`web/src/lib/theme.tsx:19` só abre em claro se o SO pedir claro. Então uma fatia dos usuários
abre o app escuro e vai ver uma tela diferente da vitrine. Não é enganoso (o botão de trocar
tema aparece no header de todos os 5 prints, e os dois temas existem), e o preço de resolver
"corretamente" é destruir a silhueta a 150px. **Se um dia quiser mostrar que existe dark**, o
lugar é um **6º print** (a Play aceita até 8) — nunca o print 1 e nunca o conjunto todo.

### Descartado

- **Prints em dark** — mede 1,00:1 de contraste com a moldura. Reprovado pelo teste dos 150px.
- **Moldura clara** (branco/lavanda `--background` do tema light) — some na página branca da
  Play e some de vez na Play em dark. Zero silhueta, que é exatamente o problema de hoje.
- **Uma cor de moldura por print** (5 gradientes diferentes) — carrossel vira arco-íris; o que
  faz 5 prints lerem como *um produto* é o canvas ser rigorosamente o mesmo.

---

## 2. Anatomia do quadro (a fonte de verdade)

Quadro **1080×1920** (9:16, dentro do limite da Play de 3840px no lado maior).

```
┌──────────────────────────────┐  0
│                              │  ↕ 104   respiro do topo
│  Headline, no máx 2 linhas   │  ↕ 175   74px · line-height 1.14
│                              │  ↕ 99    respiro
├──────────────────────────────┤  378
│   ┌──────────────────────┐   │
│   │                      │   │
│   │   print 1080×1920    │   │  800px de largura = escala 0.7407
│   │   inteiro, sem corte  │   │  → 1422px de altura
│   │                      │   │  raio 44 · fio branco 10% · sombra
│   └──────────────────────┘   │
│      ↕ 120 (base)            │  1800
└──────────────────────────────┘  1920
```

| Elemento | Valor | Por quê |
|---|---|---|
| Proporção headline : imagem | **20 : 80** | a headline precisa de ~180px pra caber em 74px×2 linhas; abaixo disso o texto encolhe e morre a 150px. Acima disso o print fica pequeno demais pra mostrar estrutura. |
| Margem lateral do texto | 90px | linha de ~21 caracteres a 74px — o limite antes de precisar de 3 linhas |
| Largura do print | 800px (inset 140) | maior valor em que o print **inteiro** cabe na altura restante sem corte |
| Base do print | 120px | assenta o card; equilibra com o inset lateral de 140 |
| Raio | 44px | 6,1px a 150px — lê como "tela", sem bezel |
| Separação print↔canvas | fio `rgba(255,255,255,.10)` + sombra `0 48px 96px -24px rgba(0,0,0,.78)` | a 1080 dá volume; a 150 quem separa é a luminância (15,5:1), o fio é acabamento |
| Canvas | `radial-gradient(120% 58% at 50% -6%, rgba(124,92,252,.30), transparent 62%)` sobre `linear-gradient(158deg, #2b2154, #1b1630 44%, #12101b)` | mesma família do `docs/store/feature-graphic.png` — carrossel e gráfico de destaque lendo como um conjunto. Termina em `#12101b`, que é o `--background` do `.dark` |

### Sem sangria: o print aparece inteiro

Cortar o print no rodapé é o padrão de mercado ("tem mais lá embaixo"), e foi **descartado**:
o que sangra nas 5 telas do Fixa é a **barra de navegação inferior**, idêntica em todas —
cortá-la pela metade não sugere continuidade, sugere print quebrado. E a conta fecha exatamente:
a 800px de largura o print cabe inteiro. Aparecer inteiro, com canto arredondado, é o que faz
o quadro ler como *aparelho* em vez de *recorte*.

### Sem bezel de aparelho

**Descartado**, por quatro motivos: (a) a 150px um bezel come 5–8% da largura pra entregar um
contorno cinza; (o print perde área justo onde ela é escassa); (b) moldura de hardware
envelhece rápido e amarra a marca a um aparelho que não é dela; (c) o canto arredondado já
entrega 100% da leitura "isso é uma tela" a 1/20 do custo; (d) a Play já mostra o print dentro
de um contexto de celular.

### Sem logo na moldura

**Descartado.** A marca já aparece **duas vezes** na mesma dobra: o ícone do app fica a
centímetros do carrossel na própria ficha, e o header do app — com o lockup "○ fixa" — está
no topo dos 5 prints. Uma terceira assinatura é ruído que rouba pixel da headline.

---

## 3. Headlines — as 5

Regras: **pt-BR, minúsculo no tom da casa, benefício e não funcionalidade**, no máximo 2 linhas,
quebra manual (`<br>`, nunca automática), ≤21 caracteres por linha. Uma expressão por headline
vai em **âmbar `#f4b740`** — a mesma tinta do ponto da marca (`DESIGN-LOGO.md` §2) — carregando
o benefício. Contraste ~9:1 sobre o canvas; a 150px o âmbar é o que dá ritmo ao carrossel e
puxa o olho pela sequência.

| # | Tela | Headline | Em âmbar | O que ela vende |
|---|---|---|---|---|
| 1 | home | **Chega na prova sabendo, não torcendo** | *não torcendo* | a promessa inteira do produto, na primeira posição — é o único quadro que quase todo mundo vê |
| 2 | lição | **Reler não fixa. Tentar lembrar, sim.** | *Tentar lembrar* | a tese (recall ativo) — o que separa o Fixa de "mais um baralho" |
| 3 | revisar | **O que ia esquecer volta no dia certo** | *no dia certo* | a outra metade do método (espaçamento), colada na primeira |
| 4 | trilha | **Do zero à prova, na ordem certa** | *na ordem certa* | a estrutura + a data da prova — o vão de `CONCORRENTES.md` §"O vão que a Fixa ocupa" |
| 5 | plano | **Revisões ilimitadas, sem pegadinha** | *sem pegadinha* | trata a objeção: o paywall agressivo é a reclamação nº 1 do Quizlet (`CONCORRENTES.md`) |

Nenhuma delas nomeia funcionalidade ("fila Leitner", "tutor com IA", "heatmap"). Todas dizem o
que a pessoa ganha. Nenhuma promete o que o app não faz — todas são checáveis na descrição da
loja já escrita em `PLAY-STORE.md` §4.

### Sem subtítulo — decisão, não esquecimento

Um subtítulo legível exigiria ≥65px (senão vira os 5,6px da tabela do §0), e 65px ao lado de
uma headline de 74px não é subtítulo, é uma segunda headline competindo. Somado, o bloco de
texto passaria de 180px pra ~330px e comeria a altura que faz o print caber inteiro. **A
headline sozinha, grande, é o formato certo pra 150px.** O texto longo tem lugar: a descrição
completa da ficha.

---

## 4. Sequência — muda

**Ordem nova: 1 home · 2 lição · 3 revisar · 4 trilha · 5 plano.**
(hoje é 1 home · 2 trilha · 3 lição · 4 revisar · 5 plano — a lição cai de 3º pra 2º e a
trilha desce pra 4º.)

O raciocínio: no carrossel só as **duas ou três primeiras** posições são vistas sem arrastar.
O que precisa estar ali é (1) o que o app é e (2) por que ele não é mais um app de flashcard.

- **1 · home** — continua abrindo. É a cara do app, mostra a fila do dia e a consistência, e
  responde "o que é isso" em meio segundo. A headline dela carrega a promessa.
- **2 · lição** — **promovida**. É o diferencial (recall em estágios) e, por acidente feliz, é
  a tela com a melhor silhueta a 150px: um card grande de pergunta e um botão violeta cheio —
  massa de cor e forma que sobrevive à redução.
- **3 · revisar** — logo depois, porque lição→revisão **é** o loop do método. Separar as duas
  metades por uma tela de estrutura quebrava a única narrativa que o produto tem.
- **4 · trilha** — desce. É contexto valioso (a data da prova, o plano), mas só convence quem
  já comprou o método; a 150px é a tela com o texto mais denso e a leitura mais lenta.
- **5 · plano** — fica por último, e é o lugar certo: tratar objeção é o último passo, e é a
  tela mais textual/menos persuasiva do conjunto.

**Trade-off assumido:** a trilha é onde mora a data da prova, que é o *wedge* comercial
(`CONCORRENTES.md`), e ela vai pra uma posição que menos gente vê. Aceito porque a headline do
print 1 já diz "prova" e a do 4 fecha o argumento pra quem arrastou. **Se um dia der pra medir
conversão da ficha**, o teste óbvio é trocar 2↔4 (método primeiro vs. plano primeiro).

---

## 5. Tipografia e cor

**Fonte: `Liberation Sans` Bold**, com fallback `Noto Sans` → `Arial` → `sans-serif`.
Instalada na VM, **nenhuma requisição externa** (o render é offline, por exigência do brief).
Escolhida entre as três disponíveis por ser a mais estreita das três em bold — cabe ~21
caracteres por linha a 74px, contra ~18 da DejaVu Sans, que é larga e pesada demais e forçaria
uma terceira linha ou uma fonte menor. Diacríticos de pt-BR (ã, é, í, ú) corretos e legíveis a
150px, que era o risco.

> Nota: a moldura **não precisa** casar com a fonte da UI do app (`ui-sans-serif, system-ui…`,
> `index.css:107`) — a UI aparece dentro do print, num nível hierárquico diferente. Fingir a
> mesma fonte com um substituto errado seria pior que assumir uma voz de display própria.

| Papel | Valor | Origem |
|---|---|---|
| Headline | `#f5f3fc` · 74px · 700 · line-height 1.14 · letter-spacing −0.021em | `--foreground` do `.dark` (`#eae7f3`), um passo mais claro pra ganhar peso no display |
| Palavra em destaque | `#f4b740` | âmbar oficial da marca (`DESIGN-LOGO.md`) = `--recall` do `.dark` (`#f0b73e`) |
| Canvas — topo | `#2b2154` | família do violeta-tinta do `feature-graphic.png` |
| Canvas — base | `#12101b` | `--background` do `.dark`, `index.css:346` |
| Glow | `rgba(124,92,252,.30)` | `#7C5CFC`, o violeta da marca |

O `letter-spacing` negativo é obrigatório: em 74px o espacejamento default da Liberation Sans
abre demais e a linha estoura a margem.

**Nenhuma cor fora desta tabela em nenhum quadro.**

---

## 6. Como renderizar

`molduras.html` é autocontido (sem JS, sem CDN, sem fonte externa) e vive ao lado da pasta
`screenshots/` — os PNGs são referenciados como `screenshots/N-*.png`, então o arquivo funciona
a partir de `docs/store/`.

Cada quadro é um `<section class="quadro" id="quadro-N">` de exatamente 1080×1920 CSS px.
Fotografar **elemento a elemento** (`elementHandle.screenshot()`), com
`deviceScaleFactor: 1` — 1080 CSS px têm que virar 1080 px reais. Saída sugerida:
`docs/store/frames/1-home.png` … `5-plano.png` (nomes na **ordem nova** do §4, pra não errar a
ordem de upload no Play Console).

Os PNGs crus em `docs/store/screenshots/` **permanecem** no repo: são a matéria-prima, e
refazer uma headline não pode depender de recapturar tela.

---

## 7. O que NÃO fazer

1. **Não recapturar os prints em dark** — mede 1,00:1 contra a moldura (§1). Se aparecer um
   print escuro no conjunto, é regressão.
2. **Não usar moldura clara** — o defeito de hoje é falta de aresta contra a página branca da
   Play; moldura clara mantém o defeito e só acrescenta texto.
3. **Não deixar a headline passar de 2 linhas** nem cair abaixo de 74px — a 3ª linha empurra o
   print e o corta; abaixo de 74px o texto some no carrossel.
4. **Não acrescentar subtítulo, selo, badge, "novo!", estrela ou nota** — a Play reprova
   elemento que imite classificação/promoção, e a 150px nada disso é legível de qualquer forma.
5. **Não variar o canvas entre os quadros** — o gradiente idêntico é o que faz os 5 lerem como
   um conjunto.
6. **Não pôr bezel de aparelho nem logo na moldura** (§2) — os dois cobram pixel e não pagam.
7. **Não cortar/sangrar o print** — o que sangraria é a barra de navegação, e barra cortada lê
   como bug.
8. **Não trocar as cores entre si** (headline âmbar, destaque branco) — inverte a semântica de
   cor que o app inteiro usa: âmbar = o que volta pra você.

---

## 8. Checklist de aceite

- [ ] Os 5 PNGs saem **1080×1920 exatos** (`identify`/PIL confere), sem `deviceScaleFactor`.
- [ ] Reduzidos a **150px de largura**, as 5 headlines são legíveis inteiras — inclusive os
      acentos de "à", "ã" e "õ" — e a palavra em âmbar se destaca.
- [ ] A 150px cada print tem **aresta visível** contra a moldura nos quatro lados (o teste do
      §1; se não tiver, algum print entrou em dark).
- [ ] Nenhuma linha de headline encosta na margem de 90px nem quebra sozinha.
- [ ] Nenhuma fonte externa e nenhuma requisição de rede no HTML
      (`grep -c "http\|@import\|<script" molduras.html` = 0).
- [ ] Nenhuma cor fora da tabela do §5 em nenhum quadro.
- [ ] Ordem de upload no Play Console = a do §4 (home, lição, revisar, trilha, plano) — a Play
      respeita a ordem em que os arquivos são arranjados no console, não o nome do arquivo.
- [ ] Os 5 prints crus continuam em `docs/store/screenshots/`.
- [x] `PLAY-STORE.md` §4 atualizado apontando `docs/store/frames/` como o que sobe na ficha.
