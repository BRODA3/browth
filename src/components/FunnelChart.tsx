"use client";

import { useState } from "react";
import { FUNNEL_ZONES } from "@/lib/data";

interface ZoneStat {
  pct: number;
  done: number;
  total: number;
}

interface FunnelChartProps {
  completions: Record<string, ZoneStat>;
  openZone: string | null;
  onSelect: (zoneId: string) => void;
}

const CY = 120;
const VIEW_W = 920;
const VIEW_H = 240;
const DEPTH = 9; // profundidad de la extrusión 3D en px de viewBox

function zonePoints(x: [number, number], h: [number, number], dx = 0, dy = 0) {
  const [x0, x1] = x;
  const [h0, h1] = h;
  return [
    [x0 + dx, CY - h0 + dy],
    [x1 + dx, CY - h1 + dy],
    [x1 + dx, CY + h1 + dy],
    [x0 + dx, CY + h0 + dy],
  ]
    .map((p) => p.join(","))
    .join(" ");
}

function glossPoints(x: [number, number], h: [number, number]) {
  const [x0, x1] = x;
  const [h0, h1] = h;
  const f = 0.42; // hasta dónde baja el brillo, como fracción del alto
  return `${x0},${CY - h0} ${x1},${CY - h1} ${x1},${CY - h1 + h1 * 2 * f} ${x0},${CY - h0 + h0 * 2 * f}`;
}

