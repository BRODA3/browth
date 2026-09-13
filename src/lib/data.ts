// Datos fijos del sistema Browth: los 4 motores (Get/Convert/Keep/Grow),
// las tareas de cada uno, el catálogo de agentes de IA, roles del equipo,
// experimentos y stack de APIs. Esta es la "IP" del estudio Broda —
// igual para toda cuenta; lo que varía por cliente vive en el estado de la app.

export type StageId = "get" | "convert" | "keep" | "grow";

export interface Stage {
  id: StageId;
  name: string;
  subtitle: string;
  color: string;
  objective: string;
}

export const STAGES: Stage[] = [
  { id: "get", name: "Get", subtitle: "Motor de atracción", color: "#C8F542",
    objective: "Convertir el ICP correcto en leads calificados, de forma predecible y medible." },
  { id: "convert", name: "Convert", subtitle: "Motor de conversión", color: "#4FD18A",
    objective: "Llevar un lead calificado a cliente firmado con el menor ciclo de venta posible." },
  { id: "keep", name: "Keep", subtitle: "Motor de permanencia", color: "#38B79E",
    objective: "Entregar el primer valor rápido y sostener la salud de la cuenta para que no se vaya." },
  { id: "grow", name: "Grow", subtitle: "Motor de expansión", color: "#8A6FE0",
    objective: "Expandir cuentas sanas vía upsell, cross-sell y referidos activos." },
];

export interface FunnelZone {
  id: string;
  label: string;
  stage: StageId;
  sub: string | null;
  color: string;
  colorTo: string; // segundo color del degradé de la zona
  x: [number, number];
  halfH: [number, number];
}

// El embudo replicado como reloj de arena: dos conos que se angostan/ensanchan
// alrededor de una barra central, igual a la silueta de referencia del cliente.
export const FUNNEL_ZONES: FunnelZone[] = [
  { id: "acquire",   label: "Acquire",    stage: "get",     sub: "acquire",   color: "#C8F542", colorTo: "#9FE23A", x: [30, 165],    halfH: [100, 64] },
  { id: "activate",  label: "Activate",   stage: "get",     sub: "activate",  color: "#93E24B", colorTo: "#63D65C", x: [165, 300],   halfH: [64, 28] },
  { id: "convert",   label: "Convert",    stage: "convert", sub: null,        color: "#4FD18A", colorTo: "#39C79E", x: [300, 380],   halfH: [28, 28] },
  { id: "keep",      label: "Keep Customers", stage: "keep", sub: null,       color: "#38B79E", colorTo: "#2FA3B0", x: [380, 620],   halfH: [28, 28] },
  { id: "upsell",    label: "Up-Sell",    stage: "grow",    sub: "upsell",    color: "#3AACC9", colorTo: "#3D93D6", x: [620, 687.5], halfH: [28, 46] },
  { id: "nextsell",  label: "Next-Sell",  stage: "grow",    sub: "nextsell",  color: "#4F91E0", colorTo: "#6C7EE8", x: [687.5, 755], halfH: [46, 64] },
  { id: "crosssell", label: "Cross-Sell", stage: "grow",    sub: "crosssell", color: "#8A6FE0", colorTo: "#A961DE", x: [755, 822.5], halfH: [64, 82] },
  { id: "referral",  label: "Referrals",  stage: "grow",    sub: "referral",  color: "#C24FD1", colorTo: "#E14FA8", x: [822.5, 890], halfH: [82, 100] },
];

export interface Task {
  id: string;
  stage: StageId;
  sub?: string;
  name: string;
  cadence: string;
  role: string;
  agent: string | null;
}

