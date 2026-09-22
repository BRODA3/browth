import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Portero de las rutas de API. Browth es una app pública en Vercel: sin esto,
// cualquiera que tenga el link puede hacer trabajar a Claude y a Apify con
// nuestras claves y vaciarnos la cuenta.
//
// Se activa cargando BROWTH_ACCESS_CODE en el servidor. El equipo lo escribe
// una vez en el navegador y queda guardado.
//
// El webhook de Meta queda afuera a propósito: lo llama Meta, no una persona,
// y valida su propia firma con META_APP_SECRET.

export const config = {
  matcher: ["/api/:path*"],
};

/** Comparación en tiempo constante, sin filtrar el código por la demora. */
async function iguales(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let dif = 0;
  for (let i = 0; i < va.length; i++) dif |= va[i] ^ vb[i];
  return dif === 0;
}

export async function proxy(req: NextRequest) {
  const codigo = process.env.BROWTH_ACCESS_CODE;

  // Sin código configurado la app funciona igual (desarrollo local), pero avisa
  // en cada respuesta para que no quede abierta en producción sin querer.
  if (!codigo) {
    const res = NextResponse.next();
    res.headers.set("x-browth-acceso", "abierto");
    return res;
  }

  if (req.nextUrl.pathname.startsWith("/api/webhooks/")) return NextResponse.next();

  const entrante = req.headers.get("x-browth-codigo") ?? req.cookies.get("browth_codigo")?.value ?? "";
  if (entrante && (await iguales(entrante, codigo))) {
    const res = NextResponse.next();
    // Se recuerda en una cookie httpOnly: no queda expuesta a scripts de la página.
    res.cookies.set("browth_codigo", codigo, {
      httpOnly: true,
      sameSite: "strict",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json(
    { error: "Código de acceso incorrecto o faltante.", necesitaCodigo: true },
    { status: 401 }
  );
}
