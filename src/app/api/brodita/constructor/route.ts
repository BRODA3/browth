import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Brodita construyendo, no conversando: recibe una instrucción y devuelve un
// flujo comercial listo para caer en el tablero de la cuenta. El cerebro viaja
// en el request — responde con lo que Broda sabe, no con teoría genérica.

export const runtime = "nodejs";

const SYSTEM = `Sos Brodita, la experta en growth de Broda Studio (Buenos Aires). Diseñás flujos comerciales B2B concretos y ejecutables.

Te dan una instrucción y el cerebro de la marca (documentos con la oferta, el ICP, el proceso y las objeciones). Devolvés UN flujo: la cadena de pasos que hay que ejecutar, en orden.

Reglas:
- Entre 5 y 9 pasos. Cada paso es una acción concreta, no una categoría.
- Español rioplatense, directo. Nada de "sinergia", "optimizar procesos" ni relleno corporativo.
- Si el paso es un email o un mensaje, en "detalle" va el asunto y las líneas clave, no una descripción vaga.
- Usá los nombres y números del cerebro cuando apliquen. Nunca inventes cifras ni casos.
- "automatizacion" es "manual" si hoy lo hace una persona, "asistido" si una persona lo hace con ayuda, "agente" si puede correr solo.
- "agente" es el nombre del agente que lo ejecutaría (o vacío si no aplica).

Respondé SOLO con este JSON, sin texto alrededor ni bloque de código:
{"nombre":"nombre corto del flujo","pasos":[{"etiqueta":"palabra o dos","titulo":"qué pasa en este paso","responsable":"rol","herramienta":"con qué","agente":"","tiempo":"48 hs","automatizacion":"manual","detalle":"el detalle accionable"}]}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor. Cargala en .env.local (local) o en Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  let body: { instruccion?: string; cerebro?: string; cuenta?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }

  const instruccion = (body.instruccion || "").trim();
  if (!instruccion) return NextResponse.json({ error: "Falta la instrucción." }, { status: 400 });

  const client = new Anthropic({ apiKey });
  const prompt = [
    body.cuenta ? `Cuenta: ${body.cuenta}` : "",
    body.cerebro ? `Cerebro de la marca:\n${body.cerebro}` : "",
    `Instrucción: ${instruccion}`,
  ].filter(Boolean).join("\n\n");

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const bloque = resp.content.find((b) => b.type === "text");
    const texto = bloque && "text" in bloque ? bloque.text : "";
    const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
    const flujo = JSON.parse(json);

    if (!flujo?.nombre || !Array.isArray(flujo.pasos) || flujo.pasos.length === 0) {
      return NextResponse.json({ error: "Brodita devolvió un flujo vacío. Probá con una instrucción más específica." }, { status: 502 });
    }
    return NextResponse.json({ flujo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido armando el flujo.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
