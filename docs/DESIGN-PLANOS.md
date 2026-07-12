# DESIGN-PLANOS.md — Spec da tela /pro + seção Planos da landing

> Spec de design pronta pra implementação. Escopo: (A) tela `/pro` no app (`web/src/screens/Pro.tsx` — já existe rascunho do líder, esta spec o absorve e completa) + registro da rota em `App.tsx`; (B) seção `#planos` na landing (`web/public/fixa.html`); (C) pontos de entrada.
> **Lei:** `docs/PRICING.md`. Todo número, limite e copy de garantia daqui vem de lá — divergência é bug, não opção de design. Grátis vs Pro **R$ 19,90/mês | R$ 149/ano**; free = 2 temas + 1 geração de degustação + revisões ilimitadas pra sempre; Pro = temas ilimitados + 30 gerações/mês (fair use, máx 10/dia); fundador **R$ 14,90/mês pra sempre** (primeiros 100 da lista).
> Continuidade: tokens/linguagem da `DESIGN-HOME.md` (eyebrow mono, tríade violeta/âmbar/esmeralda, `FOCUS`) e tom da `DESIGN-REVISAR.md` (sem exclamação, sem emoji, metadados em minúsculas).

---

## 1. Direção

Pricing aqui é **honestidade como estética**. O billing não existe ainda — então a superfície inteira se declara pré-venda em vez de fingir loja: preço real, limites reais escritos em fonte de gente grande, e um único CTA que guarda lugar na lista trocando transparência por e-mail. Zero mecânica de urgência fabricada: nada de contador regressivo, número fake de vagas ou "só hoje". A escassez que existe (primeiros 100 da lista) é comunicada **como texto, sem número ao vivo** — não temos contador real e não vamos simular um.

O free é posicionamento, não isca: a página **abre dizendo que o método é grátis pra sempre** e só depois vende conveniência (gerar por IA, temas sem teto). O gate é de conveniência, nunca do método — é o anti-Quizlet, e o design repete isso em toda dobra. Linhas de comunicação (do PRICING): "menos de R$ 0,85 por dia" e "reprovar custa mais"; **nunca** comparar com Anki, **nunca** escrever "ilimitado" perto de geração por IA.

Vocabulário de cor: violeta = Pro/CTA (é marca/atividade), esmeralda = check de "incluído" e confirmação de lista, âmbar = a faixa da oferta de fundador (é a família "atenção/valor", tint, nunca sólida — regra da Home intacta).

---

## 2. (A) Tela /pro no app

### 2.1 Rota e layout

- **Rota**: adicionar `{ name: "pro" }` ao union `Route`, `if (p === "pro") return { name: "pro" }` no `parseRoute()`, e `{route.name === "pro" && <Pro me={me} />}` no `main` do `Shell`. (O rascunho `Pro.tsx` existe mas está órfão — não roteado.)
- **Container**: `mx-auto w-full max-w-xl space-y-5` (576px — mesma coluna focada da Revisar; é uma página de decisão, não um dashboard). O rascunho já usa `max-w-xl`, manter.
- **`FOCUS`**: importar de `@/App` (o rascunho declara uma constante local divergente — `outline` em vez de `ring`; remover e usar a do App).
- **Zonas** (de cima pra baixo, `space-y-5`):

```
1. CABEÇALHO DE ESTADO   → eyebrow · h1 + badge do plano · sub honesta
2. CARDS DE PREÇO        → Grátis | Pro (grid sm:grid-cols-2) · fundador + CTA no Pro
3. TABELA COMPARATIVA    → rascunho do líder, emendada · nota de fair use logo abaixo
4. GARANTIA              → card com a copy oficial
```

### 2.2 Cabeçalho de estado (topo)

Manter a anatomia do rascunho, com estas specs exatas:

