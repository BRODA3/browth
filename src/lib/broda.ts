// Datos reales de Broda Studio (no ficticios) — portados desde el documento
// interno "BRODA · Dirección y Orden". Fuente de verdad para North Star,
// Business Case, Infraestructura comercial y Equipo.

export type EstadoCapa = "hecho" | "foco" | "falta";

export interface LineaNegocio {
  nombre: string;
  desc: string;
  estado: "activa" | "construccion" | "diferida";
  etiqueta: string;
}

export const LINEAS: LineaNegocio[] = [
  { nombre: "BROWTH", desc: "Infraestructura comercial y ventas para empresas", estado: "activa", etiqueta: "Activa · es el negocio" },
  { nombre: "BRODAI", desc: "Orquestamos agentes a medida", estado: "construccion", etiqueta: "En construcción · interna" },
  { nombre: "BRODCAST", desc: "Podcast para emprendedores y empresarios", estado: "diferida", etiqueta: "Piloto en noviembre" },
  { nombre: "HOUSE OF BRODA", desc: "Formación de equipos y oportunidades", estado: "diferida", etiqueta: "Diferida" },
  { nombre: "BROVIAJES", desc: "Viajes a medida para empresas, en alianza con una agencia", estado: "diferida", etiqueta: "Diferida" },
];

export const LINEAS_TABLA = {
  encabezados: ["Línea", "Qué la desbloquea", "Por qué todavía no"],
  filas: [
    ["BROWTH", "Nada. Es lo que facturamos hoy.", "Es el único foco del trimestre. Todo lo demás sale de acá."],
    ["BRODAI", "Que BROWTH tenga procesos documentados", "No se automatiza lo que no está escrito. Primero corre adentro nuestro, después en una cuenta, recién ahí se vende."],
    ["BRODCAST", "Un caso con número propio y el nicho definido", "Sin un resultado verificable no hay autoridad para hablar."],
    ["HOUSE OF BRODA", "Que el servicio tenga volumen estable", "Formar equipos exige un método probado varias veces."],
    ["BROVIAJES", "Una cartera B2B consolidada y la agencia socia elegida", "En alianza: la agencia pone la operación, BRODA pone la marca y la relación con el cliente. Riesgo bajo, pero requiere una cartera a la que ofrecérselo. Apareció mientras bajábamos la estrategia del trimestre: se anota y se difiere."],
  ],
};

export const LINEAS_NOTA = {
  titulo: "La regla",
  texto: "Cuando una línea nueva aparece cerca de una entrega, no es una oportunidad: es una forma de no ejecutar la que está abierta. Se anota y se difiere.",
};

export interface CapaEmbudo {
  id: string;
  n: string;
  nombre: string;
  quien: string;
  estado: EstadoCapa;
  sub?: string;
  proceso: string[];
  tareas: string[];
  estadoTexto: string;
}

