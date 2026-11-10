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

/** conCompras: también saca los productos comprados (para no recomendarlos). En el login no hace falta. */
export async function checkAccess(email: string, conCompras = false): Promise<Access> {
  const sub = await findSubscriber(email).catch(() => null);
  const nombre = sub?.first_name || "";
  if (!isAdmin(email) && new Date() > ABIERTO_HASTA) return { ok: false, motivo: "cerrado", nombre, compradas: [] };

  const tags = sub ? await subscriberTags(sub.id).catch(() => []) : [];
  const porKit = isAdmin(email) || tags.some((t) => t.id === KIT_TAGS.compraBF || t.id === KIT_TAGS.accesoManual);
  // WooCommerce es lento: solo se consulta si Kit no da acceso, o si hacen falta las compras.
  const woo = porKit && !conCompras ? null : await infoWoo(email);
  const compradas = woo ? [...woo.productos] : [];
  if (porKit || woo?.compraBF) return { ok: true, nombre, compradas };
  return { ok: false, motivo: "no-comprador", nombre, compradas };
}

/** Same check, cached 10 min so we don't hit Kit and WooCommerce on every message. */
export async function cachedAccess(email: string): Promise<Access> {
  const k = `acc:${email}`;
  const hit = await redis().get<Access>(k);
  if (hit) return hit;
  const acc = await checkAccess(email, true);
  if (acc.ok) await redis().set(k, acc, { ex: 600 });
  return acc;
}
