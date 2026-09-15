"use client";

import { Section, Nota, Editable } from "./doc";
import { useBroda } from "./BrodaContext";
import type { LineaNegocio } from "@/lib/broda";

const ESTADO_STYLE: Record<LineaNegocio["estado"], string> = {
  activa: "bg-accent text-accent-ink border-accent",
  construccion: "border-2 border-accent text-accent bg-transparent",
  diferida: "border-2 border-dashed border-border-strong text-ink-faint bg-transparent",
};

export default function NorthStar() {
  const { data } = useBroda();
  const { LINEAS, LINEAS_TABLA, LINEAS_NOTA } = data;

  return (
    <div>
      <div className="pb-10 border-b border-border">
        <div className="font-display font-black uppercase text-[clamp(48px,8vw,120px)] leading-[0.85] tracking-tight">
          BRODA<span className="text-accent">WORLD</span>
        </div>
      </div>

      <Section title="Las cuatro líneas" subtitle="Cada una depende de que la anterior esté funcionando. No son cuatro proyectos en paralelo: son cuatro escalones.">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {LINEAS.map((l, i) => (
            <div key={i} className={`rounded-full aspect-square flex flex-col items-center justify-center text-center p-4 ${ESTADO_STYLE[l.estado]}`}>
              <div className="font-display font-black text-[13px] md:text-[15px] leading-tight"><Editable path={["LINEAS", i, "nombre"]} value={l.nombre} /></div>
              <div className={`text-[10px] md:text-[10.5px] leading-snug mt-2 ${l.estado === "activa" ? "opacity-75" : "text-ink-faint"}`}><Editable path={["LINEAS", i, "desc"]} value={l.desc} multiline /></div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
          {LINEAS.map((l, i) => (
            <span key={i} className={`text-[12px] font-semibold ${l.estado === "activa" ? "text-accent" : "text-ink-faint"}`}>
              {l.nombre}: <Editable path={["LINEAS", i, "etiqueta"]} value={l.etiqueta} />
            </span>
          ))}
        </div>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead><tr>{LINEAS_TABLA.encabezados.map((h) => <th key={h} className="text-left font-display font-extrabold text-[11px] uppercase tracking-wide text-ink-faint pb-2.5 border-b border-border pr-6">{h}</th>)}</tr></thead>
            <tbody>
              {LINEAS_TABLA.filas.map((f, i) => (
                <tr key={i}>
                  {f.map((c, j) => (
                    <td key={j} className={`py-3 pr-6 border-b border-border text-[14px] align-top last:pr-0 ${j === 0 ? "font-display font-extrabold text-accent" : "text-ink-soft"}`}>
                      <Editable path={["LINEAS_TABLA", "filas", i, j]} value={c} multiline={j > 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Nota titulo={LINEAS_NOTA.titulo} texto={LINEAS_NOTA.texto} path={["LINEAS_NOTA"]} />
      </Section>
    </div>
  );
}
