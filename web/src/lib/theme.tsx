import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
const KEY = "tv2-theme";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

// sem escolha salva, segue o tema do aparelho. No app isso importa além do gosto: as barras
// do sistema (status e botões) são cor fixa do build, com variante clara/escura escolhida
// pelo Android conforme o modo do celular — se o app ignorasse esse modo, elas destoariam
// do fundo. Quem tocar no botão de tema passa a mandar (a escolha fica salva).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const salvo = localStorage.getItem(KEY) as Theme | null;
    if (salvo === "dark" || salvo === "light") return salvo;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
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
  const toggle = () => setTheme((t) => {
    const proximo = t === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, proximo); // só grava quando a escolha é do usuário
    return proximo;
  });
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
