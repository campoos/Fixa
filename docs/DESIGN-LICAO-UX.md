# DESIGN-LICAO-UX.md — UX da Lição como tela própria

> Spec de UX (fluxo, arquitetura de informação, estados, comportamento). **Não é spec visual** —
> nada de cor/px/token aqui; isso é do designer visual, que entra depois com este doc na mão.
> Base: decisões fechadas em `DESIGN-LICAO.md` (modelo 13/07), mock aprovado
> `web/public/mock-tutor.html` (visão 1 + tela de correção; a visão 2 foi descartada),
> plano `DESIGN-TUTOR-IA.md` (§9.1–9.3), e as superfícies existentes `Track.tsx` e `Review.tsx`.

---

## 0. Princípios que regem tudo abaixo

1. **A árvore informa; a Lição ensina.** Nenhum conteúdo de estudo (questão, pontos-chave,
   resposta-modelo) aparece na árvore — mostrar a resposta fora da Lição destrói o recall.
2. **Enviado é enviado.** Cada resposta persistida vira registro da jornada — não é editável
   depois. É o que dá valor à retomada e à correção do Tutor (ele corrige a jornada real,
   não uma versão retocada). O fluxo já dá segunda chance por desenho (o passo 2 é reescrever).
3. **Progresso nunca refém de nada.** Cada envio salva na hora; sair no meio não perde nada;
   Done não depende do Tutor nem de rede no momento do convite.
4. **Um passo por vez, com passado visível.** O usuário só interage com o passo atual, mas
   sempre vê o que já fez acima (transcript) — ritmo de conversa, como o dono descreveu.

---

## 1. Arquitetura — árvore × Lição

### 1.1 A Lição é ROTA PRÓPRIA: `/t/:trackId/l/:taskId`

**Decisão: rota, não overlay.** Racional:
- **Retomada é requisito central** — rota própria é deep-linkável (a Home/notificações futuras
  podem apontar "continue a task 1.1.1" direto), sobrevive a refresh e ao botão voltar do
  navegador/gesto do Android (voltar = sair da Lição = comportamento esperado, sem código especial).
- O app já tem o precedente exato: `/revisar` é uma rota que se apresenta como **player focado**
  (tab bar mobile some, X no topo esquerdo pra sair). A Lição usa o mesmíssimo padrão de shell.
- A **correção do Tutor** (mock aprovado) continua sendo **sheet/overlay em cima da Lição** —
  ela é um momento dentro da Lição, não um lugar; fechar a correção devolve à Lição concluída.

Comportamento de shell (igual ao `/revisar`): tela cheia, conteúdo em coluna única estreita,
tab bar mobile oculta, X no topo pra sair (volta pra `/t/:trackId` com a story da task aberta).

### 1.2 Header da Lição (fixo no topo, sempre visível)

- **X** (sair — §2.6) · **crumb**: `tema · epic/story · id da task` (1 linha, truncável).
- **Título da task**.
- **Indicador de passos**: `passo N de M` (M = 3 na teórica com pontos-chave; 2 sem pontos-chave
  e na prática — §4). Passos vencidos marcados, atual destacado, futuros neutros — mesma
  gramática da escada Leitner do Revisar (o UI resolve a forma). Task concluída: o indicador
  vira o estado "concluída ✓".

### 1.3 O que a TaskRow da árvore mostra e faz agora

**A row inteira vira o convite pra Lição.** Tocar na row (título/área principal) **abre a Lição**
— esse é o gesto primário; a task É a lição.

A row mostra (tudo já existe ou deriva do `lesson`):
- **checkbox Done** (mantido — §6.3), id, ícone de tipo (prática), título;
- **estado da lição** (novo, substitui a expansão como termômetro): nada (não iniciada) ·
  `passo 2/3` (em andamento) · nada além do check (concluída) — em andamento é o único que
  precisa de marcador, é o "você parou aqui" da árvore;
- badges existentes: dominada, contador de anotações.

