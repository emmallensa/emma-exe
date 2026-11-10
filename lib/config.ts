// Todo lo que Emma puede querer cambiar sin tocar la lógica está aquí.

export type Perfil = "ventas" | "marketing" | "mentalidad" | "productividad";

export const PERFILES: Record<
  Perfil,
  { titulo: string; tagId: number; video: string; causa: string; accion: string }
> = {
  ventas: {
    titulo: "Te ven, pero no te compran",
    tagId: 25677934,
    // Pega aquí el enlace de Vimeo del vídeo (p. ej. https://vimeo.com/123456789). Vacío = "Vídeo en camino".
    video: process.env.VIDEO_VENTAS || "",
    causa:
      "No le falta audiencia. O la oferta no se entiende, o no hay un motivo para comprar ahora (una fecha, un cierre, una razón para decidir).",
    accion:
      "Pedir a la IA las 10 objeciones de su cliente y responder las 3 primeras en su página de venta.",
  },
  marketing: {
    titulo: "Lo que haces es bueno, pero lo ve muy poca gente",
    tagId: 25677935,
    video: process.env.VIDEO_MARKETING || "",
    causa: "Publicar más no lo arregla. Le falta un sistema que convierta visitas en emails.",
    accion: "Pedir a la IA 10 ideas de regalo a partir de las 5 preguntas que más le hacen sus clientes.",
  },
  mentalidad: {
    titulo: "Por qué no consigues resultados",
    tagId: 25677936,
    video: process.env.VIDEO_MENTALIDAD || "",
    causa:
      "No es falta de técnica ni de herramientas. Es perfeccionismo y miedo a molestar, disfrazados de «aún no está listo».",
    accion: "Escribir hoy, con la IA, ese email que lleva semanas posponiendo, y dejarlo programado.",
  },
  productividad: {
    titulo: "No llegas a todo",
    tagId: 25677937,
    video: process.env.VIDEO_PRODUCTIVIDAD || "",
    causa: "Hace a mano lo que podría hacer la IA y no tiene la semana planificada.",
    accion: "Apuntar todo lo que hace en un día y preguntar a la IA qué podría hacer ella.",
  },
};

export const KIT_TAGS = {
  compraBF: Number(process.env.TAG_COMPRA_BF || 25677681), // "compra black friday 2026" (la pone Make)
  accesoManual: Number(process.env.TAG_ACCESO || 25677938), // "acceso emmaexe" (dar acceso a mano)
  diagnosticoHecho: Number(process.env.TAG_HECHO || 25677746), // "emmaexe diagnostico hecho" (regla de Kit: sale de la secuencia 2965167)
};

// Fechas en hora de España (CET, UTC+1 en estas fechas).
export const BF_DESDE = new Date("2026-11-26T00:00:00+01:00");
export const BF_HASTA = new Date("2026-11-30T23:59:59+01:00");
export const ABIERTO_HASTA = new Date(process.env.ABIERTO_HASTA || "2026-12-31T23:59:59+01:00");

export const LIMITES = {
  mensajesPorDiagnostico: 20,
  diagnosticos: 2, // el primero + rehacerlo una vez
  mensajesPorDia: 60,
};

export const LANDING_BF = "https://emmallensa.com/finalizar-bf-2026/";
export const CATALOGO = "https://emmallensa.com/academia-marketing-digital/";
export const LISTA_ESPERA = "https://emmallensa.com/diffuze-inside/";

export const bfActivo = (now = new Date()) => now <= BF_HASTA;
