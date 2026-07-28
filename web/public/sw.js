// Service worker do Fixa — mínimo de propósito.
// Regra: só cacheia o que é imutável (assets hasheados, marca, ícones).
// NUNCA cacheia /api/* nem navegação — a raiz muda conforme o cookie de sessão
// (deslogado vê a landing, logado vê o app), então HTML cacheado mentiria pro usuário.
const CACHE = "fixa-static-v1";
const IMUTAVEL = [/^\/assets\//, /^\/brand\//, /^\/icons\//, /^\/favicon\.svg$/, /^\/apple-touch-icon\.png$/];

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixa — sem conexão</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#12101b;color:#efedf6;
font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;text-align:center}
h1{font-size:20px;margin:16px 0 8px}p{margin:0;color:#a9a4bd;max-width:32ch}
button{margin-top:24px;padding:12px 20px;border:0;border-radius:10px;background:#7C5CFC;color:#fff;font:inherit;font-weight:600}</style>
</head><body><div><img src="/icons/icon-192.png" width="72" height="72" alt="" style="border-radius:18px">
<h1>Sem conexão</h1><p>O Fixa precisa de internet pra carregar sua trilha. Assim que a rede voltar, é só recarregar.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/icons/icon-192.png"])).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---- push (DESIGN-PUSH.md) ----
// O servidor manda o toque sem payload; o conteúdo vem daqui, na hora de mostrar. Custa uma
// requisição e paga com verdade: se a fila foi fechada entre o disparo e a entrega, a
// notificação diz isso em vez de repetir um número velho.
const FALLBACK = { title: "Hora da revisão", body: "Abra o Fixa pra ver a fila de hoje.", url: "/revisar", tag: "fixa-dia" };

self.addEventListener("push", (e) => {
  e.waitUntil(
    fetch("/api/push/payload", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .catch(() => FALLBACK)
      .then((m) =>
        self.registration.showNotification(m.title || FALLBACK.title, {
          body: m.body || "",
          tag: m.tag || "fixa-dia", // mesma tag substitui: nunca empilha lembrete velho
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-96.png",
          lang: "pt-BR",
          data: { url: m.url || "/revisar" },
        })
      )
  );
});

// tocar na notificação: reaproveita a janela que já está aberta em vez de abrir outra
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = new URL(e.notification.data?.url || "/revisar", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) if (c.url.startsWith(self.location.origin) && "focus" in c) return c.navigate(alvo).then((x) => (x || c).focus());
      return self.clients.openWindow(alvo);
    })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // navegação: sempre rede; sem rede, tela de offline honesta
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
    );
    return;
  }

  if (!IMUTAVEL.some((re) => re.test(url.pathname))) return; // /api/* e o resto passam direto

  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return res;
      })
    )
  );
});
