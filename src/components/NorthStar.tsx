"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <Section
        title="Los cinco modelos de negocio"
        subtitle="Cada uno depende de que el anterior esté funcionando. No son cinco proyectos en paralelo: son cinco escalones. Tocá cualquiera para ver qué lo desbloquea y por qué todavía no."
        first
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {LINEAS.map((l, i) => (
            <button
              key={i}
              onClick={() => setOpen(open === i ? null : i)}
              className={`rounded-full aspect-square flex flex-col items-center justify-center text-center p-5 transition-transform hover:-translate-y-1 ${ESTADO_STYLE[l.estado]} ${open === i ? "ring-2 ring-offset-2 ring-offset-bg ring-accent" : ""}`}
            >
              <div className="font-display font-black text-[16px] md:text-[19px] leading-tight">{l.nombre}</div>
              <div className={`text-[11px] md:text-[12px] leading-snug mt-2.5 ${l.estado === "activa" ? "opacity-75" : "text-ink-faint"}`}>{l.desc}</div>
              <div className={`text-[9px] font-display font-extrabold uppercase tracking-wide mt-3 ${l.estado === "activa" ? "opacity-60" : "opacity-70"}`}>{open === i ? "▲ Cerrar" : "▼ Ver más"}</div>
            </button>
          ))}
        </div>

        {open != null && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-baseline gap-3 mb-4 flex-wrap">
              <h3 className="text-2xl m-0 normal-case tracking-normal" style={{ color: LINEAS[open].estado === "activa" ? "var(--accent)" : "var(--ink)" }}>
                <Editable path={["LINEAS", open, "nombre"]} value={LINEAS[open].nombre} />
              </h3>
              <span className="text-[12px] text-ink-faint">
                <Editable path={["LINEAS", open, "etiqueta"]} value={LINEAS[open].etiqueta} />
              </span>
            </div>
            <p className="text-ink-soft text-[14px] mb-5 max-w-[66ch]"><Editable path={["LINEAS", open, "desc"]} value={LINEAS[open].desc} multiline /></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Qué la desbloquea</div>
                <p className="text-[13.5px] text-ink-soft"><Editable path={["LINEAS_TABLA", "filas", open, 1]} value={LINEAS_TABLA.filas[open][1]} multiline /></p>
              </div>
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Por qué todavía no</div>
                <p className="text-[13.5px] text-ink-soft"><Editable path={["LINEAS_TABLA", "filas", open, 2]} value={LINEAS_TABLA.filas[open][2]} multiline /></p>
              </div>
            </div>
          </div>
        )}

        <Nota titulo={LINEAS_NOTA.titulo} texto={LINEAS_NOTA.texto} path={["LINEAS_NOTA"]} />
      </Section>
    </div>
  );
}