- Eyebrow: `font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground` → **`plano`** (padrão §2.2 da Home; o rascunho esquece o `uppercase` implícito — a classe já resolve).
- `h1`: `mt-1 text-lg font-semibold` → free: **`Fixa Pro`** · pro: **`Você é Pro`**.
- **Badge ao lado do h1** (`flex items-center gap-2.5`):
  - **free**: `rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground` → **`free · {cfg.themes}/{cfg.freeLimit} temas`** (uso real vindo de `GET /api/config` — já no rascunho, manter).
  - **pro**: `inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[11px] font-medium text-primary` + `Crown h-3 w-3` → **`pro`**.
- Sub `mt-1.5 text-sm text-muted-foreground`:
  - free: **`O método inteiro é grátis, pra sempre. O Pro tira o teto de temas e gera a trilha por IA em 1 clique — a assinatura ainda não abriu, mas dá pra travar o preço de fundador abaixo.`** (a honestidade pré-billing mora aqui, na segunda frase, não escondida num card lá embaixo.)
  - pro: **`Temas ilimitados e geração direta por IA liberados na sua conta.`** (do rascunho, mantém).

### 2.3 Cards de preço — decisão: **cards de preço em cima + tabela embaixo, sem toggle**

O rascunho tem a tabela mas **nunca mostra o preço** — o número é a informação nº 1 da página. Decisão: dois cards lado a lado carregam **plano/preço/CTA**; a tabela (2.6) carrega o detalhe linha a linha. Sem toggle mensal/anual: toggle esconde metade da informação atrás de um clique e cria estado à toa — **os dois preços ficam visíveis sempre** (mensal grande, anual como linha mono logo abaixo).

Grid: `grid gap-3 sm:grid-cols-2` (empilha no mobile; ordem DOM **Grátis → Pro** — preço ascendente, e abrir pelo que é grátis é o posicionamento da marca).

**Card Grátis** — `Card p-4` (rounded-xl default):
1. Linha do nome: `flex items-center` → `text-sm font-semibold` **`Grátis`** + (só p/ usuário free) chip `ml-auto rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground` **`seu plano`**.
2. Preço: `mt-2 flex items-baseline gap-1.5` → valor `font-mono text-[28px] font-semibold leading-none tabular-nums tracking-tight` **`R$ 0`** + sufixo `text-xs text-muted-foreground` **`pra sempre`**.
3. Linha de valor: `mt-1.5 text-xs leading-relaxed text-muted-foreground` → **`método completo, revisões ilimitadas, até 2 temas. Sem cartão, sem teste que expira.`**
4. **Sem CTA** — a pessoa já está logada dentro do plano; botão aqui seria ruído.

**Card Pro** — `Card relative p-4 border-primary/45 shadow-sm` (o destaque honesto é a borda violeta, não um "MAIS POPULAR" inventado — não temos base pra afirmar popularidade):
1. Badge canto: `absolute right-4 top-4 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[10px] font-medium text-primary` → **`em breve`**.
2. Nome: `text-sm font-semibold` **`Pro`**.
3. Preço: mesma anatomia do Grátis → **`R$ 19,90`** + **`/mês`**.
4. Anual: `mt-1 font-mono text-[11px] tabular-nums text-muted-foreground` → **`ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)`**.
5. Linha de valor: `mt-1.5 text-xs text-muted-foreground` → **`menos de R$ 0,85 por dia.`**
6. Faixa de fundador (2.4).
7. CTA (2.5).

### 2.4 Oferta de fundador — dentro do card Pro, âmbar tracejado, **sem número fake**

Não é banner de topo de página (banner = cheiro de promoção de varejo); é uma **faixa dentro do card Pro**, colada no CTA que ela justifica:

- Container: `mt-3 rounded-lg border border-dashed border-recall/45 bg-recall/8 px-3 py-2.5`.
- Título: `text-xs font-semibold text-recall` → **`Preço de fundador: R$ 14,90/mês, pra sempre`**.
- Corpo: `mt-0.5 text-[11px] leading-relaxed text-muted-foreground` → **`pros primeiros 100 e-mails da lista. Sem contador de vagas aqui — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.`**

