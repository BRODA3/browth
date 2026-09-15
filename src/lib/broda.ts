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
}

export const EQUIPO_BRODA: MiembroEquipo[] = [
  { persona: "Charly", rol: "Criterio", tareas: "Una sesión de estrategia por cuenta al mes. Aprueba el ángulo, no la pieza. Conversaciones de migración. Cero publicación desde octubre.", nucleo: true },
  { persona: "Tomi", rol: "Sistema", tareas: "Métricas cargadas antes del sprint. Bitácora del viernes. Costo de tokens mensual. Construye los agentes.", nucleo: true },
  { persona: "Thiago", rol: "Mercado", tareas: "Pauta por cuenta. Pipeline actualizado. Propuestas enviadas. Cierra el primer acuerdo variable.", nucleo: true },
  { persona: "Mecha", rol: "Líder de Marca", tareas: "Calendario del mes cerrado el día 25. Piezas dentro del SLA. Nada fuera del sistema visual.", nucleo: false },
  { persona: "Juan", rol: "Líder Audiovisual", tareas: "Media jornada por cuenta. Entregas dentro del SLA. Una supervisión de Liz por semana.", nucleo: false },
  { persona: "Liz", rol: "Segunda editora", tareas: "En construcción bajo Juan. Por entrega.", nucleo: false },
  { persona: "Fabi", rol: "Editor de BRODA", tareas: "Solo marca propia.", nucleo: false },
  { persona: "Marce", rol: "Growth Partner", tareas: "Trae clientes. No entrega. Comisión por cierre.", nucleo: false },
];

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
