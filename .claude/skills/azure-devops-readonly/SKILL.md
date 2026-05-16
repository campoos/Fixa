---
name: azure-devops-readonly
description: Use SEMPRE que o usuário enviar um link `dev.azure.com` ou mencionar Azure DevOps, AzDO, ADO, sprint, work item, PBI, task, bug, PR do DevOps, organização grupoltm ou projeto Vertem Innovation. Define como consultar via tool local `tools/azdo-sprint` (PAT no Keychain). **Default é somente-leitura**; operações de escrita (update/create/delete de work items, comentários, transições) **só** com pedido explícito do operador e após confirmação.
---

# Azure DevOps — grupoltm / Vertem Innovation (default read-only)

Ative esta skill **toda vez** que aparecer um link ou menção a Azure DevOps no contexto do usuário. A autenticação usa um PAT pessoal do usuário guardado no Keychain do macOS.

**Default = somente leitura.** Escrita é possível, mas só sob **pedido explícito do operador** e mediante o protocolo de confirmação descrito mais abaixo. Mesmo assim, Claude nunca executa escrita proativamente "pra completude".

## Gatilhos de ativação

Ativar quando o usuário:

- Colar URL contendo `dev.azure.com/grupoltm` (ou outro org do grupo)
- Mencionar "Azure DevOps", "AzDO", "ADO", "DevOps" (no contexto de tickets)
- Mencionar "Sprint NN", "PBI", "work item", "user story", "bug" em contexto de produto
- Citar "grupoltm", "Vertem Innovation", "Vertem Innovation Team"
- Pedir status / lista / detalhe de tarefas, bugs, releases por sprint

## Configuração fixa

- **Organização:** `grupoltm`
- **URL base:** `https://dev.azure.com/grupoltm`
- **Projeto default:** `Vertem Innovation`
- **Team default:** `Vertem Innovation Team`
- **Tool path:** `tools/azdo-sprint/` (na raiz do `vibe-workspace`)
- **PAT (Keychain):** account=`$USER`, service=`azdo-pat-grupoltm`
- **Fallback de PAT:** env var `AZDO_PAT`

## Tool disponível

A tool oficial pra consultar é `tools/azdo-sprint`, escrita em Node/TS, usa o SDK `azure-devops-node-api`. Comandos:

```bash
cd tools/azdo-sprint

# Lista work items de uma sprint (default: Sprint 67)
npm run list

# Sprint específica
npm run list -- "Sprint 68"

# Typecheck
npm run typecheck
```

### Variáveis de ambiente reconhecidas pela tool

| Var | Default |
|-----|---------|
| `AZDO_ORG_URL` | `https://dev.azure.com/grupoltm` |
| `AZDO_PROJECT` | `Vertem Innovation` |
| `AZDO_TEAM` | `Vertem Innovation Team` |
| `AZDO_SPRINT` | `Sprint 67` |
| `AZDO_PAT` | (lido do Keychain) |
| `AZDO_KEYCHAIN_SERVICE` | `azdo-pat-grupoltm` |

### Sempre prefira a tool ao `curl` direto

A tool já faz: auth no Keychain, resolução de team/iteration por nome, paginação, type-safety. Use `curl` ao Azure DevOps REST API só se a tool não cobrir o caso (ex.: endpoint exótico, debug). Nesse caso, ler o PAT via:

```bash
security find-generic-password -a "$USER" -s "azdo-pat-grupoltm" -w
```

E **nunca** ecoar o PAT em mensagens nem persistir em arquivos.

## Como interpretar URLs do Azure DevOps

URLs vêm URL-encoded (espaços = `%20`). Sempre decodificar antes de extrair valores.

### Sprint taskboard

Padrão:
```
https://dev.azure.com/{org}/{project}/_sprints/taskboard/{team}/{project}/{sprintName}
```

Exemplo:
```
https://dev.azure.com/grupoltm/Vertem%20Innovation/_sprints/taskboard/Vertem%20Innovation%20Team/Vertem%20Innovation/Sprint%2067
```

Decodificado → org=`grupoltm`, project=`Vertem Innovation`, team=`Vertem Innovation Team`, sprint=`Sprint 67`.

Ação: `npm run list -- "Sprint 67"` (passando flags `AZDO_*` se project/team divergirem do default).

### Work item individual

Padrão:
```
https://dev.azure.com/{org}/{project}/_workitems/edit/{id}
```

Ação (caso não esteja na tool ainda): pedir confirmação pra adicionar suporte, ou usar `curl` read-only:

```bash
PAT=$(security find-generic-password -a "$USER" -s "azdo-pat-grupoltm" -w)
curl -s -u ":$PAT" \
  "https://dev.azure.com/grupoltm/Vertem%20Innovation/_apis/wit/workitems/{id}?api-version=7.1" | jq .
```

### Outros padrões (não suportados pela tool ainda)

- `_boards/board/...` — board kanban
- `_git/{repo}` — repo de código
- `_git/{repo}/pullrequest/{id}` — PR
- `_build/results?buildId={id}` — pipeline
- `_release?...` — release

Pra qualquer um desses, **avisar ao usuário** o que dá pra fazer com a tool atual e perguntar se quer evoluir a tool ou usar `curl` pontual.

## Operações de escrita — apenas sob pedido explícito

O PAT atualmente salvo no Keychain (`azdo-pat-grupoltm`) tem escopo apenas de leitura (Work Items: Read, Project and Team: Read). Por isso, mesmo com pedido explícito do operador, **qualquer chamada de escrita vai falhar com 401/403** até que o PAT seja rotacionado com escopo apropriado.

