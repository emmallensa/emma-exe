import { BF_DESDE, BF_HASTA, DI_ANUAL, DI_TRIMESTRAL } from "./config";

// API REST de WooCommerce con una clave de SOLO LECTURA (WooCommerce > Ajustes > Avanzado > API REST).
// Si no hay clave, la app funciona igual (solo con Kit) y no descarta cursos comprados.

type Order = {
  id: number;
  status: string;
  created_via: string;
  date_created_gmt: string;
  total: string;
  billing: { email: string };
  line_items: { product_id: number }[];
  meta_data?: { key: string; value: unknown }[];
};

const PAGADO = ["completed", "processing"];

export const wooConfigurado = () => !!(process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);

async function ordersFor(email: string): Promise<Order[]> {
  const base = process.env.WC_URL || "https://emmallensa.com";
  const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
  const out: Order[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(
      `${base}/wp-json/wc/v3/orders?search=${encodeURIComponent(email)}&per_page=100&page=${page}&status=any`,
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store", signal: AbortSignal.timeout(9000) },
    );
    if (!r.ok) throw new Error(`WooCommerce ${r.status}`);
    const batch = (await r.json()) as Order[];
    out.push(...batch);
    if (batch.length < 100) break;
  }
  // "search" busca en varios campos: nos quedamos solo con los de ese email de facturación.
  return out.filter((o) => (o.billing?.email || "").trim().toLowerCase() === email);
}

const esRenovacion = (o: Order) =>
  o.created_via === "subscription" || !!o.meta_data?.some((m) => m.key === "_subscription_renewal");

export type InfoWoo = { compraBF: boolean; productos: Set<number>; miembro: boolean };

const DIA = 86400000;
/** Miembro de Diffuze Inside por WooCommerce: pedido pagado (alta o renovación) del trimestral en los últimos 100 días o del anual en los últimos 370. */
function esMiembro(orders: Order[], now = Date.now()) {
  return orders.some((o) => {
    const edad = now - new Date(o.date_created_gmt + "Z").getTime();
    return o.line_items.some(
      (l) => (l.product_id === DI_TRIMESTRAL && edad <= 100 * DIA) || (l.product_id === DI_ANUAL && edad <= 370 * DIA),
    );
  });
}

/**
 * Solo para dar acceso: ¿tiene este email un pedido pagado del Black Friday?
 * Pide a la tienda solo los pedidos de esos 5 días (no todo el historial), así que va mucho más rápido.
 * Devuelve null si la tienda no contesta: así se distingue «no ha comprado» de «no lo he podido comprobar».
 */
export async function compraBFWoo(email: string): Promise<boolean | null> {
  if (!wooConfigurado()) return null;
  const base = process.env.WC_URL || "https://emmallensa.com";
  const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
  const params = new URLSearchParams({
    search: email,
    after: BF_DESDE.toISOString(),
    before: BF_HASTA.toISOString(),
    dates_are_gmt: "true",
    per_page: "100",
    status: "any",
  });
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(`${base}/wp-json/wc/v3/orders?${params}`, {
        headers: { Authorization: `Basic ${auth}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`WooCommerce ${r.status}`);
      const orders = ((await r.json()) as Order[]).filter(
        (o) => (o.billing?.email || "").trim().toLowerCase() === email,
      );
      return orders.some((o) => PAGADO.includes(o.status) && !esRenovacion(o));
    } catch (e) {
      console.error("WooCommerce BF", intento + 1, e);
    }
  }
  return null;
}

export async function infoWoo(email: string): Promise<InfoWoo | null> {
  if (!wooConfigurado()) return null;
  try {
    const orders = (await ordersFor(email)).filter((o) => PAGADO.includes(o.status));
    const productos = new Set(orders.flatMap((o) => o.line_items.map((l) => l.product_id)));
    const compraBF = orders.some((o) => {
      const t = new Date(o.date_created_gmt + "Z").getTime();
      return t >= BF_DESDE.getTime() && t <= BF_HASTA.getTime() && !esRenovacion(o);
    });
    return { compraBF, productos, miembro: esMiembro(orders) };
  } catch (e) {
    console.error("WooCommerce", e);
    return null;
  }
}
