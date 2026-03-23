---
name: gitflow
description: Use ao iniciar uma nova demanda ou tarefa. Define o fluxo obrigatório antes de alterar código: verificar stage, criar branch a partir da main atualizada, seguir padrão feature/xxx.
---

# Gitflow: início de nova demanda

Sempre que for iniciar uma nova demanda ou tarefa, siga estes passos **antes** de alterar qualquer código.

## 1. Verificar alterações em stage

```bash
git status
```

- **Se houver arquivos em stage:** PARE. Pergunte ao usuário (limpar ou stash).
- Só avance quando o stage estiver limpo.

## 2. Atualizar main e criar branch

1. `git checkout main`
2. `git pull origin main`
3. `git checkout -b feature/descricao-curta`

Exemplos: `feature/add-login`, `feature/fix-checkout-flow`, `feature/integrate-backend`.

## 3. Regras

- Branch sempre começa com `feature/`.
- Letras minúsculas e hífens.
- Descrição breve e descritiva.
- Só alterar código após concluir os passos 1 e 2.
