# SEO — por que o Fixa não aparece no Google, e o que fazer

> Levantado em **28/07/2026**, com o site em produção (`https://fixaestudos.com.br`).
> Motivo: *"eu literalmente pesquiso fixaestudos e não aparece"*.
>
> **Veredito:** não é falta de otimização. O site está tecnicamente bem servido — a home é
> HTML de verdade, `robots.txt` e `sitemap.xml` respondem, nada está bloqueado. O problema é
> que **o Google nunca descobriu o domínio**: ele foi registrado há ~2 semanas, ninguém o
> submeteu no Search Console e **nenhum link na internet aponta pra ele**. Sem caminho de
> descoberta, não há rastreamento; sem rastreamento, não há índice; sem índice, nem a busca
> pelo próprio nome retorna nada.
>
> Documentos irmãos: [DISTRIBUICAO.md](DISTRIBUICAO.md) (canais e drafts de post),
> [DECISAO-DOMINIO.md](DECISAO-DOMINIO.md) (por que `fixaestudos`),
> [PLAY-STORE.md](PLAY-STORE.md) (a ficha da loja, que também é ativo de busca).

---

## 1. O veredito em três linhas

1. **Causa raiz:** zero descoberta. Domínio novo + zero backlink + Search Console nunca configurado.
2. **Não é a causa:** SPA sem SSR, falta de meta tag, falta de dado estruturado. Tudo isso importa
   *depois* que o Google entra — hoje ele nem entrou.
3. **Consequência prática:** as duas ações que destravam isso **não são de código** — são cliques
   na conta do dono (§4). O código entra em segundo lugar, pra não desperdiçar o rastreamento
   quando ele começar (§5).

---

## 2. Diagnóstico com a evidência coletada

### 2.1 O que foi medido ao vivo (28/07/2026)

| Checagem | Resultado | Leitura |
|---|---|---|
| `GET /` | `200`, **43.878 bytes**, `text/html` | HTML real, não casca de SPA |
| `GET /fixa.html` | `200`, 43.878 bytes — **byte a byte idêntico a `/`** | prova que `/` serve a landing estática |
| `GET /robots.txt` | `200` · `Allow: /` · `Disallow: /api/` · aponta o sitemap | não há bloqueio |
| `GET /sitemap.xml` | `200`, XML válido, **1 URL só** (`/`) | existe, mas raso |
| `GET /privacidade` | `200`, 5.463 bytes, HTML real com `<title>` e description | ok |
| `GET /.well-known/assetlinks.json` | `200`, fingerprint da chave de upload | ok (TWA) |
| Cabeçalhos de todas as rotas | **nenhum `X-Robots-Tag`**, nenhum `noindex` | nada está proibido de indexar |
| `www.` e `http://` | `301` → `https://fixaestudos.com.br/` | host canônico consolidado, correto |
| `.onrender.com` | `301` → domínio próprio (`server.js:468`) | correto, sem conteúdo duplicado |
| User-agent `Googlebot` | `200`, **conteúdo idêntico** ao do navegador | sem cloaking, sem bloqueio de bot |
| TTFB (3 medidas) | **0,22s / 0,22s / 0,26s** | rápido; o cold start do Render não está atrapalhando |
| `dig TXT fixaestudos.com.br` | **nenhum registro TXT** | ver §2.3 |
| Busca por `fixaestudos.com.br` | **zero resultado do domínio** | não indexado |
| Busca por `site:fixaestudos.com.br` | **zero resultado** | confirma: nenhuma URL no índice |

**Conclusão da bateria:** não existe impedimento técnico. O site está pronto pra ser rastreado —
só nunca foi.

### 2.2 A home NÃO é casca de SPA (hipótese descartada)

Era a suspeita óbvia, e ela está errada. Em `server.js:423`:

```js
// visitante deslogado na raiz vê a landing; logado cai no app
if (p === "/" && !authed) p = "/fixa.html";
```

O Googlebot nunca tem cookie de sessão, então **sempre** cai em `web/public/fixa.html` — 710 linhas
de HTML estático, com `<h1>`, 20 headings, 8 FAQs e ~44 kB de conteúdo. Já traz `lang="pt-BR"`,
`<title>`, `meta description`, `canonical`, Open Graph completo com imagem 1200×630 e `twitter:card`.
Isso foi feito na rodada da [DESIGN-LP-REPOSICIONAMENTO.md](DESIGN-LP-REPOSICIONAMENTO.md) §a.

Ou seja: **a página que importa não depende de JavaScript pra existir.** A casca de SPA
(`web/index.html`, 1.949 bytes, `<div id="root">` vazia) só é servida nas rotas do app —
`/app`, `/revisar`, `/pro`, `/ajuda`, `/novo`, `/t/*` — que **não devem ser indexadas de todo jeito**.

### 2.3 A causa raiz: o Google não tem como saber que o site existe

O Google acha URLs novas de três jeitos. Os três estão fechados:

**a) Por link de outro site.** É o canal principal. Hoje o Fixa tem **zero backlink** — o próprio
[DISTRIBUICAO.md](DISTRIBUICAO.md) confirma: a tabela "Diário de ações" está vazia, nenhum post foi
publicado ainda. Nenhum LinkedIn, nenhum TabNews, nenhum README de GitHub, nenhuma ficha da Play.
Do ponto de vista do Google, o domínio é uma ilha.