Como ser honesto sem contador: **o texto assume que não há contador** e transforma isso em prova de caráter. A remoção do aviso (manual, quando a lista bater 100) é o mecanismo de expiração — documentado, sem timer, sem "restam 7 vagas" de mentira. Usuário pro não vê a faixa.

### 2.5 CTA + estados

**Usuário free** (dentro do card Pro, abaixo da faixa de fundador):

- Botão: `mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 ${FOCUS}` + `Crown h-4 w-4` → **`Garantir preço de fundador`**. Dispara o `POST /api/waitlist` com `me.email` (lógica do rascunho, manter).
- Sub-linha: `mt-1.5 text-center text-[11px] text-muted-foreground` → **`sem cobrança agora — o e-mail só guarda seu lugar`**.
- **Busy**: botão `disabled`, ícone vira `Loader2 h-4 w-4 animate-spin`, label não muda.
- **Enviado**: o botão é substituído (mesmo slot, mesma `h-10`) por confirmação não-clicável `flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-domain/40 bg-domain/10 text-sm font-medium text-domain` + `Check h-4 w-4` → **`Na lista — te aviso em {me.email}`**. Sub-linha some. **Persistir** em `localStorage("fx-pro-waitlist" = "1")` e ler no mount — revisitar a página mostra o estado enviado (o rascunho perde o estado no reload).
- **Erro** (o rascunho não trata): manter o botão habilitado e exibir `mt-1.5 text-center text-xs text-destructive` → **`não deu — tenta de novo`**.

**Usuário pro**: no mesmo slot do CTA, chip estático `flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-domain/40 bg-domain/10 text-sm font-medium text-domain` + `Check h-4 w-4` → **`plano ativo na sua conta`**. Sem faixa de fundador, sem waitlist, sem card "Assinatura em breve" (o card avulso do rascunho **sai** — sua função foi absorvida pela sub do cabeçalho + sub-linha do CTA; um aviso, um lugar).

### 2.6 Tabela comparativa — aproveitando o rascunho, com emendas

A tabela do líder está certa como forma (grid denso, `Cell` com check esmeralda / X apagado / string mono, funciona em 360px sem scroll). Emendas:

- Colunas alargam pra caber as strings novas: `grid-cols-[1fr_5.25rem_5.25rem]` (era `72px`).
- Header mantém `o que tem | free | pro` (free mono muted, pro mono `text-primary`).
- **`ROWS` corrigida — o rascunho viola a lei do PRICING na linha de geração (marca ✗ no free; o free tem 1 degustação):**

| Linha (`label`) | `free` | `pro` |
|---|---|---|
| Método completo (recall + revisão espaçada) | ✓ | ✓ |
| Revisões diárias | `ilimitadas` | `ilimitadas` |
| Temas ativos | `até 2` | `ilimitados` |
| Criar tema manual (prompt pronto + JSON) | ✓ | ✓ |
| Geração por IA em 1 clique | `1 degustação` | `30/mês` |
| Data da prova + meta diária | ✓ | ✓ |
| Streak + heatmap de consistência | ✓ | ✓ |
| Export dos seus dados | `sempre` | `sempre` |

- O componente `Cell` do rascunho fica; o caso `false` (X) deixa de ocorrer com as linhas acima — manter o branch (custo zero, futuro-prova).
- Strings em `font-mono text-xs tabular-nums` (já no `Cell`).

### 2.7 Fair use — visível, não letra miúda

Nota **imediatamente sob a tabela**, sem accordion, sem asterisco remetendo pra rodapé, na mesma superfície e a um tamanho já usado pra metadados legíveis (11px, o mesmo dos labels de tile da Home):

`mt-2 text-[11px] leading-relaxed text-muted-foreground` →
**`fair use da geração: 30 por mês, no máximo 10 por dia — quem estuda normal usa de 3 a 10. Revisar nunca conta. A degustação do free abre junto com a assinatura.`**

