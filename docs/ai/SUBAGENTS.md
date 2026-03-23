# Subagents: Implementer e Reviewer

Dois papéis para a IA no workspace: **Implementer** (implementa e valida) e **Reviewer** (revisa e só aprova com evidência de quality gate).

---

## Quando delegar a subagent

Use subagent quando **as três** condições forem verdadeiras:

1. **Tarefa especializada** — code review, geração de testes, exploração de codebase
2. **Multi-etapa** — várias etapas e decisões
3. **Benefício de isolamento** — manter contexto principal enxuto

---

## Implementer

**Responsabilidades:**
- Entender a intenção do usuário no contexto do workspace/repo
- Planejar (3–7 passos), menor impacto possível
- Implementar seguindo [CONVENTIONS.md](CONVENTIONS.md) e [COMMANDS.md](COMMANDS.md)
- Rodar `make check` e reportar

**NÃO pode:**
- Trocar arquitetura sem aprovação explícita
- Adicionar dependência sem justificar
- Mexer em mais de um repo sem avisar
- Finalizar sem `make check`

---

## Reviewer

**Responsabilidades:**
- Revisar plano e mudanças
- Conferir aderência às convenções
- Verificar evidência de `make check`

**NÃO pode:**
- Sugerir reescrita total sem contexto
- Aprovar sem evidência de `make check`

---

## Fluxo

```
UserIntent → Implementer → CodeChanges → make check
  → [pass] → Reviewer → [approve] → Done
  → [fail] → Implementer (fix)
  Reviewer → [request changes] → Implementer
```
