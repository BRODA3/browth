import { NextRequest, NextResponse } from "next/server";
import { limitar } from "@/lib/limite";
import { nuevoLead, separarEmails, whatsappDe, whatsappDeLink, type Lead } from "@/lib/prospeccion";

// Estado de una búsqueda en Google Maps. Cuando termina, devuelve los lugares
// ya convertidos en leads: dirección, teléfono, WhatsApp (si es celular),
// emails y redes que el actor sacó de la web de cada empresa.

export const runtime = "nodejs";

type Lugar = Record<string, unknown>;

const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function aLead(p: Lugar): Lead {
  const web = s(p.website);
  const telefono = s(p.phone) || s(p.phoneUnformatted);
  const { email, emailGenerico } = separarEmails(arr(p.emails), web);

  // WhatsApp: primero un link wa.me de la web; si no, el teléfono si es celular.
  const links = [...arr(p.whatsapps), ...arr(p.phones)];
  const deLink = links.map(whatsappDeLink).find(Boolean) ?? null;
  const deTel = whatsappDe(telefono);

  return nuevoLead({
    empresa: s(p.title),
    rubro: s(p.categoryName),
    web,
    direccion: s(p.address),
    localidad: s(p.neighborhood) || s(p.city),
    telefono,
    whatsapp: deLink ?? deTel?.numero ?? "",
    whatsappConfirmado: Boolean(deLink) || Boolean(deTel?.confirmado),
    email,
    emailGenerico,
    instagram: arr(p.instagrams)[0] ?? "",
    linkedinEmpresa: arr(p.linkedIns)[0] ?? "",
    rating: typeof p.totalScore === "number" ? p.totalScore : null,
    resenas: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
    mapsUrl: s(p.url),
  });
}

export async function GET(req: NextRequest) {
  const tope = limitar(req, "estado", 200, 5 * 60_000);
  if (tope) return tope;

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN en el servidor." }, { status: 500 });

  const runId = req.nextUrl.searchParams.get("run");
  if (!runId || !/^[A-Za-z0-9]+$/.test(runId)) return NextResponse.json({ error: "Falta el id de la búsqueda." }, { status: 400 });

  const headers = { Authorization: `Bearer ${token}` };
  const run = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, { headers, cache: "no-store" }).then((r) => r.json()).catch(() => null);
  if (!run?.data) return NextResponse.json({ error: "No encontré esa búsqueda en Apify." }, { status: 404 });

  const { status, defaultDatasetId, usageTotalUsd } = run.data as { status: string; defaultDatasetId: string; usageTotalUsd?: number };
  if (status === "READY" || status === "RUNNING") {
    const items = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}`, { headers, cache: "no-store" }).then((r) => r.json()).catch(() => null);
    return NextResponse.json({ estado: "corriendo", encontrados: items?.data?.itemCount ?? 0 });
  }

  // Una corrida cortada (límite de crédito, tiempo, cancelada a mano) igual deja
  // en Apify todo lo que alcanzó a juntar: se entrega eso en vez de perderlo.
  const lugares: Lugar[] = await fetch(
    `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?clean=true&format=json`,
    { headers, cache: "no-store" }
  ).then((r) => r.json()).catch(() => []);

  const leads = (Array.isArray(lugares) ? lugares : []).filter((p) => s(p.title) && !p.permanentlyClosed && !p.temporarilyClosed).map(aLead);

  if (status !== "SUCCEEDED") {
    if (leads.length === 0) {
      return NextResponse.json({ estado: "fallo", error: `La búsqueda terminó con estado ${status} y sin resultados. Si fue por el límite de crédito de Apify, se renueva el 1 de cada mes.` });
    }
    return NextResponse.json({
      estado: "parcial",
      leads,
      costoUsd: usageTotalUsd ?? null,
      error: `La búsqueda se cortó (estado ${status}), probablemente por el límite de crédito de Apify. Igual rescaté ${leads.length} empresas de las que alcanzó a juntar.`,
    });
  }

  return NextResponse.json({ estado: "listo", leads, costoUsd: usageTotalUsd ?? null });
}
