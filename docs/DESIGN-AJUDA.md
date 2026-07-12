# DESIGN-AJUDA.md — Spec da tela Ajuda (`/ajuda`) + auditoria de conteúdo

> Spec de design pronta pra implementação. Escopo: **apenas `web/src/screens/Ajuda.tsx`**. Nenhuma mudança em tokens (`index.css`), API, rotas ou shell.
> Contexto: a Ajuda foi escrita quando o app era single-user, sem planos, sem geração direta, sem data da prova, sem lixeira e com revelação em um estágio só. Esta spec traz o **design pro padrão novo** (eyebrows mono, tokens `domain`/`recall`/`primary`, `FOCUS`) e — entregável principal — a **auditoria de conteúdo**: o que entra, o que sai e o que muda, com texto final.
> Referências: DESIGN-HOME §2 (tokens — a lei visual), METODO-CIENCIA-E-PRODUTO.md (a ciência), PRICING.md (números dos planos — lei), `review-engine.js` (`REVIEW_LADDER = [1,2,3,4,7,15,21,30]` — 8 caixas), DESIGN-SHELL-MOBILE (a tela convive com a bottom tab bar; aba Ajuda ativa).

---

## 1. Direção

A Ajuda é a única tela do app que é **leitura**, não ferramenta — mas fala o mesmo dialeto: eyebrows mono, cards quietos, zero marketing. Três camadas em ordem de valor: **o método** (como estudar — 4 cards visuais), **a ciência** (um card de credibilidade, com nomes e anos — trust é feature, METODO §5 P1) e **as perguntas** (só as que a UI não responde sozinha). Curta o bastante pra ler inteira numa espera de elevador.

---

## 2. Auditoria de conteúdo (as decisões, antes do layout)

### 2.1 Cards do método — **continuam 4** (não viram 5)

O loop frio → corrige → generaliza → espaça é a identidade do método e o mapeamento 1:1 com a evidência (METODO §2). A revelação em dois estágios (pontos-chave ≠ resposta) **não é um passo novo — é o "corrige" ficando honesto**: o card 02 é reescrito pra descrever os dois tempos. Quebrar em 5 diluiria o loop e dessincronizaria da ciência.

### 2.2 FAQ — saldo da auditoria (base: 6 perguntas antigas → 10 finais)

| Pergunta antiga | Decisão | Por quê (1 linha) |
|---|---|---|
| "O que é revisão espaçada?" | **ALTERADA** (→ FAQ 1) | Régua estava certa (8 caixas), mas faltava a graduação (dominada) e a barrinha da escada que agora existe no player. |
| "Preciso saber programar?" | **REMOVIDA** | O placeholder do Novo tema já responde ("AWS…, teoria dos grafos, inglês pra entrevistas") — redundante com a UI. |
| "De onde vem o conteúdo dos temas?" | **ALTERADA** (→ FAQ 6) | Descrevia só o fluxo manual; hoje o caminho principal é "Gerar tema" em 1 clique (degustação/Pro). |
| "Serve pra passar numa certificação?" | **REMOVIDA** | Copy de landing, não de ajuda — quem está logado já comprou a ideia; o caso de uso vive melhor na FAQ da data da prova. |
| "Uma task que fiz hoje aparece quando?" | **FUNDIDA** (→ FAQ 2) | O "volta amanhã" é metade da resposta de "concluída vs dominada" — juntas, uma pergunta só e mais forte. |
| "E se o import der erro perto de um link?" | **MANTIDA** (→ FAQ 7, ajuste leve) | Fluxo manual continua existindo (e é o único do free pós-degustação); o erro continua acontecendo. |

**Novas (6):** intercalar (FAQ 3), sair da sessão (FAQ 4), data da prova + meta diária (FAQ 5), lixeira/restaurar (FAQ 8), grátis × Pro (FAQ 9), senha (FAQ 10).

