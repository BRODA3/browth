"use client";

import { useState } from "react";
import { Section, Eyebrow } from "./doc";
import { PLAN, type PiezaPlan } from "@/lib/broda";

const CANAL_COLOR: Record<string, string> = { ig: "#C8F542", li: "#4FD1FF", yt: "#FF5C5C" };
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function fechaISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function PlanContenido() {
  const [open, setOpen] = useState<PiezaPlan | null>(null);
  const meses = [
    { year: 2026, month: 8, nombre: "Septiembre 2026" }, // month 0-indexed: 8 = Sept
    { year: 2026, month: 9, nombre: "Octubre 2026" },
  ];

  return (
    <div>
      <Section title="Plan de contenido" subtitle={`${PLAN.bajada} 15 sep — 12 oct. Hacé clic en cualquier día con pieza para abrir el brief completo.`} first>
        <div className="flex items-center gap-5 mb-6">
          {PLAN.leyenda.map((l) => (
            <span key={l.tipo} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <span className="w-2 h-2 rounded-full" style={{ background: CANAL_COLOR[l.tipo] }} /> {l.label}
            </span>
          ))}
        </div>

        {meses.map((m) => {
          const cells = buildMonth(m.year, m.month);
          return (
            <div key={m.nombre} className="mb-10">
              <Eyebrow>{m.nombre}</Eyebrow>
              <div className="grid grid-cols-7 gap-px bg-border border border-border">
                {DOW.map((d) => (
                  <div key={d} className="bg-panel text-center text-[10px] font-display font-extrabold uppercase tracking-wide text-ink-faint py-2">{d}</div>
                ))}
                {cells.map((day, i) => {
                  const iso = day ? fechaISO(m.year, m.month, day) : null;
                  const piezas = iso ? PLAN.filas.filter((p) => p.fecha === iso) : [];
                  return (
                    <div key={i} className={`bg-bg min-h-[90px] p-1.5 ${day == null ? "opacity-30" : ""}`}>
                      {day != null && <div className="text-[11px] text-ink-faint mb-1">{day}</div>}
                      {piezas.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setOpen(p)}
                          className="w-full text-left mt-1 text-[10px] font-semibold px-1.5 py-1 rounded flex items-center gap-1.5 bg-panel-raised border border-transparent hover:border-current"
                          style={{ color: CANAL_COLOR[p.canal], boxShadow: p.prioridad ? `inset 2px 0 0 ${CANAL_COLOR[p.canal]}` : undefined }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CANAL_COLOR[p.canal] }} />
                          <span className="truncate">{p.formato}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {PLAN.reservas.length > 0 && (
          <div className="mt-2">
            <Eyebrow>En reserva, sin fecha</Eyebrow>
            <ul className="flex flex-col">
              {PLAN.reservas.map((r, i) => (
                <li key={i} className="text-[13px] text-ink-faint py-2 border-b border-border last:border-none">{r}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {open && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[60] p-5" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="bg-panel border border-border-strong max-w-lg w-full p-7 relative">
            <button onClick={() => setOpen(null)} className="absolute top-3 right-4 text-ink-faint hover:text-ink text-lg">✕</button>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: CANAL_COLOR[open.canal] }} />
              <span className="text-[11px] font-semibold" style={{ color: CANAL_COLOR[open.canal] }}>{open.canalLabel} · {open.formato}</span>
            </div>
            <h3 className="text-xl normal-case tracking-normal font-display font-bold mb-1">{open.tema}</h3>
            <div className="text-[11.5px] text-ink-faint mb-4">{open.fecha} · {open.pilar} · {open.estado}</div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">{open.detalle}</p>
          </div>
        </div>
      )}
    </div>
  );
}
