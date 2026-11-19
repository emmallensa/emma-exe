import { NextResponse } from "next/server";
import { currentEmail, isAdmin } from "@/lib/session";
import { redis } from "@/lib/store";
import { compraBFWoo } from "@/lib/woo";

// Comprobación rápida de las conexiones (solo para Emma).
export async function GET() {
  const email = await currentEmail();
  if (!email || !isAdmin(email)) return NextResponse.json({ error: "login" }, { status: 401 });
  const out: Record<string, string> = {};
  try {
    const r = await fetch(`${process.env.KIT_API_BASE || "https://api.kit.com/v4"}/account`, {
      headers: { "X-Kit-Api-Key": process.env.KIT_API_KEY || "" },
      cache: "no-store",
    });
    out.kit = r.ok ? "ok" : `error ${r.status}`;
  } catch (e) {
    out.kit = `error ${(e as Error).message}`;
  }
  try {
    const base = process.env.WC_URL || "https://emmallensa.com";
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    const r = await fetch(`${base}/wp-json/wc/v3/orders?per_page=1`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });
    out.woocommerce = r.ok ? "ok" : `error ${r.status}`;
  } catch (e) {
    out.woocommerce = `error ${(e as Error).message}`;
  }
  // Lo mismo que hace el login cuando alguien no tiene la etiqueta: buscar un email en los pedidos del BF. Con el tiempo que tarda.
  try {
    const t0 = Date.now();
    const r = await compraBFWoo(email);
    out.woocommerce_busqueda_bf = r === null ? "no contesta" : `ok (${Date.now() - t0} ms)`;
  } catch (e) {
    out.woocommerce_busqueda_bf = `error ${(e as Error).message}`;
  }
  try {
    await redis().set("salud", Date.now(), { ex: 60 });
    out.base_de_datos = "ok";
  } catch (e) {
    out.base_de_datos = `error ${(e as Error).message}`;
  }
  out.anthropic = process.env.ANTHROPIC_API_KEY ? "clave puesta" : "falta la clave";
  out.resend = process.env.RESEND_API_KEY ? "clave puesta" : "falta la clave";
  return NextResponse.json(out);
}