**b) Por submissão no Search Console.** Nunca foi feito, e isso dá pra **provar de fora** — os
quatro métodos de verificação deixam rastro observável, e nenhum existe:

| Método de verificação | Rastro esperado | O que foi encontrado |
|---|---|---|
| Registro DNS TXT | `google-site-verification=…` no TXT do domínio | **nenhum TXT no domínio** (`dig TXT`) |
| Meta tag HTML | `<meta name="google-site-verification">` | ausente em `fixa.html`, `index.html`, `privacidade.html` |
| Google Analytics / Tag Manager | `gtag`/`googletagmanager` no HTML | **nenhum script de analytics no repo inteiro** |
| Arquivo HTML | `/googleXXXX.html` em `web/public/` | `web/public/` não tem nenhum arquivo assim |

Não é hipótese: **o Search Console nunca foi configurado.** (Bônus: também não há nenhuma
analytics instalada — não dá pra saber quanto tráfego o site recebe hoje.)

**c) Sozinho, por descoberta passiva** (logs de certificado TLS, DNS). Acontece, mas é lento e não
garante rastreamento — só coloca o domínio numa fila de baixa prioridade. Para um domínio de duas
semanas sem nenhum sinal de que alguém se importa, pode levar meses, ou não acontecer.

O `sitemap.xml` existe e está correto — mas **um sitemap que ninguém submeteu e cujo site ninguém
linka nunca é lido**. Ele é encontrado a partir do `robots.txt`, que só é lido quando o Google
resolve rastrear o domínio, que é exatamente o que não está acontecendo. É um círculo que só se
abre por fora (§4).

### 2.4 Agravante de marca: "fixa" é palavra disputada

Isto já estava mapeado na [DECISAO-DOMINIO.md](DECISAO-DOMINIO.md), e a busca confirma. Buscas por
termos do produto devolvem Anki, Quizlet, Noji, Revu, Estudaqui, App Imersivo, blogs de concurso —
todos com anos de domínio e milhares de links. E "fixa" sozinho ainda compete com "renda fixa" e
com jogos de carro rebaixado.

Impacto prático: **a consulta de marca ("fixa estudos") é ganhável** — nome composto, pouca
disputa exata, e assim que o site for indexado ele tende a assumir a primeira posição, porque é o
resultado mais relevante para o nome dele. Já as **consultas genéricas** ("app de revisão espaçada",
"como estudar pra concurso") estão fora de alcance por bastante tempo: são dominadas por sites com
autoridade acumulada. Isso não se resolve com tag nenhuma.

### 2.5 Achados técnicos reais — sintomas, não a causa

Nenhum destes é o motivo de o site não aparecer. Todos passam a custar caro **assim que** o
rastreamento começar, e é por isso que entram no plano.

| # | Achado | Evidência | Por que importa |
|---|---|---|---|
| S1 | **Fábrica de soft-404.** Qualquer caminho inexistente devolve `200` + casca de SPA | `/pagina-que-nao-existe`, `/xyzabc123`, `/temas`, `/pro` → todos `200`, 1.949 bytes idênticos | Infinitas URLs distintas com conteúdo idêntico e vazio. Queima orçamento de rastreamento e gera "Soft 404" / "Duplicada sem canônica" no Search Console |
| S2 | **Casca de SPA sem `<head>` decente** | `web/index.html` não tem description, canonical nem Open Graph; `<title>` genérico | Se alguma rota de app for indexada, entra no índice como página vazia sem descrição |
| S3 | **`robots.txt` libera a área logada** | `Allow: /` cobre `/app`, `/revisar`, `/pro`, `/novo`, `/redefinir?token=…` | Rastreamento gasto em tela que ninguém deveria achar pelo Google |
| S4 | **Sitemap com 1 URL** | só `/`; `/privacidade` fora | Perde a única outra página indexável que já existe |
| S5 | **Zero dado estruturado** | `grep 'application/ld+json'` → 0 ocorrências | O Google não tem como entender que isso é um app de educação gratuito |
| S6 | **`/privacidade` é órfã** | os únicos `href` internos da landing são 8× `/temas` e âncoras `#` | Nenhum link aponta pra ela; página que a Play exige, invisível pro Google |
| S7 | **`/fixa.html` acessível como duplicata de `/`** | mesmo conteúdo em duas URLs | Mitigado — a `canonical` dela aponta pra `/`. Vale fechar com 301 mesmo assim |
| S8 | **Sem analytics** | nenhum script no repo | Não dá pra medir o efeito de nada do que está neste documento |

---

## 3. Divisão de trabalho — quem faz o quê

Esta é a parte que mais confunde. **Otimizar código não coloca o site no Google.** O que coloca é a
verificação da propriedade e a existência de links. Nós não temos acesso a nenhuma das duas coisas.