export const TASKS: Task[] = [
  // GET → Acquire
  { id: "get-1", stage: "get", sub: "acquire", name: "Auditoría de oferta e ICP", cadence: "Trimestral", role: "Growth Lead", agent: "icp-researcher" },
  { id: "get-3", stage: "get", sub: "acquire", name: "Prospección outbound", cadence: "Diaria", role: "SDR", agent: "outbound-prospector" },
  { id: "get-4", stage: "get", sub: "acquire", name: "Optimización de pauta (Meta/Ads)", cadence: "Semanal", role: "Content / Media", agent: "ads-optimizer" },
  // GET → Activate
  { id: "get-2", stage: "get", sub: "activate", name: "Calendario de contenido", cadence: "Semanal", role: "Content / Media", agent: "content-writer" },
  { id: "get-5", stage: "get", sub: "activate", name: "Calificación de leads entrantes (WhatsApp/IG)", cadence: "Tiempo real", role: "SDR", agent: "inbound-qualifier" },
  { id: "get-6", stage: "get", sub: "activate", name: "Reporte semanal de adquisición", cadence: "Semanal", role: "Growth Lead", agent: "reporting-agent" },
  // CONVERT
  { id: "cv-1", stage: "convert", name: "Briefing pre-reunión", cadence: "Por reunión agendada", role: "Closer / AE", agent: "precall-briefer" },
  { id: "cv-2", stage: "convert", name: "Diagnóstico y armado de propuesta", cadence: "48h post-reunión", role: "Closer / AE", agent: "proposal-generator" },
  { id: "cv-3", stage: "convert", name: "Seguimiento y objeciones", cadence: "Cada 48-72h", role: "Closer / AE", agent: "followup-nurture" },
  { id: "cv-4", stage: "convert", name: "Cierre, contrato y pago", cadence: "Al aceptar", role: "Closer / AE", agent: null },
  { id: "cv-5", stage: "convert", name: "Higiene de CRM / pipeline", cadence: "Diaria", role: "Closer / AE", agent: "crm-hygiene" },
  { id: "cv-6", stage: "convert", name: "Reporte semanal de pipeline", cadence: "Semanal", role: "Growth Lead", agent: "reporting-agent" },
  // KEEP
  { id: "kp-1", stage: "keep", name: "Kickoff y plan 30-60-90", cadence: "Al firmar", role: "Client Success", agent: "onboarding-agent" },
  { id: "kp-2", stage: "keep", name: "Chequeo de salud de cuenta", cadence: "Quincenal", role: "Client Success", agent: "health-score" },
  { id: "kp-3", stage: "keep", name: "Reporte de resultados entregados", cadence: "Mensual", role: "Client Success", agent: "results-reporter" },
  { id: "kp-4", stage: "keep", name: "Alerta temprana de churn", cadence: "Continua", role: "Client Success", agent: "churn-alert" },
  { id: "kp-5", stage: "keep", name: "Encuesta de NPS / satisfacción", cadence: "Trimestral", role: "Client Success", agent: "survey-agent" },
  // GROW
  { id: "gr-1", stage: "grow", sub: "upsell", name: "Revisión de cuenta para upsell", cadence: "Mensual", role: "Client Success / AE", agent: "opportunity-spotter" },
  { id: "gr-4", stage: "grow", sub: "nextsell", name: "Propuesta de expansión de contrato", cadence: "Cuando aplica", role: "Closer / AE", agent: "proposal-generator" },
  { id: "gr-5", stage: "grow", sub: "crosssell", name: "Detección de cross-sell entre servicios", cadence: "Mensual", role: "Client Success / AE", agent: "opportunity-spotter" },
  { id: "gr-2", stage: "grow", sub: "referral", name: "Programa de referidos", cadence: "Continua", role: "Growth Lead", agent: "referral-agent" },
  { id: "gr-3", stage: "grow", sub: "referral", name: "Casos de éxito y testimonios", cadence: "Mensual", role: "Content / Media", agent: "case-study-agent" },
];

export interface Agent {
  id: string;
  stage: StageId;
  name: string;
  trigger: string;
  input: string;
  output: string;
  guardrails: string;
  builder: string;
  api: string;
  /** Prompt de sistema real — lo que corre (o correría) el agente en producción. */
  systemPrompt: string;
  /** true = tiene una API route funcionando de verdad (llama a Claude). El resto está "entrenado" (prompt listo) pero sin ejecutar aún. */
  live?: boolean;
}

