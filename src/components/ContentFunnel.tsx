"use client";

import { useState } from "react";
import { Editable } from "./doc";
import { useBroda } from "./BrodaContext";

// Embudo de contenido copiado del documento original de Broda: tres trapecios
// apilados, TOFU y MOFU en gris y BOFU en lima, con las piezas al costado.

const W = 1000, HB = 118, GAP = 14, CX = W / 2;
const ANCHOS = [900, 620, 340];
const BOFU_BASE = 200;
const FILLS = ["#3d3d3d", "#4d4d4d", "#C8F542"];

export default function ContentFunnel() {
  const { data } = useBroda();
  const embudo = data.ESTRATEGIA.embudo;
  const [open, setOpen] = useState<string | null>("TOFU");
  const activeIdx = open ? embudo.findIndex((e) => e.capa === open) : -1;
  const active = activeIdx >= 0 ? embudo[activeIdx] : null;

  let y = 14;
  const capas = embudo.map((c, i) => {
    const wTop = ANCHOS[i] ?? 340, wBot = ANCHOS[i + 1] ?? BOFU_BASE;
    const x1 = CX - wTop / 2, x2 = CX + wTop / 2, x3 = CX + wBot / 2, x4 = CX - wBot / 2;
    const piezas = parseInt(c.peso, 10);
    const lima = i === 2;
    const isOpen = open === c.capa;
    const g = (
      <g key={c.capa} className="cursor-pointer hover:opacity-90" onClick={() => setOpen(isOpen ? null : c.capa)}>
        <polygon points={`${x1},${y} ${x2},${y} ${x3},${y + HB} ${x4},${y + HB}`} fill={FILLS[i] ?? FILLS[1]} stroke={isOpen ? "#ffffff" : "#111"} strokeWidth={isOpen ? 1.5 : 1} />
        <text x={CX} y={y + HB / 2 - 8} textAnchor="middle" className="font-display" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.03em" }} fill={lima ? "#111111" : "#ffffff"}>{c.capa}</text>
        <text x={CX} y={y + HB / 2 + 16} textAnchor="middle" style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-inter)" }} fill={lima ? "#2b3a06" : "#8d8d8d"}>{c.pilar}</text>
        {!Number.isNaN(piezas) && (
          <text x={x2 + 24} y={y + HB / 2 + 4} style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-inter)" }} fill="#8d8d8d">
            {piezas} {piezas === 1 ? "pieza" : "piezas"} al mes
          </text>
        )}
      </g>
    );
    y += HB + GAP;
    return g;
  });

  return (
    <div>
      <div className="w-full border border-[#2b2b2b] bg-[#171717] px-[18px] py-6">
        <svg viewBox={`-120 0 ${W + 240} ${y + 6}`} className="w-full h-auto block" role="img" aria-label="Embudo de contenido: TOFU, MOFU y BOFU">
          {capas}
        </svg>
      </div>

      {active && (
        <div className="px-1 pt-5 pb-2">
          <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">{active.capa} · {active.pilar} · {active.peso}</div>
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
    </div>
  );
}
