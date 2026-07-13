# Distribuição — o doc que faltava (PARECER-CEO, apêndice)

> Criado 13/07/2026. Meta do ciclo (PARECER §8.3): **100 usuários ativados em 30 dias, sem
> código novo** que não destrave métrica. Medição: `/api/admin/metrics` (ativação, D7, teto free)
> + diário em DECISAO-90-DIAS.md.

## O ângulo (decisão do dono, 13/07)

**História de origem, não feature list.** "Eu tinha uma certificação da Anthropic (Claude) pra
tirar e a sensação de que reler apostila não fixava nada. Construí o Fixa, apliquei recall ativo
+ revisão espaçada, e me enquadrei no escopo de aprovação em **1,5 semana**." A porta de entrada
é quem estuda certificação de tecnologia/IA; o "serve pra qualquer tema" aparece depois, nunca
na manchete. Landing reposicionada: DESIGN-LP-REPOSICIONAMENTO.md.

Por que funciona: história pessoal verificável > promessa genérica; nicho cert tech/IA é early
adopter, sem gigante BR, e a dor tem preço (US$100–300 a reprovação — PARECER §5).

## Pré-requisitos antes do primeiro post

- [ ] Landing reposicionada NO AR (sem isso, post manda tráfego pra mensagem errada)
- [ ] Domínio próprio (fixa-hbn1.onrender.com num post = amador; e o link muda depois = perde tudo)
- [ ] Render Starter (cold start de 50s mata 100% do tráfego de post — PARECER §9)
- [ ] `/api/admin/metrics` no ar (✅ 13/07) e baseline anotada

## Canais, em ordem de aposta

| # | Canal | Por quê | Formato | Custo |
|---|---|---|---|---|
| 1 | **LinkedIn pessoal (BR)** | história de dev BR estudando cert de IA é conteúdo nativo de LI; audiência dele já é tech | post-história (draft A) + prints; 1 post/semana, 4 semanas | 0 |
| 2 | **Comunidades de cert/IA** (Discord da Anthropic, r/ClaudeAI, r/AWSCertifications, grupos Telegram de cert BR) | é ONDE a persona está; regra: contar a história e o método, produto em segundo plano (anti-spam) | draft B (EN) e C (PT) | 0 |
| 3 | **Twitter/X build in public** | nicho indie hacker + IA; threads de "construí em 3 dias com agentes" têm alcance | thread da construção + thread do método | 0 |
| 4 | **Dev.to / TabNews** | artigo técnico "como estudo certificações com recall ativo (e o app que fiz pra isso)" ranqueia e dura | artigo 800-1200 palavras | 0 |
| 5 | **Parceria rev-share** (PARECER §8.4) | único CAC pagável; criador com audiência empacota "Pack Cert X" | pitch draft D | 30-50% da receita do pack |

Anti-canal (por enquanto): anúncio pago (CAC edtech US$862 vs LTV ~R$150 = suicídio), grupos de
concurseiro (QConcursos território — PARECER §5), Product Hunt (produto em PT-BR, timing errado).

## Drafts

### A — LinkedIn (PT, 1ª pessoa do João, editar à vontade)

> Semana passada eu tinha uma certificação da Anthropic pra estudar e uma certeza: reler apostila
> não ia funcionar. A ciência é clara — releitura dá ilusão de aprendizado; o que fixa é tentar
> lembrar ANTES de conferir (recall ativo) e revisar no espaçamento certo.
>
> Então eu construí uma ferramenta pra me forçar a estudar assim. Escrevo o que sei de cabeça,
> só depois vejo os pontos-chave, reescrevo, e ela agenda as revisões (1, 2, 3, 4, 7, 15, 21,
> 30 dias). Uma IA corrige minha resposta e aponta os gaps.
>
> Resultado: fechei o escopo de aprovação em 1,5 semana de estudo.
>
> Deixei aberta pra quem quiser usar (grátis, sem cartão): [link]
> Se você estuda pra alguma cert, me conta o que achou — tô melhorando ela todo dia.

### B — Reddit r/ClaudeAI ou r/AWSCertifications (EN, tom de relato, produto discreto)

> **How I stopped re-reading docs and actually retained cert material (active recall + spaced repetition)**
>
> Studying for the Anthropic/Claude certification I caught myself re-reading the same docs and
> retaining nothing. Research says re-reading creates an illusion of knowing; what works is
> retrieval practice + spaced repetition.
>
> So I changed the loop: write what I remember cold → only then reveal key points → rewrite →
> review at 1/2/3/4/7/15/21/30 days. Covered the whole exam scope in ~1.5 weeks.
>
> I built a small free tool to force this workflow on myself (AI generates the study track and
> grades my answers). Happy to share the link if anyone wants it — but the method works with
> paper too. Ask me anything.

(regra de reddit: link só em comentário quando pedirem; post com link direto = removido)

### C — Telegram/Discord BR (curto)

> Galera, estudei pra certificação do Claude com recall ativo + revisão espaçada e fechei o
> escopo em 1,5 semana. Montei uma ferramenta grátis que força esse método (a IA monta a trilha
> do tema e corrige tuas respostas). Se alguém quiser testar: [link] — feedback é ouro agora.

### D — Pitch de parceria (criador de conteúdo de cert)

> Oi [nome] — sou dev e criei o Fixa, app de estudo por recall ativo + revisão espaçada (método
> com base em Dunlosky/Cepeda). Proposta: você monta o "Pack [Cert X]" oficial no Fixa (eu dou
> a ferramenta de criação, leva ~1h), divulga pra tua audiência, e fica com [30-50]% da receita
> recorrente de quem assinar pelo teu link. Zero custo pra você, receita nova no que já produz.
> Topa ver uma demo de 15 min?

## Cadência e medição

- 1 ação de distribuição por semana, mínimo, por 4 semanas. Anotar no diário: canal, link,
  data → e os 3 números do `/api/admin/metrics` 48h depois.
- Post que trouxe >20 signups = repetir o formato; <5 = trocar o ângulo, não o canal.
- Feedback qualitativo (comentários, DMs) vira backlog SÓ se destravar ativação/retenção
  (regra 3 da DECISAO-90-DIAS.md).

## Diário de ações

| Data | Canal | Ação/link | Signups 48h | Nota |
|---|---|---|---|---|
| — | — | (primeira ação após landing + domínio) | — | — |
