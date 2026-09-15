"use client";

import { Section, Nota, DocTable } from "./doc";
import { LINEAS, LINEAS_TABLA, LINEAS_NOTA, type LineaNegocio } from "@/lib/broda";

const ESTADO_STYLE: Record<LineaNegocio["estado"], string> = {
  activa: "bg-accent text-accent-ink border-accent",
  construccion: "border-2 border-accent text-accent bg-transparent",
  diferida: "border-2 border-dashed border-border-strong text-ink-faint bg-transparent",
};

export default function NorthStar() {
  return (
    <div>
      <div className="pb-10 border-b border-border">
        <div className="font-display font-black uppercase text-[clamp(48px,8vw,120px)] leading-[0.85] tracking-tight">
          BRODA<span className="text-accent">WORLD</span>
        </div>
      </div>

      <Section title="Las cuatro líneas" subtitle="Cada una depende de que la anterior esté funcionando. No son cuatro proyectos en paralelo: son cuatro escalones.">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {LINEAS.map((l) => (
            <div key={l.nombre} className={`rounded-full aspect-square flex flex-col items-center justify-center text-center p-4 ${ESTADO_STYLE[l.estado]}`}>
              <div className="font-display font-black text-[13px] md:text-[15px] leading-tight">{l.nombre}</div>
              <div className={`text-[10px] md:text-[10.5px] leading-snug mt-2 ${l.estado === "activa" ? "opacity-75" : "text-ink-faint"}`}>{l.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
          {LINEAS.map((l) => (
            <span key={l.nombre} className={`text-[12px] font-semibold ${l.estado === "activa" ? "text-accent" : "text-ink-faint"}`}>{l.nombre}: {l.etiqueta}</span>
          ))}
        </div>
        <div className="mt-10">
          <DocTable headers={LINEAS_TABLA.encabezados} rows={LINEAS_TABLA.filas} highlightCol0 />
        </div>
        <Nota titulo={LINEAS_NOTA.titulo} texto={LINEAS_NOTA.texto} />
      </Section>
    </div>
  );
}
