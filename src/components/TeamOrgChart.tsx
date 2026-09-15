"use client";

import { useState } from "react";
import { useBroda } from "./BrodaContext";
import { Editable } from "./doc";
import type { MiembroEquipo } from "@/lib/broda";

// Organigrama del equipo real: el núcleo decide qué se hace, las células
// deciden cómo, y la red trae clientes o apoya desde afuera sin operar.

export default function TeamOrgChart() {
  const { data } = useBroda();
  const { EQUIPO_BRODA, ESTRUCTURA, BRODAWEEK } = data;
  const [sel, setSel] = useState<string | null>("Charly");

  const persona = (n: string) => EQUIPO_BRODA.find((m) => m.persona === n);
  const kpiDe = (n: string) => BRODAWEEK.kpis.find((k) => k[0] === n)?.[1];
  const idxSel = sel ? EQUIPO_BRODA.findIndex((m) => m.persona === sel) : -1;
  const seleccionado = idxSel >= 0 ? EQUIPO_BRODA[idxSel] : null;

  const card = (n: string, tone: "nucleo" | "lider" | "equipo" | "red") => {
    const m = persona(n);
    if (!m) return null;
    return <PersonCard m={m} kpi={kpiDe(n)} tone={tone} active={sel === n} onClick={() => setSel(sel === n ? null : n)} />;
  };

  return (
    <div className="bg-surface border border-border rounded-[var(--r-lg)] p-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-8">
        <div>
          <h2 className="text-[17px] leading-tight m-0 normal-case tracking-tight font-display font-extrabold">Organigrama</h2>
          <p className="text-[12.5px] text-ink-faint mt-1">El núcleo decide qué se hace y para quién. Las células deciden cómo. Tocá una persona para ver sus tareas fijas.</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-ink-faint">
          <Leyenda className="bg-accent" label="Núcleo" />
          <Leyenda className="bg-surface-3 border border-border-strong" label="Células" />
          <Leyenda className="border border-dashed border-border-strong" label="Red / vacante" />
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] flex flex-col items-center">
          {/* Núcleo: tres socios al mismo nivel */}
          <div className="eyebrow mb-3">Núcleo</div>
          <div className="flex items-center">
            {ESTRUCTURA.nucleo.map((n, i) => (
              <div key={n} className="flex items-center">
                {i > 0 && <span className="w-10 h-px bg-accent/50" />}
                {card(n, "nucleo")}
              </div>
            ))}
          </div>

          <span className="w-px h-8 bg-border-strong" />

          {/* Células: cada líder con su equipo */}
          <Branches>
            {ESTRUCTURA.celulas.map((c) => (
              <div key={c.lider} className="flex flex-col items-center">
                <div className="eyebrow mb-2.5">{c.nombre}</div>
                {card(c.lider, "lider")}
                {c.equipo.length > 0 && <span className="w-px h-6 bg-border-strong" />}
                <Branches small>
                  {c.equipo.map((n) => <div key={n}>{card(n, "equipo")}</div>)}
                </Branches>
              </div>
            ))}
          </Branches>

          {/* Red: externos, no operan el embudo */}
          <div className="w-full mt-10 pt-6 border-t border-dashed border-border-strong flex flex-col items-center">
            <div className="eyebrow mb-3">Red · desde afuera</div>
            <div className="flex items-center gap-4">
              {ESTRUCTURA.red.map((n) => <div key={n}>{card(n, "red")}</div>)}
            </div>
          </div>
        </div>
      </div>

      {seleccionado && (
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          <div className="flex items-center gap-3">
            <Avatar m={seleccionado} tone={seleccionado.nucleo ? "nucleo" : "equipo"} size="lg" />
            <div className="min-w-0">
              <div className="font-display font-extrabold text-[18px] leading-tight">{seleccionado.persona}</div>
              <div className="text-[12.5px] text-ink-soft"><Editable path={["EQUIPO_BRODA", idxSel, "rol"]} value={seleccionado.rol} /></div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="eyebrow mb-2">Tareas fijas</div>
              <p className="text-[14px] text-ink-soft leading-relaxed max-w-[70ch]">
                <Editable path={["EQUIPO_BRODA", idxSel, "tareas"]} value={seleccionado.tareas} multiline />
              </p>
            </div>
            {kpiDe(seleccionado.persona) && (
              <div>
                <div className="eyebrow mb-2">Su único KPI</div>
                <p className="text-[14px] text-accent">{kpiDe(seleccionado.persona)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ramas de árbol: una barra horizontal que une a los hijos, con un tallo a cada uno. */
function Branches({ children, small }: { children: React.ReactNode; small?: boolean }) {
  const kids = Array.isArray(children) ? children : [children];
  if (kids.length === 0) return null;
  return (
    <div className="flex justify-center">
      {kids.map((k, i) => (
        <div key={i} className={`relative flex flex-col items-center ${small ? "px-2.5 pt-6" : "px-8 pt-8"}`}>
          {kids.length > 1 && (
            <span
              className="absolute top-0 h-px bg-border-strong"
              style={{ left: i === 0 ? "50%" : 0, right: i === kids.length - 1 ? "50%" : 0 }}
            />
          )}
          <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-border-strong ${small ? "h-6" : "h-8"}`} />
          {k}
        </div>
      ))}
    </div>
  );
}

function PersonCard({
  m, kpi, tone, active, onClick,
}: { m: MiembroEquipo; kpi?: string; tone: "nucleo" | "lider" | "equipo" | "red"; active: boolean; onClick: () => void }) {
  const dashed = tone === "red" || m.vacante;
  return (
    <button
      onClick={onClick}
      className={`w-[184px] text-left rounded-[var(--r-md)] p-3 transition-all hover:-translate-y-0.5 ${
        dashed ? "border border-dashed border-border-strong bg-transparent" : tone === "nucleo" ? "border border-accent/40 bg-accent/[0.06]" : "border border-border bg-surface-2"
      } ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <Avatar m={m} tone={tone} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[13px] text-ink truncate">{m.persona}</span>
            {m.vacante && <span className="text-[8.5px] font-display font-extrabold uppercase tracking-wide text-warn">Vacante</span>}
          </div>
          <div className="text-[11px] text-ink-faint truncate">{m.rol}</div>
        </div>
      </div>
      {kpi && (
        <div className="mt-2.5 pt-2 border-t border-border flex items-start gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[5px] shrink-0" />
          <span className="text-[10.5px] text-ink-soft leading-snug line-clamp-2">{kpi}</span>
        </div>
      )}
    </button>
  );
}

function Avatar({ m, tone, size = "md" }: { m: MiembroEquipo; tone: string; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "w-12 h-12 text-[18px]" : "w-8 h-8 text-[12px]";
  const nucleo = tone === "nucleo";
  return (
    <span
      className={`${dim} rounded-full shrink-0 flex items-center justify-center font-display font-black ${m.vacante ? "border border-dashed border-border-strong" : ""}`}
      style={{ background: nucleo ? "var(--accent)" : m.vacante ? "transparent" : "var(--surface-3)", color: nucleo ? "var(--accent-ink)" : "var(--ink-soft)" }}
    >
      {m.vacante ? "?" : m.persona.charAt(0)}
    </span>
  );
}

function Leyenda({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} /> {label}
    </span>
  );
}