### REST API — métodos de escrita

Métodos `POST`, `PATCH`, `PUT`, `DELETE` em endpoints `_apis/wit/...`, `_apis/work/...`, `_apis/git/...`, `_apis/build/...`, `_apis/release/...` — proativamente **nunca**. Sob pedido explícito do operador (ver protocolo abaixo): permitido.

Casos típicos: atualizar campo de work item, transicionar estado, criar comentário, mudar assignee/iteration/area path, criar/aprovar PR, queuar build, criar release.

### Como reconhecer um pedido **explícito** de escrita

Só conta como explícito quando o operador atende **todas** as condições:

1. **Verbo de ação direto e na primeira/segunda pessoa**: "atualiza", "muda", "fecha", "transiciona", "adiciona comentário", "atribui pra Fulano". Não conta: "como eu faria pra fechar?", "seria possível atualizar?", "explica como muda o estado".
2. **Alvo identificado sem ambiguidade**: ID do work item (ou conjunto de IDs), nome do PR/build, ou seleção inequívoca ("o bug 478463"). Não conta: "o último bug", "todas as tasks do Renato".
3. **Mudança especificada**: campo + valor novo, ou ação específica (close, approve). Não conta: "ajusta o que precisar".

Se faltar qualquer uma das três condições: pedir esclarecimento, **não** assumir.

### Protocolo de execução de escrita

Ao receber pedido explícito que satisfaz os critérios acima:

1. **Resumir** em 1–3 linhas o que será feito: endpoint, ID, campo→valor, irreversibilidade.
2. **Avisar** se o PAT atual não tem escopo de escrita (caso de hoje). Listar o que o operador precisa fazer: criar novo PAT com escopo mínimo necessário (ex.: `Work Items: Read & Write`), guardar em outra entrada do Keychain (ex.: `azdo-pat-grupoltm-write`), e exportar `AZDO_PAT` ou `AZDO_KEYCHAIN_SERVICE` apontando pra ela.
3. **Pedir confirmação verbal** ("Confirmar?"). Aguardar resposta.
4. **Executar** somente após confirmação. Se a operação for em lote (>1 item), confirmar de novo se o operador subiu o escopo mid-conversa.
5. **Reportar resultado** com status HTTP, response relevante, e — se aplicável — link pra verificar no DevOps.

### Escopos de PAT a sugerir quando o operador autorizar escrita

Sempre o **mínimo necessário**:

| Operação | Escopo mínimo |
|----------|---------------|
| Atualizar/criar/transicionar work item, adicionar comentário | `Work Items: Read & Write` |
| Criar/aprovar PR | `Code: Read & Write` (aprovar pode exigir permissão de branch policy) |
| Queuar build / disparar release | `Build: Read & Execute` / `Release: Read, Write & Execute` |

Nunca sugerir "Full access". Se o operador insistir, perguntar qual operação específica está em mente e mapear pro escopo mínimo.

### Não persistir o PAT fora do Keychain

- Não copiar o PAT pra `.env`, arquivos do repo, logs, prompts ou mensagens.
- Não ecoar o output de `security find-generic-password ... -w` no terminal sem redirect.
- Em scripts, sempre ler on-demand do Keychain (ou env var em CI).
- Se o operador rotacionar pra um PAT com escopo de escrita, guardar em **service separado** (não sobrescrever `azdo-pat-grupoltm`) — assim leitura e escrita ficam segregadas.

## Boas práticas

### 1. Decodificar URL antes de extrair valores

`%20` → espaço. Project e team frequentemente têm espaço no nome — passe pra tool entre aspas:
```bash
AZDO_PROJECT="Vertem Innovation" npm run list -- "Sprint 67"
```

### 2. Sempre usar o team correto

Defaults são `Vertem Innovation Team`. Se o link referenciar outro team (raro mas pode acontecer), passar via env:
```bash
AZDO_TEAM="Outro Time" npm run list
```

### 3. Limitar campos retornados

A tool já retorna só `System.Title`, `System.WorkItemType`, `System.State`, `System.AssignedTo`. Se precisar de mais campos (ex.: `System.IterationPath`, `Microsoft.VSTS.Common.Priority`), **estender a tool** em vez de fazer call ad-hoc.

### 4. Cachear resultados em conversas longas

Sprint com 100+ items: roda uma vez, salva o output, filtra localmente. Não rode a tool várias vezes seguidas pra "refinar" filtros — peça os critérios e roda uma vez só.

### 5. Não inferir IDs de work item

Se o usuário disser "o bug do X", não chute o ID. Liste ou peça o número/URL.

## Evolução da tool

Se o usuário pedir um caso não coberto, sugerir adicionar a `tools/azdo-sprint/src/` em vez de improvisar com curl. Padrão:

- Novo comando = novo script em `src/{nome}.ts` + entrada em `package.json` scripts.
- Manter contrato: lê PAT via `getPat()` de `auth.ts`, usa `azure-devops-node-api`, é read-only.

## Quando NÃO usar esta skill

- Pedidos sobre código (PR review, repo browsing): use **pull-request** skill se for abrir PR no AzDO; pra ler diff/PR, use `curl` ou `az repos pr show`.
- Pedidos sobre GitHub (vibe-mobile-app): nada a ver com esta skill — usar `gh` CLI.
- Se o usuário quiser **escrever** em work items: seguir o protocolo da seção [Operações de escrita] — resumir, confirmar, e só executar depois.
