# Domínio — decisão do painel de naming (14/07/2026)

> Painel de 3 agentes independentes: marca (naming), growth/SEO, risco (due diligence).
> Veredito unânime dos dois primeiros; o de risco deu 🟡 com mitigações que REFORÇAM a escolha.

## Decisão

**Comprar: `fixaestudos.com.br`** (Registro.br, R$40/ano, Pix). Opcional defensivo: `fixa.app.br` (+R$40).
**O nome "Fixa" FICA** — verbo-benefício, wordmark e história intactos; o domínio composto é a marca FALADA.

## Racional consolidado
- Rádio-teste: "fixaestudos" dita sozinho, mata a confusão fixa/ficha; `fixa.*` sozinho vazaria type-in pro `fixa.com.br` (de terceiro).
- SERP/CTR: "estudos" em negrito nas queries-alvo; `.com.br` = confiança máxima BR; `@fixaestudos` = handle único; remetente de e-mail legível.
- Descoberta: "fixa" sozinho é poluído (jogos de carro rebaixado c/ 120k downloads, "renda fixa") — o composto foge da briga.
- Abrange o futuro: "estudos" cobre cert hoje e concurso/faculdade/idiomas amanhã.

## Pendências geradas (com data)
- [ ] **20/08/2026 — `fixa.com.br` EXPIRA** (titular PF, domínio de gaveta, sem site). Monitorar o processo de liberação do Registro.br (~30-60 dias pós-inadimplência); opcional: sondar o titular antes.
- [ ] Antes de divulgação grande: busca manual no INPI (radical FIXA, classes 9/41/42 em busca.inpi.gov.br) + depósito de **marca mista** (~R$355/classe c/ desconto ME).
- [ ] Nas lojas de app (futuro): nome composto "Fixa: Estude e Memorize" (ASO — não disputar com jogos/renda fixa).

## Pós-compra (execução do coordenador)
DNS no painel do Registro.br → custom domain no Render (TLS automático) → PUBLIC_URL/BASE_URL,
keep-alive, links de e-mail e landing atualizados; `.onrender.com` segue como fallback.
