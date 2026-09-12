# Browth — by Broda

Consola de growth ops de [Broda Studio](https://broda.studio): los 4 motores **Get, Convert, Keep y Grow** replicados como un embudo gráfico interactivo, con playbooks de tareas fijas, catálogo de agentes de IA, mapa de procesos/experimentos/APIs por motor, métricas por cuenta y roles de equipo.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tokens de marca Broda (negro + verde lima `#C8F542`) en `src/app/globals.css`
- Tipografía: **Archivo** (900, mayúsculas) para títulos/HUD, **Inter** para texto de cuerpo

## Estado actual

Todo el estado (cuentas, tareas, agentes, KPIs) vive en memoria del cliente (`useState` en `src/components/App.tsx`) — no hay backend ni base de datos todavía. Es el paso siguiente antes de conectar APIs reales:

## Próximos pasos (integraciones reales)

Las credenciales de CRM/WhatsApp/Meta **nunca deben vivir en el cliente**. El camino:

1. Agregar una base de datos (Postgres vía [Neon](https://neon.tech) o [Supabase](https://supabase.com), o Vercel Postgres) para persistir cuentas/tareas/KPIs entre sesiones y usuarios.
2. Crear API routes (`src/app/api/.../route.ts`) que hagan de intermediarias con:
   - **CRM (HubSpot)** — leads, deals, tickets
   - **WhatsApp Business Cloud API** — calificación inbound, seguimiento
   - **Meta Marketing API** — optimización de pauta
   - **Google Calendar API** — agenda de reuniones
3. Configurar los tokens como variables de entorno en Vercel (`Project Settings → Environment Variables`), nunca en el repo.
4. Reemplazar el chat de Brodita (mascota de growth) con una API route que llame a la API de Anthropic server-side (`ANTHROPIC_API_KEY`).

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Deploy

Conectado a Vercel: cada push a `main` despliega a producción, cada PR genera un preview URL.