export const CAPAS: CapaEmbudo[] = [
  { id: "atraer", n: "01", nombre: "Atraer", quien: "Thiago", estado: "hecho",
    proceso: ["Contenido orgánico con un solo destino", "Pauta de conversión, no de alcance", "Creativos anclados a un conjunto separado"],
    tareas: ["Revisión de creativos por cuenta, semanal", "Costo por consulta medido", "Apagar lo que no convierte en siete días"],
    estadoTexto: "Funcionando. Es lo que mejor hacemos y por eso no es donde se pierde la plata." },
  { id: "capturar", n: "02", nombre: "Capturar", quien: "Tomi", estado: "hecho",
    proceso: ["Todo va a un solo canal de conversación", "Ese canal está conectado al CRM por API", "Cada contacto entra con nombre, número y origen"],
    tareas: ["Conectar APIs de WhatsApp, Instagram, Meta y web", "Formulario mínimo: qué querés, con cuánto, tu mail", "Base de datos unificada, nada suelto"],
    estadoTexto: "A medias. El tráfico llega, pero se dispersa en chats sueltos. Sin base de datos no hay seguimiento ni recompra." },
  { id: "calificar", n: "03", nombre: "Calificar", quien: "Tomi", estado: "hecho",
    proceso: ["Agente que hace tres preguntas. No conversa: filtra.", "Clasifica en calificado, casi calificado o descartado", "Lo calificado pasa al vendedor con contexto"],
    tareas: ["Definir las tres preguntas por cliente", "Etiquetado automático en el CRM", "Medir el porcentaje de calificados sobre el total"],
    estadoTexto: "El trabajo de octubre. Hoy es manual. Funciona hasta los treinta chats; después colapsa." },
  { id: "convertir", n: "04", nombre: "Convertir", quien: "Charly + Thiago", estado: "foco", sub: "acá está la venta",
    proceso: ["Pipeline con etapas: calificado, reunión, propuesta, cierre", "El precio se da en la reunión, no antes", "Agente de seguimiento a las 48 horas sin respuesta", "Reuniones grabadas y revisadas"],
    tareas: ["Escribir el speech y el framework de objeciones", "Revisión semanal de dónde se traba el pipeline", "Reporte automático por cada acción del vendedor"],
    estadoTexto: "El cuello. Acá está la venta y acá es donde no controlamos nada, porque cierra el dueño o un vendedor que no es nuestro." },
  { id: "retener", n: "05", nombre: "Retener", quien: "Charly + Tomi", estado: "falta",
    proceso: ["Comunidad donde el cliente sigue viendo oportunidades", "Secuencias de mail a la base completa", "El que no compró queda adentro, no se pierde"],
    tareas: ["Armar y moderar la comunidad", "Calendario de envíos a la base", "Medir recompra y renovación"],
    estadoTexto: "No existe. Es lo más barato de construir y lo que más margen deja, porque el cliente ya está adentro." },
  { id: "expandir", n: "06", nombre: "Expandir", quien: "Charly + Thiago", estado: "falta",
    proceso: ["Subir al cliente de plan cuando el volumen lo justifica", "El caso de éxito alimenta la capa 01"],
    tareas: ["Revisión trimestral de plan por cuenta", "Documentar el caso con número, fecha y fuente"],
    estadoTexto: "No existe. Sin las capas 02 a 05 funcionando, esto es imposible de sostener." },
  { id: "referir", n: "06", nombre: "Referir", quien: "Charly + Thiago", estado: "falta",
    proceso: ["Que el cliente traiga clientes", "Programa de referidos con incentivo claro"],
    tareas: ["Programa de referidos con incentivo claro", "Documentar el caso con número, fecha y fuente"],
    estadoTexto: "No existe. Sin las capas 02 a 05 funcionando, esto es imposible de sostener." },
];

export const EMBUDO_META = {
  entradas: ["Orgánico", "Pauta", "Web", "Referidos"],
  zonaIzq: "CONSEGUIR CLIENTES",
  zonaDer: "HACERLOS CRECER",
  loop: "un cliente que crece vuelve a alimentar el embudo",
  leyenda: [
    { tipo: "hecho" as EstadoCapa, texto: "Ya lo hacemos" },
    { tipo: "foco" as EstadoCapa, texto: "El trabajo de este trimestre" },
    { tipo: "falta" as EstadoCapa, texto: "Todavía no existe" },
  ],
  nota: {
    titulo: "La regla que ordena todo",
    texto: [
      "No importa por dónde entre alguien. Orgánico, pauta, web o referido, todo se direcciona a un solo canal y termina en un solo lugar de gestión.",
      "Un contacto que queda suelto en un DM no existe: no se puede calificar, no se puede seguir y no se puede contar.",
    ],
  },
};

export const ORDEN_CONSTRUCCION = {
  encabezados: ["Momento", "Qué se construye", "Cómo se sabe que funcionó"],
  filas: [
    ["Primero", "Capa 02 — Capturar", "Todos los contactos de la semana están en un solo lugar con nombre, número y origen"],
    ["Segundo", "Capa 03 — Calificar", "Sabemos qué porcentaje de las consultas califica, medido"],
    ["Tercero", "Capa 04 — Convertir", "El pipeline muestra dónde se traba y la tasa de cierre se puede leer"],
    ["Cuarto", "Capa 05 — Retener", "La base recibe algo todos los meses y hay recompra medida"],
    ["Recién ahí", "Replicar a otra cuenta", "El sistema funcionó en una cuenta con números propios"],
  ],
  nota: {
    titulo: "La trampa",
    texto: "Este sistema es lo más parecido a un producto que tenemos. Pero se vende recién cuando funcionó en una cuenta real y hay un número que lo demuestre. Antes de eso es una promesa, y una promesa es exactamente lo que le vendieron a nuestros clientes las agencias que los quemaron.",
  },
};

export interface MiembroEquipo {
  persona: string;
  rol: string;
  tareas: string;
  nucleo: boolean;
  vacante?: boolean;
}

