import { findSubscriber, subscribersForTag, subscriberTags, type KitSub } from "./kit";
import { emailComparable, esGmail } from "./email";
import { compraBFWoo, infoWoo } from "./woo";
import { isAdmin } from "./session";
import { ABIERTO_HASTA, BF_DESDE, KIT_TAGS } from "./config";
import { redis } from "./store";

export type Access = {
  ok: boolean;
  /** El email con el que está en Kit (puede llevar los puntos de Gmail en otro sitio que el que ha escrito). */
  email: string;
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
  let sub = await findSubscriber(email).catch(() => {
    kitFallo = true;
    return null;
  });
  let nombre = sub?.first_name || "";
  if (!isAdmin(email) && new Date() > ABIERTO_HASTA) return { ok: false, email, motivo: "cerrado", nombre, compradas: [] };

  let tags = sub
    ? await subscriberTags(sub.id).catch(() => {
        kitFallo = true;
        return [];
      })
    : [];
  let porKit = isAdmin(email) || tags.some((t) => t.id === KIT_TAGS.compraBF || t.id === KIT_TAGS.accesoManual);

  // Gmail: puede que la etiqueta esté en el mismo buzón escrito con los puntos en otro sitio.
  if (!porKit && esGmail(email)) {
    const otra = await varianteGmailConAcceso(email).catch(() => {
      kitFallo = true;
      return null;
    });
    if (otra) {
      sub = otra;
      email = otra.email_address.trim().toLowerCase();
      nombre = otra.first_name || nombre;
      tags = await subscriberTags(otra.id).catch(() => []);
      porKit = true;
    }
  }
  const miembroKit = tags.some((t) => KIT_TAGS.miembroDI.includes(t.id));

  if (!porKit) {
    // Antes del Black Friday nadie puede tener un pedido del BF: no hace falta preguntar a la tienda.
    // (Si Kit ha fallado, no sabemos si tiene la etiqueta: mejor decirle que pruebe luego que «no has comprado».)
    if (new Date() < BF_DESDE) return { ok: false, email, motivo: kitFallo ? "sin-comprobar" : "no-comprador", nombre, compradas: [] };
    // Reserva por si Make aún no ha puesto la etiqueta: solo los pedidos de los días del BF (rápido).
    const compraBF = await compraBFWoo(email);
    if (compraBF === null) return { ok: false, email, motivo: "sin-comprobar", nombre, compradas: [] };
    if (!compraBF) return { ok: false, email, motivo: kitFallo ? "sin-comprobar" : "no-comprador", nombre, compradas: [] };
  }

  // Ya tiene acceso. El historial completo de compras (lento) solo cuando hace falta para las recomendaciones.
  const woo = conCompras ? await infoWoo(email) : null;
  const compradas = woo ? [...woo.productos] : [];
  return { ok: true, email, nombre, compradas, miembro: !!woo?.miembro || miembroKit };
}

/** Busca entre quienes tienen etiqueta de acceso un email de Gmail que sea el mismo buzón. Lista cacheada 2 min. */
async function varianteGmailConAcceso(email: string): Promise<KitSub | null> {
  const buscado = emailComparable(email);
  for (const tagId of [KIT_TAGS.compraBF, KIT_TAGS.accesoManual]) {
    const k = `tagsubs:${tagId}`;
    let subs = await redis().get<KitSub[]>(k);
    if (!subs) {
      subs = await subscribersForTag(tagId);
      await redis().set(k, subs, { ex: 120 });
    }
    const hit = subs.find((s) => emailComparable(s.email_address) === buscado);
    if (hit) return hit;
  }
  return null;
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