(A última frase cobre a janela em que a degustação ainda não existe no produto: a linha da tabela é a definição do plano — lei do PRICING — e esta nota diz com todas as letras quando ela passa a valer. Se a degustação já estiver no ar na implementação, cortar a frase.)

### 2.8 Garantia — a copy oficial, num card próprio

Último bloco da página (fecha a decisão com segurança; visível pra free e pro):

- `Card flex items-start gap-3 p-4` + `ShieldCheck h-5 w-5 shrink-0 text-domain mt-0.5` (lucide).
- Título `text-sm font-medium` → **`Garantia`**.
- Corpo `mt-0.5 text-sm leading-relaxed text-muted-foreground`, **verbatim do PRICING.md**:
  **`Cancele quando quiser, em 2 cliques. Não fixou em 30 dias? Reembolso integral. E seus dados são seus — exporte tudo a qualquer momento, inclusive no grátis.`**

### 2.9 Loading e erro de página

- Skeleton na ordem/altura do layout final: `h-4 w-24` (eyebrow) · `mt-2 h-7 w-40` (h1) · `mt-5 grid gap-3 sm:grid-cols-2` com `2× h-[150px] rounded-xl` · `h-[340px] rounded-xl` (tabela) · `h-[84px] rounded-xl` (garantia).
- Erro de `getConfig`: `Card p-4 text-sm text-destructive` → `erro: {mensagem}` (molde da Home).

### 2.10 Microcopy consolidada (pt-BR)

| Onde | Texto |
|---|---|
| Eyebrow | `plano` |
| h1 | `Fixa Pro` / `Você é Pro` |
| Badge | `free · {x}/{y} temas` / `pro` |
| Sub free | `O método inteiro é grátis, pra sempre. O Pro tira o teto de temas e gera a trilha por IA em 1 clique — a assinatura ainda não abriu, mas dá pra travar o preço de fundador abaixo.` |
| Sub pro | `Temas ilimitados e geração direta por IA liberados na sua conta.` |
| Card Grátis | `Grátis` · `R$ 0` `pra sempre` · chip `seu plano` · `método completo, revisões ilimitadas, até 2 temas. Sem cartão, sem teste que expira.` |
| Card Pro | `Pro` · badge `em breve` · `R$ 19,90` `/mês` · `ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)` · `menos de R$ 0,85 por dia.` |
| Fundador | `Preço de fundador: R$ 14,90/mês, pra sempre` · `pros primeiros 100 e-mails da lista. Sem contador de vagas aqui — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.` |
| CTA | `Garantir preço de fundador` · sub `sem cobrança agora — o e-mail só guarda seu lugar` · enviado `Na lista — te aviso em {email}` · erro `não deu — tenta de novo` · pro `plano ativo na sua conta` |
| Fair use | `fair use da geração: 30 por mês, no máximo 10 por dia — quem estuda normal usa de 3 a 10. Revisar nunca conta. A degustação do free abre junto com a assinatura.` |
| Garantia | título `Garantia` + copy oficial verbatim (§2.8) |

---

## 3. (B) Seção Planos na landing (`fixa.html`)

### 3.1 Onde entra + por que não fica "solta"

**Posição: entre `#importar` e `#duvidas`.** Justificativa em 1 linha: preço só depois do valor inteiro demonstrado (método → recursos → como cria) e antes das objeções (dúvidas), com o CTA final continuando como fechamento.

**O anti-"enxerto" é o ritmo de faixas.** A página alterna fundo liso / faixa `bg-2`: metodo(liso) → recursos(faixa) → importar(liso) → duvidas(faixa). Inserir planos sem mexer nisso quebraria a alternância. Decisão: **`#planos` ganha a faixa** (`style="background:var(--bg-2);border-block:1px solid var(--line)"`) **e `#duvidas` perde a dela** (remover o `style` inline do `<section id="duvidas">`). Resultado: liso → faixa → liso → **faixa(planos)** → liso(duvidas) → cta. A seção nasce dentro do ritmo, com o mesmo esqueleto `sec-head` (eyebrow + h2 + p) de todas as outras — nada nela é forma nova.

