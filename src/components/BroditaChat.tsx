"use client";

import { useState } from "react";
import { useBroda } from "./BrodaContext";
import type { Mode } from "./Nav";
import type { Client } from "@/lib/data";
import { buscarRelevantes, contextoDeDocs, type DocCerebro } from "@/lib/cerebro";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

export interface AccionBrodita {
  id: string;
  tool: string;
  input: Record<string, unknown>;
}

const ETIQUETA_ACCION: Record<string, string> = {
  crear_flujo: "Armar este flujo en Workflows",
  crear_oportunidad: "Cargar en el CRM",
  agregar_pieza_contenido: "Sumar al plan de contenido",
  guardar_en_cerebro: "Guardar en el cerebro",
};

function resumen(a: AccionBrodita): string {
  const i = a.input;
  const txt = (k: string) => (typeof i[k] === "string" ? (i[k] as string) : "");
  if (a.tool === "crear_flujo") return `${txt("nombre")} · ${Array.isArray(i.pasos) ? i.pasos.length : 0} pasos`;
  if (a.tool === "crear_oportunidad") return [txt("nombre"), txt("empresa")].filter(Boolean).join(" · ");
  if (a.tool === "agregar_pieza_contenido") return [txt("formato"), txt("tema")].filter(Boolean).join(" · ");
  if (a.tool === "guardar_en_cerebro") return txt("titulo");
  return "";
}

export default function BroditaChat({
  mode, client, onAccion, docs,
}: {
  mode: Mode;
  client: Client | null;
  onAccion: (a: AccionBrodita) => string;
  /** El cerebro que corresponde al modo: el de la cuenta o el de Broda. */
  docs: DocCerebro[];
}) {
  const { data } = useBroda();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [fuentes, setFuentes] = useState<DocCerebro[]>([]);
  const [acciones, setAcciones] = useState<AccionBrodita[]>([]);

  function buildContext(): string {
    if (mode === "clientes" && client) {
      return `Modo: Clientes. Cuenta activa: ${client.name} (${client.industry || "sin rubro"}, tier ${client.tier}).`;
    }
    const capasResumen = data.CAPAS.map((c) => `${c.nombre}: ${c.estado}`).join(", ");
    return `Modo: Broda (interno). Infraestructura comercial — ${capasResumen}. Foco del trimestre: ${data.CAPAS.find((c) => c.estado === "foco")?.nombre || "sin definir"}. Líneas de negocio: ${data.LINEAS.map((l) => `${l.nombre} (${l.estado})`).join(", ")}.`;
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && messages.length === 0) {
      setMessages([{
        role: "assistant",
        text: mode === "clientes" && client
          ? `Hola, soy Brodita. Estoy mirando ${client.name}. Puedo armarte flujos, cargar oportunidades en el CRM o pensar la estrategia. ¿Por dónde arrancamos?`
          : "Hola, soy Brodita. Puedo armar flujos, sumar piezas al plan de contenido o guardar lo que definamos en mi cerebro. Decime qué necesitás.",
      }]);
    }
  }

  function aplicar(a: AccionBrodita) {
    const detalle = onAccion(a);
    setAcciones((prev) => prev.filter((x) => x.id !== a.id));
    setMessages((m) => [...m, { role: "assistant", text: `✓ ${detalle}` }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setAcciones([]);
    const relevantes = buscarRelevantes(docs, text, 4);
    setFuentes(relevantes);
    try {
      const res = await fetch("/api/brodita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.text.startsWith("✓ ")),
          context: `${buildContext()}\n\nCerebro de Broda (usalo como fuente; no inventes por fuera de esto):\n${contextoDeDocs(relevantes)}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error de Brodita");
      if (json.reply) setMessages((m) => [...m, { role: "assistant", text: json.reply }]);
      setAcciones(json.acciones ?? []);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e instanceof Error ? e.message : "Se cortó la señal, probá de nuevo." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Hablar con Brodita"
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-accent text-accent-ink font-display font-black text-xl flex items-center justify-center z-[70] shadow-lg"
        style={{ boxShadow: "0 0 0 0 rgba(200,245,66,0.5), 0 14px 34px -16px rgba(0,0,0,0.7)" }}
      >
        <span className="absolute inset-[-6px] rounded-full border-2 border-accent opacity-50 bfab-ring" />
        B
      </button>

      {open && (
        <div className="fixed bottom-[88px] right-5 w-[360px] max-h-[74vh] bg-surface-2 border border-border-strong rounded-2xl shadow-2xl flex flex-col z-[70] overflow-hidden">
          <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border bg-surface">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-display font-black text-accent-ink text-[13px]">B</div>
            <div className="flex-1">
              <div className="font-display font-extrabold text-[12px] uppercase">Brodita</div>
              <div className="text-[9.5px] text-ink-faint">
                {mode === "clientes" && client ? client.name : "Cerebro de ventas y growth"} · {docs.filter((d) => d.activo).length} docs
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink text-[13px] px-1">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5 min-h-[180px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] px-2.5 py-2 rounded-xl text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "assistant"
                    ? "self-start bg-accent/10 border border-accent/25 rounded-bl-sm"
                    : "self-end bg-surface-3 border border-border rounded-br-sm"
                }`}
              >
                {m.text}
              </div>
            ))}

            {acciones.map((a) => (
              <div key={a.id} className="self-start w-[88%] border border-accent/40 bg-accent/[0.06] rounded-xl p-2.5">
                <div className="font-display font-extrabold uppercase text-[9.5px] tracking-wide text-accent mb-1">
                  {ETIQUETA_ACCION[a.tool] ?? a.tool}
                </div>
                <div className="text-[12px] text-ink-soft mb-2 leading-snug">{resumen(a)}</div>
                <div className="flex gap-2">
                  <button onClick={() => aplicar(a)} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[10px] px-3 py-1.5 rounded-lg">
                    Aplicar
                  </button>
                  <button onClick={() => setAcciones((p) => p.filter((x) => x.id !== a.id))} className="text-ink-faint hover:text-ink text-[11px] px-2">
                    Descartar
                  </button>
                </div>
              </div>
            ))}

            {busy && <div className="self-start text-[12px] text-ink-faint italic">Brodita está pensando…</div>}
            {!busy && fuentes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {fuentes.map((f) => (
                  <span key={f.id} className="text-[9.5px] px-1.5 py-0.5 rounded-full border border-border-strong text-ink-faint">{f.titulo}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 p-3 border-t border-border bg-surface">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Pedile algo a Brodita…"
              className="flex-1 border border-border-strong rounded-lg bg-surface-2 text-ink px-2.5 py-2 text-[12.5px] outline-none focus:border-accent"
            />
            <button onClick={send} disabled={busy} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-3.5 rounded-lg disabled:opacity-50">
              Enviar
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bfab-ring { animation: bfabPulse 2.2s ease-out infinite; }
        @keyframes bfabPulse { 0% { transform: scale(0.85); opacity: 0.6; } 100% { transform: scale(1.35); opacity: 0; } }
      `}</style>
    </>
  );
}
