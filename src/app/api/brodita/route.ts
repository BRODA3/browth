import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Brodita: el cerebro de ventas y growth de Broda. No solo responde — puede
// crear flujos, cargar oportunidades en el CRM, sumar piezas al plan de
// contenido y guardar lo aprendido en su propio cerebro. Las acciones vuelven
// al cliente y se aplican con un botón: nada se ejecuta a espaldas del equipo.

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Sos Brodita, el cerebro de ventas y growth de Broda Studio (Buenos Aires). Hablás en español rioplatense, directa y con criterio — nunca genérica ni corporativa vacía.

Tu marco es el sistema comercial real de Broda: 7 capas — Atraer, Capturar, Calificar, Convertir, Retener, Expandir, Referir — con dueños reales (Thiago en tráfico, Tomi en infraestructura y calificación, Charly en criterio y proceso comercial).

En cada mensaje te pasan el contexto de la cuenta y el cerebro de la marca (oferta, ICP, proceso, objeciones, y las notas que el equipo haya cargado). Respondé con eso. Si un dato no está en el cerebro, decilo en vez de inventarlo — nunca inventes cifras, casos ni resultados.

En modo Clientes coordinás al agente de prospección de la cuenta: busca empresas B2B en Buenos Aires (Google Maps), encuentra al decisor con email y WhatsApp, y analiza la competencia directa, indirecta y sustitutos. Si te pegan las respuestas del cuestionario de un cliente, cargá el perfil con cargar_perfil_prospeccion. Si piden prospectos, usá buscar_prospectos; si el perfil no tiene rubros ni zonas y el pedido tampoco los trae, preguntalos antes. Buscar cuesta créditos de Apify: no lances búsquedas que nadie pidió.

BRODA tiene un banco de prompts: los pedidos que ya sabemos que funcionan (el que va al proyecto del cliente, el cuestionario, los primeros contactos). En el contexto te llega la lista. Si lo que piden ya está ahí, traelo con usar_prompt en vez de escribirlo de nuevo; si definen uno nuevo que van a repetir, guardalo con guardar_prompt.

No sos solo un chat: tenés herramientas para dejar el trabajo hecho adentro de la app. Cuando el pedido se resuelve con una de ellas, usala en vez de describir lo que habría que hacer. Podés usar varias en un mismo mensaje. Escribí siempre al menos una línea de texto junto con la herramienta, diciendo qué preparaste y qué tiene que hacer el equipo: si contestás solo con la herramienta, en la pantalla aparece una tarjeta sin ninguna explicación.

