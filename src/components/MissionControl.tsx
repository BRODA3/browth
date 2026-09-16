"use client";

import { DEPARTAMENTOS, deptoDe, type AgenteConfig } from "@/lib/agentes";

// Mission Control: los datos de la red. Cuántos agentes trabajan, cuánto
// resuelven solos, en qué estado está cada uno y qué hay que construir primero.
// Hoy los números salen de la configuración de cada agente; conectados, se
// llenan solos con cada ejecución.

const COLUMNAS: { estado: AgenteConfig["estado"]; titulo: string; sub: string; color: string }[] = [
  { estado: "No construido", titulo: "Por construir", sub: "Definidos, sin armar", color: "var(--ink-faint)" },
  { estado: "En construcción", titulo: "En construcción", sub: "Prompt y pruebas", color: "var(--warn)" },
  { estado: "Activo", titulo: "Activos", sub: "Trabajando en la cuenta", color: "var(--good)" },
  { estado: "Pausado", titulo: "Pausados", sub: "Frenados para revisar", color: "var(--critical)" },
];

/** El orden en que se construyen: primero lo que hoy hace perder ventas. */
const PRIORIDAD: { id: string; porque: string }[] = [
  { id: "inbound-qualifier", porque: "Hoy la calificación es manual y colapsa a los 30 chats." },
  { id: "followup-nurture", porque: "La mayoría de las ventas se cierran en el seguimiento." },
  { id: "precall-briefer", porque: "Que ninguna reunión arranque de cero." },
  { id: "ads-optimizer", porque: "Apagar a tiempo lo que no convierte." },
  { id: "reporting-agent", porque: "Que los números del viernes se armen solos." },
];

