// Los cinco flujos comerciales que más se usan para vender B2B, con el
// email marketing y el seguimiento adentro. Son el punto de partida de
// cualquier cuenta: se bajan al tablero y se adaptan.

import type { Automatizacion } from "./broda";

export interface PasoPlantilla {
  etiqueta: string;
  titulo: string;
  responsable: string;
  herramienta: string;
  agente: string;
  tiempo: string;
  automatizacion: Automatizacion;
  detalle: string;
}

export interface PlantillaB2B {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: PasoPlantilla[];
}

const p = (
  etiqueta: string, titulo: string, responsable: string, herramienta: string,
  tiempo: string, automatizacion: Automatizacion, agente: string, detalle: string
): PasoPlantilla => ({ etiqueta, titulo, responsable, herramienta, agente, tiempo, automatizacion, detalle });

export const PLANTILLAS_B2B: PlantillaB2B[] = [
  {
    id: "inbound",
    nombre: "Inbound — del mensaje a la reunión",
    descripcion: "Alguien levanta la mano por WhatsApp, Instagram o la web y termina con una reunión agendada.",
    pasos: [
      p("Entrada", "Entra la consulta y se crea el contacto en el CRM", "Sistema", "WhatsApp Cloud API · Instagram · Formulario web", "Al instante", "agente", "Entrada de mensajes",
        "Queda con nombre, teléfono y origen. Si ya existía, se suma a su ficha en vez de duplicarlo."),
      p("Respuesta", "Primera respuesta antes de los 5 minutos", "SDR", "Bandeja de conversaciones", "5 min", "asistido", "Calificador inbound",
        "El tiempo de respuesta es lo que más mueve la tasa de reunión. Después de una hora, se cae a la mitad."),
      p("Calificación", "Las tres preguntas: qué necesita, con cuánto cuenta, para cuándo", "SDR", "Agente sobre WhatsApp", "Misma conversación", "manual", "Calificador inbound",
        "No conversa: filtra. Clasifica en calificado, casi calificado o descartado."),
      p("Agenda", "Se ofrece horario y se agenda la reunión", "SDR", "Calendario", "24 hs", "manual", "",
        "Dos opciones concretas de horario, no '¿cuándo te queda cómodo?'. Confirmación por WhatsApp el día anterior."),
      p("Email", "Mail de confirmación con qué vamos a ver", "SDR", "Email", "Al agendar", "manual", "",
        "Asunto: 'Reunión confirmada — [día] [hora]'. Cuerpo: tres puntos de lo que vamos a ver y qué traer. Reduce ausencias."),
      p("Derivación", "Pasa a Calificado con el contexto para el vendedor", "SDR", "CRM", "Al agendar", "asistido", "",
        "El vendedor recibe qué pidió, con cuánto cuenta y de dónde vino. Nunca arranca de cero."),
      p("Descarte", "El que no califica queda en la base para contenido", "SDR", "Base de contactos", "Al cerrar el chat", "manual", "",
        "No se pierde: se etiqueta como fuera de alcance y recibe contenido. Muchos vuelven en seis meses."),
    ],
  },
  {
    id: "outbound",
    nombre: "Outbound en frío — email + LinkedIn",
    descripcion: "Lista de empresas objetivo hasta la primera reunión, sin depender de que nos encuentren.",
    pasos: [
      p("Lista", "Armar la lista de cuentas objetivo del ICP", "Growth Lead", "LinkedIn Sales Navigator · Apollo", "Semanal", "manual", "Investigador de ICP",
        "50 empresas por semana que cumplan el ICP. Nombre, rol del decisor, señal reciente (contrataron, abrieron local, lanzaron producto)."),
      p("Email 1", "Mail de apertura, tres líneas, sin pitch", "SDR", "Instantly · Email", "Día 1", "manual", "Prospector outbound",
        "Asunto de 2 a 4 palabras, en minúscula. Cuerpo: una observación específica de su negocio + una pregunta. Cero adjuntos, cero links en el primer mail."),
      p("LinkedIn", "Visita y pedido de contacto sin nota", "SDR", "LinkedIn", "Día 2", "manual", "",
        "Aparecer en dos canales duplica la tasa de respuesta. La nota de contacto baja la aceptación: se manda sin nota."),
      p("Email 2", "Seguimiento con una prueba concreta", "SDR", "Email", "Día 4", "manual", "Prospector outbound",
        "Responder sobre el mismo hilo. Sumar un caso con número o un dato de su industria. Nunca '¿viste mi mail anterior?'."),
      p("Email 3", "Último toque: la puerta que se cierra", "SDR", "Email", "Día 9", "manual", "Prospector outbound",
        "Una línea: 'Cierro el tema por mi lado, si tiene sentido más adelante avisame'. Es el que más respuestas trae."),
      p("Clasificación", "Clasificar la respuesta y decidir el paso", "SDR", "CRM", "Al responder", "asistido", "Prospector outbound",
        "Interesado → reunión. No por ahora → nurturing. Objeción → responderla. Fuera de ICP → sacar de la lista."),
      p("Reunión", "Reunión agendada y contacto en el pipeline", "SDR", "Calendario · CRM", "—", "manual", "",
        "Entra al mismo pipeline que el inbound, marcado con origen outbound para poder comparar."),
    ],
  },
  {
    id: "nurturing",
    nombre: "Nurturing por email — el que no está listo",
    descripcion: "El que dijo 'más adelante' sigue recibiendo criterio hasta que le toca comprar.",
    pasos: [
      p("Entrada", "Entra el contacto que no está listo", "Sistema", "CRM", "Al etiquetar", "agente", "",
        "Viene de inbound descartado, de outbound 'no por ahora' o de una propuesta perdida por timing."),
      p("Email 1", "Bienvenida: qué van a recibir y cada cuánto", "Growth Lead", "Email", "Día 1", "manual", "",
        "Corto y honesto: un mail cada dos semanas, con cómo resolvemos un problema concreto. Con link para salirse."),
      p("Email 2", "El error más común de su industria", "Growth Lead", "Email", "Semana 2", "manual", "Generador de contenido",
        "Enseñar, no vender. El que educa a tiempo es el que después cobra sin discutir precio."),
      p("Email 3", "Caso con número, fecha y fuente", "Growth Lead", "Email", "Semana 4", "manual", "Agente de casos de éxito",
        "Un cliente parecido, qué hicimos y qué pasó. Sin cifras inventadas: si no hay dato, no se manda."),
      p("Señal", "Detectar señal de intención y avisar al vendedor", "Sistema", "CRM · clics del mail", "Continuo", "manual", "Detector de oportunidades",
        "Abrió tres mails, entró a la web o respondió algo: deja de ser nurturing y vuelve al pipeline."),
      p("Reactivación", "Mail directo de reactivación", "Closer", "Email · WhatsApp", "Al haber señal", "manual", "Seguimiento",
        "'Vi que estuviste mirando X, ¿lo retomamos?'. Va de una persona, no de la lista."),
      p("Limpieza", "Sacar al que no abre hace 90 días", "Growth Lead", "Email", "Trimestral", "manual", "",
        "Una lista sucia baja la entrega de todo lo demás. Se archiva, no se borra."),
    ],
  },
  {
    id: "propuesta",
    nombre: "Propuesta y cierre — seguimiento hasta la firma",
    descripcion: "De la reunión al contrato firmado, con el seguimiento que hace la mayoría de los cierres.",
    pasos: [
      p("Reunión", "Reunión de diagnóstico, grabada", "Closer", "Videollamada", "60 min", "manual", "",
        "Se escucha más de lo que se habla. Al final se acuerda el próximo paso con fecha, nunca 'te mando algo'."),
      p("Propuesta", "Propuesta enviada dentro de las 48 horas", "Closer", "Documento de propuesta", "48 hs", "manual", "Generador de propuestas",
        "Diagnóstico con sus palabras → qué hacemos → cómo se mide → inversión → próximo paso. El precio va en la reunión, el documento lo confirma."),
      p("Email", "Mail de envío con un resumen de tres líneas", "Closer", "Email", "Con la propuesta", "manual", "",
        "El decisor muchas veces no abre el adjunto: el mail tiene que poder leerse solo."),
      p("Seguimiento 1", "A las 48 horas sin respuesta, primer seguimiento", "Closer", "WhatsApp · Email", "48 hs", "manual", "Seguimiento",
        "Aporta algo nuevo: una duda que apareció, un caso, una fecha de arranque. Nunca un recordatorio vacío."),
      p("Seguimiento 2", "A los 5 días, ir a la objeción real", "Closer", "Llamada", "Día 5", "manual", "Seguimiento",
        "Preguntar derecho qué falta para decidir: precio, tiempo, socio o confianza. Cada una se responde distinto."),
      p("Cierre", "Contrato y pago. Pasa a Ganado", "Closer", "CRM · Firma", "—", "manual", "",
        "Al firmar arranca el reloj del onboarding el mismo día, no la semana siguiente."),
      p("Pérdida", "Si se pierde, motivo documentado y a nurturing", "Closer", "CRM", "—", "manual", "",
        "Motivo real, no 'no contestó'. Perdido por precio, por timing o por competidor: se mide distinto."),
    ],
  },
  {
    id: "postventa",
    nombre: "Post-venta — onboarding, expansión y referidos",
    descripcion: "Lo que pasa después de la firma, que es donde está el margen.",
    pasos: [
      p("Kickoff", "Kickoff dentro de los 5 días de la firma", "Client Success", "Videollamada · Checklist", "5 días", "manual", "Agente de onboarding",
        "Accesos, responsables de cada lado y plan 30-60-90 acordado. Sin accesos no arranca el reloj."),
      p("Email", "Mail de bienvenida con el plan y los contactos", "Client Success", "Email", "Al kickoff", "manual", "",
        "Quién es quién, por dónde se escribe y qué va a pasar las primeras dos semanas."),
      p("Primer valor", "Entregar la primera cosa útil en 14 días", "Client Success", "—", "14 días", "manual", "",
        "El cliente tiene que ver algo funcionando antes del primer mes o la relación arranca en deuda."),
      p("Reporte", "Reporte mensual de resultados contra lo pactado", "Client Success", "CRM · Métricas", "Mensual", "manual", "Reportero de resultados",
        "Solo los KPIs que se pactaron. Si uno quedó abajo, se nombra con la causa."),
      p("Salud", "Chequeo de salud de la cuenta cada quince días", "Client Success", "Health score", "Quincenal", "manual", "Health score",
        "Uso, tiempos de respuesta y clima de la relación. Un score bajo avisa a una persona, no queda en el tablero."),
      p("Expansión", "Revisión de plan cuando el volumen lo justifica", "Closer", "CRM", "Trimestral", "manual", "Detector de oportunidades",
        "Solo con la cuenta sana. Se propone con datos de uso, no con ganas de facturar."),
      p("Referido", "Pedido de referido en el hito de éxito", "Client Success", "WhatsApp · Email", "Al haber resultado", "manual", "Agente de referidos",
        "Se pide cuando hay un resultado concreto, mencionándolo. Un referido cierra más rápido y más caro que cualquier lead frío."),
    ],
  },
];
