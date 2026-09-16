"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AgentePanel from "./AgentePanel";
import MissionControl from "./MissionControl";
import {
  DEPARTAMENTOS, deptoDe, nuevoAgente, duplicarAgente,
  type AgenteConfig, type Departamento, type DeptoId,
} from "@/lib/agentes";

// Agentes IA: la red de la cuenta como organigrama. La orquestadora en el
// centro, los departamentos alrededor con su dueño humano, y los agentes de
// cada uno en columna. Al tocar un agente se abre todo lo que conlleva al costado.

type Seleccion = { tipo: "agente"; id: string } | { tipo: "depto"; id: DeptoId } | null;

const ORQ = { w: 250, h: 96 };
const DEP = { w: 268, h: 104 };
const AG = { w: 212, h: 66, gap: 12 };

/** Dónde va cada departamento alrededor de la orquestadora. */
const POSICION: Record<Exclude<DeptoId, "direccion">, { x: number; y: number; lado: "izq" | "der" | "arriba" }> = {
  operaciones: { x: 0, y: -330, lado: "arriba" },
  pauta: { x: -520, y: -200, lado: "izq" },
  ventas: { x: -520, y: 220, lado: "izq" },
  contenido: { x: 520, y: -200, lado: "der" },
  retencion: { x: 520, y: 220, lado: "der" },
};

interface Caja { x: number; y: number; w: number; h: number }

