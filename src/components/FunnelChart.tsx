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

function zonePoints(x: [number, number], h: [number, number]) {
  const [x0, x1] = x;
  const [h0, h1] = h;
  return `${x0},${CY - h0} ${x1},${CY - h1} ${x1},${CY + h1} ${x0},${CY + h0}`;
}

export default function FunnelChart({ completions, openZone, onSelect }: FunnelChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId = hovered ?? openZone;
  const activeZone = activeId ? FUNNEL_ZONES.find((z) => z.id === activeId) : null;

  return (
    <div className="relative rounded-xl border border-border-strong bg-panel-raised overflow-hidden">
      {/* esquineras HUD */}
      {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map(
        (pos, i) => (
          <div key={i} className={`absolute ${pos} w-4 h-4 border-accent/50 z-10 pointer-events-none`} />
        )
      )}

      {/* barra de estado HUD superior */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1 font-display text-[10px] tracking-[0.15em] text-ink-faint uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] animate-pulse" />
          Motor en vivo
        </span>
        <span className="tabular">
          {activeZone ? `${activeZone.label} · ${completions[activeZone.id]?.pct ?? 0}%` : "Elegí un tramo"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto block relative z-[1]"
        role="img"
        aria-label="Embudo Get, Convert, Keep, Grow"
      >
        <defs>
          {FUNNEL_ZONES.map((z) => (
            <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={z.color} />
              <stop offset="100%" stopColor={z.colorTo} />
            </linearGradient>
          ))}
          <filter id="zoneGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
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

        {FUNNEL_ZONES.map((z) => {
          const isOpen = openZone === z.id;
          const isHover = hovered === z.id;
          const dark = z.id === "acquire" || z.id === "activate";
          const narrow = z.x[1] - z.x[0] < 100;
          const midX = (z.x[0] + z.x[1]) / 2;
          const stat = completions[z.id];
          return (
            <g key={z.id}>
              <polygon
                points={zonePoints(z.x, z.halfH)}
                fill={`url(#grad-${z.id})`}
                fillOpacity={isOpen ? 0.98 : isHover ? 0.9 : 0.74}
                stroke={z.color}
                strokeWidth={isOpen ? 2.5 : 0}
                filter={isOpen || isHover ? "url(#zoneGlow)" : undefined}
                className="cursor-pointer transition-[fill-opacity] duration-150"
                onMouseEnter={() => setHovered(z.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(z.id)}
              />
              {/* partícula de flujo */}
              <circle r="2.2" fill="#fff" opacity="0.85">
                <animateMotion
                  dur={`${2.4 + (z.x[0] % 5) * 0.3}s`}
                  repeatCount="indefinite"
                  path={`M${z.x[0]},${CY} L${z.x[1]},${CY}`}
                />
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
          d="M 890,205 C 700,272 220,272 30,205"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="6 6"
          markerEnd="url(#loopArrow)"
          className="animate-[funnelflow_1.8s_linear_infinite]"
        />
        <text x="460" y="234" textAnchor="middle" style={{ fontSize: 10, fill: "var(--ink-faint)", fontFamily: "var(--font-inter)" }}>
          viral loop · referidos
        </text>
      </svg>

      {/* scanline ambiente */}
      <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/5 to-transparent animate-[scan_5s_linear_infinite] z-[2]" />

      <style>{`
        @keyframes funnelflow { to { stroke-dashoffset: -24; } }
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
      `}</style>
    </div>
  );
}
