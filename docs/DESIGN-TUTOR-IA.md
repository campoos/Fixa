# Tutor IA — correção depois do Done (plano pra amadurecer)

> Ideia da **Gabriela** (primeira usuária orgânica 💜), 12/07/2026: ela esperava que ao concluir
> uma task "algo acontecesse" — uma correção. Referência do João: o fluxo dele no task-viewer,
> onde ele colava a resposta no chat e a IA avaliava (nota, o que foi bom/ruim, correções) e
> aceitava conversas de pesquisa complementar.
> STATUS: PLANO (não implementado). Decisões abertas no fim.

## 1. Por que isso é O recurso (não um extra)

O método hoje: Frio → Gaps → Confere → Generaliza → Done → Revisa. O elo fraco é o **Confere**:
o usuário compara a própria resposta com a resposta-modelo **sozinho** — e a ciência que fundamenta
o app (calibração/metacognição) diz que a gente se avalia mal. O Tutor fecha esse buraco:
**recall escrito + correção externa** = o loop completo de um professor particular.

Bônus de produto: é a feature que transforma o Fixa de "app de método" em "tutor" — e é
diferenciação real (Anki/Quizlet não corrigem nada).

## 2. Pré-requisito de UX: a resposta precisa ser ESCRITA

Hoje o "responda de cabeça" é mental; as Anotações são opcionais. Não dá pra corrigir o que não
foi escrito. Mudança de fluxo (que por si só já melhora o método — recall escrito > mental):

- No estágio 0 da questão-modelo ("responda de cabeça — depois revela"), entra um **campo de
  resposta** (textarea): *"escreva sua resposta"*. O revelar continua igual.
- A resposta escrita fica salva na task (novo campo `answers[]` ou vira um comentário tipado).
- Sem resposta escrita → botão de correção pede ela ("escreve primeiro — é isso que fixa").

## 3. O fluxo do Tutor (v1)

1. Usuário escreve a resposta fria → revela pontos-chave → responde de novo (pode editar) → revela resposta.
2. Ao **marcar Done** (ou tocando em **"Corrigir com IA"**): o server monta o contexto
   (objetivo + pontos-chave + questão + resposta-modelo + **resposta do usuário** + anotações)
   e chama o Gemini com prompt de professor-corretor.
3. Resposta do Tutor (estruturada, JSON):
   - **nota 0–10** + 1 linha de veredito
   - ✅ **acertos** (o que a resposta cobriu)
   - ⚠️ **gaps/erros** (o que faltou ou tá errado — com a correção)
   - 💡 **1 dica de fixação** (ex.: "teu erro clássico aqui é X — anota na generalização")
4. A correção é **persistida na task** como item especial (autor "Tutor", estilizado diferente
   dos comentários — card violeta com nota). Vira parte do histórico de estudo.
5. **Tasks práticas**: mesmo fluxo — usuário descreve/cola o que fez; o Tutor compara com os
   passos + resultado esperado.

## 4. Pesquisa complementar (v2 — a conversa)

O João jogava conversas de follow-up. Isso é um **mini-chat por task** (thread com o Tutor,
contexto = task + correção). Custos e UI crescem; fica pra v2 com limite por task (ex.: 5
mensagens). V1 entrega só a correção estruturada — que já resolve 80% do valor.

## 5. Método: a nota NÃO mexe na caixa Leitner (v1)

