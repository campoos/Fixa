# Contrato de comandos por repositório

Todo repositório listado em `repos.list` deve seguir este contrato para que o workspace funcione com `make bootstrap`, `make check` e `make dev`.

---

## Detecção de stack

O workspace detecta automaticamente a stack de cada repo:
- **Presença de `.sln`** → .NET → usa `dotnet` CLI
- **Presença de `package.json`** → Node.js → usa `yarn`

---

## vibe-bff (.NET 8 / C# / ASP.NET Core)

| Ação | Comando |
|------|---------|
| Restaurar dependências | `dotnet restore` |
| Build | `dotnet build --configuration Release` |
| Testes | `dotnet test --configuration Release` |
| Dev | `dotnet run --project src/VibeBisBff.Api` |

---

## vibe-mobile-app (React Native / Expo / TypeScript)

| Ação | Comando |
|------|---------|
| Instalar dependências | `yarn install` |
| Dev Android | `yarn android:vibe` |
| Dev iOS | `yarn ios:vibe` |
| Lint | Prettier (`.prettierrc`) |
| Typecheck | `npx tsc --noEmit` |
| Build produção | EAS Build (`yarn build:production:vibe`) |

---

## Quality gate (`make check`)

O script `scripts/check.sh` detecta a stack e roda:

- **.NET:** `dotnet build` + `dotnet test`
- **Node.js:** `yarn check` (ou fallback: `yarn lint` + `yarn test`)

---

## Checklist para aceitar um novo repo

- [ ] Repo acessível no caminho indicado em `repos.list`
- [ ] `make bootstrap` roda sem erro
- [ ] `make check` passa
- [ ] Perfil dev atualizado se necessário
