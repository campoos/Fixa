# DESIGN-AUTH-EMAIL.md — Spec dos e-mails transacionais + telas de auth

> Spec de design pronta pra implementação. Escopo: **(A)** moldura `emailShell` em `email.js` + corpo/copy dos 2 e-mails existentes em `server.js` (redefinir senha e lembrete de revisões); **(B)** telas de auth em `web/src/App.tsx` (componentes `Login` e `ResetScreen`).
> Continuidade: usa os tokens e o vocabulário já implementados (`DESIGN-HOME.md` §2 — neutros violeta, `--recall`, `--domain`, `FOCUS`, eyebrow mono). Nenhum token novo em `index.css`.
> Tom de toda a copy: direto, minúsculas nos links/botões secundários, **zero exclamação**.

---

# PARTE A — E-mails transacionais

## A1. Direção

O e-mail é a marca fora de casa: chega numa caixa de entrada hostil (Gmail, dark mode forçado, sem webfont, sem SVG). A moldura atual é uma caixa branca genérica — a nova ecoa a landing com o mínimo que sobrevive a qualquer client: **wordmark tipográfica "Fixa" com o ponto âmbar**, um **filete violeta** no topo do card, eyebrow mono como nas telas do app, um único CTA violeta sólido e rodapé com a tagline. Nada de imagem hospedada, nada de fundo escuro (o dark do Gmail inverte sozinho — a gente desenha pro claro e escolhe cores que aguentam a inversão).

## A2. Paleta de e-mail (hex fixos — e-mail não tem tokens)

| Papel | Hex | Origem |
|---|---|---|
| Fundo da página | `#f2eff8` | `--background` light um passo mais tingido (destaca o card branco) |
| Card | `#ffffff` borda `#e3ddef` | `--card` / `--border` light |
| Filete de topo do card | `#6c47f0` | `--primary` light (brand da landing) |
| Tinta (títulos, strong) | `#231c39` | `--foreground` light |
| Corpo de texto | `#5c5480` | meio-tom já usado nos e-mails atuais |
| Texto apagado (eyebrow, fine print, rodapé) | `#6a6285` / `#8b83ab` | `--muted-foreground` light / faint |
| CTA sólido | fundo `#6c47f0`, texto `#ffffff` | único sólido do e-mail |
| Ponto da wordmark | `#f4b740` | âmbar da landing |
| Divisor | `#eeeaf5` | hairline |

**Regras de sobrevivência ao dark mode do Gmail** (inversão automática): fundos sempre claros (o Gmail escurece e mantém contraste), texto sempre escuro sobre claro, o violeta `#6c47f0` e o âmbar `#f4b740` são saturados o bastante pra serem preservados, e o CTA tem texto `#ffffff` sobre violeta — combinação que o Gmail não inverte. **Nunca** depender de fundo escuro nem de texto claro.

**Font stacks** (sistema, sem webfont):
- Sans: `ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`
- Mono (eyebrow e rodapé): `ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`

## A3. Anatomia da moldura

Largura máxima **520px**, tables com `role="presentation"`, todo CSS inline. De cima pra baixo:

1. **Preheader** — `div` invisível (`display:none;max-height:0;overflow:hidden`) com o resumo que o Gmail mostra ao lado do subject. Parâmetro da moldura.
2. **Header** (fora do card, sobre o fundo tingido) — wordmark tipográfica: `Fixa` 20px/800/`-0.03em` tinta `#231c39` + ponto âmbar como `span` inline-block 7×7px `border-radius:7px` fundo `#f4b740` (Outlook desktop renderiza quadrado — aceitável; **não** usar SVG nem imagem; alternativa aceita: `<span style="color:#f4b740">&#9679;</span>`).
3. **Card** — branco, borda 1px `#e3ddef`, `border-radius:14px`. Primeira linha do card é o **filete violeta**: `td` de 4px de altura, fundo `#6c47f0`, `border-radius:14px 14px 0 0`. Conteúdo com `padding:28px` (mobile aguenta: 520px flui a 100%).
4. **Dentro do card** — eyebrow mono 11px uppercase `letter-spacing:0.14em` cor `#6a6285` → título `h1` 20px/800/`-0.02em` tinta → `bodyHtml` (parágrafos 14px/1.65 `#5c5480`, CTA, fine print).
5. **CTA bulletproof** — botão em table (não `<a>` com padding só): `td` com `border-radius:10px;background:#6c47f0` e `<a>` interno `display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px`. Margem vertical 24px.
6. **Rodapé** (fora do card) — centralizado: tagline mono 11px uppercase `letter-spacing:0.08em` `#8b83ab` "FIXA — APRENDA DE UM JEITO QUE FIXA" + linha contextual 12px (motivo do envio / opt-out), cor `#8b83ab`.

