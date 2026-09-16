"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  NODO_W, NODO_H, nuevoNodo, nuevoWorkflow, conectar, curva, desdePlantilla, PLANTILLAS,
  type Workflow, type NodoFlujo,
} from "@/lib/workflows";
import { AUTOMATIZACION_LABEL, type Automatizacion } from "@/lib/broda";

// Tablero de flujos por cuenta: cuadros que se arrastran y líneas que se
// dibujan entre ellos. Cada cuadro es un paso con su responsable, su
// herramienta y el agente que lo ejecuta (o que falta construir).

const TONO: Record<Automatizacion, string> = {
  manual: "var(--ink-faint)",
  asistido: "var(--warn)",
  agente: "var(--accent)",
};

export default function Workflows({ flows, onChange }: { flows: Workflow[]; onChange: (f: Workflow[]) => void }) {
  const [activoId, setActivoId] = useState<string | null>(flows[0]?.id ?? null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const activo = flows.find((w) => w.id === activoId) ?? flows[0] ?? null;

  useEffect(() => {
    if (!activo && flows.length > 0) setActivoId(flows[0].id);
  }, [flows, activo]);

  const guardar = (wf: Workflow) => onChange(flows.map((w) => (w.id === wf.id ? wf : w)));
  const crear = (wf: Workflow) => { onChange([...flows, wf]); setActivoId(wf.id); setNuevoAbierto(false); };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {flows.map((w) => (
          <button
            key={w.id}
            onClick={() => setActivoId(w.id)}
            className={`font-display font-extrabold uppercase text-[11px] tracking-wide px-4 py-2 rounded-full border transition-colors ${
              w.id === activo?.id ? "bg-accent text-accent-ink border-accent" : "text-ink-soft border-border-strong hover:text-ink hover:border-ink-faint"
            }`}
          >
            {w.nombre}
          </button>
        ))}
        <button
          onClick={() => setNuevoAbierto(true)}
          className="font-display font-extrabold uppercase text-[11px] tracking-wide px-4 py-2 rounded-full border border-dashed border-border-strong text-ink-faint hover:text-ink hover:border-accent transition-colors"
        >
          + Flujo
        </button>
      </div>

      {activo ? (
        <Tablero
          key={activo.id}
          wf={activo}
          onChange={guardar}
          onDelete={() => { onChange(flows.filter((w) => w.id !== activo.id)); setActivoId(null); }}
        />
      ) : (
        <div className="border border-dashed border-border-strong rounded-[var(--r-lg)] p-10 text-center">
          <p className="text-[14px] text-ink-soft mb-1">Esta cuenta todavía no tiene flujos.</p>
          <p className="text-[12.5px] text-ink-faint mb-5">Armá uno desde cero o bajá uno de los de Broda y adaptalo.</p>
          <button onClick={() => setNuevoAbierto(true)} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-5 py-2.5 rounded-[var(--r-md)]">
            + Nuevo flujo
          </button>
        </div>
      )}

      {nuevoAbierto && <ModalNuevo onClose={() => setNuevoAbierto(false)} onCreate={crear} />}
    </div>
  );
}

/* ---------------- TABLERO ---------------- */

