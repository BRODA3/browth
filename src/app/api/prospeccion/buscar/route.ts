import { NextRequest, NextResponse } from "next/server";

// Lanza la búsqueda de empresas en Google Maps (actor de Apify). La corrida tarda
// minutos, así que no se espera acá: se devuelve el id y el panel consulta
// /api/prospeccion/estado hasta que termina.

export const runtime = "nodejs";

const ACTOR = "compass~crawler-google-places";

export async function POST(req: NextRequest) {
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
  const busquedas = rubros.flatMap((r) => zonas.map((z) => `${r} en ${z}`)).slice(0, 40);
  const porBusqueda = Math.min(Math.max(body.porBusqueda ?? 20, 5), 100);

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
  });
}
