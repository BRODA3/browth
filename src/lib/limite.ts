import { NextRequest, NextResponse } from "next/server";

// Tope de pedidos por IP para las rutas que gastan plata (Claude y Apify).
// Es una defensa de piso: vive en la memoria de cada instancia, así que con
// varias instancias en paralelo el tope real es más alto. Sirve para que un
// bucle roto o un curl repetido no vacíe la cuenta; el control fuerte es el
// código de acceso (ver lib/acceso.ts) más los límites de gasto del proveedor.

const golpes = new Map<string, number[]>();

function ipDe(req: NextRequest): string {
  const fw = req.headers.get("x-forwarded-for");
  return (fw ? fw.split(",")[0] : req.headers.get("x-real-ip"))?.trim() || "desconocida";
}

/** Devuelve una respuesta 429 si se pasó del tope, o null si puede seguir. */
export function limitar(req: NextRequest, ruta: string, maximo: number, ventanaMs: number): NextResponse | null {
  const clave = `${ruta}:${ipDe(req)}`;
  const ahora = Date.now();
  const previos = (golpes.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);

  if (previos.length >= maximo) {
    const esperaS = Math.ceil((ventanaMs - (ahora - previos[0])) / 1000);
    return NextResponse.json(
      { error: `Demasiados pedidos seguidos a esta función. Probá de nuevo en ${esperaS > 60 ? `${Math.ceil(esperaS / 60)} minutos` : `${esperaS} segundos`}.` },
      { status: 429, headers: { "Retry-After": String(esperaS) } }
    );
  }

  previos.push(ahora);
  golpes.set(clave, previos);

  // La memoria no crece para siempre: se limpian las claves sin uso reciente.
  if (golpes.size > 500) {
    for (const [k, v] of golpes) if (v.every((t) => ahora - t > ventanaMs)) golpes.delete(k);
  }
  return null;
}