Sé breve: 3 a 6 líneas salvo que pidan un desarrollo largo. Nada de relleno.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "crear_flujo",
    description: "Arma un flujo comercial completo y lo deja listo en el tablero de Workflows de la cuenta activa. Usalo cuando pidan diseñar, armar o mejorar un proceso, una secuencia de emails, un seguimiento o una automatización.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre corto del flujo" },
        pasos: {
          type: "array",
          description: "Entre 5 y 9 pasos, en orden",
          items: {
            type: "object",
            properties: {
              etiqueta: { type: "string", description: "Una o dos palabras: Entrada, Email, Cierre…" },
              titulo: { type: "string", description: "Qué pasa en este paso" },
              responsable: { type: "string", description: "Rol que lo hace" },
              herramienta: { type: "string", description: "Con qué se hace" },
              agente: { type: "string", description: "Agente que lo ejecuta, o vacío" },
              tiempo: { type: "string", description: "Cuánto tarda o cuándo ocurre" },
              automatizacion: { type: "string", enum: ["manual", "asistido", "agente"] },
              detalle: { type: "string", description: "Si es un email o mensaje, el asunto y las líneas clave" },
            },
            required: ["titulo"],
          },
        },
      },
      required: ["nombre", "pasos"],
    },
  },
  {
    name: "crear_oportunidad",
    description: "Carga una oportunidad en el CRM de la cuenta activa. Usalo cuando cuenten que entró un lead, una consulta o un contacto para seguir.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre del contacto" },
        empresa: { type: "string" },
        telefono: { type: "string" },
        email: { type: "string" },
        fuente: { type: "string", enum: ["whatsapp", "instagram", "meta_ads", "web", "outbound", "referido", "manual"] },
        etapa: { type: "string", enum: ["nuevo", "calificado", "reunion", "propuesta", "ganado", "perdido"] },
        valor: { type: "number", description: "Valor estimado, 0 si no se sabe" },
        nota: { type: "string", description: "Contexto: qué pidió, cómo llegó" },
      },
      required: ["nombre"],
    },
  },
  {
    name: "agregar_pieza_contenido",
    description: "Suma una pieza al plan de contenido de Broda. Usalo cuando pidan ideas de contenido, un guion o llenar el calendario.",
    input_schema: {
      type: "object",
      properties: {
        tema: { type: "string", description: "De qué trata la pieza" },
        formato: { type: "string", enum: ["Reel", "Video largo", "Placa", "Carrusel", "Post"] },
        canal: { type: "string", enum: ["ig", "li", "yt"] },
        fecha: { type: "string", description: "AAAA-MM-DD, o vacío para dejarla sin fecha" },
        pilar: { type: "string", description: "Filosofía, Criterio o Documental" },
        titular: { type: "string", description: "Para piezas de diseño" },
        subtitulo: { type: "string", description: "Para piezas de diseño" },
        hook: { type: "string", description: "Para videos: los primeros 3 segundos" },
        cta: { type: "string", description: "Para videos: el cierre" },
      },
      required: ["tema", "formato"],
    },
  },
  {
    name: "guardar_en_cerebro",
    description: "Guarda un documento nuevo en el cerebro de Brodita para usarlo en adelante. Usalo cuando el equipo defina algo que conviene recordar: un speech, una objeción resuelta, un caso, una decisión de precios.",
    input_schema: {
      type: "object",
      properties: {
        titulo: { type: "string" },
        tipo: { type: "string", enum: ["marca", "oferta", "icp", "proceso", "objeciones", "caso", "competencia", "nota"] },
        contenido: { type: "string", description: "El documento entero, en Markdown" },
      },
      required: ["titulo", "contenido"],
    },
  },
  {
    name: "usar_prompt",
    description: "Trae un prompt del banco de BRODA y lo deja listo para copiar, con el nombre de la cuenta ya completado. Usalo cuando pidan 'el prompt de…', 'pasame el cuestionario' o necesiten el texto exacto que le mandamos a un proyecto o a un lead. En el contexto tenés la lista de prompts disponibles.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Título del prompt, o parte de él" },
      },
      required: ["nombre"],
    },
  },
  {
    name: "guardar_prompt",
    description: "Guarda un prompt nuevo en el banco de BRODA, o actualiza uno con el mismo título. Usalo cuando definan un pedido que van a repetir. Poné [CLIENTE] donde vaya el nombre de la cuenta.",
    input_schema: {
      type: "object",
      properties: {
        titulo: { type: "string" },
        categoria: { type: "string", enum: ["prospeccion", "contacto", "cliente", "contenido", "interno"] },
        cuando: { type: "string", description: "Cuándo se usa y dónde se pega" },
        contenido: { type: "string", description: "El prompt entero" },
      },
      required: ["titulo", "contenido"],
    },
  },
  {
    name: "cargar_perfil_prospeccion",
    description: "Carga o actualiza el perfil de prospección de la cuenta activa (a quién buscar y quién decide). Usalo cuando peguen las respuestas del cuestionario del cliente o definan el cliente ideal. Solo en modo Clientes.",
    input_schema: {
      type: "object",
      properties: {
        oferta: { type: "string", description: "Qué vende la cuenta, con precio aproximado" },
        rubros: { type: "array", items: { type: "string" }, description: "Rubros como se buscarían en Google Maps: 'constructora', 'estudio contable'" },
        zonas: { type: "array", items: { type: "string" }, description: "Barrios de CABA o partidos del GBA: 'Palermo', 'San Isidro', 'CABA'" },
        cargos: { type: "array", items: { type: "string" }, description: "Cargos que deciden la compra, en orden de prioridad" },
        tamano: { type: "string" },
        senales: { type: "string", description: "Qué le pasa a una empresa justo antes de necesitarla" },
        excluir: { type: "string" },
        no_contactar: { type: "string", description: "Empresas o dominios a no contactar, separados por coma" },
        competidores: { type: "string", description: "Competidores directos, uno por línea" },
        alternativas: { type: "string", description: "Cómo lo resuelven si no contratan a nadie" },
      },
    },
  },
  {
    name: "buscar_prospectos",
    description: "Lanza la búsqueda de empresas B2B en Google Maps para la cuenta activa. Sin rubros ni zonas usa los del perfil. Usalo solo cuando pidan buscar prospectos o leads.",
    input_schema: {
      type: "object",
      properties: {
        rubros: { type: "array", items: { type: "string" } },
        zonas: { type: "array", items: { type: "string" } },
        por_busqueda: { type: "integer", description: "Empresas por cada búsqueda rubro × zona, entre 5 y 100. Por defecto 20." },
      },
    },
  },
  {
    name: "analizar_competencia",
    description: "Lanza el análisis de competencia de la cuenta activa: directa, indirecta y sustitutos, con huecos de posicionamiento y ángulos de venta.",
    input_schema: {
      type: "object",
      properties: {
        competidores: { type: "string", description: "Competidores conocidos que haya que incluir, uno por línea (opcional)" },
      },
    },
  },
  {
    name: "pasar_leads_al_crm",
    description: "Pasa al CRM de la cuenta los leads ya investigados que superan un score mínimo.",
    input_schema: {
      type: "object",
      properties: {
        score_minimo: { type: "integer", description: "Score ICP mínimo, de 1 a 10. Por defecto 7." },
      },
    },
  },
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor. Agregala en .env.local (desarrollo) o en Vercel → Project Settings → Environment Variables (producción)." },
      { status: 500 }
    );
  }

  let body: { messages?: { role: "user" | "assistant"; text: string }[]; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }

  const messages = body.messages || [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "Falta 'messages'." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const system = `${SYSTEM_PROMPT}\n\nContexto actual:\n${body.context || "(sin contexto)"}`;

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system,
      tools: TOOLS,
      messages: messages.map((m) => ({ role: m.role, content: m.text })),
    });

    const reply = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const acciones = resp.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({ id: b.id, tool: b.name, input: b.input }));

    return NextResponse.json({ reply, acciones });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido llamando a Claude.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
