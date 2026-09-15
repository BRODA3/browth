"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, StatCard, ProgressRow } from "./ui";
import {
  ETAPAS, FUENTES, nuevaOportunidad, moverEtapa, diasEnEtapa, metricasCrm,
  type Oportunidad, type EtapaId,
} from "@/lib/crm";

// CRM de la cuenta: pipeline por etapas que se arrastra, métricas calculadas
// desde el historial de cada oportunidad y el estado de las APIs que lo alimentan.

const fmt = (n: number) => n.toLocaleString("es-AR");

export default function Crm({ ops, onChange }: { ops: Oportunidad[]; onChange: (ops: Oportunidad[]) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<EtapaId | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const m = metricasCrm(ops);
  const editando = ops.find((o) => o.id === editId) ?? null;

  const guardar = (op: Oportunidad) => onChange(ops.map((o) => (o.id === op.id ? op : o)));
  const crear = (etapa: EtapaId) => {
    const op = nuevaOportunidad({ etapa });
    onChange([...ops, op]);
    setEditId(op.id);
  };
  const soltar = (etapa: EtapaId, id: string) => {
    const op = ops.find((o) => o.id === id);
    if (op) guardar(moverEtapa(op, etapa));
    setDragOver(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Oportunidades abiertas" value={fmt(m.abiertas)} icon="▣" />
        <StatCard label="Valor en pipeline" value={`$${fmt(m.valorPipeline)}`} icon="$" accent="var(--accent)" />
        <StatCard label="Tasa de cierre" value={m.tasaCierre == null ? "—" : m.tasaCierre} unit={m.tasaCierre == null ? undefined : "%"} icon="%" />
        <StatCard label="Ciclo de venta" value={m.cicloDias == null ? "—" : m.cicloDias} unit={m.cicloDias == null ? undefined : " días"} icon="◷" />
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 flex-wrap">
          <div>
            <h2 className="text-[17px] leading-tight m-0 normal-case tracking-tight font-display font-extrabold">Pipeline</h2>
            <p className="text-[12.5px] text-ink-faint mt-1">
              Arrastrá cada oportunidad a su etapa. {m.estancadas > 0 && <span className="text-warn">{m.estancadas} sin moverse hace más de 7 días.</span>}
            </p>
          </div>
          <button
            onClick={() => crear("nuevo")}
            className="shrink-0 bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
          >
            + Oportunidad
          </button>
        </div>

        <div className="overflow-x-auto px-5 pb-5">
          <div className="grid grid-cols-6 gap-3 min-w-[1080px]">
            {ETAPAS.map((e) => {
              const col = ops.filter((o) => o.etapa === e.id);
              const valor = col.reduce((s, o) => s + (o.valor || 0), 0);
              return (
                <div
                  key={e.id}
                  onDragOver={(ev) => { ev.preventDefault(); setDragOver(e.id); }}
                  onDragLeave={() => setDragOver((d) => (d === e.id ? null : d))}
                  onDrop={(ev) => { ev.preventDefault(); soltar(e.id, ev.dataTransfer.getData("text/oportunidad")); }}
                  className={`rounded-[var(--r-md)] border p-2 min-h-[320px] flex flex-col gap-2 transition-colors ${
                    dragOver === e.id ? "border-accent bg-accent/[0.05]" : "border-border bg-surface-2/50"
                  }`}
                >
                  <div className="px-1.5 pt-1 pb-1.5 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="font-display font-extrabold uppercase text-[10.5px] tracking-wide">{e.label}</span>
                      <span className="ml-auto tabular text-[11px] text-ink-faint">{col.length}</span>
                    </div>
                    <div className="tabular text-[11px] text-ink-faint mt-0.5">${fmt(valor)}</div>
                  </div>

                  {col.map((o) => <Tarjeta key={o.id} op={o} onOpen={() => setEditId(o.id)} />)}

                  <button
                    onClick={() => crear(e.id)}
                    className="mt-auto text-[11px] text-ink-faint hover:text-ink border border-dashed border-border-strong hover:border-accent rounded-[var(--r-sm)] py-1.5 transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        <Card>
          <CardHeader title="Conversión por etapa" sub="Qué porcentaje de las oportunidades llegó a cada etapa, según su historial." />
          {m.total === 0 ? (
            <p className="text-[12.5px] text-ink-faint italic">Todavía no hay oportunidades en esta cuenta.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {m.embudo.map((x) => {
                const et = ETAPAS.find((e) => e.id === x.etapa)!;
                return <ProgressRow key={x.etapa} label={et.label} pct={Math.round((x.cantidad / m.total) * 100)} color={et.color} meta={`${x.cantidad} de ${m.total}`} />;
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Origen de los leads" sub="Qué canal o API trajo cada oportunidad." />
          {m.porFuente.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint italic">Sin datos todavía.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {m.porFuente.map((f) => (
                <ProgressRow key={f.id} label={f.label} pct={Math.round((f.cantidad / m.total) * 100)} color={f.color} meta={`${f.cantidad} leads`} />
              ))}
            </div>
          )}
          <div className="text-[11.5px] text-ink-faint mt-5 pt-4 border-t border-border">
            Ganado total: <b className="text-ink tabular">${fmt(m.valorGanado)}</b> · {m.ganadas} {m.ganadas === 1 ? "cierre" : "cierres"}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="APIs conectadas" sub="Los mensajes que entran por estos canales crean la oportunidad sola, en la etapa Nuevo." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { nombre: "WhatsApp Business", detalle: "Cloud API · mensajes entrantes" },
            { nombre: "Instagram", detalle: "Messaging API · DMs" },
            { nombre: "Formulario web", detalle: "Leads del sitio" },
          ].map((api) => (
            <div key={api.nombre} className="border border-border rounded-[var(--r-md)] p-3.5 bg-surface-2/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[13px]">{api.nombre}</span>
                <span className="text-[9.5px] font-display font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-border-strong text-ink-faint">Sin conectar</span>
              </div>
              <div className="text-[11.5px] text-ink-faint mt-1">{api.detalle}</div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-ink-faint mt-4">
          URL del webhook para cargar en la app de Meta: <code className="text-ink-soft bg-surface-3 px-1.5 py-0.5 rounded">{origin}/api/webhooks/meta</code>
        </p>
      </Card>

      {editando && (
        <Drawer
          op={editando}
          onClose={() => setEditId(null)}
          onSave={guardar}
          onDelete={() => { onChange(ops.filter((o) => o.id !== editando.id)); setEditId(null); }}
        />
      )}
    </div>
  );
}

function Tarjeta({ op, onOpen }: { op: Oportunidad; onOpen: () => void }) {
  const fuente = FUENTES.find((f) => f.id === op.fuente)!;
  const dias = diasEnEtapa(op);
  const abierta = op.etapa !== "ganado" && op.etapa !== "perdido";
  return (
    <button
      draggable
      onDragStart={(ev) => { ev.dataTransfer.setData("text/oportunidad", op.id); ev.dataTransfer.effectAllowed = "move"; }}
      onClick={onOpen}
      className="text-left bg-surface border border-border rounded-[var(--r-sm)] p-2.5 hover:border-border-strong cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="font-semibold text-[12.5px] text-ink truncate">{op.nombre || "Sin nombre"}</div>
      {op.empresa && <div className="text-[11px] text-ink-faint truncate">{op.empresa}</div>}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded" style={{ color: fuente.color, background: `${fuente.color}1a` }}>{fuente.label}</span>
        {abierta && dias > 7 && <span className="text-[9.5px] text-warn">{dias}d</span>}
        <span className="ml-auto tabular text-[11px] font-bold">${fmt(op.valor || 0)}</span>
      </div>
    </button>
  );
}

function Drawer({ op, onClose, onSave, onDelete }: {
  op: Oportunidad; onClose: () => void; onSave: (o: Oportunidad) => void; onDelete: () => void;
}) {
  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent w-full";
  const set = <K extends keyof Oportunidad>(k: K, v: Oportunidad[K]) => onSave({ ...op, [k]: v });

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[440px] h-full bg-surface border-l border-border-strong flex flex-col" style={{ boxShadow: "var(--shadow-pop)" }}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <span className="eyebrow">Oportunidad</span>
          <button onClick={onClose} className="text-ink-faint hover:text-ink text-[18px] leading-none">×</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
          <input value={op.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre del contacto" autoFocus={!op.nombre}
            className="w-full bg-transparent border-none outline-none font-display font-extrabold text-[22px] text-ink placeholder:text-ink-faint" />

          <div className="grid grid-cols-2 gap-3">
            <Label t="Etapa">
              <select value={op.etapa} onChange={(e) => onSave(moverEtapa(op, e.target.value as EtapaId))} className={field}>
                {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </Label>
            <Label t="Origen">
              <select value={op.fuente} onChange={(e) => set("fuente", e.target.value as Oportunidad["fuente"])} className={field}>
                {FUENTES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </Label>
            <Label t="Empresa"><input value={op.empresa} onChange={(e) => set("empresa", e.target.value)} className={field} /></Label>
            <Label t="Valor ($)"><input type="number" min={0} value={op.valor || ""} onChange={(e) => set("valor", Number(e.target.value))} className={field} /></Label>
            <Label t="Teléfono"><input value={op.telefono} onChange={(e) => set("telefono", e.target.value)} className={field} /></Label>
            <Label t="Email"><input value={op.email} onChange={(e) => set("email", e.target.value)} className={field} /></Label>
          </div>
          <Label t="Responsable"><input value={op.responsable} onChange={(e) => set("responsable", e.target.value)} placeholder="Quién la lleva" className={field} /></Label>
          <Label t="Notas"><textarea value={op.nota} onChange={(e) => set("nota", e.target.value)} rows={4} className={`${field} resize-y`} /></Label>

          <div>
            <div className="eyebrow mb-2">Historial</div>
            <ol className="flex flex-col gap-1.5">
              {[...op.historial].reverse().map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ETAPAS.find((e) => e.id === h.etapa)?.color }} />
                  <span className="text-ink-soft">{ETAPAS.find((e) => e.id === h.etapa)?.label}</span>
                  <span className="ml-auto text-ink-faint tabular">{new Date(h.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          <button onClick={() => { if (confirm("¿Borrar esta oportunidad?")) onDelete(); }} className="text-[12px] text-critical hover:underline">Borrar</button>
          <button onClick={onClose} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-5 py-2.5 rounded-[var(--r-md)]">Listo</button>
        </div>
      </div>
    </div>
  );
}

function Label({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint">{t}{children}</label>;
}
