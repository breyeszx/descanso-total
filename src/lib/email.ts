/**
 * Envío de correo transaccional con SendGrid (API REST v3).
 * Sin SENDGRID_API_KEY, en desarrollo se simula el envío (se registra en consola).
 */
export type Correo = { to: string; subject: string; html: string; text?: string };

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; error: string };

export async function enviarCorreo(c: Correo): Promise<ResultadoEnvio> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM ?? "reservas@descansototal.cl";
  const fromName = process.env.EMAIL_FROM_NAME ?? "Descanso Total";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") return { ok: false, error: "SENDGRID_API_KEY no configurada" };
    console.info(`[correo simulado] para=${c.to} asunto="${c.subject}"`);
    return { ok: true, id: "simulado" };
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: c.to }] }],
      from: { email: from, name: fromName },
      subject: c.subject,
      content: [
        { type: "text/plain", value: c.text ?? c.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() },
        { type: "text/html", value: c.html },
      ],
    }),
  });
  if (res.status === 202) return { ok: true, id: res.headers.get("x-message-id") ?? "sendgrid" };
  const body = await res.text().catch(() => "");
  return { ok: false, error: `SendGrid ${res.status}: ${body.slice(0, 300)}` };
}

/** Plantilla base en HTML con la identidad de Descanso Total. */
export function plantilla(titulo: string, cuerpoHtml: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
    <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#0f766e;color:#fff;padding:20px 24px;font-size:18px;font-weight:bold">Descanso Total</td></tr>
      <tr><td style="padding:24px"><h1 style="font-size:20px;margin:0 0 12px">${titulo}</h1>${cuerpoHtml}</td></tr>
      <tr><td style="padding:16px 24px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7">Descanso Total S.A. · Este correo se generó automáticamente, no respondas a esta dirección.</td></tr>
    </table>
  </td></tr></table></body></html>`;
}
