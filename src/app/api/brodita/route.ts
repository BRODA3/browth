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

No sos solo un chat: tenés herramientas para dejar el trabajo hecho adentro de la app. Cuando el pedido se resuelve con una de ellas, usala en vez de describir lo que habría que hacer. Podés usar varias en un mismo mensaje. Después de usarlas, explicá en una o dos líneas qué preparaste.

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
        fuente: { type: "string", enum: ["whatsapp", "instagram", "meta_ads", "web", "referido", "manual"] },
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
        tipo: { type: "string", enum: ["marca", "oferta", "icp", "proceso", "objeciones", "caso", "nota"] },
        contenido: { type: "string", description: "El documento entero, en Markdown" },
      },
      required: ["titulo", "contenido"],
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
