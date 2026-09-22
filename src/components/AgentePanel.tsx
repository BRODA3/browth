"use client";

import { pedir } from "@/lib/api";

import { useState } from "react";
import { AGENT_STATUS_OPTIONS, type AgentStatusValue } from "@/lib/data";
import { DEPARTAMENTOS, deptoDe, type AgenteConfig, type DeptoId } from "@/lib/agentes";

// Todo lo que conlleva un agente, en el costado: qué hace, cuándo se activa,
// con qué trabaja, qué nunca debe hacer, a quién le deriva, cómo viene
// funcionando, su system prompt y una prueba en vivo con el brain de la cuenta.

export default function AgentePanel({
  agente, agentes, cerebro, cuenta, onChange, onClose, onDuplicar, onBorrar,
}: {
  agente: AgenteConfig;
  agentes: AgenteConfig[];
  cerebro: string;
  cuenta: string;
  onChange: (a: AgenteConfig) => void;
  onClose: () => void;
  onDuplicar: () => void;
  onBorrar: () => void;
}) {
  const [verPrompt, setVerPrompt] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [probando, setProbando] = useState(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [herramienta, setHerramienta] = useState("");

  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent w-full";
  const set = <K extends keyof AgenteConfig>(k: K, v: AgenteConfig[K]) => onChange({ ...agente, [k]: v });
  const depto = deptoDe(agente.departamento);
  const resolucion = agente.ejecuciones > 0 ? Math.round((agente.resueltas / agente.ejecuciones) * 100) : null;
  const esOrquestadora = agente.departamento === "direccion";

  async function probar() {
    if (!mensaje.trim() || probando) return;
    setProbando(true); setError(null); setRespuesta(null);
    try {
      const res = await pedir("/api/agents/probar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: agente.prompt, limites: agente.limites, cerebro, cuenta, mensaje }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo probar");
      setRespuesta(json.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error probando el agente");
    } finally {
      setProbando(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0" style={{ background: `${depto.color}10` }}>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-[14px] shrink-0"
          style={{ border: `1.5px solid ${depto.color}`, color: depto.color }}
        >
          {agente.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[9.5px] font-display font-extrabold uppercase tracking-wider" style={{ color: depto.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: depto.color }} />
            {depto.nombre}
          </div>
          <div className="text-[11px] text-ink-faint truncate">Dueño: {depto.dueno}</div>
        </div>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-[18px] leading-none px-1">×</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
        <div>
          <input
            value={agente.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className="w-full bg-transparent border-none outline-none font-display font-extrabold text-[20px] text-ink"
          />
          <input
            value={agente.rol}
            onChange={(e) => set("rol", e.target.value)}
            placeholder="Qué hace, en una línea"
            className="w-full bg-transparent border-none outline-none text-[13px] text-ink-soft mt-0.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo t="Departamento">
            <select
              value={agente.departamento}
              disabled={esOrquestadora}
              onChange={(e) => set("departamento", e.target.value as DeptoId)}
              className={`${field} disabled:opacity-60`}
            >
              {DEPARTAMENTOS.filter((d) => esOrquestadora || d.id !== "direccion").map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo t="Estado">
            <select value={agente.estado} onChange={(e) => set("estado", e.target.value as AgentStatusValue)} className={field}>
              {AGENT_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Campo>
        </div>

        <Campo t={`Autonomía · ${agente.autonomia}%`}>
          <input type="range" min={0} max={100} value={agente.autonomia} onChange={(e) => set("autonomia", Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </Campo>

        <Seccion titulo="System prompt">
          <button onClick={() => setVerPrompt((v) => !v)} className="text-[10.5px] font-display font-extrabold uppercase tracking-wide text-accent self-start">
            {verPrompt ? "Ocultar" : "Ver y editar"} {verPrompt ? "▲" : "▼"}
          </button>
          {verPrompt && (
            <textarea
              value={agente.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              rows={16}
              placeholder="Qué es el agente, cómo responde, qué formato entrega y qué nunca hace."
              className={`${field} resize-y text-[12px] leading-relaxed font-mono`}
            />
          )}
          <span className="text-[10.5px] text-ink-faint">{agente.prompt.length.toLocaleString("es-AR")} caracteres</span>
        </Seccion>

        <Seccion titulo="Comportamiento">
          <Campo t="Se activa cuando">
            <textarea value={agente.disparador} onChange={(e) => set("disparador", e.target.value)} rows={2} className={`${field} resize-y`} />
          </Campo>
          <Campo t="Trabaja con">
            <textarea value={agente.entrada} onChange={(e) => set("entrada", e.target.value)} rows={2} className={`${field} resize-y`} />
          </Campo>
          <Campo t="Entrega">
            <textarea value={agente.salida} onChange={(e) => set("salida", e.target.value)} rows={2} className={`${field} resize-y`} />
          </Campo>
          <Campo t="Nunca debe">
            <textarea value={agente.limites} onChange={(e) => set("limites", e.target.value)} rows={2} className={`${field} resize-y`} />
          </Campo>
        </Seccion>

        <Seccion titulo="Herramientas que puede usar">
          {agente.herramientas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agente.herramientas.map((h, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-border-strong text-ink-soft">
                  {h}
                  <button onClick={() => set("herramientas", agente.herramientas.filter((_, j) => j !== i))} className="text-ink-faint hover:text-critical">×</button>
                </span>
              ))}
            </div>
          )}
          <input
            value={herramienta}
            onChange={(e) => setHerramienta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && herramienta.trim()) {
                set("herramientas", [...agente.herramientas, herramienta.trim()]);
                setHerramienta("");
              }
            }}
            placeholder="Sumá una y apretá Enter"
            className={field}
          />
        </Seccion>

        <Seccion titulo={esOrquestadora ? "Coordina a" : "Le deriva a"}>
          <div className="flex flex-col gap-1.5">
            {agente.conexiones.length === 0 && <p className="text-[11.5px] text-ink-faint">Ninguno todavía.</p>}
            {agente.conexiones.map((id) => {
              const otro = agentes.find((a) => a.id === id);
              if (!otro) return null;
              const d = deptoDe(otro.departamento);
              return (
                <div key={id} className="flex items-center gap-2 text-[12px] text-ink-soft">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="truncate">{otro.nombre}</span>
                  <span className="text-[10.5px] text-ink-faint truncate">· {d.nombre}</span>
                  <button onClick={() => set("conexiones", agente.conexiones.filter((c) => c !== id))} className="ml-auto text-ink-faint hover:text-critical text-[11px] shrink-0">Quitar</button>
                </div>
              );
            })}
            <select
              value=""
              onChange={(e) => e.target.value && set("conexiones", [...agente.conexiones, e.target.value])}
              className={`${field} mt-1`}
            >
              <option value="">+ Derivar a otro agente…</option>
              {agentes.filter((a) => a.id !== agente.id && !agente.conexiones.includes(a.id)).map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} · {deptoDe(a.departamento).nombre}</option>
              ))}
            </select>
          </div>
        </Seccion>

        <Seccion titulo="Cómo viene funcionando">
          <div className="grid grid-cols-3 gap-2">
            <Campo t="Ejecuciones">
              <input type="number" min={0} value={agente.ejecuciones} onChange={(e) => set("ejecuciones", Number(e.target.value))} className={field} />
            </Campo>
            <Campo t="Resueltas solo">
              <input type="number" min={0} value={agente.resueltas} onChange={(e) => set("resueltas", Number(e.target.value))} className={field} />
            </Campo>
            <Campo t="Escaladas">
              <input type="number" min={0} value={agente.escaladas} onChange={(e) => set("escaladas", Number(e.target.value))} className={field} />
            </Campo>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] flex-wrap">
            <span className="text-ink-faint">Resolución sin humano:</span>
            <span className="tabular font-bold" style={{ color: resolucion != null && resolucion >= 70 ? "var(--good)" : "var(--ink-soft)" }}>
              {resolucion != null ? `${resolucion}%` : "sin datos"}
            </span>
            <span className="text-ink-faint ml-auto">Responde en</span>
            <input type="number" min={0} value={agente.resp} onChange={(e) => set("resp", Number(e.target.value))} className="w-16 border border-border-strong rounded-[var(--r-sm)] bg-bg text-ink px-2 py-1 text-[12px]" />
            <span className="text-ink-faint">min</span>
          </div>
        </Seccion>

        <Seccion titulo="Probarlo ahora">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            placeholder={esOrquestadora ? "Ej: entró un lead por WhatsApp preguntando precio de un flete a Rosario" : "Escribí lo que le llegaría: un mensaje, una consulta, un dato…"}
            className={`${field} resize-y`}
          />
          <button
            onClick={probar}
            disabled={probando}
            className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)] disabled:opacity-50 self-start"
          >
            {probando ? "Probando…" : "Probar agente"}
          </button>
          {error && <div className="text-[11.5px] text-critical bg-critical/10 border border-critical/30 rounded-[var(--r-md)] p-2.5">{error}</div>}
          {respuesta && (
            <div className="text-[12.5px] text-ink-soft bg-surface-2 border border-border rounded-[var(--r-md)] p-3 whitespace-pre-wrap leading-relaxed">{respuesta}</div>
          )}
        </Seccion>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button onClick={onDuplicar} className="text-[12px] text-ink-soft hover:text-ink">Duplicar</button>
          {!esOrquestadora && (
            <button onClick={() => { if (confirm(`¿Borrar "${agente.nombre}"?`)) onBorrar(); }} className="text-[12px] text-critical hover:underline">
              Borrar agente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-border">
      <div className="eyebrow">{titulo}</div>
      {children}
    </div>
  );
}

function Campo({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint">{t}{children}</label>;
}
