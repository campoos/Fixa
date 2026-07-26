// Voltar do Android (DESIGN-APP-MODE §4).
//
// O app roteia por pathname + pushState, então o botão voltar do aparelho (e o gesto de
// borda) é o history.back() da WebView: voltar desfaz a última navegação e, quando não há
// o que desfazer, sai do app. Isso já cobre Home → sai, Track → Home, Licao → Track,
// Revisar → Home, sem código nenhum.
//
// O que não é navegação de rota — sheet do Tutor, modo edição, envio em curso, rascunho
// não salvo — precisa consumir um voltar antes de a rota mudar. Em vez de um handler
// global cheio de `if`s, cada camada efêmera empilha UMA entrada de histórico ao abrir e a
// consome ao fechar: o botão do Android e o gesto de borda passam a se comportar igual, e
// a ordem das camadas sai de graça (a última que abriu é a primeira a fechar).
//
// No navegador nada disso roda: quem tem botão de voltar próprio não quer o histórico
// sequestrado, e a web precisa ficar idêntica ao que era (§0 e §5.6).
import { useEffect, useRef } from "react";
import { isAppMode } from "./app-mode";

let seq = 0;
type EstadoCamada = { fxLayer?: number } | null;
const camadaAtual = () => (window.history.state as EstadoCamada)?.fxLayer;

/**
 * Enquanto `ativa`, um voltar do Android chama `aoVoltar()` em vez de sair da tela.
 *
 * `aoVoltar` pode ser um no-op quando a intenção é só ignorar o voltar (ex.: envio em
 * curso). Fechar pela UI também é tratado: a entrada empilhada é devolvida na limpeza,
 * sem deixar entrada morta no histórico.
 */
export function useBackLayer(ativa: boolean, aoVoltar: () => void) {
  const cb = useRef(aoVoltar);
  cb.current = aoVoltar;
  useEffect(() => {
    if (!ativa || !isAppMode) return;
    const id = ++seq;
    window.history.pushState({ fxLayer: id }, "");
    let fechadaPeloVoltar = false;
    const on = () => {
      if (camadaAtual() === id) return; // a nossa entrada continua de pé: o voltar era de uma camada acima
      fechadaPeloVoltar = true;
      cb.current();
    };
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("popstate", on);
      // fechou pela UI: devolve a entrada. Se a rota mudou por baixo, ela já não é nossa.
      if (!fechadaPeloVoltar && camadaAtual() === id) window.history.back();
    };
  }, [ativa]);
}

/**
 * Trabalho não persistido: enquanto `sujo`, o voltar pergunta antes de deixar a tela.
 *
 * Confirmar deixa o voltar seguir para a entrada de baixo; cancelar re-empilha a guarda e
 * a tela continua exatamente onde estava — a URL é a mesma nas duas entradas, então nada
 * pisca na tela durante o diálogo.
 */
export function useBackGuard(sujo: boolean, pergunta: string) {
  const texto = useRef(pergunta);
  texto.current = pergunta;
  useEffect(() => {
    if (!sujo || !isAppMode) return;
    const id = ++seq;
    const empilhar = () => window.history.pushState({ fxLayer: id }, "");
    empilhar();
    let saindo = false;
    const on = () => {
      if (saindo || camadaAtual() === id) return;
      if (window.confirm(texto.current)) { saindo = true; window.history.back(); }
      else empilhar();
    };
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("popstate", on);
      if (!saindo && camadaAtual() === id) window.history.back();
    };
  }, [sujo]);
}
