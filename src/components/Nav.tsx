"use client";

import { useState } from "react";
import type { Client } from "@/lib/data";
import { useBroda } from "./BrodaContext";

export type Mode = "broda" | "clientes";
export type View =
  | "planmes" | "northstar" | "businesscase" | "infra" | "estrategia" | "plan"
  | "equipo" | "brains" | "prompts"
  | "pipeline" | "crm" | "prospeccion" | "workflows" | "playbooks" | "agentes" | "metricas";

export const BRODA_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "planmes", label: "Plan del mes", icon: "✓" },
  { id: "northstar", label: "North Star", icon: "◎" },
  { id: "businesscase", label: "Business Case", icon: "▤" },
  { id: "infra", label: "Infraestructura", icon: "⧗" },
  { id: "estrategia", label: "Estrategia", icon: "◈" },
  { id: "plan", label: "Plan de contenido", icon: "▦" },
  { id: "equipo", label: "Equipo", icon: "◍" },
  { id: "brains", label: "Brains", icon: "◉" },
  { id: "prompts", label: "Prompts", icon: "❝" },
];

export const CLIENTES_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "pipeline", label: "Pipeline", icon: "⧗" },
  { id: "crm", label: "CRM", icon: "▣" },
  { id: "prospeccion", label: "Prospección", icon: "⌖" },
  { id: "brains", label: "Brains", icon: "◉" },
  { id: "workflows", label: "Workflows", icon: "⑃" },
  { id: "playbooks", label: "Playbooks", icon: "▤" },
  { id: "agentes", label: "Agentes IA", icon: "◈" },
  { id: "metricas", label: "Métricas", icon: "▥" },
];

export const VIEW_LABEL: Record<View, string> = {
  planmes: "Plan del mes", northstar: "North Star", businesscase: "Business Case", infra: "Infraestructura comercial",
  estrategia: "Estrategia de contenido", plan: "Plan de contenido", equipo: "Equipo", brains: "Brains", prompts: "Banco de prompts",
  pipeline: "Pipeline", crm: "CRM", prospeccion: "Prospección y competencia", workflows: "Workflows", playbooks: "Playbooks", agentes: "Agentes IA", metricas: "Métricas",
};

export function TopBar({
  mode, onSetMode, view,
}: { mode: Mode; onSetMode: (m: Mode) => void; view: View }) {
  const { editMode, setEditMode } = useBroda();
  return (
    <header className="sticky top-0 z-50 h-16 bg-bg/85 backdrop-blur-xl border-b border-border flex items-center px-5 gap-5">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-[var(--r-sm)] bg-accent text-accent-ink flex items-center justify-center font-display font-black text-[14px]">B</div>
        <div className="font-display font-black text-[15px] uppercase tracking-tight leading-none">
          BRODA<span className="text-accent">WORLD</span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 shrink-0">
        {(["broda", "clientes"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className={`font-display font-extrabold uppercase text-[10.5px] tracking-wide px-4 py-1.5 rounded-full transition-colors ${
              mode === m ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {m === "broda" ? "Broda" : "Clientes"}
          </button>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2 text-[12.5px] text-ink-faint min-w-0">
        <span className="truncate">{mode === "broda" ? "Broda" : "Clientes"}</span>
        <span className="opacity-40">/</span>
        <span className="text-ink truncate">{VIEW_LABEL[view]}</span>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {mode === "broda" && (
          <button
            onClick={() => setEditMode(!editMode)}
            title="Editar el contenido en la página"
            className={`flex items-center gap-1.5 font-display font-extrabold uppercase text-[10.5px] tracking-wide px-3.5 py-2 rounded-full border transition-colors ${
              editMode ? "bg-accent text-accent-ink border-accent" : "text-ink-soft border-border-strong hover:text-ink hover:border-ink-faint"
            }`}
          >
            ✎ {editMode ? "Editando" : "Editar"}
          </button>
        )}
      </div>
    </header>
  );
}

export function SideNav({
  mode, view, onSetView, clients, selectedClientId, onSelectClient, onAddClient,
}: {
  mode: Mode; view: View; onSetView: (v: View) => void;
  clients: Client[]; selectedClientId: string; onSelectClient: (id: string) => void;
  onAddClient: (name: string, tier: string, industry: string) => void;
}) {
  const items = mode === "broda" ? BRODA_ITEMS : CLIENTES_ITEMS;
  const [showModal, setShowModal] = useState(false);

  return (
    <nav className="w-[236px] shrink-0 px-3 py-5 flex flex-col gap-6 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto border-r border-border">
      <div className="flex flex-col gap-1">
        <div className="eyebrow px-2.5 mb-1.5">{mode === "broda" ? "El negocio" : "Operación"}</div>
        {items.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onSetView(it.id)}
              className={`flex items-center gap-2.5 px-2.5 h-9 rounded-[var(--r-md)] text-[13px] font-semibold w-full text-left transition-colors ${
                active ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              <span className={`w-5 h-5 rounded-[6px] flex items-center justify-center text-[11px] shrink-0 ${active ? "bg-accent-ink/15" : "bg-surface-2"}`}>{it.icon}</span>
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </div>

      {mode === "clientes" && (
        <div className="flex flex-col gap-1">
          <div className="eyebrow px-2.5 mb-1.5">Cuentas</div>
          {clients.map((c) => {
            const active = c.id === selectedClientId;
            return (
              <button
                key={c.id}
                onClick={() => onSelectClient(c.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--r-md)] text-left w-full transition-colors ${
                  active ? "bg-surface border border-border" : "border border-transparent hover:bg-surface/60"
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-display font-black text-[11px]"
                  style={{ background: active ? "var(--accent)" : "var(--surface-3)", color: active ? "var(--accent-ink)" : "var(--ink-soft)" }}
                >
                  {c.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold text-[12.5px] truncate ${active ? "text-ink" : "text-ink-soft"}`}>{c.name}</span>
                  <span className="block text-[10.5px] text-ink-faint">{c.tier}</span>
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-2.5 h-9 rounded-[var(--r-md)] border border-dashed border-border-strong text-ink-faint text-[12px] hover:text-ink hover:border-accent transition-colors mt-1"
          >
            <span className="text-[13px]">+</span> Nueva cuenta
          </button>
        </div>
      )}

      <div className="mt-auto px-2.5 text-[10.5px] text-ink-faint leading-relaxed">
        Modo local · los cambios se guardan en este navegador
      </div>

      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} onCreate={(n, t, i) => { onAddClient(n, t, i); setShowModal(false); }} />
      )}
    </nav>
  );
}

function AddClientModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, tier: string, industry: string) => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tier, setTier] = useState("Growth");
  const field = "border border-border-strong rounded-[var(--r-md)] px-3 py-2 bg-bg text-ink text-[13px] outline-none focus:border-accent";
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[80] p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border-strong rounded-[var(--r-xl)] p-6 w-full max-w-sm" style={{ boxShadow: "var(--shadow-pop)" }}>
        <h3 className="text-[17px] normal-case tracking-tight font-display font-extrabold mb-4">Nueva cuenta</h3>
        <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint mb-3">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Acme Corp" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint mb-3">
          Industria
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej: E-commerce" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] text-ink-faint mb-5">
          Tier
          <select value={tier} onChange={(e) => setTier(e.target.value)} className={field}>
            <option>Growth</option>
            <option>Enterprise</option>
            <option>Piloto</option>
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-ink-soft hover:text-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5">Cancelar</button>
          <button
            onClick={() => name.trim() && onCreate(name.trim(), tier, industry.trim())}
            className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