export default function FunnelChart({ completions, openZone, onSelect }: FunnelChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId = hovered ?? openZone;
  const activeZone = activeId ? FUNNEL_ZONES.find((z) => z.id === activeId) : null;

  const scene = (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H + DEPTH}`} className="w-full h-auto block" role="img" aria-label="Embudo Get, Convert, Keep, Grow">
      <defs>
        {FUNNEL_ZONES.map((z) => (
          <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="1" y2="0.15">
            <stop offset="0%" stopColor={z.color} />
            <stop offset="100%" stopColor={z.colorTo} />
          </linearGradient>
        ))}
        <linearGradient id="glossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="zoneGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <pattern id="hudGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0 L0 0 0 24" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        </pattern>
        <marker id="loopArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)" />
        </marker>
      </defs>

      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#hudGrid)" />

      <text x="165" y="14" textAnchor="middle" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
        GET CUSTOMERS
      </text>
      <text x="755" y="14" textAnchor="middle" className="font-display fill-ink-faint" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
        GROW CUSTOMERS
      </text>

      {/* sombras de contacto por zona, ancladas al piso virtual */}
      {FUNNEL_ZONES.map((z) => (
        <polygon key={`shadow-${z.id}`} points={zonePoints(z.x, z.halfH, 3, DEPTH + 5)} fill="#000" opacity={0.35} filter="url(#softShadow)" />
      ))}

      {FUNNEL_ZONES.map((z) => {
        const isOpen = openZone === z.id;
        const isHover = hovered === z.id;
        const dark = z.id === "acquire" || z.id === "activate";
        const narrow = z.x[1] - z.x[0] < 100;
        const midX = (z.x[0] + z.x[1]) / 2;
        const stat = completions[z.id];
        const lift = isOpen ? -5 : isHover ? -3 : 0;
        return (
          <g
            key={z.id}
            className="cursor-pointer transition-transform duration-200 ease-out"
            style={{ transform: `translateY(${lift}px)`, transformBox: "fill-box", transformOrigin: "center" }}
            onMouseEnter={() => setHovered(z.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(z.id)}
          >
            {/* cara lateral (extrusión) */}
            <polygon points={zonePoints(z.x, z.halfH, 0, DEPTH)} fill={z.color} opacity={0.55} style={{ filter: "brightness(0.45) saturate(1.2)" }} />
            {/* cara frontal */}
            <polygon
              points={zonePoints(z.x, z.halfH)}
              fill={`url(#grad-${z.id})`}
              fillOpacity={isOpen ? 0.98 : isHover ? 0.92 : 0.82}
              stroke={z.color}
              strokeWidth={isOpen ? 2.5 : 0.75}
              strokeOpacity={isOpen ? 1 : 0.4}
              filter={isOpen || isHover ? "url(#zoneGlow)" : undefined}
            />
            {/* brillo especular */}
            <polygon points={glossPoints(z.x, z.halfH)} fill="url(#glossGrad)" pointerEvents="none" />
            {/* filo superior iluminado */}
            <line x1={z.x[0]} y1={CY - z.halfH[0]} x2={z.x[1]} y2={CY - z.halfH[1]} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} pointerEvents="none" />

            <circle r="2.2" fill="#fff" opacity="0.9" pointerEvents="none">
              <animateMotion dur={`${2.4 + (z.x[0] % 5) * 0.3}s`} repeatCount="indefinite" path={`M${z.x[0]},${CY} L${z.x[1]},${CY}`} />
            </circle>

            <text
              x={midX}
              y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none"
              className="font-display"
              style={{
                fontSize: narrow ? 10 : 13,
                fill: dark ? "#0b0b0b" : "#fff",
                paintOrder: dark ? undefined : "stroke",
                stroke: dark ? undefined : "rgba(0,0,0,0.35)",
                strokeWidth: dark ? undefined : 3,
                textTransform: "uppercase",
              }}
            >
              {z.label}
            </text>
            {stat && (
              <text
                x={midX}
                y={z.halfH[0] > z.halfH[1] ? CY - z.halfH[0] - 10 : CY - z.halfH[1] - 10}
                textAnchor="middle"
                pointerEvents="none"
                className="tabular"
                style={{ fontSize: 9, fill: "var(--ink-faint)", fontFamily: "var(--font-inter)" }}
              >
                {stat.pct}%
              </text>
            )}
          </g>
        );
      })}

      <path
        d="M 890,214 C 700,281 220,281 30,214"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="6 6"
        markerEnd="url(#loopArrow)"
        className="animate-[funnelflow_1.8s_linear_infinite]"
        style={{ filter: "drop-shadow(0 0 3px var(--accent))" }}
      />
      <text x="460" y="243" textAnchor="middle" style={{ fontSize: 10, fill: "var(--ink-faint)", fontFamily: "var(--font-inter)" }}>
        viral loop · referidos
      </text>
    </svg>
  );

  return (
    <div className="relative rounded-xl border border-border-strong bg-surface-2 overflow-hidden">
      {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-4 h-4 border-accent/50 z-10 pointer-events-none`} />
      ))}

      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1 font-display text-[10px] tracking-[0.15em] text-ink-faint uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] animate-pulse" />
          Motor en vivo
        </span>
        <span className="tabular">
          {activeZone ? `${activeZone.label} · ${completions[activeZone.id]?.pct ?? 0}%` : "Elegí un tramo"}
        </span>
      </div>

      <div className="relative py-6 px-2 [perspective:1400px]">
        <div className="funnel-float will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          {scene}
        </div>
        {/* reflejo sobre "piso" virtual */}
        <div
          className="pointer-events-none mt-1 opacity-20 h-16 overflow-hidden"
          style={{
            transform: "scaleY(-1)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%)",
            filter: "blur(2px)",
          }}
        >
          {scene}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/5 to-transparent animate-[scan_5s_linear_infinite] z-[2]" />

      <style>{`
        @keyframes funnelflow { to { stroke-dashoffset: -24; } }
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        .funnel-float {
          animation: funnelFloat 6s ease-in-out infinite;
        }
        @keyframes funnelFloat {
          0%, 100% { transform: rotateX(10deg) rotateZ(0deg) translateY(0px); }
          50% { transform: rotateX(7deg) rotateZ(0.3deg) translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .funnel-float { animation: none; }
        }
      `}</style>
    </div>
  );
}
