# Tema com ícone — escolher no header, propagar na Home (spec cirúrgica)

> **Origem:** pedido do dono (13/07): "configurar ícones para os temas — dentro do tema tem o
> iconezinho, deveria dar pra clicar e mostrar uma ampla variedade de icons pra escolher; e ele
> se propagar na Home, com os ícones para se localizar melhor".
> **Arquivos tocados:** `server.js`, `web/src/lib/api.ts`, `web/src/components/track-icon.tsx`
> (novo), `web/src/screens/Track.tsx`, `web/src/screens/Home.tsx`.
> Nenhum token novo; ícones lucide-react já instalados (tree-shaken — o set é curado e
> importado nominalmente, a lib inteira NUNCA entra no bundle).

---

## 0. Decisões de arquitetura (com racional)

1. **Persistência:** `track.icon` (string = nome kebab-case oficial do lucide, ex. `"atom"`).
   Ausente/`null` = default atual (`Target`) — zero migração, todo tema existente continua igual.
2. **Endpoint próprio `POST /api/track/icon`** — decidido pelo gesto: o picker **salva sozinho
   ao tocar** (manipulação direta: ícone é escolha visual de 1 toque, feedback imediato; não é
   formulário). Enfiar no `/rename` obrigaria a entrar no modo renomear pra trocar um ícone —
   gesto errado. O `/rename` fica intocado.
3. ~~**Picker = bloco inline expansível**~~ **SUPERSEDED (emenda §9):** o dono testou o inline
   e pediu modal. O picker agora é **sheet de tela cheia no idioma da `TutorSheet`** — o ÚNICO
   idioma de overlay do app (sem popover/dropdown novo, sem segundo idioma de painel+backdrop).
   Racional completo no §9.
4. **Tinta: violeta (`primary`) em todas as superfícies.** O ícone do tema é marca de
   identidade/atividade — mesma gramática dos chips 9×9 dos cards de ação da Home
   (`bg-primary/10 text-primary`). O mesmo tema tem a mesma cara em todo lugar; wayfinding se
   faz pela **forma** do ícone, a tinta é uma só.
5. **Onde entra / onde NÃO entra:**

| Superfície | Entra? | Racional |
|---|---|---|
| Header do tema (`Track.tsx`) | **Sim** — vira o botão do picker | é O lugar do gesto ("dentro do tema tem o iconezinho… clicar") |
| `ThemeCard` da Home | **Sim** — chip 9×9 à esquerda | o pedido literal: "se propagar na Home… para se localizar melhor" |
| `ContinueCard` da Home | **Sim** — substitui o `BookOpen` genérico | o chip já existe e já é violeta; mostrar o ícone DO tema que vai abrir é wayfinding de graça |
| Lixeira (`Trash`) | **Não** | linha utilitária compacta; título basta — ícone ali é ruído, não localização |
| `/revisar` (crumb do card) | **Não** | o player centra a questão; o crumb é deliberadamente quieto (mono muted) e o payload `Due` não carrega o tema inteiro — ícone ali = ruído + mudança de contrato à toa |
| Crumb da Lição | **Não** | mesmo racional do Revisar (crumb é texto mono quieto) |
| Export (`/api/export`) | **De graça** | exporta `ud.tracks` cru — o campo `icon` já vai junto, nada a fazer |

---

## 1. O set curado — 64 ícones lucide (lista NOMINAL, verificada no lucide-react instalado)

Regra de exclusão consciente: **glifos com significado de sistema no app ficam FORA do set**
pra não criar ambiguidade — `GraduationCap` (dominada), `FlaskConical` (task prática),
`RotateCcw` (Errei/revisão), `RefreshCw` (refazer), `Flame`/`Activity`/`Layers` (stat tiles),
`Eye`/`Check`/`X`/`Lightbulb`/`TriangleAlert`/`MessageSquare` (UI). O usuário nunca deve
escolher pro tema um símbolo que o app usa pra outra coisa.

