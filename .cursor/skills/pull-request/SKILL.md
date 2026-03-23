---
name: pull-request
description: Use ao abrir um Pull Request. Define o fluxo para criar PR — GitHub CLI (gh) para vibe-mobile-app, Azure DevOps para vibe-bff.
---

# Pull Request: abertura

## Identificar o repo

- **vibe-mobile-app** → GitHub → `gh pr create`
- **vibe-bff** → Azure DevOps → `git push` + PR via web ou `az repos pr create`

## vibe-mobile-app (GitHub)

### Pré-requisitos
- GitHub CLI instalado e autenticado (`gh auth status`)
- Branch `feature/xxx` com commits

### Fluxo
1. Garantir que `make check` passou
2. `git push -u origin feature/xxx`
3. `gh pr create --base main --title "tipo: descrição" --body "..."`

## vibe-bff (Azure DevOps)

### Fluxo
1. Garantir que `make check` passou
2. `git push -u origin feature/xxx`
3. Criar PR via Azure DevOps web ou: `az repos pr create --source-branch feature/xxx --target-branch main --title "tipo: descrição"`

## Padrão de título

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração
- `docs:` documentação
- `chore:` manutenção, deps

## Padrão de body

```markdown
## O que foi feito
Breve descrição.

## Motivo
Por que essa mudança.

## Como testar
Passos para validar.

## Checklist
- [ ] make check passou
- [ ] Testes atualizados (se aplicável)
```
