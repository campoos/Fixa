---
name: vibe-workspace-contract
description: Use ao trabalhar no vibe-workspace ou em qualquer repo dentro dele. Define Makefile (make doctor/bootstrap/check/dev), contrato de comandos por repo (multi-stack: .NET e Node.js), quality gate e perfis dev.
---
# vibe-workspace: contrato e convenções

## Repos

| Repo | Stack | Caminho |
|------|-------|---------|
| **vibe-bff** | .NET 8 / C# / ASP.NET Core / MongoDB / Redis | `../vibe-bff` |
| **vibe-mobile-app** | React Native / Expo / TypeScript | `../vibe-mobile-app` |

## Comandos na raiz (Makefile)

- `make doctor` — valida git, node, yarn, dotnet
- `make bootstrap` — instala dependências (dotnet restore / yarn install)
- `make check` — quality gate: build + test (.NET) ou lint + test (Node.js)
- `make dev` — sobe perfil dev (BFF + mobile). Para só mobile: `make dev-prod`

## Contrato por repo

### vibe-bff (.NET)

| Comando | Equivalente |
|---------|-------------|
| build | `dotnet build --configuration Release` |
| test | `dotnet test --configuration Release` |
| dev | `dotnet run --project src/VibeBisBff.Api` |

### vibe-mobile-app (React Native / Expo)

| Comando | Equivalente |
|---------|-------------|
| dev | `yarn android:vibe` ou `yarn ios:vibe` |
| lint | Prettier (`yarn prettier --check`) |
| typecheck | `npx tsc --noEmit` |
| test | (não configurado ainda) |

## Local Quality Gate (obrigatório)

Antes de considerar tarefa concluída, rodar `make check` na raiz. Se falhar, corrigir antes de finalizar.

## Workflow de demanda

- Iniciar demanda: skill **gitflow**
- Abrir PR no **vibe-bff** (Azure DevOps): `git push` + PR via web ou `az repos pr create`
- Abrir PR no **vibe-mobile-app** (GitHub): skill **pull-request** (gh CLI)

## Regras gerais

- **vibe-mobile-app**: sempre `yarn` (nunca npm/pnpm). Respeitar `.nvmrc`.
- **vibe-bff**: `dotnet` CLI. NuGet como package manager.
- Plano curto (3–7 passos) antes de implementar.
- Se mexer em mais de 1 repo: avisar e listar motivo.
- Reportar comandos executados e resultado.

## Perfis dev

- **dev**: BFF (.NET) local + mobile app (Metro bundler)
- **prod**: só mobile, APIs de produção
