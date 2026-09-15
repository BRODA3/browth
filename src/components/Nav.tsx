"use client";

import { useState } from "react";
import type { Client } from "@/lib/data";
import { useBroda } from "./BrodaContext";

export type Mode = "broda" | "clientes";
export type View =
  | "northstar" | "businesscase" | "infra" | "estrategia" | "plan"
  | "equipo"
  | "pipeline" | "playbooks" | "agentes" | "metricas";

export const BRODA_ITEMS: { id: View; label: string }[] = [
  { id: "northstar", label: "North Star" },
  { id: "businesscase", label: "Business Case" },
  { id: "infra", label: "Infraestructura comercial" },
  { id: "estrategia", label: "Estrategia de contenido" },
  { id: "plan", label: "Plan de contenido" },
  { id: "equipo", label: "Equipo" },
];

export const CLIENTES_ITEMS: { id: View; label: string }[] = [
  { id: "pipeline", label: "Pipeline" },
  { id: "playbooks", label: "Playbooks" },
  { id: "agentes", label: "Agentes IA" },
  { id: "metricas", label: "Métricas" },
];

export function ModeSwitch({ mode, onSetMode }: { mode: Mode; onSetMode: (m: Mode) => void }) {
  const { editMode, setEditMode } = useBroda();
  return (
    <div className="sticky top-0 z-50 h-14 bg-panel border-b border-border flex items-center px-5 gap-6">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent text-accent-ink flex items-center justify-center font-display font-black text-[13px]">B</div>
        <div className="font-display font-black text-[16px] uppercase tracking-tight">
          BRODA<span className="text-accent">WORLD</span>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-panel-raised border border-border-strong rounded-full p-1">
        {(["broda", "clientes"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className={`font-display font-extrabold uppercase text-[11px] tracking-wide px-4 py-1.5 rounded-full transition-colors ${
              mode === m ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {m === "broda" ? "Broda" : "Clientes"}
          </button>
        ))}
      </div>
      {mode === "broda" && (
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 font-display font-extrabold uppercase text-[11px] tracking-wide px-3.5 py-1.5 rounded-full border transition-colors ${
            editMode ? "bg-accent text-accent-ink border-accent" : "text-ink-soft border-border-strong hover:text-ink"
          }`}
        >
          <span>✎</span> {editMode ? "Editando" : "Editar"}
        </button>
      )}
      <div className="ml-auto" />
    </div>
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
    <nav className="w-60 shrink-0 bg-panel border-r border-border px-4 py-5 flex flex-col gap-5 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSetView(it.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-md font-display font-bold text-[12.5px] uppercase w-full text-left leading-tight ${
              view === it.id ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink hover:bg-panel-raised"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-sm shrink-0 ${view === it.id ? "bg-accent-ink" : "bg-border-strong"}`} />
            {it.label}
          </button>
        ))}
      </div>

      {mode === "clientes" && (
        <div className="flex flex-col gap-1.5 pt-4 border-t border-border">
          <div className="font-display font-extrabold text-[10px] uppercase tracking-wider text-ink-faint px-1.5 mb-1">Cuentas</div>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectClient(c.id)}
              className={`flex items-center gap-2 px-2 py-2 rounded-md text-left w-full ${
                c.id === selectedClientId ? "bg-panel-raised border border-border text-ink" : "text-ink-soft border border-transparent"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.id === selectedClientId ? "bg-accent" : "bg-border-strong"}`} />
              <span className="min-w-0 flex-1">
                <div className="font-semibold text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap">{c.name}</div>
                <div className="text-[10px] text-ink-faint">{c.tier}</div>
              </span>
            </button>
          ))}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-dashed border-border-strong text-ink-faint text-[11.5px] hover:text-ink hover:border-accent">
            + Nueva cuenta
          </button>
        </div>
      )}

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
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel-raised border border-border rounded-xl p-5 w-full max-w-sm">
        <h3 className="text-base normal-case tracking-normal font-display font-bold mb-3">Nueva cuenta</h3>
        <label className="flex flex-col gap-1 text-[11px] text-ink-faint mb-2.5">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Acme Corp" className="border border-border-strong rounded-md px-2.5 py-1.5 bg-panel text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ink-faint mb-2.5">
          Industria
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej: E-commerce" className="border border-border-strong rounded-md px-2.5 py-1.5 bg-panel text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ink-faint mb-2.5">
          Tier
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="border border-border-strong rounded-md px-2.5 py-1.5 bg-panel text-ink">
            <option>Growth</option>
            <option>Enterprise</option>
            <option>Piloto</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 mt-1.5">
          <button onClick={onClose} className="text-accent font-display font-extrabold uppercase text-xs px-3.5 py-2">Cancelar</button>
          <button onClick={() => name.trim() && onCreate(name.trim(), tier, industry.trim())} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-xs px-3.5 py-2 rounded-md">Crear</button>
        </div>
      </div>
    </div>
  );
}