| Ação | Quem faz | Onde |
|---|---|---|
| Verificar o domínio no Search Console | **só o dono** (é conta Google dele + DNS do Registro.br) | §4.1 |
| Submeter o sitemap | **só o dono** | §4.2 |
| Pedir indexação da home | **só o dono** | §4.3 |
| Bing Webmaster Tools | **só o dono** | §4.4 |
| Publicar os primeiros links (LinkedIn, TabNews, GitHub) | **só o dono** | §4.5 |
| Ficha da Play Store | **só o dono** | §4.6 |
| Dado estruturado JSON-LD | dev | §5.1 |
| `noindex` na casca de SPA | dev | §5.2 |
| `robots.txt` e `sitemap.xml` corrigidos | dev | §5.3, §5.4 |
| 404 de verdade | dev | §5.5 |
| Link pra `/privacidade` no rodapé | dev | §5.6 |
| Páginas de conteúdo novas | dev escreve, dono decide o tema | §6 |

---

## 4. O que só o dono consegue fazer (passo a passo)

Ordem importa. Faça de cima pra baixo. Reserve ~40 minutos pro bloco §4.1 a §4.4.

### 4.1 Verificar o domínio no Google Search Console

O Search Console é o painel oficial do Google para donos de site: mostra o que está indexado, o que
deu erro, e é por onde se pede indexação. **É gratuito e é o passo mais importante deste documento.**

1. Abra **https://search.google.com/search-console** e entre com a conta Google que você quer usar
   pra sempre nisso (use a mesma do Play Console — evita ter duas contas guardando coisas do Fixa).
2. Na caixa de seleção de propriedade (canto superior esquerdo), clique em **"Adicionar propriedade"**.
3. Escolha a coluna da **esquerda: "Domínio"** (não "Prefixo do URL"). A opção "Domínio" cobre
   `http`, `https`, `www` e todos os subdomínios de uma vez — é a certa aqui.
4. Digite `fixaestudos.com.br` (sem `https://`, sem `www`) e clique em **Continuar**.
5. A tela mostra um registro **TXT** parecido com
   `google-site-verification=AbCdEf1234...`. **Copie esse valor inteiro.** Deixe essa aba aberta.
6. Em outra aba, abra **https://registro.br**, faça login, vá em **Meus domínios →
   `fixaestudos.com.br` → DNS / Editar Zona**.
   > Confirmado por consulta DNS: os servidores do domínio são `a.sec.dns.br` e `c.sec.dns.br`,
   > ou seja, **a zona está no próprio Registro.br** — é lá que o registro TXT entra, não no Render
   > nem em outro painel.
7. Adicione uma linha nova:
   - **Nome / host:** deixe **em branco** (ou `@`, se o painel exigir algo) — é o domínio raiz.
   - **Tipo:** `TXT`
   - **Valor / conteúdo:** cole o `google-site-verification=...` copiado.
   - **Cuidado:** não apague nem sobrescreva as linhas `A` (o `216.24.57.1`, que é o Render) nem
     nenhum registro existente. Você está **adicionando** uma linha.
8. Salve. O Registro.br publica a mudança em minutos, mas pode levar até algumas horas.
9. Volte na aba do Search Console e clique em **Verificar**. Se falhar, espere 30 minutos e clique
   de novo — é quase sempre só propagação de DNS. Não recrie a propriedade.

Quando verificar, o painel vai aparecer vazio ("Nenhum dado"). É esperado: ele só mostra dados a
partir do momento da verificação.

### 4.2 Submeter o sitemap

Ainda no Search Console, com a propriedade `fixaestudos.com.br` selecionada:

1. Menu da esquerda → **Sitemaps** (fica abaixo de "Indexação").
2. No campo "Adicionar novo sitemap", digite apenas `sitemap.xml` e clique **Enviar**.
3. Em alguns minutos o status vira **"Sucesso"** e mostra o número de URLs encontradas.
   Se der "Não foi possível buscar", espere algumas horas e clique em atualizar — o erro inicial é
   comum e costuma se resolver sozinho.

> Faça isso **depois** que a mudança do §5.4 estiver no ar, pra o sitemap já subir com todas as URLs
> certas. Se preferir não esperar, pode submeter agora — ele relê o sitemap sozinho depois.

### 4.3 Pedir indexação da home (o empurrão inicial)

1. No topo do Search Console há uma barra: **"Inspecionar qualquer URL em..."**. Cole
   `https://fixaestudos.com.br/` e aperte Enter.
2. Vai aparecer **"URL não está no Google"**. É a confirmação do diagnóstico.
3. Clique em **"SOLICITAR INDEXAÇÃO"**. Ele testa a URL ao vivo (~1 minuto) e põe numa fila
   prioritária.
4. Repita para `https://fixaestudos.com.br/privacidade`.

**Limites reais, pra não se frustrar:** são cerca de 10 pedidos por dia. Pedir a mesma URL várias
vezes **não acelera nada** — o Google ignora repetição. E "solicitar indexação" é pedido, não
garantia: para um domínio sem nenhum link, o Google pode rastrear e ainda assim decidir não indexar
("Descoberta — no momento não indexada"). É exatamente por isso que o §4.5 não é opcional.

### 4.4 Bing Webmaster Tools (10 minutos, vale a pena)

