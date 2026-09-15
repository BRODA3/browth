"use client";

import { useMemo, useState } from "react";
import { useBroda } from "./BrodaContext";
import {
  FORMATOS, CANALES, ESTADOS_PIEZA, tipoDePieza, type PiezaPlan,
} from "@/lib/broda";

const CANAL_COLOR: Record<string, string> = { ig: "#C8F542", li: "#4FD1FF", yt: "#FF5C5C" };
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SIN_FECHA = "__sin_fecha__";

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function PlanContenido() {
  const { data, update } = useBroda();
  const filas = data.PLAN.filas as PiezaPlan[];

  // El calendario arranca en el mes de la primera pieza con fecha.
  const primera = useMemo(() => filas.map((p) => p.fecha).filter(Boolean).sort()[0], [filas]);
  const [cursor, setCursor] = useState(() => {
    const d = primera ? new Date(`${primera}T12:00:00`) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const setFilas = (next: PiezaPlan[]) => update(["PLAN", "filas"], next);
  const patchPieza = (id: string, patch: Partial<PiezaPlan>) =>
    setFilas(filas.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  function moverA(id: string, destino: string) {
    patchPieza(id, { fecha: destino === SIN_FECHA ? "" : destino });
  }

  function nuevaPieza(fecha = "") {
    const id = `p-${Date.now()}`;
    setFilas([
      ...filas,
      { id, prioridad: false, fecha, canal: "ig", canalLabel: "Instagram", formato: "Reel", tema: "Nueva pieza", pilar: "Sin asignar", estado: "Bloque abierto", detalle: "" },
    ]);
    setOpenId(id);
  }

  function borrarPieza(id: string) {
    setFilas(filas.filter((p) => p.id !== id));
    setOpenId(null);
  }

  const cells = buildMonth(cursor.year, cursor.month);
  const sinFecha = filas.filter((p) => !p.fecha);
  const delMes = filas.filter((p) => p.fecha.startsWith(`${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`));
  const abierta = openId ? filas.find((p) => p.id === openId) ?? null : null;

  const navMes = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOver !== key) setDragOver(key); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((k) => (k === key ? null : k)); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/pieza");
      if (id) moverA(id, key);
      setDragOver(null);
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
        <div>
          <h2 className="text-[clamp(26px,3.4vw,40px)] leading-[1.02] mb-2">Plan de contenido</h2>
          <p className="text-ink-soft text-[14.5px] max-w-[62ch]">
            Arrastrá las piezas entre días o a la bandeja. Tocá una para editar el brief: titular, subtítulo y composición en diseño; hook, tensión, transformación y CTA en video.
          </p>
        </div>
        <button
          onClick={() => nuevaPieza()}
          className="shrink-0 bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
        >
          + Nueva pieza
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_250px] gap-4 items-start">
        {/* Calendario */}
        <div className="bg-surface border border-border rounded-[var(--r-lg)] overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-1.5">
              <button onClick={() => navMes(-1)} aria-label="Mes anterior" className="w-8 h-8 rounded-[var(--r-sm)] border border-border hover:border-border-strong text-ink-soft hover:text-ink">‹</button>
              <button onClick={() => navMes(1)} aria-label="Mes siguiente" className="w-8 h-8 rounded-[var(--r-sm)] border border-border hover:border-border-strong text-ink-soft hover:text-ink">›</button>
              <span className="font-display font-extrabold text-[15px] ml-2">{MESES[cursor.month]} {cursor.year}</span>
            </div>
            <div className="flex items-center gap-4">
              {CANALES.map((c) => (
                <span key={c.canal} className="flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                  <span className="w-2 h-2 rounded-full" style={{ background: CANAL_COLOR[c.canal] }} /> {c.label}
                </span>
              ))}
              <span className="text-[11.5px] text-ink-faint tabular">{delMes.length} piezas</span>
            </div>
          </div>

          <div className="grid grid-cols-7">
            {DOW.map((d) => (
              <div key={d} className="text-[10px] font-display font-extrabold uppercase tracking-[0.08em] text-ink-faint px-2.5 py-2 border-b border-border">{d}</div>
            ))}
            {cells.map((day, i) => {
              const key = day ? iso(cursor.year, cursor.month, day) : null;
              const piezas = key ? filas.filter((p) => p.fecha === key) : [];
              const col = i % 7;
              return (
                <div
                  key={i}
                  {...(key ? dropProps(key) : {})}
                  className={`group relative min-h-[112px] p-1.5 border-b border-border ${col < 6 ? "border-r" : ""} transition-colors ${
                    day == null ? "bg-bg/40" : dragOver === key ? "bg-accent/[0.08]" : ""
                  }`}
                >
                  {day != null && (
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[11px] text-ink-faint tabular">{day}</span>
                      <button
                        onClick={() => nuevaPieza(key!)}
                        aria-label={`Nueva pieza el ${day}`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5 rounded text-ink-faint hover:text-accent hover:bg-surface-3 text-[13px] leading-none transition-opacity"
                      >
                        +
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    {piezas.map((p) => (
                      <PiezaChip key={p.id} pieza={p} onOpen={() => setOpenId(p.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bandeja sin fecha */}
        <div
          {...dropProps(SIN_FECHA)}
          className={`bg-surface border rounded-[var(--r-lg)] p-4 xl:sticky xl:top-24 transition-colors ${
            dragOver === SIN_FECHA ? "border-accent bg-accent/[0.05]" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-extrabold text-[14px]">Sin fecha</span>
            <span className="text-[11px] text-ink-faint tabular">{sinFecha.length}</span>
          </div>
          <p className="text-[11.5px] text-ink-faint mb-3">Soltá acá lo que sale del calendario. Arrastrá al día para programar.</p>
          <div className="flex flex-col gap-1.5 min-h-[80px]">
            {sinFecha.length === 0 && (
              <div className="border border-dashed border-border-strong rounded-[var(--r-sm)] text-[11.5px] text-ink-faint text-center py-6">Vacía</div>
            )}
            {sinFecha.map((p) => (
              <PiezaChip key={p.id} pieza={p} onOpen={() => setOpenId(p.id)} roomy />
            ))}
          </div>
        </div>
      </div>

      {abierta && (
        <PiezaDrawer
          pieza={abierta}
          onChange={(patch) => patchPieza(abierta.id, patch)}
          onDelete={() => borrarPieza(abierta.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function PiezaChip({ pieza: p, onOpen, roomy }: { pieza: PiezaPlan; onOpen: () => void; roomy?: boolean }) {
  const color = CANAL_COLOR[p.canal];
  const video = tipoDePieza(p.formato) === "video";
  return (
    <button
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/pieza", p.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={onOpen}
      className={`w-full text-left rounded-[7px] bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-strong cursor-grab active:cursor-grabbing transition-colors ${roomy ? "px-2.5 py-2" : "px-1.5 py-1"}`}
      style={{ boxShadow: `inset 2px 0 0 ${color}` }}
      title={p.tema}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-[9px] shrink-0" style={{ color }} aria-hidden="true">{video ? "▶" : "▢"}</span>
        <span className="text-[10px] font-semibold truncate" style={{ color }}>{p.formato}</span>
        {p.prioridad && <span className="ml-auto text-[8.5px] font-display font-extrabold uppercase text-accent shrink-0">Prio</span>}
      </span>
      <span className={`block text-ink-soft leading-snug mt-0.5 ${roomy ? "text-[11.5px] line-clamp-2" : "text-[10.5px] line-clamp-2"}`}>{p.tema}</span>
    </button>
  );
}

function PiezaDrawer({
  pieza: p, onChange, onDelete, onClose,
}: { pieza: PiezaPlan; onChange: (patch: Partial<PiezaPlan>) => void; onDelete: () => void; onClose: () => void }) {
  const tipo = tipoDePieza(p.formato);
  const color = CANAL_COLOR[p.canal];
  const field = "w-full bg-bg border border-border-strong rounded-[var(--r-md)] px-3 py-2 text-[13px] text-ink outline-none focus:border-accent";

  return (
    <div className="fixed inset-0 z-[75] flex justify-end bg-black/50 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="w-full max-w-[460px] h-full bg-surface border-l border-border-strong flex flex-col" style={{ boxShadow: "var(--shadow-pop)" }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-[11px] font-display font-extrabold uppercase tracking-wide" style={{ color }}>
            {tipo === "video" ? "Video" : "Diseño"} · {p.canalLabel}
          </span>
          <button onClick={onClose} aria-label="Cerrar" className="ml-auto text-ink-faint hover:text-ink w-8 h-8 rounded-[var(--r-sm)] hover:bg-surface-2">✕</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
          <textarea
            value={p.tema}
            onChange={(e) => onChange({ tema: e.target.value })}
            rows={2}
            className="w-full bg-transparent text-[20px] font-display font-extrabold leading-tight tracking-tight text-ink outline-none resize-none placeholder:text-ink-faint"
            placeholder="Tema de la pieza"
          />

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha">
              <input type="date" value={p.fecha} onChange={(e) => onChange({ fecha: e.target.value })} className={field} />
            </Campo>
            <Campo label="Formato">
              <select value={p.formato} onChange={(e) => onChange({ formato: e.target.value })} className={field}>
                {FORMATOS.map((f) => <option key={f.formato}>{f.formato}</option>)}
              </select>
            </Campo>
            <Campo label="Canal">
              <select
                value={p.canal}
                onChange={(e) => {
                  const c = CANALES.find((x) => x.canal === e.target.value)!;
                  onChange({ canal: c.canal, canalLabel: c.label });
                }}
                className={field}
              >
                {CANALES.map((c) => <option key={c.canal} value={c.canal}>{c.label}</option>)}
              </select>
            </Campo>
            <Campo label="Estado">
              <select value={p.estado} onChange={(e) => onChange({ estado: e.target.value })} className={field}>
                {[...new Set([p.estado, ...ESTADOS_PIEZA])].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Campo>
            <Campo label="Pilar" wide>
              <input value={p.pilar} onChange={(e) => onChange({ pilar: e.target.value })} className={field} />
            </Campo>
          </div>

          <label className="flex items-center gap-2.5 text-[12.5px] text-ink-soft cursor-pointer select-none">
            <input type="checkbox" checked={p.prioridad} onChange={(e) => onChange({ prioridad: e.target.checked })} className="accent-[var(--accent)] w-4 h-4" />
            Prioridad — ya grabado o diseñado, sale antes que lo nuevo
          </label>

          {tipo === "diseno" ? (
            <div className="flex flex-col gap-3">
              <div className="eyebrow">Brief de diseño</div>
              {/* Preview de la placa: se lee como va a verse */}
              <div className="aspect-[4/5] max-h-[260px] rounded-[var(--r-md)] bg-bg border border-border p-5 flex flex-col justify-end overflow-hidden">
                <div className="font-display font-black uppercase text-[22px] leading-[0.95] tracking-tight text-ink break-words">
                  {p.titular || <span className="text-ink-faint">Titular</span>}
                </div>
                <div className="text-[12px] text-ink-soft mt-2 leading-snug break-words">
                  {p.subtitulo || <span className="text-ink-faint">Subtítulo</span>}
                </div>
                <div className="w-8 h-1 rounded-full mt-4" style={{ background: "var(--accent)" }} />
              </div>
              <Campo label="Titular">
                <input value={p.titular ?? ""} onChange={(e) => onChange({ titular: e.target.value })} className={field} placeholder="La frase que frena el scroll" />
              </Campo>
              <Campo label="Subtítulo">
                <textarea rows={2} value={p.subtitulo ?? ""} onChange={(e) => onChange({ subtitulo: e.target.value })} className={`${field} resize-y`} placeholder="Lo que completa o tensiona el titular" />
              </Campo>
              <Campo label="Composición">
                <textarea rows={3} value={p.composicion ?? ""} onChange={(e) => onChange({ composicion: e.target.value })} className={`${field} resize-y`} placeholder="Jerarquía, imagen, color, dónde va cada elemento" />
              </Campo>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="eyebrow">Guion de video</div>
              {([
                ["hook", "Hook", "0–3 s · lo que frena el scroll"],
                ["tension", "Tensión", "El problema o la pregunta que sostiene la atención"],
                ["transformacion", "Transformación", "El cambio, la idea o el resultado"],
                ["cta", "CTA", "Qué hace quien terminó de ver"],
              ] as const).map(([k, label, hint], i) => (
                <div key={k} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="w-6 h-6 rounded-full bg-surface-3 text-[10.5px] font-display font-extrabold flex items-center justify-center tabular" style={p[k] ? { background: "var(--accent)", color: "var(--accent-ink)" } : undefined}>
                      {i + 1}
                    </span>
                    {i < 3 && <span className="w-px flex-1 bg-border-strong mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-[12.5px] font-semibold text-ink">{label}</span>
                      <span className="text-[11px] text-ink-faint">{hint}</span>
                    </div>
                    <textarea rows={2} value={p[k] ?? ""} onChange={(e) => onChange({ [k]: e.target.value })} className={`${field} resize-y`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Campo label="Notas">
            <textarea rows={3} value={p.detalle} onChange={(e) => onChange({ detalle: e.target.value })} className={`${field} resize-y`} placeholder="Referencias, material, lo que haga falta" />
          </Campo>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <button onClick={() => { if (confirm("¿Borrar esta pieza?")) onDelete(); }} className="text-[12px] text-critical hover:underline">Borrar pieza</button>
          <button onClick={onClose} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">Listo</button>
        </div>
      </aside>
    </div>
  );
}

function Campo({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "col-span-2" : ""}`}>
      <span className="text-[11px] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
