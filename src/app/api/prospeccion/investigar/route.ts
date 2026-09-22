import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { clienteAnthropic, correrAgente, errorARespuesta, leerPagina } from "@/lib/agenteServer";
import { separarEmails, whatsappDeLink, type Investigacion, type Lead } from "@/lib/prospeccion";

// Investiga un lead: lee la web de la empresa (home + contacto + nosotros),
// busca al decisor en la web y en LinkedIn, y lo puntúa contra el perfil de la
// cuenta. Nunca inventa: lo que no encuentra vuelve vacío.

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `Sos el investigador de prospectos B2B de BRODA, en Buenos Aires. Recibís una empresa encontrada en Google Maps, el texto de su web y el perfil de cliente ideal de la cuenta para la que prospectamos.

Tu trabajo:
1. Encontrar a la persona que decide la compra (nombre y cargo), priorizando los cargos del perfil. Buscá primero en el texto de la web ("Nosotros", "Equipo", "Staff", "Quiénes somos"). Si no está, buscá en la web: site:linkedin.com/in con el nombre de la empresa y el cargo, notas de prensa o entrevistas. Verificá que la persona trabaje hoy en esa empresa.
2. Completar contacto que falte (email, WhatsApp, Instagram) solo si lo ves publicado.
3. Puntuar de 1 a 10 qué tan bien encaja con el perfil: rubro, tamaño (reseñas, sucursales, equipo), zona y señales de compra.
4. Escribir un gancho: una frase para abrir la conversación basada en algo real y específico de esa empresa. Nada genérico.

Reglas:
- Nunca inventes nombres, cargos, emails ni teléfonos. Si no lo encontrás publicado, dejalo vacío.
- No armes emails por patrón (nombre@dominio).
- Confianza del decisor: "alta" si nombre y cargo están en la web oficial o en un LinkedIn actual; "media" si hay una sola fuente secundaria; "baja" si es una inferencia (por ejemplo, el apellido en la razón social). Sin decisor, confianza vacía.
- fuente_decisor es la URL donde lo viste.
- Si la empresa claramente no es B2B, está fuera de Buenos Aires o es una cadena sin decisión local, marcá fuera_de_icp.
- Hacé pocas búsquedas y bien dirigidas. Terminá siempre llamando a entregar_investigacion.`;

const ENTREGA: Anthropic.Tool = {
  name: "entregar_investigacion",
  description: "Entrega el resultado de la investigación de la empresa.",
  input_schema: {
    type: "object",
    properties: {
      decisor: { type: "string", description: "Nombre y apellido, o vacío" },
      cargo: { type: "string" },
      linkedin_decisor: { type: "string", description: "URL del perfil, o vacío" },
      confianza: { type: "string", enum: ["alta", "media", "baja", ""] },
      fuente_decisor: { type: "string", description: "URL donde se vio al decisor, o vacío" },
      email: { type: "string", description: "Email publicado, preferentemente de una persona, o vacío" },
      whatsapp: { type: "string", description: "WhatsApp publicado (link wa.me o número marcado como WhatsApp), o vacío" },
      instagram: { type: "string" },
      score: { type: "integer", description: "Encaje con el perfil, 1 a 10" },
      motivo: { type: "string", description: "Una línea concreta que justifique el score" },
      gancho: { type: "string", description: "Frase de apertura basada en algo real de la empresa" },
      fuera_de_icp: { type: "boolean" },
    },
    required: ["decisor", "cargo", "linkedin_decisor", "confianza", "fuente_decisor", "email", "whatsapp", "instagram", "score", "motivo", "gancho", "fuera_de_icp"],
    additionalProperties: false,
  },
};

interface Salida {
  decisor: string; cargo: string; linkedin_decisor: string; confianza: "alta" | "media" | "baja" | "";
  fuente_decisor: string; email: string; whatsapp: string; instagram: string;
  score: number; motivo: string; gancho: string; fuera_de_icp: boolean;
}

