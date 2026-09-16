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
import Crm from "./Crm";
import type { Oportunidad } from "@/lib/crm";
import Workflows from "./Workflows";
import Cerebro from "./Cerebro";
import type { AccionBrodita } from "./BroditaChat";
import { desdeBrodita } from "@/lib/workflows";
import { nuevaOportunidad, FUENTES, ETAPAS, type EtapaId, type FuenteId } from "@/lib/crm";
import { nuevoDoc, type TipoDoc } from "@/lib/cerebro";
import { CANALES, type PiezaPlan } from "@/lib/broda";
import { contextoDeDocs, type DocCerebro } from "@/lib/cerebro";
import Metricas from "./Metricas";
import AgentesIA from "./AgentesIA";
import PlanMes from "./PlanMes";
import { normalizarAgentes, type AgenteConfig } from "@/lib/agentes";
import type { Workflow } from "@/lib/workflows";
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

const CLIENT_SCOPED = new Set<View>(["pipeline", "crm", "workflows", "brains", "agentes", "metricas"]);

/** Vistas de tablero: ocupan todo el ancho y todo el alto de la pantalla. */
const PANTALLA_COMPLETA = new Set<View>(["workflows", "agentes"]);

function fmt(v: number | null | undefined) {
  return v == null ? "—" : v.toLocaleString("es-AR");
}

