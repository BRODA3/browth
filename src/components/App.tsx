"use client";

import { useEffect, useMemo, useState } from "react";
import FunnelChart from "./FunnelChart";
import OrgChart from "./OrgChart";
import InfraFunnel from "./InfraFunnel";
import NorthStar from "./NorthStar";
import BusinessCase from "./BusinessCase";
import TopNav, { type View } from "./TopNav";
import { EQUIPO_BRODA, BRODAWEEK } from "@/lib/broda";
import {
  STAGES, TASKS, AGENTS, ROLES, COVERAGE, EXPERIMENTS, STACK, FUNNEL_ZONES,
  STATUS_OPTIONS, AGENT_STATUS_OPTIONS, KPI_FIELDS,
  SEED_CLIENTS, SEED_TASK_STATUS, SEED_AGENT_STATUS, SEED_KPIS,
  stageOf, agentOf, zoneOf, tasksForZone, tasksForStage,
  type Client, type KpiRow, type StageId, type TaskStatus, type AgentStatusValue,
} from "@/lib/data";

const CLIENT_SCOPED = new Set<View>(["pipeline", "agentes", "metricas"]);

function fmt(v: number | null | undefined) {
  return v == null ? "—" : v.toLocaleString("es-AR");
}

const STORAGE_KEY = "browth:v1";

