# Tutor — visibilidade da nota e do refazer (spec cirúrgica)

> **Origem:** feedback do dono (13/07, pós-uso real do Tutor): (1) "na lição não mostra a nota
> que eu tirei"; (2) "não deixa eu refazer a lição" logo após concluir; (3) "não mostra aqueles
> que eu já tive correção de tutor e que eu não tive" na árvore.
> **Leis vigentes:** `DESIGN-LICAO-UX.md` (fluxo), `DESIGN-LICAO-UI.md` (visual),
> `DESIGN-TUTOR-IA.md` (conteúdo da correção; nota nunca toca a caixa Leitner — §5).
> **Arquivos tocados:** `web/src/screens/Licao.tsx`, `web/src/screens/Track.tsx`,
> `web/src/lib/lesson.ts`, `web/src/App.tsx` (zero mudança — só referência de rota).
> Nenhum token novo, nenhum endpoint novo (`task.tutor` já desce no `getTrack`).

---

## 0. Decisão de princípio — a nota ENTRA na árvore (registro de estudo)

A nota do Tutor é **registro de estudo**, não sinal de revisão. O que a árvore esconde de
propósito são sinais que prescrevem ação agora (fila, atraso, escada Leitner) — esses têm dono,
o `/revisar`. A nota não prescreve nada: é o **desfecho da lição**, da mesma família do
"concluída em 12/07", do contador de anotações e da GraduationCap de dominada — memória do que
aconteceu, não chamada pra agir. E, por decisão de método, ela nunca mexe no agendamento
(`DESIGN-TUTOR-IA.md` §5): mostrá-la não cria uma segunda fila nem compete com o Revisar. Ela
responde exatamente a pergunta que o dono fez à árvore ("quais já corrigi e com que nota") —
pergunta de **mapa**, não de fila. Entra.

### 0.1 Conflito de ícone/cor — resolvido por uma regra única

Na árvore, **GraduationCap esmeralda continua exclusiva de "dominada"** — o Tutor **nunca ganha
ícone na árvore**; a marca dele é **a própria nota**, mono tabular violeta (violeta é a tinta do
Tutor em todas as superfícies). Pra nota não se confundir com a pill de progresso `2/3` (também
mono violeta), a forma diferencia o significado:

| Marca | Forma | Significado |
|---|---|---|
| `2/3` | pill **cheia** `rounded-full bg-primary/10` | progresso transitório (você parou aqui) |
| `8/10` | badge **contornado** `rounded-[5px] border-primary/25 bg-primary/5` | nota permanente (registro) |

Os dois nunca coexistem na mesma row (pill exige lição em andamento e não-Done; nota exige
lição completa + corrigida), mas a regra cheia=transitório / contornado=registro vale pro app.

### 0.2 Emendas às specs anteriores (registrar, não esconder)

| Regra anterior | Emenda |
|---|---|
| UX §3.1 item 7 / UI §4.g: card do Tutor no **fim** do transcript | Passa a: no modo leitura (lição reaberta), o card é a **capa** — 1º bloco do transcript, acima da questão. A correção é o desfecho-resumo da lição corrigida; quem reabre quer a nota de cara (feedback 1). Na tela de conclusão o card não renderiza no transcript — a nota mora no card de conclusão (§a). |
| UX §2.5 / UI §6.a: saídas da conclusão = Voltar ao tema + Próxima | Passa a: + **Refazer lição** (terceiro botão quieto — feedback 2). |
| UX §1.3 / UI §7.b: peek mostra "no máximo objetivo, estado da lição, anotações e editar" | Clarificação: a nota + acesso à correção fazem parte do **estado da lição** (registro, §0). Questão/pontos-chave/resposta seguem proibidos. |
| UI §8: fechar a sheet devolve o foco "ao card do Tutor no transcript" | Passa a: à superfície que a abriu (`tutorCardRef` — capa no modo leitura, "ver correção completa" na conclusão). |

---

## Pré-requisito — `fmtNota` compartilhado

`Licao.tsx` (hoje linha 28) tem `const fmtNota = (n: number) => n.toLocaleString("pt-BR");`.
**Mover** pra `web/src/lib/lesson.ts` (export nomeado, mesmo corpo, com o comentário
`// nota do Tutor formatada pt-BR — sempre em mono tabular no JSX`) e importar em `Licao.tsx`
e `Track.tsx`. Nada mais muda no helper.

---

## (a) Tela de conclusão (`justConcluded`) — nota presente + refazer ali mesmo

### a.1 O card do Tutor sai do transcript na conclusão

`Licao.tsx`, bloco `{complete && tutor && (` (hoje linhas 511–520): a condição passa a

```tsx
{complete && tutor && !justConcluded && (
```

