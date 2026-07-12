import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CircleHelp, Gem, Layers, Library, LogOut, Moon, Plus, Sun } from "lucide-react";
import { ApiError, getMe, getReview, login, logout, signup, type Me } from "@/lib/api";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/useApi";
import { Home } from "@/screens/Home";
import { NewTheme } from "@/screens/NewTheme";
import { Track } from "@/screens/Track";
import { Review } from "@/screens/Review";
import { Ajuda } from "@/screens/Ajuda";
import { Pro } from "@/screens/Pro";

// anel de foco padrão de todo interativo do app (spec §3)
export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// marca Fixa: um "loop" que fecha (o ciclo do método) com o ponto de recall
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3a13 13 0 1 0 11.5 7" stroke="var(--primary)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="27" cy="6.5" r="3.6" fill="#f4b740" />
    </svg>
  );
}

type Route = { name: "home" } | { name: "novo" } | { name: "revisar" } | { name: "ajuda" } | { name: "pro" } | { name: "track"; id: string };
function parseRoute(): Route {
  const p = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (p === "novo") return { name: "novo" };
  if (p === "revisar") return { name: "revisar" };
  if (p === "ajuda") return { name: "ajuda" };
  if (p === "pro") return { name: "pro" };
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
  const dueCount = review?.due.length ?? 0;
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
            <NavBtn to="/" active={route.name === "home" || route.name === "track"}>Temas</NavBtn>
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
            <button onClick={onLogout} title="sair" className={`grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className={`mx-auto max-w-4xl px-4 pt-6 ${route.name === "revisar" ? "pb-6" : "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6"}`}>
        {route.name === "home" && <Home />}
        {route.name === "novo" && <NewTheme />}
        {route.name === "revisar" && <Review />}
        {route.name === "ajuda" && <Ajuda />}
        {route.name === "pro" && <Pro me={me} />}
        {route.name === "track" && <Track id={route.id} me={me} />}
      </main>
      {/* bottom tab bar mobile — some em /revisar (o dock do player é dono do fundo) */}
      {route.name !== "revisar" && (
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

function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const canSubmit = mode === "login" ? email.trim() && pass : name.trim() && email.trim() && pass.length >= 6;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      onLogin(mode === "login" ? await login(email, pass) : await signup(name, email, pass));
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "algo deu errado — tenta de novo");
    } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-full place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><Logo size={22} /> Fixa</div>
        <p className="text-xs text-muted-foreground">{mode === "login" ? "Entre pra continuar estudando." : "Crie sua conta — leva 10 segundos."}</p>
        {mode === "signup" && (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="seu nome" className={inputCls} />
        )}
        <input type="email" autoFocus={mode === "login"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail" className={inputCls} />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder={mode === "signup" ? "senha (6+ caracteres)" : "senha"} className={inputCls} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={busy || !canSubmit} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {busy ? "…" : mode === "login" ? "entrar" : "criar conta"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "login" ? "não tem conta? criar agora" : "já tem conta? entrar"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => { getMe().then(setMe).catch(() => setMe(null)).finally(() => setBooting(false)); }, []);
  const doLogout = async () => { await logout().catch(() => {}); setMe(null); navigate("/"); };
  return (
    <ThemeProvider>
      {booting ? <div className="grid min-h-full place-items-center text-sm text-muted-foreground">carregando…</div>
        : me ? <Shell me={me} onLogout={doLogout} /> : <Login onLogin={setMe} />}
    </ThemeProvider>
  );
}
