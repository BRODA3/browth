// Workflows por cuenta: tableros libres donde se arman los flujos con cuadros
// y líneas, tipo n8n. Cada cuadro es un paso del proceso con su responsable,
// su herramienta y, si corresponde, el agente que lo ejecuta.

import { FLUJOS, type Automatizacion } from "./broda";
import { PLANTILLAS_B2B } from "./plantillasB2B";

export const NODO_W = 248;
export const NODO_H = 104;

export interface NodoFlujo {
  id: string;
  x: number;
  y: number;
  etiqueta: string;
  titulo: string;
  detalle: string;
  responsable: string;
  herramienta: string;
  agente: string;
  tiempo: string;
  automatizacion: Automatizacion;
}

export interface ConexionFlujo {
  id: string;
  desde: string;
  hasta: string;
}

export interface Workflow {
  id: string;
  nombre: string;
  nodos: NodoFlujo[];
  conexiones: ConexionFlujo[];
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function nuevoNodo(x: number, y: number, parcial: Partial<NodoFlujo> = {}): NodoFlujo {
  return {
    id: uid("n"), x, y,
    etiqueta: "Paso", titulo: "", detalle: "",
    responsable: "", herramienta: "", agente: "", tiempo: "",
    automatizacion: "manual",
    ...parcial,
  };
}

export function nuevoWorkflow(nombre: string): Workflow {
  return { id: uid("w"), nombre, nodos: [], conexiones: [] };
}

export function conectar(desde: string, hasta: string): ConexionFlujo {
  return { id: uid("c"), desde, hasta };
}

/** Plantillas: bajan un flujo ya mapeado de Broda a un tablero de la cuenta,
 * en zigzag para que se lea como cadena. */
export const PLANTILLAS: { id: string; nombre: string; grupo: string }[] = [
  ...PLANTILLAS_B2B.map((p) => ({ id: p.id, nombre: p.nombre, grupo: "Flujos B2B" })),
  { id: "capturar", nombre: "Capturar — del mensaje al CRM", grupo: "Capas de Broda" },
  { id: "calificar", nombre: "Calificar — las tres preguntas", grupo: "Capas de Broda" },
  { id: "convertir", nombre: "Convertir — del calificado al cierre", grupo: "Capas de Broda" },
];

export function desdePlantilla(plantillaId: string, nombre: string): Workflow {
  const b2b = PLANTILLAS_B2B.find((x) => x.id === plantillaId);
  if (b2b) {
    const wf = nuevoWorkflow(nombre);
    wf.nodos = b2b.pasos.map((paso, i) => nuevoNodo(80 + i * 300, 120 + (i % 2) * 190, { ...paso }));
    wf.conexiones = wf.nodos.slice(1).map((n, i) => conectar(wf.nodos[i].id, n.id));
    return wf;
  }

  const flujo = FLUJOS[plantillaId];
  const wf = nuevoWorkflow(nombre);
  if (!flujo) return wf;

  wf.nodos = flujo.pasos.map((p, i) =>
    nuevoNodo(80 + i * 300, 120 + (i % 2) * 190, {
      etiqueta: `Paso ${String(i + 1).padStart(2, "0")}`,
      titulo: p.que,
      responsable: p.quien,
      herramienta: p.herramienta,
      agente: p.agente,
      detalle: p.salida ? `Deja: ${p.salida}` : "",
      automatizacion: p.automatizacion,
    })
  );
  wf.conexiones = wf.nodos.slice(1).map((n, i) => conectar(wf.nodos[i].id, n.id));
  return wf;
}

/** Curva entre dos cuadros: sale por la derecha del primero y entra por la izquierda del segundo. */
export function curva(a: NodoFlujo, b: NodoFlujo) {
  const x1 = a.x + NODO_W, y1 = a.y + NODO_H / 2;
  const x2 = b.x, y2 = b.y + NODO_H / 2;
  const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
  return { d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`, x1, y1, x2, y2 };
}

/** Convierte lo que devuelve Brodita en un tablero. */
export function desdeBrodita(nombre: string, pasos: Partial<NodoFlujo>[]): Workflow {
  const wf = nuevoWorkflow(nombre);
  wf.nodos = pasos.map((paso, i) =>
    nuevoNodo(80 + i * 300, 120 + (i % 2) * 190, {
      etiqueta: paso.etiqueta || `Paso ${String(i + 1).padStart(2, "0")}`,
      titulo: paso.titulo || "",
      responsable: paso.responsable || "",
      herramienta: paso.herramienta || "",
      agente: paso.agente || "",
      tiempo: paso.tiempo || "",
      detalle: paso.detalle || "",
      automatizacion: paso.automatizacion === "agente" || paso.automatizacion === "asistido" ? paso.automatizacion : "manual",
    })
  );
  wf.conexiones = wf.nodos.slice(1).map((n, i) => conectar(wf.nodos[i].id, n.id));
  return wf;
}