export const EQUIPO_BRODA: MiembroEquipo[] = [
  { persona: "Charly", rol: "Criterio", tareas: "Una sesión de estrategia por cuenta al mes. Aprueba el ángulo, no la pieza. Conversaciones de migración. Cero publicación desde octubre.", nucleo: true },
  { persona: "Tomi", rol: "Sistema", tareas: "Métricas cargadas antes del sprint. Bitácora del viernes. Costo de tokens mensual. Construye los agentes.", nucleo: true },
  { persona: "Thiago", rol: "Mercado", tareas: "Pauta por cuenta. Pipeline actualizado. Propuestas enviadas. Cierra el primer acuerdo variable.", nucleo: true },
  { persona: "Mecha", rol: "Líder de Marca", tareas: "Calendario del mes cerrado el día 25. Piezas dentro del SLA. Nada fuera del sistema visual.", nucleo: false },
  { persona: "Juan", rol: "Líder Audiovisual", tareas: "Media jornada por cuenta. Entregas dentro del SLA. Una supervisión de Liz por semana.", nucleo: false },
  { persona: "Creativo", rol: "Contenido", tareas: "A contratar. Ejecuta y publica según calendario. Responde mensajes. Reporta lo que no llegó.", nucleo: false, vacante: true },
  { persona: "Editor", rol: "Editor de Juan", tareas: "Edita las entregas audiovisuales. Dentro del acuerdo con Juan.", nucleo: false },
  { persona: "Liz", rol: "Segunda editora", tareas: "En construcción bajo Juan. Por entrega.", nucleo: false },
  { persona: "Fabi", rol: "Editor de BRODA", tareas: "Solo marca propia.", nucleo: false },
  { persona: "Marce", rol: "Growth Partner", tareas: "Trae clientes. No entrega. Comisión por cierre.", nucleo: false },
];

/** Cómo se ordena el equipo: núcleo decide qué, células deciden cómo, red trae o apoya desde afuera. */
export const ESTRUCTURA = {
  nucleo: ["Charly", "Tomi", "Thiago"],
  celulas: [
    { nombre: "Célula de marca", lider: "Mecha", equipo: ["Creativo"] },
    { nombre: "Célula audiovisual", lider: "Juan", equipo: ["Editor", "Liz"] },
  ],
  red: ["Marce", "Fabi"],
};

export const ROLES_TABLA = {
  encabezados: ["Quién", "Posee", "Responde por"],
  filas: [
    ["Thiago", "Capa 01 — Tráfico", "Cuántas consultas entran, a qué costo y qué porcentaje califica."],
    ["Tomi", "Capas 02 y 03 — Infraestructura", "Que nada se pierda. APIs al CRM, agente calificador, base de datos, reportes automáticos y costo de tokens."],
    ["Charly + Thiago", "Capa 04 — Proceso comercial", "Que el calificado se convierta en venta. Speech, objeciones, revisión de reuniones."],
    ["Charly + Tomi", "Capa 05 — Retención", "Que el cliente que ya entró siga comprando. Comunidad, base de datos y secuencias."],
    ["Charly + Thiago", "Capa 06 — Expansión", "Que el cliente crezca de plan y traiga otros. Y que el caso quede documentado."],
    ["Mecha y Juan", "Producción", "Alimentan la capa 01 con piezas. No operan el embudo."],
  ],
};

export const BRODAWEEK = {
  filas: [
    ["Lunes", "Sprint", "Cuenta por cuenta: cuál es el número de la semana y cuál la hipótesis", "60'"],
    ["Miércoles", "Bloqueos", "Qué te frena y quién lo destraba. Si no hay bloqueo, no hablás.", "15'"],
    ["Viernes", "Cierre", "Cada hipótesis: escala o se documenta para no repetirla", "30'"],
  ],
  kpis: [
    ["Charly", "Horas semanales publicando, hasta cero"],
    ["Tomi", "Ciclos cerrados y documentados por semana"],
    ["Thiago", "Propuestas enviadas que cierran"],
    ["Mecha", "Piezas aprobadas sin retrabajo"],
    ["Juan", "Entregas dentro del SLA"],
  ],
  reglas: [
    "La pauta no espera siete días. Si en dos horas los datos marcan tendencia, se apaga o se escala ahí mismo.",
    "Las dailies las graba un bot que genera y distribuye la minuta. Nadie toma notas.",
    "Una hora diaria protegida por persona, aplicada al rol propio. No es un hobby: es requerimiento operativo.",
    "La bitácora de doce semanas es el activo. Ninguna agencia tradicional lo tiene, y es lo que entrena los agentes después.",
  ],
};

