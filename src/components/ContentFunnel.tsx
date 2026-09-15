"use client";

import { useState } from "react";
import { Editable } from "./doc";
import { useBroda } from "./BrodaContext";

const CY = 120;
const VIEW_W = 920;
const VIEW_H = 240;
const DEPTH = 9;

const ZONES = [
  { id: "TOFU", color: "#C8F542", colorTo: "#9FE23A", x: [30, 350] as [number, number], h: [100, 62] as [number, number] },
  { id: "MOFU", color: "#4FD1FF", colorTo: "#3D93D6", x: [350, 650] as [number, number], h: [62, 32] as [number, number] },
  { id: "BOFU", color: "#C24FD1", colorTo: "#8A6FE0", x: [650, 890] as [number, number], h: [32, 8] as [number, number] },
];

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

export default function ContentFunnel() {
  const { data } = useBroda();
  const embudo = data.ESTRATEGIA.embudo;
  const [open, setOpen] = useState<string | null>("TOFU");
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId = hovered ?? open;
  const activeIdx = activeId ? embudo.findIndex((e) => e.capa === activeId) : -1;
  const active = activeIdx >= 0 ? embudo[activeIdx] : null;

  const scene = (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H + DEPTH}`} className="w-full h-auto block" role="img" aria-label="Embudo de contenido: TOFU, MOFU, BOFU">
      <defs>
        {ZONES.map((z) => (
          <linearGradient key={z.id} id={`cgrad-${z.id}`} x1="0" y1="0" x2="1" y2="0.15">
            <stop offset="0%" stopColor={z.color} />
            <stop offset="100%" stopColor={z.colorTo} />
          </linearGradient>
        ))}
        <filter id="contentGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="contentShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        <pattern id="contentGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0 L0 0 0 24" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#contentGrid)" />
      <text x="30" y="14" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>AWARENESS</text>
      <text x="890" y="14" textAnchor="end" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>DECISIÓN</text>

      {ZONES.map((z) => (
        <polygon key={`shadow-${z.id}`} points={zonePoints(z.x, z.h, 3, DEPTH + 5)} fill="#000" opacity={0.35} filter="url(#contentShadow)" />
      ))}

      {ZONES.map((z) => {
        const e = embudo.find((e) => e.capa === z.id)!;
        const isOpen = open === z.id;
        const isHover = hovered === z.id;
        const midX = (z.x[0] + z.x[1]) / 2;
        const lift = isOpen ? -5 : isHover ? -3 : 0;
        return (
          <g
            key={z.id}
            className="cursor-pointer transition-transform duration-200 ease-out"
            style={{ transform: `translateY(${lift}px)`, transformBox: "fill-box", transformOrigin: "center" }}
            onMouseEnter={() => setHovered(z.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setOpen(open === z.id ? null : z.id)}
          >
            <polygon points={zonePoints(z.x, z.h, 0, DEPTH)} fill={z.color} opacity={0.55} style={{ filter: "brightness(0.45) saturate(1.2)" }} />
            <polygon
              points={zonePoints(z.x, z.h)}
              fill={`url(#cgrad-${z.id})`}
              fillOpacity={isOpen ? 0.98 : isHover ? 0.92 : 0.8}
              stroke={z.color}
              strokeWidth={isOpen ? 2.5 : 0.75}
              strokeOpacity={isOpen ? 1 : 0.4}
              filter={isOpen || isHover ? "url(#contentGlow)" : undefined}
            />
            <line x1={z.x[0]} y1={CY - z.h[0]} x2={z.x[1]} y2={CY - z.h[1]} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} pointerEvents="none" />
            <text x={midX} y={CY - 6} textAnchor="middle" pointerEvents="none" className="font-display" style={{ fontSize: 20, fill: z.id === "TOFU" ? "#0b0b0b" : "#fff", paintOrder: z.id === "TOFU" ? undefined : "stroke", stroke: z.id === "TOFU" ? undefined : "rgba(0,0,0,0.35)", strokeWidth: z.id === "TOFU" ? undefined : 3 }}>
              {z.id}
            </text>
            <text x={midX} y={CY + 14} textAnchor="middle" pointerEvents="none" className="tabular" style={{ fontSize: 10.5, fontFamily: "var(--font-inter)", fill: z.id === "TOFU" ? "#2b3a06" : "#e8e8e8" }}>
              {e.pilar} · {e.peso}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="relative border-y border-border-strong -mx-1">
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1 font-display text-[10px] tracking-[0.15em] text-ink-faint uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] animate-pulse" /> Embudo de contenido
        </span>
        <span className="tabular">{active ? `${active.capa} · ${active.pilar}` : "Elegí una capa"}</span>
      </div>
      <div className="relative py-6 px-2 [perspective:1400px]">
        <div className="cf-float will-change-transform" style={{ transformStyle: "preserve-3d" }}>{scene}</div>
        <div className="pointer-events-none mt-1 opacity-25" style={{ transform: "scaleY(-1)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)", filter: "blur(2px)" }}>
          {scene}
        </div>
      </div>

      {active && open && (
        <div className="px-4 pb-6 pt-2 border-t border-border">
          <p className="text-[13.5px] text-ink-soft mb-3 max-w-[70ch]"><Editable path={["ESTRATEGIA", "embudo", activeIdx, "trabajo"]} value={active.trabajo} multiline /></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {active.temas.map((t, i) => (
              <span key={i} className="text-[10.5px] px-2 py-1 rounded-md border border-border-strong text-ink-faint">
                <Editable path={["ESTRATEGIA", "embudo", activeIdx, "temas", i]} value={t} />
              </span>
            ))}
          </div>
          <div className="text-[11.5px] text-ink-faint border-t border-border pt-2.5 flex flex-col gap-1">
            <div><b className="text-ink-soft font-semibold">Formato:</b> <Editable path={["ESTRATEGIA", "embudo", activeIdx, "formato"]} value={active.formato} /></div>
            <div><b className="text-ink-soft font-semibold">Métrica:</b> <Editable path={["ESTRATEGIA", "embudo", activeIdx, "metrica"]} value={active.metrica} /></div>
          </div>
        </div>
      )}

      <style>{`
        .cf-float { animation: cfFloat 6s ease-in-out infinite; }
        @keyframes cfFloat { 0%,100% { transform: rotateX(10deg) translateY(0); } 50% { transform: rotateX(7deg) translateY(-8px); } }
        @media (prefers-reduced-motion: reduce) { .cf-float { animation: none; } }
      `}</style>
    </div>
  );
}
