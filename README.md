# Emma.exe · exe.emmallensa.com

Diagnóstico de negocio con la API de Claude. Regalo para las compras del Black Friday 2026 de Academia Diffuze (26-30 nov). Abierto hasta el 31 dic.

## Cómo funciona
1. Entra con su email → se comprueba que ha comprado en el BF → se le manda un enlace al correo (caduca en 30 min, un solo uso).
   - Acceso si en Kit tiene `compra black friday 2026` (25677681, la pone Make) o `acceso emmaexe` (25677938, para dar acceso a mano).
   - Si no, y hay clave de WooCommerce: pedido pagado del 26 al 30 nov con ese email de facturación (sin contar renovaciones de suscripción).
   - `hola@emmallensa.com` (ADMIN_EMAILS) siempre entra.
2. Chat con Claude (`claude-sonnet-5-5`): 4-6 preguntas, resumen para confirmar y diagnóstico con la herramienta `entregar_diagnostico`.
3. Pantalla final: perfil, lo que sabe / lo que supone, causa real, acción de la semana + prompt para copiar, vídeo del perfil y una recomendación.
4. Kit: etiqueta del perfil (`emmaexe ventas` 25677934, `marketing` 25677935, `mentalidad` 25677936, `productividad` 25677937) + `emmaexe diagnostico hecho` (25677746). Una regla de Kit saca a quien tiene esa etiqueta de la secuencia «Emma.exe · compradores Black Friday 2026» (2965167).

Límites: 20 mensajes por diagnóstico, 1 diagnóstico + rehacerlo 1 vez, 60 mensajes al día.

## Dónde se cambia cada cosa
- Instrucciones de Emma.exe: `lib/prompt.ts`.
- Perfiles, vídeos, etiquetas, fechas y límites: `lib/config.ts`.
- Lo que puede recomendar (cursos, piezas del BF, lista de espera): `lib/opciones.ts`. Nombre y enlace salen de ahí, nunca de la IA.

## Vídeos
Variables de entorno en Vercel con el enlace de Vimeo (vale `https://vimeo.com/123456789` o el de player). Vacío = «Vídeo en camino».
`VIDEO_VENTAS`, `VIDEO_MARKETING`, `VIDEO_MENTALIDAD`, `VIDEO_PRODUCTIVIDAD`. Tras cambiarlas, redeploy.

## Variables de entorno
Obligatorias: `ANTHROPIC_API_KEY`, `KIT_API_KEY` (v4), `RESEND_API_KEY`, `SESSION_SECRET` (32+ caracteres aleatorios), `KV_REST_API_URL` y `KV_REST_API_TOKEN` (integración Upstash Redis), `APP_URL=https://exe.emmallensa.com`.
Recomendadas: `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` (clave de WooCommerce de SOLO LECTURA: reserva por si Make falla y para no recomendar cursos ya comprados).
Opcionales: `ANTHROPIC_MODEL`, `MAIL_FROM` (por defecto `Emma Llensa <exe@emmallensa.com>`), `MAIL_REPLY_TO`, `ADMIN_EMAILS`, `ABIERTO_HASTA`, `TAG_COMPRA_BF`, `TAG_ACCESO`, `TAG_HECHO`, `WC_URL`.
