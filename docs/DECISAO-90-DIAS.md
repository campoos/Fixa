# Régua de 90 dias — kill criterion (PARECER-CEO §8.5)

> Escrita em 13/07/2026 por decisão do dono, pra ser lida em **11/10/2026**.
> Founder solo sem régua externa se auto-engana pra sempre. Esta página existe pra impedir isso.
> Rascunho do coordenador — o dono edita os números e ASSINA (troca este bloco pela assinatura).

## A régua

Em **11/10/2026** (90 dias), o Fixa precisa ter:

| Métrica | Mínimo | Fonte |
|---|---|---|
| Usuários **ativados** (criou tema + estudou 1x) | **≥ 100** | `/api/admin/metrics` → `activation.activated` |
| **Pagantes** | **≥ 10** | MP + `byPlan.pro` (excluída a conta do dono) |
| Retenção **D7** | **≥ 20%** | `/api/admin/metrics` → `d7.pct` |

- **Bateu os 3** → o Fixa é negócio: dobra a aposta no nicho (conteúdo/packs de cert, parceria
  rev-share do PARECER §8.4, Render pago sem dó).
- **Bateu 1–2** → diagnóstico honesto de qual alavanca falhou (aquisição? ativação? retenção?)
  e UM ciclo de mais 60 dias focado só nela. Sem adicionar feature nova nesse ciclo.
- **Não bateu nenhum** → o Fixa vira **hobby oficialmente**: continua existindo (o dono usa),
  mas sem meta de receita, sem billing ativo, sem análise de mercado nova. E tudo bem — o
  aprendizado (produto full-cycle, IA, billing, pricing) já pagou o projeto.

## Regras do jogo (anti-autoengano)

1. Signup de amigo/família **não conta** como ativado (marcar na planilha).
2. "Quase bateu" = não bateu. A régua é a régua.
3. Feature nova só entra se destravar diretamente uma das 3 métricas (justificar por escrito
   em 2 linhas no ROADMAP antes de codar).
4. Checkpoint quinzenal: dia 1 e 15 de cada mês, olhar `/api/admin/metrics` e anotar os 3
   números aqui embaixo. 5 minutos, sem análise nova.

## Diário dos checkpoints

| Data | Ativados | Pagantes | D7 | Nota de 1 linha |
|---|---|---|---|---|
| 13/07/2026 | 1 (o dono) | 0 | — | baseline; landing ainda não reposicionada |