export const ECONOMIA = {
  bajada: "Con la estructura nueva — Juan produciendo en todas las cuentas porque los socios ya no graban — atender un cliente cuesta 1.150.000 ARS por mes. Tipo de cambio de referencia: 1.540.",
  filas: [
    ["Mecha — diseño", "200.000", "Por cuenta"],
    ["Socios — Charly, Tomi, Thiago", "600.000", "200.000 cada uno, por cuenta"],
    ["Herramientas", "50.000", "Por cuenta"],
    ["Juan — producción", "220.000", "Media jornada de 3 horas, 6 a 8 reels, 20 fotos"],
    ["Editor de Juan", "80.000", "Dentro del acuerdo con Juan"],
  ],
  totales: [
    { concepto: "Costo por cliente", valor: "1.150.000", destacado: false },
    { concepto: "A USD 650 — lo que cobra la cartera hoy", valor: "− 149.000", destacado: false },
    { concepto: "A USD 750 — cartera migrada", valor: "+ 5.000", destacado: false },
    { concepto: "A USD 850 — clientes nuevos", valor: "+ 159.000 · 12%", destacado: true },
  ],
  nota: {
    titulo: "Lo que hay que ver acá",
    texto: [
      "Hoy la cartera paga 650 y el número cierra únicamente porque Juan trabaja en una sola cuenta. En cuanto produce en las siete, cada cliente a 650 pierde 149.000 por mes.",
      "A 750 se vende prácticamente al costo. El primer precio con margen real es 850.",
      "La producción audiovisual es el 26% del costo de cada cuenta y no se puede sacar: todos los clientes la necesitan porque los socios ya no graban. Es un costo de entrega, no un extra.",
    ],
  },
};

export const PRECIOS = {
  filas: [
    { destacado: false, celdas: ["Cartera actual", "USD 650 → 750", "Hoy pagan 650 y con la estructura nueva cada cuenta pierde plata. Se migran a 750 en septiembre: es lo máximo que aguantan y es transición, no destino."] },
    { destacado: false, celdas: ["Clientes nuevos", "USD 850", "Desde el sexto. Es el primer precio con margen real, y solo se defiende con un caso verificable en la mano."] },
    { destacado: true, celdas: ["Cuentas con sistema comercial", "USD 850 + comisión", "Donde BRODA controla el embudo completo. Fee por la estructura más un porcentaje sobre lo que el cliente vende."] },
  ],
  nota: {
    titulo: "Por qué el retainer solo no alcanza",
    texto: [
      "Para llegar a dos millones por socio sin tocar la caja del estudio, el precio matemático es USD 1.015 por cuenta. Ningún cliente de esta cartera lo paga, y un cliente nuevo tampoco en noventa días.",
      "La diferencia no se cierra subiendo el retainer: se cierra con el modelo variable. Es exactamente para eso que existe la infraestructura comercial.",
    ],
  },
};

