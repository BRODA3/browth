"use client";

// Todas las llamadas a la API pasan por acá: si el servidor pide código de
// acceso, se pregunta una vez y queda guardado en el navegador. El código
// nunca viaja a otro lado que no sea nuestro propio servidor.

const CLAVE = "browth:codigo";

function guardado(): string {
  try {
    return window.localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
}

function guardar(codigo: string) {
  try {
    window.localStorage.setItem(CLAVE, codigo);
  } catch {
    // Sin localStorage (modo privado) el código se pide en cada pantalla.
  }
}

async function llamar(url: string, init: RequestInit, codigo: string): Promise<Response> {
  const headers = new Headers(init.headers);
  if (codigo) headers.set("x-browth-codigo", codigo);
  return fetch(url, { ...init, headers });
}

/**
 * fetch con código de acceso. Si el servidor responde 401 por código, lo pide
 * al usuario y reintenta una sola vez.
 */
export async function pedir(url: string, init: RequestInit = {}): Promise<Response> {
  let res = await llamar(url, init, guardado());
  if (res.status !== 401) return res;

  const copia = res.clone();
  const cuerpo = await copia.json().catch(() => null);
  if (!cuerpo?.necesitaCodigo) return res;

  const ingresado = window.prompt("Código de acceso de Browth (te lo pasa el equipo):")?.trim();
  if (!ingresado) return res;

  res = await llamar(url, init, ingresado);
  if (res.ok) guardar(ingresado);
  return res;
}

/** true si el servidor está sin código configurado: cualquiera con el link puede gastar las claves. */
export async function accesoAbierto(): Promise<boolean> {
  try {
    const res = await fetch("/api/acceso", { cache: "no-store" });
    const j = await res.json();
    return j?.abierto === true;
  } catch {
    return false;
  }
}
