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
      x: 60 + col * (CARD_W + 90),
      y: 60 + fila * (CARD_H + 60),
    };
  });
}

export function nuevoAgente(x: number, y: number): AgenteConfig {
  return {
    id: uid(), nombre: "Agente nuevo", etapa: "get",
    disparador: "", entrada: "", salida: "", limites: "", api: "",
    prompt: "", estado: "No construido", autonomia: 0, resp: 0, x, y,
  };
}

export function duplicarAgente(a: AgenteConfig): AgenteConfig {
  return { ...a, id: uid(), nombre: `${a.nombre} (copia)`, x: a.x + 40, y: a.y + 40 };
}
