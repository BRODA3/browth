"use client";

import { useEffect, useMemo, useState } from "react";
import FunnelChart from "./FunnelChart";
import OrgChart from "./OrgChart";
import TeamOrgChart from "./TeamOrgChart";
import InfraFunnel from "./InfraFunnel";
import NorthStar from "./NorthStar";
import BusinessCase from "./BusinessCase";
import EstrategiaContenido from "./EstrategiaContenido";
import PlanContenido from "./PlanContenido";
import { TopBar, SideNav, type Mode, type View } from "./Nav";
import BroditaChat from "./BroditaChat";
import { Card, CardHeader, StatCard, Pill, Donut, AreaChart, ProgressRow } from "./ui";
import { BrodaProvider, useBroda } from "./BrodaContext";
import { Editable } from "./doc";
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
  return (
    <BrodaProvider>
      <AppInner />
    </BrodaProvider>
  );
}

function AppInner() {
  const persisted = useMemo(() => loadPersisted<{
    clients?: Client[];
    taskStatusByClient?: Record<string, Record<string, TaskStatus>>;
    agentStatusByClient?: Record<string, Record<string, { status: AgentStatusValue; autonomy: number; resp: number }>>;
    kpisByClient?: Record<string, KpiRow[]>;
  }>({}), []);

  const [clients, setClients] = useState<Client[]>(persisted.clients?.length ? persisted.clients : SEED_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>((persisted.clients?.length ? persisted.clients : SEED_CLIENTS)[0].id);
  const [mode, setMode] = useState<Mode>("broda");
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
      <TopBar mode={mode} view={view} onSetMode={(m) => { setMode(m); setView(m === "broda" ? "northstar" : "pipeline"); }} />
      <div className="flex">
        <SideNav
          mode={mode}
          view={view}
          onSetView={setView}
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={(id) => { setSelectedClientId(id); setOpenZone(null); }}
          onAddClient={addClient}
        />
        <main className="flex-1 min-w-0 px-8 py-8 pb-24 max-w-[1240px]">
          {scoped && (
            <div className="flex items-center justify-between flex-wrap gap-3 mb-7">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-full bg-accent text-accent-ink flex items-center justify-center font-display font-black text-[17px] shrink-0">
                  {client.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-[26px] leading-none m-0 tracking-tight truncate">{client.name}</h1>
                  <div className="text-ink-faint text-[12.5px] mt-1.5">{client.industry}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-[10px] font-extrabold uppercase tracking-wider border border-border-strong text-ink-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {client.tier}
              </span>
            </div>
          )}
          {view === "playbooks" && <NavHeader view={view} />}

          {view === "northstar" && <NorthStar />}
          {view === "businesscase" && <BusinessCase />}
          {view === "infra" && <InfraFunnel />}
          {view === "estrategia" && <EstrategiaContenido />}
          {view === "plan" && <PlanContenido />}
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
              <div className="mb-6">
                <h2 className="text-[clamp(26px,3.4vw,40px)] leading-[1.02] mb-2">Equipo</h2>
                <p className="text-ink-soft text-[14.5px] max-w-[62ch]">Quién decide, quién ejecuta y cómo se ordena la semana.</p>
              </div>
              <TeamOrgChart />
              <EquipoBroda />
            </>
          )}
          {view === "playbooks" && <Mapa taskCompletion={taskCompletion} />}
          {view === "agentes" && (
            <>
              <div className="mb-4"><OrgChart /></div>
              <Agentes filter={agentFilter} setFilter={setAgentFilter} agentStatus={agentStatus} setAgentField={setAgentField} />
            </>
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
      <BroditaChat mode={mode} client={client} />
    </div>
  );
}

function NavHeader({ view }: { view: View }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl m-0">{view === "playbooks" ? "Playbooks" : ""}</h1>
    </div>
  );
}

