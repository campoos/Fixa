# Lição v2 — gaps + generalização (decisão de identidade + spec cirúrgica)

> **Origem:** primeiro estudo REAL do dono (13/07, lição de enum no tema SQL). Feedback:
> (1) falta o **passo dos gaps** — hoje o pós-pontos-chave "funciona como leitura"; no método
> original dele há um passo fixo de ESCREVER as lacunas da resposta fria; (2) falta a
> **generalização** — resumir o assunto numa frase simples força a separar o essencial;
> (3) dúvida sincera dele: **método fixo ou configurável?**
> **Leis vigentes:** DESIGN-LICAO-UX (fluxo, "enviado é enviado", válvulas), DESIGN-LICAO-UI
> (transcript/dock), DESIGN-TUTOR-IA (correção da jornada), METODO-CIENCIA-E-PRODUTO
> (testing effect, calibração §47, resumo passivo = baixa utilidade §48).
> **Arquivos tocados:** `server.js` (endpoint lesson + tutor), `prompt-tutor.js`,
> `web/src/lib/api.ts`, `web/src/screens/Licao.tsx`. `review-engine.js` intocado.

---

## 0. A DECISÃO — método FIXO. A resposta à dúvida do dono.

**O método não é configurável. Nem por tema, nem por lição, nem por "modo rápido". O que
existe de flexibilidade são as válvulas honestas — por MOMENTO, nunca por configuração.**

Racional (ciência + produto):

1. **O método É o produto.** O parecer de CEO elogiou exatamente isso: opinionated, ciência de
   verdade. Um "app de método configurável" é um app sem método — vira o Notion do estudo, e o
   Notion do estudo já existe e não retém ninguém.
2. **Quem mais precisa do método é quem menos saberia configurá-lo.** O achado central de
   Dunlosky (METODO §28/§48) é que estudantes escolhem MAL as técnicas (reler, grifar) por
   conta própria. Dar toggle de "pular o passo dos gaps" entrega a tesoura pro novato cortar
   exatamente o passo que corrige a auto-avaliação dele.
