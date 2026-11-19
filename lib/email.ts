// Gmail no distingue puntos ni lo que va detrás de un «+»: laia.cantenys@gmail.com,
// laiacantenys@gmail.com y laiacantenys+bf@gmail.com son el mismo buzón. Kit y WooCommerce, en cambio,
// los tratan como emails distintos. Esto los reduce a una forma común solo para comparar.

const GMAIL = new Set(["gmail.com", "googlemail.com"]);

export function esGmail(email: string) {
  return GMAIL.has(email.trim().toLowerCase().split("@")[1] || "");
}

/** Forma común para comparar emails. Solo toca Gmail; el resto se compara tal cual (sin mayúsculas ni espacios). */
export function emailComparable(email: string) {
  const e = email.trim().toLowerCase();
  if (!esGmail(e)) return e;
  const local = e.split("@")[0].split("+")[0].replace(/\./g, "");
  return `${local}@gmail.com`;
}

export const mismoEmail = (a: string, b: string) => emailComparable(a) === emailComparable(b);
