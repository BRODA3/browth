# Prospección semanal automática

Todos los lunes a las 7 de la mañana el flujo busca empresas nuevas en Google
Maps y las deja en Browth. No cuesta plata: el scraper es open source
(`gosom/google-maps-scraper`, licencia MIT) y corre en tu propia máquina.

```
n8n  ──POST /api/v1/jobs──▶  scraper  ──▶  Google Maps
 │                              │
 │    ◀──GET .../download───────┘  (CSV)
 │
 └────POST /api/webhooks/leads──▶  Browth  ──▶  Neon (Postgres)
```

## Qué hace, paso a paso

1. **Arranca solo** los lunes a las 7:00 (hora de Buenos Aires).
2. **Arma las búsquedas** de la semana cruzando rubros × zonas. Son muchas
   combinaciones, así que hace 12 por semana y va rotando: en unas semanas
   cubre todo el mapa sin repetir.
3. **Le pide el trabajo al scraper** y espera media hora.
4. **Baja el CSV**, lo convierte en leads y los manda a Browth de a 200.
5. Browth **descarta los repetidos** por dominio y por teléfono, y guarda los
   nuevos.
6. En Browth, la pestaña Prospección tiene el botón **«↓ Traer de n8n»**.

## Puesta en marcha

### 1. La base de datos de Browth

Los leads necesitan dónde vivir. En **Vercel → proyecto browth → Storage →
Create Database → Neon**. Vercel crea la base y carga `DATABASE_URL` solo.
Las tablas se crean solas la primera vez que entra un lead.

### 2. Las variables en Vercel

En **Settings → Environment Variables**, marcando *Production* y *Preview*:

| Variable | Qué es |
|---|---|
| `BROWTH_INGESTA_TOKEN` | Inventalo, largo. Es la llave con la que n8n deja leads. |
| `DATABASE_URL` | La pone Neon sola. |
| `BROWTH_ACCESS_CODE` | El código de acceso del equipo. |
| `ANTHROPIC_API_KEY` | Para investigar leads y analizar competencia. |

Después **Redeploy**, si no las variables no entran.

### 3. Levantar n8n y el scraper

```bash
cd n8n
cp .env.example .env     # y completalo
docker compose up -d
```

- n8n → http://localhost:5678
- scraper → http://localhost:8080 (la API se documenta sola en `/api/docs`)

La primera vez el scraper descarga Playwright: tarda varios minutos. Queda
cacheado en un volumen, así que pasa una sola vez.

### 4. Importar el flujo

En n8n: **Workflows → ⋯ → Import from File** → `prospeccion-semanal.json`.
Después abrí el nodo **«Perfil y búsquedas de la semana»** y cambiá `CUENTA`,
`RUBROS` y `ZONAS` por los del cliente. Activá el workflow con el interruptor
de arriba a la derecha.

Para probarlo sin esperar al lunes: **Execute Workflow**. Bajá `POR_SEMANA` a
2 y el nodo «Esperar a que termine» a 5 minutos mientras probás.

## Para otro cliente

Duplicá el workflow y cambiá `CUENTA`, `RUBROS` y `ZONAS`. Los leads quedan
separados por cuenta en la base, así que no se mezclan.

## Cuando algo falla

| Síntoma | Qué pasa |
|---|---|
| `El CSV vino vacío` | El scraper todavía no terminó. Subí el tiempo del nodo «Esperar a que termine» o bajá `POR_SEMANA`. |
| `503 · No hay base de datos conectada` | Falta la integración de Neon en Vercel, o falta el redeploy. |
| `401 · Token de ingesta inválido` | El `BROWTH_INGESTA_TOKEN` del `.env` no es el mismo que el de Vercel. |
| `413 · el tope por envío es 500` | Bajá el `batchSize` del nodo «De a 200». |
| El scraper no arranca | Docker Desktop cerrado, o el puerto 8080 ocupado. |

## Lo que todavía no hace

- **Investigar cada lead** (decisor, mail, score). Eso gasta crédito de
  Anthropic, así que se dispara a mano desde Browth y de a tandas.
- **El análisis de competencia semanal**. Va en un flujo aparte.
