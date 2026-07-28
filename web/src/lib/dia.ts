// dia de calendário de São Paulo, espelho do spDay() do servidor (review-engine.js)
export const diaSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

// prova de que a dose de hoje foi feita — no modo retorno a fila nunca chega a zero (a dose é
// um recorte de 12), então o "dia fechado" precisa deste sinal. Vive por dispositivo de
// propósito: o que ele liga é um rótulo, não dado (DESIGN-ENGAJAMENTO §4.4).
const DOSE = "fx-dose-feita";
export const marcarDoseFeita = () => { try { localStorage.setItem(DOSE, diaSP()); } catch { /* sem storage */ } };
export const leuDoseFeita = () => { try { return localStorage.getItem(DOSE); } catch { return null; } };
