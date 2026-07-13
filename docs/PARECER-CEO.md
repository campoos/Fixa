# PARECER-CEO — Fixa (avaliação brutal, a pedido do fundador)

> Data: 13/07/2026. Avaliador: CEO/investidor convidado (rigor técnico + unit economics + cicatriz de
> early-stage BR). O fundador pediu pra apanhar. Vai apanhar. Mas cada porrada vem com número e fonte.
> Estado do produto na data: MVP multiusuário no ar (Render free, `fixa-hbn1.onrender.com`), billing
> Mercado Pago pronto no código (`server.js` linhas 40–43, env-gated) a dias de ligar, **2 usuários reais**
> (você e a Gabriela), **0 pagantes**, custo de infra ~R$0.

---

## 1. Veredito em 3 linhas

**Como investimento: NÃO. Passo. Hoje o Fixa não é uma empresa — é um projeto pessoal excelente com uma
tela de preço.** Produto e método: nota 7,5/10. Negócio: nota 2/10, porque a única coisa que mata startup
de consumer — **distribuição** — não aparece em NENHUM dos seus documentos, e você tem 2 usuários, sendo
que um é você e o outro dorme na sua casa. Como side project de custo zero com teto realista de
R$1–4k/mês em 12–18 meses SE você nichar e aprender a vender: vale continuar. Como negócio venture-style: não existe ainda.

---

## 2. O que você acertou (e é verdade, não tapinha)

**a) O método é ciência de verdade, não wellness de LinkedIn.** Seu `METODO-CIENCIA-E-PRODUTO.md` cita
Dunlosky et al. 2013 (practice testing e distributed practice como as DUAS únicas técnicas de alta
utilidade entre 10), Roediger & Karpicke 2006, Cepeda 2006, Bjork. Está correto, está bem lido, e a
decisão de re-escalar a régua pela data da prova (Cepeda) é sofisticação que 95% dos apps de flashcard
não têm. Isso é raro num founder solo. Parabéns sem ironia.

**b) Custo zero e break-even em 3 assinantes.** Render free + Upstash free + Gemini free = você não
queima caixa. Startup que não queima caixa não morre de hemorragia — morre só de tédio. Isso te dá
runway infinito pra errar. Poucos fundadores entendem o valor disso; você construiu assim por instinto.

**c) Velocidade de execução obscena.** MVP funcional + método + Leitner + geração IA + Tutor + billing
em DIAS, solo, com agentes. A capacidade de construir não é o seu gargalo — e isso importa pro cenário
otimista lá embaixo.

**d) Pricing disciplinado (no papel).** R$19,90 no slot mental de streaming BR, fair use explícito em vez
de "ilimitado" mentiroso, veto ao vitalício pago-único, anual via Pix pra matar inadimplência de cartão,
e a auditoria pegou custos que 99% dos indie hackers esquecem (e-mail diário como maior custo oculto,
teto do MEI em ~390 pagantes). O `AUDITORIA-ESCALA.md` é trabalho de gente grande.