e o bloco **muda de posição**: vira o **primeiro filho** do container do transcript
(`<div ref={topRef} …>`), **antes** do `Card` da questão-modelo (emenda §0.2 — capa do modo
leitura). Markup e classes do botão ficam **idênticos** aos atuais (nota xl + "correção do
Tutor" + veredito truncado + `ArrowRight`), incluindo o `ref={tutorCardRef}`.

### a.2 Slot do Tutor no card de conclusão: convite OU resultado

`Licao.tsx`, dentro do `Card` de conclusão (hoje linhas 529–533), o bloco `{!tutor && (…)}`
passa a um ternário — quando já corrigiu, a **nota é a protagonista do slot**:

```tsx
{tutor ? (
  <div className="mt-4">
    <p>
      <span className="font-mono text-4xl font-semibold leading-none tracking-[-0.02em] text-primary tabular-nums">{fmtNota(tutor.nota)}</span>
      <span className="font-mono text-xs text-muted-foreground">/10</span>
    </p>
    <p className="mx-auto mt-1.5 max-w-[40ch] text-sm text-muted-foreground text-balance">{tutor.veredito}</p>
    <button ref={tutorCardRef} onClick={openSheet} className={cn("mt-2 text-xs text-primary underline-offset-2 hover:underline", FOCUS)}>
      ver correção completa
    </button>
  </div>
) : (
  <div className="mt-4">{saldo ? <><TutorInvite onOpen={openSheet} />{counter}</> : exhausted}</div>
)}
```

- O fluxo vivido: concluiu → convite → abriu sheet → fechou → **o slot já mostra a nota**
  (mesmo `tutor` state, sem reload). Sem contador aqui — a correção já foi gasta.
- `tutorCardRef` nunca renderiza duplicado: a capa (§a.1) exige `!justConcluded`; este botão
  só existe em `justConcluded`. O `closeSheet` atual (foco no `tutorCardRef`) funciona pros dois.
- Hierarquia mantida: chip esmeralda + "Task concluída" + linha de método **antes** da nota —
  Done nunca é refém do Tutor (UX §2.5); a nota é o segundo ato, não o primeiro.

### a.3 Refazer na conclusão

`Licao.tsx`, linha das saídas (hoje 534–541): o `flex` ganha um **terceiro botão quieto**,
depois de "Próxima" — mesmo espécime do modo leitura (ícone `RefreshCw`, nunca `RotateCcw`):

```tsx
<button onClick={refazer} disabled={busy} className={cn("disabled:opacity-50", QUIET_BTN, FOCUS)}>
  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refazer lição
</button>
```

O handler `refazer` existente já cobre tudo (confirmação, arquivar resposta final + correção
nas anotações, `restart`, `setJustConcluded(false)`, foco no textarea). Zero lógica nova.
Ordem no row: `Voltar ao tema` · `Próxima: …` · `Refazer lição` (refazer é o gesto mais raro
do momento — fica por último, mas **presente**, que é o que faltava).

---

## (b) Lição reaberta (modo leitura)

**Com correção:** a capa (§a.1) é o 1º bloco — nota de cara, sem scroll; toque reabre a sheet.
O rodapé de ações (hoje linhas 545–552) fica como está: só "Refazer lição" (o convite já não
renderiza porque `!tutor` falha). O foco inicial continua no topo do transcript (`topRef`) —
que agora É a nota.

**Sem correção:** comportamento atual mantido, intocado — transcript puro (questão como 1º
bloco), rodapé com convite `TutorInvite` + contador (ou `exhausted`) + "Refazer lição". O
convite não vira capa: convite é **ação**, e ação mora no rodapé; capa é só pra **registro**.

**Deep-link da árvore (`?correcao=1`)** — suporte novo em `Licao.tsx`:

1. No effect de posicionamento inicial (hoje linhas 238–254), antes do `requestAnimationFrame`:
   ```tsx
   const wantsSheet = new URLSearchParams(window.location.search).get("correcao") === "1";
   ```
   e dentro do RAF, no ramo `if (st >= m)`:
   ```tsx
   if (st >= m) { if (wantsSheet && t.tutor) { setSheet(true); return; } topRef.current?.focus(); return; }
   ```
   (só abre se a correção **existe** — o link da árvore só aparece quando existe; nunca
   dispara `requestTutor` sozinho.)
2. No `closeSheet` (hoje linhas 325–328), limpar o parâmetro pra refresh não reabrir a sheet:
   ```tsx
   if (window.location.search) window.history.replaceState({}, "", window.location.pathname);
   ```
   (primeira linha do handler; o resto fica igual.)

Nenhuma mudança em `App.tsx`: `parseRoute` lê só `pathname`; o `navigate` com query funciona
como está.

---

## (c) TaskRow (`Track.tsx`) — badge de nota na row

Anchor: dentro do botão da row, **logo após** a pill `inProgress` (hoje linhas 178–180) e
**antes** da GraduationCap de dominada (linha 181):

```tsx
{task.tutor && (
  <span
    title={`correção do Tutor: ${fmtNota(task.tutor.nota)}/10`}
    className="inline-flex h-[18px] shrink-0 items-center rounded-[5px] border border-primary/25 bg-primary/5 px-1.5 font-mono text-[10px] tabular-nums text-primary"
  >
    {fmtNota(task.tutor.nota)}/10
  </span>
)}
```

- Condição é só `task.tutor` — corrigida implica lição completa; após refazer o server apaga
  a correção e o badge some sozinho (o registro fica nas anotações, como já acontece).
- Sem ícone (regra §0.1). Convive com a GraduationCap esmeralda (dominada) e o contador de
  anotações na mesma row, cada um com um significado.
- Task concluída **sem** correção: nenhuma marca nova — a ausência do badge é o sinal
  (feedback 3 pede distinguir; presença/ausência distingue).

---

## (d) TaskPeek (`Track.tsx`) — nota no estado + acesso à correção

### d.1 Props e plumbing

`TaskPeek` (hoje linha 62) ganha `onCorrection: () => void`. No `TaskRow` (hoje linha 199):

```tsx
<TaskPeek task={task} meName={meName} onStudy={goLesson}
  onCorrection={() => navigate(`/t/${encodeURIComponent(trackId)}/l/${encodeURIComponent(task.id)}?correcao=1`)}
  onComment={addC} onDeleteComment={delC} />
```

### d.2 Bloco de estado da lição

No container esquerdo do bloco de estado (hoje linha 73), trocar
`flex min-w-0 items-center gap-2` por `flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1`
(a nota + link precisam quebrar linha no mobile sem empurrar o CTA).

O ramo `concluded` (hoje linhas 77–78) passa a:

```tsx
) : concluded ? (
  <>
    <span>concluída{concludedAt && <> em <span className="font-mono tabular-nums">{shortDate(concludedAt)}</span></>}</span>
    {task.tutor && (
      <>
        <span aria-hidden="true">·</span>
        <span className="font-medium text-primary">Tutor <span className="font-mono tabular-nums">{fmtNota(task.tutor.nota)}/10</span></span>
        <button onClick={onCorrection} className={cn("text-primary underline-offset-2 hover:underline", FOCUS)}>ver correção</button>
      </>
    )}
  </>
) : (
```

- **Com correção:** "concluída em 12/07 · Tutor **8/10** — ver correção". O link abre a Lição
  com a sheet já aberta (deep-link §b) — 1 toque da árvore até a correção completa.
- **Sem correção (concluída):** linha atual intocada; o caminho pra corrigir continua sendo
  "Rever lição" (a árvore informa, a Lição ensina — o convite com contador de saldo é da
  Lição, que tem o `config`; a árvore não ganha estado de plano).
- **Não concluída / em andamento:** intocados.
- O CTA da direita ("Rever lição" / "Estudar" / "Continuar lição") não muda.

---

## (e) Microcopy nova (consolidação)

| Contexto | Texto |
|---|---|
| Conclusão, slot corrigido | `{nota}/10` + veredito + "ver correção completa" |
| Row, tooltip do badge | "correção do Tutor: {nota}/10" |
| Peek, estado corrigido | "concluída em {data} · Tutor {nota}/10" + "ver correção" |

Tudo minúsculas exceto "Tutor" (nome próprio da feature) e inícios já capitalizados do padrão
vigente; zero exclamação; nota **sempre** `font-mono tabular-nums`.

---

## (f) Checklist de aceite (os 5 estados do brief)

- [ ] **(a) Conclusão após correção:** fechar a sheet devolve à tela de conclusão mostrando
  nota 4xl violeta mono + veredito + "ver correção completa" no lugar do convite; a linha de
  saídas tem "Refazer lição" funcionando (arquiva nas anotações, reinicia, foco no textarea)
  sem sair da rota. O card §4.g **não** aparece duplicado no transcript.
- [ ] **(b) Reaberta com correção:** o 1º bloco visível da Lição é o card da nota (capa), antes
  da questão; toque nele abre a sheet; `?correcao=1` vindo da árvore abre a sheet direto e o X
  da sheet limpa o parâmetro (refresh não reabre).
- [ ] **(c) Reaberta sem correção:** idêntica a hoje — questão como 1º bloco, convite +
  contador (ou esgotado) + Refazer no rodapé; nenhum resquício de nota em lugar nenhum.
- [ ] **(d) TaskRow:** task corrigida mostra o badge contornado `8/10` violeta mono; task
  concluída sem correção não mostra nada novo; badge nunca coexiste com a pill `2/3`;
  GraduationCap esmeralda segue significando só "dominada"; após refazer, o badge some.
- [ ] **(e) TaskPeek:** corrigida = "concluída em {data} · Tutor 8/10 · ver correção" (link
  leva à sheet em 1 toque); sem correção = linha atual; nenhum conteúdo pedagógico novo no
  peek (questão/pontos-chave/resposta seguem só na Lição).
- [ ] **Tinta e tipografia:** toda nota em `font-mono tabular-nums`; violeta (`primary`) é a
  única cor do Tutor; nenhum GraduationCap novo na árvore; nenhum token novo.
