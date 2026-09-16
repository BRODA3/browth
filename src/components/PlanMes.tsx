"use client";

import { useState } from "react";
import { useBroda } from "./BrodaContext";
import { Editable } from "./doc";
import type { Persona, TareaPlan } from "@/lib/planMes";

// Plan del mes: el framework comercial bajado a tareas con dueño y semana.
// Cada uno ve lo suyo, lo tilda cuando cumple el "listo cuando", y el avance
// del equipo se lee arriba de un vistazo.

export default function PlanMes() {
  const { data, update, editMode } = useBroda();
  const plan = data.PLAN_MES;
  const [filtro, setFiltro] = useState<Persona | null>(null);

  const colorDe = (p: Persona) => plan.personas.find((x) => x.nombre === p)?.color ?? "var(--accent)";
  const hechas = plan.tareas.filter((t) => t.hecha).length;
  const pct = plan.tareas.length ? Math.round((hechas / plan.tareas.length) * 100) : 0;

  const alternar = (id: string) => {
    const idx = plan.tareas.findIndex((t) => t.id === id);
    if (idx >= 0) update(["PLAN_MES", "tareas", idx, "hecha"], !plan.tareas[idx].hecha);
  };

  const agregar = (semana: number) => {
    const nueva: TareaPlan = {
      id: `t-${Date.now().toString(36)}`, semana, persona: filtro ?? "Charly",
      titulo: "Tarea nueva", listo: "Cómo se sabe que está hecha", seccion: "", hecha: false,
    };
    update(["PLAN_MES", "tareas"], [...plan.tareas, nueva]);
  };

  const borrar = (id: string) => update(["PLAN_MES", "tareas"], plan.tareas.filter((t) => t.id !== id));

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 max-w-[70ch]">
          <div className="eyebrow mb-2">Plan del mes · {plan.cuenta}</div>
          <h2 className="text-[clamp(28px,3.6vw,44px)] leading-[1] m-0">
            <Editable path={["PLAN_MES", "mes"]} value={plan.mes} />
          </h2>
          <p className="text-ink-soft text-[15px] leading-relaxed mt-3">
            <Editable path={["PLAN_MES", "objetivo"]} value={plan.objetivo} multiline />
          </p>
        </div>
        <Anillo valor={pct} texto={`${hechas} de ${plan.tareas.length}`} />
      </div>

      {/* Las tres personas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plan.personas.map((p) => {
          const suyas = plan.tareas.filter((t) => t.persona === p.nombre);
          const ok = suyas.filter((t) => t.hecha).length;
          const activo = filtro === p.nombre;
          return (
            <button
              key={p.nombre}
              onClick={() => setFiltro(activo ? null : p.nombre)}
              className="text-left rounded-[var(--r-lg)] border bg-surface p-4 transition-colors"
              style={{ borderColor: activo ? p.color : "var(--border)", boxShadow: activo ? `0 0 0 1px ${p.color}` : undefined }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-[15px] shrink-0"
                  style={{ border: `1.5px solid ${p.color}`, color: p.color }}
                >
                  {p.nombre.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-[16px] leading-tight">{p.nombre}</div>
                  <div className="text-[11.5px] text-ink-faint truncate">{p.rol}</div>
                </div>
                <span className="ml-auto tabular font-extrabold text-[20px]" style={{ color: p.color }}>
                  {suyas.length ? Math.round((ok / suyas.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden mt-3">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${suyas.length ? (ok / suyas.length) * 100 : 0}%`, background: p.color }} />
              </div>
              <div className="flex items-center justify-between mt-2.5 text-[11px]">
                <span className="text-ink-faint">Su número: <span className="text-ink-soft">{p.numero}</span></span>
                <span className="tabular text-ink-faint shrink-0 ml-2">{ok}/{suyas.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {filtro && (
        <div className="text-[12px] text-ink-faint -mt-2">
          Mostrando solo las tareas de <b className="text-ink-soft">{filtro}</b> ·{" "}
          <button onClick={() => setFiltro(null)} className="text-accent hover:underline">ver todo el equipo</button>
        </div>
      )}

      {/* Las cuatro semanas */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
        {plan.semanas.map((s, si) => {
          const deLaSemana = plan.tareas.filter((t) => t.semana === s.n);
          const visibles = filtro ? deLaSemana.filter((t) => t.persona === filtro) : deLaSemana;
          const ok = deLaSemana.filter((t) => t.hecha).length;
          const orden: Persona[] = ["Thiago", "Tomi", "Charly"];
          return (
            <div key={s.n} className="rounded-[var(--r-lg)] border border-border bg-surface flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-black text-[22px] text-accent tabular">{String(s.n).padStart(2, "0")}</span>
                  <span className="font-display font-extrabold text-[15px] uppercase tracking-tight">
                    <Editable path={["PLAN_MES", "semanas", si, "foco"]} value={s.foco} />
                  </span>
                  <span className="ml-auto tabular text-[11px] text-ink-faint">{ok}/{deLaSemana.length}</span>
                </div>
                <div className="text-[11.5px] text-ink-faint mt-0.5">
                  <Editable path={["PLAN_MES", "semanas", si, "bajada"]} value={s.bajada} />
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2 flex-1">
                {orden.flatMap((persona) => visibles.filter((t) => t.persona === persona)).map((tarea) => {
                  const idx = plan.tareas.findIndex((x) => x.id === tarea.id);
                  const color = colorDe(tarea.persona);
                  return (
                    <div
                      key={tarea.id}
                      className={`rounded-[var(--r-md)] border border-border bg-surface-2/60 p-3 transition-opacity ${tarea.hecha ? "opacity-55" : ""}`}
                      style={{ borderLeft: `2px solid ${color}` }}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => alternar(tarea.id)}
                          aria-label={tarea.hecha ? "Marcar como pendiente" : "Marcar como hecha"}
                          className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 mt-[1px] transition-colors"
                          style={{ borderColor: color, background: tarea.hecha ? color : "transparent" }}
                        >
                          {tarea.hecha && (
                            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                              <path d="M1.5 5.2 L4 7.5 L8.5 2.5" stroke="#0a0a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9.5px] font-display font-extrabold uppercase tracking-wider" style={{ color }}>{tarea.persona}</span>
                            {tarea.seccion && (
                              <span className="text-[9px] px-1.5 py-[1px] rounded border border-border-strong text-ink-faint">{tarea.seccion}</span>
                            )}
                          </div>
                          <div className={`text-[12.5px] leading-snug ${tarea.hecha ? "line-through text-ink-faint" : "text-ink"}`}>
                            <Editable path={["PLAN_MES", "tareas", idx, "titulo"]} value={tarea.titulo} multiline />
                          </div>
                          <div className="text-[11px] text-ink-faint mt-1 leading-snug">
                            <span className="text-ink-soft">Listo cuando:</span>{" "}
                            <Editable path={["PLAN_MES", "tareas", idx, "listo"]} value={tarea.listo} multiline />
                          </div>
                          {editMode && (
                            <div className="flex items-center gap-2 mt-2">
                              <select
                                value={tarea.persona}
                                onChange={(e) => update(["PLAN_MES", "tareas", idx, "persona"], e.target.value)}
                                className="border border-border-strong rounded-[var(--r-sm)] bg-bg text-ink px-1.5 py-0.5 text-[11px]"
                              >
                                {plan.personas.map((p) => <option key={p.nombre}>{p.nombre}</option>)}
                              </select>
                              <button onClick={() => borrar(tarea.id)} className="ml-auto text-[11px] text-critical hover:underline">Borrar</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {visibles.length === 0 && <div className="text-[11.5px] text-ink-faint italic px-1">Sin tareas esta semana.</div>}
                {editMode && (
                  <button
                    onClick={() => agregar(s.n)}
                    className="mt-auto border border-dashed border-border-strong rounded-[var(--r-md)] py-2 text-[11.5px] text-ink-faint hover:text-ink hover:border-accent transition-colors"
                  >
                    + Tarea
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reglas */}
      <div className="border border-accent rounded-[var(--r-lg)] px-5 py-4">
        <div className="font-display font-extrabold text-[15px] mb-2">Reglas del mes</div>
        <ul className="flex flex-col gap-1.5">
          {plan.reglas.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] text-ink-soft leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-[7px]" />
              <Editable path={["PLAN_MES", "reglas", i]} value={r} multiline />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Anillo({ valor, texto }: { valor: number; texto: string }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3 shrink-0">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="52" cy="52" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(valor / 100) * c} ${c}`} transform="rotate(-90 52 52)"
          style={{ transition: "stroke-dasharray 0.5s" }}
        />
        <text x="52" y="57" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ink)" className="tabular">{valor}%</text>
      </svg>
      <div>
        <div className="eyebrow">Avance del equipo</div>
        <div className="text-[13px] text-ink-soft mt-1 tabular">{texto} tareas</div>
      </div>
    </div>
  );
}
