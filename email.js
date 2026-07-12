// E-mail transacional via Brevo (REST, sem dependência). Env-gated: sem BREVO_API_KEY,
// emailEnabled() = false e quem chama decide o fallback (o app segue funcionando).

// leitura LAZY: este módulo é importado antes do loadEnv() do server popular o process.env
const cfg = () => ({
  key: process.env.BREVO_API_KEY || "",
  from: process.env.EMAIL_FROM || "",
  name: process.env.EMAIL_FROM_NAME || "Fixa",
});

export const emailEnabled = () => { const c = cfg(); return Boolean(c.key && c.from); };

export async function sendEmail({ to, subject, html }) {
  if (!emailEnabled()) return { ok: false, reason: "e-mail não configurado" };
  const c = cfg();
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": c.key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: c.from, name: c.name },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error(`[email] brevo ${r.status}: ${body.slice(0, 200)}`);
    return { ok: false, reason: `brevo ${r.status}` };
  }
  return { ok: true };
}

// moldura mínima e neutra dos e-mails (inline, sem imagens externas)
export function emailShell(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f3fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1533">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4def3;border-radius:12px;padding:24px">
    <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em;margin-bottom:16px">Fixa</div>
    <div style="font-weight:600;font-size:16px;margin-bottom:8px">${title}</div>
    ${bodyHtml}
  </div>
  <div style="max-width:480px;margin:12px auto 0;font-size:11px;color:#8b83ab;text-align:center">aprenda de um jeito que fixa</div>
</body></html>`;
}
