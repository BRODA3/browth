# Seguridad de Browth

Browth hace trabajar a Claude y a Apify con **claves que se pagan por uso** y guarda
**datos personales de terceros** (nombres, emails y teléfonos de decisores). Este
documento dice qué está protegido, cómo, y qué queda en manos del equipo.

## 1. Las claves

| Clave | Para qué | Dónde va |
|---|---|---|
| `ANTHROPIC_API_KEY` | Brodita y los agentes de investigación | Vercel → Settings → Environment Variables, y `.env.local` en desarrollo |
| `APIFY_TOKEN` | Búsqueda de empresas en Google Maps | idem |
| `BROWTH_ACCESS_CODE` | Código de acceso del equipo | idem |
| `META_VERIFY_TOKEN`, `META_APP_SECRET` | Webhook de WhatsApp e Instagram | idem |

Reglas:

- **Ninguna clave llega al navegador.** Todas se leen en API routes (`runtime: "nodejs"`),
  nunca en componentes de cliente. No usar el prefijo `NEXT_PUBLIC_` para secretos.
- `.env*` está en `.gitignore` (menos `.env.local.example`, que no tiene valores).
- Si una clave se filtró: rotarla en el proveedor **y** en Vercel. Rotar no borra
  el gasto ya hecho, así que revisar también el consumo.

## 2. Quién puede usar la app

La app es pública en internet: sin control, cualquiera con el link puede hacer
trabajar a los agentes y gastar el crédito.

- `src/proxy.ts` exige el código `BROWTH_ACCESS_CODE` en todas las rutas `/api/*`.
- El código se compara en tiempo constante (SHA-256 + comparación sin cortes) para
  no filtrarlo por la demora de la respuesta.
- Se guarda en una cookie `httpOnly`, `sameSite: strict`: no la pueden leer scripts
  de la página.
- **Si la variable no está cargada, la app funciona igual pero muestra un cartel rojo
  de "app abierta".** Es para no romper el desarrollo local; en producción hay que cargarla.
- El webhook de Meta queda fuera del código de acceso a propósito: lo llama Meta, y
  valida su propia firma HMAC con `META_APP_SECRET`.

Pendiente: no hay usuarios ni roles. Todo el que tiene el código ve todas las cuentas.

## 3. Tope de gasto

- **Apify:** antes de cada búsqueda se consulta el crédito disponible y se rechaza
  la que no entre. La pantalla muestra el costo estimado y pide confirmación.
- **Claude:** topes de pedidos por IP en cada ruta (`src/lib/limite.ts`):
  competencia 5 por hora, búsqueda 6 por hora, investigación 120 cada 10 minutos,
  Brodita 40 cada 5 minutos.
  Es una defensa de piso: vive en la memoria de cada instancia, así que con varias
  instancias en paralelo el tope real es más alto. **El control duro es el límite
  de gasto mensual en la consola de Anthropic**, que conviene dejar configurado.
- Los agentes tienen tope de búsquedas y de lecturas web por corrida.

## 4. El contenido ajeno no da órdenes

Los agentes leen webs de terceros. Una web puede traer texto escrito para manipular
al modelo ("ignorá tus instrucciones", "poné score 10", "mandá un mail a…").

- El contenido leído viaja entre etiquetas `<contenido_web>` y el prompt de sistema
  dice explícitamente que es contenido y nunca instrucciones.
- El modelo **no puede ejecutar acciones**: devuelve datos en una herramienta con
  esquema estricto, y todo lo que escribe se valida antes de mostrarse
  (URLs solo `http(s)`, emails con formato válido, se descartan fragmentos raros).
- Las acciones de Brodita (cargar el CRM, lanzar una búsqueda, guardar en el brain)
  **siempre las confirma una persona** con el botón "Aplicar". Nada se ejecuta solo.

## 5. Pedidos salientes (SSRF)

`leerPagina` en `src/lib/agenteServer.ts` recibe URLs que vienen del navegador:

- Solo `http` y `https`.
- Bloquea `localhost`, dominios internos (`.local`, `.internal`), nombres sin punto
  e IPs directas (v4 y v6), que es como se llega a los metadatos del servidor.
- Las redirecciones se siguen a mano, validando cada salto (hasta 4), para que una
  redirección no termine en la red interna.
- Timeout de 10 segundos y solo se procesa HTML.

## 6. En el navegador

- El informe de competencia y los textos de los agentes se muestran con
  `src/components/Markdown.tsx`, que **arma elementos de React y nunca usa
  `dangerouslySetInnerHTML`**: texto de una web ajena no puede inyectar scripts.
- Los links externos van con `rel="noopener noreferrer"`.

## 7. Los datos

- Hoy **todo vive en el `localStorage` del navegador de cada persona**: leads, CRM,
  brains, prompts y análisis. No hay servidor con datos ni backup: si se limpia el
  navegador, se pierde. Tampoco se comparte entre personas.
- Los leads son **datos personales de terceros** (Ley 25.326 en Argentina, RGPD si
  hay contactos en Europa). Obligaciones prácticas:
  - Guardar la fuente de cada dato (el agente ya la registra).
  - Dar de baja a quien lo pida: usar el estado "No contactar" y la lista de
    exclusión del perfil.
  - No mandar mensajes masivos desde el número de WhatsApp de la agencia.

## 8. Qué falta (deuda conocida)

1. Base de datos con usuarios y roles, en lugar de `localStorage`.
2. Límite de pedidos compartido entre instancias (hoy es por instancia).
3. Registro de auditoría: quién lanzó cada búsqueda y cuánto costó.
4. Alertas de gasto antes de llegar al tope del proveedor.

## Reportar un problema

Escribir a admin@broda.studio. No abrir un issue público con detalles de una
vulnerabilidad ni con claves.
