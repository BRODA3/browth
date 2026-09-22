// CRM de cada cuenta: oportunidades que avanzan por etapas, con su origen
// (qué API o canal las trajo) y el historial de movimientos, que es de donde
// salen todas las métricas — no se cargan a mano.

export type EtapaId = "nuevo" | "calificado" | "reunion" | "propuesta" | "ganado" | "perdido";

export const ETAPAS: { id: EtapaId; label: string; color: string }[] = [
  { id: "nuevo", label: "Nuevo", color: "#8a8a8a" },
  { id: "calificado", label: "Calificado", color: "#C8F542" },
  { id: "reunion", label: "Reunión", color: "#4FD18A" },
  { id: "propuesta", label: "Propuesta", color: "#38B79E" },
  { id: "ganado", label: "Ganado", color: "#4ade80" },
  { id: "perdido", label: "Perdido", color: "#f87171" },
];

export type FuenteId = "whatsapp" | "instagram" | "meta_ads" | "web" | "outbound" | "referido" | "manual";

export const FUENTES: { id: FuenteId; label: string; color: string }[] = [
  { id: "whatsapp", label: "WhatsApp", color: "#4ade80" },
  { id: "instagram", label: "Instagram", color: "#E14FA8" },
  { id: "meta_ads", label: "Meta Ads", color: "#4F91E0" },
  { id: "web", label: "Web", color: "#C8F542" },
  { id: "outbound", label: "Outbound", color: "#38B79E" },
  { id: "referido", label: "Referido", color: "#8A6FE0" },
  { id: "manual", label: "Manual", color: "#8a8a8a" },
];

export interface Oportunidad {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  fuente: FuenteId;
  etapa: EtapaId;
  valor: number;
  responsable: string;
  nota: string;
  creado: string; // ISO
  historial: { etapa: EtapaId; fecha: string }[];
}

export function nuevaOportunidad(parcial: Partial<Oportunidad> = {}): Oportunidad {
  const ahora = new Date().toISOString();
  const etapa = parcial.etapa ?? "nuevo";
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: "", empresa: "", telefono: "", email: "",
    fuente: "manual", valor: 0, responsable: "", nota: "",
    creado: ahora,
    historial: [{ etapa, fecha: ahora }],
    ...parcial,
    etapa,
  };
}

export function moverEtapa(op: Oportunidad, etapa: EtapaId): Oportunidad {
  if (op.etapa === etapa) return op;
  return { ...op, etapa, historial: [...op.historial, { etapa, fecha: new Date().toISOString() }] };
}

const DIA = 86_400_000;

export function diasEnEtapa(op: Oportunidad): number {
  const ult = op.historial[op.historial.length - 1]?.fecha ?? op.creado;
  return Math.max(0, Math.floor((Date.now() - new Date(ult).getTime()) / DIA));
}

const ORDEN: EtapaId[] = ["nuevo", "calificado", "reunion", "propuesta", "ganado"];

/** Métricas del CRM calculadas desde las oportunidades y su historial. */
export function metricasCrm(ops: Oportunidad[]) {
  const abiertas = ops.filter((o) => o.etapa !== "ganado" && o.etapa !== "perdido");
  const ganadas = ops.filter((o) => o.etapa === "ganado");
  const perdidas = ops.filter((o) => o.etapa === "perdido");
  const cerradas = ganadas.length + perdidas.length;

  const ciclos = ganadas.map((o) => {
    const fin = [...o.historial].reverse().find((h) => h.etapa === "ganado")?.fecha ?? o.creado;
    return (new Date(fin).getTime() - new Date(o.creado).getTime()) / DIA;
  });

  // Cuántas oportunidades llegaron al menos a cada etapa (aunque después se perdieran).
  const alcanzo = (etapa: EtapaId) => {
    const idx = ORDEN.indexOf(etapa);
    return ops.filter((o) => o.historial.some((h) => ORDEN.indexOf(h.etapa) >= idx)).length;
  };

  return {
    total: ops.length,
    abiertas: abiertas.length,
    valorPipeline: abiertas.reduce((s, o) => s + (o.valor || 0), 0),
    valorGanado: ganadas.reduce((s, o) => s + (o.valor || 0), 0),
    ganadas: ganadas.length,
    tasaCierre: cerradas ? Math.round((ganadas.length / cerradas) * 100) : null,
    cicloDias: ciclos.length ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : null,
    estancadas: abiertas.filter((o) => diasEnEtapa(o) > 7).length,
    embudo: ORDEN.map((e) => ({ etapa: e, cantidad: alcanzo(e) })),
    porFuente: FUENTES.map((f) => ({ ...f, cantidad: ops.filter((o) => o.fuente === f.id).length })).filter((f) => f.cantidad > 0),
  };
}
