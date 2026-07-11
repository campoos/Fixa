# theme-studies → produto (plano-mestre)

> Rascunho de produto. Nome de trabalho: **Fixa** (proposta; ver §2). App hoje = MVP pessoal
> single-user rodando em `localhost:4022`. Este doc é o norte pra virar algo vendável.

## 0. ⚠️ Antes de tudo — separação de IP (decisão do João)
Hoje o app vive **dentro do repo `engagement` da Vertem** e usa infra de trabalho (Render, Upstash, credenciais).
Pra comercializar, **precisa sair disso**:
- Repo próprio (GitHub pessoal), contas próprias (Render/hospedagem, domínio, e-mail).
- Confirmar com a empresa se algo feito com tempo/infra de trabalho é livre pra vender.
- Migração é barata (o `git` do `theme-studies` já é independente) — mover `/root/git/engagement/theme-studies` → repo pessoal.
**Nada de secret/infra da Vertem no produto.** Este é o item 1 do roadmap.

## 1. Visão & posicionamento
**O que é:** app que transforma **qualquer tema (ou uma certificação-alvo)** numa trilha guiada
Epic→Story→Task, estudada com um **método que gruda**: recall frio → corrigir → generalizar →
**revisão espaçada (Leitner)** — com tasks **teóricas e práticas (mão na massa)**.

**Wedge (o que vende):** não é "mais um flashcard". É **método opinado + prática + revisão espaçada**,
começando por um nicho que **já paga**: **preparação para certificações** (ex.: a prova do Claude que
originou tudo). "Estude qualquer coisa" é fraco; "**passe na certificação X**" é vendável.

**Ativo real:** o método (validado no próprio João) + a curadoria/UX. A geração por LLM é commodity —
o fosso é método + conteúdo + experiência, não a tecnologia.

## 2. Marca & nome
- **Proposta:** **Fixa** — PT-friendly, curto, on-message ("fazer fixar"). Tagline: *"aprenda de um jeito que fixa."*
- Alternativas: **Loop** (o método é um loop), **Recall**, **Grava**, **Spira** (espaçamento/espiral).
- Personalidade: foco, momentum, "as coisas grudam". Moderno, confiante, **anti-gamificação-infantil** —
  progresso satisfatório, não pontinhos bobos.

### Identidade visual (ver mockup no Artifact)
- **Primária (marca/CTA):** violeta/índigo (`#6C5CE7`) — conhecimento/foco.
- **Semânticas:** esmeralda = domínio/acerto · âmbar = revisar hoje · vermelho = erro.
- **Base:** neutro slate, **dark-first** (light também).
- **Tipografia:** sans geométrica limpa (Inter/Geist) + números tabulares pro progresso.
- **Marca gráfica:** um "loop"/nó que fecha (o ciclo do método) ou barra que preenche. Wordmark minúsculo.
- **Motion:** micro-animações de progresso (barra enchendo, caixa Leitner subindo) — recompensa visual.

## 3. Páginas / superfícies
| Página | Hoje | Alvo |
|---|---|---|
| **Landing pública** | — | Hero + método + features + prova social + preço/waitlist. SEO. |
| **Home (dashboard)** | lista de temas | **Painel**: revisar hoje, streak, "continuar", anéis de progresso por tema, meta diária. |
| **Novo tema** | prompt+JSON manual | +Geração direta (API, Pro) · biblioteca de temas prontos · editar/append. |
| **Tema (trilha)** | árvore + loop ✅ | +Editar tasks in-app · sandbox de código (JS/TS) · barra de foco. |
| **Revisar** | fila Leitner global ✅ | +Modo "sessão" (baralho), atalhos de teclado, interleaving. |
| **Ajuda / Dúvidas** | — | Como funciona · o método · como importar (+troubleshooting do link/JSON) · revisão espaçada. |
| **Estatísticas** | — | Domínio por tema, heatmap de revisão (calendário), pontos fracos. |
| **Conta / Config** | senha única | Signup/login, perfil, meta diária, tema, export/backup, billing. |
| **Onboarding** | empty state | 1º uso: escolhe objetivo/cert → gera 1º tema → 1ª task guiada. |

## 4. Contas (o maior lift — Fase B)
Hoje: **single-user** (1 senha, cookie assinado, estado global no KV).
Alvo: **multiusuário**.
- **Auth:** e-mail+senha (bcrypt) ou magic-link; OAuth Google como fast-follow.
- **Modelo:** `user { id, email, hash, createdAt, plan }`; dados **namespaced por user**
  (`user:<id>:tracks`, `user:<id>:state`, `user:<id>:activity`).
- **Store:** sair do KV-arquivo. Opções: **Upstash Redis** (rápido, já conhecido) ou **Postgres** (Neon/Supabase)
  se quiser relacional/analytics. Recomendo Postgres p/ multiusuário + queries de stats.
- **Sessão:** cookie assinado por user id (já temos o mecanismo).
- **Decisões p/ o João:** (D1) e-mail+senha vs magic-link vs OAuth · (D2) Upstash vs Postgres.
  → **não implementar sem bater o martelo** (muda o data model; não quebrar o MVP que funciona hoje).

## 5. Motivação & retenção (é o coração — "algo que me deixa motivado")
- **Streak** (dias seguidos estudando/revisando) + meta diária de revisões.
- **Progresso visível:** anéis por tema, % de domínio, caixas Leitner subindo.
- **Heatmap** estilo GitHub das revisões.
- **Lembretes** (e-mail/push) "você tem N revisões hoje" — traz de volta.
- **Marcos** discretos (fechou um Epic, graduou 10 tasks) — sem infantilizar.

## 6. Melhorias técnicas / UX (backlog)
- Geração direta por API (mata o copy-paste de JSON — maior fricção).
- Editar/append/regenerar tema in-app.
- Sandbox de código JS/TS (Monaco + Web Worker) pras tasks práticas.
- PWA (instalável, offline).
- Robustez do import (o link linkificado já foi tratado no prompt; validar mais).
- Atalhos de teclado no Revisar; modo sessão.
- Testes (schema, engine Leitner) — já dá pra cobrir.

## 7. Monetização
- **Freemium:** grátis = N temas + import manual. **Pro** = temas ilimitados, **geração direta**, sandbox, stats, lembretes.
- **Packs de certificação** (one-time): "Pack Cert X" com trilha curada + simulados. Categoria que já paga.
- Validar **antes** de investir: landing + waitlist/pré-venda de 1 cert. Sem e-mails = mercado respondeu barato.

## 8. Roadmap
- **Fase 0 — Separar do empregador** (repo/infra/contas próprios). *Pré-requisito de qualquer venda.*
- **Fase A — Polir o single-user** (sem mexer em auth): identidade visual, Home dashboard, Ajuda/FAQ,
  streak/stats, onboarding. ← **em execução agora**.
- **Fase B — Fundação de produto:** contas multiusuário + DB, dados por user.
- **Fase C — Crescimento:** landing + waitlist, geração direta (Pro), stats/heatmap.
- **Fase D — Profundidade:** sandbox de código, packs de cert, lembretes, PWA.

## 9. Feito nesta rodada (Fase A, parcial)
- Plano-mestre (este doc).
- Mockup de identidade + landing + FAQ (Artifact) — direção visual da marca **Fixa**.
- App: identidade aplicada (cor de marca + logo), página **Ajuda**, **Home dashboard** com streak/stats.
- Backend: rastreio de atividade (streak) + endpoint de stats.
