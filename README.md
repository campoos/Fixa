# Fixa (theme-studies)

Aprenda **qualquer tema** de um jeito que fixa: trilha **Epic → Story → Task** + método de
**recall ativo** (responda antes de ver) + **revisão espaçada** (Leitner) + tasks **práticas** (mão na massa).
Nasceu do método usado pra estudar pra prova do Claude; virou motor genérico de retenção.

- **App:** `web/` (React + Vite + TS + Tailwind) servido por `server.js` (Node puro, sem framework).
- **Estado:** KV em arquivo local (`kv-store.json`) ou **Upstash Redis** (produção) — chaves `theme:*`.
- **Conteúdo de um tema:** gerado por LLM via prompt (fluxo manual) ou **geração direta com Gemini** (opcional).
- **Docs de produto:** [docs/ROADMAP.md](docs/ROADMAP.md) (plano-mestre), [docs/PRODUTO.md](docs/PRODUTO.md),
  [docs/METODO-CIENCIA-E-PRODUTO.md](docs/METODO-CIENCIA-E-PRODUTO.md), [docs/CONCORRENTES.md](docs/CONCORRENTES.md).
- **Landing/identidade (mockup):** servida em `/fixa.html`.

## Rodar

```bash
cd web && npm ci && npm run build && cd ..
node server.js          # http://localhost:4022 (senha: APP_PASS do .env)
```

`.env` (local):
```
PORT=4022
SSO_SECRET=<troque>
APP_PASS=<senha de login>
APP_USER=João
# opcional — liga o botão "Gerar direto" no Novo tema:
# GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-2.5-flash
# produção (estado persistente):
# UPSTASH_REDIS_REST_URL=... / UPSTASH_REDIS_REST_TOKEN=...
```

Deploy: `render.yaml` (Blueprint) — build do front + `node server.js`, secrets no dashboard.

## Como funciona (resumo técnico)

- `study-schema.js` — valida/normaliza o JSON de um tema (ids `e.s.t`, tasks `theory`/`practice`).
- `prompt-template.js` — gera o prompt que o LLM responde em JSON (mesmo shape do validador).
- `server.js` — sessão por cookie assinado; rotas:
  - temas: `/api/tracks`, `/api/track`, `import`, `generate` (Gemini), `rename`, `target`, `append`, `delete` (→ lixeira), `restore`, `trash`
  - task: `done` (agenda revisão +1d), `review` (pass sobe caixa · fail volta), `comment(+delete)`, `edit`, `remove`
  - progresso: `/api/review` (fila global), `/api/stats` (streak + heatmap 119d)
- Revisão espaçada: régua Leitner `1-2-3-4-7-15-30` dias (fuso São Paulo), com **clamp na data da prova**
  (`targetDate`) — nenhuma revisão cai depois da prova.
- "Dominada" = task que **graduou** na revisão (≠ marcar Done).

## Estado do roadmap

**Feito:** MVP + M0 (lixeira) · M1 (recall forçado, domínio≠done) · M2 (data-alvo/meta diária) ·
M3 (edição in-app + geração Gemini) · M4 (heatmap/streak) · M5 (sessão de revisão intercalada + atalhos).
**Próximo:** Fase 0 (separar IP da Vertem) → M6 contas+DB → M7 landing pública → M8 monetização → M9 sandbox/PWA.
Detalhe: [docs/ROADMAP.md](docs/ROADMAP.md).