const STORAGE_KEY = "browth:v2";

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
  const { data: brodaData, update: updateBroda } = useBroda();
  const persisted = useMemo(() => loadPersisted<{
    clients?: Client[];
    taskStatusByClient?: Record<string, Record<string, TaskStatus>>;
    kpisByClient?: Record<string, KpiRow[]>;
    crmByClient?: Record<string, Oportunidad[]>;
    workflowsByClient?: Record<string, Workflow[]>;
    brainsByClient?: Record<string, DocCerebro[]>;
    agentesByClient?: Record<string, AgenteConfig[]>;
  }>({}), []);

  const [clients, setClients] = useState<Client[]>(persisted.clients?.length ? persisted.clients : SEED_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>((persisted.clients?.length ? persisted.clients : SEED_CLIENTS)[0].id);
  const [mode, setMode] = useState<Mode>("broda");
  const [view, setView] = useState<View>("planmes");
  const [openZone, setOpenZone] = useState<string | null>(null);
  const [playbookFilter, setPlaybookFilter] = useState<StageId | null>(null);
  const [agentFilter, setAgentFilter] = useState<StageId | null>(null);
  const [kpiMetric, setKpiMetric] = useState<string>("revenue");

  const [taskStatusByClient, setTaskStatusByClient] = useState<Record<string, Record<string, TaskStatus>>>(
    () => persisted.taskStatusByClient ?? Object.fromEntries(Object.entries(SEED_TASK_STATUS))
  );
  const [kpisByClient, setKpisByClient] = useState<Record<string, KpiRow[]>>(
    () => persisted.kpisByClient ?? Object.fromEntries(Object.entries(SEED_KPIS))
  );

  const [crmByClient, setCrmByClient] = useState<Record<string, Oportunidad[]>>(() => persisted.crmByClient ?? {});
  const [workflowsByClient, setWorkflowsByClient] = useState<Record<string, Workflow[]>>(() => persisted.workflowsByClient ?? {});
  const [brainsByClient, setBrainsByClient] = useState<Record<string, DocCerebro[]>>(() => persisted.brainsByClient ?? {});
  const [agentesByClient, setAgentesByClient] = useState<Record<string, AgenteConfig[]>>(() => persisted.agentesByClient ?? {});

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, taskStatusByClient, kpisByClient, crmByClient, workflowsByClient, brainsByClient, agentesByClient }));
    } catch {
      // localStorage no disponible (modo privado, cuota llena) — la app sigue funcionando en memoria.
    }
  }, [clients, taskStatusByClient, kpisByClient, crmByClient, workflowsByClient, brainsByClient, agentesByClient]);

  const client = clients.find((c) => c.id === selectedClientId)!;
  const taskStatus = taskStatusByClient[selectedClientId] || {};
  const kpis = kpisByClient[selectedClientId] || [];
  const latest = kpis[kpis.length - 1] ?? null;
  const prev = kpis.length > 1 ? kpis[kpis.length - 2] : null;

  function setTaskStatus(taskId: string, status: TaskStatus) {
    setTaskStatusByClient((prevState) => ({
      ...prevState,
      [selectedClientId]: { ...(prevState[selectedClientId] || {}), [taskId]: status },
    }));
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

  // La red de agentes de la cuenta; lo guardado con un modelo viejo se completa solo.
  const agentesCliente: AgenteConfig[] = useMemo(
    () => normalizarAgentes(agentesByClient[selectedClientId]),
    [agentesByClient, selectedClientId]
  );

  function agentAdoptionByStage(stageId: StageId) {
    const delMotor = agentesCliente.filter((a) => a.etapa === stageId);
    return { active: delMotor.filter((a) => a.estado === "Activo").length, total: delMotor.length };
  }

  const zoneCompletions = useMemo(() => {
    const map: Record<string, { pct: number; done: number; total: number }> = {};
    FUNNEL_ZONES.forEach((z) => { map[z.id] = taskCompletion(tasksForZone(z)); });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus]);

  // El cerebro que corresponde: en Clientes, el de la cuenta; en Broda, el de la marca.
  const brainCliente = brainsByClient[selectedClientId] ?? [];
  const docsActivos = mode === "clientes" ? brainCliente : (brodaData.CEREBRO ?? []);
  const cerebroActivo = contextoDeDocs(docsActivos.filter((d) => d.activo), 1200);


  /** Lo que Brodita deja hecho cuando el equipo toca "Aplicar". */
  function ejecutarAccion(a: AccionBrodita): string {
    const i = a.input as Record<string, unknown>;
    const str = (k: string, def = "") => (typeof i[k] === "string" ? (i[k] as string) : def);

    if (a.tool === "crear_flujo") {
      const pasos = Array.isArray(i.pasos) ? (i.pasos as Record<string, never>[]) : [];
      const wf = desdeBrodita(str("nombre", "Flujo de Brodita"), pasos);
      setWorkflowsByClient((prevState) => ({ ...prevState, [selectedClientId]: [...(prevState[selectedClientId] ?? []), wf] }));
      setMode("clientes");
      setView("workflows");
      return `Armé "${wf.nombre}" en Workflows de ${client.name}, con ${wf.nodos.length} pasos.`;
    }

    if (a.tool === "crear_oportunidad") {
      const fuente = FUENTES.some((f) => f.id === i.fuente) ? (i.fuente as FuenteId) : "manual";
      const etapa = ETAPAS.some((e) => e.id === i.etapa) ? (i.etapa as EtapaId) : "nuevo";
      const op = nuevaOportunidad({
        nombre: str("nombre"), empresa: str("empresa"), telefono: str("telefono"), email: str("email"),
        nota: str("nota"), valor: typeof i.valor === "number" ? i.valor : 0, fuente, etapa,
      });
      setCrmByClient((prevState) => ({ ...prevState, [selectedClientId]: [...(prevState[selectedClientId] ?? []), op] }));
      setMode("clientes");
      setView("crm");
      return `Cargué a ${op.nombre || "el contacto"} en el CRM de ${client.name}.`;
    }

    if (a.tool === "agregar_pieza_contenido") {
      const canal = CANALES.find((c) => c.canal === i.canal) ?? CANALES[0];
      const pieza: PiezaPlan = {
        id: `p-${Date.now().toString(36)}`,
        prioridad: false,
        fecha: str("fecha"),
        canal: canal.canal as PiezaPlan["canal"],
        canalLabel: canal.label,
        formato: str("formato", "Placa"),
        tema: str("tema"),
        pilar: str("pilar", "Sin asignar"),
        estado: "Bloque abierto",
        detalle: "",
        titular: str("titular"), subtitulo: str("subtitulo"),
        hook: str("hook"), cta: str("cta"),
      };
      updateBroda(["PLAN", "filas"], [...brodaData.PLAN.filas, pieza]);
      setMode("broda");
      setView("plan");
      return `Sumé "${pieza.tema}" al plan de contenido${pieza.fecha ? ` para el ${pieza.fecha}` : ", sin fecha"}.`;
    }

    if (a.tool === "guardar_en_cerebro") {
      const doc = nuevoDoc({ titulo: str("titulo", "Nota de Brodita"), contenido: str("contenido"), tipo: (str("tipo", "nota") as TipoDoc) });
      updateBroda(["CEREBRO"], [...(brodaData.CEREBRO ?? []), doc]);
      return `Guardé "${doc.titulo}" en el cerebro. Ya lo usa en las próximas respuestas.`;
    }

    return "No supe qué hacer con eso.";
  }

  const scoped = mode === "clientes" && CLIENT_SCOPED.has(view) && view !== "agentes";
  const completa = PANTALLA_COMPLETA.has(view);

  return (
    <div className="min-h-screen">
      <TopBar mode={mode} view={view} onSetMode={(m) => { setMode(m); setView(m === "broda" ? "planmes" : "pipeline"); }} />
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
        <main className={`flex-1 min-w-0 ${completa ? "px-4 py-4 pb-6 max-w-none" : "px-8 py-8 pb-24 max-w-[1240px]"}`}>
          {scoped && (
            <div className={`flex items-center justify-between flex-wrap gap-3 ${completa ? "mb-3" : "mb-7"}`}>
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

          {view === "planmes" && <PlanMes />}
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
          {view === "crm" && (
            <Crm
              ops={crmByClient[selectedClientId] ?? []}
              onChange={(ops) => setCrmByClient((prevState) => ({ ...prevState, [selectedClientId]: ops }))}
            />
          )}
          {view === "workflows" && (
            <Workflows
              flows={workflowsByClient[selectedClientId] ?? []}
              cerebro={cerebroActivo}
              cuenta={client.name}
              onChange={(f) => setWorkflowsByClient((prevState) => ({ ...prevState, [selectedClientId]: f }))}
            />
          )}
          {view === "brains" && (
            mode === "clientes" ? (
              <Cerebro
                docs={brainCliente}
                onChange={(docs) => setBrainsByClient((prevState) => ({ ...prevState, [selectedClientId]: docs }))}
                titulo={`Brain de ${client.name}`}
                bajada="Todo lo que Brodita sabe de esta cuenta: su oferta, sus clientes, sus objeciones y sus notas. Cuando estás en Clientes, responde con esto."
              />
            ) : (
              <Cerebro
                docs={brodaData.CEREBRO ?? []}
                onChange={(docs) => updateBroda(["CEREBRO"], docs)}
                titulo="Brain de BRODA"
                bajada="Lo que Brodita sabe de la marca propia. Escribí acá adentro o importá tus notas de Obsidian: en cada respuesta usa los documentos activos que más se parecen a la pregunta."
              />
            )
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
            <AgentesIA
              agentes={agentesCliente}
              onChange={(next) => setAgentesByClient((prevState) => ({ ...prevState, [selectedClientId]: next }))}
              cerebro={cerebroActivo}
              cuenta={client.name}
            />
          )}
          {view === "metricas" && (
            <Metricas
              kpis={kpis}
              onAddPeriod={(row) => setKpisByClient((prevState) => ({
                ...prevState,
                [selectedClientId]: [...(prevState[selectedClientId] || []).filter((k) => k.period !== row.period), row].sort((a, b) => (a.period < b.period ? -1 : 1)),
              }))}
            />
          )}
        </main>
      </div>
      <BroditaChat mode={mode} client={client} onAccion={ejecutarAccion} docs={docsActivos} />
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