export const Q4 = {
  cifras: [
    { n: "5 → 7", l: "clientes", on: false },
    { n: "650 → 750", l: "cartera actual, USD", on: false },
    { n: "850", l: "precio de un cliente nuevo, USD", on: true },
    { n: "1.157", l: "USD de ingreso variable por mes", on: true },
    { n: "1,2M → 2M", l: "ARS por socio", on: false },
  ],
  tabla: {
    encabezados: ["Concepto", "Hoy — 5 cuentas a 650", "El objetivo — 7 cuentas a 850"],
    filas: [
      ["Retainer", "3.250 USD · 5.005.000", "5.950 USD · 9.163.000"],
      ["Ingreso variable — comisión sobre ventas", "—", "1.157 USD · 1.781.000"],
      ["Ingreso total ARS", "5.005.000", "10.944.000"],
      ["Costos de entrega", "1.550.000", "8.050.000"],
      ["Caja del estudio, 10%", "—", "1.094.400"],
      ["Por socio", "1.200.000", "2.000.000"],
    ],
    filasDestacadas: [1, 5],
  },
  meses: [
    { nombre: "Septiembre", foco: "Sacarle la publicación a Charly", items: [
      ["Escribir el proceso de publicación, un documento por cliente", "Charly"],
      ["Buscar el creativo, con prueba paga de quince días", "Thiago"],
      ["Migrar dos clientes de USD 650 a 750, los más contentos", "Charly"],
      ["Extraer el primer resultado verificable, con fecha y fuente", "Thiago"],
      ["Definir el precio de producción audiovisual", "Juan"],
      ["Separar la caja del estudio del reparto", "Tomi"],
    ]},
    { nombre: "Octubre", foco: "Cerrar la migración y el primer acuerdo variable", items: [
      ["Migrar los tres que faltan. Si uno no acepta, se lo deja ir.", "Charly"],
      ["Cerrar el primer acuerdo de comisión sobre ventas", "Charly y Thiago"],
      ["Vender el cliente seis a USD 850", "Thiago"],
      ["Creativo trabajando sobre las cinco cuentas", "Creativo"],
      ["Capturar y calificar funcionando en esa cuenta", "Tomi"],
    ]},
    { nombre: "Noviembre y diciembre", foco: "Que el variable empiece a facturar", items: [
      ["Vender el cliente siete a USD 850", "Thiago"],
      ["Convertir y retener funcionando en la cuenta con comisión", "Charly y Tomi"],
      ["Segundo acuerdo variable, con el primero ya facturando", "Thiago"],
      ["Cerrar la grilla 2027 con estos costos reales", "Núcleo"],
    ]},
  ],
  nota: {
    titulo: "Lo honesto",
    texto: [
      "El retainer solo no llega. Con siete cuentas a 850 y la caja intacta, cada socio cobra 1.465.000. Los 535.000 que faltan salen del ingreso variable, no de más clientes ni de un precio más alto.",
      "Eso significa que el trimestre se juega en una sola cosa: cerrar el primer acuerdo de comisión sobre ventas y hacer que funcione. Y ese acuerdo no se firma sin un resultado verificable que mostrar.",
    ],
  },
};

export const ESTRATEGIA = {
  bajada: "Un video horizontal y una placa por semana. Ocho piezas al mes, bien hechas. El contenido no trae leads: sostiene el precio y hace que el lead que llega por otro lado nos crea.",
  audiencia: [
    { destacado: true, celdas: ["Cliente — B2B", "Dueños de negocios con 2 a 5 años de tracción, creciendo sin sistema", "Es el ICP. Todo MOFU y BOFU se escribe para él."] },
    { destacado: false, celdas: ["Audiencia — B2C", "Emprendedores y freelance de 20 a 40 años con una habilidad", "No es cliente. Entra en TOFU: comparte, hace crecer la cuenta y valida la autoridad."] },
  ],
  embudo: [
    { capa: "TOFU", pilar: "Filosofía", peso: "4 de 8 piezas", trabajo: "Que alguien que no nos conoce se quede",
      temas: ["Modelos mentales", "Ser, hacer, tener", "Emprender", "El observador", "Amistad y libertad", "El movimiento", "Empoderamiento"],
      formato: "Video horizontal en YouTube · 2 a 3 verticales por pieza para Instagram", metrica: "Alcance de no seguidores y guardados" },
    { capa: "MOFU", pilar: "Criterio", peso: "3 de 8 piezas", trabajo: "Que entienda que sabemos de qué hablamos",
      temas: ["Meta Ads", "Construcción de marca", "Growth", "Inteligencia artificial", "Contenido", "Ventas"],
      formato: "Placa o carrusel · fragmento de video", metrica: "Seguidores nuevos y respuestas en historias" },
    { capa: "BOFU", pilar: "Documental", peso: "1 de 8 piezas", trabajo: "Que quiera hablar con nosotros",
      temas: ["El proceso por dentro", "Visión", "Transformación", "Prueba social — bloqueado hasta tener el número"],
      formato: "Video documental · placa de resultado", metrica: "Conversaciones iniciadas por DM" },
  ],
  ritmo: {
    encabezados: ["Semana", "Video horizontal", "Placa", "Capa"],
    filas: [
      ["Uno", "Filosofía — un modelo mental aplicado a un negocio", "Criterio — una idea suelta del video", "TOFU"],
      ["Dos", "Criterio — cómo pensamos un problema real", "Filosofía — una frase del movimiento", "MOFU"],
      ["Tres", "Filosofía — ser, hacer, tener", "Criterio — un error que vemos siempre", "TOFU"],
      ["Cuatro", "Documental — el proceso por dentro", "Documental — visión o transformación", "BOFU"],
    ],
  },
  reglas: [
    "Se graba horizontal. YouTube lo publica entero, Instagram recibe dos o tres verticales sacados del mismo material.",
    "Una pieza por semana, muy buena. No hay compensación por volumen: ocho piezas mediocres valen menos que cuatro buenas.",
    "Aparecen los tres, pero no es obligatorio en cada pieza. La Hermandad se muestra, no se anuncia.",
    "El pilar Prueba social queda bloqueado hasta que exista un resultado verificable. Sin eso, BOFU se sostiene con proceso y visión.",
    "El contenido no responde por leads. Responde por autoridad, que es lo que hace defendible el precio de 850.",
  ],
  nota: {
    titulo: "Lo que este contenido puede y no puede hacer",
    texto: [
      "Ocho piezas al mes en una cuenta que recién arranca no producen leads calificados en noventa días. Producen algo distinto y necesario: que cuando un lead llegue por pauta, por referido o por el sistema comercial, encuentre una marca que ya tiene criterio demostrado.",
      "Pedirle leads al contenido lleva a la conclusión equivocada en noviembre: que no funciona, cuando en realidad estaba haciendo bien otro trabajo.",
    ],
  },
};

