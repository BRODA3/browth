"use client";

import { useState } from "react";
import { Section, Editable } from "./doc";
import { useBroda } from "./BrodaContext";
import type { LineaNegocio } from "@/lib/broda";

const ESTADO_RING: Record<LineaNegocio["estado"], string> = {
  activa: "bg-accent text-accent-ink border-2 border-accent",
  construccion: "border-2 border-accent text-accent bg-accent/[0.07]",
  diferida: "border-2 border-dashed border-border-strong text-ink-faint bg-transparent",
};

const ESTADO_LABEL: Record<LineaNegocio["estado"], string> = {
  activa: "Activa",
  construccion: "En construcción",
  diferida: "Diferida",
};

export default function NorthStar() {
  const { data } = useBroda();
  const { LINEAS, LINEAS_TABLA } = data;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <Section
        title="Los cinco modelos de negocio"
        subtitle="Cada uno depende de que el anterior esté funcionando. No son cinco proyectos en paralelo: son cinco escalones. Tocá cualquiera para ver qué lo desbloquea y por qué todavía no."
        first
      >
        {/* Escalera: los 5 modelos con la flecha de dependencia entre uno y el siguiente */}
        <div className="flex items-center gap-1 md:gap-2">
          {LINEAS.map((l, i) => (
            <div key={i} className="contents">
              {i > 0 && <StepArrow />}
              <button
                onClick={() => setOpen(open === i ? null : i)}
                title={l.desc}
                className={`flex-1 min-w-0 aspect-square rounded-full flex flex-col items-center justify-center text-center px-3 transition-all duration-200 hover:-translate-y-1 ${ESTADO_RING[l.estado]} ${
                  open === i ? "ring-2 ring-accent ring-offset-4 ring-offset-bg" : ""
                }`}
              >
                <span
                  className={`font-display font-black leading-[1.05] tracking-tight ${
                    l.nombre.length > 10 ? "text-[13px] md:text-[15px]" : "text-[15px] md:text-[19px]"
                  }`}
                >
                  {l.nombre}
                </span>
                <span
                  className={`text-[9px] font-display font-extrabold uppercase tracking-[0.08em] mt-2 ${
                    l.estado === "activa" ? "opacity-60" : l.estado === "construccion" ? "opacity-80" : "opacity-70"
                  }`}
                >
                  {ESTADO_LABEL[l.estado]}
                </span>
              </button>
            </div>
          ))}
        </div>

        {open != null && (
          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex items-baseline gap-3 mb-3 flex-wrap">
              <h3
                className="text-[26px] m-0 normal-case tracking-tight"
                style={{ color: LINEAS[open].estado === "diferida" ? "var(--ink)" : "var(--accent)" }}
              >
                <Editable path={["LINEAS", open, "nombre"]} value={LINEAS[open].nombre} />
              </h3>
              <span className="text-[12px] text-ink-faint">
                <Editable path={["LINEAS", open, "etiqueta"]} value={LINEAS[open].etiqueta} />
              </span>
            </div>

            <p className="text-ink-soft text-[15px] leading-relaxed mb-7 max-w-[66ch]">
              <Editable path={["LINEAS", open, "desc"]} value={LINEAS[open].desc} multiline />
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px]">
              <div>
                <div className="eyebrow mb-2.5">Qué lo desbloquea</div>
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  <Editable path={["LINEAS_TABLA", "filas", open, 1]} value={LINEAS_TABLA.filas[open][1]} multiline />
                </p>
              </div>
              <div>
                <div className="eyebrow mb-2.5">Por qué todavía no</div>
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  <Editable path={["LINEAS_TABLA", "filas", open, 2]} value={LINEAS_TABLA.filas[open][2]} multiline />
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function StepArrow() {
  return (
    <svg
      width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"
      className="shrink-0 text-border-strong"
    >
      <path d="M1 7h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 2.5 L20.5 7 L15 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