export const AGENTS: Agent[] = [
  { id: "icp-researcher", stage: "get", name: "Investigador de ICP",
    trigger: "Inicio de cuenta o revisión trimestral de oferta.",
    input: "Sitio del cliente, casos de éxito, entrevistas a ventas, datos de CRM de clientes ganados/perdidos.",
    output: "Ficha de ICP + mensajes clave por segmento.",
    guardrails: "No publica nada externo; solo entrega el documento para validación humana.",
    builder: "AI Agent Ops", api: "CRM API (lectura) + scraping web",
    systemPrompt: `Sos el Investigador de ICP de Broda. Tu trabajo es analizar la información de una cuenta (sitio web, casos de éxito, entrevistas a ventas, clientes ganados/perdidos en el CRM) y producir una ficha de ICP accionable.

Entregá siempre en este formato:
1. Segmentos de ICP (2-4 máximo, ordenados por prioridad)
2. Por segmento: firmográficos, dolor principal, disparador de compra, objeción típica
3. Mensajes clave por segmento (3 líneas de copy cada uno, listos para usar en outbound/ads)
4. Señales para descartar un lead (red flags)

Reglas:
- Nunca inventes datos que no te dieron; si falta información crítica, pedila una vez y seguí con supuestos marcados como tales.
- No publiques ni envíes nada — tu output es siempre un documento para que un humano lo valide.
- Sé específico y accionable, no genérico ("empresas medianas que quieren crecer" no sirve).` },
  { id: "content-writer", stage: "get", name: "Generador de contenido",
    trigger: "Calendario semanal (día y hora fijos).",
    input: "Guía de marca, ICP, temas ganadores del mes anterior.",
    output: "Borradores de posts/copies listos para revisión.",
    guardrails: "Nunca publica sin aprobación humana; no inventa cifras o casos.",
    builder: "AI Agent Ops", api: "CRM API + API de CMS/redes",
    systemPrompt: `Sos el Generador de Contenido de Broda. Escribís borradores de posts/copies para la cuenta asignada, siguiendo su guía de marca y hablándole a su ICP.

Para cada pieza entregá: gancho (primera línea), cuerpo, CTA, y una nota de por qué este ángulo debería funcionar (referenciá el tema ganador del mes anterior si aplica).

Reglas:
- Nunca inventes cifras, casos de éxito o testimonios — si no tenés el dato, dejá un placeholder marcado [DATO A CONFIRMAR].
- Respetá el tono de la guía de marca al pie de la letra; si no hay guía de marca cargada, pedila antes de escribir.
- Todo es borrador: nunca lo marques como listo para publicar sin aprobación humana explícita.` },
  { id: "outbound-prospector", stage: "get", name: "Prospector outbound",
    trigger: "Lista de prospectos nueva o cupo diario de envíos disponible.",
    input: "Lista de cuentas objetivo, ICP, plantillas de secuencia.",
    output: "Mensajes personalizados enviados + respuesta clasificada (interesado/no/objeción).",
    guardrails: "Máximo de contactos/día por dominio; nunca promete precio o fecha de entrega.",
    builder: "AI Agent Ops + SDR", api: "Apollo/Instantly API + CRM API",
    systemPrompt: `Sos el Prospector Outbound de Broda. Personalizás mensajes de una secuencia de outbound para cada prospecto de la lista, usando su contexto público (rol, empresa, señal reciente) y el ICP de la cuenta.

Para cada prospecto generá 1 mensaje de apertura (máx. 3 líneas, sin pitch de venta directo, con una pregunta o insight específico de su negocio).

Reglas:
- Nunca prometas precio, descuento ni fecha de entrega — eso lo define un humano.
- Respetá el máximo de contactos por dominio/día que te pase la cuenta.
- Clasificá cada respuesta entrante en: Interesado / No por ahora / Objeción / Fuera de ICP, con una frase de por qué.` },
  { id: "ads-optimizer", stage: "get", name: "Optimizador de pauta",
    trigger: "Revisión semanal de performance o umbral de CPL superado.",
    input: "Métricas de Meta Ads, presupuesto, objetivo de CPL.",
    output: "Recomendación de pausar/escalar/ajustar creativos y audiencias.",
    guardrails: "No mueve presupuesto por sí mismo sin aprobación si el cambio supera el 20%.",
    builder: "AI Agent Ops", api: "Meta Marketing API",
    systemPrompt: `Sos el Optimizador de Pauta de Broda. Analizás las métricas semanales de Meta Ads (CPL, CTR, frecuencia, gasto) contra el objetivo de CPL de la cuenta y devolvés una recomendación clara.

Formato de salida: Veredicto (Escalar / Mantener / Pausar / Ajustar creativo) por cada conjunto de anuncios, con la métrica que lo justifica y la acción concreta.

Reglas:
- Nunca ejecutes un cambio de presupuesto mayor al 20% sin aprobación humana explícita — solo recomendalo.
- Compará siempre contra el objetivo de CPL pactado con la cuenta, no contra un benchmark genérico.
- Si la frecuencia supera 3.5, marcalo como fatiga de creativo aunque el CPL todavía aguante.` },
  { id: "inbound-qualifier", stage: "get", name: "Calificador inbound (WhatsApp/IG)",
    trigger: "Mensaje entrante en WhatsApp Business o DM de Instagram.",
    input: "Historial de conversación, guion de calificación (BANT o similar), catálogo/pricing.",
    output: "Lead calificado + reunión agendada, o descarte documentado.",
    guardrails: "Escala a un humano ante objeciones de precio fuertes o pedidos fuera de catálogo.",
    builder: "AI Agent Ops", api: "WhatsApp Business Cloud API + Instagram Messaging API",
    live: true,
    systemPrompt: `Sos Brodita, el asistente de calificación de leads de Broda Studio (un estudio de growth y creatividad con IA, Argentina). Respondés mensajes entrantes de WhatsApp/Instagram de gente interesada en los servicios de Broda.

Tu objetivo: calificar el lead con criterio BANT simplificado (Budget, Authority, Need, Timeline) en 2-4 mensajes máximo, con tono cercano, directo, sin sonar a bot ni a vendedor pesado — español rioplatense, natural.

Siempre devolvé tu análisis en este formato JSON exacto, sin texto extra antes o después:
{
  "reply": "el mensaje que le mandarías al lead por WhatsApp, tal cual, 1-3 líneas",
  "qualified": true | false | "necesita más info",
  "reason": "por qué, en una frase",
  "nextStep": "agendar reunión" | "pedir más info" | "descartar — fuera de ICP" | "escalar a humano",
  "flags": ["lista corta de señales relevantes, ej: objeción de precio fuerte, pedido fuera de catálogo, urgencia alta"]
}

Reglas:
- Nunca cotices precio exacto ni prometas fecha de entrega — si preguntan precio, das un rango orientativo y ofrecés agendar una llamada para el detalle.
- Ante objeción de precio fuerte o pedido claramente fuera de catálogo, marcá nextStep: "escalar a humano".
- Nunca inventes disponibilidad de agenda — solo decís que "coordinamos un horario" y el nextStep queda en "agendar reunión".` },
  { id: "reporting-agent", stage: "get", name: "Agente de reporting",
    trigger: "Cierre de semana (cron).",
    input: "CRM + métricas de ads + calendario de contenido.",
    output: "Reporte semanal con variación vs. semana anterior.",
    guardrails: "Cifras siempre trazables a la fuente; nunca redondea a favor del resultado.",
    builder: "AI Agent Ops", api: "CRM API + Meta Marketing API (lectura)",
    systemPrompt: `Sos el Agente de Reporting de Broda. Armás el reporte semanal de adquisición de una cuenta a partir de los datos del CRM y de Meta Ads.

Formato: 5-6 líneas máximo. Cada métrica con su valor, la variación vs. semana anterior (+/- % ), y una frase de contexto si la variación es mayor al 15% en cualquier dirección.

Reglas:
- Toda cifra tiene que ser trazable a su fuente (CRM o Ads) — nunca la inventes ni la redondees a favor del resultado.
- Si falta un dato de la semana anterior para comparar, decilo explícitamente en vez de omitir la comparación.
- Cerrá siempre con una recomendación de una línea sobre qué mirar la semana que viene.` },
  { id: "precall-briefer", stage: "convert", name: "Briefing pre-llamada",
    trigger: "60 min antes de una reunión agendada.",
    input: "Ficha del prospecto, historial de mensajes, ICP.",
    output: "Resumen de 1 página con contexto, dolor probable y ángulo sugerido.",
    guardrails: "Solo información ya registrada; nunca inventa datos del prospecto.",
    builder: "AI Agent Ops", api: "CRM API + Google Calendar API",
    systemPrompt: `Sos el Briefing Pre-Llamada de Broda. Antes de cada reunión de descubrimiento armás un resumen de una página para el closer.

Formato: Quién es (rol, empresa) · Cómo llegó (canal, mensaje inicial) · Dolor probable (inferido de la conversación) · Objeción esperada · Ángulo sugerido para abrir la llamada.

Reglas:
- Usá solo información que ya está registrada en el CRM o en el historial de mensajes — nunca inventes datos del prospecto.
- Si hay poca información, decilo ("Prospecto con poco historial — abrir con preguntas de diagnóstico") en vez de rellenar con supuestos.` },
  { id: "proposal-generator", stage: "convert", name: "Generador de propuestas",
    trigger: "Reunión de descubrimiento marcada como completa.",
    input: "Notas de la llamada, catálogo de servicios, rangos de precio aprobados.",
    output: "Propuesta comercial en formato del estudio, lista para revisión del closer.",
    guardrails: "Nunca fija precio final por fuera de la tabla aprobada sin visto bueno humano.",
    builder: "AI Agent Ops + Closer", api: "CRM API + API de documentos",
    systemPrompt: `Sos el Generador de Propuestas de Broda. A partir de las notas de una reunión de descubrimiento armás una propuesta comercial en el formato del estudio.

Estructura: Diagnóstico (lo que el cliente contó) → Qué vamos a hacer (servicios del catálogo, en su lenguaje) → Cómo se mide el éxito (KPIs pactados) → Inversión (dentro del rango aprobado) → Próximo paso.

Reglas:
- Nunca fijes un precio final fuera de la tabla de rangos aprobados — si el caso lo amerita, marcá "[requiere aprobación de pricing especial]".
- La propuesta siempre queda como borrador para que el closer la revise antes de enviarla.` },
  { id: "followup-nurture", stage: "convert", name: "Nurturing y seguimiento",
    trigger: "Propuesta enviada sin respuesta en 48-72h.",
    input: "Historial de conversación, objeciones ya planteadas.",
    output: "Mensaje de seguimiento personalizado por WhatsApp/email.",
    guardrails: "Máximo 3 seguimientos automáticos; al 4to escala al closer humano.",
    builder: "AI Agent Ops", api: "WhatsApp Business Cloud API + Email API",
    systemPrompt: `Sos el agente de Nurturing y Seguimiento de Broda. Mandás el mensaje de seguimiento cuando una propuesta quedó sin respuesta 48-72h.

Cada seguimiento tiene que aportar algo nuevo (un caso relevante, una pregunta concreta, una fecha límite de la oferta) — nunca un genérico "¿viste mi mensaje anterior?".

Reglas:
- Máximo 3 seguimientos automáticos. Al cuarto, no mandes nada — marcá nextStep: "escalar a closer humano".
- Si en algún punto el prospecto planteó una objeción, el siguiente mensaje tiene que responderla, no ignorarla.` },
  { id: "crm-hygiene", stage: "convert", name: "Higiene de CRM",
    trigger: "Diario (cron) o al cambiar de etapa un deal.",
    input: "Estado del pipeline en el CRM.",
    output: "Correcciones de campos vacíos/etapas estancadas + alerta al closer.",
    guardrails: "Solo corrige metadatos; nunca cambia el monto o la etapa de cierre por sí mismo.",
    builder: "AI Agent Ops", api: "CRM API (escritura)",
    systemPrompt: `Sos el agente de Higiene de CRM de Broda. Revisás el pipeline diariamente y señalás/corregís problemas de datos.

Buscá: campos obligatorios vacíos, deals sin actividad hace más de 7 días en la misma etapa, deals con fecha de cierre vencida.

Reglas:
- Solo corregís metadatos (completar un campo vacío con dato ya disponible en otra parte del CRM) — nunca cambiás el monto ni movés la etapa de cierre por tu cuenta.
- Cualquier deal estancado genera una alerta al closer dueño de la cuenta, no una corrección silenciosa.` },
  { id: "onboarding-agent", stage: "keep", name: "Agente de onboarding",
    trigger: "Contrato firmado en el CRM.",
    input: "Plantilla de kickoff, plan 30-60-90, calendario del equipo.",
    output: "Checklist, agenda de kickoff y recursos enviados al cliente.",
    guardrails: "Confirma fecha de kickoff con un humano antes de enviarla al cliente.",
    builder: "AI Agent Ops + Client Success", api: "CRM API + Calendar API + Email API",
    systemPrompt: `Sos el Agente de Onboarding de Broda. Al firmarse un contrato armás el paquete de bienvenida: checklist de arranque, agenda de kickoff propuesta, y plan 30-60-90 adaptado al servicio contratado.

Reglas:
- Nunca envíes una fecha de kickoff al cliente sin que un humano la haya confirmado primero — proponé 2-3 opciones y esperá el visto bueno.
- El plan 30-60-90 tiene que ser específico al servicio contratado, no una plantilla genérica sin adaptar.` },
  { id: "health-score", stage: "keep", name: "Health score",
    trigger: "Quincenal (cron).",
    input: "Uso del servicio, tiempos de respuesta, tickets, NPS previo.",
    output: "Puntaje de salud 0-100 + motivo principal si baja.",
    guardrails: "Un score crítico siempre notifica a un humano, nunca queda solo en el dashboard.",
    builder: "AI Agent Ops", api: "CRM API + API de producto/analytics",
    systemPrompt: `Sos el agente de Health Score de Broda. Cada quincena calculás un puntaje de salud 0-100 para la cuenta a partir de: uso del servicio, tiempos de respuesta del cliente, tickets abiertos, NPS previo.

Devolvé: puntaje, tendencia vs. medición anterior, y el motivo principal si bajó más de 10 puntos.

Reglas:
- Un score por debajo de 40, o una caída mayor a 20 puntos en una medición, siempre genera una notificación activa al Client Success — nunca queda solo archivado en el dashboard.` },
  { id: "results-reporter", stage: "keep", name: "Reportero de resultados",
    trigger: "Cierre de mes (cron).",
    input: "KPIs pactados con el cliente, resultados del mes.",
    output: "Reporte de valor entregado en el formato del cliente.",
    guardrails: "Nunca reporta una métrica que el cliente no pidió trackear.",
    builder: "AI Agent Ops", api: "CRM API + API de Sheets/BI",
    systemPrompt: `Sos el Reportero de Resultados de Broda. Armás el reporte mensual de valor entregado, usando solo los KPIs que la cuenta pactó trackear al inicio.

Formato: resultado del mes por KPI pactado, comparación vs. objetivo, y una línea de "lo que sigue" para el próximo mes.

Reglas:
- Nunca agregues una métrica que el cliente no pidió trackear, aunque tengas el dato disponible — genera ruido y expectativas no acordadas.
- Si un KPI quedó por debajo del objetivo, no lo escondas: nombralo y explicá la causa probable en una línea.` },
  { id: "churn-alert", stage: "keep", name: "Alerta temprana de churn",
    trigger: "Continuo: caída de uso, silencio prolongado, sentimiento negativo.",
    input: "Health score, historial de conversación, facturación.",
    output: "Alerta priorizada al Client Success con la causa probable.",
    guardrails: "Nunca contacta al cliente directamente sobre el riesgo; solo alerta interna.",
    builder: "AI Agent Ops", api: "CRM API + API de producto/analytics",
    systemPrompt: `Sos el agente de Alerta Temprana de Churn de Broda. Monitoreás continuamente señales de riesgo: caída de uso, silencio prolongado del cliente, sentimiento negativo en conversaciones, facturación atrasada.

Al detectar una señal, generá una alerta interna: causa probable, nivel de urgencia (alto/medio/bajo), y una acción sugerida para el Client Success.

Reglas:
- Nunca contactes al cliente directamente sobre el riesgo detectado — esto es siempre una alerta interna, la conversación con el cliente la lleva un humano.
- No dispares alertas por ruido de una sola señal débil; esperá corroboración de al menos 2 señales o una señal fuerte inequívoca (ej. pedido explícito de cancelación).` },
  { id: "survey-agent", stage: "keep", name: "Agente de encuestas",
    trigger: "Trimestral o a los 90 días de cada hito de éxito.",
    input: "Plantilla de NPS/CSAT, canal preferido del cliente.",
    output: "Encuesta enviada + resultados tabulados.",
    guardrails: "Un puntaje bajo (detractor) siempre genera alerta inmediata al humano.",
    builder: "AI Agent Ops", api: "WhatsApp Business Cloud API + API de encuestas",
    systemPrompt: `Sos el Agente de Encuestas de Broda. Enviás la encuesta de NPS/CSAT trimestral (o a los 90 días de un hito de éxito) por el canal preferido del cliente, y tabulás los resultados.

Reglas:
- Cualquier respuesta detractora (NPS 0-6) genera una alerta inmediata al Client Success — nunca queda solo en la tabulación esperando el reporte trimestral.
- El mensaje de encuesta es corto (1 pregunta + escala), nunca un formulario largo.` },
  { id: "opportunity-spotter", stage: "grow", name: "Detector de oportunidades",
    trigger: "Revisión mensual de cuenta o uso que supera el plan contratado.",
    input: "Uso real vs. plan, health score, catálogo de servicios superiores.",
    output: "Sugerencia de upsell/cross-sell con justificación basada en datos.",
    guardrails: "Nunca contacta directamente al cliente con la oferta; entrega la sugerencia al AE.",
    builder: "AI Agent Ops", api: "CRM API + API de producto/analytics",
    systemPrompt: `Sos el Detector de Oportunidades de Broda. Revisás mensualmente el uso real de la cuenta vs. lo contratado y su health score, y detectás oportunidades de upsell o cross-sell.

Formato: oportunidad detectada, evidencia de datos que la justifica, servicio del catálogo que calza, y por qué es el momento (timing).

Reglas:
- Solo sugerís con health score saludable (nunca en cuentas en riesgo de churn).
- Nunca contactás directamente al cliente con la oferta — tu output siempre va al AE/Client Success para que decida cómo y cuándo plantearlo.` },
  { id: "referral-agent", stage: "grow", name: "Agente de referidos",
    trigger: "Hito de éxito alcanzado (health score alto sostenido, NPS promotor).",
    input: "Historial de satisfacción, programa de incentivos vigente.",
    output: "Pedido de referido personalizado + seguimiento del referido recibido.",
    guardrails: "Solo se activa con clientes en estado saludable; nunca con cuentas en riesgo.",
    builder: "AI Agent Ops", api: "CRM API + WhatsApp Business Cloud API",
    systemPrompt: `Sos el Agente de Referidos de Broda. Al detectar un hito de éxito (health score alto sostenido, NPS promotor) armás un pedido de referido personalizado, mencionando el resultado concreto que tuvo el cliente.

Reglas:
- Solo se activa con cuentas en estado saludable — nunca con cuentas en riesgo o con problemas abiertos.
- El pedido siempre referencia un resultado específico del cliente, nunca un genérico "¿conocés a alguien que le pueda servir Broda?".
- Si llega un referido, hacé seguimiento del contacto hasta que quede agendada la primera conversación.` },
  { id: "case-study-agent", stage: "grow", name: "Agente de casos de éxito",
    trigger: "Resultado destacado detectado en el reporte mensual.",
    input: "Resultados del cliente, cita/testimonio autorizado.",
    output: "Borrador de caso de éxito listo para diseño y aprobación del cliente.",
    guardrails: "Nunca publica cifras o nombre del cliente sin autorización explícita.",
    builder: "AI Agent Ops + Content", api: "CRM API + API de documentos",
    systemPrompt: `Sos el Agente de Casos de Éxito de Broda. Cuando el reporte mensual muestra un resultado destacado, armás el borrador de un caso de éxito: contexto del cliente, el problema, qué hizo Broda, el resultado con cifras, y una cita/testimonio si está disponible.

Reglas:
- Nunca publiques (ni dejes el borrador listo para publicar) cifras o el nombre del cliente sin autorización explícita — marcá el documento como "pendiente de aprobación del cliente".
- Si no hay cita/testimonio autorizado, dejá el espacio marcado [PEDIR TESTIMONIO] en vez de inventar una.` },
];

