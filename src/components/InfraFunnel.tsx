"use client";

import { useState } from "react";
import { Section, Nota, DocTable, Editable } from "./doc";
import { useBroda } from "./BrodaContext";
import { type EstadoCapa } from "@/lib/broda";

const CY = 120;
const VIEW_W = 920;
const VIEW_H = 240;
const DEPTH = 9;

const ZONE_X: Record<string, { x: [number, number]; h: [number, number] }> = {
  atraer: { x: [30, 173.33], h: [100, 76] },
  capturar: { x: [173.33, 316.67], h: [76, 52] },
  calificar: { x: [316.67, 460], h: [52, 28] },
  convertir: { x: [460, 560], h: [28, 28] },
  retener: { x: [560, 670], h: [28, 52] },
  expandir: { x: [670, 780], h: [52, 76] },
  referir: { x: [780, 890], h: [76, 100] },
};

const ESTADO_COLOR: Record<EstadoCapa, string> = { hecho: "#8a8a8a", foco: "#C8F542", falta: "#4a4a4a" };

function zonePoints(x: [number, number], h: [number, number], dx = 0, dy = 0) {
  const [x0, x1] = x;
  const [h0, h1] = h;
  return [
    [x0 + dx, CY - h0 + dy],
    [x1 + dx, CY - h1 + dy],
    [x1 + dx, CY + h1 + dy],
    [x0 + dx, CY + h0 + dy],
  ].map((p) => p.join(",")).join(" ");
}

