# O coração da Fixa — método, ciência e visão de produto (CPO)

> Documento de produto. Objetivo: validar se o **método** condiz com a melhor evidência,
> revisar o **fluxo** e a **geração** com olhar de CPO, e definir o que falta pra ter **cara de produto**.
> Autoria da análise: revisão de produto + ciência da aprendizagem (psicologia cognitiva).

---

## 1. Tese de produto (a régua do CPO)
**Uma frase:** a Fixa pega qualquer objetivo de estudo (idealmente uma prova/certificação) e garante que,
**no dia da prova, o conteúdo esteja fresco** — porque te fez *recuperar da memória* na dificuldade certa e
*revisar* no intervalo certo, em vez de reler e esquecer.

- **Job-to-be-done:** "tenho uma prova/skill com prazo e não posso chegar lá tendo esquecido o que estudei."
- **Wedge:** prep de certificação (nicho que já paga; foi onde nasceu).
- **Por que ganha:** a maioria dos apps é *organização de conteúdo* (flashcard, notas). A Fixa é um **motor de retenção** com método opinado. O conteúdo é commodity; **o método + a disciplina que ele impõe** é o produto.
- **"Cara de produto" =** um **loop diário óbvio** (a fila "Revisar hoje") + **confiança** (conteúdo correto, método explicado) + **primeira vitória rápida** no onboarding + **zero perda de dados**. Sem isso, é um projeto pessoal bonito.

---

## 2. O método × a ciência (o método condiz? em grande parte, SIM)

Nosso loop por task: **Frio → Corrige → Generaliza → Espaça (Leitner)**. Mapeando cada passo à evidência:

### 2.1 "Frio" (responder de cabeça antes de ver) — ✅ é o pilar mais forte que existe
- **Retrieval practice / testing effect:** tentar recuperar da memória — mesmo errando — grava mais do que reler. [Roediger & Karpicke, 2006, *Psychological Science*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3983480/): teste repetido bateu re-estudo na retenção medida 1 semana depois.
- **Generation effect:** gerar a resposta (vs. reconhecer) fixa mais (Slamecka & Graf, 1978).
- **Dunlosky et al. (2013):** entre 10 técnicas, **"practice testing" foi classificada ALTA utilidade** — a mais eficaz junto com espaçamento. [PSPI](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266) · [resumo AFT](https://www.aft.org/ae/fall2013/dunlosky).
- **Veredito:** manter e **reforçar** — é o coração. Risco de produto: hoje o "frio" é *disciplina do usuário* (ele pode espiar). Ver §3.2.

### 2.2 "Corrige" (revela, compara, registra o erro) — ✅ com nuance
- Feedback pós-recuperação consolida; **erros corrigidos com feedback retêm melhor** que acertos fáceis (hypercorrection effect, Metcalfe).
- **Veredito:** manter. Ajuste fino: o valor está em **registrar o erro com a própria palavra** (não só ver a resposta). Nosso campo de anotação já força isso.

### 2.3 "Generaliza" (comprime em 2–4 frases próprias) — ✅ apoio, não protagonista
- **Self-explanation / elaborative interrogation:** explicar "por quê/como" com as próprias palavras ajuda — mas Dunlosky classifica como **utilidade MODERADA** (não alta). É o "Feynman" popular.
- **Veredito:** manter como passo de **consolidação**, sem vendê-lo como o principal. O protagonista é testar + espaçar.

### 2.4 "Espaça" (Leitner, intervalos crescentes) — ✅ segundo pilar, com 1 ajuste importante
- **Distributed practice:** a outra técnica de **ALTA utilidade** de Dunlosky (2013).
- **Cepeda et al. (2006, *Psychological Bulletin*, 317 experimentos):** o intervalo ótimo **cresce conforme cresce o horizonte de retenção** — quanto mais longe a prova, maiores os espaços. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/).
- **Bjork — desirable difficulties:** espaçar deixa a recuperação mais difícil (a memória decai um pouco), e essa dificuldade é o que fortalece. [Bjork & Bjork, 2011](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf).
- **Veredito:** manter — MAS nossa régua é **fixa** (1-2-4-7-15-30). A ciência diz que o espaçamento ideal depende de **quando é a prova**. → **Oportunidade de produto forte: agendar em função da data da prova** ("prova em 45 dias" reescala a régua). Ver §5.

### 2.5 O que a ciência recomenda e a gente **ainda NÃO faz**
- **Interleaving** (intercalar tópicos): força discriminar entre coisas parecidas; Kornell & Bjork (2008) ~dobraram acurácia vs. estudo em bloco. → Nossa fila "Revisar hoje" **já intercala entre temas** (bom!), mas dentro de um tema as tasks são em bloco. Dá pra oferecer um "modo intercalado".
- **Calibração / metacognição:** as pessoas **superestimam** o que sabem (por isso reler "parece" funcionar). O app deveria **medir domínio real** (via acerto na revisão) e mostrar isso — não deixar o usuário se enganar. Hoje "Done" ≠ "domino".
- **O que EVITAR (Dunlosky, baixa utilidade):** reler, grifar, resumir passivamente. O produto deve **desencorajar** isso na UX (nada de "marcar como lido").

**Conclusão da §2:** o método condiz — a Fixa é literalmente *testing + spacing*, o topo do ranking de evidência. Os ajustes são: (a) **forçar o recall** no fluxo (não só na revisão), (b) **espaçamento em função da data da prova**, (c) **medir domínio real** e (d) **oferecer interleaving**.

