// Agente de prospección B2B: el perfil de búsqueda de cada cuenta, los leads que
// trae de Google Maps y lo que el agente investiga de cada uno (decisor, contacto,
// score). Lo usan tanto el cliente como las API routes, así que no depende de nada
// del navegador ni del servidor.

export interface PerfilProspeccion {
  /** Qué vende la cuenta, en una o dos líneas. */
  oferta: string;
  /** Rubros a buscar, tal como alguien los escribiría en Google Maps. */
  rubros: string[];
  /** Barrios de CABA o partidos del GBA. */
  zonas: string[];
  /** Cargos que deciden la compra, en orden de prioridad. */
  cargos: string[];
  tamano: string;
  senales: string;
  excluir: string;
  /** Empresas o dominios que no hay que contactar (clientes actuales, en negociación). */
  noContactar: string;
  /** Competidores directos: nombre y web o Instagram, uno por línea. */
  competidores: string;
  /** Cómo lo resuelven si no contratan a nadie: la base de la competencia indirecta. */
  alternativas: string;
  porBusqueda: number;
}

export const PERFIL_VACIO: PerfilProspeccion = {
  oferta: "", rubros: [], zonas: ["CABA"], cargos: ["Dueño", "Gerente general"],
  tamano: "", senales: "", excluir: "", noContactar: "", competidores: "", alternativas: "",
  porBusqueda: 20,
};

export type Confianza = "alta" | "media" | "baja";
export type EstadoLead = "encontrado" | "investigando" | "investigado" | "error" | "en_crm" | "descartado";

export interface Lead {
  id: string;
  empresa: string;
  rubro: string;
  web: string;
  direccion: string;
  localidad: string;
  telefono: string;
  whatsapp: string;
  whatsappConfirmado: boolean;
  email: string;
  emailGenerico: string;
  instagram: string;
  linkedinEmpresa: string;
  decisor: string;
  cargo: string;
  linkedinDecisor: string;
  confianza: Confianza | "";
  fuenteDecisor: string;
  score: number | null;
  motivo: string;
  gancho: string;
  rating: number | null;
  resenas: number | null;
  mapsUrl: string;
  estado: EstadoLead;
  error?: string;
  creado: string;
}

/** Lo que devuelve el agente al investigar un lead. */
export type Investigacion = Pick<Lead,
  "email" | "emailGenerico" | "whatsapp" | "whatsappConfirmado" | "instagram" | "linkedinEmpresa" |
  "decisor" | "cargo" | "linkedinDecisor" | "confianza" | "fuenteDecisor" | "score" | "motivo" | "gancho"
>;

export interface Competidor {
  nombre: string;
  nivel: "directa" | "indirecta" | "sustituto";
  web: string;
  porQue: string;
}

export interface AnalisisCompetencia {
  id: string;
  fecha: string;
  competidores: Competidor[];
  /** El informe completo en Markdown. */
  informe: string;
  fuentes: string[];
}