**Avaliadas e deliberadamente NÃO incluídas:**
- **Atalhos de teclado** — o player já mostra o hint permanente ("espaço revela · 1 errei · 2 acertei") e os `<kbd>` nos botões; no mobile não há teclado. Redundante com a UI.
- **Streak/heatmap** — tooltip, legenda "menos→mais" e labels dos tiles já explicam; ninguém abre a Ajuda pra entender um heatmap do GitHub.
- **Editar task / anexar epics** — o lápis e o bloco "Adicionar conteúdo" têm copy explicativa própria; na FAQ 6 sobra uma menção de 1 linha ("tudo editável depois").
- **Export dos dados** — o Pro promete "export sempre", mas **o endpoint ainda não existe**; a Ajuda não promete o que o app não faz. Quando existir, ganha FAQ.

### 2.3 Card da ciência — cita os nomes? **Sim, com moderação**

Dois nomes no corpo (Roediger & Karpicke; Cepeda) + o ranking (Dunlosky, 2013) no rodapé mono. É o que dá credibilidade sem virar paper. A frase "dominar ≠ marquei feito" **sai do card da ciência** — agora tem FAQ própria (FAQ 2) e onboarding inline na Track.

---

## 3. Layout / zonas

Container da tela: `space-y-8` (mesma métrica de zonas da Home). A tela convive com a bottom tab bar em `<md` (aba Ajuda ativa, `CircleHelp`) — o `main` do Shell já compensa o padding; **nada a fazer aqui**.

```
1. HEADER      → h1 + sub (sem eyebrow — é o título da página)
2. O MÉTODO    → eyebrow · grid 4 cards · linha-eco da régua
3. A CIÊNCIA   → eyebrow · card quieto
4. PERGUNTAS   → eyebrow · 3 grupos (overline) de <details>
```

Constantes compartilhadas (mesmas strings de Home/Review/Track):

```tsx
const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
const OVERLINE = "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70";
```

### 3.1 Header

- `h1` "Como estudar na Fixa" — `text-lg font-semibold`.
- Sub `mt-1 text-sm text-muted-foreground`: **"Não é releitura — é esforço de lembrar. Cada task roda este loop."** (mantém; continua verdadeiro e é a melhor frase da tela).

### 3.2 Zona O MÉTODO

- `h2` eyebrow `O MÉTODO`, `mb-3`.
- Grid `grid grid-cols-1 gap-3 sm:grid-cols-2`. Card: `Card p-4`.
- Anatomia do card: linha 1 `flex items-center gap-2` → número `font-mono text-xs tabular-nums text-primary` + tag `OVERLINE`; título `mt-2 text-sm font-semibold`; corpo `mt-1 text-[13px] leading-relaxed text-muted-foreground`.
- **Conteúdo EXATO dos 4 cards:**

| # | tag | Título | Corpo |
|---|---|---|---|
| 01 | `frio` | **Tenta de cabeça** | Responda a questão sem olhar nada. O esforço de puxar da memória — mesmo errando — é o que grava. |
| 02 | `corrige` | **Confere em dois tempos** | Revele primeiro só os pontos-chave e ache o que faltou; responda de novo e só então confira a resposta. Erro percebido fixa mais que acerto fácil. |
| 03 | `generaliza` | **Comprime com a sua palavra** | Anote nas Anotações da task, em 2–4 frases, o que entendeu e onde errou. O cérebro esmaga o conteúdo no mínimo revisável. |
| 04 | `espaça` | **Revisa no tempo certo** | A task volta em intervalos crescentes: acertou, espaça mais; errou, volta amanhã. Acertou até a última caixa, ela está dominada. |

- **Linha-eco da régua** (fecha a zona, mesma voz dos empty states): `mt-3 font-mono text-[11px] tabular-nums text-muted-foreground/70 text-center` → **`revisa em 1d · 2d · 3d · 4d · 7d · 15d · 21d · 30d`** (8 degraus — a régua real do `REVIEW_LADDER`; o eco antigo de 6 degraus estava desatualizado).

### 3.3 Zona A CIÊNCIA