export interface PiezaPlan {
  id: string;
  prioridad: boolean;
  /** "" = pieza sin fecha, vive en la bandeja lateral hasta que se arrastra a un día. */
  fecha: string;
  canal: "ig" | "li" | "yt";
  canalLabel: string;
  formato: string;
  tema: string;
  pilar: string;
  estado: string;
  detalle: string;
  // Diseño (placa, carrusel, post)
  titular?: string;
  subtitulo?: string;
  composicion?: string;
  // Video (reel, video largo)
  hook?: string;
  tension?: string;
  transformacion?: string;
  cta?: string;
}

export const FORMATOS: { formato: string; tipo: "video" | "diseno" }[] = [
  { formato: "Reel", tipo: "video" },
  { formato: "Video largo", tipo: "video" },
  { formato: "Placa", tipo: "diseno" },
  { formato: "Carrusel", tipo: "diseno" },
  { formato: "Post", tipo: "diseno" },
];

export function tipoDePieza(formato: string): "video" | "diseno" {
  return FORMATOS.find((f) => f.formato === formato)?.tipo ?? "diseno";
}

export const CANALES: { canal: PiezaPlan["canal"]; label: string }[] = [
  { canal: "ig", label: "Instagram" },
  { canal: "li", label: "LinkedIn" },
  { canal: "yt", label: "YouTube" },
];

export const ESTADOS_PIEZA = [
  "Bloque abierto", "Espera guion", "Espera redacción", "Espera material",
  "En producción", "Espera corte de edición", "Listo para publicar", "Publicado",
];