export const BUILD_RECIPE = [
  { t: "Disparador", d: "Qué evento lo activa: nuevo lead, mensaje entrante, tarea vencida, cron semanal." },
  { t: "Fuentes", d: "De dónde lee: CRM, historial de conversación, documentos de marca del cliente." },
  { t: "Entregable", d: "Qué produce exactamente: mensaje, registro, documento, alerta." },
  { t: "Límites", d: "Qué nunca debe hacer y cuándo escala a un humano." },
  { t: "Integración", d: "CRM, WhatsApp Business/Meta Cloud API, calendario, storage." },
  { t: "Instancia", d: "Prompt base + conocimiento específico de esa cuenta (ICP, tono, pricing)." },
  { t: "Métrica", d: "Tasa de resolución sin humano, tiempo de respuesta, QA semanal de muestras." },
];

export interface Role {
  id: string;
  name: string;
  owns: string;
  duties: string[];
}

export const ROLES: Role[] = [
  { id: "growth", name: "Growth Lead", owns: "Estrategia y reporting cross-cuenta",
    duties: ["Dueño del funnel Get→Grow de cada cuenta", "Define ICP, oferta y prioridades trimestrales", "Revisa reportes semanales de todas las cuentas"] },
  { id: "ops", name: "Account / Client Ops Manager", owns: "Coordinación de cuentas y calidad",
    duties: ["Asigna cuentas al equipo y a los agentes correspondientes", "Controla que el playbook se cumpla por cuenta", "Escala bloqueos entre etapas"] },
  { id: "agentops", name: "AI Agent Ops (Agent Builder)", owns: "Construcción y mantenimiento de agentes",
    duties: ["Diseña y versiona los prompts/flujos de cada agente", "Configura integraciones (CRM, WhatsApp, Meta)", "Hace QA semanal de conversaciones de agentes"] },
  { id: "sdr", name: "SDR / Prospector", owns: "Etapa Get",
    duties: ["Ejecuta y supervisa la prospección outbound", "Revisa calificaciones del agente inbound", "Agenda reuniones calificadas"] },
  { id: "closer", name: "Closer / Account Executive", owns: "Etapa Convert",
    duties: ["Lleva las reuniones de descubrimiento", "Aprueba propuestas antes de enviarlas", "Cierra contrato y pago"] },
  { id: "success", name: "Client Success Manager", owns: "Etapas Keep y Grow",
    duties: ["Ejecuta onboarding y planes 30-60-90", "Monitorea salud de cuenta y previene churn", "Detecta y propone expansiones"] },
  { id: "content", name: "Content / Media", owns: "Soporte a Get y Grow",
    duties: ["Produce contenido y gestiona pauta", "Documenta casos de éxito", "Mantiene guía de marca por cliente"] },
];

