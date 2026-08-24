# Play Billing — vender o Pro dentro do app

Status (24/08): perfil de comerciante verificado. `playBilling` habilitado no TWA e AAB
**versionCode 6** gerado com a permissão `com.android.vending.BILLING` e **targetSdk 36**
— nota: o alpha do androidbrowserhelper exigiu subir minSdk de 21 → 23 (Android 6.0), e a
regeneração do Bubblewrap de 01/08 tinha regredido o target pra 35 (corrigido em 51a9ee3).
O código de compra está escrito (Fase 2 abaixo); o que falta é tudo do lado do Console.
O porquê da regra (app não pode vender fora do Play Billing) está em `PLAY-STORE.md` §6.

## Fase 1 — burocracia (só o dono da conta faz)

1. **Criar o perfil de pagamentos (conta de comerciante)**
   - Play Console → `play.google.com/console` → menu **Configurações → Perfil de pagamentos**
     (ou: app → **Monetizar com o Play → Produtos → Assinaturas** → ele pede pra criar o perfil).
   - Alternativa direta: `pay.google.com/business/console`.
   - Precisa: CPF ou CNPJ, endereço, nome que aparece na fatura do cliente, conta bancária
     pra receber. Pode pedir documento pra verificação de identidade.
   - Verificação leva de horas a alguns dias. Ajuda oficial:
     https://support.google.com/googleplay/android-developer/answer/3092739
2. **Conferir configurações fiscais** no perfil (Merchant Center → Configurações fiscais).
3. **Criar a assinatura** (depois que o perfil verificar):
   - Play Console → app `br.com.fixaestudos.app` → **Monetizar → Produtos → Assinaturas → Criar**.
   - Sugestão: product id `pro`, base plan `mensal` (auto-renovável, R$ 14,90) e base plan
     `anual` (preço de PRICING.md). Preço de fundador entra depois como *offer*.
   - Ajuda: https://support.google.com/googleplay/android-developer/answer/140504

## Fase 2 — código: FEITO (24/08)

Implementado e no repo. Nada disso está testado de ponta a ponta, porque a compra só é
testável com produto criado no Console e service account existindo — veja "O que falta".

- **`play-billing.js`** (módulo novo, no padrão de `email.js`/`push.js`): autentica na Play
  Developer API assinando um JWT RS256 com a chave da service account e trocando por
  access_token (cache em memória, 1h); `getSubscription` na `subscriptionsv2`, `acknowledge`,
  leitura do estado e `decodeRtdn` do envelope do Pub/Sub. Env-gated por
  `PLAY_SERVICE_ACCOUNT_JSON` — sem ela, `playEnabled()` é false e o app roda igual, sem venda.
- **`POST /api/billing/play/verify`** (autenticada): recebe só o `purchaseToken`, confirma o
  estado na Play e concede o plano. O token é ponteiro, não prova — nada do cliente vira Pro.
- **`POST /api/billing/play/rtdn`** (pública): renovação, cancelamento, carência, pausa e
  estorno. O corpo é só aviso: o estado é sempre re-perguntado à Play com o purchaseToken, então
  POST forjado no máximo gasta uma consulta.
- **`web/src/lib/play-billing.ts`**: `getDigitalGoodsService` + `PaymentRequest`. Fora do TWA o
  serviço não existe, tudo devolve null e a tela Plano permanece a da spec §3.2.
- **`Pro.tsx` → `PlayCta`**: CTA só nasce quando há produto publicado no catálogo. O preço
  exibido é o que a Play devolve em `getDetails`, nunca o nosso — exigência de política.
- Compra pendurada (app fechou entre pagar e confirmar) é resgatada por `listPurchases` na
  abertura da tela, senão a pessoa paga e continua free.

### Estado "Pro" é generoso de propósito

`ACTIVE`, `CANCELED` (cancelou a renovação mas o prazo pago corre) e `IN_GRACE_PERIOD` (cartão
recusado, Google tentando de novo) contam como Pro. O `proUntil` sai do `expiryTime` da Play,
então o `checkExpiry` que já existia cuida do rebaixamento preguiçoso se um RTDN se perder.

### Amarra de conta

O `obfuscatedAccountId` nem sempre atravessa a ponte do TWA, então a garantia que sempre vale é
outra: um `purchaseToken` pertence à primeira conta que o apresentou. Sem isso o mesmo
comprovante viraria Pro em quantas contas quisessem.

### Preço e vaga de fundador

Preço não mora no código: quem cobra é o Google, com o valor do Console. O servidor decide
apenas **qual oferta** a pessoa pode usar — `founderOpen()` devolve a oferta `fundador` enquanto
houver vaga, e `null` depois. A vaga é queimada em `aplicarPlay` pelo `offerId` da compra, igual
o Pix já fazia.

## O que falta (tudo do lado do Google, nesta ordem)

1. Subir o **AAB versionCode 6** (targetSdk 36, com a permissão BILLING) na trilha fechada.
2. **Criar a assinatura** em Monetizar → Produtos: product id `pro`, base plans `mensal` e
   `anual`, e uma **oferta de desenvolvedor** `fundador` em cada. Ids diferentes destes? Então
   setar `PLAY_PRODUCT_ID`, `PLAY_PLAN_MES`, `PLAY_PLAN_ANO`, `PLAY_OFFER_FUNDADOR` no Render.
3. **Service account** no Google Cloud com acesso à Play Developer API, vinculada em
   Configuração → acesso à API, e o JSON inteiro em `PLAY_SERVICE_ACCOUNT_JSON` no Render.
4. **Tópico Pub/Sub** com push para `https://fixaestudos.com.br/api/billing/play/rtdn`, e o
   tópico apontado em Monetizar → Configuração de monetização.
5. **Testador de licença** (Configuração → Teste de licença) pra comprar sem cobrar de verdade.
6. Só então dá pra testar a compra num aparelho — é o primeiro momento em que qualquer linha
   da Fase 2 roda de verdade.

## Fase 2 — código (histórico do plano original)

## Fase 2 — código (Claude faz, após confirmação)

- `twa-manifest.json`: `features.playBilling.enabled = true` → regerar com Bubblewrap → novo AAB.
- Front: Digital Goods API + Payment Request API (checkout nativo do Google), só em app mode.
  Guia: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- Servidor: verificação da compra na Play Developer API (service account) + RTDN via Pub/Sub
  (renovação/cancelamento), espelhando o webhook do Mercado Pago em `server.js`.
  Docs: https://developer.android.com/google/play/billing · RTDN:
  https://developer.android.com/google/play/billing/getting-ready#configure-rtdn

## Avisos

- Taxa do Google em assinatura: 15% (R$ 14,90 → ~R$ 12,66 antes de imposto).
- Play Billing não tem Pix — o Pix avulso continua só na web (Mercado Pago).
- Compra só é testável com o app instalado via trilha de teste da Play (já temos).