### A3.1 HTML completo da moldura (substitui `emailShell` em `email.js` — colar como está)

```js
// moldura dos e-mails transacionais (spec: docs/DESIGN-AUTH-EMAIL.md §A3)
// tudo inline, sem SVG/webfont/imagem externa — sobrevive a Gmail claro e dark
const F_SANS = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const F_MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function emailShell({ preheader = "", eyebrow = "", title, bodyHtml, footnoteHtml = "" }) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2eff8;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2eff8;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;width:100%;font-family:${F_SANS};">
  <!-- header: wordmark tipográfica -->
  <tr><td style="padding:0 6px 14px;">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#231c39;">Fixa</span><span style="display:inline-block;width:7px;height:7px;margin-left:3px;border-radius:7px;background:#f4b740;"></span>
  </td></tr>
  <!-- card -->
  <tr><td>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e3ddef;border-radius:14px;border-collapse:separate;">
      <tr><td height="4" style="background:#6c47f0;border-radius:14px 14px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px;">
        ${eyebrow ? `<div style="font-family:${F_MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6285;margin:0 0 10px;">${eyebrow}</div>` : ""}
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#231c39;">${title}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
  </td></tr>
  <!-- rodapé -->
  <tr><td align="center" style="padding:16px 6px 0;">
    <div style="font-family:${F_MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8b83ab;">Fixa — aprenda de um jeito que fixa</div>
    ${footnoteHtml ? `<div style="font-size:12px;line-height:1.6;color:#8b83ab;margin-top:6px;">${footnoteHtml}</div>` : ""}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// CTA bulletproof (table-based) — usar dentro do bodyHtml
export function emailButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
    <td style="border-radius:10px;background:#6c47f0;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:${F_SANS};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
    </td></tr></table>`;
}
```

> Assinatura muda de `emailShell(title, bodyHtml)` para `emailShell({ preheader, eyebrow, title, bodyHtml, footnoteHtml })` — os 2 call sites em `server.js` são atualizados junto (abaixo). Nenhuma mudança em `sendEmail`/Brevo.

## A4. E-mail 1 — Redefinir senha (`server.js`, rota `/api/forgot`)

| Campo | Valor |
|---|---|
| Subject | `Redefinir sua senha — Fixa` (mantém) |
| Preheader | `O link vale por 1 hora e funciona uma única vez.` |
| Eyebrow | `redefinir senha` |
| Título | `Vamos criar uma senha nova.` |
| CTA | `Criar nova senha` → `${link}` |

Corpo (`bodyHtml`):

```js
`<p style="margin:0;font-size:14px;line-height:1.65;color:#5c5480;">Recebemos um pedido pra redefinir a senha da sua conta. O botão abaixo vale por <strong style="font-weight:600;color:#231c39;">1&nbsp;hora</strong> e funciona uma única vez.</p>
${emailButton(link, "Criar nova senha")}
<p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#8b83ab;">Se o botão não abrir, copie e cole este link no navegador:<br><a href="${link}" style="color:#6c47f0;word-break:break-all;">${link}</a></p>
<div style="border-top:1px solid #eeeaf5;padding-top:14px;">
  <p style="margin:0;font-size:12px;line-height:1.6;color:#8b83ab;">Se não foi você, ignore este e-mail — sua senha continua a mesma.</p>
</div>`
```

Footnote (rodapé): `Você recebeu este e-mail porque alguém pediu a redefinição de senha desta conta.`

## A5. E-mail 2 — Lembrete "N pra revisar hoje" (`server.js`, cron de lembretes)

| Campo | Valor |
|---|---|
| Subject | `${due} ${due === 1 ? "revisão te espera" : "revisões te esperam"} hoje — Fixa` (mantém) |
| Preheader | `Revisar no tempo certo é o que faz fixar. Leva poucos minutos.` |
| Eyebrow | `revisão do dia` |
| Título | `${due} ${due === 1 ? "revisão" : "revisões"} no ponto certo.` |
| CTA | `Revisar agora` → `${BASE_URL}/revisar` |

Corpo (`bodyHtml`):

```js
`<p style="margin:0;font-size:14px;line-height:1.65;color:#5c5480;">Essas tasks voltaram hoje porque é agora que revisar rende mais — pouco antes de o cérebro soltar. Leva poucos minutos, e o dia conta pra sua consistência.</p>
${emailButton(`${BASE_URL}/revisar`, "Revisar agora")}
<div style="border-top:1px solid #eeeaf5;padding-top:14px;">
  <p style="margin:0;font-size:12px;line-height:1.6;color:#8b83ab;">Prefere revisar no seu ritmo, sem lembrete? <a href="${offLink}" style="color:#8b83ab;text-decoration:underline;">Parar de receber lembretes</a></p>
</div>`
```

Footnote (rodapé): `Você recebeu este lembrete porque tem revisões agendadas no Fixa.`

## A6. Restrições respeitadas (checagem rápida pro dev)

- Só tables/divs com CSS inline; `role="presentation"` em toda table de layout.
- Sem SVG, sem `<img>`, sem webfont, sem `@media`/`<style>` obrigatório (tudo funciona sem head styles).
- Largura fluida com `max-width:520px`; padding externo 32/16 pra respirar no mobile.
- Nenhum fundo escuro; contraste AA no tema claro e sobrevive à inversão do Gmail (§A2).
- Nenhuma exclamação na copy; links secundários em minúsculas de frase.

---

# PARTE B — Telas de auth (login · criar conta · esqueci · redefinir)

## B1. Direção e decisão de layout

É a porta de entrada de quem vem da landing (hero dark violeta, curva de memória). A decisão é **coluna única centrada com momento de marca**, não split de desktop: split duplicaria o poster que a landing já é, dobraria manutenção e atrasaria o form — e o form é o trabalho da tela. O momento de marca vem de três coisas baratas: um **glow violeta radial** no topo da página (tinta, não gradiente decorativo de card — funciona nos 2 temas via `--primary`), o **bloco de marca** (Logo + wordmark + tagline mono, o mesmo hero-tag da landing) acima do card, e o card no vocabulário do app. Mobile-first: em 360px é a mesma tela, só flui.

## B2. Estrutura e anatomia

### B2.1 Página (shell comum aos 4 modos)

```tsx
<div className="relative grid min-h-full place-items-center overflow-hidden px-4 py-10">
  {/* glow de marca — decorativo, some pra leitores de tela */}
  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72"
       style={{ background: "radial-gradient(560px 280px at 50% -80px, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)" }} />
  <div className="relative w-full max-w-sm">{/* brand block + card */}</div>