- `h2` eyebrow `A CIÊNCIA`, `mb-3`. Um `Card p-4` (quieto: sem tint de fundo, sem borda colorida).
- **Texto exato:**
  - Intro `text-sm text-muted-foreground`: **"A Fixa não inventou moda — é feita das duas únicas técnicas de estudo que a ciência classifica como de alta utilidade:"**
  - Lista `mt-2.5 space-y-2 text-sm` (bullet: `mt-1.5 h-1 w-1 rounded-full` — `bg-primary` no item 1, `bg-recall` no item 2; o negrito usa `font-medium text-foreground`):
    - **Recall ativo:** tentar lembrar — mesmo errando — grava mais que reler. Por isso a resposta nasce escondida, em todas as telas. *(Roediger & Karpicke, 2006)*
    - **Revisão espaçada:** rever no intervalo em que você está quase esquecendo é o que fixa de vez. Por isso a fila "Revisar hoje" traz cada task na hora certa. *(Cepeda et al., 2006)*
  - As citações entre parênteses: `font-mono text-[11px] text-muted-foreground/70`, na mesma linha, fim do item.
  - Rodapé `mt-3 border-t border-border pt-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground/70`: **"Dunlosky et al., 2013 — num ranking de 10 técnicas, só estas duas são 'alta utilidade'. Reler e grifar, o que a maioria faz, ficaram no fim da lista."**

### 3.4 Zona PERGUNTAS

- `h2` eyebrow `PERGUNTAS`, `mb-3`. Três grupos com `space-y-5` entre eles; dentro do grupo: label `OVERLINE` `mb-2` + lista `space-y-2`.
- Grupos: `o método` · `conteúdo e temas` · `conta e plano`.
- **Acordeão `<details>` no padrão** (nativo, sem lib, sem animação):

```tsx
<details className="group rounded-lg border border-border bg-card">
  <summary className={cn("flex cursor-pointer list-none items-center gap-2 rounded-lg p-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden", FOCUS)}>
    <span className="flex-1">{q}</span>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-open:rotate-90" />
  </summary>
  <div className="px-3.5 pb-3.5 text-sm leading-relaxed text-muted-foreground">{a}</div>
</details>
```

- Destaques dentro das respostas: `<b className="font-medium text-foreground">` (mesmo `B` do Pro). Números e réguas em `font-mono tabular-nums`.

---

## 4. FAQ completa — texto final (pt-BR)

### Grupo `o método`

**1. Como funciona a revisão espaçada (as caixas)?**
Cada task concluída entra numa escada de **8 caixas**: `1 → 2 → 3 → 4 → 7 → 15 → 21 → 30` dias. Acertou na revisão, sobe de caixa e o intervalo cresce; errou, volta pra caixa 1 e reaparece amanhã. Acertou na última, a task **gradua**: vira dominada e sai da fila. A barrinha no topo de cada card de revisão mostra em que degrau ela está.

**2. Qual a diferença entre concluída e dominada?**
**Concluída** é o checkbox: você estudou a task e marcou feita — ela entra na fila e volta **amanhã** pra primeira revisão. **Dominada** é prova real: você acertou essa task nas revisões até o topo da escada. Marcar feito não convence a Fixa — só o acerto repetido, com semanas de distância, conta como saber.

**3. O que o botão "intercalar" faz na revisão?**
Com 2 ou mais temas na fila, ele **mistura os cards** em vez de agrupar por tema. Alternar assuntos força o cérebro a discriminar o contexto de cada resposta — fixa mais que revisar em bloco. Vem ligado; desligue se quiser um tema por vez (a sessão reinicia).

**4. Posso sair no meio da sessão de revisão?**
Pode — o **X** no topo sai a qualquer momento. Cada card que você já avaliou foi salvo na hora; os que ficaram continuam na fila de hoje, te esperando.

**5. O que muda quando eu coloco a data da prova?**
Duas coisas: o tema ganha uma **meta diária** (~N tasks/dia pra concluir tudo a tempo) e a agenda se adapta — **nenhuma revisão é marcada pra depois da prova**. Você define a data no cabeçalho da tela do tema, e pode editar ou remover quando quiser.

### Grupo `conteúdo e temas`

**6. De onde vem o conteúdo dos temas?**
Da IA, do jeito que você preferir. **"Gerar tema"** cria a trilha inteira em 1 clique (no grátis você tem 1 geração de degustação; no Pro, 30 por mês). O **fluxo manual** é grátis e sem limite: a Fixa monta um prompt, você cola no seu chat (ChatGPT, Gemini…) e importa o JSON que ele devolve. Nos dois casos tudo é editável depois — lápis na task, e dá pra anexar epics novos no fim da trilha.

**7. O import deu erro perto de um link — o que faço?**
O chat às vezes "linkifica" uma URL ao copiar e isso quebra o JSON. Apague o trecho `[...](...)` deixando só o texto simples, ou peça pro modelo responder sem links.

