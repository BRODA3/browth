import Anthropic from "@anthropic-ai/sdk";

// Corre un agente de investigación: Claude busca y lee la web del lado de
// Anthropic (web_search / web_fetch) y termina entregando el resultado en una
// herramienta con esquema estricto, así la respuesta siempre llega como JSON válido.
// Solo se usa desde API routes: necesita ANTHROPIC_API_KEY.

export const MODELO = "claude-sonnet-5";

export class FaltaClave extends Error {}

export function clienteAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new FaltaClave("Falta ANTHROPIC_API_KEY en el servidor. Cargala en .env.local (local) o en Vercel → Settings → Environment Variables.");
  }
  return new Anthropic({ apiKey });
}

interface Opciones {
  system: string;
  pedido: string;
  /** La herramienta donde el agente deja el resultado final. */
  entrega: Anthropic.Tool;
  busquedas: number;
  lecturas: number;
  maxTokens?: number;
}

export interface ResultadoAgente<T> {
  datos: T;
  fuentes: string[];
}

export async function correrAgente<T>(client: Anthropic, o: Opciones): Promise<ResultadoAgente<T>> {
  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: o.busquedas, user_location: { type: "approximate", city: "Buenos Aires", country: "AR", timezone: "America/Argentina/Buenos_Aires" } },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: o.lecturas },
    { ...o.entrega, strict: true },
  ];

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: o.pedido }];
  const fuentes = new Set<string>();

  // El servidor pausa el turno cuando encadena muchas búsquedas: se reenvía tal
  // cual y retoma solo. Tope de continuaciones para no quedar en loop.
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const resp = await client.messages.create({
      model: MODELO,
      max_tokens: o.maxTokens ?? 16000,
      system: o.system,
      tools,
      messages,
    });

    for (const b of resp.content) {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        b.content.forEach((r) => r.type === "web_search_result" && fuentes.add(r.url));
      }
    }

    const entrega = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === o.entrega.name
    );
    if (entrega) return { datos: entrega.input as T, fuentes: [...fuentes] };

    if (resp.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: resp.content });
      continue;
    }

    if (resp.stop_reason === "refusal") throw new Error("El modelo no quiso completar esta investigación.");

    // Terminó sin entregar: se le pide una vez que cierre con la herramienta.
    messages.push({ role: "assistant", content: resp.content });
    messages.push({ role: "user", content: `Entregá ahora el resultado con la herramienta ${o.entrega.name}, con lo que ya encontraste. Lo que no encontraste, dejalo vacío.` });
  }
  throw new Error("El agente no llegó a entregar un resultado. Probá de nuevo.");
}

/** Solo webs públicas: la URL llega del navegador y no puede apuntar a la red interna. */
function esPublica(url: string): boolean {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return false; // IPs directas (v4 y v6)
    return true;
  } catch {
    return false;
  }
}

/** Texto legible de una página, sin scripts ni estilos, recortado. */
export async function leerPagina(url: string, max = 12000): Promise<{ texto: string; links: string[] } | null> {
  try {
    // Las redirecciones se siguen a mano para validar cada salto.
    let actual = url;
    let res: Response | null = null;
    for (let salto = 0; salto < 4; salto++) {
      if (!esPublica(actual)) return null;
      res = await fetch(actual, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrowthBot/1.0; +https://broda.studio)", "Accept-Language": "es-AR,es;q=0.9" },
        signal: AbortSignal.timeout(10000),
        redirect: "manual",
      });
      const destino = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !destino) break;
      actual = new URL(destino, actual).toString();
    }
    if (!res || !res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const html = await res.text();
    const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#64;|&commat;/g, "@")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
    return { texto, links };
  } catch {
    return null;
  }
}

export function errorARespuesta(err: unknown): { error: string; status: number } {
  if (err instanceof FaltaClave) return { error: err.message, status: 500 };
  if (err instanceof Anthropic.RateLimitError) return { error: "Claude está saturado de pedidos. Esperá un minuto y seguí.", status: 429 };
  if (err instanceof Anthropic.APIError) return { error: `Claude devolvió un error (${err.status ?? "?"}): ${err.message}`, status: 502 };
  return { error: err instanceof Error ? err.message : "Error desconocido.", status: 500 };
}
