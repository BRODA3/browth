"use client";

import { LINEAS, LINEAS_TABLA, LINEAS_NOTA, type LineaNegocio } from "@/lib/broda";

const ESTADO_STYLE: Record<LineaNegocio["estado"], string> = {
  activa: "bg-accent text-accent-ink border-accent",
  construccion: "border-2 border-accent text-accent bg-transparent",
  diferida: "border-2 border-dashed border-border-strong text-ink-faint bg-transparent",
};

export default function NorthStar() {
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-6 mb-4 text-center">
        <div className="font-display font-black uppercase text-[clamp(40px,7vw,88px)] leading-[0.9] tracking-tight">
          BRODA<span className="text-accent">WORLD</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Las cuatro líneas</h2>
        <p className="text-ink-soft text-[12.5px] mb-4 max-w-[70ch]">Cada una depende de que la anterior esté funcionando. No son cuatro proyectos en paralelo: son cuatro escalones.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {LINEAS.map((l) => (
            <div key={l.nombre} className={`rounded-full aspect-square flex flex-col items-center justify-center text-center p-4 ${ESTADO_STYLE[l.estado]}`}>
              <div className="font-display font-black text-[13px] md:text-[15px] leading-tight">{l.nombre}</div>
              <div className={`text-[10px] md:text-[10.5px] leading-snug mt-2 ${l.estado === "activa" ? "opacity-75" : "text-ink-faint"}`}>{l.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
          {LINEAS.map((l) => (
            <span key={l.nombre} className={`text-[11px] font-semibold ${l.estado === "activa" ? "text-accent" : "text-ink-faint"}`}>{l.nombre}: {l.etiqueta}</span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4 overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>{LINEAS_TABLA.encabezados.map((h) => <th key={h} className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border pr-4">{h}</th>)}</tr>
          </thead>
          <tbody>
            {LINEAS_TABLA.filas.map((f, i) => (
              <tr key={i}>{f.map((c, j) => <td key={j} className={`py-3 pr-4 border-b border-border text-[13px] last:border-none ${j === 0 ? "font-display font-extrabold text-accent" : "text-ink-soft"}`}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-accent bg-panel-raised shadow-lg p-5">
        <h2 className="text-lg m-0 mb-1.5 normal-case tracking-normal font-display font-bold">{LINEAS_NOTA.titulo}</h2>
        <p className="text-ink-soft text-[13.5px] max-w-[72ch]">{LINEAS_NOTA.texto}</p>
      </div>
    </>
  );
}