export const PLAN = {
  bajada: "Prioridad primero: lo que ya está grabado o diseñado sale antes que lo nuevo.",
  leyenda: [
    { tipo: "ig", label: "Instagram" },
    { tipo: "li", label: "LinkedIn" },
    { tipo: "yt", label: "YouTube" },
  ],
  filas: [
    { id: "p1", prioridad: true, fecha: "2026-09-15", canal: "ig", canalLabel: "Instagram", formato: "Reel", tema: "Expo Mercado Libre", pilar: "Documental · Nutrición (MOFU)", estado: "Espera guion y material de la expo",
      detalle: "Storytelling con dinamismo real: cortes cada 1-2 segundos, cámara en mano, texto en pantalla que refuerza —no repite— lo que se dice en voz. Arranca en la mitad de la acción, en la expo. Cierre con una idea de criterio, no con una venta." },
    { id: "p2", prioridad: false, fecha: "2026-09-16", canal: "li", canalLabel: "LinkedIn", formato: "Post", tema: "Qué vimos en la Expo Mercado Libre, en criterio B2B", pilar: "Criterio · Nutrición (MOFU)", estado: "Espera redacción",
      detalle: "Post de texto, sin foto obligatoria. Toma un solo insight de la expo y lo cruza con el ICP (dueño de PyME sin sistema). Cierre sin CTA de venta." },
    { id: "p3", prioridad: false, fecha: "2026-09-18", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“Ser, hacer, tener”", pilar: "Filosofía · Awareness (TOFU)", estado: "Listo para publicar",
      detalle: "Placa ya diseñada en Figma (broda-social-media). No requiere producción — pasa directo a programación." },
    { id: "p4", prioridad: true, fecha: "2026-09-22", canal: "ig", canalLabel: "Instagram", formato: "Reel", tema: "BroViaje — parte 1, detrás de cámara", pilar: "Documental · Nutrición (MOFU)", estado: "Espera guion",
      detalle: "Adelanto dinámico del viaje a Córdoba: 60-90 seg, ritmo alto, un momento fuerte real, no actuado. Mismo material que el video largo de YouTube, corte corto para IG." },
    { id: "p5", prioridad: true, fecha: "2026-09-23", canal: "yt", canalLabel: "YouTube", formato: "Video largo", tema: "BroViaje Córdoba (~20 min, crudo y queso)", pilar: "Documental · Nutrición (MOFU)", estado: "Espera corte de edición",
      detalle: "Documental completo, formato 'crudo y queso': cámara cerca, mínima edición de por medio, se nota que es real. Muestra cultura y forma de trabajar, no vende nada." },
    { id: "p6", prioridad: false, fecha: "2026-09-25", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“(No) buscamos clics”", pilar: "Criterio · Awareness (TOFU)", estado: "Listo para publicar",
      detalle: "Placa ya diseñada en Figma. Lista para programar." },
    { id: "p7", prioridad: false, fecha: "2026-09-26", canal: "li", canalLabel: "LinkedIn", formato: "Post", tema: "Browth explicado para dueños de PyME sin sistema", pilar: "Criterio · Awareness (TOFU)", estado: "Espera redacción",
      detalle: "Post de texto explicando en criterio (no en venta) qué es Browth y por qué una PyME con tracción y sin sistema lo necesita." },
    { id: "p8", prioridad: false, fecha: "2026-09-29", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“Avanzar sirve cuando sabés para qué”", pilar: "Filosofía · Awareness (TOFU)", estado: "Listo para publicar",
      detalle: "Placa ya diseñada en Figma. Lista para programar." },
    { id: "p9", prioridad: false, fecha: "2026-10-01", canal: "li", canalLabel: "LinkedIn", formato: "Post", tema: "Insight: qué mide growth de verdad", pilar: "Criterio · Nutrición (MOFU)", estado: "Espera redacción",
      detalle: "Post de opinión: qué métrica de vanidad se descarta y cuál sí importa para una PyME en growth." },
    { id: "p10", prioridad: false, fecha: "2026-10-02", canal: "ig", canalLabel: "Instagram", formato: "Reel", tema: "Contenido nuevo — a definir", pilar: "Sin asignar", estado: "Bloque abierto",
      detalle: "Todavía no tiene tema asignado. Definir ángulo (Filosofía/Criterio/Documental) antes del 25/9 para dar tiempo de producción." },
    { id: "p11", prioridad: false, fecha: "2026-10-06", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“No todo lo que falta está afuera”", pilar: "Documental · Nutrición (MOFU)", estado: "Listo para publicar",
      detalle: "Placa ya diseñada en Figma. Lista para programar." },
    { id: "p12", prioridad: false, fecha: "2026-10-08", canal: "li", canalLabel: "LinkedIn", formato: "Post", tema: "Prueba social — si ya hay caso verificable", pilar: "Documental · Nutrición (MOFU)", estado: "Espera confirmación de caso",
      detalle: "Solo se escribe si hay un resultado con número, fecha y fuente confirmados. Si no está listo para esta fecha, se corre." },
    { id: "p13", prioridad: false, fecha: "2026-10-09", canal: "ig", canalLabel: "Instagram", formato: "Reel", tema: "Contenido nuevo — a definir", pilar: "Sin asignar", estado: "Bloque abierto",
      detalle: "Todavía no tiene tema asignado." },
    { id: "r1", prioridad: false, fecha: "", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“Mutar es Broda” (collage de equipo)", pilar: "Documental · Nutrición (MOFU)", estado: "Listo para publicar",
      detalle: "Ya diseñada, sin fecha asignada." },
    { id: "r2", prioridad: false, fecha: "", canal: "ig", canalLabel: "Instagram", formato: "Placa", tema: "“Ser reconocible es más que ser visible”", pilar: "Criterio · Awareness (TOFU)", estado: "Listo para publicar",
      detalle: "Ya diseñada, sin fecha asignada." },
  ] as PiezaPlan[],
  reservas: [] as string[],
};
