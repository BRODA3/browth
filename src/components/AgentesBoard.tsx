"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STAGES, AGENT_STATUS_OPTIONS, type StageId, type AgentStatusValue } from "@/lib/data";
import {
  CARD_W, CARD_H, COLOR_ETAPA, nuevoAgente, duplicarAgente, type AgenteConfig,
} from "@/lib/agentes";

// Tablero libre de agentes: las tarjetas flotan en 3D sobre una grilla en
// perspectiva, se arrastran a donde uno quiera y al tocar una se abre su
// configuración al costado — disparador, fuentes, límites, API y prompt.

export default function AgentesBoard({
  agentes, onChange,
}: {
  agentes: AgenteConfig[];
  onChange: (a: AgenteConfig[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [escala, setEscala] = useState(0.95);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<StageId | null>(null);

  const sel = agentes.find((a) => a.id === selId) ?? null;
  const visibles = filtro ? agentes.filter((a) => a.etapa === filtro) : agentes;
  const activos = agentes.filter((a) => a.estado === "Activo").length;

  const pos = (a: AgenteConfig) => (drag?.id === a.id ? { x: drag.x, y: drag.y } : { x: a.x, y: a.y });
  const guardar = (a: AgenteConfig) => onChange(agentes.map((x) => (x.id === a.id ? a : x)));

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
        setDrag({ id: drag.id, x: Math.round(p.x - CARD_W / 2), y: Math.round(p.y - 28) });
      } else if (panning) {
        setPan({ x: ev.clientX - panning.x, y: ev.clientY - panning.y });
      }
    };
    const soltar = () => {
      if (drag) {
        onChange(agentes.map((a) => (a.id === drag.id ? { ...a, x: drag.x, y: drag.y } : a)));
        setDrag(null);
      }
      setPanning(null);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
  }, [drag, panning, aTablero, onChange, agentes]);

  const agregar = () => {
    const r = ref.current?.getBoundingClientRect();
    const a = nuevoAgente(
      Math.round(((r ? r.width / 2 : 400) - pan.x) / escala - CARD_W / 2),
      Math.round(((r ? r.height / 2 : 300) - pan.y) / escala - CARD_H / 2)
    );
    onChange([...agentes, a]);
    setSelId(a.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={agregar} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">
          + Agente
        </button>
        <Pill activo={filtro === null} onClick={() => setFiltro(null)}>Todos</Pill>
        {STAGES.map((s) => (
          <Pill key={s.id} color={s.color} activo={filtro === s.id} onClick={() => setFiltro(filtro === s.id ? null : s.id)}>
            {s.name}
          </Pill>
        ))}
        <span className="text-[11.5px] text-ink-faint ml-1">
          {agentes.length} agentes · <span className="text-accent">{activos} activos</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Chip onClick={() => setEscala((e) => Math.max(0.4, +(e - 0.1).toFixed(2)))}>−</Chip>
          <span className="tabular text-[11.5px] text-ink-faint w-10 text-center">{Math.round(escala * 100)}%</span>
          <Chip onClick={() => setEscala((e) => Math.min(1.3, +(e + 0.1).toFixed(2)))}>+</Chip>
          <Chip onClick={() => { setPan({ x: 0, y: 0 }); setEscala(0.95); }}>Centrar</Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
        {/* El tablero */}
        <div
          ref={ref}
          onPointerDown={(ev) => {
            if (ev.target === ev.currentTarget || (ev.target as HTMLElement).dataset.fondo) {
              setPanning({ x: ev.clientX - pan.x, y: ev.clientY - pan.y });
              setSelId(null);
            }
          }}
          className="relative h-[660px] overflow-hidden rounded-[var(--r-lg)] border border-border bg-[#0d0d0d] cursor-grab active:cursor-grabbing"
        >
          {/* Piso en perspectiva */}
          <div data-fondo="1" className="absolute inset-0 ag-piso" />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#0d0d0d] to-transparent pointer-events-none" />

          <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${escala})`, perspective: "1400px" }}>
            {visibles.map((a) => {
              const p = pos(a);
              const activo = selId === a.id;
              const color = COLOR_ETAPA[a.etapa];
              const encendido = a.estado === "Activo";
              return (
                <div
                  key={a.id}
                  className="absolute ag-card"
                  style={{ left: p.x, top: p.y, width: CARD_W, zIndex: activo ? 30 : 1 }}
                  onPointerDown={(ev) => { ev.stopPropagation(); const q = aTablero(ev); setDrag({ id: a.id, x: Math.round(q.x - CARD_W / 2), y: Math.round(q.y - 28) }); }}
                  onClick={(ev) => { ev.stopPropagation(); setSelId(a.id); }}
                >
                  {/* Sombra en el piso */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 rounded-[50%] blur-md pointer-events-none"
                    style={{ bottom: -26, width: CARD_W * 0.7, height: 22, background: "rgba(0,0,0,0.75)" }}
                  />
                  <div
                    className="relative rounded-[var(--r-md)] border p-3.5 transition-transform duration-200"
                    style={{
                      minHeight: CARD_H,
                      transform: activo ? "rotateX(0deg) rotateY(0deg) translateZ(40px) scale(1.04)" : "rotateX(12deg) rotateY(-14deg)",
                      transformStyle: "preserve-3d",
                      background: "linear-gradient(145deg, rgba(32,32,32,0.96), rgba(18,18,18,0.96))",
                      borderColor: activo ? color : "rgba(255,255,255,0.12)",
                      boxShadow: activo
                        ? `0 26px 50px -18px rgba(0,0,0,0.9), 0 0 0 1px ${color}, 0 0 28px -6px ${color}`
                        : `0 18px 36px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)`,
                    }}
                  >
                    {/* El canto de la tarjeta: lo que le da espesor */}
                    <span
                      className="absolute inset-0 rounded-[var(--r-md)] pointer-events-none"
                      style={{ transform: "translateZ(-16px)", background: `linear-gradient(145deg, ${color}55, transparent 70%)`, filter: "blur(1px)" }}
                    />
                    <span className="absolute inset-x-3 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.8 }} />

                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-[7px] flex items-center justify-center text-[10px] font-display font-black" style={{ background: `${color}22`, color }}>
                        ◈
                      </span>
                      <span className="font-display font-extrabold uppercase text-[9px] tracking-wider" style={{ color }}>
                        {STAGES.find((s) => s.id === a.etapa)?.name}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[9px] text-ink-faint">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: encendido ? "var(--good)" : "var(--ink-faint)", boxShadow: encendido ? "0 0 6px var(--good)" : undefined }} />
                        {a.estado}
                      </span>
                    </div>

                    <div className="text-[13.5px] font-semibold leading-snug line-clamp-2">{a.nombre}</div>
                    <div className="text-[10.5px] text-ink-faint mt-1 line-clamp-2">{a.disparador || "Sin disparador definido"}</div>

                    <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.autonomia}%`, background: color }} />
                      </div>
                      <span className="tabular text-[10px] text-ink-faint">{a.autonomia}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[13px] text-ink-faint">No hay agentes en este motor.</p>
            </div>
          )}
        </div>

        {/* La configuración, al costado */}
        <div className="xl:sticky xl:top-20">
          {sel ? (
            <Panel
              agente={sel}
              onChange={guardar}
              onClose={() => setSelId(null)}
              onDuplicar={() => { const c = duplicarAgente(sel); onChange([...agentes, c]); setSelId(c.id); }}
              onBorrar={() => { onChange(agentes.filter((a) => a.id !== sel.id)); setSelId(null); }}
            />
          ) : (
            <div className="rounded-[var(--r-lg)] border border-dashed border-border-strong p-6 text-center">
              <div className="text-[13px] text-ink-soft mb-1">Ningún agente seleccionado</div>
              <p className="text-[12px] text-ink-faint">Tocá una tarjeta del tablero para ver y editar su configuración: disparador, fuentes, límites, API y prompt.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ag-piso {
          background-image:
            linear-gradient(rgba(200,245,66,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 60px 60px, 60px 60px;
          transform: perspective(600px) rotateX(58deg) scale(2.4);
          transform-origin: center 80%;
          opacity: 0.8;
        }
        .ag-piso::after { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 40% at 50% 62%, rgba(200,245,66,0.12), transparent 70%); }
        .ag-card { animation: agFloat 7s ease-in-out infinite; }
        .ag-card:nth-child(3n) { animation-delay: -2.2s; }
        .ag-card:nth-child(3n+1) { animation-delay: -4.4s; }
        @keyframes agFloat { 0%,100% { margin-top: 0 } 50% { margin-top: -7px } }
        @media (prefers-reduced-motion: reduce) { .ag-card { animation: none } }
      `}</style>
    </div>
  );
}

/* ---------------- Panel de configuración ---------------- */

function Panel({
  agente, onChange, onClose, onDuplicar, onBorrar,
}: {
  agente: AgenteConfig;
  onChange: (a: AgenteConfig) => void;
  onClose: () => void;
  onDuplicar: () => void;
  onBorrar: () => void;
}) {
  const [verPrompt, setVerPrompt] = useState(false);
  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent w-full";
  const set = <K extends keyof AgenteConfig>(k: K, v: AgenteConfig[K]) => onChange({ ...agente, [k]: v });
  const color = COLOR_ETAPA[agente.etapa];

  return (
    <div className="rounded-[var(--r-lg)] border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 h-12 border-b border-border" style={{ background: `${color}12` }}>
        <span className="font-display font-extrabold uppercase text-[10px] tracking-wider" style={{ color }}>
          Configuración del agente
        </span>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-[16px] leading-none">×</button>
      </div>

      <div className="p-4 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
        <input
          value={agente.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className="w-full bg-transparent border-none outline-none font-display font-extrabold text-[18px] text-ink"
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo t="Motor">
            <select value={agente.etapa} onChange={(e) => set("etapa", e.target.value as StageId)} className={field}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Campo>
          <Campo t="Estado">
            <select value={agente.estado} onChange={(e) => set("estado", e.target.value as AgentStatusValue)} className={field}>
              {AGENT_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Campo>
        </div>

        <Campo t={`Autonomía · ${agente.autonomia}%`}>
          <input type="range" min={0} max={100} value={agente.autonomia} onChange={(e) => set("autonomia", Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </Campo>

        <Campo t="Tiempo de respuesta (min)">
          <input type="number" min={0} value={agente.resp} onChange={(e) => set("resp", Number(e.target.value))} className={field} />
        </Campo>

        <Campo t="Se activa cuando">
          <textarea value={agente.disparador} onChange={(e) => set("disparador", e.target.value)} rows={2} className={`${field} resize-y`} />
        </Campo>
        <Campo t="Trabaja con">
          <textarea value={agente.entrada} onChange={(e) => set("entrada", e.target.value)} rows={2} className={`${field} resize-y`} />
        </Campo>
        <Campo t="Entrega">
          <textarea value={agente.salida} onChange={(e) => set("salida", e.target.value)} rows={2} className={`${field} resize-y`} />
        </Campo>
        <Campo t="Nunca debe">
          <textarea value={agente.limites} onChange={(e) => set("limites", e.target.value)} rows={2} className={`${field} resize-y`} />
        </Campo>
        <Campo t="API / integración">
          <input value={agente.api} onChange={(e) => set("api", e.target.value)} className={field} />
        </Campo>

        <div>
          <button onClick={() => setVerPrompt((v) => !v)} className="text-[10.5px] font-display font-extrabold uppercase tracking-wide text-accent">
            {verPrompt ? "Ocultar" : "Ver"} prompt del agente {verPrompt ? "▲" : "▼"}
          </button>
          {verPrompt && (
            <textarea
              value={agente.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              rows={14}
              placeholder="Instrucciones del agente: qué es, cómo responde, qué formato entrega y qué nunca hace."
              className={`${field} resize-y mt-2 text-[12px] leading-relaxed`}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button onClick={onDuplicar} className="text-[12px] text-ink-soft hover:text-ink">Duplicar</button>
          <button onClick={() => { if (confirm(`¿Borrar "${agente.nombre}"?`)) onBorrar(); }} className="text-[12px] text-critical hover:underline">
            Borrar agente
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint">{t}{children}</label>;
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border border-border-strong rounded-[var(--r-sm)] px-2.5 py-1 text-[11.5px] text-ink-soft hover:text-ink hover:border-ink-faint transition-colors">
      {children}
    </button>
  );
}

function Pill({ children, activo, color, onClick }: { children: React.ReactNode; activo: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-[10px] font-extrabold uppercase tracking-wide border transition-colors"
      style={{
        borderColor: activo ? (color || "var(--accent)") : "var(--border-strong)",
        color: activo ? (color || "var(--accent)") : "var(--ink-soft)",
        background: activo ? `color-mix(in srgb, ${color || "var(--accent)"} 12%, transparent)` : "transparent",
      }}
    >
      {children}
    </button>
  );
}