**O TaskDetail inline atual MORRE.** No lugar, um **peek de leitura** (chevron, como hoje),
com conteúdo estritamente informativo — "o que vou aprender aqui":
- **Objetivo** (o único conteúdo pedagógico permitido na árvore — é promessa, não resposta);
- **Estado da lição** em texto: "não iniciada" / "você parou no passo 2 de 3 · há 3 dias" /
  "concluída em 12/07" + botão primário contextual (**Estudar** / **Continuar lição** /
  **Rever lição**) — mesmo destino da row, redundância intencional;
- **Anotações** (ler e adicionar — continuam sendo da task, não da Lição; quem quer só anotar
  um insight não deveria ter que entrar no player);
- **Editar task** (lápis → `TaskEditor` atual, intocado; remover task continua morando nele).

O que **sai** da árvore e passa a existir só na Lição: questão-modelo, estágios de recall,
pontos-chave, resposta-modelo, passos/dica/exemplo/esperado da prática.

---

## 2. Fluxo da Lição — mapa de estados

### 2.0 Modelo de dados de referência (contrato UX, nomes ilustrativos)

`lesson: { stage: 0|1|2|3, answers: [{ text, at }...], attempt, updatedAt }` por task, server-side.
`stage` = quantas respostas já foram enviadas. `stage 3` (ou 2 no fluxo curto) ⇒ Done automático.
Rascunho não enviado (texto digitado sem enter) persiste **localmente** por task (client-side),
melhor esforço — restaurado ao reabrir; nunca vira registro.

### 2.1 Entrada (resolvida ao abrir a rota)

| Condição | Estado inicial |
|---|---|
| `lesson` ausente/stage 0 (inclui task marcada Done só pelo checkbox — §6.3) | **Primeira vez**: passo 1 ativo, transcript vazio |
| `stage` 1..M-1 | **Retomada**: transcript dos passos feitos + marcador "você parou aqui" + passo atual ativo (§3) |
| `stage` = M (lição completa) | **Concluída**: transcript completo em leitura + convite/correção do Tutor + refazer (§5) |

Em todos: foco inicial no elemento interativo do passo atual (textarea) — exceto concluída
(foco no topo do transcript).

### 2.2 Passo 1 — resposta fria

O usuário vê: crumb/título/indicador (§1.2) + **questão-modelo** em destaque + rótulo do método
("responda de cabeça, escrevendo — é isso que fixa") + **textarea** (com rascunho restaurado,
se houver) + botão de envio.

- **Transição**: botão **"Enviar e ver pontos-chave"** OU **Enter** no textarea
  (Enter envia; Shift+Enter quebra linha; hint discreto no desktop, no mobile só o botão).
  Os dois gestos sempre coexistem em todos os passos.
- **Validação**: envio desabilitado com texto vazio/só espaços. **Válvula honesta**: link
  secundário **"deu branco — mostrar pontos-chave"** que avança registrando a resposta como
  em branco (o registro em branco é dado real da jornada; o Tutor já trata resposta vazia).
  Sem essa válvula o usuário travado inventa texto lixo ou abandona.
- Ao enviar: a resposta congela no transcript (leitura), os pontos-chave **aparecem abaixo**
  (nada some — transcript cresce pra baixo, scroll acompanha), passo 2 ativa.

### 2.3 Passo 2 — resposta com os pontos-chave

