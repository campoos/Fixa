# Política de MCP (Model Context Protocol)

MCP conecta a IA a **serviços e dados externos**. Use somente quando necessário.

---

## Quando usar MCP

- Acessar banco de dados (MongoDB, Redis)
- Integrar com Linear, Jira, Azure DevOps
- Integrar com Sentry
- APIs externas sem CLI adequada
- Ferramentas de terceiros (Figma, Notion)

## Quando NÃO usar MCP

- **Há CLI equivalente** — prefira CLI (ex.: `gh`, `az`, `git`)
- **Só precisa de expertise** — use Skill
- **Dados no repo** — leia arquivos diretamente

## Regras

1. MCP consome contexto — adicione apenas o necessário
2. Skills podem usar MCP se precisarem de dados externos
3. Preferir CLI para Git, GitHub, Azure DevOps
