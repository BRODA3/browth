"use client";

import { useBroda } from "./BrodaContext";
import { Editable } from "./doc";
import { AUTOMATIZACION_LABEL, pasoVacio, type Automatizacion, type PasoFlujo } from "@/lib/broda";

// El framework de una capa del embudo: objetivo, dueño, disparador, el flujo
// paso a paso con quién lo hace y con qué, y cómo se sabe que funcionó.
// Cada paso dice si hoy es manual — de ahí sale la lista de agentes a construir.

const TONO: Record<Automatizacion, { color: string; bg: string }> = {
  manual: { color: "var(--ink-faint)", bg: "transparent" },
  asistido: { color: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 12%, transparent)" },
  agente: { color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
};

export default function FlujoCapa({ capaId, dueno }: { capaId: string; dueno: string }) {
  const { data, update, editMode } = useBroda();
  const flujo = data.FLUJOS?.[capaId];
  if (!flujo) return null;

  const path = (...resto: (string | number)[]) => ["FLUJOS", capaId, ...resto];
  const setPasos = (pasos: PasoFlujo[]) => update(path("pasos"), pasos);
  const manuales = flujo.pasos.filter((p) => p.automatizacion === "manual").length;

  if (flujo.pasos.length === 0 && !editMode) {
    return (
      <div className="border border-dashed border-border-strong rounded-[var(--r-md)] p-5 text-[13px] text-ink-faint">
        Esta capa todavía no está mapeada. Se mapea cuando le toca el turno: una capa por vez.
        <div className="mt-1.5 text-[12px]">Prendé <b className="text-ink-soft">Editar</b> arriba a la derecha para bajar el flujo.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Bloque titulo="Objetivo">
          <Editable path={path("objetivo")} value={flujo.objetivo} multiline />
        </Bloque>
        <Bloque titulo="Dueño">
          <span className="text-accent font-semibold">{dueno}</span>
        </Bloque>
        <Bloque titulo="Cómo se mide">
          <Editable path={path("kpi")} value={flujo.kpi} multiline />
        </Bloque>
      </div>

      <div>
        <div className="eyebrow mb-2">Se dispara cuando</div>
        <p className="text-[14px] text-ink-soft max-w-[72ch]">
          <Editable path={path("disparador")} value={flujo.disparador} multiline />
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
          <div className="eyebrow">El flujo, paso a paso</div>
          <div className="text-[11.5px] text-ink-faint">
            {flujo.pasos.length} pasos · <span className={manuales > 0 ? "text-warn" : "text-accent"}>{manuales} manuales hoy</span>
          </div>
        </div>

        <ol className="flex flex-col">
          {flujo.pasos.map((p, i) => (
            <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
              {i < flujo.pasos.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border-strong" />}
              <span className="relative z-10 w-8 h-8 shrink-0 rounded-full border border-border-strong bg-surface flex items-center justify-center tabular text-[12px] font-bold text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1 border border-border rounded-[var(--r-md)] bg-surface p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-ink leading-snug flex-1 min-w-0">
                    <Editable path={path("pasos", i, "que")} value={p.que} multiline />
                  </p>
                  {editMode ? (
                    <select
                      value={p.automatizacion}
                      onChange={(e) => update(path("pasos", i, "automatizacion"), e.target.value)}
                      className="shrink-0 border border-border-strong rounded-full bg-bg text-ink px-2 py-1 text-[10.5px]"
                    >
                      {(Object.keys(AUTOMATIZACION_LABEL) as Automatizacion[]).map((a) => (
                        <option key={a} value={a}>{AUTOMATIZACION_LABEL[a]}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="shrink-0 font-display font-extrabold uppercase text-[9.5px] tracking-wide px-2 py-1 rounded-full border"
                      style={{ color: TONO[p.automatizacion].color, background: TONO[p.automatizacion].bg, borderColor: `color-mix(in srgb, ${TONO[p.automatizacion].color} 45%, transparent)` }}
                    >
                      {AUTOMATIZACION_LABEL[p.automatizacion]}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border">
                  <Dato k="Quién"><Editable path={path("pasos", i, "quien")} value={p.quien} /></Dato>
                  <Dato k="Con qué"><Editable path={path("pasos", i, "herramienta")} value={p.herramienta} /></Dato>
                  <Dato k="Deja"><Editable path={path("pasos", i, "salida")} value={p.salida} /></Dato>
                </div>

                {(p.agente || editMode) && (
                  <div className="mt-2.5 pt-2.5 border-t border-dashed border-border flex items-center gap-2 text-[11.5px]">
                    <span className="text-ink-faint">Agente:</span>
                    <span className={p.automatizacion === "agente" ? "text-accent font-semibold" : "text-ink-soft"}>
                      <Editable path={path("pasos", i, "agente")} value={p.agente} />
                    </span>
                    {p.agente && p.automatizacion !== "agente" && <span className="text-ink-faint">— a construir</span>}
                  </div>
                )}

                {editMode && (
                  <button
                    onClick={() => setPasos(flujo.pasos.filter((_, j) => j !== i))}
                    className="mt-2 text-[11px] text-critical hover:underline"
                  >
                    Borrar paso
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>

        {editMode && (
          <button
            onClick={() => setPasos([...flujo.pasos, pasoVacio()])}
            className="mt-3 ml-12 text-[12px] text-ink-faint hover:text-ink border border-dashed border-border-strong hover:border-accent rounded-[var(--r-sm)] px-3 py-1.5 transition-colors"
          >
            + Paso
          </button>
        )}
      </div>

      <div className="border-l-[3px] border-accent pl-4 py-1">
        <div className="eyebrow mb-1">Listo cuando</div>
        <p className="text-[14px] text-ink-soft max-w-[72ch]">
          <Editable path={path("listo")} value={flujo.listo} multiline />
        </p>
      </div>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-[var(--r-md)] bg-surface p-4">
      <div className="eyebrow mb-1.5">{titulo}</div>
      <div className="text-[13.5px] text-ink-soft leading-snug">{children}</div>
    </div>
  );
}

function Dato({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[9.5px] uppercase tracking-wide text-ink-faint">{k}</div>
      <div className="text-[12px] text-ink-soft leading-snug">{children}</div>
    </div>
  );
}
