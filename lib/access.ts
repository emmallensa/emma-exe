import { findSubscriber, subscriberTags } from "./kit";
import { compraBFWoo, infoWoo } from "./woo";
import { isAdmin } from "./session";
import { ABIERTO_HASTA, BF_DESDE, KIT_TAGS } from "./config";
import { redis } from "./store";

export type Access = {
  ok: boolean;
  /** sin-comprobar: la tienda no ha contestado, no sabemos si ha comprado. */
  motivo?: "no-comprador" | "cerrado" | "sin-comprobar";
  nombre: string;
  compradas: number[];
  /** Ya es miembro de Diffuze Inside (trimestral o anual en WooCommerce): no se le recomienda la membresía. */
  miembro?: boolean;
};

/** conCompras: también saca los productos comprados (para no recomendarlos). En el login no hace falta. */
export async function checkAccess(email: string, conCompras = false): Promise<Access> {
  let kitFallo = false;
  const sub = await findSubscriber(email).catch(() => {
    kitFallo = true;
    return null;
  });
  const nombre = sub?.first_name || "";
  if (!isAdmin(email) && new Date() > ABIERTO_HASTA) return { ok: false, motivo: "cerrado", nombre, compradas: [] };

  const tags = sub
    ? await subscriberTags(sub.id).catch(() => {
        kitFallo = true;
        return [];
      })
    : [];
  const porKit = isAdmin(email) || tags.some((t) => t.id === KIT_TAGS.compraBF || t.id === KIT_TAGS.accesoManual);
  const miembroKit = tags.some((t) => KIT_TAGS.miembroDI.includes(t.id));

  if (!porKit) {
    // Antes del Black Friday nadie puede tener un pedido del BF: no hace falta preguntar a la tienda.
    // (Si Kit ha fallado, no sabemos si tiene la etiqueta: mejor decirle que pruebe luego que «no has comprado».)
    if (new Date() < BF_DESDE) return { ok: false, motivo: kitFallo ? "sin-comprobar" : "no-comprador", nombre, compradas: [] };
    // Reserva por si Make aún no ha puesto la etiqueta: solo los pedidos de los días del BF (rápido).
    const compraBF = await compraBFWoo(email);
    if (compraBF === null) return { ok: false, motivo: "sin-comprobar", nombre, compradas: [] };
    if (!compraBF) return { ok: false, motivo: kitFallo ? "sin-comprobar" : "no-comprador", nombre, compradas: [] };
  }

  // Ya tiene acceso. El historial completo de compras (lento) solo cuando hace falta para las recomendaciones.
  const woo = conCompras ? await infoWoo(email) : null;
  const compradas = woo ? [...woo.productos] : [];
  return { ok: true, nombre, compradas, miembro: !!woo?.miembro || miembroKit };
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
