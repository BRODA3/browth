import { NextResponse } from "next/server";

// Dice si el servidor tiene código de acceso configurado. Lo usa la app para
// avisar cuando está abierta al público: sin código, cualquiera que tenga el
// link puede gastar las claves de Claude y de Apify.
// No revela el código ni ningún otro dato del servidor.

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ abierto: !process.env.BROWTH_ACCESS_CODE });
}