</div>
```

- Glow: 16% de `--primary` — no light vira um véu lilás sutil, no dark acende como a landing. Sem animação.
- Coluna: `max-w-sm` (384px), 100% no mobile.

### B2.2 Bloco de marca (acima do card, `mb-6`, centrado)

```tsx
<div className="mb-6 flex flex-col items-center gap-2">
  <div className="flex items-center gap-2.5">
    <Logo size={32} />
    <span className="text-[22px] font-extrabold tracking-[-0.03em]">Fixa</span>
  </div>
  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">aprenda de um jeito que fixa</p>
</div>
```

### B2.3 Card

`rounded-xl border border-border bg-card p-6 shadow-sm` (sombra só aparece no light; no dark a borda sólida faz o corte — regra da DESIGN-HOME §2.1).

Dentro, na ordem: **header do modo** (`mb-5`) → **alerta de erro** (se houver) → **campos** (`space-y-4`) → **CTA** (`mt-5`) → **troca de modo** (`mt-5 border-t border-border pt-4`).

Header do modo: `h1` `text-[17px] font-semibold tracking-[-0.01em]` + subtítulo `mt-1 text-[13px] leading-relaxed text-muted-foreground`.

### B2.4 Campos (constantes no topo do arquivo, ao lado de `FOCUS`)

```tsx
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/25";
const INPUT_ERR = "border-destructive focus:border-destructive focus:ring-destructive/25"; // concatenar quando o campo for o culpado
const LABEL = "mb-1.5 block text-[13px] font-medium";
```

- Todo campo tem `<label htmlFor>` visível (adeus placeholder-como-label) + `id` + `name` (password managers dependem).
- Campo de senha: wrapper `relative`, botão olho `absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:text-foreground ${FOCUS}` com `Eye`/`EyeOff` (`h-4 w-4`, lucide) e `aria-label="mostrar senha"` / `"ocultar senha"`; input ganha `pr-10`. Toggle alterna `type` entre `password` e `text`.
- Linha do label da senha no **login**: `flex items-baseline justify-between` — label à esquerda, à direita o link `esqueci a senha` (`text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline ${FOCUS}` — `type="button"`).
- Hint de senha (signup e reset), abaixo do input: `mt-1.5 text-xs text-muted-foreground` → `mínimo de 6 caracteres`.

### B2.5 CTA e estados de botão

```tsx
<button disabled={busy || !canSubmit}
  className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`}>
  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
  {label}
</button>
```