---

## 3. Revisão do fluxo & da geração (olhar de CPO — onde trava virar produto)

### 3.1 Geração de conteúdo — 🔴 maior risco de produto
- **Fricção:** copy-paste de JSON entre o chat e o app é acorde de projeto pessoal, não de produto. Converte mal.
- **Confiança:** conteúdo gerado por LLM pode vir **errado** — e num app de *aprendizagem*, ensinar errado é o pior pecado (destrói confiança e trust é tudo aqui).
- **Ação:** (1) geração **direta e guiada** dentro do app; (2) uma **camada de qualidade** (validação estrutural já temos; falta revisão de conteúdo — ex.: 2ª passada do modelo checando fatos, ou fonte curada por cima da IA); (3) **biblioteca de temas/certs curados** como âncora de qualidade (o que também vira o produto pago).

### 3.2 O loop de estudo não força o método — 🟠
- No detalhe da task, **tudo aparece de uma vez** (resposta inclusive). O "frio" depende de autocontrole.
- **Ação:** modo estudo que **esconde a resposta por padrão** e só revela após uma tentativa (como já fazemos na revisão). O produto deve *fazer* o método acontecer, não *pedir* que o usuário se comporte.

### 3.3 "Done" não é "domínio" — 🟠
- Marcar Done é autodeclaração. Sem medir recall real, o progresso pode ser ilusório (o exato viés que a ciência alerta).
- **Ação:** domínio = derivado das revisões (caixa Leitner / % de acerto), não do clique em Done. Mostrar "domínio" separado de "concluído".

### 3.4 Sem âncora temporal (data da prova) — 🟠
- O motivador nº1 do nicho é **a data**. Não capturamos.
- **Ação:** cada tema pode ter uma **data-alvo**; a régua de revisão e a meta diária se ajustam a ela (Cepeda). Isso também alimenta urgência/retenção.

### 3.5 Confiabilidade — 🔴 (aprendizado da própria construção)
- Perda de dado = morte de confiança. (Já tivemos corrupção de KV concorrente e uma exclusão indevida.)
- **Ação:** backups/versionamento do estado, exclusões com "lixeira"/undo, e a serialização de escrita que já entrou.

---

## 4. O que faz ter "cara de produto" (checklist do CPO)
1. **Um loop diário óbvio** — abrir o app = "tenho N pra revisar hoje". Esse é o hábito que retém usuário (e conteúdo).
2. **Confiança no conteúdo** — correto, e o **método explicado** (a ciência é feature: mostrar *por que* funciona vende).
3. **Primeira vitória rápida** — onboarding que gera o 1º tema e entrega uma task boa em <3 min.
4. **Progresso honesto e motivador** — streak, domínio real, caixas subindo; sem gamificação infantil.
5. **Zero perda de dados**, rápido, **mobile** (a revisão acontece no celular).
6. **Posicionamento afiado** — "passe na certificação X", não "estude qualquer coisa".

---

## 5. Decisões de CPO & mudanças recomendadas (priorizadas)
| # | Mudança | Por quê (evidência/produto) | Esforço |
|---|---|---|---|
| P0 | **Modo estudo esconde a resposta** (recall forçado na task, não só na revisão) | Testing effect é o pilar; hoje é opcional | baixo |
| P0 | **Data-alvo por tema** → régua de revisão + meta diária escalam pra prova | Cepeda: espaçamento ótimo depende do horizonte | médio |
| P0 | **Domínio ≠ Done** (derivar domínio do acerto na revisão) | Anti-ilusão de competência (calibração) | médio |
| P1 | **Geração direta + camada de qualidade** (fim do copy-paste; checagem de conteúdo) | Fricção + confiança = os dois maiores riscos | alto |
| P1 | **"Por que funciona"** visível no app (o método + ciência) | Trust e motivação viram feature | baixo |
| P2 | **Modo intercalado** (interleaving dentro/entre temas) | Kornell & Bjork 2008 | médio |
| P2 | **Lixeira/undo + backup do estado** | Confiabilidade = confiança | baixo |
| P3 | Contas multiusuário + DB (Fase B do PRODUTO.md) | Pré-requisito de escala, não de validação | alto |

---

## 6. Referências
- Dunlosky, Rawson, Marsh, Nathan & Willingham (2013). *Improving Students' Learning With Effective Learning Techniques.* Psychological Science in the Public Interest. — [artigo](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266) · [resumo AFT](https://www.aft.org/ae/fall2013/dunlosky)
- Roediger & Karpicke (2006). *Test-Enhanced Learning.* Psychological Science. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3983480/)
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006). *Distributed Practice in Verbal Recall Tasks.* Psychological Bulletin. — [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/)
- E. Bjork & R. Bjork (2011). *Making Things Hard on Yourself, But in a Good Way: Desirable Difficulties.* — [PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)
- Kornell & Bjork (2008). *Learning concepts and categories: Is spacing the enemy of induction?* (interleaving)
- Slamecka & Graf (1978). *The generation effect.*
- Karpicke & Blunt (2011, Science). *Retrieval practice > elaborative concept mapping.*
- Metcalfe. *Learning from errors / hypercorrection effect.*
- Ebbinghaus (1885) *forgetting curve*; Leitner (1972) *sistema de caixas*.