export default function AgentesIA({
  agentes, onChange, cerebro, cuenta,
}: {
  agentes: AgenteConfig[];
  onChange: (a: AgenteConfig[]) => void;
  cerebro: string;
  cuenta: string;
}) {
  const [tab, setTab] = useState<"arquitectura" | "mission">("arquitectura");
  const [sel, setSel] = useState<Seleccion>(null);

  const activos = agentes.filter((a) => a.estado === "Activo").length;
  const construccion = agentes.filter((a) => a.estado === "En construcción").length;
  const guardar = (a: AgenteConfig) => onChange(agentes.map((x) => (x.id === a.id ? a : x)));
  const agenteSel = sel?.tipo === "agente" ? agentes.find((a) => a.id === sel.id) ?? null : null;
  const deptoSel = sel?.tipo === "depto" ? deptoDe(sel.id) : null;

  const agregarEn = (d: DeptoId) => {
    const a = nuevoAgente(d);
    onChange([...agentes, a]);
    setSel({ tipo: "agente", id: a.id });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-32px)] rounded-[var(--r-lg)] border border-border overflow-hidden bg-[#0a0a0a]">
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0 bg-[#0d0d0d]">
        <div className="flex items-center gap-1">
          {(["arquitectura", "mission"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 h-8 rounded-[var(--r-sm)] text-[12px] font-semibold transition-colors ${
                tab === t ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink"
              }`}
            >
              {t === "arquitectura" ? "Arquitectura de agentes" : "Mission Control"}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-faint truncate hidden md:inline">{cuenta}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Chip>{agentes.length} agentes</Chip>
          <Chip color="var(--good)">{activos} activos</Chip>
          <Chip color="var(--warn)">{construccion} en construcción</Chip>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 relative">
          {tab === "arquitectura" ? (
            <Arquitectura agentes={agentes} sel={sel} onSel={setSel} />
          ) : (
            <MissionControl agentes={agentes} onAbrir={(id) => setSel({ tipo: "agente", id })} />
          )}
        </div>

        {agenteSel && (
          <div className="w-[430px] shrink-0 min-h-0">
            <AgentePanel
              agente={agenteSel}
              agentes={agentes}
              cerebro={cerebro}
              cuenta={cuenta}
              onChange={guardar}
              onClose={() => setSel(null)}
              onDuplicar={() => { const c = duplicarAgente(agenteSel); onChange([...agentes, c]); setSel({ tipo: "agente", id: c.id }); }}
              onBorrar={() => {
                onChange(agentes.filter((a) => a.id !== agenteSel.id).map((a) => ({ ...a, conexiones: a.conexiones.filter((c) => c !== agenteSel.id) })));
                setSel(null);
              }}
            />
          </div>
        )}

        {deptoSel && (
          <div className="w-[380px] shrink-0 min-h-0">
            <DeptoPanel
              depto={deptoSel}
              agentes={agentes.filter((a) => a.departamento === deptoSel.id)}
              onAbrir={(id) => setSel({ tipo: "agente", id })}
              onAgregar={() => agregarEn(deptoSel.id)}
              onClose={() => setSel(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- El organigrama ---------------- */

function Arquitectura({ agentes, sel, onSel }: { agentes: AgenteConfig[]; sel: Seleccion; onSel: (s: Seleccion) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const encuadrado = useRef(false);

  // Todo el layout sale de la estructura: nada se acomoda a mano.
  const layout = useMemo(() => {
    const orq = agentes.find((a) => a.departamento === "direccion");
    const cajaOrq: Caja = { x: -ORQ.w / 2, y: -ORQ.h / 2, w: ORQ.w, h: ORQ.h };

    const deptos = DEPARTAMENTOS.filter((d) => d.id !== "direccion").map((d) => {
      const p = POSICION[d.id as Exclude<DeptoId, "direccion">];
      const caja: Caja = { x: p.x - DEP.w / 2, y: p.y - DEP.h / 2, w: DEP.w, h: DEP.h };
      const suyos = agentes.filter((a) => a.departamento === d.id);
      let cajas: { agente: AgenteConfig; caja: Caja }[];

      if (p.lado === "arriba") {
        const total = suyos.length * AG.w + Math.max(0, suyos.length - 1) * AG.gap;
        const y = caja.y - 110 - AG.h;
        cajas = suyos.map((a, i) => ({ agente: a, caja: { x: -total / 2 + i * (AG.w + AG.gap), y, w: AG.w, h: AG.h } }));
      } else {
        const total = suyos.length * AG.h + Math.max(0, suyos.length - 1) * AG.gap;
        const x = p.lado === "izq" ? caja.x - 120 - AG.w : caja.x + caja.w + 120;
        cajas = suyos.map((a, i) => ({ agente: a, caja: { x, y: p.y - total / 2 + i * (AG.h + AG.gap), w: AG.w, h: AG.h } }));
      }
      return { depto: d, lado: p.lado, caja, agentes: cajas };
    });

    const todas = [cajaOrq, ...deptos.flatMap((d) => [d.caja, ...d.agentes.map((a) => a.caja)])];
    const limites = {
      x1: Math.min(...todas.map((c) => c.x)), y1: Math.min(...todas.map((c) => c.y)),
      x2: Math.max(...todas.map((c) => c.x + c.w)), y2: Math.max(...todas.map((c) => c.y + c.h)),
    };
    return { orq, cajaOrq, deptos, limites };
  }, [agentes]);

  const encuadrar = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width === 0) return;
    const { x1, y1, x2, y2 } = layout.limites;
    const margen = 60;
    const z = Math.min(1.1, Math.max(0.35, Math.min((width - margen * 2) / (x2 - x1), (height - margen * 2) / (y2 - y1))));
    setZoom(z);
    setPan({ x: width / 2 - ((x1 + x2) / 2) * z, y: height / 2 - ((y1 + y2) / 2) * z });
  }, [layout.limites]);

  useLayoutEffect(() => {
    if (encuadrado.current) return;
    encuadrado.current = true;
    encuadrar();
  }, [encuadrar]);

  useEffect(() => {
    const mover = (ev: PointerEvent) => {
      if (!arrastre.current) return;
      setPan({ x: ev.clientX - arrastre.current.x, y: ev.clientY - arrastre.current.y });
    };
    const soltar = () => { arrastre.current = null; };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
  }, []);

  const zoomEn = (factor: number, cx?: number, cy?: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = cx ?? r.width / 2, py = cy ?? r.height / 2;
    const nz = Math.min(1.6, Math.max(0.3, zoom * factor));
    setPan({ x: px - ((px - pan.x) / zoom) * nz, y: py - ((py - pan.y) / zoom) * nz });
    setZoom(nz);
  };

  const { cajaOrq, deptos, orq } = layout;
  const idSel = sel?.tipo === "agente" ? sel.id : null;
  const deptoSel = sel?.tipo === "depto" ? sel.id : null;

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onPointerDown={(ev) => {
        if ((ev.target as HTMLElement).closest("[data-nodo]")) return;
        arrastre.current = { x: ev.clientX - pan.x, y: ev.clientY - pan.y };
      }}
      onWheel={(ev) => {
        const r = ref.current!.getBoundingClientRect();
        zoomEn(ev.deltaY > 0 ? 0.92 : 1.08, ev.clientX - r.left, ev.clientY - r.top);
      }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        {/* Líneas: punteadas y en ángulo, como un organigrama */}
        <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: 1, height: 1 }}>
          {deptos.map(({ depto, lado, caja, agentes: hijos }) => {
            const cx = caja.x + caja.w / 2, cy = caja.y + caja.h / 2;
            const tenue = `${depto.color}55`;
            const lineas: string[] = [];

            // Orquestadora → departamento
            if (lado === "arriba") lineas.push(`M0,${cajaOrq.y} V${caja.y + caja.h}`);
            else {
              const sx = lado === "izq" ? cajaOrq.x : cajaOrq.x + cajaOrq.w;
              lineas.push(`M${sx},0 H${cx} V${cy > 0 ? caja.y : caja.y + caja.h}`);
            }

            // Departamento → sus agentes
            if (hijos.length > 0) {
              if (lado === "arriba") {
                const busY = caja.y - 55;
                const xs = hijos.map((h) => h.caja.x + h.caja.w / 2);
                lineas.push(`M${cx},${caja.y} V${busY}`);
                lineas.push(`M${Math.min(...xs, cx)},${busY} H${Math.max(...xs, cx)}`);
                hijos.forEach((h) => lineas.push(`M${h.caja.x + h.caja.w / 2},${busY} V${h.caja.y + h.caja.h}`));
              } else {
                const salida = lado === "izq" ? caja.x : caja.x + caja.w;
                const borde = lado === "izq" ? hijos[0].caja.x + AG.w : hijos[0].caja.x;
                const busX = (salida + borde) / 2;
                const ys = hijos.map((h) => h.caja.y + h.caja.h / 2);
                lineas.push(`M${salida},${cy} H${busX}`);
                lineas.push(`M${busX},${Math.min(...ys, cy)} V${Math.max(...ys, cy)}`);
                hijos.forEach((h) => lineas.push(`M${busX},${h.caja.y + h.caja.h / 2} H${borde}`));
              }
            }

            return lineas.map((d, i) => (
              <path key={`${depto.id}-${i}`} d={d} fill="none" stroke={tenue} strokeWidth={1.2} strokeDasharray="4 5" className="red-flujo" />
            ));
          })}
        </svg>

        {/* Orquestadora */}
        {orq && (
          <Nodo
            caja={cajaOrq}
            color={deptoDe("direccion").color}
            inicial={orq.nombre.charAt(0)}
            eyebrow="Dirección"
            titulo={orq.nombre}
            sub={orq.rol}
            pie={`${agentes.length - 1} agentes`}
            estado={orq.estado}
            activo={idSel === orq.id}
            destacado
            onClick={() => onSel({ tipo: "agente", id: orq.id })}
          />
        )}

        {/* Departamentos y sus agentes */}
        {deptos.map(({ depto, caja, agentes: hijos }) => (
          <div key={depto.id}>
            <Nodo
              caja={caja}
              color={depto.color}
              inicial={depto.inicial}
              eyebrow="Departamento"
              titulo={depto.nombre}
              sub={`Dueño: ${depto.dueno}`}
              pie={`${hijos.length} agentes · ${hijos.filter((h) => h.agente.estado === "Activo").length} activos`}
              activo={deptoSel === depto.id}
              onClick={() => onSel({ tipo: "depto", id: depto.id })}
            />
            {hijos.map(({ agente, caja: c }) => (
              <NodoAgente
                key={agente.id}
                caja={c}
                depto={depto}
                agente={agente}
                activo={idSel === agente.id}
                onClick={() => onSel({ tipo: "agente", id: agente.id })}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-[#111]/90 border border-border rounded-[var(--r-md)] p-1 backdrop-blur-sm">
        <Boton onClick={() => zoomEn(0.85)}>−</Boton>
        <span className="tabular text-[11px] text-ink-faint w-11 text-center">{Math.round(zoom * 100)}%</span>
        <Boton onClick={() => zoomEn(1.15)}>+</Boton>
        <Boton onClick={encuadrar}>Encuadrar</Boton>
      </div>

      <div className="absolute bottom-4 right-4 hidden lg:flex items-center gap-3 bg-[#111]/90 border border-border rounded-[var(--r-md)] px-3 py-2 text-[10.5px] text-ink-faint backdrop-blur-sm">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-good" /> Activo</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warn" /> En construcción</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" /> Por construir</span>
      </div>

      <style>{`
        .red-flujo { animation: redFlujo 2.4s linear infinite; }
        @keyframes redFlujo { to { stroke-dashoffset: -18; } }
        @media (prefers-reduced-motion: reduce) { .red-flujo { animation: none; } }
      `}</style>
    </div>
  );
}

const COLOR_ESTADO: Record<string, string> = {
  Activo: "var(--good)",
  "En construcción": "var(--warn)",
  Pausado: "var(--critical)",
  "No construido": "var(--ink-faint)",
};

function Nodo({
  caja, color, inicial, eyebrow, titulo, sub, pie, estado, activo, destacado, onClick,
}: {
  caja: Caja; color: string; inicial: string; eyebrow: string; titulo: string; sub: string; pie: string;
  estado?: string; activo: boolean; destacado?: boolean; onClick: () => void;
}) {
  return (
    <button
      data-nodo
      onClick={onClick}
      className="absolute text-left rounded-[12px] border transition-all duration-150 hover:-translate-y-0.5"
      style={{
        left: caja.x, top: caja.y, width: caja.w, height: caja.h,
        background: destacado ? `linear-gradient(160deg, ${color}14, #101010 55%)` : "#101010",
        borderColor: activo ? color : destacado ? `${color}88` : `${color}40`,
        boxShadow: activo ? `0 0 0 1px ${color}, 0 0 32px -6px ${color}` : destacado ? `0 0 40px -14px ${color}` : "0 10px 30px -18px rgba(0,0,0,0.9)",
      }}
    >
      <div className="flex items-start gap-3 p-3.5 h-full">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-[13px] shrink-0"
          style={{ border: `1.5px solid ${color}`, color }}
        >
          {inicial}
        </span>
        <div className="min-w-0 flex-1 flex flex-col h-full">
          <div className="flex items-center gap-1.5 text-[9px] font-display font-extrabold uppercase tracking-[0.12em]" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: estado ? COLOR_ESTADO[estado] : color }} />
            {eyebrow}
          </div>
          <div className="text-[15px] font-semibold text-ink leading-tight mt-0.5 truncate">{titulo}</div>
          <div className="text-[11px] text-ink-faint truncate">{sub}</div>
          <div className="mt-auto text-[9.5px] font-mono uppercase tracking-wider text-ink-faint">{pie}</div>
        </div>
      </div>
    </button>
  );
}