**8. Excluí um tema sem querer — dá pra voltar?**
Dá. Excluir manda o tema pra **Lixeira**, no fim da tela de temas — restaurar traz tudo de volta, incluindo o progresso das revisões. Só "apagar de vez" é permanente.

### Grupo `conta e plano`

**9. O que é grátis e o que é do Pro?**
O método inteiro é grátis pra sempre: **revisões ilimitadas**, até **2 temas** ativos, fluxo manual sem limite e **1 geração por IA** de degustação. O Pro tira o teto: **temas ilimitados** e **30 gerações por IA/mês** (máx. 10/dia). Os detalhes e preços estão na aba **Pro**.

**10. Esqueci minha senha — e agora?**
Por enquanto **não existe recuperação automática** de senha — guarde a sua num gerenciador. A recuperação por e-mail está no plano; até lá, não dá pra redefinir sozinho.

> Decisão da FAQ 10: honestidade sem inventar canal — não citar e-mail de suporte (não existe um oficial) nem fingir que o fluxo existe. Quando a recuperação entrar no produto, a resposta troca.

---

## 5. Microcopy (resumo)

| Onde | Texto |
|---|---|
| h1 / sub | `Como estudar na Fixa` · `Não é releitura — é esforço de lembrar. Cada task roda este loop.` |
| Eyebrows | `O MÉTODO` · `A CIÊNCIA` · `PERGUNTAS` |
| Overlines dos grupos | `o método` · `conteúdo e temas` · `conta e plano` |
| Tags dos cards | `frio` · `corrige` · `generaliza` · `espaça` |
| Linha-eco | `revisa em 1d · 2d · 3d · 4d · 7d · 15d · 21d · 30d` |
| Citações | `(Roediger & Karpicke, 2006)` · `(Cepeda et al., 2006)` · rodapé `Dunlosky et al., 2013 — …` |

Tom: minúsculas em metadados, sem exclamação, sem emoji, números em mono `tabular-nums`.

---

## 6. Não-objetivos (segurar o dev)

1. **Sem CTA de venda** — a única menção a plano é a FAQ 9 (texto, sem botão pro `/pro`; a aba Pro já existe na navegação).
2. **Sem prometer o que não existe**: nada de export de dados, recuperação de senha, apps nativos, suporte por e-mail.
3. **Sem busca, sem "fale conosco", sem vídeo, sem ilustração** — 10 perguntas não precisam de índice.
4. **Acordeão nativo** (`<details>`), sem lib, **sem animação** de abrir/fechar (corte seco, como todo collapse do app) e sem "abrir tudo".
5. **Sem tokens novos, sem cores fora** de violeta/âmbar/esmeralda/destructive; âmbar nunca sólido.
6. **Não tocar** em `App.tsx`, rotas, API ou outras telas.

---

## 7. Checklist de aceite

- [ ] Os 4 cards do método usam eyebrow/overline mono, número `text-primary` tabular e o card 02 descreve os **dois tempos** (pontos-chave → resposta).
- [ ] Linha-eco da régua tem **8 degraus** (`…15d · 21d · 30d`) — igual ao `REVIEW_LADDER` do server.
- [ ] Card da ciência cita Roediger & Karpicke, Cepeda e Dunlosky (rodapé mono com border-t) — e **não** contém mais a frase "dominar não é marquei feito" (migrou pra FAQ 2).
- [ ] FAQ tem **10 perguntas em 3 grupos** com overlines; "programar" e "certificação" não existem mais; nenhuma resposta contradiz PRICING.md (2 temas, 1 degustação, 30/mês, 10/dia).
- [ ] `<details>` estilizado: sem marker nativo, chevron gira em `group-open`, `summary` com anel `FOCUS` no teclado.
- [ ] FAQ 10 (senha) não promete recuperação nem cita canal de suporte inexistente.
- [ ] 390px: nada estoura, cards empilham, último acordeão rola pra cima da tab bar (padding do Shell, sem padding próprio na tela); aba Ajuda ativa na bar.
- [ ] Zero emoji, zero exclamação, zero cor hardcoded (`grep -nE "emerald|amber|blue-4|red-4" Ajuda.tsx` vazio).
