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
    return NextResponse.json({ titulo: "Ese email no me cuadra.", error: "Revísalo, que igual se ha colado una letra." }, { status: 400 });
  }
  try {
    return await enviar(req, email);
  } catch (e) {
    console.error("login", e);
    return NextResponse.json(
      {
        titulo: "Emma.exe se ha colgado un momento.",
        error: "Sí, como los ordenadores de antes. Prueba otra vez en un minuto.",
      },
      { status: 500 },
    );
  }
}

async function enviar(req: Request, email: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  if (!(await underLimit(`login:${email}`, 5, 3600)) || !(await underLimit(`loginip:${ip}`, 20, 3600))) {
    return NextResponse.json(
      { titulo: "Demasiados intentos.", error: "Dale un respiro a Emma.exe y prueba de nuevo en una hora." },
      { status: 429 },
    );
  }
  const acc = await checkAccess(email);
  if (!acc.ok) {
    if (acc.motivo === "cerrado") {
      return NextResponse.json(
        {
          titulo: "Emma.exe ya se ha apagado.",
          error: "Estuvo encendida hasta el 31 de diciembre para las compras de Black Friday.",
        },
        { status: 403 },
      );
    }
    const bf = bfActivo();
    return NextResponse.json(
      {
        titulo: "¿Seguro que compraste con este email en el Black Friday?",
        error:
          "No encuentro ninguna compra con él. Prueba con el email que usaste al pagar. Y si acabas de comprar, dale un par de minutos y vuelve a intentarlo.",
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