export default function MissionControl({ agentes, onAbrir }: { agentes: AgenteConfig[]; onAbrir: (id: string) => void }) {
  const total = agentes.length;
  const activos = agentes.filter((a) => a.estado === "Activo").length;
  const construccion = agentes.filter((a) => a.estado === "En construcción").length;
  const ejecuciones = agentes.reduce((s, a) => s + a.ejecuciones, 0);
  const resueltas = agentes.reduce((s, a) => s + a.resueltas, 0);
  const escaladas = agentes.reduce((s, a) => s + a.escaladas, 0);
  const resolucion = ejecuciones > 0 ? Math.round((resueltas / ejecuciones) * 100) : null;
  const salud = total > 0 ? Math.round(((activos + construccion * 0.5) / total) * 100) : 0;

  return (
    <div className="absolute inset-0 overflow-y-auto p-5 pb-24 flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <Kpi label="Agentes activos" valor={`${activos}/${total}`} color="var(--good)" />
        <Kpi label="En construcción" valor={String(construccion)} color="var(--warn)" />
        <Kpi label="Ejecuciones" valor={ejecuciones.toLocaleString("es-AR")} sub={escaladas > 0 ? `${escaladas} escaladas a una persona` : undefined} />
        <Kpi label="Resuelto sin humano" valor={resolucion != null ? `${resolucion}%` : "—"} color="var(--accent)" sub={resolucion == null ? "Sin ejecuciones todavía" : undefined} />
      </div>

      <div className="grid grid-cols-1 min-[1500px]:grid-cols-[1fr_320px] gap-4">
        {/* Kanban de la red */}
        <div className="rounded-[var(--r-lg)] border border-border bg-[#0d0d0d]">
          <div className="flex items-baseline justify-between px-4 pt-4 pb-3">
            <div>
              <div className="eyebrow">Carga de trabajo</div>
              <div className="text-[12px] text-ink-faint mt-0.5">Cada agente, según en qué punto está.</div>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 px-4 pb-4">
            {COLUMNAS.map((col) => {
              const suyos = agentes.filter((a) => a.estado === col.estado);
              return (
                <div key={col.estado} className="rounded-[var(--r-md)] border border-border bg-[#0a0a0a] p-2.5 min-h-[180px]">
                  <div className="flex items-center gap-2 px-1 pb-2 mb-2 border-b border-border">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <div className="min-w-0">
                      <div className="text-[11px] font-display font-extrabold uppercase tracking-wide">{col.titulo}</div>
                      <div className="text-[10px] text-ink-faint">{col.sub}</div>
                    </div>
                    <span className="ml-auto tabular text-[11px] text-ink-faint">{suyos.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {suyos.map((a) => {
                      const d = deptoDe(a.departamento);
                      return (
                        <button
                          key={a.id}
                          onClick={() => onAbrir(a.id)}
                          className="text-left rounded-[var(--r-sm)] border border-border bg-[#101010] p-2.5 hover:border-border-strong transition-colors"
                          style={{ borderLeft: `2px solid ${d.color}` }}
                        >
                          <div className="text-[8.5px] font-display font-extrabold uppercase tracking-wider truncate" style={{ color: d.color }}>
                            {d.nombre}
                          </div>
                          <div className="text-[12px] font-semibold leading-snug truncate">{a.nombre}</div>
                          <div className="text-[10px] text-ink-faint truncate">{a.rol}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {a.herramientas.slice(0, 2).map((h, i) => (
                              <span key={i} className="text-[8.5px] px-1.5 py-0.5 rounded border border-border-strong text-ink-faint truncate max-w-[88px]">{h}</span>
                            ))}
                            <span className="ml-auto text-[9.5px] text-ink-faint shrink-0">{d.dueno}</span>
                          </div>
                        </button>
                      );
                    })}
                    {suyos.length === 0 && <div className="text-[11px] text-ink-faint italic px-1">Ninguno</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Salud y departamentos */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--r-lg)] border border-border bg-[#0d0d0d] p-4 flex items-center gap-4">
            <Anillo valor={salud} />
            <div>
              <div className="eyebrow">Salud de la red</div>
              <p className="text-[12px] text-ink-faint mt-1 leading-snug">
                Qué parte de la red ya está trabajando. Los agentes en construcción cuentan la mitad.
              </p>
            </div>
          </div>

          <div className="rounded-[var(--r-lg)] border border-border bg-[#0d0d0d] p-4">
            <div className="eyebrow mb-3">Departamentos</div>
            <div className="flex flex-col gap-3">
              {DEPARTAMENTOS.map((d) => {
                const suyos = agentes.filter((a) => a.departamento === d.id);
                const act = suyos.filter((a) => a.estado === "Activo").length;
                const pct = suyos.length ? (act / suyos.length) * 100 : 0;
                return (
                  <div key={d.id}>
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="font-semibold truncate">{d.nombre}</span>
                      <span className="ml-auto text-[10.5px] text-ink-faint shrink-0">{d.dueno}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: d.color }} />
                      </div>
                      <span className="tabular text-[10.5px] text-ink-faint w-9 text-right">{act}/{suyos.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Qué construir primero */}
      <div className="rounded-[var(--r-lg)] border border-border bg-[#0d0d0d] p-4">
        <div className="eyebrow">Orden de construcción</div>
        <div className="text-[12px] text-ink-faint mt-0.5 mb-3">Primero lo que hoy hace perder ventas. Uno por vez: no se arranca el siguiente hasta que el anterior esté activo.</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {PRIORIDAD.map((p, i) => {
            const a = agentes.find((x) => x.id === p.id);
            if (!a) return null;
            const d = deptoDe(a.departamento);
            const col = COLUMNAS.find((c) => c.estado === a.estado)!;
            return (
              <button key={p.id} onClick={() => onAbrir(a.id)} className="text-left rounded-[var(--r-md)] border border-border bg-[#101010] p-3 hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <span className="tabular font-display font-black text-[18px]" style={{ color: d.color }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="ml-auto flex items-center gap-1 text-[9.5px] text-ink-faint">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                    {col.titulo}
                  </span>
                </div>
                <div className="text-[13px] font-semibold mt-1.5 leading-snug">{a.nombre}</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: d.color }}>{d.dueno}</div>
                <p className="text-[11px] text-ink-faint mt-1.5 leading-snug">{p.porque}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, valor, color, sub }: { label: string; valor: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-border bg-[#0d0d0d] p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="tabular font-extrabold text-[28px] leading-none mt-2" style={color ? { color } : undefined}>{valor}</div>
      {sub && <div className="text-[10.5px] text-ink-faint mt-1.5">{sub}</div>}
    </div>
  );
}

function Anillo({ valor }: { valor: number }) {
  const r = 30, c = 2 * Math.PI * r;
  const color = valor >= 70 ? "var(--good)" : valor >= 30 ? "var(--warn)" : "var(--critical)";
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
      <circle
        cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(valor / 100) * c} ${c}`} transform="rotate(-90 38 38)"
      />
      <text x="38" y="42" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--ink)" className="tabular">{valor}</text>
    </svg>
  );
}
