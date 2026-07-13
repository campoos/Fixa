# Auditoria financeira de escala (13/07/2026)

> Analista financeiro (agente) modelando 100 → 50.000 usuários com o pricing vigente
> (Pro R$19,90 | R$149/ano | fundador R$14,90×100 | free 2 temas + degustações; Tutor incluso).
> Premissas conservadoras: IA no teto de custo, MP 4,5% + inadimplência 5%, anual 30% do mix.

## Veredito
**O modelo fecha com folga em escala.** Margem 63–78% em 10k usuários; R$19,90 aguenta
(custo variável por pagante < R$5 no teto). O gargalo é CONVERSÃO (2% vs 10% muda o lucro 6×),
não volume. Único custo estrutural a atacar: o lembrete diário por e-mail.

## Lucro líquido/mês por cenário (conversão free→pro)
| Usuários | 2% | 5% | 10% |
|---|---|---|---|
| 100 | −R$15 | ~R$25 | ~R$85 |
| 1.000 | ~R$85 | ~R$450 | ~R$1.060 |
| 10.000 | ~R$1.860 (63%) | ~R$5.590 (72%) | ~R$12.260 (78%) |
| 50.000 | ~R$9.500 | ~R$29.500 | ~R$64.000 (~80%) |

Marcos: **R$1k/mês ≈ 130 pagantes · R$5k ≈ 450 · R$10k ≈ 900.**

## Riscos apontados
1. **E-mail diário = o maior custo oculto** — escala com usuários TOTAIS (free eterno): R$450/mês
   em 10k, R$1.800 em 50k no Brevo — mais que Render+Upstash+IA-free somados.
2. **MEI estoura em ~390 pagantes** (teto R$81k/ano) — migração pro Simples (~8%) dói mas não mata.
3. Fundadores R$14,90: −16% de ARPU por cabeça; barato SÓ se ficar em 100.
4. Inadimplência de cartão ~5%/mês composta já come ~9% da receita.
5. Tutor: protegido pelo fair use (heavy capado em R$4,50 < 23% do ticket). Upstash: ruído (R$52 em 10k).

## Recomendações (5)
1. **Trocar Brevo por SES/Resend ou web-push ANTES de 1.000 usuários** (corta 80–90% do custo; push zera).
2. **Congelar fundadores em 100 e nunca reabrir.**
3. **Empurrar o anual R$149 via Pix à vista** (meta 40–50% do mix — elimina inadimplência de cartão).
4. **Preparar saída do MEI em ~300 pagantes** (antes dos 390 — abrir Simples leva semanas; multa retroativa se estourar).
5. **Instrumentar 3 métricas de custo desde já**: cmds Upstash/DAU, % heavy do Tutor, e-mails/dia.