O Bing alimenta o Bing, o Yahoo, o DuckDuckGo e o Copilot. Indexa mais rápido que o Google e aceita
importar tudo do Search Console em dois cliques.

1. **https://www.bing.com/webmasters** → entrar com a mesma conta Google.
2. Escolha **"Importar do Google Search Console"** e autorize. Ele traz a propriedade já verificada.
3. Menu **Sitemaps** → enviar `https://fixaestudos.com.br/sitemap.xml`.
4. Menu **Envio de URL** → colar `https://fixaestudos.com.br/`.

### 4.5 Os primeiros links — a parte que realmente resolve

Sem link de fora, o Google trata o domínio como irrelevante e o §4.3 pode não bastar. Precisamos de
**poucos links legítimos**, não de muitos. Nenhum deles custa dinheiro. Todos já estão previstos na
[DISTRIBUICAO.md](DISTRIBUICAO.md) — a diferença é que aqui eles têm um segundo propósito: existir
como sinal de descoberta.

Em ordem de facilidade:

| # | Onde | O que fazer | Por que ajuda |
|---|---|---|---|
| 1 | **Seu perfil do LinkedIn** | Editar perfil → seção "Website"/"Contato" → adicionar `https://fixaestudos.com.br` | 2 minutos, link permanente num domínio que o Google rastreia o tempo todo |
| 2 | **Post no LinkedIn** | Publicar o *draft A* de [DISTRIBUICAO.md](DISTRIBUICAO.md), com o link no corpo | Rastreado rápido; e traz gente de verdade |
| 3 | **GitHub** | Se houver repositório público do Fixa: campo "Website" do repo + link no README. Se não houver, o perfil pessoal já serve | GitHub tem autoridade altíssima; é dos links mais fáceis que existem |
| 4 | **TabNews** (`https://www.tabnews.com.br`) | Post contando a história de origem (cert do Claude + método), link no final | Comunidade dev BR, indexa muito bem, aceita link no corpo |
| 5 | **Dev.to** (`https://dev.to`) | O artigo do canal 4 da DISTRIBUICAO, em inglês ou português | Domínio forte, o post fica indexado pra sempre |
| 6 | **Reddit** (`r/ClaudeAI`, `r/AWSCertifications`) | *draft B*, e o link **só em comentário quando pedirem** | Regra do sub; post com link direto é removido |

> **A regra que não pode ser quebrada:** esses links têm que ser postagens de verdade, escritas por
> você, em lugares onde a história interessa. Link comprado, troca de link e comentário em blog
> alheio só pra deixar URL são exatamente o que o Google pune (§8).

### 4.6 A ficha da Play Store é um ativo de busca

Quando o app sair na Play (ver [PLAY-STORE.md](PLAY-STORE.md)), a ficha vira uma segunda porta —
e ela é forte:

- `play.google.com` tem autoridade máxima; a ficha do app indexa em dias, não meses.
- A ficha tem campo de **site do desenvolvedor** → é mais um link apontando pro domínio.
- Buscas por "fixa estudos app" passam a ter **dois** resultados nossos: a ficha e o site.

Duas coisas a fazer na ficha, com olho em busca (ASO):

1. **Nome:** `Fixa: Estude e Memorize` — já decidido na PLAY-STORE.md §4 e correto. O nome composto
   é o que separa o Fixa de "renda fixa" e dos jogos de carro (DECISAO-DOMINIO).
