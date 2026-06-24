# Pendências específicas de Onboarding

(Reconstruído em 2026-06-05 após cleanup acidental. Lista canônica original em `06_pendencias_bloqueios.md`. Aqui só os que vieram dos novos docs e dos PRs já mergeados.)

## Fechamento de débito técnico — 2026-06-24 (Vinicius)

Leva fechando o débito de código que estava **no nosso alcance**. 7 PRs abertos (alvo `develop`, aguardando 1 approve):

### Resolvido nesta leva

- ~~**Error-state silencioso na listagem (#486199)**~~ — `OnboardingPage` agora renderiza `ErrorState` (com retry) quando a carga inicial falha e não há dados; erro de revalidação mantém a tabela. **PR #141058**.
- ~~**Paginação: reset ao mudar pageSize + clamp quando total encolhe (#486402)**~~ — `usePrograms`. **PR #141058**.
- ~~**a11y do RequestProgramCard**~~ — seta com accessible name distinto ("Abrir X") + agora funcional (dispara `onSelect`). **PR #141060**.
- ~~**`isEditable`/`isResendable` inline na ProgramRow**~~ — centralizados em `_enum/ProgramStatus.ts`. **PR #141060**.
- ~~**`SearchProgramsParams.status` como `string[]`**~~ — tipado `ProgramStatus[]`. **PR #141060**.
- ~~**ValueComparer null-safe (#487203) + teste do BundleProfile (#487204) + default `[]` na migration (#487205) + NotEmpty do validator (#487206, já existia)**~~ — **PR #141061**.
- ~~**Pilares aceitavam duplicata (#482789)**~~ — validator rejeita repetição case-insensitive → 400. **PR #141064**.
- ~~**Subject ausente = visão global silenciosa**~~ — guard `[RequireOnboardingAccess]` → 401 `unauthorized_subject`; também **extraiu `[RequireActiveTenant]`** (era duplicado em ~16 actions) + módulo. **PR #141075**.
- ~~**Setter de `Program.Status` livre (#483882)**~~ — encapsulado em `Program.TransitionTo` (valida `CanTransitionTo`, lança em pulo de etapa); 4 sites reais convertidos. **PR #141078**.
- ~~**axios 0.21.1 (CVEs)**~~ — subiu p/ 1.18.1 + removeu `axios-cache-adapter` morto. **PR #141079**.

### Follow-ups novos (gerados nesta leva)

- **Migration in-place #487205 — confirmar premissa:** o `defaultValue` da `20260608142056_AddBundleSelectionToProgram` foi editado de `""` p/ `"[]"` **assumindo que nenhum SQL persistente aplicou a migration ainda** (DEV roda InMemory). Confirmar com o time antes de promover; se algum ambiente já aplicou, o default lá fica `""` (inócuo — o reader trata `IsNullOrEmpty`).
- **Setter de `Program.Status` segue público** — `TransitionTo` guarda os 4 sites reais, mas o setter não está trancado (ergonomia de EF + seed do `ProgramBuilder`). Trancar de vez exigiria `internal set` + `InternalsVisibleTo`/factory. Dívida menor aceita.
- **Fluxo de falha de provisionamento da Saga sem site de `TransitionTo`** — o `CanTransitionTo` permite `Provisioning→Failed`/`Failed→Provisioning`, mas nenhum código dispara hoje (a Saga de reversão não existe). Quando entrar, usar `TransitionTo` (não setar `Status` direto).
- **axios `CancelToken` → `AbortController`** — o bump #141079 manteve `CancelToken` (deprecated, mas funcional no 1.x; sai só no 2.x). Migrar os 8 arquivos quando fizer a faxina.
- **axios 1.x: serialização de `status[]` em query** — o default mudou (`status[]=...`). O `SearchProgramsParams.status` é `string[]` mas **nenhum caller passa hoje** (filtro de status sem UI). Quando ligar o filtro, conferir o formato que o binder do .NET espera (`status=A&status=B`) e, se preciso, fixar `paramsSerializer` no `Axios.create`.

## Sprint 1 — Hype (entregue)

### Resolvido / mergeado

- ~~**Permission string de gestor (`useIsManager`)**~~ — fechado pelas #483869/#483880 + atualização pós-#485452 (`'master'`).
- ~~**Gate de `scope=team`**~~ — fechado pela #483880 (403 `scope_forbidden`).
- ~~**Tenant ausente = página vazia silenciosa**~~ — fechado pela #483881 (403 `tenant_required`).
- ~~**Auth real do Admin Vertem**~~ — fechado pela #485452 (Vini).

### Aberto / follow-ups

- **Subject ausente = 401, não degradação silenciosa pra visão global.** Hoje controller faz `IsManager ? null : OwnerId`; se `OwnerId` chegar nulo num analista, vê tenant inteiro. Em runtime real seria escalada de privilégio se houver bug de claim. Fechar com `UnauthorizedAccessException` ou filter `[RequireAuthenticatedSubject]`.
- **Mover `MANAGER_PERMISSION` pra `src/_enum/permissions.ts`** quando outros módulos FE (menu/rota/gating) precisarem da string. Hoje vive só no `useIsManager.ts`.
- **Guard `[RequireActiveTenant]` action filter**: hoje os endpoints duplicam `if (string.IsNullOrEmpty(_authContext.ActiveTenantId)) return TenantRequiredForbidden();`. Quando o 3º endpoint aparecer (wizard/submit), extrair pra `IAsyncActionFilter`.
- **400 (validação) do FluentValidation** — entregue pela #486489 com `FluentValidationActionFilter` cirúrgico. Follow-ups:
  - Registro escalável de validators no DI (`FluentValidation.DependencyInjectionExtensions` + `AddValidatorsFromAssemblyContaining`) quando virar 3º validator.
  - `SuppressModelStateInvalidFilter=true` + `[Required]` em DTO sem validator FV = passa silencioso. Convenção a documentar no kit.
- **Revisitar D2 do ADR RBAC** ("time" = "todos do tenant") quando auth corp expuser hierarquia organizacional (subordinates).
- **`useIsManager` FE** pode trocar de `checkPermission('master')` pra leitura direta de claim quando o host do Admin Vertem expor interface dedicada.

### BE — pendências específicas da listagem (#483879 / #483884)

- **400 (validação)** — entregue pela #486489.
- **`AssertConfigurationIsValid()` AutoMapper** no harness da #483884 — quebra build se renomear campo na entidade/DTO sem ajustar profile.
- **Tipar `SearchProgramsParams.status`** com `ProgramStatus[]` em vez de `string[]` no `programsService.ts`.

### FE — pendências #486276 / #486199 / #486402

- **a11y `RequestProgramCard`**: `<section>` container e `<button>` da seta expõem mesmo accessible name `sectionLabel`. Fix sugerido: trocar `aria-label` da seta pra `"Abrir Solicitar"` ou similar.
- **`refetch()` no `usePrograms`**: expor função `refetch` no `UseProgramsResult` pro ErrorState plugar "Tentar novamente" sem F5 manual.
- **500/erro mascarado como empty-state no `OnboardingPage`**: o `error` do `usePrograms` não é lido em nenhum gate — se o `GET /programs` falhar (500/403), `hasAny` fica `false` e a tela cai no empty-state ("primeira vez"), indistinguível de base realmente vazia. Falta gate `if (error) return <ErrorState .../>` antes do empty (+ teste do cenário). Identificado ao corrigir o flash de loading (branch `feature/fe-fix-flash-loading-listagem`).
- ~~**Handlers `onEdit`/`onView`** no `OnboardingPage`: hoje `() => undefined`~~ — RESOLVIDO (2026-06-18): `onEdit` retoma o wizard (rascunho) e `onView` navega pra `/onboarding/programas/:id` (detalhe). Ver seção "Sprint 2 — Acompanhamento" abaixo. Resta só a PO confirmar o comportamento do olho.
- **`axios.CancelToken` deprecated** desde 0.22 (favor `AbortController`). Repo em axios 0.21 — entra no plano de upgrade.
- **Double-fetch ao trocar scope**, **reset de `page` ausente em mudança de `pageSize`**, **clamping de `page` quando `total` reduz**: 3 micro-bugs do `usePrograms` documentados em comentário (#486402).

### Wizard — hardening BE (auditoria 2026-06-11, fechamento das PBIs do épico #482695)

- **Pilares — validar conteúdo, não só cardinalidade (#482789):** o `UpdateProgramUsecase` já valida 1–3 pilares (422 `pilares_invalidos`), mas NÃO rejeita duplicatas (`["engajamento","engajamento"]`) nem valores fora do catálogo (`["xpto"]`) — confia no gate do FE, igual aos indicadores. Endurecer (set distinto + enum de pilares aceitos) quando houver catálogo canônico de pilares no BE.
- **Lock otimista no rascunho (#483373, decisão D3 2026-06-11):** isolamento por owner está completo e testado (404/403 + `IsolationTests`), mas NÃO há controle de concorrência. Dois PATCHs simultâneos no mesmo rascunho = last-writer-wins. Implementar `Version`/`RowVersion` no `Program` + checagem `If-Match` → 409 `stale_version` se/quando edição concorrente real (mesmo rascunho por 2 sessões) virar cenário. Hoje raro (rascunho é isolado por analista).

### Webhook Zendesk inbound (#482837 — entregue parcialmente, PBI NÃO fechada por depender de alinhamento)

- **Semântica do mapeamento ticket→status (alinhar com produto):** hoje `ProcessZendeskWebhookUsecase.MapTicketStatus` mapeia `solved|closed → Active` e `new|open|pending|hold|in_progress → Provisioning`, e só AVANÇA na progressão (nunca regride). Confirmar com produto a regra exata de **roll-up** (como o status dos N filhos agrega no status do pai/programa). **Cardinalidade já resolvida pelo contrato:** 1 Ticket Pai (`Program.ZendeskTicketId`) + N filhos por subsistema (tabela `OnboardingTickets`, upsert pelo webhook) — ver [`zendesk/README.md`](zendesk/README.md). Não é mais "1 ou N".
- **`Failed → Provisioning` não acontece via webhook:** a `Progression` exclui `Failed`, então um programa Failed que receba evento de ticket é ignorado. A máquina de estados permite `Failed→Provisioning` (reprocessamento). Se produto quiser que reabrir/reprocessar ticket reative um Failed, precisa de regra dedicada.
- **Concorrência (lost update) na transição:** `GetByZendeskTicketId` lê rastreado e salva sem token de concorrência. Entregas fora de ordem (open depois de solved) podem regredir o status por last-writer-wins. Mesma solução do lock otimista acima (`RowVersion` + retry no `DbUpdateConcurrencyException`). Hoje mitigado só pela idempotência do caminho feliz.
- **E-mail `onboarding-ativo` é placeholder:** `LogOnboardingNotifier` só loga a intenção — não há provider de e-mail no serviço. Trocar pela impl real (mantendo o padrão real+fake) quando a infra de e-mail entrar.
- **Unicidade `ZendeskTicketId`:** índice criado (`IX_Programs_ZendeskTicketId`, filtrado) é NÃO-único; se a regra for 1 ticket : 1 programa, virar `IsUnique`.

### Cinco status (#483882)

- **Consumir `ProgramStatusExtensions.CanTransitionTo`** no handler de webhook Zendesk quando ONB-016/017 forem implementados.
- **Guard no setter de `Program.Status`**: encapsular via `Program.TransitionTo(next)` que chama `CanTransitionTo` e lança em transição inválida.
- **`FailureReason` separado pra `Failed`**: quando webhook Zendesk entregar tipos, decidir entre re-expandir o enum ou adicionar campo no agregado.
- **FE: extrair `isEditable(status)`** — hoje `ProgramRow.tsx:39` tem `canEdit = status === Draft` inline. Centralizar no enum quando o wizard plugar edição.

### Worker assíncrono de envio (#488996 / ONB-015 — leva 1 entregue in-process)

> **Divergência ONB-015 (spec Backlog v1.0 `Bull/Redis` × as-built `Quartz.NET in-process + polling SQL`) — RESOLVIDA (2026-06-16, task #489007).** As notas as-built já refletem o worker assíncrono em [`backlog.md`](backlog.md) (ONB-015), [`overview.md`](overview.md) (nota ¹) e [`stack-and-glossary.md`](stack-and-glossary.md) (Cache/Worker). Os itens abaixo são **follow-ups técnicos do as-built**, não a divergência de spec.

- **Idempotência por `program_id` (entregue):** garantida por (1) índice único filtrado `IX_Programs_ZendeskTicketId` (`ZendeskTicketId IS NOT NULL`) — backstop de DB contra ticket duplicado; (2) guarda de status no enqueue — só `Draft`/`Failed` enfileiram, `Queued`/`Submitted` → 409. Reenfileirar um `Failed` zera `RetryCount` (orçamento de tentativas novo).
- **Lock de linha cross-node (DEFERIDO pra #489006):** hoje o worker roda **in-process, instância única**, com `[DisallowConcurrentExecution]` — duas varreduras não rodam em paralelo, então não há corrida na seleção da fila. Quando o worker virar **processo/container dedicado com N réplicas**, `GetPendingSubmits` vai precisar de lock pessimista (SQL Server `UPDLOCK, READPAST` ou claim via `UPDATE ... OUTPUT` marcando o item como "em processamento") pra duas réplicas não pegarem o mesmo programa. Não dá pra exercitar no SQLite dos testes — entra junto da extração (#489006).
- **Idempotência no Zendesk (dual-write):** se `CreateTicketAsync` abre o ticket mas o `SaveChanges` seguinte falha, o programa segue `Queued` e a próxima varredura abriria um **2º ticket no Zendesk** (o índice único só protege o lado do BD). Mitigar com `external_id = program.Id` no payload do ticket (dedup no Zendesk) ou outbox. Baixo risco hoje (in-process, janela mínima) — avaliar em #489006.
- **Migrations não são exercitadas pelos testes (geral, vale pro `SubmitAttemptLogs` #489003):** o harness de integração usa SQLite + `EnsureCreatedAsync()` (cria schema do modelo), não `Migrate()` — então as migrations SQL-Server-flavored não rodam nos testes. Fazer smoke manual (`dotnet ef database update`) contra o SQL Server real quando o DB DEV existir (hoje em placeholder/InMemory, ver seção Infra).
- **FE — polling do Step10 não distingue 4xx fatal de transiente (#489004):** `useProgramSubmission` re-tenta qualquer erro do `GET /programs/{id}` até `MAX_POLL_ATTEMPTS` (~60s). Se a sessão expirar (401/403) o usuário fica em "Processando…" até o teto antes do erro genérico. Aceitável na entrega incremental; quando houver tratamento global de 401 (refresh/redirect) no MFE, encerrar o polling de imediato nesses códigos. Gap de teste correlato: não há cobertura do teto de tentativas (fake timers) — adicionar quando estabilizar o tratamento de erro do polling.

## Sprint 2 — Acompanhamento de chamados + steps dedicados (entregue 2026-06-18, FE João)

### Resolvido / mergeado

- ~~**FE Painel de status dos chamados (#482836)**~~ — entregue (PR #140251): rota nova `/onboarding/programas/:id` (`ProgramDetailPage`), `TicketStatusPanel` dos 5 subsistemas, `useProgramStatus` (polling 30s), banner "programa ativo" no ACTIVE.
- ~~**FE Timeline de eventos (#483238)**~~ — entregue (PR #140261): `ProgramTimeline` na mesma página, ordem cronológica reversa, render por tipo (ícone/label/timestamp/ator), `useProgramEvents` (polling 30s), fallback de tipo desconhecido.
- ~~**FE Badges de SLA na listagem (#483370)**~~ — entregue (PR #140234): `SlaBadge` verde/amarelo/vermelho + tooltip de atraso no `ProgramRow`, consumindo `sla?:{status,businessDaysOverdue}`. **Contrato confirmado-alinhado**: o BE de #483371 adotou esse mesmo shape (`SlaStatus ON_TIME/WARNING/EXCEEDED`) — integração real, não mock (handoff Vini 2026-06-18).
- ~~**FE retry/estados de falha no envio (#482833)**~~ — entregue (PR #140111): testes RTL do fluxo de falha/retry do Step10 (#489365–#489369).
- ~~**Passos 4 e 5 → PUT dedicado (#489722/#489723)**~~ — entregue (PR #140283): `putProgramPilares` (`PUT /programs/{id}/pilares`) e `putProgramTipo` (`PUT /programs/{id}/tipo`), migrando o auto-save do `PATCH` genérico (mesmo padrão de login/canais).
- ~~**`onView` no `OnboardingPage` era `() => undefined`**~~ — RESOLVIDO: o olho da listagem agora navega pra `/onboarding/programas/:id` (#482836). (O `onEdit` já retomava o wizard.) Falta só a PO confirmar que é o comportamento esperado do Figma — ver `fechamento-onboarding.md` #3.
- ~~**Polling 30s vs WebSocket**~~ — DECIDIDO: **polling 30s** adotado no painel e na timeline (padrão do `usePrograms`: `setInterval` + refetch no `visibilitychange` + cleanup). WebSocket fica pra evolução se a latência incomodar.

### Aberto / follow-ups

- ~~**Alinhar contrato FE↔BE dos endpoints de acompanhamento**~~ — ✅ **RESOLVIDO (2026-06-22, BE feito pelo João cobrindo a lane do Vini):**
  - `GET /programs/{id}/status` (painel) — PR **#140738**: trocou `/chamados` pelo `/status` no shape do FE; mapeia tipo do chamado (`SECURITY/.../NOTIFICATION`, Parent excluído) e normaliza o status cru do Zendesk → `PENDING/IN_PROGRESS/RESOLVED/FAILED` (semântica `approved/completed→RESOLVED` marcada como a confirmar com produto no código).
  - `GET /programs/{id}/events` (timeline) — PR **#140744**: endpoint novo, sintetiza os eventos do estado do programa + `OnboardingTickets`; add `CreatedAt` no ticket (+migration) pro `TICKET_CREATED`. Strings de evento em EN (`TICKET_RESOLVED/PROGRAM_ACTIVATED`); FE tem fallback — trocar pra `TICKET_SOLVED/PROGRAMA_ATIVO` é 1 linha se produto preferir.
  - **Painel + timeline + SLA rodam com dado real end-to-end.** Não falta mais BE pro acompanhamento.
- **Follow-up aberto (decisão de produto):** confirmar a semântica da normalização de status do painel (`approved/completed→RESOLVED`; `pending` cru→`IN_PROGRESS`) — ver `OnboardingTicketStatusContract` no BE.
- **`actor` da timeline é sempre `"Sistema"`** (não rastreamos autor humano); `updatedAt` do ticket alimenta o `TICKET_RESOLVED`. Quando/se houver autor real, popular o `actor`.

## Infra / pipeline (entrega de 2026-06-03/04)

### Resolvido

- ~~Pipeline AWS EKS/Helm pro BE~~ — registrada (#6343/#6344), CD #492741 verde.
- ~~Pipeline AWS S3+CloudFront pro FE~~ — registrada (#6345), CD #492753 verde.
- ~~BE deployado em DEV~~ — `gateway-engagement-dev.vertem.com/onboarding-api`, `/health` 200.
- ~~FE deployado em DEV~~ — `vertem-admin-engagement-onboarding-dev.vertem.com/Onboarding`, carrega no Admin Vertem real.

### Aberto

- **SQL Server real** — Secret `engagement-onboarding-dev` ainda com `Server=PLACEHOLDER`. App roda com InMemoryDb fallback (`AddPersistence` detecta placeholder). Aguardando Bigardi/DBA criar user `OnboardingAdmin` com `dbcreator` no SQL `192.168.53.137:1433` e atualizar Secret. Quando entrar, `Database.MigrateAsync()` cria DB + aplica migrations no próximo rolling restart.
- **Variable groups HML/PRD** — só DEV existe (BE #4897, FE #4898). Replicar quando promover.
- **CORS por env** — hoje `appsettings.Development.json` tem `adminvertem-dev.vertem.com`; HML/PRD vão precisar das origens equivalentes.

## Bundle Contratado (Feature #482793 — em planejamento)

- **`BundleId` e `DisabledBundleItemIds` só persistem após auto-save BE.** O FE do passo 6 vai gravar a seleção e os toggles via `PUT /programs/{id}/bundle` e `PATCH /programs/{id}/bundle/items`, mas o `programId` só existe quando #482771/#482774 (auto-save) entrar — até lá o passo 6 mantém estado apenas no `WizardContext` em memória e faz early-return silencioso nas chamadas de rede.
- **Catálogo de bundles via JSON embarcado** (`engagement-onboarding.Infra/Data/bundles.json`) em vez de seed EF/banco externo. Decisão pragmática enquanto DEV roda em InMemoryDb. Quando aparecer um catálogo Vertem central (ex.: `vertem-catalog`), trocar adapter no `GetAvailableBundlesUsecase`.
- **Mapeamento Bundle → Scope técnico** (Juliana, item pré-existente abaixo) continua aberto e é pré-requisito do passo 10 (envio + abertura de chamados Zendesk).

## Pré-existentes (de antes do cleanup)

- Mapeamento Bundle → Scope técnico (Juliana).
- API Key Cloudflare/Turnstile — negociação Luiz/SI antes do Q2.
- VRT-503 (TenantProvisioner) marcada "Revisar" — lógica de transição pra `ativo` pode ser refinada.
- Definir SLA exato (>2 dias úteis é "a avaliar").
- ONB-021 ausente — confirmar se foi removida intencionalmente.
- ~~Polling 30s vs WebSocket — escolher.~~ — DECIDIDO 2026-06-18: polling 30s (ver "Sprint 2 — Acompanhamento").
