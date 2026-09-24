import { NextRequest, NextResponse } from "next/server";
import { hayBase, prepararBase, sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { claveTexto, dominioDe, nuevoLead, separarEmails, whatsappDe, type Lead } from "@/lib/prospeccion";

// Puerta de entrada de la prospección automática. Un flujo de n8n corre el
// scraper todas las semanas y deja acá lo que encontró; la app lo lee después.
//
// Cuelga de /api/webhooks/ a propósito: el portero de proxy.ts deja pasar esa
// rama porque quien llama es una máquina, no una persona con el código de
// acceso en el navegador. La autenticación la hace esta ruta con su propio
// token (BROWTH_INGESTA_TOKEN).
//
// Acepta las dos formas: las filas crudas del scraper de Google Maps
// (title, category, address, phone, emails…) y los leads ya armados por la app.

export const runtime = "nodejs";
export const maxDuration = 60;

const TOPE_POR_ENVIO = 500;

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function tokenValido(entrante: string, esperado: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(entrante)),
    crypto.subtle.digest("SHA-256", enc.encode(esperado)),
  ]);
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  let dif = 0;
  for (let i = 0; i < va.length; i++) dif |= va[i] ^ vb[i];
  return dif === 0;
}

/** El barrio viene adentro de un JSON en complete_address del scraper. */
function barrioDe(crudo: unknown): string {
  if (typeof crudo !== "string" || !crudo.startsWith("{")) return "";
  try {
    const j = JSON.parse(crudo) as { borough?: string; city?: string };
    return s(j.borough).replace(/,\s*Comuna \d+/i, "") || s(j.city);
  } catch {
    return "";
  }
}

/** Los emails llegan como lista separada por coma, con basura de los sitios. */
function emailsDe(crudo: unknown): string[] {
  if (Array.isArray(crudo)) return crudo.filter((x): x is string => typeof x === "string");
  if (typeof crudo !== "string") return [];
  return crudo.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
}

type Fila = Record<string, unknown>;

function aLead(f: Fila): Lead | null {
  const empresa = s(f.empresa) || s(f.title);
  if (!empresa) return null;

  const webCruda = s(f.web) || s(f.website);
  // El scraper pone la red social en "website" cuando el comercio no tiene web.
  const esSocial = /instagram\.com|facebook\.com|wa\.me|api\.whatsapp/i.test(webCruda);
  const web = esSocial ? "" : webCruda;

  const telefono = s(f.telefono) || s(f.phone);
  const wa = whatsappDe(telefono);
  const { email, emailGenerico } = separarEmails(emailsDe(f.emails ?? f.email), web);
  const instagram = s(f.instagram) || (esSocial && /instagram/i.test(webCruda) ? webCruda : "");

  return nuevoLead({
    empresa,
    rubro: s(f.rubro) || s(f.category) || s(f.categoryName),
    web,
    direccion: s(f.direccion) || s(f.address),
    localidad: s(f.localidad) || barrioDe(f.complete_address) || s(f.neighborhood),
    telefono,
    whatsapp: wa?.numero ?? "",
    whatsappConfirmado: Boolean(wa?.confirmado),
    email,
    emailGenerico,
    instagram,
    mapsUrl: s(f.mapsUrl) || s(f.link) || s(f.url),
    rating: Number.isFinite(Number(f.review_rating)) ? Number(f.review_rating) : null,
    resenas: Number.isFinite(Number(f.review_count)) ? Number(f.review_count) : null,
  });
}

export async function POST(req: NextRequest) {
  const tope = limitar(req, "inbox", 30, 60 * 60_000);
  if (tope) return tope;

  const esperado = process.env.BROWTH_INGESTA_TOKEN;
  if (!esperado) {
    return NextResponse.json(
      { error: "Falta BROWTH_INGESTA_TOKEN en el servidor: la ingesta automática está apagada." },
      { status: 503 }
    );
  }
  const entrante = req.headers.get("x-browth-ingesta") ?? "";
  if (!entrante || !(await tokenValido(entrante, esperado))) {
    return NextResponse.json({ error: "Token de ingesta inválido." }, { status: 401 });
  }

  if (!hayBase()) {
    return NextResponse.json(
      { error: "No hay base de datos conectada. Instalá la integración de Neon en Vercel." },
      { status: 503 }
    );
  }

  const cuerpo = await req.json().catch(() => null);
  const cuenta = s(cuerpo?.cuenta);
  const filas: Fila[] = Array.isArray(cuerpo?.leads) ? cuerpo.leads : [];
  if (!cuenta) return NextResponse.json({ error: "Falta el nombre de la cuenta." }, { status: 400 });
  if (!filas.length) return NextResponse.json({ error: "No vino ningún lead." }, { status: 400 });
  if (filas.length > TOPE_POR_ENVIO) {
    return NextResponse.json(
      { error: `Llegaron ${filas.length} leads y el tope por envío es ${TOPE_POR_ENVIO}. Mandalos por tandas.` },
      { status: 413 }
    );
  }

  const origen = s(cuerpo?.origen) || "n8n";
  // La tanda la manda el flujo para que sus varios envíos de 200 caigan en una
  // sola lista. Si no viene, se arma con la fecha del día.
  const tanda = s(cuerpo?.tanda) || `${origen} · ${new Date().toISOString().slice(0, 10)}`;
  const leads = filas.map(aLead).filter((l): l is Lead => l !== null).map((l) => ({ ...l, tanda }));

  await prepararBase();
  const q = sql();

  let nuevos = 0;
  let repetidos = 0;
  for (const l of leads) {
    const dominio = dominioDe(l.web);
    const telefonoClave = l.telefono.replace(/\D/g, "").slice(-8);
    const claveTxt = claveTexto(l.empresa, l.direccion);
    // ON CONFLICT no sirve acá: hay dos índices únicos distintos y sólo se
    // puede nombrar uno por sentencia. Se resuelve con una inserción que no
    // pisa nada si ya existe cualquiera de las dos claves.
    const insertadas = await q`
      INSERT INTO leads (id, cuenta, empresa, rubro, web, dominio, direccion, localidad, telefono, telefono_clave, clave_texto, datos, origen)
      SELECT ${l.id}, ${cuenta}, ${l.empresa}, ${l.rubro}, ${l.web}, ${dominio}, ${l.direccion},
             ${l.localidad}, ${l.telefono}, ${telefonoClave}, ${claveTxt}, ${q.json(l)}, ${origen}
      WHERE NOT EXISTS (
        SELECT 1 FROM leads e
        WHERE e.cuenta = ${cuenta}
          AND ((${dominio} <> '' AND e.dominio = ${dominio})
            OR (${telefonoClave} <> '' AND e.telefono_clave = ${telefonoClave})
            OR (${claveTxt} <> '' AND e.clave_texto = ${claveTxt}))
      )
      RETURNING id`;
    if (insertadas.length) nuevos++;
    else repetidos++;
  }

  return NextResponse.json({
    ok: true,
    cuenta,
    recibidos: filas.length,
    validos: leads.length,
    nuevos,
    repetidos,
  });
}