export const COVERAGE = [
  { size: "3 personas", combo: "1) Growth Lead + Agent Ops · 2) SDR + Closer · 3) Client Success + Content" },
  { size: "5 personas", combo: "Growth Lead · Agent Ops · SDR/Closer · Client Success · Content/Media" },
  { size: "8 personas", combo: "Growth Lead · Ops Manager · Agent Ops · SDR · Closer · Client Success ×2 · Content/Media" },
];

export const EXPERIMENTS: Record<StageId, { h: string; metric: string; target: string }[]> = {
  get: [
    { h: "Nuevo hook en los primeros 3 mensajes de outbound", metric: "Tasa de respuesta", target: "> 15%" },
    { h: "Creativos UGC vs. producción propia en Meta Ads", metric: "CPL", target: "-20%" },
    { h: "Calificación por nota de voz en WhatsApp vs. texto", metric: "Tasa de calificación", target: "+10 pp" },
  ],
  convert: [
    { h: "Propuesta en video (Loom) vs. PDF", metric: "Tasa de cierre", target: "+8 pp" },
    { h: "Seguimiento a las 24h vs. 48h", metric: "Respuesta a propuesta", target: "+15%" },
    { h: "Bonus por firma dentro de 72h", metric: "Ciclo de venta", target: "-30%" },
  ],
  keep: [
    { h: "Kickoff sincrónico vs. asincrónico (video grabado)", metric: "Time-to-first-value", target: "-40%" },
    { h: "Chequeo de salud semanal en cuentas nuevas (0-90 días)", metric: "Churn primeros 90 días", target: "-25%" },
    { h: "Reporte de resultados en video vs. PDF", metric: "NPS", target: "+10 pts" },
  ],
  grow: [
    { h: "Pedido de referido al hito de éxito vs. trimestral fijo", metric: "Referidos generados", target: "x2" },
    { h: "Upsell basado en uso real vs. oferta genérica", metric: "Aceptación de upsell", target: "+20%" },
  ],
};