function NodoAgente({
  caja, depto, agente, activo, onClick,
}: {
  caja: Caja; depto: Departamento; agente: AgenteConfig; activo: boolean; onClick: () => void;
}) {
  return (
    <button
      data-nodo
      onClick={onClick}
      className="absolute text-left rounded-[10px] border transition-all duration-150 hover:-translate-y-0.5"
      style={{
        left: caja.x, top: caja.y, width: caja.w, height: caja.h,
        background: "#0f0f0f",
        borderColor: activo ? depto.color : "rgba(255,255,255,0.1)",
        boxShadow: activo ? `0 0 0 1px ${depto.color}, 0 0 24px -6px ${depto.color}` : undefined,
      }}
    >
      <div className="flex items-center gap-2.5 px-3 h-full">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-[11px] shrink-0"
          style={{ border: `1.5px solid ${depto.color}`, color: depto.color }}
        >
          {agente.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[8.5px] font-display font-extrabold uppercase tracking-[0.1em] text-ink-faint">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLOR_ESTADO[agente.estado] }} />
            <span className="truncate">{depto.nombre}</span>
          </div>
          <div className="text-[12.5px] font-semibold text-ink leading-tight truncate">{agente.nombre}</div>
          <div className="text-[10px] text-ink-faint truncate">{agente.rol || "Sin rol definido"}</div>
        </div>
      </div>
    </button>
  );
}

/* ---------------- Panel de departamento ---------------- */

function DeptoPanel({
  depto, agentes, onAbrir, onAgregar, onClose,
}: {
  depto: Departamento; agentes: AgenteConfig[]; onAbrir: (id: string) => void; onAgregar: () => void; onClose: () => void;
}) {
  const activos = agentes.filter((a) => a.estado === "Activo").length;
  return (
    <div className="h-full flex flex-col bg-surface border-l border-border">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0" style={{ background: `${depto.color}10` }}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-[14px]" style={{ border: `1.5px solid ${depto.color}`, color: depto.color }}>
          {depto.inicial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-display font-extrabold uppercase tracking-wider" style={{ color: depto.color }}>Departamento</div>
          <div className="text-[15px] font-semibold truncate">{depto.nombre}</div>
        </div>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-[18px] leading-none px-1">×</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <div className="eyebrow mb-1">Dueño</div>
          <div className="text-[14px] font-semibold" style={{ color: depto.color }}>{depto.dueno}</div>
        </div>
        <div>
          <div className="eyebrow mb-1">Misión</div>
          <p className="text-[13px] text-ink-soft leading-relaxed">{depto.mision}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded-[var(--r-md)] p-3">
            <div className="text-[10.5px] text-ink-faint">Agentes</div>
            <div className="tabular font-extrabold text-[22px]">{agentes.length}</div>
          </div>
          <div className="border border-border rounded-[var(--r-md)] p-3">
            <div className="text-[10.5px] text-ink-faint">Activos</div>
            <div className="tabular font-extrabold text-[22px] text-good">{activos}</div>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-2">Agentes del departamento</div>
          <div className="flex flex-col gap-1.5">
            {agentes.map((a) => (
              <button key={a.id} onClick={() => onAbrir(a.id)} className="flex items-center gap-2.5 text-left border border-border rounded-[var(--r-md)] px-3 py-2 hover:border-border-strong transition-colors">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLOR_ESTADO[a.estado] }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold truncate">{a.nombre}</span>
                  <span className="block text-[10.5px] text-ink-faint truncate">{a.estado}</span>
                </span>
              </button>
            ))}
          </div>
          <button onClick={onAgregar} className="mt-2 w-full border border-dashed border-border-strong rounded-[var(--r-md)] py-2 text-[12px] text-ink-faint hover:text-ink hover:border-accent transition-colors">
            + Agente en {depto.nombre}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[10.5px] font-mono uppercase tracking-wide px-2 py-1 rounded-[var(--r-sm)] border border-border-strong" style={{ color: color ?? "var(--ink-soft)" }}>
      {children}
    </span>
  );
}

function Boton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2.5 h-7 rounded-[var(--r-sm)] text-[11.5px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors">
      {children}
    </button>
  );
}
