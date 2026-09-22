import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { limitar } from "@/lib/limite";
import { AGENTS } from "@/lib/data";

// Primer agente "vivo" de Browth: recibe un mensaje entrante de WhatsApp/IG
// y devuelve una calificación estructurada usando el system prompt del agente
// definido en src/lib/data.ts (la misma fuente que se muestra en la consola).

export const runtime = "nodejs";

interface QualifyResult {
  reply: string;
  qualified: boolean | "necesita más info";
  reason: string;
  nextStep: string;
  flags: string[];
}

export async function POST(req: NextRequest) {
  const tope = limitar(req, "inbound", 60, 60_000);
  if (tope) return tope;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor. Agregala en .env.local (desarrollo) o en Vercel → Project Settings → Environment Variables (producción)." },
      { status: 500 }
    );
  }

  let body: { message?: string; leadName?: string; channel?: string; history?: { role: "user" | "assistant"; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Falta 'message'." }, { status: 400 });
  }

  const agent = AGENTS.find((a) => a.id === "inbound-qualifier")!;
  const client = new Anthropic({ apiKey });

  const historyText = (body.history || [])
    .map((h) => `${h.role === "user" ? "Lead" : "Brodita"}: ${h.text}`)
    .join("\n");

  const userTurn = [
    body.leadName ? `Nombre del lead: ${body.leadName}` : null,
    body.channel ? `Canal: ${body.channel}` : "Canal: WhatsApp",
    historyText ? `Historial previo:\n${historyText}` : null,
    `Nuevo mensaje del lead: "${message}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: agent.systemPrompt,
      messages: [{ role: "user", content: userTurn }],
    });

    const textBlock = resp.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: QualifyResult;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json({ error: "El agente no devolvió JSON válido.", raw }, { status: 502 });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido llamando a Claude.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