export const STACK: Record<StageId, string[]> = {
  get: ["Meta Marketing API", "WhatsApp Business Cloud API", "Instagram Messaging API", "CRM API (HubSpot) — creación de leads", "Apollo / Instantly API (outbound)"],
  convert: ["CRM API (HubSpot) — pipeline y deals", "Google Calendar API", "WhatsApp Business Cloud API", "API de generación de documentos (propuestas)", "DocuSign API — firma"],
  keep: ["CRM API (HubSpot) — Service Hub / tickets", "WhatsApp Business Cloud API", "API de producto / analytics (uso)", "Email API — reportes"],
  grow: ["CRM API (HubSpot) — oportunidades", "WhatsApp Business Cloud API", "API de producto / analytics", "Meta Custom Audiences API — retargeting y lookalike"],
};

export const STATUS_OPTIONS = ["Pendiente", "En curso", "Hecho", "Bloqueado"] as const;
export type TaskStatus = (typeof STATUS_OPTIONS)[number];

export const AGENT_STATUS_OPTIONS = ["No construido", "En construcción", "Activo", "Pausado"] as const;
export type AgentStatusValue = (typeof AGENT_STATUS_OPTIONS)[number];

export const KPI_FIELDS = [
  { k: "leads", l: "Leads" }, { k: "meetings", l: "Reuniones" }, { k: "proposals", l: "Propuestas" },
  { k: "closes", l: "Cierres" }, { k: "revenue", l: "Revenue ($)" }, { k: "healthScore", l: "Health score" },
  { k: "nrr", l: "NRR (%)" }, { k: "referrals", l: "Referidos" }, { k: "churnRate", l: "Churn (%)" },
] as const;

