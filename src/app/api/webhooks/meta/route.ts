import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Webhook de Meta para WhatsApp Business Cloud API e Instagram Messaging.
// GET: verificación que hace Meta al registrar la URL.
// POST: mensajes entrantes → se normalizan como leads del CRM.
// Variables: META_VERIFY_TOKEN (lo inventás vos y lo pegás igual en Meta)
// y META_APP_SECRET (de la app de Meta, para validar la firma).

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const token = process.env.META_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export interface LeadEntrante {
  fuente: "whatsapp" | "instagram";
  externoId: string;
  nombre: string;
  telefono: string;
  texto: string;
  fecha: string;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Falta META_APP_SECRET en el servidor." }, { status: 500 });
  }
  if (!firmaValida(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return new Response("Firma inválida", { status: 401 });
  }

  let body: MetaPayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const leads = normalizar(body);

  // Pendiente: guardar `leads` en la base de datos del CRM (Postgres en Vercel).
  // Hasta que exista la base, se registran en los logs de la función.
  console.log(`[webhook meta] ${leads.length} mensaje(s)`, JSON.stringify(leads));

  // Meta reintenta si no recibe 200 rápido.
  return NextResponse.json({ recibidos: leads.length });
}

function firmaValida(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const esperada = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const recibida = Buffer.from(header.slice(7));
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

interface MetaPayload {
  object?: string;
  entry?: {
    id?: string;
    changes?: { value?: {
      contacts?: { wa_id?: string; profile?: { name?: string } }[];
      messages?: { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } }[];
    } }[];
    messaging?: { sender?: { id?: string }; timestamp?: number; message?: { mid?: string; text?: string; is_echo?: boolean } }[];
  }[];
}

function normalizar(body: MetaPayload): LeadEntrante[] {
  const out: LeadEntrante[] = [];
  for (const entry of body.entry ?? []) {
    // WhatsApp Business Cloud API
    for (const change of entry.changes ?? []) {
      const v = change.value;
      for (const msg of v?.messages ?? []) {
        const contacto = v?.contacts?.find((c) => c.wa_id === msg.from);
        out.push({
          fuente: "whatsapp",
          externoId: msg.from ?? "",
          nombre: contacto?.profile?.name ?? "",
          telefono: msg.from ?? "",
          texto: msg.type === "text" ? msg.text?.body ?? "" : `[${msg.type}]`,
          fecha: new Date(Number(msg.timestamp ?? 0) * 1000).toISOString(),
        });
      }
    }
    // Instagram Messaging API (DMs)
    for (const ev of entry.messaging ?? []) {
      if (!ev.message || ev.message.is_echo) continue;
      out.push({
        fuente: "instagram",
        externoId: ev.sender?.id ?? "",
        nombre: "",
        telefono: "",
        texto: ev.message.text ?? "[adjunto]",
        fecha: new Date(ev.timestamp ?? Date.now()).toISOString(),
      });
    }
  }
  return out;
}
