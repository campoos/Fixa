import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CircleHelp, Eye, EyeOff, Gem, Layers, Library, Loader2, LogOut, Moon, Plus, Sun } from "lucide-react";
import { ApiError, forgotPass, getMe, getReview, login, logout, resetPass, signup, type Me } from "@/lib/api";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/useApi";
import { Home } from "@/screens/Home";
import { NewTheme } from "@/screens/NewTheme";
import { Track } from "@/screens/Track";
import { Licao } from "@/screens/Licao";
import { Review } from "@/screens/Review";
import { Ajuda } from "@/screens/Ajuda";
import { Pro } from "@/screens/Pro";

// anel de foco padrão de todo interativo do app (spec §3)
export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// campos das telas de auth (spec DESIGN-AUTH-EMAIL §B2.4)
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/25";
const INPUT_ERR = "border-destructive focus:border-destructive focus:ring-destructive/25";
const LABEL = "mb-1.5 block text-[13px] font-medium";

// marca Fixa: um "loop" que fecha (o ciclo do método) com o ponto de recall
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M26.83 14.09A11 11 0 1 1 17.91 5.17" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="23.78" cy="8.22" r="3.2" fill="#F4B740" />
    </svg>
  );
}

type Route = { name: "home" } | { name: "novo" } | { name: "revisar" } | { name: "ajuda" } | { name: "pro" } | { name: "track"; id: string } | { name: "licao"; trackId: string; taskId: string } | { name: "redefinir" };
function parseRoute(): Route {
  const p = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (p === "novo") return { name: "novo" };
  if (p === "revisar") return { name: "revisar" };
  if (p === "ajuda") return { name: "ajuda" };
  if (p === "pro") return { name: "pro" };
  if (p === "redefinir") return { name: "redefinir" };
  // a Lição é rota própria (DESIGN-LICAO-UX §1.1) — checar antes de t/:id, que é prefixo dela
  const licao = p.match(/^t\/([^/]+)\/l\/(.+)$/);
  if (licao) return { name: "licao", trackId: decodeURIComponent(licao[1]), taskId: decodeURIComponent(licao[2]) };
  if (p.startsWith("t/")) return { name: "track", id: decodeURIComponent(p.slice(2)) };
  return { name: "home" };
}
export function navigate(path: string) {
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} title="tema" className={`grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Shell({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [route, setRoute] = useState<Route>(parseRoute);
  useEffect(() => {
    const on = () => setRoute(parseRoute());
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  const { data: review, refetch: refetchReview } = useApi(getReview, [route.name]);
  const dueCount = review?.session?.length ?? review?.due.length ?? 0; // ação = dose (FILA-RETORNO §3)
  // badge atualiza na hora quando uma revisão é avaliada (evento disparado pela tela Revisar)
  useEffect(() => {
    const on = () => refetchReview(true);
    window.addEventListener("fx-review-changed", on);
    return () => window.removeEventListener("fx-review-changed", on);
  }, [refetchReview]);
  const NavBtn = ({ to, active, children }: { to: string; active: boolean; children: ReactNode }) => (
    <button
      onClick={() => navigate(to)}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 items-center rounded-lg px-3 text-sm transition-colors ${active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"} ${FOCUS}`}
    >
      {children}
    </button>
  );
  // aba da bottom bar mobile (DESIGN-SHELL-MOBILE §3.2): célula inteira é o alvo; ativa = tinta violeta
  const TabBtn = ({ to, active, icon, label, badge }: { to: string; active: boolean; icon: ReactNode; label: string; badge?: number }) => (
    <button
      onClick={() => navigate(to)}
      aria-current={active ? "page" : undefined}
      aria-label={badge ? `${label}, ${badge} ${badge === 1 ? "pendente" : "pendentes"}` : label}
      className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-lg transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${FOCUS}`}
    >
      <span className="relative">
        {icon}
        {badge ? (
          <span aria-hidden="true" className="absolute -right-3.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-recall/15 px-1 font-mono text-[10px] tabular-nums text-recall">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <button onClick={() => navigate("/")} className={`mr-2 flex items-center gap-2 rounded-lg ${FOCUS}`}>
            <Logo />
            <span className="text-[17px] font-extrabold tracking-[-0.02em]">Fixa</span>
          </button>
          <nav aria-label="navegação" className="hidden items-center gap-1 md:flex">
            <NavBtn to="/" active={route.name === "home" || route.name === "track" || route.name === "licao"}>Temas</NavBtn>
            <NavBtn to="/revisar" active={route.name === "revisar"}>
              Revisar
              {dueCount > 0 && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-recall/15 px-1 font-mono text-[11px] tabular-nums text-recall">
                  {dueCount > 99 ? "99+" : dueCount}
                </span>
              )}
            </NavBtn>
            <NavBtn to="/ajuda" active={route.name === "ajuda"}>Ajuda</NavBtn>
            <NavBtn to="/pro" active={route.name === "pro"}>Pro</NavBtn>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("/novo")} className={`hidden h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex ${FOCUS}`}>
              <Plus className="h-4 w-4" /> Novo tema
            </button>
            <button onClick={() => navigate("/novo")} className={`grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 sm:hidden ${FOCUS}`} title="Novo tema"><Plus className="h-4 w-4" /></button>
            <ThemeButton />
            <button onClick={onLogout} title="sair" aria-label="sair da conta" className={`grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className={`mx-auto max-w-4xl px-4 pt-6 ${route.name === "revisar" || route.name === "licao" ? "pb-6" : "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6"}`}>
        {(route.name === "home" || route.name === "redefinir") && <Home />}
        {route.name === "novo" && <NewTheme />}
        {route.name === "revisar" && <Review />}
        {route.name === "ajuda" && <Ajuda me={me} onLogout={onLogout} />}
        {route.name === "pro" && <Pro me={me} />}
        {route.name === "track" && <Track id={route.id} me={me} />}
        {route.name === "licao" && <Licao key={`${route.trackId}/${route.taskId}`} trackId={route.trackId} taskId={route.taskId} />}
      </main>
      {/* bottom tab bar mobile — some nos players /revisar e na Lição (o dock é dono do fundo — DESIGN-LICAO-UI §1.1) */}
      {route.name !== "revisar" && route.name !== "licao" && (
        <nav aria-label="navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
          <div className="mx-auto grid h-14 max-w-4xl grid-cols-4">
            <TabBtn to="/" active={route.name === "home" || route.name === "track"} icon={<Library className="h-5 w-5" />} label="Temas" />
            <TabBtn to="/revisar" active={false} icon={<Layers className="h-5 w-5" />} label="Revisar" badge={dueCount} />
            <TabBtn to="/ajuda" active={route.name === "ajuda"} icon={<CircleHelp className="h-5 w-5" />} label="Ajuda" />
            <TabBtn to="/pro" active={route.name === "pro"} icon={<Gem className="h-5 w-5" />} label="Pro" />
          </div>
        </nav>
      )}
    </div>
  );
}