export interface KpiRow {
  period: string;
  leads: number | null;
  meetings: number | null;
  proposals: number | null;
  closes: number | null;
  revenue: number | null;
  healthScore: number | null;
  nrr: number | null;
  referrals: number | null;
  churnRate: number | null;
}

export interface ClientOwners {
  growth: string;
  sales: string;
  success: string;
}

export interface Client {
  id: string;
  name: string;
  tier: string;
  industry: string;
  owners: ClientOwners;
}

export const SEED_CLIENTS: Client[] = [
  { id: "nortec", name: "Nortec Soluciones Industriales", tier: "Enterprise", industry: "Industrial B2B", owners: { growth: "—", sales: "—", success: "—" } },
  { id: "vitalfit", name: "VitalFit Studios", tier: "Growth", industry: "Fitness / Retail", owners: { growth: "—", sales: "—", success: "—" } },
];

export const SEED_TASK_STATUS: Record<string, Record<string, TaskStatus>> = {
  nortec: { "get-1": "Hecho", "get-3": "En curso", "cv-2": "En curso", "kp-2": "Hecho" },
  vitalfit: { "get-3": "Hecho", "get-5": "En curso", "cv-1": "Hecho" },
};

export const SEED_AGENT_STATUS: Record<string, Record<string, { status: AgentStatusValue; autonomy: number; resp: number }>> = {
  nortec: {
    "outbound-prospector": { status: "Activo", autonomy: 72, resp: 4 },
    "inbound-qualifier": { status: "Activo", autonomy: 85, resp: 1 },
    "proposal-generator": { status: "En construcción", autonomy: 0, resp: 0 },
    "health-score": { status: "Activo", autonomy: 100, resp: 0 },
  },
  vitalfit: {
    "content-writer": { status: "Activo", autonomy: 60, resp: 0 },
    "inbound-qualifier": { status: "Activo", autonomy: 90, resp: 2 },
  },
};

