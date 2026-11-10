import { Redis } from "@upstash/redis";
import type { Perfil } from "./config";

let client: Redis | null = null;

export function redis(): Redis {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Falta conectar la base de datos (Upstash Redis)");
  client = new Redis({ url, token });
  return client;
}

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type Diagnostico = {
  fecha: string;
  perfil: Perfil;
  frase_espejo: string;
  lo_que_se: string[];
  lo_que_supongo: string[];
  causa_real: string;
  accion_semana: string;
  prompt: string;
  herramienta: string;
  recomendacion: { id: string; nombre: string; url: string; por_que: string };
};

export type UserState = {
  email: string;
  nombre: string;
  chat: ChatMsg[];
  diagnosticos: Diagnostico[];
  cerrado?: boolean; // true cuando la conversación actual ya ha dado su diagnóstico
};

const key = (email: string) => `exe:${email.toLowerCase()}`;

export async function getUser(email: string): Promise<UserState | null> {
  return (await redis().get<UserState>(key(email))) ?? null;
}

export async function saveUser(u: UserState) {
  await redis().set(key(u.email), u);
}

/** Simple fixed-window counter. Returns true while under the limit. */
export async function underLimit(name: string, limit: number, windowSec: number) {
  const k = `rl:${name}`;
  const n = await redis().incr(k);
  if (n === 1) await redis().expire(k, windowSec);
  return n <= limit;
}
