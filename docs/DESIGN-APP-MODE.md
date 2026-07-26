# DESIGN-APP-MODE.md — Spec do "modo app" (TWA Android)

> Escopo: **auth em tela cheia**, **primeira abertura**, **tela Plano (ex-Pro) sem CTA de compra** e **botão voltar do Android**. Nada além disso.
> Continuidade obrigatória: `DESIGN-AUTH-EMAIL.md` §B (4 modos, copy, a11y), `DESIGN-SHELL-MOBILE.md` (header + bottom tab bar), `DESIGN-LICAO-UI.md` (dock dono do fundo), `DESIGN-PLANOS.md` (anatomia dos cards).
> Tokens: nenhum novo. Marca: violeta `--primary` (#7C5CFC), âmbar `--recall` (#F4B740), fundo dark #12101b.
> Regra de ouro: **o front é o mesmo**. Tudo aqui é `@media (display-mode: standalone)` ou o atributo de modo app — **zero tela nova**, zero rota nova.

---

## 0. Como o modo app é detectado e expresso no CSS

Na boot do app, setar no `<html>`:

```
data-app="1"   // quando matchMedia("(display-mode: standalone)").matches
               // OU document.referrer.startsWith("android-app://")
```

- É um atributo, não estado React: assim o CSS decide sozinho e nenhum componente precisa de prop nova. Onde a diferença é só visual, use `@media (display-mode: standalone)`; onde muda **comportamento** (modo inicial da auth, ausência do CTA de compra, back handler), leia o atributo uma vez e exporte um `IS_APP` booleano do `App.tsx`.
- Web mobile no navegador continua exatamente como hoje. Nada nesta spec vale para `≥md`.
- `manifest.webmanifest`: `display: standalone` (já está), `theme_color` e `background_color` = `#12101b`, `orientation: portrait`.
- Safe areas: toda borda de tela usa `env(safe-area-inset-*)` — no TWA em tela cheia o gesto/barra do Android encosta no conteúdo se isso faltar.

---

## 1. Auth em modo app — tela cheia

O card `max-w-sm` continua sendo a auth do navegador. Em modo app o **card deixa de existir como caixa**: vira a própria tela.

### 1.1 Layout (360×800 de referência)

```
┌───────────────────────────────── safe-area-top
│  (glow violeta radial, topo, aria-hidden)
│
│  ↑ pt-[calc(env(safe-area-inset-top)+48px)]
│  ● Fixa                      ← logo 36 + wordmark 26/800
│  APRENDA DE UM JEITO QUE FIXA← mono 11 uppercase 0.14em
│  ↑ mt-8
│  Crie sua conta.             ← h1 24/700 -0.02em, alinhado à ESQUERDA
│  Grátis pra começar — sem cartão.  ← 14 muted, mt-1.5
│  ↑ mt-7
│  [ Nome ]                    ← campos h-12, full-bleed da coluna
│  [ E-mail ]
│  [ Senha            👁 ]
│  mínimo de 6 caracteres
│
│  ⋮ (flex-1 — o vazio fica AQUI, entre campos e CTA)
│
│  [        Criar conta        ]  ← h-13 (52px), full-width
│  Já tem conta? Entrar           ← centrado, mt-4
│  ↓ pb-[calc(env(safe-area-inset-bottom)+20px)]
└─────────────────────────────────
```

**Medidas que mudam vs. web (todas sob `data-app`):**

| Peça | Web (hoje) | Modo app |
|---|---|---|
| Container | `grid place-items-center px-4 py-10`, `max-w-sm` | `flex min-h-[100svh] flex-col px-5`, coluna `max-w-sm mx-auto w-full` (tablet não estica) |
| Card | `rounded-xl border bg-card p-6 shadow-sm` | **sem borda, sem fundo, sem sombra, sem padding** — fundo é o `--background` |
| Bloco de marca | centrado, `mb-6` | alinhado à **esquerda**, colado no topo (`mt-12` do safe-area) |
| h1 | 17/600 centrado no card | **24/700, à esquerda** |
| Subtítulo | 13 | 14 |
| Input | `h-10` | **`h-12`** (48px = alvo mínimo de toque), `text-[16px]` (16px impede zoom no foco), `rounded-xl` |
| Olho da senha | `h-8 w-8` | **`h-11 w-11`**, `right-0.5` |
| CTA | `h-10 mt-5` | **`h-13` (52px)**, `rounded-xl`, `text-[15px] font-semibold`, empurrado pro rodapé |
| Troca de modo | `mt-5 border-t pt-4` | `mt-4`, **sem filete** (não há card pra fechar) |
| Alvo dos links secundários | inline | `min-h-11` com padding vertical (`py-2.5 px-1`) |

Vertical: `header` (marca + h1 + sub) → `campos` → `<div className="flex-1 min-h-6" />` → `CTA + troca de modo`. O CTA fica na zona do polegar; o vazio absorve a diferença de altura entre os 3 modos (nada de card pulando de tamanho).

### 1.2 Teclado aberto

`interactive-widget=resizes-content` já está no viewport — o layout viewport encolhe e o `min-h-[100svh]` recalcula sozinho. Comportamento esperado, sem JS:

1. Com o teclado aberto o `flex-1` colapsa até `min-h-6` e o **CTA sobe e fica visível logo acima do teclado**. Nunca esconder o CTA atrás do teclado, nunca torná-lo sticky (sticky + resizes-content = botão duplicado na hora da animação).
2. Se ainda assim não couber (fonte grande do sistema), o container ganha `overflow-y-auto` e o campo focado é trazido por `scroll-margin-block: 16px`. Sem scroll horizontal em 320px.
3. O bloco de marca **não some** com o teclado aberto: ele rola pra fora naturalmente. Nada de animação de encolher logo.
4. Enter no último campo submete (form nativo, já é assim). `enterKeyHint`: `next` nos campos intermediários, `done` no último (Senha no login/signup, E-mail no forgot).

### 1.3 Os 3 modos e a alternância

Mantidos exatamente os 3 (`login`, `signup`, `forgot`) + a tela `reset` de `/redefinir`. **Nada de rota nova, nada de aba segmentada no topo**: a troca continua por estado, com `key={mode}` + `fade-in slide-in-from-bottom-1 duration-200`.

- **login → signup / signup → login**: link no rodapé (§B3, copy intacta), agora com alvo de 44px.
- **login → forgot**: link `esqueci a senha` na linha do label Senha — em modo app ele vira `text-[13px]` com `py-2` (alvo), à direita do label.
- **forgot → login**: `Lembrou a senha? Voltar pra entrar`, mesmo lugar.
- **forgot enviado**: o bloco `role="status"` substitui os campos (§B2.7) e o botão `voltar pra entrar` assume o slot do CTA (mesma altura h-13, variante contorno).
- Regras de estado mantidas: troca limpa `err`/`sent`/`pass`, **mantém e-mail**, refoca o primeiro campo do modo.
- `?m=cadastro|esqueci` continua valendo (deep link do app pode usar).

### 1.4 A11y e detalhes

- Alvos ≥ 44×44 em tudo que é tocável nesta tela.
- `autocomplete` / `inputMode` / `autocapitalize` intactos (§B6) — o Android usa isso pro autofill.
- `h1` por modo, form com `aria-labelledby`, erro em `role="alert"`, sucesso em `role="status"`.
- Sem autofocus automático no **primeiro** frame do app (abrir o teclado antes da tela pintar dá flicker no TWA): focar após o primeiro paint (`requestAnimationFrame`). Ao **trocar de modo** o autofocus é imediato, como hoje.
- Barra de status: `theme-color` `#12101b`, ícones claros. O glow violeta fica sob a status bar, sem conteúdo por baixo dela.

---

## 2. Primeira abertura do app

**Deslogado → cai direto na tela de auth, em modo `signup`, com um cabeçalho de valor de 2 linhas acima do formulário. Sem tela de onboarding, sem carrossel, sem "pular".**

Justificativa (2 linhas): quem instalou o app já foi convencido pela loja, então repetir a venda custa um toque e entrega zero; e como no app não existe landing, o modo inicial não pode ser `login` — a maioria chega sem conta.

**O que muda concretamente:**

- Modo inicial em `data-app`: `signup` (no navegador continua `login`). `?m=` continua tendo prioridade.
- O "cabeçalho de valor" **é o próprio bloco de marca + h1 + subtítulo** já existentes, com uma linha a mais entre a tagline e o h1, só em modo app:

  > `Recall ativo e revisão espaçada, com data da prova.`
  > (`text-[13px] text-muted-foreground leading-relaxed`, `mt-3`)

  Total: 3 linhas de contexto antes do primeiro campo. É a orientação mínima — e some assim que a pessoa cria conta.
- **Logado** (cookie de sessão válido): abre direto na **Home**, sem splash de marca própria (o splash do TWA já é o do sistema, com o ícone e `background_color` #12101b). O estado `booting` atual (`carregando…`) em modo app vira a tela vazia com o logo centrado em `opacity-60` — sem texto, pra emendar visualmente no splash do Android em vez de piscar um "carregando".
- Nenhum tour, nenhum tooltip de primeira vez, nenhum estado "primeira sessão" persistido. A Home vazia já ensina o próximo passo (CTA Novo tema).

---

## 3. Tela Pro em modo app — sem CTA de compra

Política do Google Play: nada de compra de bem digital fora do Play Billing e **nada de link/CTA/menção que empurre pra checkout externo**. Então em modo app a tela deixa de vender e passa a **informar o plano da conta**.

### 3.1 Identidade da tela

- Aba da bottom bar: **`Plano`** (ícone `Gem` mantido) em vez de `Pro`. Rota continua `/pro`.
- Eyebrow: `plano` (era `planos`).
- h1: `Seu plano` (grátis) / `Você é Pro` (pro — mantido).
- Subtítulo (grátis): `Revisões diárias ilimitadas, com o método completo.` — descreve o que a pessoa tem, sem prometer nada.

### 3.2 Grátis, em modo app

Uma coluna, um card só — **o card do Grátis**, com o chip `Seu plano atual` no slot de sempre e a lista `FREE_FEATURES` intacta. Acima da lista, o medidor de uso que hoje é chip de header vira linha de status dentro do card:

```
temas ativos          1/2      ← mono tabular-nums, âmbar tint quando 2/2
gerações por IA       0/1
correções do Tutor    3/5
```

Abaixo do card, um bloco discreto (`border border-border rounded-xl p-4`, sem violeta, sem coroa, sem preço):

> **Fixa Pro**
> Temas ilimitados, geração por IA em 1 clique e correção do Tutor. Disponível para contas Pro.
> `A assinatura é administrada fora do aplicativo.`  ← `text-xs text-muted-foreground`

Regras:
- **Sem preço, sem R$, sem "assinar", sem "garantir preço de fundador", sem link, sem waitlist, sem e-mail.** `SubscribeCta` e `WaitlistCta` não renderizam em `data-app`, e nem o texto "pagamento pelo Mercado Pago".
- **Sem card Pro em destaque** (borda violeta + badge "preço de fundador" é anúncio). O bloco acima é informativo e visualmente neutro.
- O que impede a tela de parecer quebrada: ela tem trabalho próprio — mostrar plano e os 3 medidores de consumo, que hoje ninguém vê num lugar só. Ninguém encara um slot de botão vazio.
- Quando um limite estoura (`2/2 temas`), o aviso é factual: `Limite de temas ativos atingido. Arquive um tema para criar outro.` — nunca "vire Pro pra liberar".
- O mesmo vale para qualquer upsell espalhado: em `data-app`, o link `conhecer o Pro` do Licao (correções esgotadas) vira texto simples `correções da degustação esgotadas` sem link.

### 3.3 Pro ativo, em modo app

A pessoa que já assinou continua vendo o status dela, sem mudanças de fundo:

- h1 `Você é Pro`, chip `pro` violeta, card Pro com `plano ativo na sua conta` (`StaticSlot` domain) e `PRO_FEATURES`.
- **Sem preço** e sem botão de gerenciar/cancelar (link externo é o que a política barra). Uma linha em `text-xs text-muted-foreground` fecha a tela: `Assinatura administrada fora do aplicativo.`
- O card do Grátis não aparece (comparação com o plano que ela não usa não serve pra nada aqui).
- Rodapé mantém o link de **export** dos dados (`/api/export`) — é dado do usuário, não checkout.

### 3.4 Copy proibida em `data-app`

`Assinar o Pro` · `Garantir preço de fundador` · `Primeiros 100: R$ 14,90/mês` · `R$ 19,90/mês` · `ou R$ 149/ano` · `pagamento pelo Mercado Pago` · `Cancele quando quiser. Reembolso em até 30 dias.` · qualquer `href` externo de billing.

---

## 4. Botão voltar do Android

O app tem roteamento por `pathname` + `pushState`, então o voltar do Android **é o `history.back()` do WebView**. Regra geral: voltar desfaz a última navegação; quando não há o que desfazer, sai do app.

| Tela | Voltar faz |
|---|---|
| **Home** (`/`) | **Sai do app** (minimiza). É a raiz — nada de "toque de novo pra sair". Garantir que a Home seja sempre a primeira entrada do histórico: `navigate("/")` a partir da raiz nunca empilha (o guard `pathname !== path` já cobre). |
| **Track** (`/t/:id`) | Volta pra **Home**. Se a Track foi aberta por deep link (entrada única do histórico), voltar leva à Home via `replace` implícito — nunca sair do app direto de uma Track. |
| **Licao** (`/t/:id/l/:taskId`) | Volta pra **Track do tema**, sem diálogo de confirmação — mesma decisão do botão sair da tela (LICAO-UX §2.7): rascunho é local e a lição é retomável. **Exceções, em ordem:** (1) sheet do Tutor aberta → o voltar **fecha a sheet** e nada mais; (2) modo `editing` de resposta → o voltar sai do modo edição mantendo o texto; (3) envio em curso (`busy`) → voltar é ignorado (a requisição termina). Cada camada consome um voltar. |
| **Review** (`/revisar`) | Volta pra **Home**. Sem confirmação: o progresso da sessão já foi gravado card a card, e a fila reabre de onde parou. Se a sessão terminou (tela de fim), voltar também vai pra Home — mesmo destino dos botões `Continuar estudando` / `Voltar aos temas`. |
| **Novo tema** (`/novo`) | Volta pra origem (Home). Se houver rascunho digitado no formulário, **confirmar**: `Descartar o tema que você começou?` → `Descartar` / `Continuar editando`. É o único ponto do app onde há trabalho não persistido. |
| **Ajuda / Plano** | Volta pra tela anterior (`history.back()` puro). |
| **Auth (deslogado)** | Em `signup`/`forgot`, o voltar **retorna ao modo anterior** (empilhar o modo com `history.pushState` na troca). No modo inicial, sai do app. |

Implementação esperada: as camadas efêmeras (sheet do Tutor, modo edição, confirmação de descarte) empilham uma entrada de histórico ao abrir e a consomem no `popstate`, em vez de um handler global com `if`s — assim o voltar do Android e o gesto de borda se comportam igual, sem sequestrar o histórico.

---

## 5. Não-objetivos

1. Nenhuma tela nova, nenhuma rota nova, nenhuma lib de router.
2. Sem onboarding/carrossel/tour, sem "toque de novo pra sair", sem splash próprio.
3. Sem Play Billing agora — a decisão desta spec é **não vender no app**, não é "vender por outro canal".
4. Sem tocar em `Review.tsx` além do handler de voltar; o dock continua dono do fundo e a tab bar continua escondida em `/revisar` e na Lição.
5. Sem tokens novos, sem hex no TSX, sem sólido âmbar.
6. Desktop e web mobile no navegador: **zero mudança visual**.

---

## 6. Checklist de aceite

- [ ] Instalado como TWA, a auth ocupa a tela inteira: sem borda de card, marca à esquerda no topo, campos de 48px, CTA de 52px no rodapé acima da safe-area.
- [ ] Com o teclado aberto em 360×800, o CTA fica visível acima do teclado, sem sticky duplicado e sem scroll horizontal; Enter submete.
- [ ] Primeira abertura deslogado cai em `Criar conta` com as 3 linhas de contexto; logado cai na Home sem "carregando…" piscando.
- [ ] Trocar entre entrar/criar/esqueci mantém o e-mail, limpa senha e erro, refoca o primeiro campo — e o voltar do Android desfaz a troca.
- [ ] `/pro` no app: aba se chama `Plano`, nenhum preço, nenhum botão de assinar, nenhum link externo de billing em lugar nenhum do app (incluindo o upsell da Lição); a tela mostra plano atual + 3 medidores de uso.
- [ ] Conta Pro no app vê `Você é Pro`, chip `pro`, features e `plano ativo na sua conta`, sem preço e sem botão de gerenciar.
- [ ] Voltar: Home sai do app; Track→Home; Licao→Track (e antes disso fecha sheet/edição); Review→Home; Novo tema com rascunho pede confirmação.
- [ ] No navegador (mobile e desktop) tudo continua idêntico ao que era antes desta spec.
