import { neon } from "@neondatabase/serverless";

// Base de datos de la prospección. Hasta acá los leads vivían solo en el
// navegador de cada persona; eso alcanza mientras alguien los busca a mano,
// pero no cuando un flujo de n8n deja leads nuevos todos los lunes a la
// madrugada y nadie tiene la pestaña abierta.
//
// Se activa sola cuando existe DATABASE_URL (la inyecta la integración de Neon
// en Vercel). Sin esa variable la app sigue funcionando como antes, contra el
// navegador, así que no rompe nada en desarrollo.

export const hayBase = () => Boolean(process.env.DATABASE_URL);

/**
 * El driver tipa el resultado como una unión de varias formas posibles según
 * las opciones de la consulta. Nosotros siempre usamos la forma simple —un
 * arreglo de filas— así que lo estrechamos acá y no en cada ruta.
 */
type Consulta = <T = Record<string, unknown>>(
  plantilla: TemplateStringsArray,
  ...valores: unknown[]
) => Promise<T[]>;

// Inicialización perezosa: neon() explota si no hay DATABASE_URL, y el módulo
// se evalúa durante el build, cuando la variable todavía puede no existir.
let _sql: Consulta | null = null;

export function sql(): Consulta {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL: la base de datos no está conectada.");
    _sql = neon(url) as unknown as Consulta;
  }
  return _sql;
}

/**
 * Crea las tablas si no están. Se llama al principio de cada ruta que toca la
 * base: son dos sentencias idempotentes y ahorra tener que correr migraciones a
 * mano cada vez que se despliega.
 */
let listo: Promise<void> | null = null;

export function prepararBase(): Promise<void> {
  if (!listo) listo = crear();
  return listo;
}

async function crear() {
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS leads (
      id            TEXT PRIMARY KEY,
      cuenta        TEXT NOT NULL,
      empresa       TEXT NOT NULL,
      rubro         TEXT NOT NULL DEFAULT '',
      web           TEXT NOT NULL DEFAULT '',
      dominio       TEXT NOT NULL DEFAULT '',
      direccion     TEXT NOT NULL DEFAULT '',
      localidad     TEXT NOT NULL DEFAULT '',
      telefono      TEXT NOT NULL DEFAULT '',
      telefono_clave TEXT NOT NULL DEFAULT '',
      datos         JSONB NOT NULL,
      origen        TEXT NOT NULL DEFAULT 'app',
      creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

  // Deduplicación: dos leads son el mismo si comparten dominio o los últimos
  // ocho dígitos del teléfono dentro de la misma cuenta. Los índices son
  // parciales porque muchísimas fichas de Maps no tienen web ni teléfono y
  // ahí el vacío no significa "es el mismo".
  await q`CREATE UNIQUE INDEX IF NOT EXISTS leads_dominio ON leads (cuenta, dominio) WHERE dominio <> ''`;
  await q`CREATE UNIQUE INDEX IF NOT EXISTS leads_telefono ON leads (cuenta, telefono_clave) WHERE telefono_clave <> ''`;
  await q`CREATE INDEX IF NOT EXISTS leads_cuenta ON leads (cuenta, creado DESC)`;

  await q`
    CREATE TABLE IF NOT EXISTS analisis_competencia (
      id      TEXT PRIMARY KEY,
      cuenta  TEXT NOT NULL,
      fecha   TIMESTAMPTZ NOT NULL DEFAULT now(),
      datos   JSONB NOT NULL
    )`;
  await q`CREATE INDEX IF NOT EXISTS analisis_cuenta ON analisis_competencia (cuenta, fecha DESC)`;
}
