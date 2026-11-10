import { NextResponse } from "next/server";
import { currentEmail } from "@/lib/session";
import { cachedAccess } from "@/lib/access";
import { isAdmin } from "@/lib/session";
import { loadUser, usados } from "@/lib/member";
import { saveUser, underLimit, type Diagnostico } from "@/lib/store";
import { FIXED, FIRST_USER, variable, diagnosticoTool, opening } from "@/lib/prompt";
import { askClaude } from "@/lib/claude";
import { opcionesPara, opcionPorId } from "@/lib/opciones";
import { KIT_TAGS, LIMITES, PERFILES, type Perfil } from "@/lib/config";
import { tagByEmail } from "@/lib/kit";

export const maxDuration = 60;

type ToolInput = {
  perfil: Perfil;
  frase_espejo: string;
  lo_que_se: string[];
  lo_que_supongo?: string[];
  causa_real: string;
  accion_semana: string;
  prompt: string;
  herramienta: string;
  recomendacion_id: string;
  por_que: string;
  mensaje: string;
};

export async function POST(req: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });
  const acc = await cachedAccess(email);
  if (!acc.ok) return NextResponse.json({ error: "No tienes acceso a Emma.exe." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { message?: string; rehacer?: boolean };
  const u = await loadUser(email, acc.nombre);

  // Rehacer el diagnóstico (una vez).
  if (body.rehacer) {
    if (!u.cerrado) return NextResponse.json({ error: "Primero termina tu diagnóstico." }, { status: 403 });
    if (u.diagnosticos.length >= LIMITES.diagnosticos && !isAdmin(email)) {
      return NextResponse.json({ error: "Ya has rehecho tu diagnóstico. Este es el bueno." }, { status: 403 });
    }
    u.cerrado = false;
    u.chat = [
      { role: "user", content: FIRST_USER },
      { role: "assistant", content: opening(u.nombre, true) },
    ];
    await saveUser(u);
    return NextResponse.json({ chat: u.chat.slice(1), quedan: LIMITES.mensajesPorDiagnostico });
  }

  if (u.cerrado) return NextResponse.json({ error: "Tu diagnóstico ya está hecho. Lo tienes aquí abajo." }, { status: 403 });

  const message = String(body.message || "").trim().slice(0, 2000);
  if (!message) return NextResponse.json({ error: "Escribe tu respuesta." }, { status: 400 });
  const quedan = LIMITES.mensajesPorDiagnostico - usados(u);
  if (quedan <= 0) {
    return NextResponse.json({ error: "Hemos llegado al límite de mensajes de este diagnóstico." }, { status: 429 });
  }
  if (!(await underLimit(`chat:${email}`, LIMITES.mensajesPorDia, 86400))) {
    return NextResponse.json({ error: "Por hoy ya está. Vuelve mañana y seguimos." }, { status: 429 });
  }

  const opciones = opcionesPara(new Set(acc.compradas));
  u.chat.push({ role: "user", content: message });

  let reply: string;
  let diagnostico: Diagnostico | null = null;
  try {
    // Si es el último mensaje que le queda, forzamos el diagnóstico.
    const ultimo = quedan <= 1;
    const tools = [diagnosticoTool(opciones.map((o) => o.id))];
    const { text, tool } = await askClaude(
      FIXED,
      variable(u.nombre, opciones, quedan - 1) +
        (ultimo ? "\n\nEs su ÚLTIMO mensaje: entrega ya el diagnóstico con la herramienta, con lo que tengas." : ""),
      u.chat,
      tools,
    );
    if (tool?.name === "entregar_diagnostico") {
      const inp = tool.input as unknown as ToolInput;
      const op = opcionPorId(inp.recomendacion_id) ?? opcionPorId("diffuze_inside")!;
      const perfil: Perfil = inp.perfil in PERFILES ? inp.perfil : "ventas";
      diagnostico = {
        fecha: new Date().toISOString().slice(0, 10),
        perfil,
        frase_espejo: inp.frase_espejo,
        lo_que_se: inp.lo_que_se || [],
        lo_que_supongo: inp.lo_que_supongo || [],
        causa_real: inp.causa_real,
        accion_semana: inp.accion_semana,
        prompt: inp.prompt,
        herramienta: inp.herramienta,
        recomendacion: { id: op.id, nombre: op.nombre, url: op.url, por_que: inp.por_que },
      };
      u.diagnosticos = [...u.diagnosticos, diagnostico];
      u.cerrado = true;
      reply = inp.mensaje || "Diagnóstico listo. Lo tienes aquí abajo.";
      // Kit: etiqueta del perfil + "diagnóstico hecho" (una regla de Kit le saca de la secuencia del recordatorio).
      await Promise.all([tagByEmail(PERFILES[perfil].tagId, email), tagByEmail(KIT_TAGS.diagnosticoHecho, email)]);
    } else {
      reply = text || "¿Me lo cuentas con un poco más de detalle?";
    }
  } catch (e) {
    console.error(e);
    u.chat.pop();
    return NextResponse.json({ error: "Algo ha fallado al pensar tu respuesta. Prueba otra vez." }, { status: 502 });
  }

  u.chat.push({ role: "assistant", content: reply });
  await saveUser(u);
  const d = diagnostico;
  return NextResponse.json({
    reply,
    quedan: quedan - 1,
    diagnostico: d ? { ...d, titulo: PERFILES[d.perfil].titulo, video: PERFILES[d.perfil].video } : null,
    puedeRehacer: u.diagnosticos.length < LIMITES.diagnosticos || isAdmin(email),
  });
}