Ordem do grid = a ordem abaixo (os clusters de domínio SÃO o agrupamento — sem headers de
categoria, sem busca: 64 células escaneáveis em ~8 linhas).

| Cluster | nomes lucide (kebab) → rótulo pt (aria-label/title) |
|---|---|
| Estudo geral (8) | `target` alvo · `book-open` livro aberto · `book-marked` livro marcado · `library` biblioteca · `notebook-pen` caderno · `brain` cérebro · `puzzle` quebra-cabeça · `blocks` blocos |
| Código/dados (8) | `code` código · `terminal` terminal · `braces` chaves · `database` banco de dados · `server` servidor · `cpu` processador · `bug` bug · `git-branch` branch |
| Ciência/mat (8) | `atom` átomo · `microscope` microscópio · `telescope` telescópio · `dna` DNA · `calculator` calculadora · `sigma` somatório · `chart-line` gráfico · `cloud` nuvem |
| Saúde (3) | `stethoscope` estetoscópio · `heart-pulse` batimentos · `pill` remédio |
| Direito/sociedade (5) | `scale` balança · `gavel` martelo do juiz · `landmark` instituição · `scroll-text` pergaminho · `shield` escudo |
| Finanças/negócios (4) | `briefcase` maleta · `coins` moedas · `banknote` cédula · `trending-up` alta |
| Idiomas/humanas (5) | `languages` idiomas · `globe` globo · `map` mapa · `compass` bússola · `hourglass` ampulheta |
| Artes/mídia (6) | `palette` paleta · `music` música · `guitar` violão · `camera` câmera · `film` filme · `drama` teatro |
| Esporte/fitness (4) | `dumbbell` halter · `bike` bicicleta · `trophy` troféu · `medal` medalha |
| Culinária (3) | `chef-hat` chapéu de chef · `utensils-crossed` talheres · `coffee` café |
| Natureza (4) | `mountain` montanha · `tree-pine` pinheiro · `sprout` broto · `paw-print` pata |
| Técnica/carreira (6) | `wrench` chave inglesa · `rocket` foguete · `zap` raio · `plane` avião · `car` carro · `award` prêmio |

`target` é o primeiro do set E o default (icon ausente) — o estado "sem escolha" e "escolhi o
alvo" são visualmente idênticos, de propósito: não existe estado "sem ícone".

---

## 2. Componente compartilhado — `web/src/components/track-icon.tsx` (NOVO)