3. **N=2.** Configurabilidade é otimização sem dado: dobra a matriz de teste, cria paradoxo da
   escolha e fragmenta a história de venda ("o método que me enquadrou numa cert em 1,5
   semana" — UM método, não um cardápio).
4. **A fricção real se resolve com custo, não com opção.** Os dois atos novos são BARATOS por
   desenho: lacunas = bullets curtos com válvula de 1 toque; generalização = 1 frase com teto
   de 140 caracteres. E cada momento intermediário mantém a válvula honesta — o usuário
   apressado escapa em 1 toque **deixando registro verdadeiro** ("disse que não faltou nada"),
   que o Tutor confere. Pressão sem parede.
5. **Critério de revisão registrado:** só se re-discute configurabilidade com dado de coorte —
   se >60% dos usos da válvula de lacunas forem "não faltou nada" com o Tutor apontando gaps
   reais, o problema é copy/custo do passo, não falta de toggle.

**Meio-termo adotado (a parte "escuta o usuário"):** os dois atos novos entram como **campos
dentro dos envios existentes — M continua 3**. Zero estágio novo, zero migração de stage, zero
mudança no indicador de passos. A lição continua "fria → com o contexto → final"; ela fica
mais DENSA, não mais LONGA.

---

## 1. O loop v2 (5 atos de escrita, 3 envios)

| Envio | Atos de escrita | Válvula |
|---|---|---|
| 1. Fria | resposta fria | "deu branco — mostrar {contexto}" (atual) |
| 2. Com o contexto | **(a) lacunas** ("o que faltou na sua fria?") → **(b) reescrita** completa | (a) "não faltou nada — reescrever direto" · (b) "não mudou nada — revelar resposta" (atual) |
| 3. Final | **(a) resposta final** (atual) + **(b) generalização em 1 frase** (≤140 chars) | nenhuma (atual — o final consolida) |

Ciência dos dois atos novos: as lacunas são **calibração metacognitiva ativa** (METODO §47 —
a gente se avalia mal; escrever o próprio erro converte o "conferir" de leitura em produção e
corrige a calibração). A generalização NÃO é o "resumo passivo" de baixa utilidade de Dunlosky
(§48 — aquele é resumir LENDO): é síntese **pós-recall, de memória, com teto de 1 frase** —
compressão que força selecionar o essencial e cria a deixa de recuperação da task.

---

## 2. O passo dos gaps (envio 2 em dois sub-momentos)

### 2.a Comportamento (client-side; o servidor continua vendo UM envio)

O estágio 2 ganha **dois sub-momentos sequenciais no dock** — um campo por vez (mobile: nunca
dois textareas com teclado aberto):

1. **Momento lacunas**: rótulo "antes de reescrever: o que FALTOU na sua fria? escreve as
   lacunas — é isso que consolida" + textarea (rascunho local próprio) + botão violeta
   **"Registrar lacunas"** + válvula "não faltou nada — reescrever direto".
   - Registrar NÃO chama o server: congela as lacunas num bloco do transcript (client, com o
     fade `BORN`) e troca o dock pro momento 2. Sair aqui: as lacunas ficam no rascunho local;
     reabrir volta ao momento 1 com o texto restaurado.
   - Válvula: registra lacunas vazias (= "disse que não faltou nada", registro honesto que o
     Tutor confere) e vai direto ao momento 2.
   - **Auto-skip**: se a fria foi registrada em branco (`answers[0]` vazio), o momento lacunas
     NÃO existe ("o que faltou? tudo" — não há calibração a fazer); o dock abre direto na
     reescrita, com o rótulo atual.
2. **Momento reescrita**: exatamente o passo 2 atual (textarea pré-preenchido com a fria,
   rótulo "achou gaps? reescreve a resposta — agora completa", botão "Enviar e revelar
   resposta", válvula "não mudou nada — revelar resposta"). **O envio manda `{ answer, gaps }`
   juntos** — 1 POST, como hoje.

Prática: mesmo fluxo; rótulo do momento lacunas: "o que você não fez — ou fez diferente do
passo a passo?".

### 2.b Transcript (ordem cronológica — UX §3.1 emendada)

Bloco novo entre os pontos-chave e a reescrita: fria → pontos-chave/passo a passo →
**LACUNAS** → reescrita → modelo → final. Anatomia: `AnswerBlock` (voz do usuário, neutro)
com eyebrow **`suas lacunas`**; lacunas vazias via válvula renderizam
`(disse que não faltou nada)` no itálico apagado do padrão "em branco". Lição v3 antiga (sem
o campo): bloco simplesmente ausente.

### 2.c Anchors em `Licao.tsx`

- Estado novo: `const [gapsMode, setGapsMode] = useState(true)` (reset a cada entrada no
  stage 1) + rascunho `usePersistentState(\`fx-licao-gaps-${trackId}:${taskId}\`, "")`.
- `meta` (hoje linhas 381–392): o ramo `stage === 1` bifurca por `gapsMode && frioNaoBranco`.
- Dock (linhas 553–599): botão do momento lacunas é `bg-primary` com `Pencil`-não — usar
  `TriangleAlert h-4 w-4`? **Não** — `TriangleAlert` é glifo do Tutor pra gap; o botão usa
  `ArrowRight h-4 w-4` (avanço de sub-momento, não envio). Sem kbd chip `enter`? Tem: Enter
  registra (mesma mecânica), hint mantido.
- `doSubmit` (linhas 276–308): payload do envio que leva `stage` 1→2 inclui
  `gaps: gapsDraft.trim()` (ou `""` da válvula; ausente no auto-skip de fria em branco).
- Transcript (após o bloco de pontos-chave, linha 485): renderizar o bloco de lacunas quando
  `stage >= 2 && lesson.gaps !== undefined` — e, durante o momento reescrita da sessão atual,
  o preview client-side congelado.

---

## 3. A generalização (envio final, campo segundo)

### 3.a Comportamento

No dock do passo final, **abaixo do textarea** da resposta final:

```tsx
<input
  value={synthesis} onChange={...} maxLength={140}
  placeholder="o essencial em 1 frase…"
  aria-label="generalização — o essencial em 1 frase"
  className="mt-2 h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[16px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30 sm:text-sm"
/>
```

- Rótulo do passo final ganha a segunda metade: "agora que conferiu: reescreve com a TUA
  palavra — e fecha com o essencial em 1 frase."
- **Obrigatória** (como a resposta final): botão de envio desabilitado até os DOIS campos
  terem texto; `maxLength 140` é o teto que mantém o ato barato ("uma pequena e simples
  frase" — a limitação É o exercício). Contador discreto só quando >110 chars:
  `font-mono text-[10px] text-muted-foreground/60` alinhado à direita.
- Enter no input envia (mesmo handler); Enter no textarea continua enviando (os dois campos
  válidos são pré-condição).
- **Mobile**: o textarea final passa de `max-h-[38svh]` pra `max-h-[32svh]` SÓ no passo final
  (o input de 44px + botão precisam caber acima do teclado — UI §5.d re-conferida em 390×844).
- Payload final: `{ answer, synthesis }`.

### 3.b Transcript

A generalização vive DENTRO do bloco da resposta final (é o arremate dela, não um passo):
rodapé no `AnswerBlock` final — `mt-2 border-t border-border pt-2` + eyebrow `em 1 frase` +
`text-sm font-medium leading-snug`. Lições antigas sem síntese: rodapé ausente.

### 3.c Futuro consciente (fora deste escopo)

A síntese como deixa de recall no `/revisar` (mostrar a frase do próprio usuário após avaliar)
— decisão separada, não implementar agora.

---

## 4. Contratos — server (`server.js`, endpoint `/api/task/lesson`, linhas 810–849)

- `readBody` ganha `gaps` e `synthesis` (linha 811).
- No envio que leva `cur.stage` 0→1: ignora ambos (fria não tem artefatos extras).
- No envio 1→2: `if (gaps !== undefined) cur.gaps = String(gaps).trim().slice(0, 2000);`
  (aceita `""` — é o registro "não faltou nada").
- No envio final (2→3): `synthesis` obrigatória —
  ```js
  const syn = String(synthesis || "").trim();
  if (!syn) return json(res, 400, { error: "fecha com o essencial em 1 frase — é ela que você leva" });
  cur.synthesis = syn.slice(0, 140);
  ```
- Persistência: `s.lesson[taskId] = { stage, answers, gaps?, synthesis?, updatedAt, v3 }` —
  campos novos são opcionais no shape; `restart` (refazer) zera os dois junto (o objeto é
  recriado — já acontece; o front arquiva a síntese nas anotações antes, junto da resposta
  final: emenda no handler `refazer`, `Licao.tsx` linha 342: o comentário arquivado vira
  `"resposta final da lição anterior: {final}\nem 1 frase: {synthesis}"` quando ela existir).
- **`api.ts`**: `Lesson` (linha 36) ganha `gaps?: string; synthesis?: string`; `lessonSubmit`
  (linha 121) ganha os campos opcionais no payload.

---

## 5. O Tutor (`prompt-tutor.js` + endpoint)

- `buildTutorPrompt({ task, answers, comments })` → `buildTutorPrompt({ task, answers, gaps,
  synthesis, comments })` (endpoint passa `cur.gaps`/`cur.synthesis`, linha ~873).
- A `jornada` ganha, entre a fria e a reescrita:
  `LACUNAS QUE O PRÓPRIO ALUNO APONTOU (após ver o material): ${gaps === undefined ? "(não registradas — lição antiga)" : gaps || "(disse que não faltou nada)"}`
  e, ao fim: `GENERALIZAÇÃO DELE (o essencial em 1 frase): ${synthesis || "(não registrada — lição antiga)"}`.
- REGRAS DA CORREÇÃO — dois acréscimos:
  - `- CALIBRAÇÃO: compare as lacunas que ele apontou com as lacunas reais. Apontar as certas é metacognição boa — valorize mesmo que a fria tenha sido fraca. Se disse que "não faltou nada" e faltava, aponte isso como gap (com gentileza firme: é o erro mais caro do estudo).`
  - `- GENERALIZAÇÃO: avalie se a frase captura o essencial da task. Se captura, cite-a como acerto; se pegou algo periférico, diga qual seria A frase. Generalização certeira conta pros 9–10; sua "dica" pode ser uma versão melhor da frase dele.`
- **Shape do JSON de saída NÃO muda** (`nota/veredito/acertos/gaps/dica`) — a validação do
  server (linhas ~880) fica intocada; calibração e síntese entram como conteúdo de
  acertos/gaps/dica, não como campos novos.

---

## 6. Migração/compat — NENHUMA migração de dados

- **M continua 3**: `LESSON_STAGES`, `lessonStages()`, indicador, retomada e escada de
  segmentos intocados. Os sub-momentos do estágio 2 são estado de client.
- **Lições v3 completas**: `gaps`/`synthesis` `undefined` → transcript sem os blocos, Tutor
  recebe "(não registradas — lição antiga)" e corrige normalmente. Nada re-renderiza errado.
- **Lições v3 em andamento**: stage 1 → o próximo envio já coleta lacunas (cliente novo);
  stage 2 → o envio final já exige a síntese (o campo está na tela; a exigência nova vale —
  é 1 frase). Sem flag v4: a presença/ausência dos campos É o versionamento.
- **Cliente velho × server novo** (janela de deploy): envio final sem `synthesis` → 400 com
  mensagem legível; o texto fica no campo (padrão de erro atual). Aceitável pra janela de
  minutos; deploy front+server juntos.

---

## 7. Custo de fluxo — a contabilidade honesta

Antes: 3 envios, 3 escritas. Depois: 3 envios, **5 atos** — mas os 2 novos custam ~60–90s
somados (lacunas = bullets; síntese = 1 frase com teto) e cada um ou tem válvula honesta
(lacunas) ou teto de tamanho (síntese). O dock nunca mostra mais de 1 textarea; o único
momento com 2 campos é o final (textarea + input de 1 linha), re-medido pra teclado mobile
(§3.a). O que o dono sentiu ("rende menos que o manual") era exatamente a ausência desses dois
atos de produção — a lição fica mais densa por ato, não mais comprida por tela.

---

## 8. Microcopy (consolidação)

| Contexto | Texto |
|---|---|
| Rótulo lacunas (teoria) | "antes de reescrever: o que FALTOU na sua fria? escreve as lacunas — é isso que consolida" |
| Rótulo lacunas (prática) | "o que você não fez — ou fez diferente do passo a passo?" |
| Botão lacunas | "Registrar lacunas" |
| Válvula lacunas | "não faltou nada — reescrever direto" |
| Placeholder lacunas | "o que a resposta-modelo… não: o que os pontos-chave têm que a sua fria não tinha?" → usar: "faltou falar de…" |
| Eyebrow do bloco | "suas lacunas" · vazio: "(disse que não faltou nada)" |
| Rótulo final (novo) | "agora que conferiu: reescreve com a TUA palavra — e fecha com o essencial em 1 frase." |
| Placeholder síntese | "o essencial em 1 frase…" |
| Eyebrow síntese no bloco final | "em 1 frase" |
| Erro 400 síntese | "fecha com o essencial em 1 frase — é ela que você leva" |
| Live region (registrar lacunas) | "lacunas registradas — agora reescreve completa" |

---

## 9. Checklist de aceite

- [ ] **Fluxo teoria completo:** fria → pontos-chave → dock pede lacunas → registrar congela
  bloco "suas lacunas" e abre reescrita pré-preenchida → envio único grava `answers[1]` +
  `gaps` → modelo → final com textarea + input de síntese, envio bloqueado até os dois →
  Done automático; transcript final tem 7 blocos na ordem cronológica com a síntese no rodapé
  do bloco final.
- [ ] **Válvulas:** "não faltou nada" registra `gaps: ""` e o transcript mostra "(disse que
  não faltou nada)"; fria em branco pula o momento lacunas direto pra reescrita; final segue
  sem válvula.
- [ ] **M=3 intacto:** indicador mostra 2/3 durante lacunas E reescrita; retomada no stage 1
  reabre no momento lacunas com rascunho local restaurado; nenhum teste de stage quebra.
- [ ] **Mobile 390×844:** em nenhum momento há 2 textareas; no final, textarea (32svh) +
  input + botão visíveis acima do teclado.
- [ ] **Tutor:** prompt inclui lacunas e síntese quando existem; corrige calibração ("disse
  que não faltou nada" com gap real vira gap apontado); lição v3 antiga corrige sem os
  artefatos, sem erro; shape do JSON e validação do server inalterados.
- [ ] **Compat:** lição completa antiga renderiza sem blocos novos; em andamento no stage 2
  conclui exigindo só a síntese; `restart` limpa `gaps`/`synthesis` e o refazer arquiva
  final+síntese nas anotações.
- [ ] **Identidade:** nenhum toggle/config de método em nenhuma superfície; grep por
  "configur" no diff do front = zero ocorrências novas fora desta spec.
- [ ] **Server:** 400 do final sem síntese com a mensagem da tabela; `gaps` aceita `""` e
  ignora nos envios errados; campos clampados (2000/140).
