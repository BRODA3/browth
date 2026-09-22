import { NextRequest, NextResponse } from "next/server";
import { limitar } from "@/lib/limite";

// Lanza la búsqueda de empresas en Google Maps (actor de Apify). La corrida tarda
// minutos, así que no se espera acá: se devuelve el id y el panel consulta
// /api/prospeccion/estado hasta que termina.

export const runtime = "nodejs";

const ACTOR = "compass~crawler-google-places";

/** Medido en corridas reales, con extracción de contactos incluida. */
const USD_POR_EMPRESA = 0.0065;
const MAX_BUSQUEDAS = 40;

/** Cuánto crédito de Apify queda este mes. null si la cuenta no declara límite. */
async function creditoDisponible(token: string): Promise<number | null> {
  try {
    const r = await fetch("https://api.apify.com/v2/users/me/limits", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    const tope = j?.data?.limits?.maxMonthlyUsageUsd;
    const usado = j?.data?.current?.monthlyUsageUsd;
    if (typeof tope !== "number" || typeof usado !== "number") return null;
    return Math.max(0, tope - usado);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const tope = limitar(req, "buscar", 6, 60 * 60_000);
  if (tope) return tope;

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta APIFY_TOKEN en el servidor. Cargala en .env.local (local) o en Vercel → Settings → Environment Variables." }, { status: 500 });
  }

  let body: { rubros?: string[]; zonas?: string[]; porBusqueda?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON." }, { status: 400 });
  }

  const rubros = (body.rubros ?? []).map((r) => r.trim()).filter(Boolean);
  const zonas = (body.zonas ?? []).map((z) => z.trim()).filter(Boolean);
  if (rubros.length === 0) return NextResponse.json({ error: "Cargá al menos un rubro para buscar." }, { status: 400 });
  if (zonas.length === 0) return NextResponse.json({ error: "Cargá al menos una zona de Buenos Aires." }, { status: 400 });

  // Una búsqueda por rubro × zona: Maps devuelve más y mejor que con una sola búsqueda amplia.
  const busquedas = rubros.flatMap((r) => zonas.map((z) => `${r} en ${z}`)).slice(0, MAX_BUSQUEDAS);
  const porBusqueda = Math.min(Math.max(body.porBusqueda ?? 20, 5), 100);
  const estimado = busquedas.length * porBusqueda * USD_POR_EMPRESA;

  // Apify aborta la corrida cuando la cuenta toca su límite mensual, y una corrida
  // abortada a mitad de camino ya gastó la plata. Se chequea antes de lanzarla.
  const disponible = await creditoDisponible(token);
  if (disponible != null && estimado > disponible) {
    const alcanzan = Math.floor(disponible / USD_POR_EMPRESA);
    return NextResponse.json({
      error: disponible <= 0.05
        ? "No te queda crédito de Apify este mes (el plan gratis da US$ 5 y se renueva el 1). Podés esperar, subir de plan o buscar menos empresas el mes que viene."
        : `Esta búsqueda puede costar unos US$ ${estimado.toFixed(2)} y en Apify te quedan US$ ${disponible.toFixed(2)}. Achicá a ${alcanzan} empresas: menos zonas, menos rubros o menos empresas por búsqueda.`,
      estimadoUsd: Number(estimado.toFixed(2)),
      disponibleUsd: Number(disponible.toFixed(2)),
    }, { status: 400 });
  }

  const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: busquedas,
      locationQuery: "Buenos Aires, Argentina",
      countryCode: "ar",
      language: "es",
      maxCrawledPlacesPerSearch: porBusqueda,
      skipClosedPlaces: true,
      scrapeContacts: true,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: `Apify no aceptó la búsqueda: ${json?.error?.message ?? res.statusText}` }, { status: 502 });
  }

  return NextResponse.json({
    runId: json.data.id as string,
    busquedas: busquedas.length,
    maximo: busquedas.length * porBusqueda,
    estimadoUsd: Number(estimado.toFixed(2)),
    disponibleUsd: disponible == null ? null : Number(disponible.toFixed(2)),
  });
}
