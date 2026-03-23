# Slash commands

Comandos para Cursor ou Claude Code. Tarefas repetitivas com parâmetros claros.

---

## `/check`

Rodar `make check` na raiz e reportar. Quality gate por stack:
- **vibe-bff (.NET):** `dotnet build` + `dotnet test`
- **vibe-mobile-app (Node.js):** `yarn check` ou `yarn lint` + `yarn test`

---

## `/bootstrap`

Rodar `make bootstrap` (instalar dependências):
- **.NET:** `dotnet restore`
- **Node.js:** `yarn install`

---

## `/dev`

Rodar `make dev` ou `make dev-prod`:
- (nenhum param) → perfil dev (BFF local + mobile)
- `prod` → perfil prod (só mobile)

---

## `/changelog`

Gerar changelog a partir de PR ou commits. Formato:
```
## [Versão ou data]
### Adicionado / Alterado / Corrigido
- item
```