```tsx
import {
  Atom, Award, Banknote, Bike, Blocks, BookMarked, BookOpen, Braces, Brain, Briefcase, Bug,
  Calculator, Camera, Car, ChartLine, ChefHat, Cloud, Code, Coffee, Coins, Compass, Cpu,
  Database, Dna, Drama, Dumbbell, Film, Gavel, GitBranch, Globe, Guitar, HeartPulse, Hourglass,
  Landmark, Languages, Library, Map, Medal, Microscope, Mountain, Music, NotebookPen, Palette,
  PawPrint, Pill, Plane, Puzzle, Rocket, Scale, ScrollText, Server, Shield, Sigma, Sprout,
  Stethoscope, Target, Telescope, Terminal, TreePine, TrendingUp, Trophy, UtensilsCrossed,
  Wrench, Zap, type LucideIcon,
} from "lucide-react";

// set curado de ícones de tema (DESIGN-TEMA-ICONE §1) — imports nominais: tree-shake garante
// que só estes 64 entram no bundle. Ordem = ordem do grid do picker (clusters de domínio).
export const TRACK_ICON_LIST: ReadonlyArray<readonly [string, LucideIcon, string]> = [
  ["target", Target, "alvo"], ["book-open", BookOpen, "livro aberto"], ["book-marked", BookMarked, "livro marcado"],
  ["library", Library, "biblioteca"], ["notebook-pen", NotebookPen, "caderno"], ["brain", Brain, "cérebro"],
  ["puzzle", Puzzle, "quebra-cabeça"], ["blocks", Blocks, "blocos"],
  ["code", Code, "código"], ["terminal", Terminal, "terminal"], ["braces", Braces, "chaves"],
  ["database", Database, "banco de dados"], ["server", Server, "servidor"], ["cpu", Cpu, "processador"],
  ["bug", Bug, "bug"], ["git-branch", GitBranch, "branch"],
  ["atom", Atom, "átomo"], ["microscope", Microscope, "microscópio"], ["telescope", Telescope, "telescópio"],
  ["dna", Dna, "DNA"], ["calculator", Calculator, "calculadora"], ["sigma", Sigma, "somatório"],
  ["chart-line", ChartLine, "gráfico"], ["cloud", Cloud, "nuvem"],
  ["stethoscope", Stethoscope, "estetoscópio"], ["heart-pulse", HeartPulse, "batimentos"], ["pill", Pill, "remédio"],
  ["scale", Scale, "balança"], ["gavel", Gavel, "martelo do juiz"], ["landmark", Landmark, "instituição"],
  ["scroll-text", ScrollText, "pergaminho"], ["shield", Shield, "escudo"],
  ["briefcase", Briefcase, "maleta"], ["coins", Coins, "moedas"], ["banknote", Banknote, "cédula"],
  ["trending-up", TrendingUp, "alta"],
  ["languages", Languages, "idiomas"], ["globe", Globe, "globo"], ["map", Map, "mapa"],
  ["compass", Compass, "bússola"], ["hourglass", Hourglass, "ampulheta"],
  ["palette", Palette, "paleta"], ["music", Music, "música"], ["guitar", Guitar, "violão"],
  ["camera", Camera, "câmera"], ["film", Film, "filme"], ["drama", Drama, "teatro"],
  ["dumbbell", Dumbbell, "halter"], ["bike", Bike, "bicicleta"], ["trophy", Trophy, "troféu"], ["medal", Medal, "medalha"],
  ["chef-hat", ChefHat, "chapéu de chef"], ["utensils-crossed", UtensilsCrossed, "talheres"], ["coffee", Coffee, "café"],
  ["mountain", Mountain, "montanha"], ["tree-pine", TreePine, "pinheiro"], ["sprout", Sprout, "broto"], ["paw-print", PawPrint, "pata"],
  ["wrench", Wrench, "chave inglesa"], ["rocket", Rocket, "foguete"], ["zap", Zap, "raio"],
  ["plane", Plane, "avião"], ["car", Car, "carro"], ["award", Award, "prêmio"],
];

const MAP = new Map(TRACK_ICON_LIST.map(([name, Icon]) => [name, Icon]));

// ícone do tema com fallback: nome desconhecido/ausente/null → Target (default histórico)
export function TrackIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && MAP.get(name)) || Target;
  return <Icon className={className} aria-hidden="true" />;
}
```

---

## 3. Server (`server.js`)

### 3.a Whitelist (constante, perto do `REVIEW_LADDER`)

```js
// set curado de ícones de tema — DEVE espelhar TRACK_ICON_LIST do front (docs/DESIGN-TEMA-ICONE §1)
const TRACK_ICONS = new Set(["target","book-open","book-marked","library","notebook-pen","brain","puzzle","blocks","code","terminal","braces","database","server","cpu","bug","git-branch","atom","microscope","telescope","dna","calculator","sigma","chart-line","cloud","stethoscope","heart-pulse","pill","scale","gavel","landmark","scroll-text","shield","briefcase","coins","banknote","trending-up","languages","globe","map","compass","hourglass","palette","music","guitar","camera","film","drama","dumbbell","bike","trophy","medal","chef-hat","utensils-crossed","coffee","mountain","tree-pine","sprout","paw-print","wrench","rocket","zap","plane","car","award"]);
```

### 3.b Rota nova (logo após `/api/track/rename`, hoje linhas 660–667)

