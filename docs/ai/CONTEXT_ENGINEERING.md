# Context Engineering no vibe-workspace

Modelo de engenharia de contexto: **carregar o mínimo necessário**, no momento certo.

---

## Mapeamento conceito → artefato

| Conceito | Uso | Onde vive |
|----------|-----|-----------|
| **Skills** | Conhecimento recorrente, on-demand | `.cursor/skills/`, `.claude/skills/` |
| **Subagents** | Tarefas pesadas/isoladas | [SUBAGENTS.md](SUBAGENTS.md) |
| **Slash commands** | Tarefas repetitivas | [SLASH_COMMANDS.md](SLASH_COMMANDS.md) |
| **MCP** | Serviços externos | [MCP_POLICY.md](MCP_POLICY.md) |
| **Project context** | Background estático | [CONVENTIONS.md](CONVENTIONS.md), [COMMANDS.md](COMMANDS.md) |

---

## Quando usar cada um

| Conceito | Quando usar | Quando NÃO usar |
|----------|-------------|-----------------|
| **Skills** | Expertise recorrente, padrões de código, guias de marca | Instrução one-off; acesso a dados externos |
| **Subagents** | Tarefa especializada + multi-etapa + isolamento | Tarefa simples em uma etapa |
| **Slash commands** | Tarefa repetitiva, determinística | Tarefa com raciocínio adaptativo |
| **MCP** | Conectar a serviço externo | Há CLI equivalente |
| **Project context** | Regras estáticas, contratos | Informação dinâmica |

---

## Config versionada

- `.cursor/rules/` e `.cursor/skills/` — Cursor
- `.claude/hooks/` e `.claude/skills/` — Claude Code
- Não versionado: `.claude/settings.local.json`, `.cursor/cache/`