2. **Descrição curta e completa:** o texto da PLAY-STORE.md §4 já usa as palavras certas ("recall
   ativo", "revisão espaçada", "certificação, concurso, faculdade"). O algoritmo da Play lê nome,
   descrição curta e descrição completa — não invente repetição, o texto atual está bom.

E depois de publicado, adicionar na landing um link/badge pra ficha: fecha o circuito nos dois
sentidos e ajuda o Google a entender que site e app são a mesma entidade.

### 4.7 O que **não** se aplica

- **Perfil da Empresa no Google** (aquele cartão lateral com endereço e horário): é para negócio
  com endereço físico ou área de atendimento. Um app não se qualifica. Não perca tempo.
- **Submeter o site em "diretórios"** e agregadores de link: sem valor há mais de uma década, e
  parte deles é penalizada.

---

## 5. Código — trechos prontos pra colar

Nenhuma destas mudanças faz o site aparecer sozinha. Elas garantem que, quando o Google entrar, ele
gaste o rastreamento nas páginas certas e entenda o que o Fixa é. **Impacto na ordem em que estão.**

### 5.1 `noindex` na casca de SPA — uma linha, resolve S1, S2 e S3

O maior ganho técnico do documento, e é uma linha. Como `/` é servida pela landing estática para
qualquer visitante deslogado (§2.2), **a casca só aparece em rota de app** — o Googlebot, que nunca
tem sessão, jamais recebe `web/index.html` na raiz. Então marcar a casca inteira como `noindex` é
seguro e mata de uma vez as infinitas URLs vazias.

Em **`web/index.html`**, logo depois da linha do `<title>`:

```html
    <!-- A casca do SPA só é servida em rota de app (/app, /revisar, /pro, /t/*) e em caminho
         inexistente — a raiz deslogada vai pra fixa.html (server.js:423). Nenhuma dessas telas
         deve entrar no Google: são autenticadas ou vazias sem JS. Ver docs/SEO.md §5.1. -->
    <meta name="robots" content="noindex, follow" />
```

`follow` mantém o Google seguindo os links de dentro — só não indexa a página em si.

### 5.2 Dados estruturados na landing (JSON-LD)

Diz ao Google, em linguagem de máquina, que isto é um aplicativo de educação, gratuito, em
português. Ajuda o site a virar uma **entidade** reconhecida — que é o que faz a busca de marca
funcionar bem.

Em **`web/public/fixa.html`**, colar **imediatamente antes de `</head>`** (atenção: o `<head>`
inteiro está na linha 2, tudo numa linha só — o `</head>` está no fim dela, logo antes de `<body>`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://fixaestudos.com.br/#website",
      "url": "https://fixaestudos.com.br/",
      "name": "Fixa",
      "alternateName": "Fixa Estudos",
      "description": "Recall ativo e revisão espaçada pra quem tem prova com data.",
      "inLanguage": "pt-BR"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://fixaestudos.com.br/#app",
      "name": "Fixa",
      "alternateName": "Fixa: Estude e Memorize",
      "url": "https://fixaestudos.com.br/",
      "applicationCategory": "EducationalApplication",
      "applicationSubCategory": "Estudo e memorização",
      "operatingSystem": "Web, Android",
      "inLanguage": "pt-BR",
      "description": "App de estudo por recall ativo e revisão espaçada para quem tem prova com data: certificação, concurso ou faculdade. Você monta a trilha do seu tema e o Fixa devolve o conteúdo no dia em que você ia esquecer.",
      "featureList": [
        "Trilha de estudo por tema, dividida em tarefas curtas",
        "Recall ativo em dois estágios",
        "Revisão espaçada em 1, 2, 3, 4, 7, 15 e 30 dias",
        "Fila de revisão ajustada à data da prova",
        "Correção por tutor de IA com nota e gaps",
        "Lembrete diário por e-mail"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      },
      "isAccessibleForFree": true,
      "isPartOf": { "@id": "https://fixaestudos.com.br/#website" }
    }
  ]
}
</script>
```

Três avisos que valem mais que o trecho:

- **Não adicione `aggregateRating` nem `review`.** O Fixa não tem avaliação nenhuma ainda. Nota
  inventada em dado estruturado é motivo de ação manual do Google, e o custo é o site inteiro.
- **Não adicione `SearchAction`/caixa de busca.** O site não tem busca interna; declarar uma que não
  existe é dado falso.
- **`FAQPage` não vale a pena aqui.** A landing tem 8 FAQs reais em `<details>` e seria fácil marcar,
  mas desde agosto de 2023 o Google só mostra resultado rico de FAQ para sites governamentais e de
  saúde. O trabalho existiria; o ganho visual, não.

Para conferir depois de publicar: **https://search.google.com/test/rich-results** — cole a URL e
veja se `SoftwareApplication` aparece sem erro.

### 5.3 `robots.txt` — fechar a área logada

Em **`server.js`**, a rota da linha 485:

```js
    if (path === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" });
      // As rotas do app são autenticadas ou vazias sem JS — não têm o que fazer no índice.
      // Elas já vão com noindex na casca (web/index.html), o Disallow aqui só poupa rastreamento.
      return res.end(
        `User-agent: *\n` +
        `Allow: /\n` +
        `Disallow: /api/\n` +
        `Disallow: /app\n` +
        `Disallow: /revisar\n` +
        `Disallow: /novo\n` +
        `Disallow: /pro\n` +
        `Disallow: /ajuda\n` +
        `Disallow: /redefinir\n` +
        `Disallow: /t/\n` +
        `Disallow: /fixa.html\n` +
        `Sitemap: ${BASE_URL}/sitemap.xml\n`
      );
    }
