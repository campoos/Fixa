# Convenções do time (IA e humanos)

Objetivo: **a IA age como engenheira sênior disciplinada**, dentro de regras claras, reduzindo esforço mecânico e aumentando previsibilidade.

---

## Stacks do workspace

| Repo | Stack | Package manager |
|------|-------|----------------|
| **vibe-bff** | .NET 8 / C# / ASP.NET Core | NuGet (`dotnet restore`) |
| **vibe-mobile-app** | React Native / Expo / TypeScript | Yarn (`yarn install`) |

---

## Regras gerais

- **vibe-mobile-app:** `yarn` (nunca npm/pnpm). Respeitar `.nvmrc`.
- **vibe-bff:** `dotnet` CLI. NuGet para pacotes.
- Usar Makefile como ponto de entrada: `make doctor`, `make bootstrap`, `make check`, `make dev`.
- Seguir o [contrato de comandos](COMMANDS.md).

---

## Local Quality Gate (obrigatório)

**Antes de considerar qualquer tarefa concluída, rodar `make check` na raiz do workspace.**

- A IA (Implementer) **sempre** termina com `make check`.
- Se falhar, **corrigir até passar** antes de dar por concluído.

---

## Modo de operação

1. Plano curto (3–7 passos) antes de implementar.
2. Se mexer em mais de um repo: avisar e listar quais e por quê.
3. Se `make check` falhar: parar novas features, priorizar correção.
4. Reportar comandos executados e resultado.

---

## Convenções por stack

### vibe-bff (.NET)
- Clean Architecture: Domain → Application → Infrastructure → API
- PascalCase classes/métodos, `_camelCase` campos privados
- FluentValidation, AutoMapper/Mapster
- xUnit + Moq + FluentAssertions
- EditorConfig enforced

### vibe-mobile-app (React Native)
- Functional components com TypeScript
- Pasta por componente: `index.tsx` + `styles.ts`
- Prefixos: `I` (interfaces), `T` (types), `E` (enums)
- Styled Components (RN variant)
- Zustand + MMKV, React Hook Form + Zod
- Prettier enforced (single quotes, trailing commas, width 120)

---

## O que NÃO é objetivo

- Automatizar tudo
- Tirar o humano da equação
- Criar complexidade desnecessária
- Gastar token infinito
