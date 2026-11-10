export async function sendLoginEmail(to: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY");
  const from = process.env.MAIL_FROM || "Emma Llensa <exe@emmallensa.com>";
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px"><tr><td style="padding:0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1A1A1A">
<p>Hola,</p>
<p>Aquí tienes tu enlace para ejecutar Emma.exe:</p>
<p style="margin:28px 0"><a href="${link}" style="background:#0000AA;color:#ffffff;text-decoration:none;padding:14px 26px;font-weight:bold;display:inline-block;box-shadow:5px 5px 0 #E91E8C">Ejecutar Emma.exe &gt;</a></p>
<p style="color:#5C5C57;font-size:14px">El enlace caduca en 30 minutos y solo sirve una vez. Si no lo has pedido tú, ignora este correo.</p>
<p>Emma</p>
</td></tr></table></td></tr></table>`;
  const r = await fetch(`${process.env.RESEND_BASE_URL || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: process.env.MAIL_REPLY_TO || "hola@emmallensa.com",
      subject: "Tu enlace para ejecutar Emma.exe",
      html,
    }),
  });
  if (!r.ok) {
    console.error("Resend", r.status, await r.text());
    throw new Error("No se pudo enviar el correo");
  }
}