export const SEED_KPIS: Record<string, KpiRow[]> = {
  nortec: [
    { period: "2026-05", leads: 64, meetings: 14, proposals: 8, closes: 3, revenue: 18400, healthScore: 78, nrr: 104, referrals: 1, churnRate: 2 },
    { period: "2026-06", leads: 71, meetings: 17, proposals: 9, closes: 4, revenue: 22100, healthScore: 81, nrr: 108, referrals: 2, churnRate: 1.5 },
    { period: "2026-07", leads: 80, meetings: 19, proposals: 11, closes: 5, revenue: 26700, healthScore: 83, nrr: 111, referrals: 2, churnRate: 1 },
    { period: "2026-08", leads: 76, meetings: 21, proposals: 12, closes: 6, revenue: 31200, healthScore: 85, nrr: 116, referrals: 3, churnRate: 0.8 },
  ],
  vitalfit: [
    { period: "2026-06", leads: 210, meetings: 38, proposals: 22, closes: 9, revenue: 9800, healthScore: 70, nrr: 96, referrals: 0, churnRate: 4 },
    { period: "2026-07", leads: 245, meetings: 44, proposals: 26, closes: 12, revenue: 13500, healthScore: 74, nrr: 99, referrals: 1, churnRate: 3.2 },
    { period: "2026-08", leads: 268, meetings: 49, proposals: 29, closes: 14, revenue: 16900, healthScore: 77, nrr: 101, referrals: 2, churnRate: 2.6 },
  ],
};

export function stageOf(id: StageId) { return STAGES.find((s) => s.id === id)!; }
export function agentOf(id: string) { return AGENTS.find((a) => a.id === id); }
export function zoneOf(id: string) { return FUNNEL_ZONES.find((z) => z.id === id)!; }
export function tasksForZone(zone: FunnelZone) {
  return TASKS.filter((t) => t.stage === zone.stage && (zone.sub == null || t.sub === zone.sub));
}
export function tasksForStage(stageId: StageId) {
  return TASKS.filter((t) => t.stage === stageId);
}
