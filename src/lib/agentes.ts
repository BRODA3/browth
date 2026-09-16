// La red de agentes de una cuenta, ordenada como una empresa: una orquestadora
// en el centro, departamentos con un dueño humano, y los agentes de cada uno.
// El catálogo de src/lib/data.ts es el punto de partida; cada cuenta arma el suyo.

import { AGENTS, type StageId, type AgentStatusValue } from "./data";

export type DeptoId = "direccion" | "pauta" | "contenido" | "operaciones" | "ventas" | "retencion";

export interface Departamento {
  id: DeptoId;
  nombre: string;
  /** Quién del equipo responde por este departamento. */
  dueno: string;
  mision: string;
  color: string;
  inicial: string;
}

/** La estructura comercial de BRODA, vista como organigrama de agentes. */
export const DEPARTAMENTOS: Departamento[] = [
  { id: "direccion", nombre: "Dirección", dueno: "Charly", mision: "Orquesta la red: reparte el trabajo y controla que el embudo avance.", color: "#fbbf24", inicial: "B" },
  { id: "pauta", nombre: "Pauta y adquisición", dueno: "Thiago", mision: "Que entren consultas del ICP al menor costo posible.", color: "#C8F542", inicial: "P" },
  { id: "contenido", nombre: "Contenido", dueno: "Mecha", mision: "Piezas que sostienen el precio y alimentan la pauta.", color: "#E14FA8", inicial: "C" },
  { id: "operaciones", nombre: "Operaciones y captación", dueno: "Tomi", mision: "Que ningún contacto se pierda y todo quede en el CRM, calificado.", color: "#4F91E0", inicial: "O" },
  { id: "ventas", nombre: "Ventas y cierre", dueno: "Charly", mision: "Que el calificado se convierta en cliente firmado.", color: "#4FD18A", inicial: "V" },
  { id: "retencion", nombre: "Retención y expansión", dueno: "Charly + Tomi", mision: "Que el cliente se quede, crezca de plan y traiga otros.", color: "#8A6FE0", inicial: "R" },
];

export const deptoDe = (id: DeptoId) => DEPARTAMENTOS.find((d) => d.id === id) ?? DEPARTAMENTOS[0];

/** En qué departamento vive cada agente del catálogo. */
const DEPTO_DEL_CATALOGO: Record<string, DeptoId> = {
  "ads-optimizer": "pauta",
  "icp-researcher": "pauta",
  "content-writer": "contenido",
  "case-study-agent": "contenido",
  "inbound-qualifier": "operaciones",
  "crm-hygiene": "operaciones",
  "reporting-agent": "operaciones",
  "onboarding-agent": "operaciones",
  "outbound-prospector": "ventas",
  "precall-briefer": "ventas",
  "proposal-generator": "ventas",
  "followup-nurture": "ventas",
  "health-score": "retencion",
  "churn-alert": "retencion",
  "survey-agent": "retencion",
  "results-reporter": "retencion",
  "opportunity-spotter": "retencion",
  "referral-agent": "retencion",
};

const DEPTO_POR_ETAPA: Record<StageId, DeptoId> = { get: "pauta", convert: "ventas", keep: "retencion", grow: "retencion" };

export function departamentoPorDefecto(id: string, etapa: StageId): DeptoId {
  return DEPTO_DEL_CATALOGO[id] ?? DEPTO_POR_ETAPA[etapa];
}

export interface AgenteConfig {
  id: string;
  nombre: string;
  /** Qué hace, en pocas palabras: lo que se lee debajo del nombre. */
  rol: string;
  departamento: DeptoId;
  etapa: StageId;
  disparador: string;
  entrada: string;
  salida: string;
  limites: string;
  api: string;
  prompt: string;
  estado: AgentStatusValue;
  /** Cuánto resuelve sin que intervenga una persona, 0 a 100. */
  autonomia: number;
  /** Tiempo de respuesta en minutos. */
  resp: number;
  /** Herramientas que puede usar: APIs, el CRM, el calendario. */
  herramientas: string[];
  /** A qué otros agentes le pasa el trabajo cuando termina. */
  conexiones: string[];
  ejecuciones: number;
  resueltas: number;
  escaladas: number;
}

const uid = () => `ag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const ORQUESTADORA_ID = "brodita-orquestadora";

const PROMPT_ORQUESTADORA = `Sos Brodita, la orquestadora de la red de agentes comerciales de BRODA para esta cuenta. No hacés el trabajo de los agentes: decidís quién lo hace, en qué orden, y controlás que el embudo avance.

Tu estructura:
- Pauta y adquisición (dueño: Thiago) — Optimizador de pauta, Investigador de ICP.
- Contenido (dueña: Mecha) — Generador de contenido, Casos de éxito.
- Operaciones y captación (dueño: Tomi) — Calificador inbound, Higiene de CRM, Reporting, Onboarding.
- Ventas y cierre (dueño: Charly) — Prospector outbound, Briefing pre-reunión, Propuestas, Seguimiento.
- Retención y expansión (dueños: Charly y Tomi) — Health score, Alerta de churn, Encuestas, Resultados, Oportunidades, Referidos.