function loadPersisted<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const all = JSON.parse(raw);
    return all ?? fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const persisted = useMemo(() => loadPersisted<{
    clients?: Client[];
    taskStatusByClient?: Record<string, Record<string, TaskStatus>>;
    agentStatusByClient?: Record<string, Record<string, { status: AgentStatusValue; autonomy: number; resp: number }>>;
    kpisByClient?: Record<string, KpiRow[]>;
  }>({}), []);

  const [clients, setClients] = useState<Client[]>(persisted.clients?.length ? persisted.clients : SEED_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>((persisted.clients?.length ? persisted.clients : SEED_CLIENTS)[0].id);
  const [view, setView] = useState<View>("northstar");
  const [openZone, setOpenZone] = useState<string | null>(null);
  const [playbookFilter, setPlaybookFilter] = useState<StageId | null>(null);
  const [agentFilter, setAgentFilter] = useState<StageId | null>(null);
  const [kpiMetric, setKpiMetric] = useState<string>("revenue");

  const [taskStatusByClient, setTaskStatusByClient] = useState<Record<string, Record<string, TaskStatus>>>(
    () => persisted.taskStatusByClient ?? Object.fromEntries(Object.entries(SEED_TASK_STATUS))
  );
  const [agentStatusByClient, setAgentStatusByClient] = useState(
    () => persisted.agentStatusByClient ?? Object.fromEntries(Object.entries(SEED_AGENT_STATUS))
  );
  const [kpisByClient, setKpisByClient] = useState<Record<string, KpiRow[]>>(
    () => persisted.kpisByClient ?? Object.fromEntries(Object.entries(SEED_KPIS))
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, taskStatusByClient, agentStatusByClient, kpisByClient }));
    } catch {
      // localStorage no disponible (modo privado, cuota llena) — la app sigue funcionando en memoria.
    }
  }, [clients, taskStatusByClient, agentStatusByClient, kpisByClient]);

  const client = clients.find((c) => c.id === selectedClientId)!;
  const taskStatus = taskStatusByClient[selectedClientId] || {};
  const agentStatus = agentStatusByClient[selectedClientId] || {};
  const kpis = kpisByClient[selectedClientId] || [];
  const latest = kpis[kpis.length - 1] ?? null;
  const prev = kpis.length > 1 ? kpis[kpis.length - 2] : null;

  function setTaskStatus(taskId: string, status: TaskStatus) {
    setTaskStatusByClient((prevState) => ({
      ...prevState,
      [selectedClientId]: { ...(prevState[selectedClientId] || {}), [taskId]: status },
    }));
  }

  function setAgentField(agentId: string, field: "status" | "autonomy" | "resp", value: string | number) {
    setAgentStatusByClient((prevState) => {
      const current = prevState[selectedClientId] || {};
      const entry = current[agentId] || { status: "No construido" as AgentStatusValue, autonomy: 0, resp: 0 };
      return {
        ...prevState,
        [selectedClientId]: { ...current, [agentId]: { ...entry, [field]: value } },
      };
    });
  }

  function addClient(name: string, tier: string, industry: string) {
    const id = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `cliente-${Date.now()}`;
    setClients((c) => [...c, { id, name, tier, industry, owners: { growth: "", sales: "", success: "" } }]);
    setSelectedClientId(id);
  }

  function taskCompletion(tasks: { id: string }[]) {
    const done = tasks.filter((t) => taskStatus[t.id] === "Hecho").length;
    return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }

  function agentAdoptionByStage(stageId: StageId) {
    const ids = [...new Set(TASKS.filter((t) => t.stage === stageId && t.agent).map((t) => t.agent!))];
    const active = ids.filter((id) => agentStatus[id]?.status === "Activo").length;
    return { active, total: ids.length };
  }

  const zoneCompletions = useMemo(() => {
    const map: Record<string, { pct: number; done: number; total: number }> = {};
    FUNNEL_ZONES.forEach((z) => { map[z.id] = taskCompletion(tasksForZone(z)); });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus]);

  const scoped = CLIENT_SCOPED.has(view);

  return (
    <div className="min-h-screen">
      <TopNav view={view} onSetView={setView} />
      <div className={scoped ? "grid grid-cols-[240px_1fr]" : "grid grid-cols-1"}>
        {scoped && (
          <ClientRail
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={(id) => { setSelectedClientId(id); setOpenZone(null); }}
            onAddClient={addClient}
          />
        )}
        <main className={`px-8 pt-24 pb-16 ${scoped ? "max-w-[1180px]" : "max-w-[900px] mx-auto"}`}>
          {scoped && (
            <div className="flex items-baseline justify-between flex-wrap gap-2.5 mb-6">
              <div>
                <h1 className="text-3xl m-0">{client.name}</h1>
                <div className="text-ink-soft text-[13px]">{client.industry}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-display text-[10px] font-extrabold uppercase tracking-wider border border-border-strong text-ink-soft">
                {client.tier}
              </span>
            </div>
          )}
          {!scoped && <NavHeader view={view} />}

          {view === "northstar" && <NorthStar />}
          {view === "businesscase" && <BusinessCase />}
          {view === "infra" && <InfraFunnel />}
          {view === "pipeline" && (
            <Pipeline
              zoneCompletions={zoneCompletions}
              openZone={openZone}
              setOpenZone={setOpenZone}
              taskStatus={taskStatus}
              setTaskStatus={setTaskStatus}
              agentAdoptionByStage={agentAdoptionByStage}
              taskCompletion={taskCompletion}
              latest={latest}
              onJumpToAgent={(stage) => { setView("agentes"); setAgentFilter(stage); }}
            />
          )}
          {view === "equipo" && (
            <>
              <OrgChart />
              <div className="mt-4">
                <EquipoBroda />
              </div>
            </>
          )}
          {view === "playbooks" && <Mapa taskCompletion={taskCompletion} />}
          {view === "agentes" && (
            <Agentes filter={agentFilter} setFilter={setAgentFilter} agentStatus={agentStatus} setAgentField={setAgentField} />
          )}
          {view === "metricas" && (
            <Metricas
              kpis={kpis}
              latest={latest}
              prev={prev}
              kpiMetric={kpiMetric}
              setKpiMetric={setKpiMetric}
              onAddPeriod={(row) => setKpisByClient((prevState) => ({
                ...prevState,
                [selectedClientId]: [...(prevState[selectedClientId] || []).filter((k) => k.period !== row.period), row].sort((a, b) => (a.period < b.period ? -1 : 1)),
              }))}
            />
          )}
        </main>
      </div>
    </div>
  );
}

const VIEW_TITLES: Record<View, string> = {
  northstar: "North Star",
  businesscase: "Business Case",
  infra: "Infraestructura comercial",
  pipeline: "Pipeline",
  equipo: "Equipo",
  playbooks: "Playbooks",
  agentes: "Agentes IA",
  metricas: "Métricas",
};

function NavHeader({ view }: { view: View }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl m-0">{VIEW_TITLES[view]}</h1>
    </div>
  );
}