```

> Sutileza que importa: `Disallow` **impede rastrear**, não impede indexar — uma URL bloqueada ainda
> pode aparecer no índice sem descrição se alguém a linkar. Quem realmente tira do índice é o
> `noindex` do §5.1. Os dois juntos: o `noindex` garante a exclusão, o `Disallow` economiza
> rastreamento. Por isso o §5.1 vem primeiro na ordem de prioridade.

### 5.4 `sitemap.xml` — as rotas que merecem indexação

Hoje só existem duas páginas indexáveis de verdade. O sitemap deve listar essas duas e nada mais —
sitemap com URL que não deveria ser indexada é sinal contraditório.

Em **`server.js`**, a rota da linha 489:

```js
    if (path === "/sitemap.xml") {
      res.writeHead(200, { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" });
      // Só página pública com conteúdo próprio. Rota de app (/app, /revisar, /pro, /t/*) fica de
      // fora de propósito: é tela logada, marcada noindex. Ver docs/SEO.md §5.4.
      const paginas = [
        { loc: "/", priority: "1.0" },
        { loc: "/privacidade", priority: "0.3" },
      ];
      const urls = paginas
        .map((p) => `  <url><loc>${BASE_URL}${p.loc}</loc><priority>${p.priority}</priority></url>`)
        .join("\n");
      return res.end(
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      );
    }
```

Cada página nova do §6 entra como uma linha no array `paginas`.

**Não entram no sitemap, em nenhuma hipótese:** `/app`, `/revisar`, `/novo`, `/pro`, `/ajuda`,
`/redefinir`, `/t/*` e `/fixa.html`.

> `lastmod` foi omitido de propósito. Data inventada ou data que muda a cada deploy sem o conteúdo
> mudar faz o Google parar de confiar no campo. Sem ele é melhor do que com ele errado.

### 5.5 404 de verdade (resolve o resto do S1)

Hoje `/pagina-que-nao-existe` devolve `200`. Com o `noindex` do §5.1 o dano ao índice já está
contido, mas o Google continua rastreando lixo e o Search Console vai reportar "Soft 404".

O ponto é o `catch` de `serveStatic` em **`server.js:454`**. A correção honesta é servir a casca
apenas para caminhos que o `parseRoute` do app reconhece, e 404 para o resto:

```js
// server.js — perto do topo de serveStatic. Espelha web/src/App.tsx:68 (parseRoute).
// Se uma rota nova nascer no App.tsx, ela precisa entrar aqui também.
const ROTAS_APP = /^\/(app|novo|revisar|ajuda|pro|redefinir|t\/.+)$/;
```

E no `catch` (linha 452-455), trocar o fallback incondicional por:

```js
  } catch {
    // arquivo com extensão inexistente = 404 de verdade (LAUNCH §6)
    if (EXT_ARQUIVO.has(extname(p).toLowerCase())) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404"); }
    // caminho que não é rota conhecida do app também é 404 — senão qualquer URL inventada
    // devolve 200 com a casca vazia e vira soft-404 no Google (docs/SEO.md §5.5)
    if (!ROTAS_APP.test(p)) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404"); }
    try { const html = await readFile(join(DIST, "index.html")); res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" }); return res.end(html); }
    catch { res.writeHead(404); return res.end("build ausente — rode: cd web && npm run build"); }
  }
```

> **Atenção antes de aplicar:** os CTAs da landing apontam 8× para `href="/temas"`, que **não é rota
> do `parseRoute`** — hoje cai no `catch` e é salvo pelo fallback, virando a home do app. Com esta
> mudança, `/temas` passaria a dar 404 e **os botões "Começar de graça", "Entrar" e "Criar conta"
> quebrariam**. Corrija junto: ou troque os 8 `href="/temas"` por `href="/app"` em
> `web/public/fixa.html`, ou acrescente `temas` ao `ROTAS_APP`. É um bug latente que este documento
> encontrou de raspão — vale conferir de qualquer jeito.

### 5.6 Fechar as pontas soltas (S6 e S7)

**a) Link pra `/privacidade` no rodapé da landing.** Ela é obrigatória pela Play e hoje nenhum link
aponta pra ela. No rodapé de `web/public/fixa.html`:

```html
<a href="/privacidade">Política de privacidade</a>
```

**b) `/fixa.html` → 301 para `/`.** A `canonical` já resolve o duplicado, mas o redirecionamento é
mais limpo e economiza rastreamento. Em `server.js`, junto dos outros redirects (perto da linha 468):

```js
    // a landing tem uma URL só: a raiz. /fixa.html é detalhe de implementação (docs/SEO.md §5.6)
    if (path === "/fixa.html" && req.method === "GET") {
      res.writeHead(301, { Location: `${BASE_URL}/` });
      return res.end();
    }
```

**c) Open Graph — está certo, não mexa.** A landing já aponta `og:image` para
`https://fixaestudos.com.br/brand/og-image.png`, que é **1200×630** (verificado) e é servido em
produção com `200`. Essa é a proporção correta (1,91:1) e o arquivo certo.
`docs/store/feature-graphic.png` é **1024×500**, mora em `docs/` (não é servido pela web) e existe
para a ficha da Play — **não use como `og:image`**. A única melhoria opcional é acessibilidade:

```html
<meta property="og:image:alt" content="Fixa — trilha de estudo com recall ativo e revisão espaçada">
```

(`twitter:title` e `twitter:description` não faltam: quando ausentes, o X e o LinkedIn usam
`og:title`/`og:description`, que já estão preenchidos.)

### 5.7 Título e description por rota numa SPA — as três opções, com o custo real

O pedido é legítimo, mas neste projeto a resposta honesta é **não fazer nenhuma das três agora**.
O motivo: as rotas da SPA são todas autenticadas ou vazias e vão ficar `noindex` (§5.1). Resolver
metadado por rota é resolver um problema que só existe em página que deve ser indexada — e as duas
que devem (`/` e `/privacidade`) já são **HTML estático escrito à mão, com as tags certas**.

Comparativo, para quando a decisão voltar:

| Opção | Como funciona aqui | Custo real neste projeto | Veredito |
|---|---|---|---|
| **a) Injeção no servidor por rota** | mapa rota→`{title, description}` em `server.js`; `serveStatic` faz `replaceAll` de placeholders em `index.html`, como já faz com `__BASE_URL__` | Baixo tecnicamente (o mecanismo **já existe**, linhas 438-443), mas cria uma segunda fonte de verdade: toda rota nova do `App.tsx` precisa ser lembrada no `server.js`, e o esquecimento é silencioso | **É a opção certa quando existir rota pública compartilhável** (ex.: trilha pública). Hoje, sem essa rota, é manutenção sem retorno |
| **b) Prerender no build** | `vite-react-ssg` ou similar gera HTML por rota no `npm run build` | Alto. Exige headless Chrome no build do Render (plano free, build já enxuto), e o resultado seria inútil: as rotas são atrás de login, o prerender capturaria o **estado deslogado** — casca vazia com outro título | **Não.** Custo alto, resultado errado |
| **c) Biblioteca de head** | React 19 já **hoista `<title>` e `<meta>` nativamente** de qualquer componente — `react-helmet-async` nem é necessário (o projeto está em `react@19.2`) | Praticamente zero: `<title>Revisar — Fixa</title>` dentro do componente e pronto | **Sim, mas por UX, não por SEO.** Corrige a aba do navegador e o histórico. **Não** serve pra prévia de link: WhatsApp, LinkedIn, X e Slack não executam JavaScript e continuariam lendo o `<head>` estático |

**Recomendação:** ficar no HTML estático. Página nova que precise ranquear nasce como arquivo em
`web/public/` (igual `fixa.html` e `privacidade.html`), com `<head>` escrito à mão, e entra no
array do §5.4. É a rota mais barata e a que dá o melhor HTML. Se um dia surgir rota pública dentro
do React, aí sim a opção (a).

---

## 6. Conteúdo — o mínimo realista para quem trabalha sozinho

Regra de ouro deste bloco: **melhor três páginas boas que ficam de pé por anos do que um blog
abandonado no terceiro post.** Ninguém aqui vai publicar toda semana, e fingir que vai é como o
plano morre.

O ângulo já está decidido na [DISTRIBUICAO.md](DISTRIBUICAO.md): história de origem, nicho de
certificação primeiro. As páginas abaixo seguem esse ângulo e perseguem consultas de **cauda longa**
— específicas o bastante pra terem chance real contra Anki, Quizlet e os blogs de concurso
mapeados na [CONCORRENTES.md](CONCORRENTES.md).

| # | Página (URL sugerida) | Consulta que persegue | Por que é ganhável | Esforço |
|---|---|---|---|---|
| 1 | `/metodo` — o método, explicado | "recall ativo e revisão espaçada como funciona", "método de estudo que funciona pra prova" | Conteúdo genuinamente nosso, com o intervalo real (1/2/3/4/7/15/30) e a base científica (Dunlosky, Cepeda) que já está em [METODO-CIENCIA-E-PRODUTO.md](METODO-CIENCIA-E-PRODUTO.md). Metade já existe como seção da landing | ~2h |
| 2 | `/certificacao-claude` — como estudei pra certificação da Anthropic | "certificação Claude Anthropic como estudar", "certificação Claude prova" | **A maior aposta.** Consulta nova, quase sem concorrência em português, e é a única história que só nós temos. Casa exatamente com o beachhead da DISTRIBUICAO | ~3h |
| 3 | `/vs/anki` — Fixa e Anki, quando cada um serve | "alternativa ao Anki", "Anki é difícil", "app parecido com Anki mais fácil" | Consulta com intenção de troca, volume real, e a CONCORRENTES.md já tem a análise pronta. **Só funciona se for honesta** — dizer onde o Anki ganha (FSRS, biblioteca) é o que dá credibilidade e o que faz a página ser linkada | ~2h |

Como fazer, na prática:

- Cada uma é **um arquivo `.html` novo em `web/public/`**, no molde do `privacidade.html`: `<head>`
  escrito à mão com `title`, `description`, `canonical`, e uma linha nova no array do §5.4.
- Cada uma linka pra `/` e recebe link do rodapé da landing. Página órfã não ranqueia (é o S6).
- **Uma por mês é ritmo suficiente.** Publicada a página, ela é reaproveitada como post de LinkedIn
  ou TabNews (§4.5) — o mesmo trabalho vira conteúdo **e** backlink.

Ordem sugerida: **2 → 1 → 3**. A #2 é a mais fácil de ganhar e a mais fácil de escrever, porque é
memória, não pesquisa.

---

## 7. Prazo honesto

Assumindo §4.1 a §4.3 feitos hoje e o §5 no ar esta semana:

| Marco | Prazo realista | Observação |
|---|---|---|
| Search Console verificado | minutos a algumas horas | Só depende da propagação do DNS |
| Home rastreada pelo Google | **1 a 7 dias** após "Solicitar indexação" | Dá pra acompanhar na Inspeção de URL |
| Home **indexada** (aparece em `site:fixaestudos.com.br`) | **3 a 20 dias** | Se ficar em "Descoberta — no momento não indexada" além disso, o que falta é backlink (§4.5), não tag |
| Buscar **"fixa estudos"** e o site aparecer na 1ª página | **2 a 8 semanas** | Depende de estar indexado + ter algum link. É o objetivo que motivou este documento |
| Buscar **"fixaestudos"** e o site vir em 1º | **1 a 3 meses** | O nome é praticamente exclusivo; assim que o Google entender a entidade, a posição 1 é natural |
| Ficha da Play indexada | **dias** após publicar | Autoridade emprestada do `play.google.com` |
| Tráfego orgânico relevante (dezenas de visitas/dia) | **6 a 12 meses**, e só com as páginas do §6 | Domínio de 2 semanas não compete com quem tem 10 anos |

**O que seria mentira prometer:**

- Que dá pra aparecer em "app de estudo", "revisão espaçada" ou "como estudar pra concurso" neste
  ano. São consultas de quem tem anos de conteúdo e milhares de links.
- Que existe truque de código que acelera. Depois do §5, o gargalo é **tempo e link** — não tem
  nada em `server.js` que resolva isso.
- Que dá pra prever a data exata da indexação. O Google não publica esse cronograma e ele varia.
- Que o "SEO está pronto". SEO não termina; o que termina é a parte técnica, que é justamente a
  menor parte.

---

## 8. Não faça

Cada item aqui é uma tentação real quando o resultado demora. Todos custam mais do que rendem.

| Armadilha | Por que custa caro |
|---|---|
| **Repetir palavra-chave** ("app de estudo, estudo online, estudar, aplicativo de estudo…") no texto ou nas metas | O Google detecta desde 2011 e trata como spam. Além disso, arruína o texto pra pessoa que lê — e é a pessoa que vira usuária. A landing hoje tem copy boa; encher de termo é destruir um ativo pra ganhar zero |
| **Texto escondido** (branco no branco, `display:none`, atrás de imagem) | Violação explícita das políticas de spam. A punição não é perder posição: é **ação manual**, que tira o site inteiro do índice e leva semanas de reconsideração pra desfazer |
| **Comprar backlink** (pacotes de "500 links por R$50", PBN, guest post pago sem `rel="sponsored"`) | Link comprado é o exemplo nº1 de esquema de link nas políticas do Google. Em domínio novo e sem histórico, é o jeito mais rápido de nascer marcado. E os links que se compra vêm de sites que já estão penalizados — você paga pra herdar problema |
| **Publicar 30 artigos gerados por IA em massa** | A política de spam de 2024 nomeia "abuso de conteúdo em escala" — o critério é o **propósito** (manipular ranqueamento), não a ferramenta. IA como apoio pra escrever a sua história é legítimo; despejar 30 textos genéricos que ninguém pediu é o caso exato que a política mira. E é incoerente com o produto: a CONCORRENTES.md diz que o nosso fosso é **curadoria**, não volume |
| **Trocar link** com outros sites pequenos ("linko você, você me linka") | Padrão trivial de detectar e sem valor. Dez links recíprocos valem menos que um link editorial do TabNews |
| **Inventar `aggregateRating` no JSON-LD** | Nota de avaliação falsa em dado estruturado é ação manual certa. E vira uma promessa que o produto não sustenta |
| **Clicar em "Solicitar indexação" todo dia na mesma URL** | Não acelera nada — o Google ignora repetição — e queima a cota diária que serviria pra URL nova |
| **Trocar de domínio de novo** | A [DECISAO-DOMINIO.md](DECISAO-DOMINIO.md) já bateu o martelo, e o pouco de idade acumulada é o ativo mais escasso hoje. Cada troca zera o relógio |

---

## 9. Como saber se funcionou

- **Semanal, 2 minutos:** Search Console → **Indexação → Páginas**. A conta de "Páginas indexadas"
  precisa sair de 0. Se aparecer "Descoberta — no momento não indexada", o remédio é backlink (§4.5).
- **Semanal:** Search Console → **Desempenho**. Quando começarem a aparecer impressões para
  "fixa estudos", a busca de marca está funcionando.
- **Teste de bolso:** buscar `site:fixaestudos.com.br` no Google. Zero resultado = ainda não
  indexado. É o mesmo teste que produziu o diagnóstico do §2.1, e serve pra acompanhar a cura.
- **Falta medir o resto:** não há analytics no site (S8). Se quiser saber quanto tráfego chega e de
  onde, vale instalar algo leve e sem cookie (Plausible, Umami) — mas isso é decisão de produto e
  de LGPD, não de SEO, e não bloqueia nada aqui.

---

## 10. Ordem de execução, do jeito mais curto

**Hoje, o dono (~40 min):** §4.1 Search Console → §4.3 pedir indexação de `/` → §4.5 item 1 (link
no perfil do LinkedIn) → §4.4 Bing.

**Esta semana, dev:** §5.1 (`noindex` na casca) → §5.2 (JSON-LD) → §5.3 e §5.4 (robots e sitemap) →
§5.6 (rodapé + 301). O §5.5 (404) exige cuidar do `/temas` junto — vale, mas por último.

**Depois do deploy, o dono:** §4.2 submeter o sitemap.

**Próximas 4 semanas, o dono:** um post por semana da [DISTRIBUICAO.md](DISTRIBUICAO.md) — o mesmo
esforço que traz usuário traz o backlink que destrava o índice.

**Próximos 3 meses:** as três páginas do §6, uma por mês, cada uma virando também um post.