### 3.2 Nav

Adicionar **`<a href="#planos" class="hide-sm">Planos</a>`** entre `Recursos` e `Dúvidas` (mesma ordem da página). Herda o comportamento existente: some ≤820px junto com Método/Recursos — no mobile a seção continua alcançável por scroll (a página é curta).

### 3.3 Estrutura + CSS (na linguagem da landing)

Bloco CSS novo, inserido após o bloco `/* faq */`:

```css
/* plans */
.plans { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 42px; }
.pcard { position: relative; display: flex; flex-direction: column; background: var(--card);
  border: 1px solid var(--line); border-radius: var(--r); padding: 26px; }
.pcard.pro { border-color: color-mix(in srgb, var(--brand) 55%, var(--line));
  box-shadow: 0 12px 40px -28px var(--brand); }
.plan-name { font-size: 17px; font-weight: 700; }
.soon { position: absolute; top: 22px; right: 22px; font-family: var(--mono); font-size: 10px;
  letter-spacing: .12em; text-transform: uppercase; color: var(--brand-2);
  border: 1px solid color-mix(in srgb, var(--brand) 40%, var(--line)); border-radius: 999px; padding: 4px 9px; }
.price { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; }
.price b { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.price span { font-family: var(--mono); font-size: 13px; color: var(--muted); }
.price-alt { font-family: var(--mono); font-size: 12px; color: var(--faint); margin-top: 8px; }
.pfeat { list-style: none; margin: 20px 0 22px; padding: 0; display: grid; gap: 10px;
  font-size: 14.5px; color: var(--muted); flex: 1; align-content: start; }
.pfeat li { display: flex; align-items: flex-start; gap: 10px; }
.pfeat svg { flex: none; margin-top: 4px; color: var(--domain); }
.pfeat b { color: var(--ink); font-weight: 600; }
.founder { border: 1px dashed color-mix(in srgb, var(--recall) 50%, var(--line));
  background: color-mix(in srgb, var(--recall) 9%, transparent);
  border-radius: 11px; padding: 12px 14px; margin-bottom: 16px; font-size: 13.5px; }
.founder b { color: var(--recall); }
.founder p { margin: 4px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.5; }
.pcard .btn { justify-content: center; }
.pnote { font-family: var(--mono); font-size: 11px; color: var(--faint); text-align: center;
  margin-top: 10px; letter-spacing: .03em; }
.plans-foot { margin-top: 24px; display: flex; flex-direction: column; gap: 8px;
  align-items: center; text-align: center; }
.plans-foot .cost { font-family: var(--mono); font-size: 13px; color: var(--recall); }
.plans-foot .g { color: var(--muted); font-size: 14px; max-width: 62ch; margin: 0; }
@media (max-width: 700px) { .plans { grid-template-columns: 1fr; } }
```

Notas de forma: card Pro destacado por **borda brand + glow suave** (mesma gramática do `details[open]` e do `.fcard:hover` — a landing já "acende" bordas com brand); faixa de fundador na mesma linguagem tracejada do chip `graduou` do hero; check das features em `--domain` (esmeralda = incluído, como no app). Ícone de check (inline em cada `li`): `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>`.

**CTAs — decisão:** free → `/temas` (btn ghost, mesmo destino do resto da página); **Pro → âncora `#cta`**, reaproveitando o form de e-mail existente (um form só, um endpoint só, zero JS novo). O ajuste de copy do `#cta` (3.6) fecha o circuito: quem desce pelo botão encontra o form já falando de preço de fundador.

### 3.4 HTML da seção (microcopy completa)

