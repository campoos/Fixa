# Fixa — Roadmap-mestre (plano único, travado)

> **Este é o plano.** Consolida [PRODUTO.md](PRODUTO.md) (visão/negócio) e
> [METODO-CIENCIA-E-PRODUTO.md](METODO-CIENCIA-E-PRODUTO.md) (método/ciência) numa **sequência de execução
> do começo ao fim**. Regra: **não re-litigamos escopo** — seguimos os milestones em ordem. Ideias novas
> viram linha no §"Backlog paraquedas" e são endereçadas no milestone certo, não interrompem o atual.

## Norte
Motor de retenção pra quem tem uma **prova/skill com prazo**. Baseado nas 2 técnicas de maior evidência:
**recall ativo + revisão espaçada**. Nicho de entrada: **prep de certificação**.

## Definição de "pronto pra produto" (o alvo de todos os milestones)
1. Loop diário óbvio (Revisar hoje) · 2. Conteúdo confiável + método explicado · 3. Primeira vitória <3 min ·
4. Progresso honesto e motivador · 5. Zero perda de dados · 6. Mobile · 7. Posicionamento afiado.

## Como trabalhamos (regras de execução)
- Cada milestone: **build → testar → commit → (deploy quando aplicável)**.
- **Polimento de UI é batelado no fim de cada milestone** (não paramos o fluxo pra cada pixel).
- Autonomia: sigo executando os milestones em ordem; reporto ao fechar cada um.
- **Não quebrar o que funciona.** App sempre rodável.

---

## ✅ Fase A — FEITO (base do MVP)
MVP funcional · método (Frio→Corrige→Generaliza→Espaça) · revisão espaçada Leitner global ·
import por JSON (prompt+validador) · tasks teóricas e práticas · identidade **Fixa** (cor+logo) ·
Home dashboard (streak/stats) · página Ajuda · landing/mockup em `/fixa.html` · fix KV concorrente.

## ✅ M0–M5 — FEITOS (11/07/2026)
- **M0** lixeira/restaurar (exclusão reversível) · **M1** recall forçado + domínio≠done + "por que funciona" ·
- **M2** data-alvo + countdown + meta diária + clamp de revisão à prova ·
- **M3** edição in-app (edit/remove/rename/append) + **geração direta Gemini Flash** (opcional via GEMINI_API_KEY; manual = fallback) ·
- **M4** atividade por dia + heatmap de consistência · **M5** revisão em sessão (interleaving round-robin, atalhos espaço/1/2, placar).
- Extras: favicon/título da marca · card "Continuar" no Home · badge Revisar em tempo real ·
  motor Leitner extraído (`review-engine.js`) · **suíte de testes (11 casos, `npm test`)** · consistência da régua na copy.
**Próximo:** Fase 0 (separação de IP) → M6 (contas+DB) → M7 (landing pública) → M8 (monetização) → M9 (sandbox/PWA).

---

## 🎯 Milestones (ordem de execução)

### M0 — Confiança/Reliability *(o app não pode perder dado)*
- **Soft-delete + restaurar** temas (lixeira, não exclusão dura) — *(fix direto do problema que já vivemos)*.
- Backup rotativo do estado (últimas N versões) + `undo` de ações destrutivas.
- **Pronto quando:** excluir um tema é reversível; nenhuma ação apaga dado sem trilha de volta.

### M1 — Método correto por construção *(P0 da ciência)*
- **Recall forçado:** no estudo da task, resposta/pontos-chave **escondidos por padrão**, revela após tentativa.
- **Domínio ≠ Concluído:** "domínio" derivado da caixa Leitner/acerto, mostrado separado de "Done".
- **"Por que funciona":** bloco no app com o método + ciência (retrieval/spacing) — vira feature de confiança.
- **Pronto quando:** o app *faz* o método acontecer; usuário vê domínio real, não só "marquei feito".

### M2 — Âncora temporal + agenda adaptativa
- **Data-alvo por tema** (opcional). Régua de revisão + meta diária **escalam pra prova** (Cepeda).
- "Faltam X dias · Y revisões/dia pra chegar pronto".
- **Pronto quando:** definir a data muda o ritmo de revisão e a meta.

### M3 — Geração de produto *(o maior risco 🔴)*
- **Geração direta guiada** (fim do copy-paste) — via API própria (Pro) e/ou fluxo assistido.
- **Camada de qualidade:** 2ª passada de checagem do conteúdo + validação semântica.
- **Biblioteca de temas/certs curados** (âncora de qualidade + base do produto pago).
- Editar/append/regenerar trilha e tasks no app.
- **Pronto quando:** criar um tema é 1 clique confiável; existe conteúdo curado de referência.

### M4 — Motivação & hábito *(retenção de usuário)*
- Streak robusta + **heatmap de revisões** (calendário) + meta diária + marcos discretos.
- **Lembretes** (e-mail/push): "você tem N revisões hoje".
- **Pronto quando:** o usuário é puxado de volta e vê a consistência dele.

### M5 — Interleaving + modos de revisão
- Modo **intercalado** (dentro/entre temas — Kornell & Bjork). Modo **sessão** (baralho) + atalhos de teclado.
- **Pronto quando:** dá pra revisar em sessão intercalada, rápido, no teclado.

### M6 — Contas & multiusuário + DB *(Fase B; pré-req de escala)*
- Auth (e-mail+senha/magic-link; OAuth depois). Dados **por usuário**. Sair do KV-arquivo → Postgres (Neon/Supabase).
- **Pronto quando:** várias pessoas usam com dados isolados.

### M7 — Superfície pública & growth
- Landing real (a partir do mockup Fixa) + **waitlist/pré-venda** + SEO + onboarding "1º tema".
- **Pronto quando:** existe porta de entrada pública que capta e ativa.

### M8 — Monetização
- Freemium (grátis N temas/import manual; Pro = ilimitado + geração direta + stats + lembretes).
- **Packs de certificação** (one-time). Billing.
- **Pronto quando:** dá pra cobrar.

### M9 — Profundidade
- Sandbox de código JS/TS (Monaco + worker) pras práticas · PWA/offline · analytics de aprendizagem.

### 🔒 Fase 0 — Separação de IP *(pré-requisito de M7/M8 — QUALQUER venda)*
Repo pessoal + contas/infra próprias + confirmar IP com a empresa. **Antes de expor/cobrar publicamente.**

---

## 🎨 Backlog paraquedas (UI/ideias — endereçadas no milestone certo, sem interromper)
- Polir "coisinhas de UI" apontadas (batelado no fim de cada milestone).
- (novas ideias entram aqui como 1 linha, com o milestone alvo)

## Sequência resumida
**M0 → M1 → M2 → M3 → M4 → M5 → (Fase 0) → M6 → M7 → M8 → M9.**
Rationale: primeiro confiança (M0) e método correto (M1) — barato e é o coração; depois a âncora que
move o nicho (M2); então mata-se o maior risco (M3); retenção (M4/M5); e só então escala/venda (M6–M8),
sempre depois da separação de IP.
