// Setter inmutable por path (array de claves/índices). Permite editar
// cualquier campo anidado de brodaData sin escribir un reducer a mano
// por cada seccion.

export type PathKey = string | number;

export function setPath<T>(obj: T, path: PathKey[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    const idx = Number(head);
    copy[idx] = rest.length ? setPath(copy[idx], rest, value) : value;
    return copy as unknown as T;
  }
  const copy = { ...(obj as Record<string, unknown>) };
  copy[head as string] = rest.length ? setPath(copy[head as string], rest, value) : value;
  return copy as unknown as T;
}

export function getPath<T = unknown>(obj: unknown, path: PathKey[]): T {
  let cur = obj as Record<string, unknown> | unknown[];
  for (const k of path) {
    if (cur == null) return undefined as T;
    cur = (cur as Record<string, unknown>)[k as string] as Record<string, unknown> | unknown[];
  }
  return cur as T;
}
