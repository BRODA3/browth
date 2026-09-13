"use client";

import { AGENTS, ROLES, STAGES, TASKS, type StageId } from "@/lib/data";

const STAGE_ROLE: Record<StageId, string[]> = {
  get: ["sdr", "content"],
  convert: ["closer"],
  keep: ["success"],
  grow: ["success", "content"],
};

function agentsFor(stage: StageId) {
  return AGENTS.filter((a) => a.stage === stage);
}

export default function OrgChart() {
  return (
    <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-6 overflow-x-auto">
      <div className="min-w-[880px] flex flex-col items-center">
        {/* Nivel 0 — estudio */}
        <Node title="Broda Studio" subtitle="Growth Lead · dueño del funnel completo" tone="accent" />
        <Stem />
        <div className="w-full h-px bg-border-strong" />

        {/* Nivel 1 — los 4 motores */}
        <div className="w-full grid grid-cols-4 gap-4 pt-0">
          {STAGES.map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <Stem />
              <Node title={s.name} subtitle={s.subtitle} color={s.color} />
              <Stem />

              {/* roles humanos dueños de esta etapa */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                {STAGE_ROLE[s.id].map((rid) => {
                  const r = ROLES.find((x) => x.id === rid)!;
                  return (
                    <span key={rid} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-panel border border-border-strong text-ink-soft">
                      {r.name}
                    </span>
                  );
                })}
              </div>
              <Stem short />

              {/* agentes de IA de esta etapa */}
              <div className="w-full flex flex-col gap-1.5">
                {agentsFor(s.id).map((a) => {
                  const taskCount = TASKS.filter((t) => t.stage === s.id && t.agent === a.id).length;
                  return (
                    <div key={a.id} className="flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md border" style={{ borderColor: `${s.color}33`, background: `${s.color}0d` }}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.live ? "bg-good" : "bg-ink-faint"}`}
                        style={a.live ? { boxShadow: "0 0 6px var(--good)" } : undefined}
                      />
                      <span className="flex-1 text-ink-soft leading-tight">{a.name}</span>
                      {taskCount > 0 && <span className="text-[9px] text-ink-faint tabular">×{taskCount}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border text-[10.5px] text-ink-faint">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-good" style={{ boxShadow: "0 0 6px var(--good)" }} /> Agente vivo (API real)</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ink-faint" /> Entrenado (prompt listo, sin ejecutar)</span>
      </div>
    </div>
  );
}

function Node({ title, subtitle, color, tone }: { title: string; subtitle: string; color?: string; tone?: "accent" }) {
  return (
    <div
      className="rounded-lg border px-4 py-2.5 text-center min-w-[160px]"
      style={{
        borderColor: tone === "accent" ? "var(--accent)" : color || "var(--border-strong)",
        background: tone === "accent" ? "var(--accent)" : "var(--panel)",
      }}
    >
      <div className="font-display font-extrabold text-sm uppercase tracking-tight" style={{ color: tone === "accent" ? "var(--accent-ink)" : color || "var(--ink)" }}>
        {title}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: tone === "accent" ? "var(--accent-ink)" : "var(--ink-faint)", opacity: tone === "accent" ? 0.75 : 1 }}>
        {subtitle}
      </div>
    </div>
  );
}

function Stem({ short }: { short?: boolean }) {
  return <div className={`w-px bg-border-strong ${short ? "h-2" : "h-4"}`} />;
}
