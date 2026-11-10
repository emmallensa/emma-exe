import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readToken, sessionCookie } from "@/lib/session";
import { redis } from "@/lib/store";

// POST from the /entrar page (a button), so email link scanners that prefetch GET links don't burn the token.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData();
  const t = String(form.get("t") || "");
  const email = await readToken(t, "login");
  const origin = process.env.APP_URL || url.origin;
  if (!email) return NextResponse.redirect(`${origin}/?e=caducado`, 303);

  // Single use: the first open consumes the link.
  const h = createHash("sha256").update(t).digest("hex");
  const fresh = await redis().set(`exeused:${h}`, 1, { nx: true, ex: 3600 });
  if (!fresh) return NextResponse.redirect(`${origin}/?e=usado`, 303);

  const res = NextResponse.redirect(`${origin}/`, 303);
  res.cookies.set(await sessionCookie(email));
  return res;
}
