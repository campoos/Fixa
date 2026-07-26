// Modo app: o mesmo front roda dentro do app Android (TWA) em tela cheia.
// O que muda não é só estética — no app não existe landing de vendas e não pode
// existir CTA de compra (conteúdo digital no Android exige Google Play Billing).
//
// Detecção em 3 sinais, do mais confiável pro mais fraco:
//  1. a rota de entrada do app é /app (start_url do manifest) — só o app entra por lá;
//  2. o navegador reporta display-mode standalone (instalado na tela inicial);
//  3. o referrer é android-app:// (o TWA abre a Custom Tab a partir do app nativo);
//  4. lembrança da 1ª abertura, porque a navegação sai de /app e nunca mais volta.
const CHAVE = "fx-app";

function detectar(): boolean {
  if (typeof window === "undefined") return false;
  const entrouPeloApp = window.location.pathname.replace(/\/+$/, "") === "/app";
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS usa uma propriedade própria; não é alvo agora, mas custa uma linha
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const viaTwa = document.referrer.startsWith("android-app://");

  if (entrouPeloApp || standalone || viaTwa) {
    try { localStorage.setItem(CHAVE, "1"); } catch { /* modo privado */ }
    return true;
  }
  try { return localStorage.getItem(CHAVE) === "1"; } catch { return false; }
}

/** Constante da sessão: decidido uma vez na carga, não muda no meio do uso. */
export const isAppMode = detectar();

// o CSS decide sozinho a partir daqui (DESIGN-APP-MODE §0): nenhum componente
// precisa de prop nova pra saber que está dentro do app.
if (typeof document !== "undefined" && isAppMode) document.documentElement.dataset.app = "1";

/** Raiz segura: no app, "/" cairia na landing quando não há sessão. */
export const raiz = isAppMode ? "/app" : "/";
