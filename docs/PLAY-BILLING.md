# Play Billing — vender o Pro dentro do app

Status (31/07): perfil de comerciante criado (fiscal ok, grupo de contas respondido "não").
`playBilling` habilitado no TWA e AAB 1.1.0 (versionCode 4) gerado com a permissão
`com.android.vending.BILLING` — nota: o alpha do androidbrowserhelper exigiu subir
minSdk de 21 → 23 (Android 6.0). Falta: subir o AAB na trilha fechada, criar a
assinatura na Console, e todo o código de compra (Digital Goods API + servidor).
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
