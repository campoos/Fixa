import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BookOpen, LogOut, Moon, Plus, Sun } from "lucide-react";
import { getMe, getReview, login, logout, type Me } from "@/lib/api";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/useApi";
import { Home } from "@/screens/Home";
import { NewTheme } from "@/screens/NewTheme";
import { Track } from "@/screens/Track";
import { Review } from "@/screens/Review";

type Route = { name: "home" } | { name: "novo" } | { name: "revisar" } | { name: "track"; id: string };
function parseRoute(): Route {
  const p = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (p === "novo") return { name: "novo" };
  if (p === "revisar") return { name: "revisar" };
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
    <button onClick={toggle} title="tema" className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-accent">
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
  const { data: review } = useApi(getReview, [route.name]);
  const dueCount = review?.due.length ?? 0;
  const NavBtn = ({ to, active, children }: { to: string; active: boolean; children: ReactNode }) => (
    <button onClick={() => navigate(to)} className={`rounded-md px-3 py-1.5 text-sm transition ${active ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
      {children}
    </button>
  );
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <button onClick={() => navigate("/")} className="mr-2 flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-emerald-500" /> theme studies
          </button>
          <nav className="flex items-center gap-1">
            <NavBtn to="/" active={route.name === "home" || route.name === "track"}>Temas</NavBtn>
            <NavBtn to="/revisar" active={route.name === "revisar"}>
              Revisar{dueCount > 0 && <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-[11px] font-medium text-amber-500">{dueCount}</span>}
            </NavBtn>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("/novo")} className="hidden items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex">
              <Plus className="h-4 w-4" /> Novo tema
            </button>
            <button onClick={() => navigate("/novo")} className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground sm:hidden" title="Novo tema"><Plus className="h-4 w-4" /></button>
            <ThemeButton />
            <button onClick={onLogout} title="sair" className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-accent"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5">
        {route.name === "home" && <Home />}
        {route.name === "novo" && <NewTheme />}
        {route.name === "revisar" && <Review />}
        {route.name === "track" && <Track id={route.id} me={me} />}
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { onLogin(await login(pass)); } catch { setErr("senha inválida"); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-full place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-emerald-500" /> theme studies</div>
        <input type="password" autoFocus value={pass} onChange={(e) => setPass(e.target.value)} placeholder="senha" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={busy || !pass} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">entrar</button>
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