```html
<section id="planos" style="background:var(--bg-2);border-block:1px solid var(--line)">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Planos</span>
      <h2>O método é grátis. O Pro tira o teto.</h2>
      <p>Revisar todo dia não custa nada — é o hábito que faz fixar. O Pro é pra quem quer a trilha pronta em 1 clique, por menos de R$ 0,85 por dia.</p>
    </div>
    <div class="plans">
      <div class="pcard">
        <div class="plan-name">Grátis</div>
        <div class="price"><b>R$ 0</b><span>pra sempre</span></div>
        <div class="price-alt">sem cartão · sem teste que expira</div>
        <ul class="pfeat">
          <li>[✓] <b>método completo</b> — recall + revisão espaçada</li>
          <li>[✓] revisões diárias <b>ilimitadas, pra sempre</b></li>
          <li>[✓] até <b>2 temas</b> ativos</li>
          <li>[✓] criação manual — prompt pronto + importar JSON</li>
          <li>[✓] <b>1 geração por IA</b> de degustação</li>
          <li>[✓] export dos seus dados, sempre</li>
        </ul>
        <a href="/temas" class="btn ghost">Começar grátis</a>
      </div>
      <div class="pcard pro">
        <span class="soon">assinatura em breve</span>
        <div class="plan-name">Pro</div>
        <div class="price"><b>R$ 19,90</b><span>/mês</span></div>
        <div class="price-alt">ou R$ 149/ano — sai a R$ 12,42/mês (~2,5 meses grátis)</div>
        <ul class="pfeat">
          <li>[✓] tudo do Grátis, sem teto</li>
          <li>[✓] <b>temas ilimitados</b></li>
          <li>[✓] geração por IA em <b>1 clique</b> — a trilha nasce pronta, sem copiar e colar</li>
          <li>[✓] <b>30 gerações/mês</b> — fair use: máx. 10/dia, e revisar nunca conta</li>
        </ul>
        <div class="founder">
          <b>Preço de fundador: R$ 14,90/mês, pra sempre.</b>
          <p>Pros primeiros 100 da lista. Sem contador de vagas — não temos um de verdade e não vamos inventar. Enquanto este aviso existir, vale.</p>
        </div>
        <a href="#cta" class="btn">Garantir preço de fundador</a>
        <div class="pnote">// ainda não cobramos nada — o e-mail só guarda seu lugar</div>
      </div>
    </div>
    <div class="plans-foot">
      <span class="cost">reprovar numa certificação de US$ 100+ custa mais que 3 anos de Fixa</span>
      <p class="g">Cancele quando quiser, em 2 cliques. Não fixou em 30 dias? Reembolso integral. E seus dados são seus — exporte tudo a qualquer momento, inclusive no grátis.</p>
    </div>
  </div>
</section>
```

(`[✓]` = o svg de check do 3.3. A garantia oficial entra verbatim no `.plans-foot`, visível sem interação; a linha "reprovar custa mais" em âmbar mono ecoa o `.loop-foot` do método.)

### 3.5 FAQ nova (acordeão de dúvidas)

Inserir como 5º item, após "Serve pra passar numa certificação?":

```html
<details>
  <summary>Quanto custa? O grátis expira? <span class="plus">+</span></summary>
  <div class="ans">O grátis não expira: método completo, revisões diárias ilimitadas pra sempre e até 2 temas ativos — sem cartão. O Pro custa R$ 19,90/mês (ou R$ 149/ano) e libera temas ilimitados e 30 gerações de tema por IA por mês. Cancele quando quiser, em 2 cliques; não fixou em 30 dias, reembolso integral. E seus dados são exportáveis a qualquer momento, em qualquer plano.</div>
</details>
```

### 3.6 Ajuste no `#cta` (fechar o circuito do botão Pro)

- Parágrafo passa a: **`Crie sua conta grátis e comece agora. Quer o Pro? Deixa teu e-mail — os primeiros 100 da lista travam o preço de fundador: R$ 14,90/mês pra sempre.`**
- Botão do form: `Avisar do Pro` → **`Entrar na lista do Pro`**. Sucesso do JS existente mantém `Aviso combinado ✓` / `Valeu! Te aviso quando o Pro sair.` (comportamento atual, não mexer).