/** Home más las páginas de contacto y equipo que se encuentren linkeadas. */
async function leerWeb(web: string): Promise<{ texto: string; emails: string[]; whatsapps: string[] }> {
  if (!web) return { texto: "", emails: [], whatsapps: [] };
  const base = web.startsWith("http") ? web : `https://${web}`;
  const home = await leerPagina(base);
  if (!home) return { texto: "", emails: [], whatsapps: [] };

  const internas = [...new Set(home.links
    .filter((h) => /contact|nosotros|quienes|equipo|staff|about|empresa|team/i.test(h))
    .map((h) => { try { return new URL(h, base).toString(); } catch { return ""; } })
    .filter((u) => u.startsWith("http") && new URL(u).hostname === new URL(base).hostname)
  )].slice(0, 3);

  const extras = await Promise.all(internas.map((u) => leerPagina(u, 6000)));
  const paginas = [{ url: base, ...home }, ...internas.map((u, i) => (extras[i] ? { url: u, ...extras[i]! } : null)).filter(Boolean)] as { url: string; texto: string; links: string[] }[];

  const todosLinks = paginas.flatMap((p) => p.links);
  const emails = [
    ...todosLinks.filter((h) => h.startsWith("mailto:")).map((h) => h.slice(7).split("?")[0]),
    ...paginas.flatMap((p) => p.texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []),
  ];
  const whatsapps = todosLinks.map(whatsappDeLink).filter((w): w is string => Boolean(w));
  const texto = paginas.map((p) => `--- ${p.url}\n${p.texto}`).join("\n\n");
  return { texto, emails, whatsapps };
}

export async function POST(req: NextRequest) {
  let body: { lead?: Lead; perfil?: string; cuenta?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }
  const lead = body.lead;
  if (!lead?.empresa) return NextResponse.json({ error: "Falta el lead a investigar." }, { status: 400 });

  try {
    const client = clienteAnthropic();
    const web = await leerWeb(lead.web);
    const deLaWeb = separarEmails(web.emails, lead.web);

    const pedido = [
      `Prospectamos para: ${body.cuenta || "(cuenta sin nombre)"}`,
      `Perfil de cliente ideal:\n${body.perfil || "(sin perfil cargado: puntuá con criterio general B2B)"}`,
      `Empresa a investigar:
- Nombre: ${lead.empresa}
- Rubro en Maps: ${lead.rubro}
- Dirección: ${lead.direccion} (${lead.localidad})
- Web: ${lead.web || "sin web"}
- Teléfono: ${lead.telefono || "—"}
- Reseñas en Google: ${lead.resenas ?? "—"} (puntaje ${lead.rating ?? "—"})
- Ya tenemos: email ${lead.email || deLaWeb.email || "—"}, WhatsApp ${lead.whatsapp || web.whatsapps[0] || "—"}, Instagram ${lead.instagram || "—"}`,
      web.texto ? `Texto de su web:\n${web.texto}` : "No se pudo leer su web: buscá en otras fuentes.",
    ].join("\n\n");

    const { datos } = await correrAgente<Salida>(client, { system: SYSTEM, pedido, entrega: ENTREGA, busquedas: 3, lecturas: 2 });

    const email = lead.email || deLaWeb.email || datos.email;
    const waWeb = web.whatsapps[0] ?? "";
    const resultado: Investigacion = {
      email,
      emailGenerico: lead.emailGenerico || deLaWeb.emailGenerico,
      whatsapp: waWeb || lead.whatsapp || datos.whatsapp,
      whatsappConfirmado: Boolean(waWeb) || lead.whatsappConfirmado || Boolean(datos.whatsapp),
      instagram: lead.instagram || datos.instagram,
      linkedinEmpresa: lead.linkedinEmpresa,
      decisor: datos.decisor,
      cargo: datos.cargo,
      linkedinDecisor: datos.linkedin_decisor,
      confianza: datos.decisor ? datos.confianza : "",
      fuenteDecisor: datos.fuente_decisor,
      score: datos.fuera_de_icp ? Math.min(datos.score, 3) : Math.max(1, Math.min(10, datos.score)),
      motivo: datos.motivo,
      gancho: datos.gancho,
    };
    return NextResponse.json({ investigacion: resultado });
  } catch (err) {
    const { error, status } = errorARespuesta(err);
    return NextResponse.json({ error }, { status });
  }
}