O usuário vê: transcript (questão + sua resposta fria) + **pontos-chave** + rótulo ("achou
gaps? reescreve a resposta — agora completa") + **textarea pré-preenchido com a resposta fria**
(editável — é o gesto do mock: ajustar, não redigitar) + envio.

- **Transição**: **"Enviar e revelar resposta"** / Enter.
- **Validação**: mesma do passo 1 (pré-preenchido, então raramente bloqueia); a válvula aqui é
  **"não mudou nada — revelar resposta"** (envia o texto como está).
- Ao enviar: resposta 2 congela, **resposta-modelo** aparece abaixo, passo 3 ativa.

### 2.4 Passo 3 — resposta final (a que vira revisão)

O usuário vê: transcript acumulado + **resposta-modelo** + rótulo ("agora que conferiu:
reescreve com a TUA palavra — é o que você leva desta task") + **textarea vazio** + ação
secundária "aproveitar minha resposta anterior" (copia a do passo 2 pro campo, editável) + envio.

- **Transição**: **"Enviar e concluir ✓"** / Enter. O rótulo do botão avisa a consequência —
  Done é automático e o usuário precisa saber ANTES de apertar.
- **Validação**: **aqui não há válvula de branco** — a resposta final é a anotação de revisão;
  vazia não conclui. Quem não quer escrever tem o checkbox da árvore (§6.3) — a Lição não
  compete com ele, ela é o caminho de quem veio estudar.
- Ao enviar: **Done automático** (persistido; a árvore/progresso refletem no retorno). Se a
  persistência falhar: a resposta fica no campo, erro inline "não consegui salvar — tenta de
  novo", botão reabilitado. Nada é descartado.

### 2.5 Conclusão — Done + convite do Tutor

Estado terminal do fluxo (o transcript completo permanece visível acima):

- Confirmação: **"Task concluída ✓"** + 1 linha de método ("ela volta pra revisão amanhã —
  é o espaçamento trabalhando").
- **Convite do Tutor** (padrão aprovado no mock — card discreto, 1 linha):
  **"Ver correção do Tutor"** + subtexto "nota + o que acertou e o que faltou" + contador de
  plano quando aplicável ("correções: 2/5 da degustação"). Opcional, nunca modal, nunca bloqueia.
  - Limite esgotado: convite vira estado informativo ("correções da degustação esgotadas")
    + link pro Pro. Continua sendo pós-Done — zero impacto na conclusão.
  - Sem rede/erro na correção: erro dentro da sheet do Tutor, com "tentar de novo"; a Lição
    já está concluída, nada a perder.
- **Saídas**: **"Voltar ao tema"** (primária) e, quando existir, **"Próxima: {id} {título}"**
  (a primeira task pendente seguinte — abre a Lição dela direto; é o loop de sessão de estudo).

### 2.6 Correção do Tutor

Tocar no convite abre a **sheet de correção em cima da Lição** — exatamente a tela aprovada
no mock: estado "lendo sua jornada…" → nota + veredito + sua resposta final + acertos/gaps/dica
+ ações (salvar dica nas anotações · voltar ao estudo) + disclaimer de IA. Fechar (X ou
"voltar ao estudo") devolve à Lição concluída, agora com a correção acessível pelo transcript
(card do Tutor no fim — §5). Conteúdo/limites: `DESIGN-TUTOR-IA.md`.

### 2.7 Saída no meio (X / voltar do navegador)

- **Sem diálogo de confirmação.** Tudo que foi enviado já está salvo; texto não enviado fica
  como rascunho local (§2.0). Confirmar saída aqui seria mentira ("você vai perder…" — não vai).
- Ao sair, a árvore mostra a row com `passo N/M` — a continuidade fica visível sem esforço.

### 2.8 Diagrama (resumo)

```
abrir /t/:id/l/:taskId
  ├─ stage 0 ──► PASSO 1 (frio) ──enter──► PASSO 2 (pontos-chave) ──enter──► PASSO 3 (final)
  │                 │ "deu branco"────────────►│                                  │ enter
  │                 └───(fluxo curto §4: direto pro passo final)                  ▼
  ├─ stage 1..M-1 ─► RETOMADA (transcript + "você parou aqui") ─► passo atual   DONE auto
  │                                                                              ▼
  └─ stage M ─────► CONCLUÍDA (transcript + correção se houver + refazer)  ◄── CONCLUSÃO
                                                                 ▲   (convite Tutor ─► sheet correção)
                                                                 └────────── fechar sheet
```

---

## 3. Transcript e retomada

### 3.1 Anatomia do transcript

Ordem cronológica, de cima pra baixo (a mesma em que foi vivido — quem retoma relê a jornada):

1. Questão-modelo (sempre no topo, é a âncora)
2. "sua resposta (frio)" — texto enviado, **somente leitura**
3. Pontos-chave
4. "sua resposta (com os pontos-chave)" — somente leitura
5. Resposta-modelo (+ "esperado", na prática)
6. "sua resposta final" — somente leitura
7. (se houver) card da correção do Tutor — nota + resumo, toque abre a sheet completa

Cada resposta carrega o **quando** ("há 3 dias" / data curta) — na retomada, o tempo passado é
informação de estudo. Resposta registrada em branco aparece como "(em branco — deu branco aqui)".

**Somente leitura, decidido**: respostas enviadas não são editáveis (princípio §0.2). O passo 2
já é a reescrita institucionalizada; permitir editar o passado quebraria a correção do Tutor e
o valor do registro. Única exceção de "voltar atrás": **refazer** a lição inteira (§5).

### 3.2 Como a retomada se apresenta

- A tela abre com o transcript renderizado e um **marcador entre o passado e o presente**:
  `── você parou aqui · há 3 dias ──` imediatamente acima do passo ativo.
- **Scroll automático posiciona o marcador + passo ativo em vista** (o transcript fica acima,
  alcançável rolando pra cima); **foco no textarea**.
- O rótulo do passo ativo se ajusta ao contexto de retomada — ex. passo 2 retomado:
  "releia sua resposta acima — achou gaps? reescreve completa". Nada de tela intermediária
  "bem-vindo de volta": o transcript + marcador SÃO a reorientação.

---

## 4. Tasks do tipo prática (e o fluxo curto)

> **EMENDA DO DONO (13/07, pós-teste real) — SUPERSEDE esta seção: prática também tem M=3.**
> O método é o mesmo pra todo tipo: **fria** (tentar de cabeça, SEM ver o passo a passo) →
> revela **passo a passo/dica/exemplo** (o "contexto", tinta violeta como os pontos-chave) →
> **com o contexto** → revela **esperado + resposta-modelo** → **final**. O racional original
> ("instruções pra FAZER não se escondem") perdeu pro princípio do recall: tentar de cabeça
> ANTES do material é exatamente o que fixa. Só o `objective` fica visível desde a entrada
> (é o enunciado do exercício). Lições antigas de prática migram no server (flag `v3`):
> a resposta única antiga vira a "com o contexto"; a fria fica registrada em branco.

O texto original (M=2), mantido como histórico:

- **Entrada**: o **material de execução aparece de imediato**, antes de qualquer envio —
  objetivo, **passos**, dica, exemplo (snippet). Racional: são instruções pra FAZER, não
  resposta pra esconder; escondê-los quebraria o exercício. O que fica oculto é o
  **esperado** + resposta-modelo (esses sim são gabarito).
- **Passo 1 — relato**: questão-modelo + rótulo "fez o exercício? conta o que você fez e o que
  deu" + textarea. A "resposta" da prática é o **relato do resultado** (o Tutor compara com
  passos + esperado, como já previsto no plano do Tutor §3.5). Válvula: "não consegui fazer —
  mostrar o esperado" (registra em branco).
  - Enviar → revela **esperado + resposta-modelo** no transcript.
- **Passo 2 — final**: idêntico ao passo 3 da teórica ("o que você leva desta task, com a tua
  palavra") → **Enviar e concluir ✓** → Done automático.

**Teórica sem pontos-chave** (campo vazio — IA fraca ou edição): mesmo fluxo curto M=2
(frio → resposta-modelo → final), espelhando o `0 → 2` que o TaskDetail atual já faz.
O indicador mostra `passo N de 2` — o usuário nunca vê um passo "faltando".

---

## 5. Task já concluída — reabrir a Lição

Reabrir mostra o **modo leitura**: header com estado "concluída ✓ · {data}", transcript
completo (§3.1) incluindo o card da correção do Tutor se houver, e as ações:

- **"Ver correção do Tutor"** — se ainda não corrigiu e há saldo no plano (o convite não
  expira: quem concluiu ontem pode corrigir hoje);
- **"Refazer lição"** — **existe, decidido.** É o gesto de re-estudo ativo (coerente com o
  produto: recall se treina repetindo). Comportamento:
  - pede confirmação leve: "refazer substitui suas respostas desta lição — as anotações e a
    correção anterior ficam guardadas nas anotações da task. O Done permanece.";
  - antes de limpar, a correção do Tutor (se houver) é preservada como anotação da task
    (mesmo mecanismo do "salvar dica nas anotações"); a resposta final anterior também vira
    anotação (é a generalização do usuário — não se joga fora);
  - `lesson` reinicia (attempt+1, stage 0); **Done NÃO desmarca** e a caixa Leitner não mexe
    (a nota/refazer nunca tocam o agendamento — decisão §5 do plano do Tutor);
  - corrigir de novo ao fim consome saldo normalmente.
- Task concluída **só pelo checkbox** (sem lesson — inclui todo o legado pré-Lição): o modo
  leitura mostra "concluída sem registro de estudo" + botão **"Estudar mesmo assim"** que roda
  o fluxo normal (§2) — os envios registram a jornada; Done já era, nada re-conclui.

---

## 6. Edge cases

### 6.1 Conteúdo fraco (task gerada por IA com campos ruins)

- **Sem pontos-chave** (teórica): fluxo curto M=2 (§4). Sem mensagem de erro — é um fluxo
  legítimo, não um defeito visível.
- **Resposta-modelo vazia/inútil**: no momento de revelar, o slot mostra "esta task está sem
  resposta-modelo" + ação "editar conteúdo da task" (abre o TaskEditor; ao salvar, a Lição
  recarrega no mesmo passo). O fluxo NÃO trava: o passo final continua disponível ("escreva o
  que você concluiu mesmo assim").
- **Questão-modelo vazia**: a Lição não tem o que perguntar — estado de bloqueio honesto:
  "esta task ainda não tem questão-modelo" + "editar conteúdo" + "voltar". (Único caso em que
  a Lição não abre o passo 1.)
- Edição de conteúdo **durante** lição em andamento: permitida via TaskEditor (menu "editar
  conteúdo" no header da Lição, ação secundária escondida num overflow); o transcript enviado
  não muda — respostas se referem ao que foi visto na hora, e tudo bem.

### 6.2 Respostas em branco em sequência

Usuário que usa a válvula "deu branco" nos dois primeiros passos chega ao final com transcript
de brancos — legítimo (leu pontos-chave + resposta = estudo de leitura). O passo final continua
exigindo texto: o mínimo que a Lição extrai de todo mundo é uma frase com a própria palavra.

### 6.3 O checkbox Done da árvore — MANTÉM, decidido

- Usuários hoje dependem dele (migração de conteúdo, tasks triviais, uso "lista de afazeres").
  Removê-lo transformaria a Lição de convite em pedágio — mata a confiança.
- Marcar pelo checkbox: Done normal, **não** cria/avança `lesson`. Desmarcar: não apaga
  transcript existente (registro é registro).
- Consequência aceita: existem "Done sem estudo". O produto já distingue — **dominada**
  (graduação por revisão) é a métrica de verdade, e a row sem `passo N/M` nem transcript
  conta a história. A Lição vence o checkbox por valor, não por imposição.

### 6.4 Concorrência e estado velho

- Duas abas/dispositivos na mesma lição: o server aceita envio apenas para o `stage` esperado;
  envio com stage defasado retorna conflito e a Lição **recarrega o estado do server**
  (mensagem: "esta lição avançou em outra aba — atualizei aqui"). Última escrita não vence:
  a primeira vence, a atrasada recarrega.
- Task removida enquanto a Lição está aberta: envio falha → estado "esta task não existe mais"
  + voltar ao tema.

---

## 7. Microcopy funcional (texto de trabalho; tom final é do UI/marketing)

| Contexto | Texto |
|---|---|
| Rótulo passo 1 | "responda de cabeça, escrevendo — é isso que fixa" |
| Botão passo 1 | "Enviar e ver pontos-chave" (fluxo curto: "Enviar e revelar resposta") |
| Válvula passo 1 | "deu branco — mostrar pontos-chave" |
| Rótulo passo 2 | "achou gaps? reescreve a resposta — agora completa" |
| Botão passo 2 | "Enviar e revelar resposta" |
| Válvula passo 2 | "não mudou nada — revelar resposta" |
| Rótulo passo 3 | "agora que conferiu: reescreve com a TUA palavra — é o que você leva desta task" |
| Ação secundária passo 3 | "aproveitar minha resposta anterior" |
| Botão passo 3 | "Enviar e concluir ✓" |
| Rótulo passo 1 prática | "fez o exercício? conta o que você fez e o que deu" |
| Válvula prática | "não consegui fazer — mostrar o esperado" |
| Conclusão | "Task concluída ✓" + "ela volta pra revisão amanhã — é o espaçamento trabalhando" |
| Convite Tutor | "Ver correção do Tutor" + "nota + o que acertou e o que faltou" (+ "correções: n/5 da degustação") |
| Marcador de retomada | "── você parou aqui · há {tempo} ──" |
| Estado na árvore/peek | "não iniciada" · "você parou no passo {n} de {m} · há {tempo}" · "concluída em {data}" |
| CTA na árvore/peek | "Estudar" · "Continuar lição" · "Rever lição" |
| Refazer (confirmação) | "Refazer substitui suas respostas desta lição — a resposta final e a correção anterior ficam nas anotações. O Done permanece." |
| Hint de teclado (desktop) | "enter envia · shift+enter quebra linha" |
| Erro de envio | "não consegui salvar — tenta de novo" |
| Done sem lesson | "concluída sem registro de estudo" + "Estudar mesmo assim" |

Convenções de tom já vigentes no app (manter): pt-BR direto, segunda pessoa, sem emoji na UI
(exceção existente: ✓ como glifo de estado), método sempre explicado em 1 linha, nunca em parágrafo.

---

## 8. Não-objetivos (fora do escopo desta spec)

- **Visual**: cores, tipografia, espaçamento, animação — designer visual, sobre este doc.
- **Prompt/conteúdo da correção do Tutor** e limites de plano — `DESIGN-TUTOR-IA.md`.
- **Chat de follow-up com o Tutor** (v2 do plano) — a sheet de correção prevê o slot, nada além.
- **Revisar (`/revisar`)**: intocado — a Lição não substitui nem altera o player de revisão,
  e a nota do Tutor não mexe na caixa Leitner.
- **Nota influenciando agendamento** — explicitamente não (plano §5).
- **Multi-tentativa com histórico navegável** (attempts arquivados e comparáveis): refazer
  substitui; histórico rico fica pra depois se houver demanda.
- **Gamificação da conclusão** (streaks, confete) — a conclusão é sóbria por decisão de tom.

## 9. Checklist de aceite UX (testável)

1. **Árvore limpa**: em nenhum estado a árvore exibe questão-modelo, pontos-chave ou
   resposta-modelo; o peek mostra no máximo objetivo, estado da lição, anotações e editar.
2. **Sequencial estrito**: na Lição, o usuário nunca vê o material do passo seguinte antes de
   enviar o atual (pontos-chave só após envio 1; resposta-modelo só após envio 2; na prática,
   esperado/modelo só após o relato) — e o que já apareceu nunca some do transcript.
3. **Enter e botão**: em todo passo, Enter no textarea e o botão executam o mesmo envio;
   Shift+Enter quebra linha; envio vazio bloqueado, com válvula explícita nos passos
   intermediários e nunca no final.
4. **Done automático**: enviar a resposta final marca a task como Done sem nenhum toque extra,
   e o convite do Tutor aparece somente depois disso; falha do Tutor/limite esgotado não
   afetam o Done.
5. **Retomada exata**: fechar a Lição após o envio N e reabrir (mesmo dias depois, mesmo em
   outro dispositivo) mostra as N respostas em leitura, o marcador "você parou aqui" e o passo
   N+1 ativo com foco no campo; texto digitado e não enviado reaparece como rascunho no mesmo
   navegador.
6. **Saída sem perda e sem alarme**: o X sai imediatamente, sem diálogo, e a row na árvore
   passa a exibir "passo N/M".
7. **Concluída reabrível**: task Done abre em modo leitura com transcript completo + correção
   (se houver) + refazer; refazer preserva resposta final e correção nas anotações e não
   desmarca o Done.
8. **Nada trava por conteúdo fraco**: task sem pontos-chave roda o fluxo curto sem mensagem de
   erro; sem resposta-modelo, a lição segue até concluir com aviso e atalho de edição; apenas
   a ausência de questão-modelo impede o início, com saída de edição oferecida.
