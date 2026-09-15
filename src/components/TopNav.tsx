"use client";

export type View =
  | "northstar" | "businesscase" | "infra"
  | "pipeline" | "equipo" | "playbooks" | "agentes" | "metricas";

const ITEMS: { id: View; label: string }[] = [
  { id: "northstar", label: "North Star" },
  { id: "businesscase", label: "Business Case" },
  { id: "infra", label: "Infraestructura" },
  { id: "pipeline", label: "Pipeline" },
  { id: "equipo", label: "Equipo" },
  { id: "playbooks", label: "Playbooks" },
  { id: "agentes", label: "Agentes IA" },
  { id: "metricas", label: "Métricas" },
];

export default function TopNav({ view, onSetView }: { view: View; onSetView: (v: View) => void }) {
  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-3">
      <nav className="flex items-center gap-1 bg-panel-raised/90 backdrop-blur border border-border-strong rounded-full pl-1.5 pr-2 py-1.5 shadow-lg max-w-full overflow-x-auto">
        <div className="w-7 h-7 rounded-full bg-accent text-accent-ink flex items-center justify-center font-display font-black text-[13px] shrink-0 mr-1">B</div>
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => onSetView(it.id)}
            className={`shrink-0 font-display font-extrabold uppercase text-[11px] tracking-tight px-3 py-1.5 rounded-full transition-colors ${
              view === it.id ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
