import postgres from "postgres";

// Base de datos de la prospección. Hasta acá los leads vivían solo en el
// navegador de cada persona; eso alcanza mientras alguien los busca a mano,
// pero no cuando un flujo de n8n deja leads nuevos todos los lunes a la
// madrugada y nadie tiene la pestaña abierta.
//
// Se activa sola cuando existe DATABASE_URL. Sin esa variable la app sigue
// funcionando como antes, contra el navegador, así que no rompe nada.
//
// Usa postgres.js y no el driver de Neon a propósito: Neon habla por su propio
// proxy y no se conecta a un Postgres común, así que con él no se podría
// desarrollar contra el contenedor local. postgres.js sirve para los dos, y la
// misma DATABASE_URL apunta al Docker de casa o a Neon en producción.

export const hayBase = () => Boolean(process.env.DATABASE_URL);

/**
 * El driver tipa el resultado con su propia clase de arreglo. Nosotros siempre
 * queremos la forma simple —filas— así que lo estrechamos acá y no en cada ruta.
 */
type Consulta = (<T = Record<string, unknown>>(
  plantilla: TemplateStringsArray,
  ...valores: unknown[]
) => Promise<T[]>) & {
  /**
   * Envuelve un objeto para guardarlo en una columna jsonb. Hace falta: el
   * driver serializa solo, así que pasarle un texto ya serializado lo guarda
   * como una cadena JSON en vez de como objeto, y después se lee vacío.
   */
  json: (valor: unknown) => unknown;
};

// Inicialización perezosa: conectar explota sin DATABASE_URL, y el módulo se
// evalúa durante el build, cuando la variable todavía puede no existir.
let _sql: ReturnType<typeof postgres> | null = null;

export function sql(): Consulta {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL: la base de datos no está conectada.");
    _sql = postgres(url, {
      // Cada función de Vercel es un proceso corto: una conexión alcanza, y así
      // no se agota el cupo del pooler cuando hay varias corriendo a la vez.
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      // El Postgres de desarrollo no tiene TLS; Neon sí y lo pide en la URL.
      ssl: url.includes("sslmode=require") ? "require" : false,
    });
  }
  return _sql as unknown as Consulta;
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
      clave_texto   TEXT NOT NULL DEFAULT '',
      datos         JSONB NOT NULL,
      origen        TEXT NOT NULL DEFAULT 'app',
      creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

  // Deduplicación: dos leads son el mismo si comparten dominio o los últimos
  // ocho dígitos del teléfono dentro de la misma cuenta. Los índices son
  // parciales porque muchísimas fichas de Maps no tienen web ni teléfono y
  // ahí el vacío no significa "es el mismo".
  // Para bases creadas antes de que existiera la tercera clave.
  await q`ALTER TABLE leads ADD COLUMN IF NOT EXISTS clave_texto TEXT NOT NULL DEFAULT ''`;

  await q`CREATE UNIQUE INDEX IF NOT EXISTS leads_dominio ON leads (cuenta, dominio) WHERE dominio <> ''`;
  await q`CREATE UNIQUE INDEX IF NOT EXISTS leads_telefono ON leads (cuenta, telefono_clave) WHERE telefono_clave <> ''`;
  // La red de seguridad: nombre + calle, para las fichas sin web ni teléfono.
  await q`CREATE UNIQUE INDEX IF NOT EXISTS leads_texto ON leads (cuenta, clave_texto) WHERE clave_texto <> ''`;
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
