// Notificação do Fixa (DESIGN-PUSH.md). O service worker só é registrado em produção
// (main.tsx), então em dev o estado é sempre "sem-suporte" — é esperado.
import { pushSubscribe, pushUnsubscribe } from "./api";

export type EstadoPush = "sem-suporte" | "off" | "on" | "negado";

export const suportaPush = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// base64url → bytes, que é como o navegador quer a chave VAPID
const chaveBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const reg = () => navigator.serviceWorker.ready;

export async function estadoPush(): Promise<EstadoPush> {
  if (!suportaPush()) return "sem-suporte";
  if (Notification.permission === "denied") return "negado";
  if (Notification.permission !== "granted") return "off";
  const sub = await (await reg()).pushManager.getSubscription();
  return sub ? "on" : "off";
}

/**
 * Liga a notificação: pede a permissão (se ainda não foi pedida), inscreve o aparelho e
 * registra no servidor. Devolve o estado final — quem chama decide o que dizer.
 */
export async function ligarPush(chave: string): Promise<EstadoPush> {
  if (!suportaPush() || !chave) return "sem-suporte";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "negado" : "off";
  const r = await reg();
  const sub =
    (await r.pushManager.getSubscription()) ??
    (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(chave) }));
  await pushSubscribe(sub.endpoint);
  return "on";
}

export async function desligarPush(): Promise<EstadoPush> {
  if (!suportaPush()) return "sem-suporte";
  const sub = await (await reg()).pushManager.getSubscription();
  await pushUnsubscribe(sub?.endpoint);
  await sub?.unsubscribe();
  return Notification.permission === "denied" ? "negado" : "off";
}

/**
 * Reinstalou o app, trocou de aparelho, o navegador expirou a inscrição: o servidor fica com
 * uma lista que não toca ninguém. Se o aparelho tem permissão e inscrição mas o servidor não
 * sabe, reavisa — silencioso, sem pedir nada de novo.
 */
export async function sincronizarPush(chave: string, subsNoServidor: number) {
  if (!suportaPush() || !chave || Notification.permission !== "granted") return;
  try {
    const r = await reg();
    const sub = await r.pushManager.getSubscription();
    if (sub) { if (!subsNoServidor) await pushSubscribe(sub.endpoint); return; }
    const nova = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(chave) });
    await pushSubscribe(nova.endpoint);
  } catch { /* sem rede ou push indisponível: tenta de novo na próxima abertura */ }
}