**e) Free tier como posicionamento é a leitura certa do mercado.** O Quizlet tem Trustpilot 1.4 exatamente
por paywall raivoso em cima de features que eram grátis ([NT Daily](https://www.ntdaily.com/opinion/quizlet-s-paywalls-place-priority-on-profits-over-pupils/article_848d54c6-4eca-11ef-b6bd-bba8eff900d3.html),
[MintDeck](https://www.mintdeck.app/blog/quizlet-paywall-free-alternative)). Método grátis pra sempre +
gate só na conveniência (IA) é a jogada anti-Quizlet correta.

**f) A análise de concorrência é honesta.** "Não brigar com o FSRS do Anki, adotar depois" e "não brigar
em volume com o Quizlet" são as duas decisões certas. Você não está delirando sobre onde pode ganhar.

**g) O Tutor nasceu de usuária real.** A única feature que veio de alguém que não é você (a Gabriela) foi
priorizada e entregue. Esse reflexo — ouvir usuário e shipar — é o músculo certo. Pena que a amostra é 1.

---

## 3. Onde você está se enganando (a lista de porradas)

**P1 — Você não tem um plano de distribuição. Nenhum. Zero. E distribuição É o negócio.**
Eu li seus 6 documentos estratégicos. Tem ciência cognitiva com paper peer-reviewed, tem modelagem
financeira até 50k usuários, tem painel de pricing com 3 agentes. E a palavra "aquisição" com um plano
atrás dela não aparece PORRA NENHUMA. O M7 do roadmap diz "landing + waitlist + SEO". Isso não é plano de
growth, é uma esperança com três substantivos. O CAC médio de educação B2C é **US$862**
([HockeyStack via Flua](https://www.flua.com.br/blog/cac-custo-de-aquisicao-de-clientes/)) — mesmo que o
seu, orgânico e nichado, seja 20x menor, você modelou 10.000 usuários sem UMA LINHA sobre de onde eles vêm
e quanto custam. Sua auditoria financeira diz "o gargalo é conversão". Mentira. O gargalo é que não existe
NINGUÉM no topo do funil pra converter.

**P2 — 2 usuários = zero validação. Tudo que você "sabe" é hipótese.**
Pricing decidido por painel de 3 agentes de IA. Auditoria feita por agente de IA. Concorrência analisada
por agente de IA. **Seu conselho consultivo inteiro é IA promptada por você — ninguém ali te desafia com
dinheiro no bolso.** Você otimizou preço, fair use e mix anual/mensal de um produto que nunca recebeu um
Pix de estranho. Isso tem nome: masturbação estratégica. É gostoso, parece trabalho, e não valida nada.
O único dado real que você tem é: sua namorada usou e pediu uma feature. N=1.

**P3 — Você vetou o próprio posicionamento. Essa talvez seja a pior.**
TODOS os seus documentos gritam a mesma coisa: PRODUTO.md — *"'Estude qualquer coisa' é fraco; 'passe na
certificação X' é vendável"*. CONCORRENTES.md — *"nicho afiado (uma cert por vez), não 'app de estudo
genérico'"*. METODO — *"Posicionamento afiado — 'passe na certificação X', não 'estude qualquer coisa'"*.
E aí no M9 do ROADMAP tem uma nota SUA, do dono, 12/07: *"o Fixa é AMPLO (qualquer tema — teoria, idioma,
cert, culinária)"*. **Culinária, caralho.** Seus próprios agentes te disseram três vezes pra nichar e você
decidiu, por apego, ser tudo pra todo mundo — que em consumer significa ser nada pra ninguém. A landing
confirma: hero "Aprendizado por repetição espaçada" nomeia a TÉCNICA, não a persona nem o resultado.
Ninguém acorda querendo "repetição espaçada"; acorda querendo passar na prova X.

**P4 — Você está a dias de ligar cobrança DENTRO da infra do seu empregador.**
Seu próprio PRODUTO.md, seção 0, diz: separação de IP é *"pré-requisito de QUALQUER venda"*. O ROADMAP
marca Fase 0 como 🔒 e **não feita**. O app roda no repo `engagement` da Vertem, e o billing Mercado Pago
está pronto pra ligar. Se você cobrar um real de assinatura num produto construído em horário/infra
contestável, você transforma um side project em passivo trabalhista/societário. Isso não é porrada de
investidor, é porrada de advogado. VOCÊ escreveu a regra e está prestes a ignorá-la.

**P5 — O Tutor é feature, não produto. E é o seu único gate pago junto com a geração.**
Correção por LLM com nota 0–10 é um prompt. Qualquer concorrente (ou o próprio usuário no ChatGPT/Gemini
grátis) replica em uma tarde. Seu fosso declarado é "método + estrutura + prática" — correto — mas o que
você COBRA é exatamente a parte commodity (gerar por IA, corrigir por IA). O usuário esperto usa seu
método grátis pra sempre e gera conteúdo no chat que já paga (ou no grátis). Seu free tier generoso é bom
posicionamento E um risco real de canibalização — e você não tem dados pra saber de que lado a moeda cai,
porque, de novo, 2 usuários.

**P6 — Produto de hábito/disciplina tem retenção estruturalmente ruim, e seu modelo financeiro finge que churn não existe.**
Spaced repetition é notório por burnout: "card mountain", fila que explode, abandono em massa — a razão #1
de abandono documentada do Anki ([My Senpai](https://my-senpai.com/insights/why-people-quit-anki.html),
[KevinMD sobre apps de SR falhando com clínicos](https://kevinmd.com/2026/02/spaced-repetition-in-medicine-why-current-apps-fail-clinicians.html)).
Você desenhou contra o "Anki jail" (bom!), mas o problema mais profundo permanece: **o produto exige
disciplina diária, e quem tem disciplina diária é minoria**. Benchmarks de consumer subscription: churn
mensal mediano de 6–14%, e ~72% dos assinantes anuais cancelam no ano 1
([RevenueCat State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps),
[RocketShip HQ](https://www.rocketshiphq.com/revenuecat-state-of-subscription-apps-2025-summary/)).
Sua tabela de lucro em 10k usuários é um SNAPSHOT sem coorte: com churn de 8%/mês, pra MANTER 130 pagantes
você precisa repor ~10/mês, o que a 3% de conversão exige ~350 free signups novos TODO MÊS só pra ficar
parado. De onde? (ver P1.)

**P7 — Primeiro contato do usuário: o app dormindo.**
Eu, avaliador, abri sua landing e tomei **HTTP 503** (cold start do Render free). Tive que esperar e tentar
de novo. Usuário de verdade não tenta de novo. Você quer cobrar R$19,90/mês num app sem domínio próprio
(`fixa-hbn1.onrender.com` — isso é URL de hackathon) que dorme quando ninguém usa. R$7/mês de Render
starter e R$50/ano de domínio resolvem, e você ainda não gastou. Mesquinharia no lugar errado.

**P8 — Você é dev, o jogo é de marketeiro, e você tem um CLT.**
Solo founder empregado: suas horas boas vão pro empregador, e a energia residual vai pra... construir mais
feature, que é o que você gosta. Só que o produto já está NA FRENTE da demanda. Cada hora a mais de código
é procrastinação produtiva. O jogo agora é conteúdo, comunidade, parceria, venda — habilidades que você
não demonstrou em nenhum documento e que não se constroem com agente de IA.

**P9 — Prova social: zero. Nome: fraco pra busca.** A landing não tem um único depoimento, número ou
logo (ok, é honesto — você não tem). E "Fixa" é palavra comum em PT — SEO pra "fixa" é guerra perdida;
você vai depender 100% de marca direta que não existe.

---

## 4. Público: existe? Quem EXATAMENTE?

O TAM de pitch deck é lindo. O SAM honesto é pequeno. Vamos por camadas:

**Os números grandes (o TAM que você NÃO deve usar pra se enganar):**
- Concurseiros: mercado de concursos deve movimentar **R$5 bi+ em 2025**, com projeção de **9 milhões de
  inscrições** no ano ([BM&C News](https://bmcnews.com.br/economia/mercado-de-concursos-deve-movimentar-mais-de-r-5-bi-em-2025/)); CNU 2024 sozinho teve 2,14M inscritos ([Agência Gov](https://agenciagov.ebc.com.br/noticias/202402/concurso-unificado-tem-2-14-milhoes-de-inscritos-de-99-dos-municipios-do-brasil)). Atenção: inscrição ≠ pessoa (o mesmo concurseiro se inscreve em vários) — pessoas ativamente estudando, minha estimativa: 2–4 milhões.
- ENEM: **4,81M inscritos confirmados em 2025**, >5M em 2026 ([MEC](https://www.gov.br/mec/pt-br/assuntos/noticias/2025/julho/enem-2025-mais-de-4-8-milhoes-de-inscritos-confirmados), [Andifes](https://www.andifes.org.br/2026/07/08/enem-2026-mais-de-5-milhoes-tiveram-a-inscricao-confirmada-diz-inep/)).
- OAB: 100–150k inscritos por edição, 3 edições/ano ([Estratégia OAB](https://oab.estrategia.com/portal/estatisticas-completas-do-exame-de-ordem-da-oab/)).
- Residência médica: ENARE 2025/26 com **87 mil inscrições** médicas, 138k no total ([Estratégia MED](https://med.estrategia.com/portal/noticias/enare-2025-2026-bate-novo-recorde-e-ultrapassa-87-mil-inscricoes-para-residencia-medica/)).
- Edtech BR: **US$6 bi em 2025**, projeção US$15,6 bi em 2034 ([IMARC](https://www.imarcgroup.com/brazil-edtech-market)); Brasil = ~69% das edtechs da LatAm ([BM&C](https://bmcnews.com.br/ultimas-noticias/r-20-bilhoes-brasil-reune-689-das-edtechs-da-america-latina/)).
- Certificações de TI: exames AWS custam US$100–300 ([DataCamp](https://www.datacamp.com/blog/aws-certifications)) — a dor de reprovar é cara, e é a persona onde o Fixa NASCEU. Não achei número confiável de certificandos/ano no Brasil; minha estimativa: baixas centenas de milhares/ano, porque é pré-requisito crescente de vaga em cloud/dados.

**O SAM honesto (quem o Fixa consegue de fato servir HOJE):**
Seu produto não tem conteúdo curado, não tem questões de banca, não tem professor. Ele serve quem quer
MÉTODO e aceita conteúdo gerado por IA ou criado por si. Essa pessoa é o **estudante metódico early
adopter** — o mesmo que hoje usa Anki, Notion ou planilha: minha estimativa (não achei dado direto) é de
**dezenas de milhares a ~200 mil pessoas no Brasil**, porque é a interseção de (estuda pra prova séria) ∩
(nerd de método) ∩ (topa app novo de indie). Referência de teto: 84% dos estudantes de medicina usam Anki
nos EUA ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662189/)) — é O nicho de SR; no Brasil o
equivalente (residência) já é servido por Aristo/Medcurso com flashcards inclusos no pacote.

**Disposição a pagar dessa persona:** existe, mas ancorada em CONTEÚDO. O concurseiro paga R$32/mês no
QConcursos (questões comentadas), R$57–95/mês no Gran (videoaulas infinitas), R$89–209/mês no Estratégia.
Ele paga por professor e questão de banca — coisas que você não tem. Pagar R$19,90 por "método + IA" é uma
venda EDUCACIONAL (você precisa convencê-lo de que método > conteúdo), e venda educacional é cara e lenta.
O certificando de TI é a melhor persona: prova em inglês/dólar, dor aguda com prazo, sem gigante BR
dominando prep de cert cloud, e ele É early adopter por profissão. **Era o wedge dos seus docs. Volte pra ele.**

---

## 5. Concorrência: a tabela sem piedade

| Concorrente | Preço | Força | Por que o usuário escolhe ELES e não você |
|---|---|---|---|
| **Anki** | Grátis (desktop/Android); iOS US$24,99 único | FSRS (estado da arte), decks prontos aos milhões, culto em medicina (84% dos med students, [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662189/)) | É grátis, é provado, e o nicho mais fanático de SR do mundo já está lá. Você não ganha essa briga nem com 10 anos de vida. |
| **Quizlet** | US$7,99/mês ou US$35,99/ano ([Brighterly](https://brighterly.com/blog/quizlet-cost/)) | Dezenas de milhões de usuários, zero curva, biblioteca gigante | Efeito de rede de conteúdo. Fraqueza real: paywall odiado (Trustpilot 1.4) e SR fraco — é onde você pode ser o "anti-Quizlet", mas precisa de audiência pra alguém saber disso. |
| **QConcursos** | R$32/mês; anual 12x R$12 ([Exame](https://exame.com/insight/qconcursos-holding-grupoq-ipo/p)) | **460 mil assinantes pagos** (2022), milhões de questões comentadas de banca | O concurseiro quer questão da banca, não trilha de IA. Pelo preço de 1,5 Fixa ele leva o arsenal inteiro. É O concorrente real no seu maior TAM. |
| **Estratégia Concursos** | 12x R$89 a 12x R$209 | Marca, professores-celebridade, PDFs canônicos | Confiança e conteúdo. Concurseiro sério considera o Estratégia "o investimento" e o resto acessório. |
| **Gran Cursos** | Ilimitada 12x R$57,90; vitalícia 12x R$149,90 ([Gran](https://www.grancursosonline.com.br/)) | 240k+ videoaulas, all-you-can-eat | Volume absurdo por preço médio. |
| **Aprova Total** (ENEM) | 12x R$83 / R$99,90/mês ([site](https://aprovatotal.com.br/)) | Marca forte no vestibular, redação corrigida | ENEM compra "cursinho completo", não app de método. |
| **Aristo / Medcurso** (residência) | Medcurso R$4–6k/ano ([DrFinanças](https://drfinancas.com/blog/cursinho-para-residencia-medica/)); Aristo com 50k+ questões E flashcards+revisão espaçada inclusos | Já embutiram SR no pacote premium | O nicho médico — o mais receptivo a SR — já tem SR + conteúdo + marca no mesmo produto. |
| **AI flashcard generators** (StudyFetch, etc.) | US$10–19/mês | Geram cards de PDF/vídeo em segundos, muitos com FSRS | Fazem a sua feature paga (geração IA) como produto inteiro, em inglês, com mais funding. |
| **RemNote / Mochi / Traverse** (indies) | Mochi US$5/mês; Traverse ~US$976k ARR ([Latka](https://getlatka.com/companies/traverse-technologies)) | Provam que indie de SR SOBREVIVE — nichado (Traverse = mandarim, com parceria Mandarin Blueprint) | São o seu espelho realista: teto de ~US$1M ARR, atingido com NICHO + PARCERIA DE AUDIÊNCIA, nunca com "estude qualquer coisa". |
| **ChatGPT/Gemini grátis** | R$0 | O estudante já cola o edital no chat e pede plano + quiz | O concorrente silencioso da sua feature paga. |

**Onde há espaço real (existe, e é estreito):** ninguém no Brasil entrega *trilha estruturada do zero à
prova + recall forçado + espaçamento ancorado na data + prática mão na massa* num produto leve e barato,
**para provas que os gigantes BR não cobrem** — certificações de TI/cloud/dados em primeiro lugar. Seu
CONCORRENTES.md enxergou exatamente esse vão. Sua decisão de "produto amplo" jogou o vão fora.

---

## 6. Financeiro: validando (e destruindo) as suas contas

**O que está certo:**
- Break-even em 3 assinantes: correto e raro. Infra ~R$36/mês (Render starter + domínio) ÷ R$12,42–19,90 ≈ 2–3 pagantes. ✔
- Margem bruta 63–78% em 10k usuários: a aritmética fecha; custo variável por pagante < R$5 no teto com
  fair use enforced no server (conferi o código — os limites existem de verdade). ✔
- Riscos secundários bem pegos: e-mail diário como custo dominante, MEI estourando em ~390 pagantes,
  inadimplência de cartão ~5% composta. Análise financeira acima da média de founder. ✔

**O que as contas escondem (e aqui elas desmoronam):**
1. **CAC = R$0 assumido implicitamente.** Não há UMA linha de custo de aquisição no modelo. Educação B2C
   tem CAC médio de US$862 ([HockeyStack/Flua](https://www.flua.com.br/blog/cac-custo-de-aquisicao-de-clientes/));
   mesmo o seu cenário orgânico-nichado a R$20–80 por signup pago via ads BR faria o payback de um
   assinante de R$19,90 com churn de 8%/mês simplesmente NÃO FECHAR (LTV ≈ 19,90 × ~12,5 meses × margem ≈
   R$180–200; um CAC de R$150+ come tudo). Tradução: **você não pode comprar usuário. Só pode ganhar de
   graça (conteúdo/comunidade/parceria). E isso não está planejado em lugar nenhum.**
2. **Churn ausente.** A tabela de 10k usuários é fotografia, não filme. Com churn mensal de 6–10%
   (benchmark consumer, [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)), manter 130
   pagantes = repor ~8–13/mês = ~300–450 free signups novos/mês a 3% de conversão. Permanentemente.
3. **Conversão 2–10% é intervalo de fé.** Mediana freemium self-serve: 2–5%; bom = 3–5%; ótimo = 6–8%
   ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion),
   [Userpilot](https://userpilot.com/blog/freemium-to-premium/)). O Duolingo, com o melhor time de growth
   do planeta e US$ bilhões de marca, converte ~9% do MAU ([SEC 8-K Q3'25](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25press.htm)).
   Modele 2–3%. O cenário de 10% é fantasia pra você.
4. **Seu free tier pode canibalizar.** Método completo grátis pra sempre + 2 temas: se 1 tema = 1
   concurso/cert inteiro (Epic→Story→Task), o usuário típico — que presta UMA prova por vez — talvez nunca
   precise pagar. Você não sabe, porque não tem usuários pra medir. Instrumente isso antes de qualquer
   otimização de preço.
5. **"130 pagantes = R$1k/mês" é verdade aritmética e irrelevante gerencial** enquanto o funil acima de
   zero não existir. A pergunta certa não é "quantos pagantes pra R$1k" e sim "quantos VISITANTES pra 1
   pagante": a 40% visitante→signup (ótimo) × 3% signup→pago = **~830 visitantes qualificados por pagante**.
   130 pagantes ≈ 108 mil visitas qualificadas. Sente o tamanho do problema de distribuição agora?

---

## 7. Margem de crescimento: três cenários com premissas explícitas

**PESSIMISTA (probabilidade ~60% no caminho atual):**
Premissas: posicionamento amplo mantido, sem canal de aquisição, CLT consumindo as horas, marketing =
postar a landing 3 vezes. Resultado: 200–800 signups em 12 meses (amigos, LinkedIn, um post que não
viraliza), ativação fraca porque o produto não fala com ninguém específico, 5–20 pagantes, **R$100–400/mês**,
e o projeto morre de tédio — o destino de ~todos os apps genéricos de estudo de indie. Nada precisa dar
errado pra esse cenário acontecer; ele é o default.

**REALISTA (~30%, exige mudança de comportamento):**
Premissas: (1) nicho travado em cert de TI/cloud (ou UM concurso específico), (2) landing e conteúdo
reescritos pra essa persona, (3) você produz conteúdo de verdade — 2 posts/semana + presença em
comunidades (Telegram/Discord/Reddit de cert), (4) domínio próprio + Render pago, (5) conversão 3–4%.
Resultado: 2–6k signups no ano 1, 60–250 pagantes, **R$1–4k/mês** com margem alta. É um side project
lucrativo e um ativo vendável pequeno. Teto: o do Mochi — indie saudável, não empresa.

**OTIMISTA (~10%, exige o que você ainda não demonstrou):**
Premissas: tudo do realista MAIS uma parceria de audiência com rev-share — professor/influencer de
concurso ou de cloud que empacota o conteúdo DELE nas trilhas do Fixa (o modelo que levou o Traverse a
~US$976k ARR via Mandarin Blueprint, [Latka](https://getlatka.com/companies/traverse-technologies)) —,
packs de certificação curados como SKU one-time, e você virando distribuidor em vez de construtor.
Resultado: 20–50k usuários em 24 meses, 4–6% de conversão puxada pelo conteúdo curado, **R$15–50k/mês**.
Pra esse cenário ser verdade: nicho + conteúdo curado com especialista + você gastando 70% do tempo em
distribuição. Hoje você gasta ~0%.

---

## 8. As 5 coisas que eu faria no seu lugar AGORA

1. **[Esta semana] Fase 0 antes de qualquer real.** NÃO ligue o Mercado Pago com o produto no repo/infra
   ligado à Vertem. Repo pessoal, conta Render pessoal, domínio próprio, e conversa clara com a empresa
   sobre IP. Você mesmo escreveu que é pré-requisito. Cobrar antes disso é a única decisão em cima da mesa
   que pode te causar dano REAL (jurídico), não só oportunidade perdida.
2. **[Em 14 dias] Mate o "amplo". Trave o nicho: certificação de TI/cloud.** Reescreva o hero: de
   "Aprendizado por repetição espaçada" para algo como "Passe na AWS/Azure/[cert] sem esquecer tudo na
   véspera". É o nicho onde você nasceu, onde não há gigante BR, onde a dor custa US$100–300 por reprovação
   ([DataCamp](https://www.datacamp.com/blog/aws-certifications)) e onde a persona é early adopter. Junto:
   domínio próprio + Render starter (o 503 de cold start na primeira visita é inaceitável pra quem cobra).
3. **[Em 30 dias] 100 usuários reais ou nada de código novo.** Congele features. Meta única: 100 signups
   orgânicos do nicho (comunidades de cert, LinkedIn técnico, r/AWSCertifications, grupos Telegram) e medir
   TRÊS números: ativação (criou 1º tema + fez 1ª revisão), retenção D7, e uso do free limit. Sem esses
   números, todo o resto — pricing, margem, roadmap — continua sendo ficção bem formatada.
4. **[Em 60 dias] Uma parceria de conteúdo com rev-share.** Um professor/criador com audiência no nicho
   empacota um "Pack Cert X" curado no Fixa; ele leva 30–50% da receita do pack. É o único CAC que você
   consegue pagar (zero upfront) e resolve simultaneamente seus dois buracos: distribuição e conteúdo
   confiável (o maior risco apontado pelo seu próprio CPO-doc, §3.1).
5. **[Em 90 dias] Régua de decisão fria, escrita hoje.** Exemplo: "se em 90 dias eu não tiver ≥100 usuários
   ativos e ≥10 pagantes, o Fixa vira hobby oficialmente e eu paro de fingir que é negócio; se tiver,
   dobro a aposta no nicho". Founder solo sem régua externa se auto-engana pra sempre — você já provou que
   consegue produzir análise infinita; produza um kill criterion.

---

## 9. A pergunta que você está evitando

**"Se distribuição é 90% deste jogo e eu só amo os outros 10%, quem vai vender o Fixa?"**

Você construiu em 3 dias o que muita gente não constrói em 6 meses — e passou os dias seguintes pedindo
pra agentes de IA analisarem preço, margem e concorrência de um produto com dois usuários. Tudo isso é a
forma mais sofisticada que já vi de evitar a única atividade que valida um negócio: **colocar o produto na
frente de estranhos e pedir dinheiro**. A ciência do seu método diz que reler dá ilusão de aprendizado e
que só o recall doloroso fixa. O paralelo é perfeito: **planejar é reler; vender é recall frio.** Você está
relendo o próprio negócio há semanas. Vá fazer a prova.

---

## Apêndice — nota sobre a lição de casa

A qualidade dos seus docs é genuinamente alta: METODO-CIENCIA (referências corretas e bem aplicadas),
AUDITORIA-ESCALA (pegou e-mail, MEI, inadimplência), CONCORRENTES (humilde onde deve ser). Duas falhas
graves de portfólio: (1) não existe doc de DISTRIBUIÇÃO — o único que importava; (2) a decisão mais
importante já tomada (produto amplo vs. nicho) foi tomada CONTRA todos os seus docs, sem registrar
justificativa. Se você re-litigar uma única coisa do seu "roadmap travado", que seja essa.

### Fontes principais
- Mercado concursos R$5bi/9M inscrições: [BM&C News](https://bmcnews.com.br/economia/mercado-de-concursos-deve-movimentar-mais-de-r-5-bi-em-2025/) · [Agência Gov (CNU)](https://agenciagov.ebc.com.br/noticias/202402/concurso-unificado-tem-2-14-milhoes-de-inscritos-de-99-dos-municipios-do-brasil) · [Censo QConcursos](https://folha.qconcursos.com/n/censo-dos-concursos-2025)
- ENEM: [MEC 2025](https://www.gov.br/mec/pt-br/assuntos/noticias/2025/julho/enem-2025-mais-de-4-8-milhoes-de-inscritos-confirmados) · [Andifes 2026](https://www.andifes.org.br/2026/07/08/enem-2026-mais-de-5-milhoes-tiveram-a-inscricao-confirmada-diz-inep/)
- OAB: [Estratégia OAB estatísticas](https://oab.estrategia.com/portal/estatisticas-completas-do-exame-de-ordem-da-oab/) · ENARE: [Estratégia MED](https://med.estrategia.com/portal/noticias/enare-2025-2026-bate-novo-recorde-e-ultrapassa-87-mil-inscricoes-para-residencia-medica/)
- Edtech BR: [IMARC](https://www.imarcgroup.com/brazil-edtech-market) · [BM&C LatAm](https://bmcnews.com.br/ultimas-noticias/r-20-bilhoes-brasil-reune-689-das-edtechs-da-america-latina/) · [Startups.com.br](https://startups.com.br/pesquisas/brasil-lidera-mercado-latam-de-edtechs-e-movimenta-us-475m-em-10-anos/)
- QConcursos 460k pagantes: [Exame Insight](https://exame.com/insight/qconcursos-holding-grupoq-ipo/p) · Preços: [Estratégia](https://www.estrategiaconcursos.com.br/assinaturas/) · [Gran](https://www.grancursosonline.com.br/) · [Aprova Total](https://aprovatotal.com.br/) · [DrFinanças (Medcurso)](https://drconcursos.com/melhores-cursos-para-concursos/)
- Quizlet preço/paywall: [Brighterly](https://brighterly.com/blog/quizlet-cost/) · [MintDeck](https://www.mintdeck.app/blog/quizlet-paywall-free-alternative) · [NT Daily](https://www.ntdaily.com/opinion/quizlet-s-paywalls-place-priority-on-profits-over-pupils/article_848d54c6-4eca-11ef-b6bd-bba8eff900d3.html)
- Anki em medicina: [PMC — utilização Anki med students](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662189/) · abandono/burnout SR: [My Senpai](https://my-senpai.com/insights/why-people-quit-anki.html) · [KevinMD](https://kevinmd.com/2026/02/spaced-repetition-in-medicine-why-current-apps-fail-clinicians.html)
- Conversão freemium: [Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion) · [Userpilot](https://userpilot.com/blog/freemium-to-premium/) · [First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- Churn consumer apps: [RevenueCat State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps) · [resumo RocketShip HQ](https://www.rocketshiphq.com/revenuecat-state-of-subscription-apps-2025-summary/)
- Duolingo ~9% paid penetration: [SEC 8-K Q3 2025](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25press.htm)
- CAC educação US$862: [Flua/HockeyStack](https://www.flua.com.br/blog/cac-custo-de-aquisicao-de-clientes/)
- Indies de SR: [Traverse ~US$976k ARR (Latka)](https://getlatka.com/companies/traverse-technologies) · [Mochi (Indie Hackers)](https://www.indiehackers.com/product/mochi-2/revenue) · Certs AWS US$100–300: [DataCamp](https://www.datacamp.com/blog/aws-certifications)
