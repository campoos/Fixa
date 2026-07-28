import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
// o que o usuário escolheu — "auto" é ausência de escolha, não um terceiro tema
export type Modo = "auto" | "light" | "dark";
const KEY = "tv2-theme";

const ThemeCtx = createContext<{ theme: Theme; modo: Modo; toggle: () => void; setModo: (m: Modo) => void }>({
  theme: "dark",
  modo: "auto",
  toggle: () => {},
  setModo: () => {},
});

const modoSalvo = (): Modo => {
  const v = localStorage.getItem(KEY);
  return v === "dark" || v === "light" ? v : "auto";
};
const doAparelho = (): Theme => (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

// sem escolha salva, segue o tema do aparelho. No app isso importa além do gosto: as barras
// do sistema (status e botões) são cor fixa do build, com variante clara/escura escolhida
// pelo Android conforme o modo do celular — se o app ignorasse esse modo, elas destoariam
// do fundo. Quem escolher (no sol/lua do header ou em Ajuda › aparência) passa a mandar; voltar
// pro "automático" apaga a escolha e devolve o comando pro aparelho (DESIGN-ENGAJAMENTO §8.3).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModoState] = useState<Modo>(modoSalvo);
  const [theme, setTheme] = useState<Theme>(() => {
    const m = modoSalvo();
    return m === "auto" ? doAparelho() : m;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    // acompanha a barra de status do Chrome/PWA (no app instalado quem manda é o build)
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#12101b" : "#f8f7fb");
  }, [theme]);
  // enquanto não houver escolha salva, acompanha o aparelho trocando de modo com o app aberto
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => { if (!localStorage.getItem(KEY)) setTheme(mq.matches ? "light" : "dark"); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const setModo = (m: Modo) => {
    setModoState(m);
    if (m === "auto") { localStorage.removeItem(KEY); setTheme(doAparelho()); return; }
    localStorage.setItem(KEY, m); // só grava quando a escolha é do usuário
    setTheme(m);
  };
  const toggle = () => setModo(theme === "dark" ? "light" : "dark");
  return (
    <ThemeCtx.Provider value={{ theme, modo, toggle, setModo }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