/* ── telas de auth (spec DESIGN-AUTH-EMAIL.md parte B) ── */

// shell comum aos 4 modos (§B2.1/§B2.2): glow de marca + bloco de marca + card
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-4 py-10">
      {/* glow de marca — decorativo, some pra leitores de tela */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{ background: "radial-gradient(560px 280px at 50% -80px, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-[22px] font-extrabold tracking-[-0.03em]">Fixa</span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">aprenda de um jeito que fixa</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

// campo de senha com olho (§B2.4): toggle alterna o type, aria-label acompanha
function PasswordInput({ id, value, onChange, autoComplete, autoFocus = false, invalid = false }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••" autoComplete={autoComplete} autoFocus={autoFocus}
        className={`${INPUT} pr-10 ${invalid ? INPUT_ERR : ""}`}
      />
      <button
        type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "ocultar senha" : "mostrar senha"}
        className={`absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

// CTA primário (§B2.5): busy = spinner + palavra, nunca "…" solto
function AuthCta({ busy, disabled, busyLabel, label }: { busy: boolean; disabled: boolean; busyLabel: string; label: string }) {
  return (
    <button
      disabled={disabled}
      className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {busy ? busyLabel : label}
    </button>
  );
}

// alerta de erro de form (§B2.6) — mensagens da API já vêm em pt-BR
function FormAlert({ children }: { children: ReactNode }) {
  return <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] leading-snug text-destructive">{children}</div>;
}

// link de troca de modo no rodapé do card (§B3)
function ModeLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`font-medium text-primary underline-offset-2 hover:underline ${FOCUS}`}>{children}</button>;
}

type AuthMode = "login" | "signup" | "forgot";

const AUTH_COPY: Record<AuthMode, { h1: string; sub: string; cta: string; busy: string }> = {
  login: { h1: "Bom te ver de novo.", sub: "Entre pra continuar de onde parou.", cta: "Entrar", busy: "entrando…" },
  signup: { h1: "Crie sua conta.", sub: "Grátis pra começar — sem cartão.", cta: "Criar conta", busy: "criando conta…" },
  forgot: { h1: "Esqueceu a senha?", sub: "Digite seu e-mail — enviamos um link pra criar uma nova.", cta: "Enviar link", busy: "enviando…" },
};

function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  // ?m=cadastro|esqueci abre já no modo certo (§B4) — lido só na montagem
  const [mode, setMode] = useState<AuthMode>(() => {
    const m = new URLSearchParams(window.location.search).get("m");
    return m === "cadastro" ? "signup" : m === "esqueci" ? "forgot" : "login";
  });
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canSubmit = mode === "login" ? email.trim() && pass : mode === "forgot" ? email.trim() : name.trim() && email.trim() && pass.length >= 6;
  // troca de modo limpa erro/envio/senha e mantém o e-mail (§B5)
  const switchMode = (m: AuthMode) => { setMode(m); setErr(null); setSent(false); setPass(""); };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === "forgot") { await forgotPass(email); setSent(true); }
      else onLogin(mode === "login" ? await login(email, pass) : await signup(name, email, pass));
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "algo deu errado — tenta de novo");
    } finally { setBusy(false); }
  };
  const copy = AUTH_COPY[mode];
  const badCreds = mode === "login" && !!err; // no login, o culpado é o par e-mail+senha
  return (
    <AuthShell>
      <form onSubmit={submit} aria-labelledby="auth-title">
        {/* miolo com key={mode}: remonta (re-aplica autofocus) e anima a troca (§B5) */}
        <div key={mode} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
          <div className="mb-5">
            <h1 id="auth-title" className="text-[17px] font-semibold tracking-[-0.01em]">{copy.h1}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{copy.sub}</p>
          </div>
          {err && <FormAlert>{err}</FormAlert>}
          {mode === "forgot" && sent ? (
            <>
              {/* sucesso do esqueci substitui os campos (§B2.7) */}
              <div role="status" className="rounded-md border border-domain/30 bg-domain/10 px-3 py-2.5 text-[13px] leading-relaxed text-domain">
                Se existir conta com <strong className="font-semibold">{email}</strong>, o link chegou na sua caixa de entrada. Vale por 1 hora.
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Não chegou? Confira o spam ou <button type="button" onClick={() => setSent(false)} className={`underline underline-offset-2 hover:text-foreground ${FOCUS}`}>tentar com outro e-mail</button>.
              </p>
              <button type="button" onClick={() => switchMode("login")} className={`mt-5 h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`}>
                voltar pra entrar
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label htmlFor="name" className={LABEL}>Nome</label>
                    <input id="name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="como quer ser chamado" autoComplete="name" className={INPUT} />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className={LABEL}>E-mail</label>
                  <input
                    id="email" name="email" type="email" autoFocus={mode !== "signup"} value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"
                    className={`${INPUT} ${badCreds ? INPUT_ERR : ""}`}
                  />
                </div>
                {mode !== "forgot" && (
                  <div>
                    <div className={mode === "login" ? "flex items-baseline justify-between" : undefined}>
                      <label htmlFor="pass" className={LABEL}>Senha</label>
                      {mode === "login" && (
                        <button type="button" onClick={() => switchMode("forgot")} className={`text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline ${FOCUS}`}>
                          esqueci a senha
                        </button>
                      )}
                    </div>
                    <PasswordInput id="pass" value={pass} onChange={setPass} autoComplete={mode === "login" ? "current-password" : "new-password"} invalid={badCreds} />
                    {mode === "signup" && <p className="mt-1.5 text-xs text-muted-foreground">mínimo de 6 caracteres</p>}
                  </div>
                )}
              </div>
              <AuthCta busy={busy} disabled={busy || !canSubmit} busyLabel={copy.busy} label={copy.cta} />
            </>
          )}
        </div>
        <p className="mt-5 border-t border-border pt-4 text-center text-[13px] text-muted-foreground">
          {mode === "login" && <>Não tem conta? <ModeLink onClick={() => switchMode("signup")}>Criar conta</ModeLink></>}
          {mode === "signup" && <>Já tem conta? <ModeLink onClick={() => switchMode("login")}>Entrar</ModeLink></>}
          {mode === "forgot" && <>Lembrou a senha? <ModeLink onClick={() => switchMode("login")}>Voltar pra entrar</ModeLink></>}
        </p>
      </form>
    </AuthShell>
  );
}

function ResetScreen({ onLogin }: { onLogin: (me: Me) => void }) {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const me = await resetPass(token, pass);
      onLogin(me);
      navigate("/");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "algo deu errado — tenta de novo");
    } finally { setBusy(false); }
  };
  const tokenErr = !!err && err.includes("link inválido"); // resposta da API em §B4
  return (
    <AuthShell>
      <form onSubmit={submit} aria-labelledby="auth-title">
        <div className="mb-5">
          <h1 id="auth-title" className="text-[17px] font-semibold tracking-[-0.01em]">Crie sua nova senha.</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Ela vale a partir de agora, em todos os seus aparelhos.</p>
        </div>
        {err && <FormAlert>{err}</FormAlert>}
        <div className="space-y-4">
          <div>
            <label htmlFor="new-pass" className={LABEL}>Nova senha</label>
            <PasswordInput id="new-pass" value={pass} onChange={setPass} autoComplete="new-password" autoFocus />
            <p className="mt-1.5 text-xs text-muted-foreground">mínimo de 6 caracteres</p>
          </div>
        </div>
        <AuthCta busy={busy} disabled={busy || pass.length < 6} busyLabel="salvando…" label="Salvar e entrar" />
        {tokenErr && (
          <button type="button" onClick={() => navigate("/?m=esqueci")} className={`mt-2 h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`}>
            pedir um novo link
          </button>
        )}
      </form>
    </AuthShell>
  );
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [booting, setBooting] = useState(true);
  // deslogado ninguém escuta popstate (Shell não montou) — re-render pra "pedir um novo link" (§B4) sair de /redefinir
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  useEffect(() => { getMe().then(setMe).catch(() => setMe(null)).finally(() => setBooting(false)); }, []);
  const doLogout = async () => { await logout().catch(() => {}); setMe(null); navigate("/"); };
  return (
    <ThemeProvider>
      {booting ? <div className="grid min-h-full place-items-center text-sm text-muted-foreground">carregando…</div>
        : parseRoute().name === "redefinir" && !me ? <ResetScreen onLogin={setMe} />
        : me ? <Shell me={me} onLogout={doLogout} /> : <Login onLogin={setMe} />}
    </ThemeProvider>
  );
}
