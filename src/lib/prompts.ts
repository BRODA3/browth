// Banco de prompts de BRODA: lo que el equipo le pega a Claude, a un proyecto de
// cliente o a un lead, guardado en un solo lugar y editable desde la app.
// Vive en el contexto de Broda (localStorage), igual que el resto del contenido.

export type CategoriaPrompt = "prospeccion" | "contacto" | "cliente" | "contenido" | "interno";

export const CATEGORIAS: { id: CategoriaPrompt; label: string; color: string }[] = [
  { id: "prospeccion", label: "Prospección", color: "#C8F542" },
  { id: "contacto", label: "Primer contacto", color: "#4FD18A" },
  { id: "cliente", label: "Con el cliente", color: "#4F91E0" },
  { id: "contenido", label: "Contenido", color: "#E14FA8" },
  { id: "interno", label: "Interno", color: "#8A6FE0" },
];

export interface Prompt {
  id: string;
  titulo: string;
  categoria: CategoriaPrompt;
  /** Cuándo se usa y dónde se pega. */
  cuando: string;
  contenido: string;
  actualizado: string;
}

export function nuevoPrompt(parcial: Partial<Prompt> = {}): Prompt {
  return {
    id: `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    titulo: "Prompt nuevo",
    categoria: "interno",
    cuando: "",
    contenido: "",
    actualizado: new Date().toISOString(),
    ...parcial,
  };
}

/** Reemplaza los huecos del prompt con la cuenta activa. */
export function completar(contenido: string, cuenta?: string): string {
  return contenido.replace(/\[CLIENTE\]/g, cuenta || "[CLIENTE]");
}

export function buscarPrompt(prompts: Prompt[], texto: string): Prompt | null {
  const t = texto.toLowerCase().trim();
  if (!t) return null;
  return prompts.find((p) => p.titulo.toLowerCase() === t)
    ?? prompts.find((p) => p.titulo.toLowerCase().includes(t))
    ?? prompts.find((p) => `${p.titulo} ${p.cuando}`.toLowerCase().includes(t))
    ?? null;
}

const P = (p: Omit<Prompt, "id" | "actualizado">): Prompt => ({
  ...p,
  id: `seed-${p.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
  actualizado: "2026-09-22T00:00:00.000Z",
});

export const SEED_PROMPTS: Prompt[] = [
  P({
    titulo: "Perfil de prospección desde el proyecto del cliente",
    categoria: "prospeccion",
    cuando: "Se pega en el proyecto de Claude del cliente. Lo que devuelve se le pasa a Brodita para que cargue el perfil.",
    contenido: `Necesito armar el perfil de prospección B2B de [CLIENTE] para nuestro agente de research.

Revisá todo lo que hay en este proyecto (brief, identidad, ICP, propuesta, estrategia, casos, notas de reuniones) y completá el bloque de abajo con lo que ya sabemos.

REGLAS
- No inventes. Si un dato no está en el proyecto, escribí exactamente: FALTA.
- Los rubros tienen que ser términos de búsqueda de Google Maps, no categorías de marketing. Bien: "estudio contable", "constructora", "distribuidora de alimentos". Mal: "pymes en crecimiento", "empresas del sector servicios".
- Las zonas son barrios de CABA o partidos del GBA. Si solo sabemos "Buenos Aires", poné CABA.
- Los cargos van en orden de prioridad, como figuran en LinkedIn: "Dueño", "Socio", "Gerente de administración".
- Si hay contradicciones entre documentos, usá lo más reciente y avisalo al final.

FORMATO DE SALIDA (copiá esta estructura tal cual)

Oferta:
Ticket o precio de entrada:
Rubros a buscar:
Tamaño de empresa:
Zonas:
Cargo que decide:
Señales de compra (qué le pasa a una empresa justo antes de necesitarnos):
Excluir (rubros, tamaños o zonas que no sirven):
No contactar (clientes actuales o en negociación, con dominio si lo tenemos):
Competidores directos (nombre y web, uno por línea):
Si el cliente no contrata a nadie, cómo lo resuelve:
Clientes actuales que querríamos clonar (nombre y web):

DESPUÉS DEL BLOQUE, AGREGÁ:
1. Qué le tenemos que preguntar al cliente para completar los FALTA (solo lo imprescindible, en preguntas cortas y listas para mandar por WhatsApp).
2. De dónde sacaste cada dato, en una línea por dato (qué documento del proyecto).`,
  }),
  P({
    titulo: "Cuestionario de prospección para el cliente",
    categoria: "cliente",
    cuando: "Se le manda al cliente por WhatsApp o mail cuando el proyecto no alcanza para completar el perfil. Las ★ son imprescindibles.",
    contenido: `¡Hola! Para armarte la base de clientes potenciales en Buenos Aires necesito estas respuestas. Cortas y concretas alcanzan.

1. ¿Qué vendés y a qué precio aproximado? (una línea)
2. ★ ¿A qué tipo de empresas les vendés? Nombrame rubros concretos (ej.: "constructoras", "clínicas odontológicas", "distribuidoras de alimentos").
3. ¿De qué tamaño son? (cantidad de empleados aprox., o "pymes / grandes")
4. ★ ¿En qué zonas de Buenos Aires? (CABA, zona norte, oeste, sur, todo AMBA…)
5. ★ ¿Quién decide la compra de lo tuyo? (cargo: dueño, gerente general, compras, RR.HH., marketing…)
6. Pasame 3 clientes actuales que te gustaría "clonar" (nombre y web o Instagram).
7. ¿Qué le pasa a una empresa justo antes de necesitarte? (abre sucursal, contrata gente, se muda, tiene un problema puntual…)
8. ¿Qué empresas NO te sirven? (rubros, tamaños o zonas a excluir)
9. ¿Hay empresas que no debamos contactar? (clientes actuales, en negociación) — pasame la lista.
10. ¿Quiénes son tus 3 a 5 competidores principales? (nombre y web/Instagram)
11. Si un cliente no te contrata a vos ni a tu competencia, ¿cómo lo resuelve? (con gente propia, otra herramienta, no lo resuelve…)
12. ¿Cuántos contactos querés por mes?

¡Gracias!`,
  }),
  P({
    titulo: "Primer contacto por WhatsApp a un lead",
    categoria: "contacto",
    cuando: "Después de investigar un lead. Se le pasa a Brodita junto con la fila del lead (decisor, gancho, score).",
    contenido: `Escribí el primer mensaje de WhatsApp para este lead de [CLIENTE].

Lead:
(pegá acá el decisor, el cargo, la empresa y el gancho que trajo el agente)

Reglas del mensaje:
- Máximo 4 líneas, se tiene que leer entero en la previsualización del celular.
- Arranca por el gancho, que es algo real de esa empresa, no por nosotros.
- Una sola pregunta al final, fácil de contestar con sí o no.
- Nada de "espero que estés bien", ni bloques de presentación, ni emojis de más.
- No prometas precio ni plazo: eso lo define una persona.
- Español rioplatense, de vos, tono de igual a igual.

Dame 2 versiones: una directa y una más consultiva.`,
  }),
  P({
    titulo: "Primer contacto por email a un decisor",
    categoria: "contacto",
    cuando: "Para leads con email corporativo y decisor identificado. Sirve para mandar de a uno, no para envíos masivos.",
    contenido: `Escribí un email de primer contacto para este lead de [CLIENTE].

Lead:
(pegá acá el decisor, el cargo, la empresa, la web y el gancho)

Reglas:
- Asunto de menos de 45 caracteres, sin promesas ni signos de admiración.
- Cuerpo de 80 a 120 palabras.
- Primera línea: algo concreto y verificable de su empresa. Si no lo tengo, pedímelo en vez de inventarlo.
- Segunda parte: qué problema resolvemos para empresas como la suya, en una línea, sin listar servicios.
- Cierre con una pregunta de baja fricción (15 minutos, o una pregunta directa).
- Sin adjuntos ni links, salvo uno solo si suma.
- Español rioplatense.

Dame el asunto y el cuerpo, y una variante del asunto.`,
  }),
  P({
    titulo: "Bajar el análisis de competencia a la reunión de venta",
    categoria: "interno",
    cuando: "Después de correr el análisis de competencia. Se le pega el informe a Brodita para preparar al que vende.",
    contenido: `Tomá el análisis de competencia de [CLIENTE] y bajámelo a lo que necesita quien va a vender.

Devolveme:
1. Las 3 objeciones más probables que va a poner un prospecto que hoy está con la competencia, y cómo se responde cada una en 2 líneas, sin hablar mal de nadie.
2. Qué decimos nosotros que ellos no puedan decir (y que podamos probar).
3. Si el prospecto lo resuelve con gente propia: 3 preguntas que le hagan ver el costo real de seguir así.
4. Una frase de posicionamiento de una línea para abrir la reunión.

Reglas: nada de datos que no estén en el informe. Si hace falta un dato que no tenemos, decime cuál es.`,
  }),
];
