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

// moldura dos e-mails transacionais (spec: docs/DESIGN-AUTH-EMAIL.md §A3)
// tudo inline, sem SVG/webfont/imagem externa — sobrevive a Gmail claro e dark
const F_SANS = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const F_MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function emailShell({ preheader = "", eyebrow = "", title, bodyHtml, footnoteHtml = "" }) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2eff8;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2eff8;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;width:100%;font-family:${F_SANS};">
  <!-- header: wordmark tipográfica -->
  <tr><td style="padding:0 6px 14px;">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#231c39;">Fixa</span><span style="display:inline-block;width:7px;height:7px;margin-left:3px;border-radius:7px;background:#f4b740;"></span>
  </td></tr>
  <!-- card -->
  <tr><td>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e3ddef;border-radius:14px;border-collapse:separate;">
      <tr><td height="4" style="background:#6c47f0;border-radius:14px 14px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px;">
        ${eyebrow ? `<div style="font-family:${F_MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6285;margin:0 0 10px;">${eyebrow}</div>` : ""}
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#231c39;">${title}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
  </td></tr>
  <!-- rodapé -->
  <tr><td align="center" style="padding:16px 6px 0;">
    <div style="font-family:${F_MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8b83ab;">Fixa — aprenda de um jeito que fixa</div>
    ${footnoteHtml ? `<div style="font-size:12px;line-height:1.6;color:#8b83ab;margin-top:6px;">${footnoteHtml}</div>` : ""}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// CTA bulletproof (table-based) — usar dentro do bodyHtml
export function emailButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
    <td style="border-radius:10px;background:#6c47f0;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:${F_SANS};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
    </td></tr></table>`;
}