```js
if (path === "/api/track/icon" && req.method === "POST") {
  const { id, icon } = await readBody(req);
  if (!ud.tracks[id]) return json(res, 404, { error: "tema não encontrado" });
  if (icon == null) delete ud.tracks[id].icon; // volta ao padrão
  else if (typeof icon === "string" && TRACK_ICONS.has(icon)) ud.tracks[id].icon = icon;
  else return json(res, 400, { error: "ícone fora do catálogo" });
  await saveU(me.id, "tracks");
  return json(res, 200, { ok: true });
}
```

### 3.c Serializers

- `trackData` (return, hoje linha 298): adicionar `icon: track.icon ?? null,` ao objeto.
- `trackSummary` (return, hoje linha 302): adicionar `icon: t.icon,` (herda do `trackData`).

---

## 4. API client (`web/src/lib/api.ts`)

- `TrackSummary` (hoje linha 31): adicionar `icon: string | null;`.
- `Track` (hoje linha 63): adicionar `icon: string | null;`.
- Após `renameTrack` (hoje linha 83):

```ts
export const setTrackIcon = (id: string, icon: string | null) => api.post("/api/track/icon", { id, icon });
```

---

## 5. Header do tema (`Track.tsx`) — o gesto

### 5.a O ícone vira botão do picker

Anchor: `<Target className="h-5 w-5 text-primary" />` (hoje linha 349, dentro do Card do
título). Substituir por:

```tsx
<button
  onClick={() => setPicking(!picking)}
  aria-expanded={picking}
  aria-label="escolher ícone do tema"
  title="escolher ícone do tema"
  className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/15", FOCUS)}
>
  <TrackIcon name={data.icon} className="h-5 w-5" />
</button>
```

(estado novo no `Track`: `const [picking, setPicking] = useState(false);` ao lado de
`renaming`, hoje linha 334. O chip 9×9 dá affordance de clique — mesmo espécime dos chips da
Home — e o alvo de toque sobe de 20px pra 36px. Import: `Target` sai do lucide import da linha
2 se ficar sem uso; entram `TrackIcon` e, no picker, `TRACK_ICON_LIST` + `setTrackIcon`.)

### 5.b O picker inline — **SUPERSEDED pela emenda §9 (13/07)**