function EquipoBroda() {
  const { data } = useBroda();
  return (
    <div className="mt-4 bg-surface border border-border rounded-[var(--r-lg)] p-6">
      <div>
        <h2 className="text-[17px] leading-tight m-0 normal-case tracking-tight font-display font-extrabold">BRODAWEEK</h2>
        <p className="text-[12.5px] text-ink-faint mt-1 mb-3">Tres reuniones, tres trabajos distintos. Un informe no necesita reunión.</p>
        <div className="flex flex-col">
          {data.BRODAWEEK.filas.map((f, i) => (
            <div key={i} className={`flex flex-col md:flex-row md:items-baseline gap-1 md:gap-6 py-3.5 ${i < data.BRODAWEEK.filas.length - 1 ? "border-b border-border" : ""}`}>
              <span className="font-display font-bold text-[15px] w-44 shrink-0"><Editable path={["BRODAWEEK", "filas", i, 0]} value={f[0]} /> · <Editable path={["BRODAWEEK", "filas", i, 1]} value={f[1]} /></span>
              <span className="text-[13.5px] text-ink-soft flex-1"><Editable path={["BRODAWEEK", "filas", i, 2]} value={f[2]} /></span>
              <span className="text-[11px] text-ink-faint tabular shrink-0"><Editable path={["BRODAWEEK", "filas", i, 3]} value={f[3]} /></span>
            </div>
          ))}
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="El embudo, en un solo gráfico"
          sub="Tocá cualquier tramo — Acquire, Activate, Convert, Keep, Up-Sell, Next-Sell, Cross-Sell o Referrals — y se abre el framework con sus tareas fijas, agentes y estado en esta cuenta."
        />
        <FunnelChart completions={zoneCompletions} openZone={openZone} onSelect={(id) => setOpenZone(openZone === id ? null : id)} />
      </Card>

      {zone && (
        <Card className="border-t-[3px]" >
          <div className="flex justify-between items-start gap-3.5 mb-4 -mt-1" style={{ boxShadow: `inset 0 3px 0 -1px ${zone.color}` }}>
            <div className="pt-3">
              <div className="eyebrow">{stageOf(zone.stage).name} · {stageOf(zone.stage).subtitle}</div>
              <h2 className="text-[22px] m-0 mt-1 normal-case tracking-tight" style={{ color: zone.color }}>{zone.label}</h2>
            </div>
            <div className="text-right pt-3">
              <div className="tabular font-extrabold text-[32px] leading-none tracking-tight" style={{ color: zone.color }}>
                {zoneCompletions[zone.id]?.pct}<span className="text-[18px]">%</span>
              </div>
              <div className="text-[11px] text-ink-faint mt-1">{zoneCompletions[zone.id]?.done}/{zoneCompletions[zone.id]?.total} tareas</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr_0.9fr] gap-6">
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
                  <span key={s} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-[var(--r-sm)] border" style={{ borderColor: `${zone.color}44`, color: zone.color, background: `${zone.color}0d` }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <CardHeader title="Cobertura por motor" sub="Tareas del playbook completadas en esta cuenta." />
          <div className="flex flex-col gap-3.5">
            {STAGES.map((s) => {
              const comp = taskCompletion(tasksForStage(s.id));
              return <ProgressRow key={s.id} label={s.name} pct={comp.pct} color={s.color} meta={`${comp.done}/${comp.total} tareas`} />;
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Agentes activos" sub="Agentes en estado Activo sobre el total de cada motor." />
          <div className="flex flex-col gap-3.5">
            {STAGES.map((s) => {
              const ad = agentAdoptionByStage(s.id);
              const pct = ad.total ? Math.round((ad.active / ad.total) * 100) : 0;
              return <ProgressRow key={s.id} label={s.name} pct={pct} color={s.color} meta={`${ad.active}/${ad.total} agentes`} />;
            })}
          </div>
          {latest && <p className="text-[11px] text-ink-faint mt-5 pt-4 border-t border-border">Último período cargado: {latest.period}</p>}
        </Card>
      </div>
    </div>
  );
}

function ColH({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow mb-3">{children}</div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-display font-extrabold text-[10px] uppercase tracking-[0.08em] text-ink-faint px-3 py-2.5 border-b border-border first:pl-5 last:pr-5">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 border-b border-border text-[13px] text-ink-soft align-middle first:pl-5 last:pr-5 ${className}`}>{children}</td>;
}
function StatusSelect({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  const color = value === "Hecho" ? "var(--good)" : value === "En curso" ? "var(--accent)" : value === "Bloqueado" ? "var(--critical)" : "var(--ink-faint)";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="border rounded-full px-2.5 py-1 text-[11px] font-semibold bg-transparent outline-none cursor-pointer"
      style={{ borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, color, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      {STATUS_OPTIONS.map((o) => <option key={o} style={{ background: "var(--surface)", color: "var(--ink)" }}>{o}</option>)}
    </select>
  );
}

/* ---------------- MAPA ---------------- */

function Mapa({ taskCompletion }: { taskCompletion: (tasks: { id: string }[]) => { done: number; total: number; pct: number } }) {
  return (
    <>
      <div className="bg-surface border border-border rounded-[var(--r-lg)] p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Arquitectura del embudo</h2>
        <p className="text-ink-soft text-[12.5px]">El mismo embudo Get→Convert→Keep→Grow, desplegado como mapa de proceso: qué se hace, qué se prueba y con qué API/CRM corre cada etapa.</p>
      </div>
      {STAGES.map((s) => (
        <div key={s.id} className="rounded-xl bg-surface-2 shadow-lg p-5 mb-4 border-l-[3px] border-y border-r border-border" style={{ borderLeftColor: s.color }}>
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
        <div key={s.id} className="bg-surface border border-border rounded-[var(--r-lg)] p-5 mb-4">
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
                    <Td><span className="inline-block px-1.5 py-0.5 rounded-md bg-surface border border-border text-[11px]">{t.role}</span></Td>
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
      <div className="bg-surface border border-border rounded-[var(--r-lg)] p-5 mb-4">
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
    <div id={`agent-${a.id}`} className="border border-border rounded-[var(--r-lg)] p-4 mb-3 bg-surface">
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
          <select value={status.status} onChange={(e) => setAgentField(a.id, "status", e.target.value)} className="border border-border-strong rounded-md bg-surface text-ink px-1.5 py-1 text-[11.5px]">
            {AGENT_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="text-[10.5px] text-ink-faint flex flex-col gap-1">Autonomía %
          <input type="number" min={0} max={100} value={status.autonomy} onChange={(e) => setAgentField(a.id, "autonomy", Number(e.target.value))} className="w-16 border border-border-strong rounded-md bg-surface text-ink px-1.5 py-1" />
        </label>
        <label className="text-[10.5px] text-ink-faint flex flex-col gap-1">Resp. (min)
          <input type="number" min={0} value={status.resp} onChange={(e) => setAgentField(a.id, "resp", Number(e.target.value))} className="w-16 border border-border-strong rounded-md bg-surface text-ink px-1.5 py-1" />
        </label>
        <span className="text-[10.5px] text-ink-soft ml-auto">Construye: <span className="px-1.5 py-0.5 rounded-md bg-surface border border-border">{a.builder}</span></span>
      </div>

      <div className="pt-2.5 mt-2.5 border-t border-border">
        <button onClick={() => setShowPrompt((v) => !v)} className="text-[10.5px] font-display font-extrabold uppercase tracking-wide text-accent">
          {showPrompt ? "Ocultar" : "Ver"} system prompt {showPrompt ? "▲" : "▼"}
        </button>
        {showPrompt && (
          <div className="mt-2 relative">
            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-soft bg-surface border border-border rounded-md p-3 max-h-64 overflow-y-auto font-sans">{a.systemPrompt}</pre>
            <button
              onClick={() => { navigator.clipboard?.writeText(a.systemPrompt); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="absolute top-2 right-2 text-[9.5px] font-display font-extrabold uppercase px-2 py-1 rounded-md bg-surface-3 border border-border-strong text-ink-soft"
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
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje entrante del lead…" className="border border-border-strong rounded-md bg-surface text-ink px-2.5 py-1.5 text-xs" />
        <input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre del lead" className="border border-border-strong rounded-md bg-surface text-ink px-2.5 py-1.5 text-xs" />
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
          <div className="border border-border rounded-md p-2.5 bg-surface">
            <div className="text-[9.5px] uppercase tracking-wide text-ink-faint mb-1">Respuesta de Brodita</div>
            <div className="text-ink-soft">{result.reply}</div>
          </div>
          <div className="border border-border rounded-md p-2.5 bg-surface">
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
  const [showForm, setShowForm] = useState(false);

  function delta(cur: number | null, p: number | null) {
    if (cur == null || p == null || p === 0) return null;
    return ((cur - p) / Math.abs(p)) * 100;
  }

  const metricLabel = KPI_FIELDS.find((f) => f.k === kpiMetric)?.l ?? "";
  const serie = kpis.map((r) => (r as unknown as Record<string, number | null>)[kpiMetric]);
  const embudo = latest
    ? [
        { label: "Leads", value: latest.leads ?? 0, color: "var(--get)" },
        { label: "Reuniones", value: latest.meetings ?? 0, color: "var(--convert)" },
        { label: "Propuestas", value: latest.proposals ?? 0, color: "var(--keep)" },
        { label: "Cierres", value: latest.closes ?? 0, color: "var(--grow)" },
      ]
    : [];

  if (!latest) {
    return (
      <Card>
        <CardHeader title="Sin datos todavía" sub="Cargá el primer período para ver los KPIs, la tendencia y la composición del embudo." />
        <PeriodoForm draft={draft} setDraft={setDraft} onAddPeriod={onAddPeriod} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={fmt(latest.revenue)} delta={delta(latest.revenue, prev?.revenue ?? null)} icon="$" />
        <StatCard label="Cierres" value={fmt(latest.closes)} delta={delta(latest.closes, prev?.closes ?? null)} icon="✓" />
        <StatCard label="Health score" value={fmt(latest.healthScore)} delta={delta(latest.healthScore, prev?.healthScore ?? null)} icon="◉" />
        <StatCard label="NRR" value={fmt(latest.nrr)} unit="%" delta={delta(latest.nrr, prev?.nrr ?? null)} accent="var(--accent)" icon="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        <Card>
          <CardHeader
            title="Tendencia"
            sub={`${metricLabel} por período · ${kpis.length} períodos cargados`}
            right={
              <select
                value={kpiMetric}
                onChange={(e) => setKpiMetric(e.target.value)}
                className="border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-1.5 text-[12px] outline-none focus:border-accent"
              >
                {KPI_FIELDS.map((f) => <option key={f.k} value={f.k}>{f.l}</option>)}
              </select>
            }
          />
          <AreaChart
            points={serie}
            labels={kpis.map((r) => r.period.slice(2))}
            color="var(--accent)"
            height={190}
          />
        </Card>

        <Card>
          <CardHeader title="Embudo del período" sub={latest.period} />
          <div className="flex items-center gap-5">
            <Donut
              segments={embudo}
              centerValue={fmt(latest.leads)}
              centerLabel="Leads"
              size={150}
            />
            <div className="flex flex-col gap-2.5 min-w-0 flex-1">
              {embudo.map((s) => (
                <div key={s.label} className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[12px] text-ink-soft flex-1 truncate">{s.label}</span>
                  <span className="tabular text-[13px] font-bold">{fmt(s.value)}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2.5 mt-0.5 border-t border-border">
                <span className="text-[11.5px] text-ink-faint flex-1">Cierre sobre leads</span>
                <span className="tabular text-[13px] font-bold text-accent">
                  {latest.leads ? (((latest.closes ?? 0) / latest.leads) * 100).toFixed(1) : "—"}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
          <div>
            <h2 className="text-[17px] leading-tight m-0 normal-case tracking-tight font-display font-extrabold">Histórico</h2>
            <p className="text-[12.5px] text-ink-faint mt-1">Un registro por período. Cargar de nuevo un período lo sobrescribe.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
          >
            {showForm ? "Cerrar" : "+ Período"}
          </button>
        </div>

        {showForm && (
          <div className="px-5 pb-5 border-b border-border">
            <PeriodoForm draft={draft} setDraft={setDraft} onAddPeriod={(r) => { onAddPeriod(r); setShowForm(false); }} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular">
            <thead>
              <tr>
                <Th>Período</Th>
                {KPI_FIELDS.map((f) => <Th key={f.k}>{f.l}</Th>)}
              </tr>
            </thead>
            <tbody>
              {[...kpis].reverse().map((r) => (
                <tr key={r.period} className="hover:bg-surface-2/60 transition-colors">
                  <Td className="font-semibold text-ink">{r.period}</Td>
                  {KPI_FIELDS.map((f) => <Td key={f.k}>{fmt((r as unknown as Record<string, number | null>)[f.k])}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PeriodoForm({
  draft, setDraft, onAddPeriod,
}: {
  draft: Record<string, string>; setDraft: (f: (d: Record<string, string>) => Record<string, string>) => void;
  onAddPeriod: (row: KpiRow) => void;
}) {
  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-2.5 py-2 text-[13px] outline-none focus:border-accent";
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <label className="flex flex-col gap-1.5 text-[10.5px] text-ink-faint">
          Período (AAAA-MM)
          <input value={draft.period || ""} onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))} placeholder="2026-09" className={field} />
        </label>
        {KPI_FIELDS.map((f) => (
          <label key={f.k} className="flex flex-col gap-1.5 text-[10.5px] text-ink-faint">
            {f.l}
            <input type="number" step="any" value={draft[f.k] || ""} onChange={(e) => setDraft((d) => ({ ...d, [f.k]: e.target.value }))} className={field} />
          </label>
        ))}
      </div>
      <button
        onClick={() => {
          if (!/^\d{4}-\d{2}$/.test(draft.period || "")) return;
          const row: KpiRow = { period: draft.period } as KpiRow;
          KPI_FIELDS.forEach((f) => { (row as unknown as Record<string, number | null>)[f.k] = draft[f.k] ? Number(draft[f.k]) : null; });
          onAddPeriod(row);
          setDraft(() => ({}));
        }}
        className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
      >
        Guardar período
      </button>
    </>
  );
}

/* ---------------- EQUIPO ---------------- */

function Equipo({ client, onUpdateOwners }: { client: Client; onUpdateOwners: (o: Client["owners"]) => void }) {
  const [owners, setOwners] = useState(client.owners);
  return (
    <>
      <div className="bg-surface border border-border rounded-[var(--r-lg)] p-5 mb-4">
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

      <div className="bg-surface border border-border rounded-[var(--r-lg)] p-5 mb-4">
        <h2 className="text-xl m-0 mb-3">Cobertura según tamaño de equipo</h2>
        <table className="w-full border-collapse">
          <thead><tr><Th>Tamaño</Th><Th>Combinación de roles</Th></tr></thead>
          <tbody>
            {COVERAGE.map((c) => (
              <tr key={c.size}>
                <Td><span className="px-1.5 py-0.5 rounded-md bg-surface border border-border text-[11px]">{c.size}</span></Td>
                <Td>{c.combo}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-border rounded-[var(--r-lg)] p-5">
        <h2 className="text-xl m-0 mb-0.5">Responsables de esta cuenta</h2>
        <p className="text-ink-soft text-[12.5px] mb-3">Quién lleva {client.name} en cada frente.</p>
        <div className="flex gap-2.5 flex-wrap">
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Growth Lead
            <input value={owners.growth} onChange={(e) => setOwners((o) => ({ ...o, growth: e.target.value }))} className="border border-border-strong rounded-md bg-surface text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Closer / AE
            <input value={owners.sales} onChange={(e) => setOwners((o) => ({ ...o, sales: e.target.value }))} className="border border-border-strong rounded-md bg-surface text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
          <label className="flex flex-col gap-1 text-[10.5px] text-ink-faint">Client Success
            <input value={owners.success} onChange={(e) => setOwners((o) => ({ ...o, success: e.target.value }))} className="border border-border-strong rounded-md bg-surface text-ink px-2 py-1.5 min-w-[150px]" />
          </label>
        </div>
        <button onClick={() => onUpdateOwners(owners)} className="mt-3 bg-accent text-accent-ink font-display font-extrabold uppercase text-xs px-4 py-2 rounded-md">Guardar</button>
      </div>
    </>
  );
}
