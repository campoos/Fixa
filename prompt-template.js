// Gera o prompt que o usuário cola no ChatGPT/Gemini. O LLM devolve um JSON no shape
// que study-schema.js valida. Mantém prompt e schema em sincronia (mesmo arquivo de verdade).

// A abordagem tem que aparecer como regra dura, não como rótulo: com uma linha só ("ABORDAGEM:
// prático") o modelo copiava o exemplo de saída — que mostra os dois tipos de task — e devolvia
// misto. E "prática" descrita só como código fazia tema não-técnico (história, direito) virar
// teoria disfarçada, porque o modelo não sabia o que seria um exercício ali.
const MODE_LABEL = {
  theory: "puramente TEÓRICO (conceitos)",
  practice: "puramente PRÁTICO (o aluno faz, não só lê)",
  mixed: "MISTO (mescle tasks teóricas e práticas conforme o tópico pede)",
};

const MODE_RULES = {
  theory: `- TODAS as tasks têm "type": "theory". NENHUMA task "practice", em nenhum epic.
- Se um exercício cairia bem, vire-o em "sample" (pergunta de prova + resposta), dentro da própria task teórica.`,
  practice: `- TODAS as tasks têm "type": "practice". NENHUMA task "theory", nem pra "dar a base antes" — a base necessária entra no "objective"/"hint" do próprio exercício, jamais como task separada.
- Cada task é um EXERCÍCIO com enunciado próprio e resposta verificável. Teste: se dá pra concluir a task só lendo, ela não é prática — reescreva.
- O que é "prática" depende do tema:
  · tema técnico (código, SQL, cloud, ferramenta): escrever/rodar código, montar um comando, quebrar e consertar algo. Preencha "language".
  · tema NÃO-técnico (história, direito, biologia, concurso, idioma): questões de prova comentadas, análise de um documento/fonte, montar linha do tempo, comparar dois casos, defender um lado num debate, simular uma decisão, redigir um argumento. Aqui "language" fica de fora e "snippet" (se vier) é o trecho da fonte/enunciado, não código.
- "steps" é o enunciado do que fazer (imperativo: "liste...", "responda...", "compare..."), NUNCA um resumo do assunto. "expected" é o gabarito/critério de acerto.`,
  mixed: `- Use os dois tipos, escolhendo o que o tópico pede: conceito que precisa ser entendido → "theory"; habilidade que precisa ser exercitada → "practice".
- Mire em pelo menos um terço de tasks "practice".`,
};

// catálogo de ícones de tema (espelha TRACK_ICONS do server / TRACK_ICON_LIST do front)
export const ICON_CATALOG = ["target","book-open","book-marked","library","notebook-pen","brain","puzzle","blocks","code","terminal","braces","database","server","cpu","bug","git-branch","atom","microscope","telescope","dna","calculator","sigma","chart-line","cloud","stethoscope","heart-pulse","pill","scale","gavel","landmark","scroll-text","shield","briefcase","coins","banknote","trending-up","languages","globe","map","compass","hourglass","palette","music","guitar","camera","film","drama","dumbbell","bike","trophy","medal","chef-hat","utensils-crossed","coffee","mountain","tree-pine","sprout","paw-print","wrench","rocket","zap","plane","car","award"];

export function buildPrompt({ theme, level = "intermediário", mode = "mixed", depth = "médio" } = {}) {
  const t = (theme || "").trim() || "<tema>";
  const m = MODE_LABEL[mode] ? mode : "mixed";
  const modeText = MODE_LABEL[m];
  // o exemplo de saída mostra só o(s) tipo(s) permitido(s): ver a task teórica no exemplo era o
  // que puxava o gerador de volta pro misto quando o pedido era prático.
  const EX_THEORY = `{ "type": "theory", "title": "string", "objective": "string", "keyPoints": ["string"], "sample": { "q": "string", "a": "string" } }`;
  const EX_PRACTICE = `{ "type": "practice", "title": "string", "objective": "string", "language": "string (só em tema técnico; omita fora disso)", "steps": ["string"], "expected": "string", "hint": "string", "snippet": "string" }`;
  const exTasks = m === "theory" ? EX_THEORY : m === "practice" ? EX_PRACTICE : `${EX_THEORY},\n            ${EX_PRACTICE}`;
  const fieldDocs = [
    m === "practice" ? null : `- Task "theory": ensina um conceito. Campos: objective (1 frase), keyPoints (3 a 5 bullets curtos do que dominar), sample (uma pergunta-modelo "q" no estilo de prova + a resposta correta "a").`,
    m === "theory" ? null : `- Task "practice": exercício. Campos: objective, language (só em tema técnico: "js", "python", "sql"...), steps (3 a 6 passos objetivos do que FAZER), expected (resultado/critério de acerto — como sei que acertei), hint (dica curta, opcional), snippet (enunciado/trecho de apoio, opcional). Faça progressão real: em código, "GET simples" → "tratar erro 404" → "retry/backoff"; em humanas, "identificar as causas na fonte" → "comparar duas interpretações" → "defender uma tese com evidência".`,
  ].filter(Boolean).join("\n");
  return `Você é um designer instrucional. Quebre o tema abaixo em uma trilha de estudo hierárquica (Epic → Story → Task) para eu estudar com repetição espaçada e recall ativo.

TEMA: "${t}"
NÍVEL DO ALUNO: ${level}
PROFUNDIDADE: ${depth} (poucos epics e essenciais, ou muitos e granulares)

REGRAS DE CONTEÚDO:
- Estruture em Epics (grandes blocos), cada Epic com Stories (subtemas), cada Story com Tasks (unidades atômicas de estudo).
- Ordene do básico ao avançado; uma task deve preparar a próxima.

ABORDAGEM — ${modeText}. Isto é obrigatório e vale pra trilha inteira:
${MODE_RULES[m]}

${fieldDocs}
- Se o tema envolve programação, código ou ferramenta técnica: mostre CÓDIGO REAL, nunca descreva código só com palavras. ${m === "practice" ? "" : "keyPoints citam a sintaxe exata entre crases (ex.: \\`arr.map(fn)\\`); sample.a inclui o trecho de código completo (bloco entre \\`\\`\\` \\`\\`\\`) sempre que a pergunta pede código" + (m === "theory" ? "." : "; ")}${m === "theory" ? "" : "practice.snippet traz código inicial de verdade e practice.expected descreve a saída/critério concreto (ex.: \"imprime [2, 4, 6]\")."}
- Português. Seja concreto e específico do tema, nada genérico.
- NÃO inclua URLs/links cruos no conteúdo (ex.: "https://..."). Descreva o recurso por extenso (ex.: "a documentação da JSONPlaceholder") — links quebram o JSON ao copiar do chat.

FORMATO DE SAÍDA — responda SOMENTE com um JSON válido (sem markdown, sem comentários, sem texto antes ou depois), exatamente neste shape:
{
  "title": "string (nome do tema)",
  "summary": "string (1 linha)",
  "icon": "string — escolha O ÍCONE MAIS RELACIONADO ao tema dentre exatamente estes nomes: ${ICON_CATALOG.join(", ")}",
  "epics": [
    {
      "title": "string",
      "goal": "string (1 frase do objetivo do epic)",
      "stories": [
        {
          "title": "string",
          "tasks": [
            ${exTasks}
          ]
        }
      ]
    }
  ]
}

Comece a resposta com "{" e termine com "}". Nada além do JSON.`;
}