Cada vez que recibís un evento (entró un lead, se agendó una reunión, una propuesta lleva 48 horas sin respuesta, cerró el mes):
1. Identificá en qué capa del embudo está: atraer, capturar, calificar, convertir, retener, expandir o referir.
2. Derivá la tarea al agente que corresponde, con el contexto mínimo que necesita.
3. Si ningún agente puede resolverlo, o hay riesgo de perder la venta, escalalo al dueño humano del departamento.

Respondé siempre con este formato:
- Evento: qué pasó, en una línea.
- Capa: en qué parte del embudo está.
- Deriva a: el agente (o la persona) y por qué.
- Contexto que le pasás: lo mínimo necesario.
- Qué controlás después: cuándo y cómo verificás que se hizo.

Reglas:
- Nunca cotizás precio ni prometés fechas: eso es de Charly.
- No movés presupuesto de pauta: eso es de Thiago.
- Un contacto que queda sin dueño es un error tuyo. Todo tiene responsable y próximo paso.`;

function orquestadora(): AgenteConfig {
  return {
    id: ORQUESTADORA_ID,
    nombre: "Brodita",
    rol: "Orquestadora de la red",
    departamento: "direccion",
    etapa: "convert",
    disparador: "Cualquier evento del embudo: un lead nuevo, una reunión, una propuesta sin respuesta, el cierre del mes.",
    entrada: "El estado del CRM, el brain de la cuenta y lo que reporta cada agente.",
    salida: "La tarea derivada al agente correcto, con contexto y fecha de control.",
    limites: "No cotiza, no promete fechas y no mueve presupuesto. Escala a una persona ante riesgo de perder la venta.",
    api: "CRM + todos los agentes",
    prompt: PROMPT_ORQUESTADORA,
    estado: "En construcción",
    autonomia: 0,
    resp: 0,
    herramientas: ["CRM de BRODA WORLD", "Brain de la cuenta", "Red de agentes"],
    conexiones: [],
    ejecuciones: 0, resueltas: 0, escaladas: 0,
  };
}

/** La red completa: la orquestadora más el catálogo de Broda repartido en departamentos. */
export function seedAgentes(): AgenteConfig[] {
  const catalogo: AgenteConfig[] = AGENTS.map((a) => ({
    id: a.id,
    nombre: a.name,
    rol: a.output.split(/[.;]/)[0],
    departamento: departamentoPorDefecto(a.id, a.stage),
    etapa: a.stage,
    disparador: a.trigger,
    entrada: a.input,
    salida: a.output,
    limites: a.guardrails,
    api: a.api,
    prompt: a.systemPrompt,
    estado: "No construido" as AgentStatusValue,
    autonomia: 0,
    resp: 0,
    herramientas: a.api.split(/ *[+·] */).filter(Boolean),
    conexiones: [],
    ejecuciones: 0, resueltas: 0, escaladas: 0,
  }));
  const o = orquestadora();
  o.conexiones = catalogo.map((a) => a.id);
  return [o, ...catalogo];
}

/** Completa agentes guardados con una versión vieja del modelo, sin pisar lo editado. */
export function normalizarAgentes(guardados: Partial<AgenteConfig>[] | undefined): AgenteConfig[] {
  if (!guardados || guardados.length === 0) return seedAgentes();
  const lista = guardados.map((x) => {
    const etapa = (x.etapa ?? "get") as StageId;
    const id = x.id ?? uid();
    return {
      id,
      nombre: x.nombre ?? "Agente",
      rol: x.rol ?? (x.salida ?? "").split(/[.;]/)[0],
      departamento: x.departamento ?? (id === ORQUESTADORA_ID ? "direccion" : departamentoPorDefecto(id, etapa)),
      etapa,
      disparador: x.disparador ?? "",
      entrada: x.entrada ?? "",
      salida: x.salida ?? "",
      limites: x.limites ?? "",
      api: x.api ?? "",
      prompt: x.prompt ?? "",
      estado: x.estado ?? "No construido",
      autonomia: x.autonomia ?? 0,
      resp: x.resp ?? 0,
      herramientas: x.herramientas ?? [],
      conexiones: x.conexiones ?? [],
      ejecuciones: x.ejecuciones ?? 0,
      resueltas: x.resueltas ?? 0,
      escaladas: x.escaladas ?? 0,
    } as AgenteConfig;
  });
  // Si la red se armó antes de que existiera la orquestadora, se suma sola.
  if (!lista.some((a) => a.departamento === "direccion")) {
    const o = orquestadora();
    o.conexiones = lista.map((a) => a.id);
    lista.unshift(o);
  }
  return lista;
}

export function nuevoAgente(departamento: DeptoId): AgenteConfig {
  return {
    id: uid(), nombre: "Agente nuevo", rol: "", departamento, etapa: "get",
    disparador: "", entrada: "", salida: "", limites: "", api: "",
    prompt: "", estado: "No construido", autonomia: 0, resp: 0,
    herramientas: [], conexiones: [], ejecuciones: 0, resueltas: 0, escaladas: 0,
  };
}

export function duplicarAgente(a: AgenteConfig): AgenteConfig {
  return { ...a, id: uid(), nombre: `${a.nombre} (copia)` };
}
