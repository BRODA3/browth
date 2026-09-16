// El plan del mes: el framework bajado a tareas con dueño, semana por semana.
// Se aplica sobre DESPA TRANSPORTES como prototipo. Cada tarea tiene un
// "listo cuando" — si no se puede verificar, no es una tarea.

export type Persona = "Thiago" | "Tomi" | "Charly";

export interface TareaPlan {
  id: string;
  semana: number;
  persona: Persona;
  titulo: string;
  listo: string;
  /** Sección de la app donde se hace el trabajo. */
  seccion: string;
  hecha: boolean;
}

export interface PlanMes {
  mes: string;
  cuenta: string;
  objetivo: string;
  personas: { nombre: Persona; rol: string; numero: string; color: string }[];
  semanas: { n: number; foco: string; bajada: string }[];
  tareas: TareaPlan[];
  reglas: string[];
}

let contador = 0;
const t = (semana: number, persona: Persona, titulo: string, listo: string, seccion = ""): TareaPlan => ({
  id: `t${semana}-${persona.toLowerCase()}-${++contador}`,
  semana, persona, titulo, listo, seccion, hecha: false,
});

export const PLAN_MES: PlanMes = {
  mes: "Octubre 2026",
  cuenta: "DESPA TRANSPORTES",
  objetivo: "Que DESPA tenga el embudo capturando, calificando y convirtiendo con agentes, medido desde el primer día.",
  personas: [
    { nombre: "Thiago", rol: "Pauta y adquisición", numero: "Costo por lead calificado", color: "#C8F542" },
    { nombre: "Tomi", rol: "Agentes y operaciones", numero: "Consultas que entran solas al CRM", color: "#4F91E0" },
    { nombre: "Charly", rol: "Estrategia comercial y cierre", numero: "Tasa de cierre de reuniones", color: "#4FD18A" },
  ],
  semanas: [
    { n: 1, foco: "Base", bajada: "Medir, ordenar y cargar el cerebro" },
    { n: 2, foco: "Capturar y calificar", bajada: "Que ninguna consulta se pierda" },
    { n: 3, foco: "Convertir", bajada: "Que el calificado llegue a la firma" },
    { n: 4, foco: "Medir y decidir", bajada: "Leer los números y elegir el próximo foco" },
  ],
  tareas: [
    // Semana 1 — Base
    t(1, "Thiago", "Auditar la cuenta de Meta Ads de DESPA: gasto, costo por lead y creativos de los últimos 30 días", "El baseline está cargado en Métricas", "Métricas"),
    t(1, "Thiago", "Mandar toda la pauta a un solo destino (WhatsApp) con un identificador por campaña", "Cada consulta llega con su campaña de origen", "CRM"),
    t(1, "Thiago", "Armar 3 ángulos de creativo nuevos con el ICP del brain de DESPA", "Los 3 briefs están aprobados por Charly", "Brains"),
    t(1, "Tomi", "Cargar la clave de Claude en Vercel y crear la base de datos", "Brodita responde en la app publicada"),
    t(1, "Tomi", "Cargar el Documento Fundacional de DESPA en su brain y enlazar las notas", "Probar el cerebro devuelve los documentos correctos", "Brains"),
    t(1, "Tomi", "Crear la app de Meta con WhatsApp Cloud API y registrar el webhook", "Un mensaje de prueba llega al servidor"),
    t(1, "Charly", "Definir las 3 preguntas de calificación de DESPA", "Están escritas en el prompt del Calificador inbound", "Agentes IA"),
    t(1, "Charly", "Mapear el flujo de venta real de DESPA con la plantilla Inbound", "Cada paso tiene dueño y dice si hoy es manual", "Workflows"),
    t(1, "Charly", "Escribir las 5 objeciones más frecuentes con su respuesta", "Están guardadas en el brain de DESPA", "Brains"),

    // Semana 2 — Capturar y calificar
    t(2, "Thiago", "Lanzar las campañas con los 3 ángulos hacia WhatsApp", "Las 3 entregan con presupuesto parejo"),
    t(2, "Thiago", "Aplicar la regla de 7 días: lo que no convierte se apaga", "Queda activo solo lo que trae consultas calificadas"),
    t(2, "Thiago", "Reporte del viernes: costo por lead por ángulo", "Está cargado y se leyó en el cierre del viernes", "Métricas"),
    t(2, "Tomi", "Pasar el Calificador inbound a En construcción y probarlo con 20 mensajes reales", "Responde bien 17 de 20", "Agentes IA"),
    t(2, "Tomi", "Conectar el calificador a WhatsApp para que cada consulta entre sola al CRM", "Cero contactos cargados a mano en la semana", "CRM"),
    t(2, "Tomi", "Activar el calificador en producción", "Su estado es Activo y registra ejecuciones", "Agentes IA"),
    t(2, "Charly", "Revisar 20 conversaciones calificadas por el agente y corregir el prompt", "No hay descartes mal hechos", "Agentes IA"),
    t(2, "Charly", "Primera respuesta humana a los calificados en menos de 5 minutos", "Se cumple en 9 de cada 10"),
    t(2, "Charly", "Ordenar el pipeline: cada oportunidad en su etapa con próximo paso", "Ninguna lleva más de 7 días quieta", "CRM"),

    // Semana 3 — Convertir
    t(3, "Thiago", "Escalar el ángulo ganador, con un máximo de 20% más de presupuesto", "El costo por lead se sostiene con más inversión"),
    t(3, "Thiago", "Retargeting a los que escribieron y no calificaron", "La audiencia está armada y entregando"),
    t(3, "Thiago", "Medir costo por reunión, no solo costo por lead", "Aparece en Métricas", "Métricas"),
    t(3, "Tomi", "Construir el agente de Seguimiento a las 48 horas", "Pasa la prueba con 10 casos", "Agentes IA"),
    t(3, "Tomi", "Construir el Briefing pre-reunión", "Cada reunión tiene su resumen una hora antes", "Agentes IA"),
    t(3, "Tomi", "Que la orquestadora derive cada evento al agente correcto", "La prueba de Brodita deriva bien 10 eventos", "Agentes IA"),
    t(3, "Charly", "Propuesta enviada dentro de las 48 horas de cada reunión", "Se cumple en todas las reuniones de la semana"),
    t(3, "Charly", "Seguimiento en día 2 y día 5, con algo nuevo en cada uno", "Ninguna propuesta queda sin seguimiento"),
    t(3, "Charly", "Registrar el motivo de cada oportunidad perdida", "Todas las perdidas tienen un motivo real", "CRM"),

    // Semana 4 — Medir y decidir
    t(4, "Thiago", "Cerrar el mes en Métricas: inversión, costo por lead, costo por reunión y ROAS", "El período está cargado", "Métricas"),
    t(4, "Thiago", "Decidir el presupuesto del mes siguiente con esos números", "Está aprobado por Charly"),
    t(4, "Thiago", "Documentar qué ángulo ganó y por qué", "Está en el brain de DESPA", "Brains"),
    t(4, "Tomi", "Medir la resolución sin humano de cada agente activo", "Está cargada en Mission Control", "Agentes IA"),
    t(4, "Tomi", "Documentar el SOP de cada agente activo", "Otra persona podría operarlo sin preguntar"),
    t(4, "Tomi", "Elegir el próximo agente a construir según el cuello del embudo", "Está en En construcción", "Agentes IA"),
    t(4, "Charly", "Revisar el embudo del mes con los números: dónde se cae la gente", "El cuello está identificado", "Métricas"),
    t(4, "Charly", "Armar el caso DESPA con número, fecha y fuente", "Sirve para vender el próximo cliente a USD 850"),
    t(4, "Charly", "Definir el foco del mes siguiente y bajarlo a este plan", "El plan nuevo está cargado"),
  ],
  reglas: [
    "Una capa por vez: no se construye un agente nuevo hasta que el anterior esté activo.",
    "Todo se mide desde el día uno. Sin baseline no hay forma de probar que se movió.",
    "El plan se revisa en BRODAWEEK: lunes sprint, miércoles bloqueos, viernes cierre. No en el chat.",
    "Si una tarea no está hecha el viernes, se mueve de semana con motivo, no en silencio.",
  ],
};
