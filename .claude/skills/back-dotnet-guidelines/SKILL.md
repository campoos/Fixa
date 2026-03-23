---
name: back-dotnet-guidelines
description: Diretrizes técnicas para projetos .NET (C# / ASP.NET Core). Use ao implementar ou revisar código no vibe-bff.
---

# Diretrizes .NET — vibe-bff

## Stack

- .NET 8 / C# / ASP.NET Core
- MongoDB (driver oficial) + Redis (StackExchange.Redis)
- RabbitMQ (AMQP) para mensageria
- xUnit + Moq + FluentAssertions para testes
- FluentValidation para validação
- AutoMapper / Mapster para mapeamento
- Clean Architecture (Domain → Application → Infrastructure → API)

## Princípios

- Priorizar a versão estável mais recente do .NET
- Usar features modernas da linguagem C#
- Pull Requests são momento para modernização e simplificação
- Centralizar lógica de negócio e comportamentos reutilizáveis
- Reusar componentes existentes antes de criar novos
- Clean Code como direção de qualidade (não regras rígidas)
- Parametrizar configurações que possam mudar
- Entender bem o projeto antes de implementar

## Convenções de código

- **Naming:** PascalCase para classes/métodos, camelCase com `_` prefix para campos privados
- **Indentação:** 4 espaços para C#, 2 para outros
- **EditorConfig** enforced
- **Repository pattern:** interfaces no Domain, implementações no Infra
- **Middleware pattern:** para cross-cutting concerns (exception handling, logging, security headers)

## Arquitetura

```
Presentation (Controllers) → Application (Use Cases) → Domain (Entities) → Infrastructure (MongoDB, Redis, AMQP)
```

- APIs versionadas (V1, V2, V3)
- DTOs compartilhados em projetos separados
- IoC centralizado em VibeBisBff.IoC
- Workers separados para processamento em background