export function nuevoLead(parcial: Partial<Lead>): Lead {
  return {
    id: `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    empresa: "", rubro: "", web: "", direccion: "", localidad: "", telefono: "",
    whatsapp: "", whatsappConfirmado: false, email: "", emailGenerico: "", instagram: "", linkedinEmpresa: "",
    decisor: "", cargo: "", linkedinDecisor: "", confianza: "", fuenteDecisor: "",
    score: null, motivo: "", gancho: "", rating: null, resenas: null, mapsUrl: "",
    estado: "encontrado", creado: new Date().toISOString(),
    ...parcial,
  };
}

/* ---------------- Teléfonos de AMBA ---------------- */

/**
 * Clasifica un teléfono de AMBA para WhatsApp. En Buenos Aires los fijos empiezan
 * con 4 o 5; los celulares llevan 15, o empiezan con 2, 3 o 6 desde que se
 * portan números. Devuelve el número normalizado a +54 9 11 XXXX-XXXX.
 */
export function whatsappDe(telefono: string): { numero: string; confirmado: boolean } | null {
  const raw = telefono.replace(/[^\d+]/g, "");
  let d = raw.replace(/^\+?54/, "").replace(/^0/, "");
  const conQuince = /^11\s*-?\s*15|^\(?011\)?\s*15/.test(telefono.replace(/\s+/g, " ").trim()) || /^1115\d{8}$/.test(d);
  if (d.startsWith("9")) d = d.slice(1);
  if (/^1115\d{8}$/.test(d)) d = "11" + d.slice(4);
  if (!/^11\d{8}$/.test(d)) return null;
  const primera = d[2];
  const esCelular = d.startsWith("11") && (raw.startsWith("+549") || conQuince || ["2", "3", "6"].includes(primera));
  if (!esCelular) return null;
  return { numero: `+54 9 11 ${d.slice(2, 6)}-${d.slice(6)}`, confirmado: conQuince || raw.startsWith("+549") };
}

/** Número de un link wa.me o api.whatsapp.com, normalizado. */
export function whatsappDeLink(url: string): string | null {
  const m = url.match(/(?:wa\.me\/|phone=)\+?(\d{10,15})/);
  if (!m) return null;
  const w = whatsappDe(`+${m[1]}`);
  return w ? w.numero : `+${m[1]}`;
}

/* ---------------- Emails ---------------- */

const GENERICOS = /^(info|contacto|contact|hola|hello|ventas|administracion|admin|consultas|recepcion|office|mail|comercial)@/i;

export function separarEmails(emails: string[], web: string): { email: string; emailGenerico: string } {
  const dominio = dominioDe(web);
  const limpios = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)))]
    .filter((e) => !/\.(png|jpg|jpeg|gif|webp|svg)$/.test(e) && !/(sentry|wixpress|example|domain)\./.test(e));
  const personales = limpios.filter((e) => !GENERICOS.test(e));
  const corporativo = personales.find((e) => dominio && e.endsWith(`@${dominio}`)) ?? personales[0] ?? "";
  return { email: corporativo, emailGenerico: limpios.find((e) => GENERICOS.test(e)) ?? "" };
}

export function dominioDe(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/* ---------------- Limpieza de la lista ---------------- */

/** Saca repetidos (por dominio y por teléfono) y lo que el perfil pide no contactar. */
export function depurar(leads: Lead[], perfil: PerfilProspeccion, existentes: Lead[] = []): Lead[] {
  const bloqueados = perfil.noContactar.split(/[\n,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const vistos = new Set<string>();
  const clave = (l: Lead) => [dominioDe(l.web), l.telefono.replace(/\D/g, "").slice(-8)].filter(Boolean);
  existentes.forEach((l) => clave(l).forEach((k) => vistos.add(k)));

  return leads.filter((l) => {
    const ks = clave(l);
    if (ks.some((k) => vistos.has(k))) return false;
    const texto = `${l.empresa} ${l.web}`.toLowerCase();
    if (bloqueados.some((b) => texto.includes(b))) return false;
    ks.forEach((k) => vistos.add(k));
    return true;
  });
}

/* ---------------- Exportación ---------------- */

const COLUMNAS: [string, (l: Lead) => string | number | null][] = [
  ["Empresa", (l) => l.empresa], ["Rubro", (l) => l.rubro], ["Web", (l) => l.web],
  ["Dirección", (l) => l.direccion], ["Localidad/Barrio", (l) => l.localidad],
  ["Teléfono", (l) => l.telefono], ["WhatsApp", (l) => (l.whatsapp && !l.whatsappConfirmado ? `${l.whatsapp} (probable)` : l.whatsapp)],
  ["Email", (l) => l.email], ["Email genérico", (l) => l.emailGenerico],
  ["Decisor", (l) => l.decisor], ["Cargo", (l) => l.cargo], ["LinkedIn decisor", (l) => l.linkedinDecisor],
  ["Confianza decisor", (l) => l.confianza], ["Fuente decisor", (l) => l.fuenteDecisor],
  ["Score ICP (1-10)", (l) => l.score], ["Motivo score", (l) => l.motivo], ["Gancho personalizado", (l) => l.gancho],
  ["Instagram", (l) => l.instagram], ["Google Maps", (l) => l.mapsUrl], ["Estado", (l) => l.estado],
];

/** CSV listo para abrir en Google Sheets o Excel (UTF-8 con BOM). */
export function leadsACsv(leads: Lead[]): string {
  const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [...leads].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return "﻿" + [COLUMNAS.map(([c]) => esc(c)).join(","), ...filas.map((l) => COLUMNAS.map(([, f]) => esc(f(l))).join(","))].join("\n");
}

/** Lo que se le manda al cliente para armar su perfil. Las ★ son imprescindibles. */
export const CUESTIONARIO = `¡Hola! Para armarte la base de clientes potenciales en Buenos Aires necesito estas respuestas. Cortas y concretas alcanzan.

1. ¿Qué vendés y a qué precio aproximado? (una línea)
2. ★ ¿A qué tipo de empresas les vendés? Nombrame rubros concretos (ej.: "constructoras", "clínicas odontológicas", "distribuidoras de alimentos").
3. ¿De qué tamaño son? (cantidad de empleados aprox., o "pymes / grandes")
4. ★ ¿En qué zonas de Buenos Aires? (CABA, zona norte, oeste, sur, todo AMBA…)
5. ★ ¿Quién decide la compra de lo tuyo? (cargo: dueño, gerente general, compras, RR.HH., marketing…)
6. Pasame 3 clientes actuales que te gustaría "clonar" (nombre y web o Instagram).
7. ¿Qué le pasa a una empresa justo antes de necesitarte? (abre sucursal, contrata gente, se muda, tiene un problema puntual…)
8. ¿Qué empresas NO te sirven? (rubros, tamaños o zonas a excluir)
9. ¿Hay empresas que no debamos contactar? (clientes actuales, en negociación) — pasame la lista.
10. ¿Quiénes son tus 3 a 5 competidores principales? (nombre y web/Instagram)
11. Si un cliente no te contrata a vos ni a tu competencia, ¿cómo lo resuelve? (con gente propia, otra herramienta, no lo resuelve…)
12. ¿Cuántos contactos querés por mes?

¡Gracias!`;

/** Barrios de CABA y partidos del GBA para sugerir en el perfil. */
export const ZONAS_SUGERIDAS = [
  "CABA", "Palermo", "Belgrano", "Microcentro", "Puerto Madero", "Recoleta", "Núñez", "Caballito", "Villa Crespo", "Barracas",
  "Vicente López", "San Isidro", "Tigre", "Pilar", "Escobar", "San Martín", "Tres de Febrero", "Morón", "La Matanza",
  "Avellaneda", "Lanús", "Lomas de Zamora", "Quilmes", "La Plata",
];

/** El perfil en texto, para pasárselo al agente o a Brodita. */
export function perfilATexto(p: PerfilProspeccion): string {
  return [
    p.oferta && `Oferta: ${p.oferta}`,
    p.rubros.length && `Rubros objetivo: ${p.rubros.join(", ")}`,
    p.zonas.length && `Zonas: ${p.zonas.join(", ")} (Buenos Aires)`,
    p.cargos.length && `Cargo que decide: ${p.cargos.join(", ")}`,
    p.tamano && `Tamaño: ${p.tamano}`,
    p.senales && `Señales de compra: ${p.senales}`,
    p.excluir && `Excluir: ${p.excluir}`,
    p.competidores && `Competidores conocidos: ${p.competidores}`,
    p.alternativas && `Si no contratan a nadie: ${p.alternativas}`,
  ].filter(Boolean).join("\n");
}
