import { useEffect, useRef } from "react";

// Um único WebSocket compartilhado pra app inteira (o servidor empurra mudanças).
// WS porque o cloudflared bufferiza SSE mas faz proxy de WebSocket nativo.
type Handler = (data: unknown) => void;
const handlers = new Map<string, Set<Handler>>();
let ws: WebSocket | null = null;
let reconnectMs = 1000;

function connect() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}/api/ws`);
  ws.onopen = () => {
    reconnectMs = 1000;
  };
  ws.onmessage = (e) => {
    let msg: { event?: string; data?: unknown } | null = null;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg?.event) handlers.get(msg.event)?.forEach((fn) => fn(msg!.data));
  };
  ws.onclose = () => {
    ws = null;
    // reconecta com backoff (até 15s)
    setTimeout(connect, reconnectMs);
    reconnectMs = Math.min(reconnectMs * 2, 15000);
  };
  ws.onerror = () => {
    try {
      ws?.close();
    } catch {
      /* ignora */
    }
  };
}
function ensure() {
  if (!ws) connect();
}
export function onStream(event: string, h: Handler): () => void {
  ensure();
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(h);
  return () => {
    handlers.get(event)?.delete(h);
  };
}

// hook: assina um evento do stream; o callback pode mudar de identidade sem re-assinar
export function useStream<T = unknown>(event: string, cb: (data: T) => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => onStream(event, (d) => ref.current(d as T)), [event]);
}
