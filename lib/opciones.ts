import { BF_HASTA, LANDING_BF, LISTA_ESPERA, type Perfil } from "./config";

// Lo único que Emma.exe puede recomendar. Nombre y enlace salen de aquí, nunca de la IA.
// Sale de claude/catalogo-cursos-academia-diffuze.md (10 nov 2026) + piezas del Black Friday.
// productIds = productos de WooCommerce: si la persona ya los ha comprado, la opción se descarta.

export type Opcion = {
  id: string;
  nombre: string;
  url: string;
  para: string; // lo que lee la IA para decidir
  perfiles: Perfil[];
  productIds: number[];
  hasta?: Date; // piezas del BF: solo hasta el 30 nov
};

const bf = (path: string) => LANDING_BF + path;

export const OPCIONES: Opcion[] = [
  // VENTAS
  {
    id: "tqh_paginas",
    nombre: "Tenemos que hablar de… Páginas de venta",
    url: LANDING_BF,
    para: "Páginas de venta, más de copy que de diseño, con skills para Claude y ChatGPT. Para quien tiene oferta pero su página no convence.",
    perfiles: ["ventas"],
    productIds: [28467],
    hasta: BF_HASTA, // aún no tiene landing propia: solo durante el BF
  },
  {
    id: "tqh_newsletters",
    nombre: "Tenemos que hablar de… Newsletters",
    url: "https://emmallensa.com/masterclass-newsletters/",
    para: "Newsletters que venden de forma sistemática. Para quien tiene (o quiere) lista de email y no le vende.",
    perfiles: ["ventas", "mentalidad"],
    productIds: [28067],
  },
  {
    id: "tripwire",
    nombre: "Tripwire: estrategia low ticket",
    url: "https://emmallensa.com/curso-tripwire/",
    para: "Crear un producto de bajo coste para que los clientes entren pagando, con email y Meta Ads. Para quien solo tiene una oferta cara.",
    perfiles: ["ventas"],
    productIds: [21127],
  },
  // MARKETING
  {
    id: "tqh_lead_magnets",
    nombre: "Tenemos que hablar de… Lead Magnets",
    url: "https://emmallensa.com/masterclass-lead-magnets/",
    para: "Regalos que atraen compradores, no descargadores. Para quien no tiene lista o no le crece.",
    perfiles: ["marketing"],
    productIds: [27448],
  },
  {
    id: "copy_rrss",
    nombre: "Copywriting para RRSS con IA",
    url: "https://emmallensa.com/copywriting-rrss-ia/",
    para: "Textos para redes que suenan a ti y no a la IA. Para quien publica pero su contenido no engancha.",
    perfiles: ["marketing"],
    productIds: [29325],
  },
  {
    id: "signal_ads",
    nombre: "Método Signal Ads",
    url: "https://emmallensa.com/metodo-signal-meta-ads/",
    para: "Solo para quien YA hace Meta Ads: estructura para que Meta entienda su negocio y estabilice resultados.",
    perfiles: ["marketing"],
    productIds: [27926],
  },
  {
    id: "salir_primero",
    nombre: "Cómo salir primero en ChatGPT",
    url: "https://emmallensa.com/taller-salir-primero-chatgpt/",
    para: "Que ChatGPT y otras IAs recomienden su web. Para quien tiene web y quiere que la encuentren.",
    perfiles: ["marketing"],
    productIds: [27766],
  },
  // PRODUCTIVIDAD
  {
    id: "semana_hecha",
    nombre: "Semana Hecha",
    url: "https://emmallensa.com/workshop-tu-semana/",
    para: "7 rutinas de IA ya montadas: correo ordenado, contenido de la semana escrito y cobros al día. Para quien no llega y lo hace todo a última hora.",
    perfiles: ["productividad", "mentalidad"],
    productIds: [31147],
  },
  {
    id: "curso_claude",
    nombre: "Curso Claude Asistente",
    url: "https://emmallensa.com/curso-claude/",
    para: "Montar Claude bien desde la base para que entregue el trabajo hecho (proyectos, skills, conectores). Para quien usa Claude o quiere pasarse y le saca poco.",
    perfiles: ["productividad"],
    productIds: [29612],
  },
  {
    id: "taller_expres",
    nombre: "Taller Exprés: Claude y ChatGPT",
    url: "https://emmallensa.com/taller-expres-claude-chatgpt/",
    para: "Mapa rápido de proyectos, conectores, skills y rutinas en Claude o ChatGPT. Para quien está empezando con la IA.",
    perfiles: ["productividad"],
    productIds: [31196],
  },
  // PIEZAS DE DIFFUZE INSIDE (solo durante el BF)
  {
    id: "bf_webs",
    nombre: "Haz webs con IA (Claude y ChatGPT)",
    url: bf(""),
    para: "Hacer su web o su página de venta con la IA. Para quien no tiene página de venta o la tiene muy floja.",
    perfiles: ["ventas"],
    productIds: [31838],
    hasta: BF_HASTA,
  },
  {
    id: "bf_carruseles",
    nombre: "Pack carruseles con IA",
    url: bf(""),
    para: "Carruseles de Instagram con su marca que se publican solos + automatizaciones con ManyChat. Para quien pierde horas creando contenido.",
    perfiles: ["marketing", "productividad"],
    productIds: [31839],
    hasta: BF_HASTA,
  },
  {
    id: "bf_seo",
    nombre: "Proyecto SEO con Claude y ChatGPT",
    url: bf(""),
    para: "Hacer el SEO de su web con la IA. Para quien tiene web y casi no le llega tráfico.",
    perfiles: ["marketing"],
    productIds: [31840],
    hasta: BF_HASTA,
  },
  {
    id: "bf_meta_ads",
    nombre: "Gestiona Meta Ads con la IA",
    url: bf(""),
    para: "Solo para quien YA hace Meta Ads: conectar la cuenta a Claude o ChatGPT y llevar las campañas desde la IA.",
    perfiles: ["marketing"],
    productIds: [31841],
    hasta: BF_HASTA,
  },
  {
    id: "bf_video",
    nombre: "Curso de edición de vídeo con IA",
    url: bf(""),
    para: "Editar vídeos y reels con IA. Para quien quiere hacer vídeo y no tiene tiempo de editar.",
    perfiles: ["marketing"],
    productIds: [31697],
    hasta: BF_HASTA,
  },
  // SIEMPRE
  {
    id: "diffuze_inside",
    nombre: "Diffuze Inside (lista de espera)",
    url: LISTA_ESPERA,
    para: "La membresía: de todo un poco y algo nuevo cada semana. Ahora cerrada: solo lista de espera. Úsala si ningún curso encaja de verdad o si necesita varias cosas a la vez.",
    perfiles: ["ventas", "marketing", "mentalidad", "productividad"],
    productIds: [],
  },
];

export function opcionesPara(compradas: Set<number>, now = new Date()) {
  return OPCIONES.filter((o) => (!o.hasta || now <= o.hasta) && !o.productIds.some((id) => compradas.has(id)));
}

export const opcionPorId = (id: string) => OPCIONES.find((o) => o.id === id);
