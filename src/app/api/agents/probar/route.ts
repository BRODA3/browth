import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { limitar } from "@/lib/limite";

// Probar un agente con su propio prompt, el cerebro de la cuenta y un mensaje
// de ejemplo. Es el paso previo a ponerlo en producción: se ve qué contesta
// antes de conectarlo a WhatsApp o al CRM.

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const tope = limitar(req, "probar-agente", 30, 5 * 60_000);
  if (tope) return tope;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor. Cargala en .env.local (local) o en Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  let body: { prompt?: string; cerebro?: string; mensaje?: string; limites?: string; cuenta?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const mensaje = (body.mensaje || "").trim();
  if (!prompt) return NextResponse.json({ error: "El agente todavía no tiene prompt cargado." }, { status: 400 });
  if (!mensaje) return NextResponse.json({ error: "Escribí un mensaje de ejemplo para probarlo." }, { status: 400 });

  const system = [
    prompt,
    body.limites ? `\nLímites de este agente (nunca los cruces):\n${body.limites}` : "",
    body.cuenta ? `\nCuenta: ${body.cuenta}` : "",
    body.cerebro ? `\nLo que sabemos de la cuenta (usalo como fuente; no inventes por fuera):\n${body.cerebro}` : "",
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: mensaje }],
    });
    const bloque = resp.content.find((b) => b.type === "text");
    const reply = bloque && "text" in bloque ? bloque.text : "";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido probando el agente.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
