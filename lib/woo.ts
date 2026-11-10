import { BF_DESDE, BF_HASTA } from "./config";

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
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
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

export type InfoWoo = { compraBF: boolean; productos: Set<number> };

export async function infoWoo(email: string): Promise<InfoWoo | null> {
  if (!wooConfigurado()) return null;
  try {
    const orders = (await ordersFor(email)).filter((o) => PAGADO.includes(o.status));
    const productos = new Set(orders.flatMap((o) => o.line_items.map((l) => l.product_id)));
    const compraBF = orders.some((o) => {
      const t = new Date(o.date_created_gmt + "Z").getTime();
      return t >= BF_DESDE.getTime() && t <= BF_HASTA.getTime() && !esRenovacion(o);
    });
    return { compraBF, productos };
  } catch (e) {
    console.error("WooCommerce", e);
    return null;
  }
}
