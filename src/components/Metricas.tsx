"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, AreaChart } from "./ui";
import { KPI_FIELDS, METRICAS_DERIVADAS, derivadas, type KpiRow } from "@/lib/data";

// Métricas de la cuenta: lo que se carga (pauta, leads, reuniones, propuestas,
// cierres, ingresos) y lo que sale de dividirlo — costo por lead, CAC, ticket,
// ROAS y las conversiones del embudo, que es donde se ve el cuello.

const num = (v: number | null | undefined, dec = 0) =>
  v == null ? "—" : v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const money = (v: number | null | undefined) => (v == null ? "—" : `$${num(v)}`);
const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
const veces = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(2)}x`);

function delta(cur: number | null | undefined, prev: number | null | undefined) {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export default function Metricas({ kpis, onAddPeriod }: { kpis: KpiRow[]; onAddPeriod: (r: KpiRow) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [metrica, setMetrica] = useState<string>("leads");

  const latest = kpis[kpis.length - 1] ?? null;
  const prev = kpis.length > 1 ? kpis[kpis.length - 2] : null;

  if (!latest) {
    return (
      <Card>
        <CardHeader
          title="Sin datos todavía"
          sub="Cargá el primer período con la inversión en pauta y lo que pasó en el embudo. Con dos períodos ya se puede leer la tendencia."
        />
        <PeriodoForm draft={draft} setDraft={setDraft} onAddPeriod={onAddPeriod} />
      </Card>
    );
  }

  const d = derivadas(latest);
  const dPrev = prev ? derivadas(prev) : null;

  const embudo = [
    { label: "Leads", valor: latest.leads, conv: null as number | null },
    { label: "Reuniones", valor: latest.meetings, conv: d.tasaCalificacion },
    { label: "Propuestas", valor: latest.proposals, conv: latest.meetings && latest.proposals != null ? latest.proposals / latest.meetings : null },
    { label: "Cierres", valor: latest.closes, conv: d.tasaCierre },
  ];
  const tope = Math.max(1, latest.leads ?? 0);

  const serieDe = (k: string): (number | null)[] => {
    if (KPI_FIELDS.some((f) => f.k === k)) return kpis.map((r) => (r as unknown as Record<string, number | null>)[k]);
    return kpis.map((r) => (derivadas(r) as unknown as Record<string, number | null>)[k]);
  };
  const tipoDe = (k: string) => METRICAS_DERIVADAS.find((m) => m.k === k)?.tipo;
  const formatoDe = (k: string) => {
    const t = tipoDe(k);
    if (t === "pct") return (n: number) => `${(n * 100).toFixed(0)}%`;
    if (t === "veces") return (n: number) => `${n.toFixed(1)}x`;
    if (t === "moneda" || k === "adSpend" || k === "revenue") return (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
    return undefined;
  };
  const etiquetaMetrica =
    KPI_FIELDS.find((f) => f.k === metrica)?.l ?? METRICAS_DERIVADAS.find((m) => m.k === metrica)?.l ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Inversión en pauta" value={money(latest.adSpend)} delta={delta(latest.adSpend, prev?.adSpend)} icon="◈" />
        <StatCard label="Leads" value={num(latest.leads)} delta={delta(latest.leads, prev?.leads)} icon="◎" />
        <StatCard label="Costo por lead" value={money(d.cpl)} delta={delta(d.cpl, dPrev?.cpl)} icon="$" />
        <StatCard label="ROAS" value={veces(d.roas)} delta={delta(d.roas, dPrev?.roas)} accent="var(--accent)" icon="↗" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cierres" value={num(latest.closes)} delta={delta(latest.closes, prev?.closes)} icon="✓" />
        <StatCard label="Costo por cliente" value={money(d.cac)} delta={delta(d.cac, dPrev?.cac)} icon="◉" />
        <StatCard label="Ticket promedio" value={money(d.ticket)} delta={delta(d.ticket, dPrev?.ticket)} icon="▤" />
        <StatCard label="Lead → cliente" value={pct(d.leadACliente)} delta={delta(d.leadACliente, dPrev?.leadACliente)} icon="%" />
      </div>

      <Lectura latest={latest} d={d} dPrev={dPrev} embudo={embudo} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4">
        <Card>
          <CardHeader
            title="Tendencia"
            sub={`${etiquetaMetrica} por período · ${kpis.length} ${kpis.length === 1 ? "período cargado" : "períodos cargados"}`}
            right={
              <select
                value={metrica}
                onChange={(e) => setMetrica(e.target.value)}
                className="border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-1.5 text-[12px] outline-none focus:border-accent"
              >
                <optgroup label="Cargadas">
                  {KPI_FIELDS.map((f) => <option key={f.k} value={f.k}>{f.l}</option>)}
                </optgroup>
                <optgroup label="Calculadas">
                  {METRICAS_DERIVADAS.map((m) => <option key={m.k} value={m.k}>{m.l}</option>)}
                </optgroup>
              </select>
            }
          />
          <AreaChart
            points={serieDe(metrica)}
            labels={kpis.map((r) => r.period.slice(2))}
            color="var(--accent)"
            height={210}
            valueFormat={formatoDe(metrica)}
          />
        </Card>

        <Card>
          <CardHeader title="El embudo del período" sub={`${latest.period} · dónde se cae la gente`} />
          <div className="flex flex-col gap-4">
            {embudo.map((e) => (
              <div key={e.label}>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-[12.5px] text-ink-soft">{e.label}</span>
                  <span className="tabular text-[14px] font-bold">{num(e.valor)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${Math.max(2, ((e.valor ?? 0) / tope) * 100)}%`, background: "var(--accent)" }}
                  />
                </div>
                {e.conv != null && (
                  <div className="text-[10.5px] text-ink-faint mt-1">{pct(e.conv)} del paso anterior</div>
                )}
              </div>
            ))}
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
          <table className="w-full border-collapse tabular min-w-[860px]">
            <thead>
              <tr>
                <Th>Período</Th>
                {KPI_FIELDS.map((f) => <Th key={f.k}>{f.l}</Th>)}
                <Th>CPL</Th><Th>CAC</Th><Th>ROAS</Th>
              </tr>
            </thead>
            <tbody>
              {[...kpis].reverse().map((r) => {
                const x = derivadas(r);
                return (
                  <tr key={r.period} className="hover:bg-surface-2/60 transition-colors">
                    <Td className="font-semibold text-ink">{r.period}</Td>
                    <Td>{money(r.adSpend)}</Td>
                    <Td>{num(r.leads)}</Td>
                    <Td>{num(r.meetings)}</Td>
                    <Td>{num(r.proposals)}</Td>
                    <Td>{num(r.closes)}</Td>
                    <Td>{money(r.revenue)}</Td>
                    <Td>{money(x.cpl)}</Td>
                    <Td>{money(x.cac)}</Td>
                    <Td className={x.roas != null && x.roas < 1 ? "text-critical" : "text-accent"}>{veces(x.roas)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/** Lectura automática: lo que un growth lead diría mirando estos números. */
function Lectura({
  latest, d, dPrev, embudo,
}: {
  latest: KpiRow;
  d: ReturnType<typeof derivadas>;
  dPrev: ReturnType<typeof derivadas> | null;
  embudo: { label: string; valor: number | null; conv: number | null }[];
}) {
  const lineas: { texto: string; tono: "bien" | "ojo" | "mal" }[] = [];

  if (d.roas != null) {
    if (d.roas < 1) lineas.push({ texto: `La pauta no se paga sola: por cada peso invertido vuelven ${d.roas.toFixed(2)}. O sube el ticket, o baja el costo por cliente.`, tono: "mal" });
    else if (d.roas < 2) lineas.push({ texto: `ROAS de ${d.roas.toFixed(2)}x: se sostiene, pero no alcanza para escalar. El margen se lo come la entrega.`, tono: "ojo" });
    else lineas.push({ texto: `ROAS de ${d.roas.toFixed(2)}x. Hay lugar para subir inversión mientras el costo por cliente no se mueva.`, tono: "bien" });
  }

  if (d.cpl != null && dPrev?.cpl != null) {
    const v = ((d.cpl - dPrev.cpl) / dPrev.cpl) * 100;
    if (v > 15) lineas.push({ texto: `El costo por lead subió ${v.toFixed(0)}%. Antes de tocar presupuesto, revisá fatiga de creativos.`, tono: "ojo" });
    if (v < -15) lineas.push({ texto: `El costo por lead bajó ${Math.abs(v).toFixed(0)}%. Es el momento de escalar lo que está funcionando.`, tono: "bien" });
  }

  if (d.cac != null && d.ticket != null && d.cac > d.ticket) {
    lineas.push({ texto: `Cada cliente cuesta ${money(d.cac)} y deja ${money(d.ticket)}: se pierde plata en cada venta salvo que recompre.`, tono: "mal" });
  }

  const conPeor = embudo.filter((e) => e.conv != null).sort((a, b) => (a.conv ?? 1) - (b.conv ?? 1))[0];
  if (conPeor?.conv != null) {
    lineas.push({ texto: `El cuello está en ${conPeor.label.toLowerCase()}: pasa el ${(conPeor.conv * 100).toFixed(0)}% del paso anterior. Es donde más rinde trabajar.`, tono: "ojo" });
  }

  if (latest.adSpend != null && latest.leads === 0) {
    lineas.push({ texto: "Hay inversión cargada y cero leads. O la campaña no está entregando, o los leads no se están registrando.", tono: "mal" });
  }

  if (lineas.length === 0) return null;
  const color = { bien: "var(--good)", ojo: "var(--warn)", mal: "var(--critical)" } as const;

  return (
    <Card>
      <CardHeader title="Cómo se lee esto" sub="Lectura automática de los números del último período." />
      <ul className="flex flex-col gap-2.5">
        {lineas.map((l, i) => (
          <li key={i} className="flex gap-2.5 text-[13.5px] text-ink-soft leading-snug">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: color[l.tono] }} />
            {l.texto}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PeriodoForm({
  draft, setDraft, onAddPeriod,
}: {
  draft: Record<string, string>;
  setDraft: (f: (d: Record<string, string>) => Record<string, string>) => void;
  onAddPeriod: (row: KpiRow) => void;
}) {
  const field = "border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-2.5 py-2 text-[13px] outline-none focus:border-accent";
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        <label className="flex flex-col gap-1.5 text-[10.5px] text-ink-faint">
          Período (AAAA-MM)
          <input value={draft.period || ""} onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))} placeholder="2026-09" className={field} />
        </label>
        {KPI_FIELDS.map((f) => (
          <label key={f.k} className="flex flex-col gap-1.5 text-[10.5px] text-ink-faint">
            {f.l}
            <input type="number" step="any" min={0} value={draft[f.k] || ""} onChange={(e) => setDraft((d) => ({ ...d, [f.k]: e.target.value }))} className={field} />
          </label>
        ))}
      </div>
      <button
        onClick={() => {
          if (!/^\d{4}-\d{2}$/.test(draft.period || "")) return;
          const row = { period: draft.period } as KpiRow;
          KPI_FIELDS.forEach((f) => {
            (row as unknown as Record<string, number | null>)[f.k] = draft[f.k] ? Number(draft[f.k]) : null;
          });
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-display font-extrabold text-[10px] uppercase tracking-[0.08em] text-ink-faint px-3 py-2.5 border-b border-border first:pl-5 last:pr-5 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 border-b border-border text-[13px] text-ink-soft align-middle first:pl-5 last:pr-5 whitespace-nowrap ${className}`}>{children}</td>;
}
