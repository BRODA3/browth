import { NextRequest, NextResponse } from "next/server";
import { hayBase, prepararBase, sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import type { Lead } from "@/lib/prospeccion";

// Lo que el flujo de n8n fue dejando en la base, para que la app lo muestre.
// Si no hay base conectada devuelve una lista vacía y avisa: la app sigue
// andando contra el navegador como siempre.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tope = limitar(req, "leads", 120, 5 * 60_000);
  if (tope) return tope;

  const cuenta = req.nextUrl.searchParams.get("cuenta")?.trim();
  if (!cuenta) return NextResponse.json({ error: "Falta el nombre de la cuenta." }, { status: 400 });

  if (!hayBase()) return NextResponse.json({ hayBase: false, leads: [] as Lead[] });

  const desde = req.nextUrl.searchParams.get("desde");
  await prepararBase();
  const q = sql();

  const filas = desde
    ? await q`SELECT datos, creado, origen FROM leads
              WHERE cuenta = ${cuenta} AND creado > ${desde} ORDER BY creado DESC LIMIT 1000`
    : await q`SELECT datos, creado, origen FROM leads
              WHERE cuenta = ${cuenta} ORDER BY creado DESC LIMIT 1000`;

  const leads = (filas as { datos: Lead; creado: string; origen: string }[]).map((f) => ({
    ...f.datos,
    creado: new Date(f.creado).toISOString(),
  }));

  return NextResponse.json({ hayBase: true, leads, total: leads.length });
}