> O dono usou esta versão no ar e pediu modal ("preferia que abrisse modal do que expandisse
> sessão"). **Não implementar o bloco abaixo** — vale o §9. O texto original fica como
> histórico da decisão; as regras de conteúdo (grid, células, selecionado, salvar-ao-tocar,
> erro) migraram pro §9 com o container novo.

Renderiza dentro do Card do header, na linha do `RenameBlock` (hoje linha 356) — mesmo padrão:

```tsx
{picking && <IconPicker track={data} onChanged={changed} onClose={() => setPicking(false)} />}
```

Componente novo no próprio `Track.tsx` (não é reusado em outra tela):

```tsx
/* picker de ícone do tema (DESIGN-TEMA-ICONE §5.b): grid inline, salva sozinho ao tocar */
function IconPicker({ track, onChanged, onClose }: { track: TrackData; onChanged: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const current = track.icon ?? "target";
  const pick = async (name: string) => {
    if (busy) return;
    setBusy(name);
    try { await setTrackIcon(track.id, name); onChanged(); onClose(); } finally { setBusy(null); }
  };
  return (
    <div className="mt-2 rounded-lg border border-border bg-background p-3">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">ícone do tema</p>
      <div className="grid grid-cols-6 justify-items-center gap-1.5 sm:grid-cols-8">
        {TRACK_ICON_LIST.map(([name, Icon, label]) => (
          <button
            key={name}
            onClick={() => pick(name)}
            disabled={!!busy}
            aria-label={label}
            aria-pressed={name === current}
            title={label}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-lg border transition-colors disabled:opacity-50",
              name === current ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              FOCUS,
            )}
          >
            {busy === name ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Icon className="h-[18px] w-[18px]" />}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- **Toque:** células 40×40px (`h-10 w-10`) — acima do mínimo; grid 6 colunas no mobile
  (390px: 6×40 + gaps + padding cabem folgados), 8 no `sm:`.
- **Selecionado:** borda + tint violeta + `aria-pressed` — o default (`icon` null) marca
  `target` (não existe "nenhum selecionado").
- **Salvar = tocar:** `POST` → `onChanged()` (refetch do tema) → fecha. Sem botão "salvar",
  sem confirm. Durante o POST a célula tocada vira `Loader2` e o grid desabilita.
- **Erro de rede:** o `api.post` rejeita → célula volta ao normal (finally), picker aberto —
  tocar de novo é o retry. Sem banner: falha aqui é rara e o estado é auto-evidente.
- **Sem busca, sem categorias visíveis:** 64 células em ~8 linhas se escaneiam mais rápido do
  que se digita; a ordem por domínio agrupa sozinha.

---

## 6. Home (`Home.tsx`) — a propagação

### 6.a `ThemeCard` (hoje linhas 215–258)

No `<div className="flex items-start gap-3">` (hoje linha 223), inserir como **primeiro
filho** (antes do `<div className="min-w-0 flex-1">`):

```tsx
<span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
  <TrackIcon name={t.icon} className="h-[18px] w-[18px]" />
</span>
```

Mesmo chip 9×9 dos cards de ação da zona "hoje" — a Home inteira fala uma gramática só.
Decorativo (`aria-hidden` já vem do `TrackIcon`); o card continua sendo aberto pelo título.

### 6.b `ContinueCard` (hoje linhas 56–58)

O chip existente troca o `BookOpen` genérico pelo ícone do tema:

```tsx
<span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
  {next ? <TrackIcon name={next.icon} className="h-[18px] w-[18px]" /> : <Plus className="h-[18px] w-[18px]" />}
</span>
```

(`BookOpen` sai do import lucide da linha 3 de `Home.tsx` se ficar sem uso; entra
`TrackIcon`.) Fallback: tema sem ícone mostra `Target` — nunca volta pro `BookOpen`.

### 6.c Onde NÃO mexer

`Trash` (linhas 262–289), `EmptyState`, `StatTiles`, `Heatmap`, `ReviewCard`: intocados
(racional na tabela §0.5).

---

## 7. Microcopy (consolidação)

| Contexto | Texto |
|---|---|
| Botão do header (title/aria-label) | "escolher ícone do tema" |
| Eyebrow do picker | "ícone do tema" |
| Célula do grid (title/aria-label) | rótulo pt da tabela §1 (ex.: "átomo") |
| Erro 400 do server | "ícone fora do catálogo" |

---

## 8. Checklist de aceite

- [ ] **Gesto completo mobile (390px):** tocar no chip do header abre o grid inline (6
  colunas, células 40px, sem scroll horizontal); tocar num ícone mostra spinner na célula,
  salva, fecha o picker e o chip do header já exibe o novo ícone (refetch).
- [ ] **Propagação:** voltar pra Home mostra o mesmo ícone no `ThemeCard` do tema e, se ele
  for o próximo pendente, no `ContinueCard` (no lugar do `BookOpen`).
- [ ] **Default intacto:** tema sem `icon` (todos os existentes) renderiza `Target` em todas
  as superfícies — zero mudança visual pra quem não escolher; no picker, `target` aparece
  selecionado.
- [ ] **Server 400:** `POST /api/track/icon` com `icon: "banana"` (ou qualquer string fora do
  set) responde 400 `{ error: "ícone fora do catálogo" }` e não persiste nada; `icon: null`
  remove o campo (volta ao padrão); tema inexistente responde 404.
- [ ] **Paridade do set:** as 64 strings de `TRACK_ICONS` (server.js) e `TRACK_ICON_LIST`
  (track-icon.tsx) são idênticas (diff manual ou teste); nenhum glifo de sistema
  (`graduation-cap`, `flask-conical`, `rotate-ccw`, `refresh-cw`, `flame`, `eye`…) no set.
- [ ] **Bundle:** só os 64 imports nominais entram (nenhum `import * as icons` /
  `DynamicIcon` — isso puxaria a lib inteira e é regressão).
- [ ] **A11y:** botão do header com `aria-expanded` + label; células com `aria-pressed` e
  rótulo pt; `TrackIcon` decorativo (`aria-hidden`); anel `FOCUS` em chip e células; navegação
  por Tab percorre o grid na ordem visual.
- [ ] **Onde não aparece:** lixeira, crumb do `/revisar` e crumb da Lição continuam sem ícone
  de tema (decisão §0.5, não esquecimento).

> O item 1 deste checklist ("grid inline") foi superseded pela emenda §9 — vale o checklist §9.e.

---

## 9. EMENDA (13/07, pós-uso) — o picker vira MODAL (sheet de tela cheia)

**Feedback do dono, com o inline no ar:** "preferia que abrisse modal do que expandisse
sessão". Decisão dele — o §5.b perdeu. Esta emenda substitui **apenas o container** do picker;
gesto de abrir (chip §5.a), conteúdo do grid, salvar-ao-tocar, estado selecionado, tratamento
de erro e todo o resto da spec (§0–§4, §6–§8) permanecem.

### 9.a Decisão de idioma: exatamente a `TutorSheet` (sem segundo idioma de overlay)

O app tem UM idioma de overlay — a sheet de tela cheia da correção do Tutor
(`fixed inset-0 z-50 bg-background`, coluna `max-w-xl`, X no topo esquerdo, entrada
fade+slide-from-bottom). O picker usa **esse idioma, célula por célula** — não um painel
centrado com backdrop: (1) introduzir um segundo idioma de overlay tem custo de sistema que um
picker não paga; (2) mobile-first, tela cheia é o que um painel centrado vira de qualquer
jeito em 390px; (3) sem teclado envolvido e com 64 células, a tela cheia dá ar pro grid
respirar (células sobem pra 44px); (4) zero mecânica nova de backdrop/scroll-lock — a sheet
cobre tudo, tab bar inclusive (`z-50`), igualzinho à correção. No desktop a coluna `max-w-xl`
centrada mantém a composição.

### 9.b Anatomia do `IconPicker` (versão final — substitui o componente do §5.b)

Continua componente local do `Track.tsx`; muda o container e ganha foco/Esc:

```tsx
/* picker de ícone do tema (DESIGN-TEMA-ICONE §9): sheet de tela cheia no idioma da TutorSheet;
   salva sozinho ao tocar e fecha; X/Esc fecham sem trocar */
function IconPicker({ track, onChanged, onClose }: { track: TrackData; onChanged: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const currentRef = useRef<HTMLButtonElement>(null);
  const current = track.icon ?? "target";
  useEffect(() => { currentRef.current?.focus(); }, []); // entra com foco na célula selecionada
  const pick = async (name: string) => {
    if (busy) return;
    setBusy(name);
    try { await setTrackIcon(track.id, name); onChanged(); onClose(); } finally { setBusy(null); }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="escolher ícone do tema"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
    >
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-4">
        <div className="flex items-center gap-2">
          <button onClick={onClose} aria-label="fechar sem trocar" title="fechar sem trocar" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", FOCUS)}>
            <X className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">ícone do tema · {track.title}</p>
        </div>
        <div className="mt-6 grid grid-cols-6 justify-items-center gap-2 sm:grid-cols-8">
          {TRACK_ICON_LIST.map(([name, Icon, label]) => (
            <button
              key={name}
              ref={name === current ? currentRef : undefined}
              onClick={() => pick(name)}
              disabled={!!busy}
              aria-label={label}
              aria-pressed={name === current}
              title={label}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-lg border transition-colors disabled:opacity-50",
                name === current ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                FOCUS,
              )}
            >
              {busy === name ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Diferenças deliberadas vs §5.b: células **44×44px** (`h-11 w-11`, ícone `h-5 w-5`) — a tela
cheia paga o upgrade de toque; `gap-2`; colunas iguais (6 mobile / 8 `sm:` — em 390px,
6×44 + gaps + `px-4` cabem com folga). `X` e `Loader2` já estão no import lucide do `Track.tsx`
(`X` entra se ainda não estiver); `useEffect`/`useRef` entram no import react da linha 1.

### 9.c Abrir, fechar, foco

- **Abrir:** mesmo chip do header (§5.a), com um ajuste de aria: trocar `aria-expanded={picking}`
  por **`aria-haspopup="dialog"`** (abre diálogo, não expande seção). O chip ganha
  `ref={chipRef}` (`const chipRef = useRef<HTMLButtonElement>(null);` no `Track`).
- **Render:** `{picking && <IconPicker track={data} onChanged={changed} onClose={closePicker} />}`
  sai do Card do header e vai pro **fim do root** do `Track` (`<div className="space-y-4">`,
  hoje linha 345) — é `fixed`, não participa do layout; longe do Card evita re-render confuso.
- **Fechar sem trocar:** X do topo **ou Esc** (`onKeyDown` no dialog — o foco está sempre
  dentro dele, o evento borbulha). **Não existe "tocar fora"**: a sheet é tela cheia, não há
  fora — mesma regra da TutorSheet.
- **Fechar salvando:** tocar numa célula → spinner na célula → `POST` → `onChanged()` →
  `onClose()`. Sem botão salvar, sem confirm (regra §0.2 mantida).
- **Foco:** entra na **célula selecionada** (`currentRef`, effect no mount); ao fechar
  (qualquer via), volta pro chip do header:
  ```tsx
  const closePicker = () => { setPicking(false); requestAnimationFrame(() => chipRef.current?.focus()); };
  ```
  — mesmo padrão do `closeSheet` da Lição. Após salvar, o chip focado já mostra o ícone novo
  (feedback do gesto completo).
- Sem scroll-lock do body (paridade com a TutorSheet — a sheet cobre tudo, `overflow-y-auto`
  próprio pro grid em telas baixas).
- Opcional recomendado (fora do escopo, 1 linha): a `TutorSheet` ganhar o mesmo `onKeyDown`
  de Esc, pra paridade total do idioma.

### 9.d Nota de contexto — ícone escolhido pela geração por IA

O dono também pediu que a geração por IA escolha um ícone do catálogo automaticamente (campo
`icon` no JSON gerado). **Fora do escopo desta spec** (implementação do coordenador), mas a
porta já existe e é uma só: a whitelist `TRACK_ICONS` do §3.a valida qualquer origem — gerado
fora do set = trata como ausente (default `target`), nunca 500. O picker deste doc é e continua
sendo o **override manual**.

### 9.e Checklist da emenda (substitui o item 1 do §8)

- [ ] **Gesto mobile (390px):** tocar no chip abre a sheet de tela cheia (fade+slide, tab bar
  coberta); grid 6 colunas, células 44px, sem scroll horizontal; tocar num ícone mostra
  spinner, salva, fecha e o foco volta pro chip já com o ícone novo.
- [ ] **Fechar sem trocar:** X e Esc fecham sem POST; não há backdrop parcial nem "tocar fora".
- [ ] **Foco:** ao abrir, o foco está na célula selecionada (visível com anel `FOCUS`); Tab
  percorre X → células na ordem visual; ao fechar, foco no chip do header.
- [ ] **Idioma único:** lado a lado com a sheet do Tutor, mesmo container, mesmo X, mesma
  entrada — muda só o conteúdo; nenhum popover/painel centrado novo no app.
