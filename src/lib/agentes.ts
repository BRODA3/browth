// Los agentes de una cuenta, como piezas de un tablero: cada uno con su
// disparador, sus fuentes, lo que entrega, sus límites y su prompt.
// El catálogo de src/lib/data.ts es el punto de partida; desde ahí cada
// cuenta arma el suyo.

import { AGENTS, STAGES, type StageId, type AgentStatusValue } from "./data";

export interface AgenteConfig {
  id: string;
  nombre: string;
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
  x: number;
  y: number;
  /** Herramientas que puede usar: APIs, el CRM, el calendario. */
  herramientas: string[];
  /** A qué otros agentes le pasa el trabajo cuando termina. */
  conexiones: string[];
  ejecuciones: number;
  resueltas: number;
  escaladas: number;
}

export const COLOR_ETAPA: Record<StageId, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.color])
) as Record<StageId, string>;

export const CARD_W = 260;
export const CARD_H = 132;

const uid = () => `ag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** El catálogo de Broda, acomodado en columnas por motor. */
export function seedAgentes(): AgenteConfig[] {
  const porEtapa: Record<string, number> = {};
  return AGENTS.map((a) => {
    const col = STAGES.findIndex((s) => s.id === a.stage);
    const fila = porEtapa[a.stage] ?? 0;
    porEtapa[a.stage] = fila + 1;
    return {
      id: a.id,
      nombre: a.name,
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
      x: 80 + col * (CARD_W + 150),
      y: 110 + fila * (CARD_H + 90),
    };
  });
}

export function nuevoAgente(x: number, y: number): AgenteConfig {
  return {
    id: uid(), nombre: "Agente nuevo", etapa: "get",
    disparador: "", entrada: "", salida: "", limites: "", api: "",
    prompt: "", estado: "No construido", autonomia: 0, resp: 0, x, y,
    herramientas: [], conexiones: [], ejecuciones: 0, resueltas: 0, escaladas: 0,
  };
}

export function duplicarAgente(a: AgenteConfig): AgenteConfig {
  return { ...a, id: uid(), nombre: `${a.nombre} (copia)`, x: a.x + 40, y: a.y + 40 };
}

/** Curva de derivación entre dos agentes: sale por la derecha, entra por la izquierda. */
export function curvaAgente(a: AgenteConfig, b: AgenteConfig) {
  const x1 = a.x + CARD_W, y1 = a.y + CARD_H / 2;
  const x2 = b.x, y2 = b.y + CARD_H / 2;
  const dx = Math.max(70, Math.abs(x2 - x1) * 0.45);
  return { d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`, x1, y1, x2, y2 };
}
