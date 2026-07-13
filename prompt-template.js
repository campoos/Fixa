// Gera o prompt que o usuário cola no ChatGPT/Gemini. O LLM devolve um JSON no shape
// que study-schema.js valida. Mantém prompt e schema em sincronia (mesmo arquivo de verdade).

const MODE_LABEL = {
  theory: "puramente TEÓRICO (conceitos, sem código)",
  practice: "puramente PRÁTICO (mão na massa, exercícios de código/execução)",
  mixed: "MISTO (mescle tasks teóricas e práticas conforme o tópico pede)",
};

export function buildPrompt({ theme, level = "intermediário", mode = "mixed", depth = "médio" } = {}) {
  const t = (theme || "").trim() || "<tema>";
  const modeText = MODE_LABEL[mode] || MODE_LABEL.mixed;
  return `Você é um designer instrucional. Quebre o tema abaixo em uma trilha de estudo hierárquica (Epic → Story → Task) para eu estudar com repetição espaçada e recall ativo.

TEMA: "${t}"
NÍVEL DO ALUNO: ${level}
ABORDAGEM: ${modeText}
PROFUNDIDADE: ${depth} (poucos epics e essenciais, ou muitos e granulares)

REGRAS DE CONTEÚDO:
- Estruture em Epics (grandes blocos), cada Epic com Stories (subtemas), cada Story com Tasks (unidades atômicas de estudo).
- Ordene do básico ao avançado; uma task deve preparar a próxima.
- Cada Task é do tipo "theory" OU "practice".
- Task "theory": ensina um conceito. Campos: objective (1 frase), keyPoints (3 a 5 bullets curtos do que dominar), sample (uma pergunta-modelo "q" no estilo de prova + a resposta correta "a").
- Task "practice": exercício mão na massa. Campos: objective, language (ex.: "js", "python", "sql"...), steps (3 a 6 passos objetivos do que fazer), expected (qual o resultado/critério de acerto — como sei que fiz certo), hint (uma dica curta, opcional), snippet (trechinho de exemplo, opcional). Faça progressão real: ex. "GET simples" → "tratar erro 404" → "retry/backoff".
- Se o tema envolve programação, código ou ferramenta técnica: mostre CÓDIGO REAL, nunca descreva código só com palavras. keyPoints citam a sintaxe exata entre crases (ex.: \`arr.map(fn)\`); sample.a inclui o trecho de código completo (bloco entre \`\`\` \`\`\`) sempre que a pergunta pede código; practice.snippet traz código inicial de verdade e practice.expected descreve a saída/critério concreto (ex.: "imprime [2, 4, 6]").
- Português. Seja concreto e específico do tema, nada genérico.
- NÃO inclua URLs/links cruos no conteúdo (ex.: "https://..."). Descreva o recurso por extenso (ex.: "a documentação da JSONPlaceholder") — links quebram o JSON ao copiar do chat.

FORMATO DE SAÍDA — responda SOMENTE com um JSON válido (sem markdown, sem comentários, sem texto antes ou depois), exatamente neste shape:
{
  "title": "string (nome do tema)",
  "summary": "string (1 linha)",
  "epics": [
    {
      "title": "string",
      "goal": "string (1 frase do objetivo do epic)",
      "stories": [
        {
          "title": "string",
          "tasks": [
            { "type": "theory", "title": "string", "objective": "string", "keyPoints": ["string"], "sample": { "q": "string", "a": "string" } },
            { "type": "practice", "title": "string", "objective": "string", "language": "string", "steps": ["string"], "expected": "string", "hint": "string", "snippet": "string" }
          ]
        }
      ]
    }
  ]
}

Comece a resposta com "{" e termine com "}". Nada além do JSON.`;
}
