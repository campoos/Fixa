# CLAUDE.md — Fixa

App de estudo com recall ativo e revisão espaçada, pra quem tem prova com data. Web (React +
Vite em `web/`) servido por Node puro (`server.js`), produção em https://fixaestudos.com.br
(Render), e um app Android que é um TWA embrulhando esse mesmo site (`android/`).

Repo pessoal do dono — não é da Vertem, apesar de morar dentro de `engagement/`.

## Custo: agente é caro, use com parcimônia

Pedido explícito do dono (28/07/2026), depois de três agentes em Opus num dia:

- **Subagente só quando o trabalho é largo** — auditoria que varre o repo inteiro, spec de
  design, perspectiva independente. Implementar uma spec que já existe, mexer em poucos
  arquivos ou conferir um fato: faça você mesmo, sem spawnar.
- **Modelo proporcional à tarefa.** Trabalho mecânico vai em modelo barato; Opus não é default.
- **Briefing e resposta curtos.** Relatório pro dono é 1–2 linhas, texto corrido, primeira
  pessoa — nunca bullet, tabela ou seção.
- Agente já rodando não se mata no meio: joga fora o gasto sem entregar nada.

## Regras da casa

- **Design é dos agentes de design.** Brief → UX/UI → implementação. Não resolva design sozinho.
- **Não implemente sem confirmação.** "Investiga" ≠ "implementa".
- **Git:** stage arquivo por arquivo, nunca `git add -A`. Nunca commitar `.env`, `.secrets.env`
  nem `android/android.keystore`. **O push é do dono** — a VM não tem credencial deste repo.
- **Nunca** aponte o servidor local pro Upstash de produção: rode com o `kv-store.json`
  gitignorado e `PORT=4099`. `.secrets.env` é cofre de backup, não runtime.

## Documentação

Tudo em `docs/`, um arquivo por decisão. Os que mais se usa:

- `PRODUTO.md`, `ROADMAP.md`, `CONCORRENTES.md` — o que é o produto e por quê.
- `PLAY-STORE.md` — publicação na Google Play, chave de assinatura, 12 testadores, ficha.
- `SEO.md` — por que o site não aparecia na busca e o plano (a home já está indexada; o que
  falta é âncora de texto e link de fora).
- `DESIGN-*.md` — uma spec por tela/assunto. Ler a relevante antes de mexer na UI.
- `docs/store/` — prints crus em `screenshots/` e o que sobe na loja em `frames/`.