function Tablero({ wf, onChange, onDelete }: { wf: Workflow; onChange: (w: Workflow) => void; onDelete: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [escala, setEscala] = useState(1);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number } | null>(null);
  const [conectando, setConectando] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);

  const seleccionado = wf.nodos.find((n) => n.id === selId) ?? null;
  const pos = (n: NodoFlujo) => (drag?.id === n.id ? { ...n, x: drag.x, y: drag.y } : n);

  /** Coordenadas del tablero (no de la pantalla) para un evento del mouse. */
  const aTablero = useCallback((ev: { clientX: number; clientY: number }) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (ev.clientX - r.left - pan.x) / escala, y: (ev.clientY - r.top - pan.y) / escala };
  }, [pan, escala]);

  useEffect(() => {
    if (!drag && !panning) return;
    const mover = (ev: PointerEvent) => {
      if (drag) {
        const p = aTablero(ev);
        setDrag({ id: drag.id, x: Math.round(p.x - NODO_W / 2), y: Math.round(p.y - 24) });
      } else if (panning) {
        setPan({ x: ev.clientX - panning.x, y: ev.clientY - panning.y });
      }
    };
    const soltar = () => {
      if (drag) {
        onChange({ ...wf, nodos: wf.nodos.map((n) => (n.id === drag.id ? { ...n, x: drag.x, y: drag.y } : n)) });
        setDrag(null);
      }
      setPanning(null);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
  }, [drag, panning, aTablero, onChange, wf]);

  const agregar = () => {
    const r = ref.current?.getBoundingClientRect();
    const centro = { x: ((r ? r.width / 2 : 400) - pan.x) / escala - NODO_W / 2, y: ((r ? r.height / 2 : 300) - pan.y) / escala - NODO_H / 2 };
    const n = nuevoNodo(Math.round(centro.x), Math.round(centro.y), { titulo: "Nuevo paso" });
    onChange({ ...wf, nodos: [...wf.nodos, n] });
    setSelId(n.id);
  };

  const clickNodo = (id: string) => {
    if (conectando && conectando !== id) {
      const existe = wf.conexiones.some((c) => c.desde === conectando && c.hasta === id);
      if (!existe) onChange({ ...wf, conexiones: [...wf.conexiones, conectar(conectando, id)] });
      setConectando(null);
      return;
    }
    setSelId(id);
  };

  const borrarNodo = (id: string) => {
    onChange({ ...wf, nodos: wf.nodos.filter((n) => n.id !== id), conexiones: wf.conexiones.filter((c) => c.desde !== id && c.hasta !== id) });
    setSelId(null);
  };

  const nodoOrigen = conectando ? wf.nodos.find((n) => n.id === conectando) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={agregar} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">
          + Cuadro
        </button>
        <span className="text-[12px] text-ink-faint">
          {conectando ? "Tocá el cuadro al que querés conectar, o Escape para cancelar." : "Arrastrá los cuadros. Para unir dos, tocá el punto lima de la derecha."}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Chip onClick={() => setEscala((e) => Math.max(0.5, +(e - 0.1).toFixed(2)))}>−</Chip>
          <span className="tabular text-[11.5px] text-ink-faint w-10 text-center">{Math.round(escala * 100)}%</span>
          <Chip onClick={() => setEscala((e) => Math.min(1.5, +(e + 0.1).toFixed(2)))}>+</Chip>
          <Chip onClick={() => { setPan({ x: 0, y: 0 }); setEscala(1); }}>Centrar</Chip>
          <Chip onClick={() => { if (confirm(`¿Borrar el flujo "${wf.nombre}"?`)) onDelete(); }}>Borrar flujo</Chip>
        </div>
      </div>

      <div
        ref={ref}
        onPointerDown={(ev) => { if (ev.target === ev.currentTarget || (ev.target as HTMLElement).dataset.fondo) { setPanning({ x: ev.clientX - pan.x, y: ev.clientY - pan.y }); setSelId(null); } }}
        onPointerMove={(ev) => conectando && setMouse(aTablero(ev))}
        onKeyDown={(ev) => ev.key === "Escape" && setConectando(null)}
        tabIndex={0}
        className="relative h-[620px] overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface-2/40 outline-none cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: `${24 * escala}px ${24 * escala}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div data-fondo="1" className="absolute inset-0" />
        <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${escala})` }}>
          <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: 1, height: 1 }}>
            {wf.conexiones.map((c) => {
              const a = wf.nodos.find((n) => n.id === c.desde);
              const b = wf.nodos.find((n) => n.id === c.hasta);
              if (!a || !b) return null;
              const { d, x1, y1, x2, y2 } = curva(pos(a), pos(b));
              return (
                <g key={c.id} className="pointer-events-auto">
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} className="cursor-pointer"
                    onClick={() => { if (confirm("¿Borrar esta conexión?")) onChange({ ...wf, conexiones: wf.conexiones.filter((x) => x.id !== c.id) }); }} />
                  <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="5 5" opacity={0.75} className="wf-flow" />
                  <circle cx={x1} cy={y1} r={3.5} fill="var(--accent)" />
                  <circle cx={x2} cy={y2} r={3.5} fill="var(--accent)" />
                </g>
              );
            })}
            {nodoOrigen && mouse && (
              <path
                d={`M${pos(nodoOrigen).x + NODO_W},${pos(nodoOrigen).y + NODO_H / 2} C${pos(nodoOrigen).x + NODO_W + 80},${pos(nodoOrigen).y + NODO_H / 2} ${mouse.x - 80},${mouse.y} ${mouse.x},${mouse.y}`}
                fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="4 4"
              />
            )}
          </svg>

          {wf.nodos.map((n0) => {
            const n = pos(n0);
            const activo = selId === n.id;
            return (
              <div
                key={n.id}
                className={`absolute rounded-[var(--r-md)] border bg-surface transition-shadow ${activo ? "border-accent" : "border-border-strong"}`}
                style={{
                  left: n.x, top: n.y, width: NODO_W, minHeight: NODO_H,
                  boxShadow: activo ? "0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent)" : "var(--shadow-card)",
                }}
                onPointerDown={(ev) => { ev.stopPropagation(); const p = aTablero(ev); setDrag({ id: n.id, x: Math.round(p.x - NODO_W / 2), y: Math.round(p.y - 24) }); }}
                onClick={(ev) => { ev.stopPropagation(); clickNodo(n.id); }}
              >
                <div className="flex items-center gap-2 px-3 pt-2.5">
                  <span className="font-display font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded" style={{ color: TONO[n.automatizacion], background: `color-mix(in srgb, ${TONO[n.automatizacion]} 14%, transparent)` }}>
                    {n.etiqueta || AUTOMATIZACION_LABEL[n.automatizacion]}
                  </span>
                  {n.tiempo && <span className="ml-auto text-[10px] text-ink-faint tabular">{n.tiempo}</span>}
                </div>
                <div className="px-3 pt-1.5 pb-3">
                  <div className="text-[13px] font-semibold leading-snug line-clamp-2">{n.titulo || "Sin título"}</div>
                  {(n.responsable || n.herramienta) && (
                    <div className="text-[10.5px] text-ink-faint mt-1.5 truncate">
                      {[n.responsable, n.herramienta].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {n.agente && (
                    <div className="text-[10.5px] mt-1 truncate" style={{ color: TONO[n.automatizacion] }}>
                      Agente: {n.agente}
                    </div>
                  )}
                </div>
                <button
                  title="Conectar con otro cuadro"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => { ev.stopPropagation(); setConectando(conectando === n.id ? null : n.id); }}
                  className={`absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    conectando === n.id ? "bg-accent border-accent" : "bg-surface border-accent hover:bg-accent"
                  }`}
                />
                <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-surface-3 border border-border-strong" />
              </div>
            );
          })}
        </div>

        {wf.nodos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[13px] text-ink-faint">Tablero vacío. Tocá <b className="text-ink-soft">+ Cuadro</b> para el primer paso.</p>
          </div>
        )}
      </div>

      {seleccionado && (
        <PanelNodo
          nodo={seleccionado}
          onChange={(n) => onChange({ ...wf, nodos: wf.nodos.map((x) => (x.id === n.id ? n : x)) })}
          onClose={() => setSelId(null)}
          onDelete={() => borrarNodo(seleccionado.id)}
        />
      )}

      <style>{`
        .wf-flow { animation: wfFlow 1.6s linear infinite; }
        @keyframes wfFlow { to { stroke-dashoffset: -20; } }
        @media (prefers-reduced-motion: reduce) { .wf-flow { animation: none; } }
      `}</style>
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border border-border-strong rounded-[var(--r-sm)] px-2.5 py-1 text-[11.5px] text-ink-soft hover:text-ink hover:border-ink-faint transition-colors">
      {children}
    </button>
  );
}

/* ---------------- PANEL DEL CUADRO ---------------- */

function PanelNodo({ nodo, onChange, onClose, onDelete }: {
  nodo: NodoFlujo; onChange: (n: NodoFlujo) => void; onClose: () => void; onDelete: () => void;
}) {
  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent w-full";
  const set = <K extends keyof NodoFlujo>(k: K, v: NodoFlujo[K]) => onChange({ ...nodo, [k]: v });

  return (
    <div className="border border-border rounded-[var(--r-lg)] bg-surface p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="eyebrow">Paso del flujo</span>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-[16px] leading-none">×</button>
      </div>

      <input value={nodo.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Qué pasa en este paso"
        className="w-full bg-transparent border-none outline-none font-display font-extrabold text-[19px] text-ink placeholder:text-ink-faint mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Campo t="Etiqueta"><input value={nodo.etiqueta} onChange={(e) => set("etiqueta", e.target.value)} placeholder="Captación, Propuesta…" className={field} /></Campo>
        <Campo t="Quién"><input value={nodo.responsable} onChange={(e) => set("responsable", e.target.value)} className={field} /></Campo>
        <Campo t="Con qué"><input value={nodo.herramienta} onChange={(e) => set("herramienta", e.target.value)} placeholder="WhatsApp API, CRM…" className={field} /></Campo>
        <Campo t="Cuánto tarda"><input value={nodo.tiempo} onChange={(e) => set("tiempo", e.target.value)} placeholder="48 hs" className={field} /></Campo>
        <Campo t="Estado">
          <select value={nodo.automatizacion} onChange={(e) => set("automatizacion", e.target.value as Automatizacion)} className={field}>
            {(Object.keys(AUTOMATIZACION_LABEL) as Automatizacion[]).map((a) => <option key={a} value={a}>{AUTOMATIZACION_LABEL[a]}</option>)}
          </select>
        </Campo>
        <Campo t="Agente"><input value={nodo.agente} onChange={(e) => set("agente", e.target.value)} placeholder="Cuál lo hace o hay que construir" className={field} /></Campo>
      </div>

      <Campo t="Detalle"><textarea value={nodo.detalle} onChange={(e) => set("detalle", e.target.value)} rows={3} className={`${field} resize-y`} /></Campo>

      <button onClick={() => { if (confirm("¿Borrar este cuadro?")) onDelete(); }} className="mt-4 text-[12px] text-critical hover:underline">
        Borrar cuadro
      </button>
    </div>
  );
}

function Campo({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint">{t}{children}</label>;
}

/* ---------------- NUEVO FLUJO ---------------- */

function ModalNuevo({ onClose, onCreate }: { onClose: () => void; onCreate: (w: Workflow) => void }) {
  const [nombre, setNombre] = useState("");
  const [plantilla, setPlantilla] = useState("");
  const field = "border border-border-strong rounded-[var(--r-md)] px-3 py-2 bg-bg text-ink text-[13px] outline-none focus:border-accent w-full";

  const crear = () => {
    const n = nombre.trim() || (plantilla ? PLANTILLAS.find((p) => p.id === plantilla)!.nombre : "Flujo nuevo");
    onCreate(plantilla ? desdePlantilla(plantilla, n) : nuevoWorkflow(n));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[80] p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border-strong rounded-[var(--r-xl)] p-6 w-full max-w-sm" style={{ boxShadow: "var(--shadow-pop)" }}>
        <h3 className="text-[17px] normal-case tracking-tight font-display font-extrabold mb-4">Nuevo flujo</h3>
        <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint mb-3">
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Onboarding" className={field} autoFocus />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint mb-5">
          Arrancar desde
          <select value={plantilla} onChange={(e) => setPlantilla(e.target.value)} className={field}>
            <option value="">Tablero vacío</option>
            {PLANTILLAS.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-ink-soft hover:text-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5">Cancelar</button>
          <button onClick={crear} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">Crear</button>
        </div>
      </div>
    </div>
  );
}