O Acertei/Errei do Revisar continua **autoavaliado** — a caixa é do usuário. A correção é
feedback formativo, não juiz do agendamento. (V2 pode sugerir: nota < 5 → "quer marcar como
Errei pra rever amanhã?" — sugestão, nunca automático.)

## 6. Limites & custo (coerência com PRICING.md)

- Custo por correção (Gemini Flash): ~R$0,01–0,03 (contexto pequeno, saída curta).
- **Free: 5 correções de degustação** (lifetime) — o suficiente pra viciar.
- **Pro: 100 correções/mês** (fair use; heavy user real usa ~1 por task = ~30-60/mês).
- Mesmo padrão de contadores do genUsage (user.tutorMonth etc.), 402/429 amigáveis.
- Atualizar PRICING.md e a tela /pro (nova linha de feature: "correção por IA das suas respostas").

## 7. Honestidade

- Rotular: *"correção por IA — pode errar; desconfie, confira, aprenda"* (1 linha discreta).
- O Tutor **não vê** a internet; corrige com base no material da task. Dizer isso.

## 8. Superfícies tocadas (quando implementar)

| Onde | O quê |
|---|---|
| server.js | rota POST /api/task/tutor (contexto+Gemini+persistência), contadores, config expõe uso |
| prompt novo | prompt-tutor.js (persona professor: direto, construtivo, nota justa, pt-BR) |
| Track.tsx | campo de resposta no estágio 0; botão "Corrigir com IA"; card do Tutor no histórico |
| Review.tsx | (v2) correção também na sessão de revisão? — decisão aberta |
| /pro + PRICING | nova linha de feature + limites |
| Ajuda | FAQ "o que é a correção por IA?" |

## 9. Feedback do João sobre o mock (12/07) — incorporado ao plano

**9.1 — UI/lugar: a correção NÃO entra inline na árvore.** A tela de estudo já é densa
("meio confusa, poluída" — dono); enfiar um card cheio de informação dentro da task piora.
Direção a explorar na implementação real: a correção como um MOMENTO FOCADO, separado do
fluxo da árvore — candidatos: (a) sheet/overlay limpo que abre ao pedir correção (a árvore
some, só a correção na tela, padrão do player do Revisar); (b) pós-Done, um convite discreto
("ver correção do Tutor →") que leva pra essa superfície; (c) rota própria. O card denso do
mock vira o CONTEÚDO dessa superfície, não um bloco na árvore. **Decisão final = do fluxo
completo de design.**

**9.2 — Pipeline completo na implementação real:** UX designer (papel NOVO no time — criar o
agente), designer visual, marketing (copy/posicionamento da feature), frontend. Nada de
implementar direto.

**9.3 — QUANDO rodar a IA: só no FINAL da task (estudado, decidido).** Análise:
- **Pedagogia (o fator decisivo):** o método vive de *dificuldade desejável* — o esforço
  solitário do frio→gaps é ONDE a memória se forma. IA corrigindo a cada passo vira muleta:
  o usuário para de se esforçar e espera o feedback (mata o recall). A literatura de testing
  effect aponta que feedback APÓS a tentativa completa é igual ou mais eficaz que feedback
  imediato — e preserva o esforço. Corrigir no final = ciência a favor.
- **Qualidade da correção:** no final o Tutor vê a jornada INTEIRA (resposta fria + resposta
  pós-pontos-chave + anotações) e corrige com contexto rico. Por passo, vê fragmentos.
- **Custo:** 1 chamada vs 2-3 por task (livre de multiplicar o gasto por nada).
- **UX:** cada chamada = 3-8s de espera; no meio do loop quebra o ritmo, no final é o momento
  natural de pausa.
- **Válvula de escape (v2, talvez):** um "pedir ajuda ao Tutor" EXPLÍCITO no meio da task
  (o usuário escolhe gastar o momento de aprendizado) — nunca automático por passo.

## 10. Decisões abertas (pro João bater o martelo)

- **D1 — Gatilho:** DEFINIDO que roda só no final (§9.3). Resta: automático no Done vs botão
  explícito pós-Done (recomendo botão/convite — coerente com §9.1).
- **D2 — Nota:** 0–10 (escolar BR, familiar) vs conceito (A/B/C…) vs sem nota (só feedback).
  Recomendo 0–10 — a Gabriela falou "dando nota e tal" 😄.
- **D3 — Resposta escrita obrigatória** pra marcar Done? (força o método, mas adiciona atrito)
  Recomendo: opcional pra Done, obrigatória só pra correção.
- **D4 — Free tem degustação de 5?** ou correção é 100% Pro? (degustação vende melhor; custo ~R$0,15/usuário)
- **D5 — v2 (chat) entra quando?** Sugiro: só depois de medir uso da v1.
