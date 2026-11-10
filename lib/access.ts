import { findSubscriber, subscriberTags } from "./kit";
import { infoWoo } from "./woo";
import { isAdmin } from "./session";
import { ABIERTO_HASTA, KIT_TAGS } from "./config";
import { redis } from "./store";

export type Access = {
  ok: boolean;
  motivo?: "no-comprador" | "cerrado";
  nombre: string;
  compradas: number[];
};

export async function checkAccess(email: string): Promise<Access> {
  const sub = await findSubscriber(email).catch(() => null);
  const nombre = sub?.first_name || "";
  const woo = await infoWoo(email);
  const compradas = woo ? [...woo.productos] : [];
  if (isAdmin(email)) return { ok: true, nombre, compradas };
  if (new Date() > ABIERTO_HASTA) return { ok: false, motivo: "cerrado", nombre, compradas };

  const tags = sub ? await subscriberTags(sub.id).catch(() => []) : [];
  const porKit = tags.some((t) => t.id === KIT_TAGS.compraBF || t.id === KIT_TAGS.accesoManual);
  if (porKit || woo?.compraBF) return { ok: true, nombre, compradas };
  return { ok: false, motivo: "no-comprador", nombre, compradas };
}

/** Same check, cached 10 min so we don't hit Kit and WooCommerce on every message. */
export async function cachedAccess(email: string): Promise<Access> {
  const k = `acc:${email}`;
  const hit = await redis().get<Access>(k);
  if (hit) return hit;
  const acc = await checkAccess(email);
  if (acc.ok) await redis().set(k, acc, { ex: 600 });
  return acc;
}