export default function InfraFunnel() {
  const { data } = useBroda();
  const { CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION } = data;
  const [open, setOpen] = useState<string | null>("convertir");
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId = hovered ?? open;
  const activeIdx = activeId ? CAPAS.findIndex((c) => c.id === activeId) : -1;
  const activeCapa = activeIdx >= 0 ? CAPAS[activeIdx] : null;

  const scene = (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H + DEPTH}`} className="w-full h-auto block" role="img" aria-label="Infraestructura comercial de Broda: las 7 capas">
      <defs>
        <filter id="infraGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="infraShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        <pattern id="infraGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0 L0 0 0 24" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        </pattern>
        <marker id="infraLoopArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)" />
        </marker>
      </defs>
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#infraGrid)" />

      <text x="245" y="14" textAnchor="middle" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>{EMBUDO_META.zonaIzq}</text>
      <text x="675" y="14" textAnchor="middle" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>{EMBUDO_META.zonaDer}</text>

      {EMBUDO_META.entradas.map((e, i) => (
        <text key={e} x="4" y={70 + i * 18} className="tabular" style={{ fontSize: 9, fill: "var(--ink-faint)", fontFamily: "var(--font-inter)" }}>{e}</text>
      ))}

      {CAPAS.map((c) => {
        const geo = ZONE_X[c.id];
        return <polygon key={`shadow-${c.id}`} points={zonePoints(geo.x, geo.h, 3, DEPTH + 5)} fill="#000" opacity={0.35} filter="url(#infraShadow)" />;
      })}

      {CAPAS.map((c) => {
        const geo = ZONE_X[c.id];
        const color = ESTADO_COLOR[c.estado];
        const isOpen = open === c.id;
        const isHover = hovered === c.id;
        const narrow = geo.x[1] - geo.x[0] < 100;
        const midX = (geo.x[0] + geo.x[1]) / 2;
        const lift = isOpen ? -5 : isHover ? -3 : 0;
        const ghost = c.estado === "falta";
        return (
          <g
            key={c.id}
            className="cursor-pointer transition-transform duration-200 ease-out"
            style={{ transform: `translateY(${lift}px)`, transformBox: "fill-box", transformOrigin: "center" }}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setOpen(open === c.id ? null : c.id)}
          >
            {!ghost && <polygon points={zonePoints(geo.x, geo.h, 0, DEPTH)} fill={color} opacity={0.55} style={{ filter: "brightness(0.45) saturate(1.2)" }} />}
            <polygon
              points={zonePoints(geo.x, geo.h)}
              fill={ghost ? "none" : color}
              fillOpacity={ghost ? 0 : isOpen ? 0.98 : isHover ? 0.92 : 0.8}
              stroke={color}
              strokeWidth={isOpen ? 2.5 : ghost ? 1.5 : 0.75}
              strokeDasharray={ghost ? "5 5" : undefined}
              strokeOpacity={isOpen ? 1 : ghost ? 0.85 : 0.4}
              filter={isOpen || isHover ? "url(#infraGlow)" : undefined}
            />
            {!ghost && <line x1={geo.x[0]} y1={CY - geo.h[0]} x2={geo.x[1]} y2={CY - geo.h[1]} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} pointerEvents="none" />}
            <text
              x={midX} y={CY} textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
              className="font-display"
              style={{
                fontSize: narrow ? 11 : 14, textTransform: "uppercase",
                fill: c.estado === "foco" ? "#0b0b0b" : ghost ? color : "#fff",
                paintOrder: ghost || c.estado === "foco" ? undefined : "stroke",
                stroke: ghost || c.estado === "foco" ? undefined : "rgba(0,0,0,0.35)",
                strokeWidth: ghost || c.estado === "foco" ? undefined : 3,
              }}
            >
              {c.nombre}
            </text>
            <text x={midX} y={CY + 22} textAnchor="middle" pointerEvents="none" className="tabular"
              style={{ fontSize: 9, fill: c.estado === "foco" ? "#2b3a06" : ghost ? "var(--ink-faint)" : "#e8e8e8", fontFamily: "var(--font-inter)" }}>
              {c.quien}
            </text>
          </g>
        );
      })}

      <path d="M 890,214 C 700,281 220,281 30,214" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 6" markerEnd="url(#infraLoopArrow)" style={{ filter: "drop-shadow(0 0 3px var(--accent))" }} className="infra-loop" />
      <text x="460" y="243" textAnchor="middle" style={{ fontSize: 10, fill: "var(--ink-faint)", fontFamily: "var(--font-inter)" }}>{EMBUDO_META.loop}</text>
    </svg>
  );

  return (
    <div>
      <Section title="Infraestructura comercial" subtitle="El sistema que convierte atención en ventas. No es contenido: es lo que pasa después de que alguien levanta la mano, y es lo único que hacemos que produce un número defendible." first>
        <div className="relative border-y border-border-strong -mx-1">
          <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1 font-display text-[10px] tracking-[0.15em] text-ink-faint uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] animate-pulse" /> En vivo
            </span>
            <span className="tabular">{activeCapa ? `${activeCapa.nombre} · ${activeCapa.quien}` : "Elegí una capa"}</span>
          </div>
          <div className="relative py-6 px-2 [perspective:1400px]">
            <div className="funnel-float will-change-transform" style={{ transformStyle: "preserve-3d" }}>{scene}</div>
            <div className="pointer-events-none mt-1 opacity-25" style={{ transform: "scaleY(-1)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)", filter: "blur(2px)" }}>
              {scene}
            </div>
          </div>
          <div className="flex items-center gap-4 px-3 pb-3 text-[10.5px] text-ink-faint flex-wrap">
            {EMBUDO_META.leyenda.map((l) => (
              <span key={l.tipo} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={l.tipo === "falta" ? { border: `1.5px dashed ${ESTADO_COLOR.falta}` } : { background: ESTADO_COLOR[l.tipo] }} />
                {l.texto}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          .funnel-float { animation: funnelFloat 6s ease-in-out infinite; }
          @keyframes funnelFloat { 0%,100% { transform: rotateX(10deg) translateY(0); } 50% { transform: rotateX(7deg) translateY(-8px); } }
          .infra-loop { animation: infraFlow 1.8s linear infinite; }
          @keyframes infraFlow { to { stroke-dashoffset: -24; } }
          @media (prefers-reduced-motion: reduce) { .funnel-float, .infra-loop { animation: none; } }
        `}</style>

        {activeCapa && open && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="mb-4">
              <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint">Capa {activeCapa.n} · <Editable path={["CAPAS", activeIdx, "quien"]} value={activeCapa.quien} /></div>
              <h3 className="text-2xl m-0 normal-case tracking-normal" style={{ color: ESTADO_COLOR[activeCapa.estado] }}>
                <Editable path={["CAPAS", activeIdx, "nombre"]} value={activeCapa.nombre} />
                {activeCapa.sub != null && <> — <Editable path={["CAPAS", activeIdx, "sub"]} value={activeCapa.sub} /></>}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-5">
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Proceso</div>
                <ul className="flex flex-col gap-1.5">
                  {activeCapa.proceso.map((p, i) => (
                    <li key={i} className="text-[13.5px] text-ink-soft pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[10px] before:w-1.5 before:h-px before:bg-accent">
                      <Editable path={["CAPAS", activeIdx, "proceso", i]} value={p} multiline />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Tareas</div>
                <ul className="flex flex-col gap-1.5">
                  {activeCapa.tareas.map((t, i) => (
                    <li key={i} className="text-[13.5px] text-ink-soft pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[10px] before:w-1.5 before:h-px before:bg-accent">
                      <Editable path={["CAPAS", activeIdx, "tareas", i]} value={t} multiline />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-l-[3px] pl-4 py-1 text-[13.5px] text-ink-soft" style={{ borderColor: ESTADO_COLOR[activeCapa.estado] }}>
              <Editable path={["CAPAS", activeIdx, "estadoTexto"]} value={activeCapa.estadoTexto} multiline />
            </div>
          </div>
        )}

        <Nota titulo={EMBUDO_META.nota.titulo} texto={EMBUDO_META.nota.texto} path={["EMBUDO_META", "nota"]} />
      </Section>

      <Section title="En qué orden se construye" subtitle="Una capa por vez. Saltar de la 01 a la 06 es lo que hace que el sistema no arranque nunca.">
        <DocTable
          headers={ORDEN_CONSTRUCCION.encabezados}
          rows={ORDEN_CONSTRUCCION.filas}
          paths={ORDEN_CONSTRUCCION.filas.map((_, i) => [["ORDEN_CONSTRUCCION", "filas", i, 0], ["ORDEN_CONSTRUCCION", "filas", i, 1], ["ORDEN_CONSTRUCCION", "filas", i, 2]])}
        />
        <Nota titulo={ORDEN_CONSTRUCCION.nota.titulo} texto={ORDEN_CONSTRUCCION.nota.texto} path={["ORDEN_CONSTRUCCION", "nota"]} />
      </Section>
    </div>
  );
}