---

## 4. (C) Pontos de entrada no app — com parcimônia

1. **Nav do header**: pill **`Pro`** depois de `Ajuda` (mesmo `NavBtn`, ativa em `route.name === "pro"`), **só ≥`sm`** (`hidden sm:inline-flex`) — o mobile já está no limite de largura e tem a entrada nº 2. Visível pra free e pro (pro user = é onde o plano dele mora). Sem coroa, sem badge, sem cor especial no nav.
2. **Banner do NewTheme** (linha 78–82): o aviso de plano free ganha link no fim — texto passa a `Plano free: {x}/{y} temas · geração direta por IA é do Pro — ` + `<link>ver planos</link>` (link `text-primary underline-offset-2 hover:underline ${FOCUS}` → `navigate("/pro")`). É o ponto de dor real (a pessoa está criando tema), então é o link mais importante do app.
3. **E só.** Home, Revisar e Track **não** ganham banner/CTA de upsell — o fluxo de estudo é sagrado (gate de conveniência, nunca interrupção). Nenhum modal, nenhum toast.

---

## 5. Não-objetivos (segurar o dev)

1. **Nada de billing**: sem checkout, sem seleção de forma de pagamento, sem tela de cartão — Stripe/Mercado Pago é outra entrega (pendência do PRICING).
2. **Zero urgência fabricada**: sem contador regressivo, sem número de vagas restantes, sem "só hoje/última chance" — em nenhuma das duas superfícies.
3. **Nunca "ilimitado" na geração por IA** (lei do PRICING) — revisar cada string implementada contra §2.10 e §3.4.
4. **Sem toggle mensal/anual** — os dois preços sempre visíveis.
5. **Sem comparação com Anki** ou qualquer concorrente nominal; a comparação permitida é com o custo de reprovar.
6. **Sem API nova**: `POST /api/waitlist` e `GET /api/config` como estão; contadores de "gerações restantes"/"degustação usada" ficam pra quando o billing existir.
7. **Sem upsell no fluxo de estudo** (Home/Revisar/Track intocados) e sem restilizar outras telas.
8. **Sem tokens/webfonts novos no app**; na landing, só as classes novas do §3.3 no CSS próprio dela.

---

## 6. Checklist de aceite

- [ ] **Paridade com PRICING.md**: grep nas duas superfícies encontra exatamente `19,90` / `149` / `12,42` / `14,90` / `até 2` / `1 degustação` (ou `1 geração por IA de degustação`) / `30` / `10/dia` — nenhum número divergente, nenhum "ilimitado" encostado em geração.
- [ ] **Garantia oficial verbatim** aparece na `/pro` (card Garantia) e na landing (`.plans-foot`), sem paráfrase.
- [ ] `/pro` free: badge mostra uso real `{x}/{y} temas`; CTA dispara `POST /api/waitlist` com o e-mail da conta; estados busy → enviado → persistido no reload (`fx-pro-waitlist`); erro reabilita o botão com mensagem.
- [ ] `/pro` pro: h1 "Você é Pro", chip `plano ativo na sua conta`, sem faixa de fundador e sem waitlist em lugar nenhum.
- [ ] **Fair use legível sem interação** nas duas superfícies (nota sob a tabela na `/pro`; linha de feature no card Pro da landing) — nada atrás de accordion/tooltip/asterisco.
- [ ] **Nenhum contador/timer** renderizado; a copy de fundador não contém número de vagas restantes.
- [ ] Landing: alternância de faixas mantida (`#planos` com `bg-2`, `#duvidas` sem), nav `Planos` rola pra seção, FAQ de preço presente, tudo íntegro nos temas claro e escuro (checar `.founder` e `.soon` no light).
- [ ] Mobile 360px: cards de preço empilham (Grátis → Pro), tabela da `/pro` legível sem scroll horizontal, CTA `Garantir preço de fundador` com 40px+ de altura e foco visível (`FOCUS` do App, não a constante local do rascunho).