Regras de `canSubmit` mantidas como hoje (não é mudança de lógica, só de casca). Sem "…" solto: o label de busy é palavra (tabela §B3).

### B2.6 Alerta de erro (nível de form — mensagens da API já vêm em pt-BR)

```tsx
<div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] leading-snug text-destructive">{err}</div>
```

Fallback quando não é `ApiError`: `algo deu errado — tenta de novo` (mantém). Erro limpa ao trocar de modo e ao reenviar.

### B2.7 Sucesso do "esqueci" (substitui os campos, não empilha)

```tsx
<div role="status" className="rounded-md border border-domain/30 bg-domain/10 px-3 py-2.5 text-[13px] leading-relaxed text-domain">
  Se existir conta com <strong className="font-semibold">{email}</strong>, o link chegou na sua caixa de entrada. Vale por 1 hora.
</div>
<p className="mt-3 text-xs text-muted-foreground">Não chegou? Confira o spam ou <button type="button" className="underline underline-offset-2 hover:text-foreground">tentar com outro e-mail</button>.</p>
```

O botão "tentar com outro e-mail" volta `sent=false` mantendo o modo. O CTA principal vira link de retorno: `voltar pra entrar` (troca pro modo login).

## B3. Modos e microcopy (completa, pt-BR)

| | **login** | **signup** | **forgot** | **reset** (`/redefinir`) |
|---|---|---|---|---|
| h1 | Bom te ver de novo. | Crie sua conta. | Esqueceu a senha? | Crie sua nova senha. |
| Subtítulo | Entre pra continuar de onde parou. | Grátis pra começar — sem cartão. | Digite seu e-mail — enviamos um link pra criar uma nova. | Ela vale a partir de agora, em todos os seus aparelhos. |
| Campos | E-mail · Senha | Nome · E-mail · Senha | E-mail | Nova senha |
| Placeholders | `voce@email.com` · `••••••••` | `como quer ser chamado` · idem | `voce@email.com` | `••••••••` |
| CTA | Entrar | Criar conta | Enviar link | Salvar e entrar |
| CTA busy | entrando… | criando conta… | enviando… | salvando… |
| Link de troca (rodapé do card) | Não tem conta? **Criar conta** | Já tem conta? **Entrar** | Lembrou a senha? **Voltar pra entrar** | — |
| Extra | link `esqueci a senha` na linha do label Senha | hint `mínimo de 6 caracteres` | estado enviado (§B2.7) | hint `mínimo de 6 caracteres`; em erro de token, §B4 |

Rodapé de troca de modo: `text-center text-[13px] text-muted-foreground`, com a parte em negrito como `<button type="button" className="font-medium text-primary hover:underline underline-offset-2 ${FOCUS}">`.

## B4. Reset com token inválido/expirado

A API responde `link inválido ou expirado — peça outro`. Além do alerta (§B2.6), mostrar abaixo do CTA um botão secundário full-width:

```tsx
<button type="button" onClick={() => navigate("/?m=esqueci")}
  className={`mt-2 h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`}>
  pedir um novo link
</button>
```

