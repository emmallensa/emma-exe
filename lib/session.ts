import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "emmaexe_sesion";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error("Falta SESSION_SECRET (mínimo 24 caracteres)");
  return new TextEncoder().encode(s);
}

export async function makeToken(email: string, purpose: "login" | "session", ttl: string) {
  return new SignJWT({ email: email.toLowerCase(), purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret());
}

export async function readToken(token: string, purpose: "login" | "session") {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== purpose || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

export async function sessionCookie(email: string) {
  const token = await makeToken(email, "session", "30d");
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function currentEmail(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  return t ? readToken(t, "session") : null;
}

export function isAdmin(email: string) {
  const list = (process.env.ADMIN_EMAILS || "hola@emmallensa.com").toLowerCase().split(",").map((s) => s.trim());
  return list.includes(email.toLowerCase());
}