function EquipoBroda() {
  return (
    <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5">
      <h2 className="text-xl m-0 mb-0.5">El equipo real</h2>
      <p className="text-ink-soft text-[12.5px] mb-4 max-w-[70ch]">El núcleo decide qué se hace y para quién. Las células deciden cómo.</p>
      <table className="w-full border-collapse">
        <thead><tr><th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border">Persona</th><th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border pl-4">Rol</th><th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border pl-4">Tareas fijas</th></tr></thead>
        <tbody>
          {EQUIPO_BRODA.map((m) => (
            <tr key={m.persona}>
              <td className={`py-2.5 border-b border-border text-[13px] font-semibold ${m.nucleo ? "text-accent" : "text-ink"}`}>{m.persona}</td>
              <td className="py-2.5 border-b border-border text-[13px] text-ink-soft pl-4">{m.rol}</td>
              <td className="py-2.5 border-b border-border text-[12.5px] text-ink-faint pl-4">{m.tareas}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 pt-4 border-t border-border">
        <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">BRODAWEEK</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BRODAWEEK.filas.map((f) => (
            <div key={f[0]} className="border border-border rounded-lg p-3">
              <div className="font-display font-bold text-sm">{f[0]} · {f[1]}</div>
              <div className="text-[12px] text-ink-soft mt-1">{f[2]}</div>
              <div className="text-[10.5px] text-ink-faint mt-1.5">{f[3]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- CLIENT RAIL ---------------- */

function ClientRail({
  clients, selectedClientId, onSelectClient, onAddClient,
}: {
  clients: Client[]; selectedClientId: string; onSelectClient: (id: string) => void;
  onAddClient: (name: string, tier: string, industry: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <nav className="bg-panel border-r border-border px-4 pt-24 pb-4 flex flex-col gap-4.5 h-screen sticky top-0 overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint px-1.5">Cuentas</div>
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectClient(c.id)}
            className={`flex items-center gap-2 px-2 py-2 rounded-md text-left w-full ${
              c.id === selectedClientId ? "bg-panel-raised border border-border shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)] text-ink" : "text-ink-soft border border-transparent"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.id === selectedClientId ? "bg-accent" : "bg-border-strong"}`} />
            <span className="min-w-0 flex-1">
              <div className="font-semibold text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{c.name}</div>
              <div className="text-[10px] text-ink-faint">{c.tier}</div>
            </span>
          </button>
        ))}
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-dashed border-border-strong text-ink-faint text-xs hover:text-ink hover:border-accent">
          + Nueva cuenta
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-panel-raised">
          <div className="w-[30px] h-[30px] rounded-lg bg-accent flex items-center justify-center font-display font-black text-accent-ink text-[13px]">B</div>
          <div>
            <div className="font-display font-extrabold text-[11px] uppercase">Brodita</div>
            <div className="text-[9.5px] text-ink-faint">Mascota de growth</div>
          </div>
        </div>
        <div className="text-[10px] text-ink-faint px-0.5">modo local · sin backend aún</div>
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

/* ---------------- PIPELINE ---------------- */

function Pipeline({
  zoneCompletions, openZone, setOpenZone, taskStatus, setTaskStatus, agentAdoptionByStage, taskCompletion, latest, onJumpToAgent,
}: {
  zoneCompletions: Record<string, { pct: number; done: number; total: number }>;
  openZone: string | null; setOpenZone: (z: string | null) => void;
  taskStatus: Record<string, TaskStatus>; setTaskStatus: (id: string, s: TaskStatus) => void;
  agentAdoptionByStage: (s: StageId) => { active: number; total: number };
  taskCompletion: (tasks: { id: string }[]) => { done: number; total: number; pct: number };
  latest: KpiRow | null;
  onJumpToAgent: (stage: StageId) => void;
}) {
  const zone = openZone ? zoneOf(openZone) : null;
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">El embudo, en un solo gráfico</h2>
        <p className="text-ink-soft text-[12.5px] mb-3.5 max-w-[75ch]">
          Tocá cualquier tramo — Acquire, Activate, Convert, Keep, Up-Sell, Next-Sell, Cross-Sell o Referrals — y se abre el framework con sus tareas fijas, agentes y estado en esta cuenta.
        </p>
        <FunnelChart completions={zoneCompletions} openZone={openZone} onSelect={(id) => setOpenZone(openZone === id ? null : id)} />
      </div>

      {zone && (
        <div className="rounded-xl border-t-[3px] bg-panel-raised shadow-lg p-5 mb-4 border-x border-b border-border" style={{ borderTopColor: zone.color }}>
          <div className="flex justify-between items-start gap-3.5 mb-1">
            <div>
              <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint">
                {stageOf(zone.stage).name} · {stageOf(zone.stage).subtitle}
              </div>
              <h2 className="text-xl m-0" style={{ color: zone.color }}>{zone.label}</h2>
            </div>
            <div className="text-right font-extrabold text-[30px] leading-none" style={{ color: zone.color }}>
              {zoneCompletions[zone.id]?.pct}<span className="text-base">%</span>
              <div className="text-[10.5px] text-ink-faint font-medium mt-0.5">{zoneCompletions[zone.id]?.done}/{zoneCompletions[zone.id]?.total} tareas</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr_0.9fr] gap-4.5 mt-3">
            <div>
              <ColH>Tareas fijas</ColH>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Tarea", "Cadencia", "Agente", "Estado"].map((h) => (
                      <Th key={h}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasksForZone(zone).map((t) => {
                    const st = taskStatus[t.id] || "Pendiente";
                    const agent = t.agent ? agentOf(t.agent) : undefined;
                    return (
                      <tr key={t.id}>
                        <Td className="font-semibold">{t.name}</Td>
                        <Td className="text-[10.5px] text-ink-soft">{t.cadence}</Td>
                        <Td>{agent ? (
                          <button onClick={() => onJumpToAgent(zone.stage)} className="text-[11.5px] font-semibold text-accent underline underline-offset-2">{agent.name}</button>
                        ) : "—"}</Td>
                        <Td><StatusSelect value={st} onChange={(v) => setTaskStatus(t.id, v)} /></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <ColH>Experimentos del motor</ColH>
              <ul className="flex flex-col gap-2">
                {EXPERIMENTS[zone.stage].map((e, i) => (
                  <li key={i} className="text-[12.5px] border-b border-dashed border-border pb-1.5 last:border-none">
                    <b>{e.h}</b>
                    <div className="text-[10.5px] text-ink-faint">Mide: {e.metric} · Meta: {e.target}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ColH>Stack / APIs</ColH>
              <div className="flex flex-col gap-1.5 items-start">
                {STACK[zone.stage].map((s) => (
                  <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border" style={{ borderColor: `${zone.color}55`, color: zone.color }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Cobertura por motor</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">Tareas completadas y agentes activos por etapa.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAGES.map((s) => {
            const comp = taskCompletion(tasksForStage(s.id));
            const ad = agentAdoptionByStage(s.id);
            return (
              <div key={s.id} className="border border-border rounded-lg p-3" style={{ borderTopColor: s.color, borderTopWidth: 3 }}>
                <div className="font-display font-extrabold text-sm uppercase" style={{ color: s.color }}>{s.name}</div>
                <div className="text-[11px] text-ink-soft mt-1">{comp.done}/{comp.total} tareas · {ad.active}/{ad.total} agentes</div>
              </div>
            );
          })}
        </div>
      </div>
      {latest && (
        <p className="text-[11px] text-ink-faint">Último período cargado: {latest.period}</p>
      )}
    </>
  );
}

function ColH({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">{children}</div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 pr-2 border-b border-border text-[13px] align-middle ${className}`}>{children}</td>;
}
function StatusSelect({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  const color = value === "Hecho" ? "var(--good)" : value === "En curso" ? "var(--accent)" : value === "Bloqueado" ? "var(--critical)" : "var(--border-strong)";
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as TaskStatus)} className="border rounded-md px-1.5 py-1 text-[11.5px] bg-panel" style={{ borderColor: color, color }}>
      {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

/* ---------------- MAPA ---------------- */

function Mapa({ taskCompletion }: { taskCompletion: (tasks: { id: string }[]) => { done: number; total: number; pct: number } }) {
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Arquitectura del embudo</h2>
        <p className="text-ink-soft text-[12.5px]">El mismo embudo Get→Convert→Keep→Grow, desplegado como mapa de proceso: qué se hace, qué se prueba y con qué API/CRM corre cada etapa.</p>
      </div>
      {STAGES.map((s) => (
        <div key={s.id} className="rounded-xl bg-panel-raised shadow-lg p-5 mb-4 border-l-[3px] border-y border-r border-border" style={{ borderLeftColor: s.color }}>
          <div className="flex items-center gap-2.5 mb-0.5">
            <span className="w-3.5 h-3.5 rounded-sm" style={{ background: s.color }} />
            <h2 className="text-xl m-0" style={{ color: s.color }}>{s.name} — {s.subtitle}</h2>
          </div>
          <p className="text-ink-soft text-[12.5px] mb-3">{s.objective}</p>
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr_0.9fr] gap-4.5">
            <div>
              <ColH>Procesos fijos</ColH>
              <ul className="flex flex-col gap-2">
                {tasksForStage(s.id).map((t) => (
                  <li key={t.id} className="text-[12.5px] border-b border-dashed border-border pb-1.5 last:border-none">{t.name} <span className="text-[10.5px] text-ink-faint">· {t.cadence}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <ColH>Experimentos a correr</ColH>
              <ul className="flex flex-col gap-2">
                {EXPERIMENTS[s.id].map((e, i) => (
                  <li key={i} className="text-[12.5px] border-b border-dashed border-border pb-1.5 last:border-none">
                    <b>{e.h}</b>
                    <div className="text-[10.5px] text-ink-faint">Mide: {e.metric} · Meta: {e.target}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ColH>Stack / APIs</ColH>
              <div className="flex flex-col gap-1.5 items-start">
                {STACK[s.id].map((x) => (
                  <span key={x} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border" style={{ borderColor: `${s.color}55`, color: s.color }}>{x}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------- PLAYBOOK ---------------- */

function Playbook({
  filter, setFilter, taskStatus, setTaskStatus, onJumpToAgent,
}: {
  filter: StageId | null; setFilter: (f: StageId | null) => void;
  taskStatus: Record<string, TaskStatus>; setTaskStatus: (id: string, s: TaskStatus) => void;
  onJumpToAgent: (stage: StageId) => void;
}) {
  const stagesToShow = filter ? STAGES.filter((s) => s.id === filter) : STAGES;
  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterPill active={filter === null} onClick={() => setFilter(null)}>Todas las etapas</FilterPill>
        {STAGES.map((s) => (
          <FilterPill key={s.id} active={filter === s.id} color={s.color} onClick={() => setFilter(s.id)}>{s.name}</FilterPill>
        ))}
      </div>
      {stagesToShow.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
          <div className="flex items-center gap-2.5 mb-0.5">
            <span className="w-3.5 h-3.5 rounded-sm" style={{ background: s.color }} />
            <h2 className="text-xl m-0" style={{ color: s.color }}>{s.name} — {s.subtitle}</h2>
          </div>
          <p className="text-ink-soft text-[12.5px] mb-3">{s.objective}</p>
          <table className="w-full border-collapse">
            <thead><tr>{["Tarea", "Cadencia", "Responsable", "Agente", "Estado"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {tasksForStage(s.id).map((t) => {
                const st = taskStatus[t.id] || "Pendiente";
                const agent = t.agent ? agentOf(t.agent) : undefined;
                return (
                  <tr key={t.id}>
                    <Td className="font-semibold">{t.name}</Td>
                    <Td className="text-[10.5px] text-ink-soft">{t.cadence}</Td>
                    <Td><span className="inline-block px-1.5 py-0.5 rounded-md bg-panel border border-border text-[11px]">{t.role}</span></Td>
                    <Td>{agent ? <button onClick={() => onJumpToAgent(s.id)} className="text-[11.5px] font-semibold text-accent underline underline-offset-2">{agent.name}</button> : "—"}</Td>
                    <Td><StatusSelect value={st} onChange={(v) => setTaskStatus(t.id, v)} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

function FilterPill({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-display text-[10px] font-extrabold uppercase tracking-wide border"
      style={{ borderColor: active ? (color || "var(--accent)") : "var(--border-strong)", color: active ? (color || "var(--accent)") : "var(--ink-soft)" }}
    >
      {children}
    </button>
  );
}

/* ---------------- AGENTES ---------------- */

function Agentes({
  filter, setFilter, agentStatus, setAgentField,
}: {
  filter: StageId | null; setFilter: (f: StageId | null) => void;
  agentStatus: Record<string, { status: AgentStatusValue; autonomy: number; resp: number }>;
  setAgentField: (id: string, field: "status" | "autonomy" | "resp", v: string | number) => void;
}) {
  const list = filter ? AGENTS.filter((a) => a.stage === filter) : AGENTS;
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Cómo se construye un agente</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">Receta fija de 7 pasos, la ejecuta AI Agent Ops junto al responsable de la etapa: Disparador → Fuentes → Entregable → Límites → Integración → Instancia → Métrica.</p>
      </div>
      <div className="flex gap-2 mb-3.5 flex-wrap">
        <FilterPill active={filter === null} onClick={() => setFilter(null)}>Todos</FilterPill>
        {STAGES.map((s) => <FilterPill key={s.id} active={filter === s.id} color={s.color} onClick={() => setFilter(s.id)}>{s.name}</FilterPill>)}
      </div>
      {list.map((a) => (
        <AgentCard key={a.id} agent={a} cur={agentStatus[a.id]} setAgentField={setAgentField} />
      ))}
    </>
  );
}

function AgentCard({
  agent: a, cur, setAgentField,
}: {
  agent: (typeof AGENTS)[number];
  cur?: { status: AgentStatusValue; autonomy: number; resp: number };
  setAgentField: (id: string, field: "status" | "autonomy" | "resp", v: string | number) => void;
}) {
  const s = stageOf(a.stage);
  const status = cur || { status: "No construido" as AgentStatusValue, autonomy: 0, resp: 0 };
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div id={`agent-${a.id}`} className="border border-border rounded-lg p-4 mb-2.5 bg-panel-raised">
      <div className="flex justify-between items-start gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base m-0 normal-case tracking-normal font-display font-bold">{a.name}</h3>
          {a.live ? (
            <span className="flex items-center gap-1 text-[9px] font-display font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-good border border-good/40">
              <span className="w-1.5 h-1.5 rounded-full bg-good" style={{ boxShadow: "0 0 6px var(--good)" }} /> Vivo
            </span>
          ) : (
            <span className="text-[9px] font-display font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-ink-faint border border-border-strong">
              Entrenado
            </span>
          )}
        </div>
        <span className="text-[9.5px] uppercase tracking-wide font-display font-extrabold px-1.5 py-0.5 rounded" style={{ background: `${s.color}22`, color: s.color }}>{s.name}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-2.5">
        <Field k="Se activa cuando" v={a.trigger} />
        <Field k="Trabaja con" v={a.input} />
        <Field k="Entrega" v={a.output} />
        <Field k="Límites" v={a.guardrails} />
        <Field k="API / integración" v={a.api} />
      </div>
      <div className="flex gap-2.5 flex-wrap items-center pt-2.5 border-t border-border">
        <label className="text-[10.5px] text-ink-faint flex flex-col gap-1">Estado
          <select value={status.status} onChange={(e) => setAgentField(a.id, "status", e.target.value)} className="border border-border-strong rounded-md bg-panel text-ink px-1.5 py-1 text-[11.5px]">
            {AGENT_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="text-[10.5px] text-ink-faint flex flex-col gap-1">Autonomía %
          <input type="number" min={0} max={100} value={status.autonomy} onChange={(e) => setAgentField(a.id, "autonomy", Number(e.target.value))} className="w-16 border border-border-strong rounded-md bg-panel text-ink px-1.5 py-1" />
        </label>
        <label className="text-[10.5px] text-ink-faint flex flex-col gap-1">Resp. (min)
          <input type="number" min={0} value={status.resp} onChange={(e) => setAgentField(a.id, "resp", Number(e.target.value))} className="w-16 border border-border-strong rounded-md bg-panel text-ink px-1.5 py-1" />
        </label>
        <span className="text-[10.5px] text-ink-soft ml-auto">Construye: <span className="px-1.5 py-0.5 rounded-md bg-panel border border-border">{a.builder}</span></span>
      </div>

      <div className="pt-2.5 mt-2.5 border-t border-border">
        <button onClick={() => setShowPrompt((v) => !v)} className="text-[10.5px] font-display font-extrabold uppercase tracking-wide text-accent">
          {showPrompt ? "Ocultar" : "Ver"} system prompt {showPrompt ? "▲" : "▼"}
        </button>
        {showPrompt && (
          <div className="mt-2 relative">
            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-soft bg-panel border border-border rounded-md p-3 max-h-64 overflow-y-auto font-sans">{a.systemPrompt}</pre>
            <button
              onClick={() => { navigator.clipboard?.writeText(a.systemPrompt); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="absolute top-2 right-2 text-[9.5px] font-display font-extrabold uppercase px-2 py-1 rounded-md bg-panel-raised-2 border border-border-strong text-ink-soft"
            >
              {copied ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
        )}
      </div>

      {a.live && <InboundQualifierConsole />}
    </div>
  );
}

function InboundQualifierConsole() {
  const [message, setMessage] = useState("Hola! vi un reel suyo, cuanto sale armar algo como lo de ustedes para mi marca de ropa?");
  const [leadName, setLeadName] = useState("Lucía (IG)");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reply: string; qualified: boolean | string; reason: string; nextStep: string; flags: string[] } | null>(null);

  async function run() {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/agents/inbound-qualifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, leadName, channel: "Instagram" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del agente");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-3 mt-3 border-t border-border">
      <div className="text-[10.5px] font-display font-extrabold uppercase tracking-wide text-good mb-2">Probar agente en vivo</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 mb-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje entrante del lead…" className="border border-border-strong rounded-md bg-panel text-ink px-2.5 py-1.5 text-xs" />
        <input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre del lead" className="border border-border-strong rounded-md bg-panel text-ink px-2.5 py-1.5 text-xs" />
        <button onClick={run} disabled={loading} className="bg-good text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-md disabled:opacity-50">
          {loading ? "Calificando…" : "Enviar"}
        </button>
      </div>
      {error && (
        <div className="text-[11.5px] text-critical bg-critical/10 border border-critical/30 rounded-md p-2.5">
          {error}
        </div>
      )}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[12px]">
          <div className="border border-border rounded-md p-2.5 bg-panel">
            <div className="text-[9.5px] uppercase tracking-wide text-ink-faint mb-1">Respuesta de Brodita</div>
            <div className="text-ink-soft">{result.reply}</div>
          </div>
          <div className="border border-border rounded-md p-2.5 bg-panel">
            <div className="text-[9.5px] uppercase tracking-wide text-ink-faint mb-1">Veredicto</div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${result.qualified === true ? "bg-good" : result.qualified === false ? "bg-critical" : "bg-warn"}`} />
              <span className="font-semibold">{String(result.qualified)}</span>
            </div>
            <div className="text-ink-faint text-[11px] mb-1">{result.reason}</div>
            <div className="text-[10.5px]">Próximo paso: <b>{result.nextStep}</b></div>
            {result.flags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {result.flags.map((f, i) => <span key={i} className="text-[9.5px] px-1.5 py-0.5 rounded bg-warn/15 text-warn">{f}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-wide text-ink-faint mb-0.5">{k}</div>
      <div className="text-xs text-ink-soft leading-snug">{v}</div>
    </div>
  );
}

/* ---------------- METRICAS ---------------- */

function Metricas({
  kpis, latest, prev, kpiMetric, setKpiMetric, onAddPeriod,
}: {
  kpis: KpiRow[]; latest: KpiRow | null; prev: KpiRow | null;
  kpiMetric: string; setKpiMetric: (m: string) => void;
  onAddPeriod: (row: KpiRow) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  function delta(cur: number | null, p: number | null) {
    if (cur == null || p == null || p === 0) return null;
    return ((cur - p) / Math.abs(p)) * 100;
  }
  return (
    <>
      {latest ? (
        <div className="flex gap-3 flex-wrap mb-4">
          {[
            ["Revenue", latest.revenue, prev?.revenue ?? null, ""],
            ["Cierres", latest.closes, prev?.closes ?? null, ""],
            ["Health score", latest.healthScore, prev?.healthScore ?? null, ""],
            ["NRR", latest.nrr, prev?.nrr ?? null, "%"],
            ["Churn", latest.churnRate, prev?.churnRate ?? null, "%"],
          ].map(([label, v, p, unit]) => {
            const d = delta(v as number | null, p as number | null);
            return (
              <div key={label as string} className="flex-1 min-w-[130px] bg-panel-raised border border-border rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label as string}</div>
                <div className="tabular font-extrabold text-2xl mt-0.5">{fmt(v as number)}{unit as string}</div>
                <div className={`text-[11px] mt-0.5 ${d == null ? "text-ink-faint" : d > 0.5 ? "text-good" : d < -0.5 ? "text-critical" : "text-ink-faint"}`}>
                  {d == null ? "primer período" : `${d > 0 ? "+" : ""}${d.toFixed(1)}% vs. anterior`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-ink-faint text-[12.5px] italic mb-4">Todavía no hay períodos cargados. Agregá el primero abajo.</p>
      )}

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-3">Tendencia</h2>
        <select value={kpiMetric} onChange={(e) => setKpiMetric(e.target.value)} className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1 text-[12px] mb-3">
          {KPI_FIELDS.map((f) => <option key={f.k} value={f.k}>{f.l}</option>)}
        </select>
        {kpis.length > 0 ? <TrendChart rows={kpis} metric={kpiMetric} /> : <p className="text-ink-faint text-xs italic">Sin datos todavía.</p>}
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Cargar período</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">Un registro por mes. Sobrescribe si ya existe.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Período (AAAA-MM)
            <input value={draft.period || ""} onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))} placeholder="2026-09" className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1.5" />
          </label>
          {KPI_FIELDS.map((f) => (
            <label key={f.k} className="flex flex-col gap-1 text-[10.5px] text-ink-faint">{f.l}
              <input type="number" step="any" value={draft[f.k] || ""} onChange={(e) => setDraft((d) => ({ ...d, [f.k]: e.target.value }))} className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1.5" />
            </label>
          ))}
        </div>
        <button
          onClick={() => {
            if (!/^\d{4}-\d{2}$/.test(draft.period || "")) return;
            const row: KpiRow = { period: draft.period } as KpiRow;
            KPI_FIELDS.forEach((f) => { (row as unknown as Record<string, number | null>)[f.k] = draft[f.k] ? Number(draft[f.k]) : null; });
            onAddPeriod(row);
            setDraft({});
          }}
          className="bg-accent text-accent-ink font-display font-extrabold uppercase text-xs px-4 py-2 rounded-md"
        >
          Guardar período
        </button>
      </div>

      {kpis.length > 0 && (
        <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 overflow-x-auto">
          <h2 className="text-xl m-0 mb-3">Histórico</h2>
          <table className="w-full border-collapse tabular">
            <thead><tr><Th>Período</Th>{KPI_FIELDS.map((f) => <Th key={f.k}>{f.l}</Th>)}</tr></thead>
            <tbody>
              {kpis.map((r) => (
                <tr key={r.period}>
                  <Td>{r.period}</Td>
                  {KPI_FIELDS.map((f) => <Td key={f.k}>{fmt((r as unknown as Record<string, number | null>)[f.k])}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TrendChart({ rows, metric }: { rows: KpiRow[]; metric: string }) {
  const w = 640, h = 200, padL = 44, padR = 14, padT = 14, padB = 24;
  const vals = rows.map((r) => (r as unknown as Record<string, number | null>)[metric]);
  const known = vals.filter((v): v is number => v != null);
  if (known.length === 0) return <p className="text-ink-faint text-xs italic">Sin datos para esta métrica.</p>;
  const min = Math.min(...known, 0), max = Math.max(...known, 1);
  const range = max - min || 1;
  const stepX = (w - padL - padR) / Math.max(1, rows.length - 1);
  const pts: [number, number][] = [];
  rows.forEach((r, i) => {
    const v = vals[i];
    if (v == null) return;
    const x = padL + i * stepX;
    const y = padT + (h - padT - padB) - ((v - min) / range) * (h - padT - padB);
    pts.push([x, y]);
  });
  const path = pts.length ? "M" + pts.map((p) => p.join(",")).join(" L") : "";
  const area = pts.length ? `${path} L${pts[pts.length - 1][0]},${padT + (h - padT - padB)} L${pts[0][0]},${padT + (h - padT - padB)} Z` : "";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {[0, 1, 2, 3].map((g) => {
        const y = padT + (h - padT - padB) - (g / 3) * (h - padT - padB);
        const val = min + (g / 3) * range;
        return (
          <g key={g}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="var(--ink-faint)">{Math.round(val)}</text>
          </g>
        );
      })}
      <path d={area} fill="var(--convert)" opacity={0.12} />
      <path d={path} fill="none" stroke="var(--convert)" strokeWidth={2} strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4.5 : 2.5} fill={i === pts.length - 1 ? "var(--accent)" : "var(--convert)"} />
      ))}
      {rows.map((r, i) => (
        <text key={r.period} x={padL + i * stepX} y={h - 6} textAnchor="middle" fontSize={9} fill="var(--ink-faint)">{r.period.slice(2)}</text>
      ))}
    </svg>
  );
}

/* ---------------- EQUIPO ---------------- */

function Equipo({ client, onUpdateOwners }: { client: Client; onUpdateOwners: (o: Client["owners"]) => void }) {
  const [owners, setOwners] = useState(client.owners);
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Roles fijos</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">7 roles cubren el ciclo completo Get→Convert→Keep→Grow. En equipos chicos, una persona combina varios.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-3.5">
              <h3 className="text-[15px] m-0 mb-1 normal-case tracking-normal font-display font-bold">{r.name}</h3>
              <div className="text-[10.5px] text-ink-faint mb-1.5">Dueño de: {r.owns}</div>
              <ul className="m-0 pl-4 text-xs text-ink-soft space-y-0.5">
                {r.duties.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-3">Cobertura según tamaño de equipo</h2>
        <table className="w-full border-collapse">
          <thead><tr><Th>Tamaño</Th><Th>Combinación de roles</Th></tr></thead>
          <tbody>
            {COVERAGE.map((c) => (
              <tr key={c.size}>
                <Td><span className="px-1.5 py-0.5 rounded-md bg-panel border border-border text-[11px]">{c.size}</span></Td>
                <Td>{c.combo}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5">
        <h2 className="text-xl m-0 mb-0.5">Responsables de esta cuenta</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">Quién lleva {client.name} en cada frente.</p>
        <div className="flex gap-2.5 flex-wrap">
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Growth Lead
            <input value={owners.growth} onChange={(e) => setOwners((o) => ({ ...o, growth: e.target.value }))} className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Closer / AE
            <input value={owners.sales} onChange={(e) => setOwners((o) => ({ ...o, sales: e.target.value }))} className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Client Success
            <input value={owners.success} onChange={(e) => setOwners((o) => ({ ...o, success: e.target.value }))} className="border border-border-strong rounded-md bg-panel text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
        </div>
        <button onClick={() => onUpdateOwners(owners)} className="mt-3 bg-accent text-accent-ink font-display font-extrabold uppercase text-xs px-4 py-2 rounded-md">Guardar</button>
      </div>
    </>
  );
}
