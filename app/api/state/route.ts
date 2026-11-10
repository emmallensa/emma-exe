import { NextResponse } from "next/server";
import { currentEmail } from "@/lib/session";
import { cachedAccess } from "@/lib/access";
import { isAdmin } from "@/lib/session";
import { loadUser, usados } from "@/lib/member";
import { LIMITES, PERFILES } from "@/lib/config";

export async function GET() {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "login" }, { status: 401 });
  const acc = await cachedAccess(email);
  if (!acc.ok) return NextResponse.json({ error: "sin-acceso" }, { status: 403 });
  const u = await loadUser(email, acc.nombre);
  const d = u.diagnosticos.at(-1) ?? null;
  return NextResponse.json({
    nombre: u.nombre,
    chat: u.chat.slice(1),
    diagnostico: d ? { ...d, titulo: PERFILES[d.perfil].titulo, video: PERFILES[d.perfil].video } : null,
    cerrado: !!u.cerrado,
    puedeRehacer: u.diagnosticos.length > 0 && (u.diagnosticos.length < LIMITES.diagnosticos || isAdmin(email)),
    quedan: Math.max(0, LIMITES.mensajesPorDiagnostico - usados(u)),
  });
}
