import { NextResponse } from "next/server";
import { checkAccess } from "@/lib/access";
import { makeToken } from "@/lib/session";
import { sendLoginEmail } from "@/lib/mail";
import { underLimit } from "@/lib/store";
import { bfActivo, CATALOGO, LANDING_BF } from "@/lib/config";

export async function POST(req: Request) {
  const { email: raw } = (await req.json().catch(() => ({}))) as { email?: string };
  const email = String(raw || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Escribe un email válido." }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  if (!(await underLimit(`login:${email}`, 5, 3600)) || !(await underLimit(`loginip:${ip}`, 20, 3600))) {
    return NextResponse.json({ error: "Demasiados intentos. Prueba de nuevo en una hora." }, { status: 429 });
  }

  const acc = await checkAccess(email);
  if (!acc.ok) {
    if (acc.motivo === "cerrado") {
      return NextResponse.json(
        { error: "Emma.exe ya se ha apagado: estuvo disponible hasta el 31 de diciembre para las compras de Black Friday." },
        { status: 403 },
      );
    }
    const bf = bfActivo();
    return NextResponse.json(
      {
        error:
          "Emma.exe solo se ejecuta con una compra de Black Friday. ¿Compraste con otro email? Prueba con ese. Si acabas de pagar, espera un par de minutos y vuelve a intentarlo.",
        link: bf
          ? { texto: "Ver lo que hay en Black Friday", url: LANDING_BF }
          : { texto: "Ver los cursos", url: CATALOGO },
      },
      { status: 404 },
    );
  }

  const token = await makeToken(email, "login", "30m");
  const origin = process.env.APP_URL || new URL(req.url).origin;
  await sendLoginEmail(email, `${origin}/entrar?t=${encodeURIComponent(token)}`);
  return NextResponse.json({ ok: true });
}
