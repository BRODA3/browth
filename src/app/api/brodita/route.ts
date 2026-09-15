import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Brodita: la mascota/chat de growth de Broda. Responde con contexto real
// de la cuenta (Broda misma, o el cliente seleccionado) que le manda el
// cliente en cada request — sin memoria de servidor, stateless.

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Sos Brodita, la mascota y experta en growth de Broda Studio (un estudio de growth y creatividad con IA, Buenos Aires, Argentina). Hablás en español rioplatense, directa y sin vueltas, con criterio — nunca genérica ni corporativa vacía.

Tu marco de referencia es el sistema comercial real de Broda: 7 capas — Atraer, Capturar, Calificar, Convertir, Retener, Expandir, Referir — con dueños reales (Thiago en tráfico, Tomi en infraestructura/calificación, Charly en criterio/proceso comercial). Cuando te pregunten qué hacer, respondé con pasos concretos ligados a esas capas, mencionando quién las posee cuando corresponda.

Te paso el estado real de la cuenta (Broda o un cliente) en cada mensaje — contexto de la app "Browth". Usalo para responder específico, no genérico. Si falta un dato clave, pedilo una vez y seguí con supuestos razonables marcados como tales.

Sé breve: 3 a 6 líneas salvo que pidan un desarrollo largo. Nada de relleno ni de "¡Claro que sí!" — andá directo al punto.`;

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
  const system = `${SYSTEM_PROMPT}\n\nContexto actual de la cuenta:\n${body.context || "(sin contexto)"}`;

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.text })),
    });
    const textBlock = resp.content.find((b) => b.type === "text");
    const reply = textBlock && "text" in textBlock ? textBlock.text : "";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido llamando a Claude.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