`Login` passa a ler, **só na montagem**, o query param `m` (`cadastro` | `esqueci`) pra abrir já no modo certo — UI pura, nenhuma rota/endpoint novo. Bônus grátis: a landing pode linkar `/?m=cadastro`.

## B5. Transições entre modos

- Mesmo componente, mesma troca por estado (sem mudança de rota). O miolo do card (header + campos + CTA) recebe `key={mode}` e `animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none` (tw-animate-css já importado).
- Ao trocar de modo: limpar `err` e `sent` (como hoje), **manter `email`** (a pessoa não redigita), limpar `pass`, e focar o primeiro campo do modo novo.
- Altura do card varia entre modos — não animar altura (corte seco é ok; é troca de contexto, não morphing).

## B6. Acessibilidade

- **Autofocus por modo**: login → e-mail · signup → nome · forgot → e-mail · reset → nova senha (re-aplicar no switch de modo, não só no mount).
- **Autocomplete**: nome `autoComplete="name"` · e-mail `type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"` · senha do login `autoComplete="current-password"` · senha do signup e do reset `autoComplete="new-password"`.
- `h1` real por modo (hoje não há heading); o form tem `aria-labelledby` apontando pro `h1`.
- Erro em `role="alert"`, sucesso em `role="status"` (anunciados por leitor de tela sem roubar foco).
- Todo interativo com `FOCUS`; alvos ≥ 40px de altura (inputs e botões h-10, olho h-8 dentro de campo h-10).
- Submit por Enter em qualquer campo (form nativo — manter `<form onSubmit>`).

## B7. Dark/light e mobile

- Zero cor hardcodeada: tudo via tokens (`bg-card`, `border-border`, `text-destructive`, `text-domain`, `bg-primary`…). O glow usa `color-mix` com `--primary`, então acompanha o tema sozinho.
- Mobile 360px: coluna 100%, `py-10` garante respiro com teclado aberto; nada de scroll horizontal; `place-items-center` mantém o card visível acima da dobra.

---

# Não-objetivos

- **Não mexer em rotas, API, sessão ou lógica de auth** — endpoints, validações do server, `canSubmit`, fluxo de token e expiração ficam como estão; isto é casca.
- **Não trocar o provider de e-mail** — `sendEmail`/Brevo intocados; muda só `emailShell` e os 2 corpos.
- Sem webfonts (app e e-mail), sem lib de formulário/validação, sem social login, sem captcha, sem e-mail de boas-vindas (fica pro roadmap).
- Landing (`web/public/fixa.html`) e página de opt-out de lembretes intocadas.

# Checklist de aceite (8 itens)

1. [ ] Os 2 e-mails renderizam no Gmail (web e app) com wordmark + ponto âmbar, filete violeta, eyebrow mono, CTA bulletproof e rodapé — sem imagem externa, sem SVG, largura ≤ 520px fluida.
2. [ ] No dark mode do Gmail (inversão automática) o texto continua legível e o CTA continua violeta com texto branco; nenhum trecho depende de fundo escuro.
3. [ ] Copy dos e-mails idêntica à spec (§A4/§A5), com preheader, e **zero "!"**; lembrete mantém opt-out visível e reset mantém link copiável de fallback.
4. [ ] `emailShell({ preheader, eyebrow, title, bodyHtml, footnoteHtml })` + `emailButton` colados de §A3.1 e os 2 call sites de `server.js` atualizados — `sendEmail`/Brevo sem mudança.
5. [ ] Auth com 4 modos (entrar/criar/esqueci/redefinir) no layout novo: glow, bloco de marca com tagline mono, card `max-w-sm`, labels visíveis, olho de senha, títulos/CTAs/links exatamente como §B3.
6. [ ] Estados corretos: busy com spinner + label, erro de API em `role="alert"` no molde §B2.6, sucesso do esqueci em `role="status"` com o e-mail digitado, token inválido oferece "pedir um novo link" (§B4).
7. [ ] A11y: autofocus por modo (inclusive ao trocar), autocomplete `name`/`email`/`current-password`/`new-password`, `h1` por modo, `FOCUS` em todo interativo, submit por Enter.
8. [ ] Dark e light impecáveis só com tokens (nenhum hex no TSX) e mobile 360px sem scroll horizontal, com alvos ≥ 40px.
