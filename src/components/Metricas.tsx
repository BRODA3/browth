"use client";

import { useState } from "react";
import { Card, CardHeader, Delta } from "./ui";
import { KPI_FIELDS, METRICAS_DERIVADAS, derivadas, type KpiRow } from "@/lib/data";

// Overview de la cuenta: los números que importan, con su tendencia al lado.
// Hoy se cargan a mano; cuando estén conectadas las fuentes (Meta Ads, el CRM)
// esta misma pantalla se llena sola.

const num = (v: number | null | undefined, dec = 0) =>
  v == null ? "—" : v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const money = (v: number | null | undefined) => (v == null ? "—" : `$${num(v)}`);
const moneyCorto = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${Math.round(v)}`);
const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
const veces = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(2)}x`);

function delta(cur: number | null | undefined, prev: number | null | undefined) {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

const FUENTES = [
  { nombre: "Meta Ads", detalle: "Inversión, CPL y creativos" },
  { nombre: "CRM", detalle: "Leads, reuniones y cierres" },
  { nombre: "Analytics", detalle: "Tráfico y conversiones web" },
];

export default function Metricas({ kpis, onAddPeriod }: { kpis: KpiRow[]; onAddPeriod: (r: KpiRow) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [verHistorico, setVerHistorico] = useState(false);
  const [metrica, setMetrica] = useState<string>("cpl");

  const latest = kpis[kpis.length - 1] ?? null;
  const prev = kpis.length > 1 ? kpis[kpis.length - 2] : null;
  const d = latest ? derivadas(latest) : null;
  const dPrev = prev ? derivadas(prev) : null;

  const serieDe = (k: string): (number | null)[] =>
    KPI_FIELDS.some((f) => f.k === k)
      ? kpis.map((r) => (r as unknown as Record<string, number | null>)[k])
      : kpis.map((r) => (derivadas(r) as unknown as Record<string, number | null>)[k]);

  const tipoDe = (k: string) => METRICAS_DERIVADAS.find((m) => m.k === k)?.tipo;
  const formatoDe = (k: string) => {
    const t = tipoDe(k);
    if (t === "pct") return (n: number) => `${(n * 100).toFixed(0)}%`;
    if (t === "veces") return (n: number) => `${n.toFixed(1)}x`;
    if (t === "moneda" || k === "adSpend" || k === "revenue") return moneyCorto;
    return (n: number) => Math.round(n).toLocaleString("es-AR");
  };
  const etiquetaMetrica =
    KPI_FIELDS.find((f) => f.k === metrica)?.l ?? METRICAS_DERIVADAS.find((m) => m.k === metrica)?.l ?? "";

  const embudo = latest
    ? [
        { label: "Leads", valor: latest.leads, conv: null as number | null },
        { label: "Reuniones", valor: latest.meetings, conv: d!.tasaCalificacion },
        { label: "Propuestas", valor: latest.proposals, conv: latest.meetings && latest.proposals != null ? latest.proposals / latest.meetings : null },
        { label: "Cierres", valor: latest.closes, conv: d!.tasaCierre },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera del overview */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1.5">Overview</div>
          <h2 className="text-[clamp(22px,2.6vw,30px)] leading-none m-0">
            {latest ? latest.period : "Sin período cargado"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-ink-faint">
            {kpis.length} {kpis.length === 1 ? "período" : "períodos"}
          </span>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="border border-border-strong rounded-[var(--r-md)] px-3.5 py-2 text-[11.5px] text-ink-soft hover:text-ink hover:border-ink-faint transition-colors"
          >
            {showForm ? "Cerrar" : "+ Período"}
          </button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Cargar período" sub="Mientras las fuentes no estén conectadas, se carga a mano. Cargar de nuevo un período lo sobrescribe." />
          <PeriodoForm draft={draft} setDraft={setDraft} onAddPeriod={(r) => { onAddPeriod(r); setShowForm(false); }} />
        </Card>
      )}

      {/* Los cuatro números que mandan, con su tendencia al lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Hero label="Inversión en pauta" valor={money(latest?.adSpend)} delta={delta(latest?.adSpend, prev?.adSpend)} serie={serieDe("adSpend")} invertido />
        <Hero label="Leads" valor={num(latest?.leads)} delta={delta(latest?.leads, prev?.leads)} serie={serieDe("leads")} />
        <Hero label="Costo por lead" valor={money(d?.cpl)} delta={delta(d?.cpl, dPrev?.cpl)} serie={serieDe("cpl")} invertido />
        <Hero label="ROAS" valor={veces(d?.roas)} delta={delta(d?.roas, dPrev?.roas)} serie={serieDe("roas")} destacado />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Chico label="Cierres" valor={num(latest?.closes)} delta={delta(latest?.closes, prev?.closes)} />
        <Chico label="Costo por cliente" valor={money(d?.cac)} delta={delta(d?.cac, dPrev?.cac)} invertido />
        <Chico label="Ticket promedio" valor={money(d?.ticket)} delta={delta(d?.ticket, dPrev?.ticket)} />
        <Chico label="Lead → cliente" valor={pct(d?.leadACliente)} delta={delta(d?.leadACliente, dPrev?.leadACliente)} />
      </div>

      {/* Plata que entra contra plata que sale */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <Card>
          <CardHeader
            title="Pauta e ingresos"
            sub="Lo que se invierte contra lo que vuelve, período a período."
            right={<Leyenda />}
          />
          {kpis.length === 0 ? (
            <Vacio alto={230} texto="Cargá un período para ver la comparación." />
          ) : (
            <Comparada
              a={{ nombre: "Inversión", valores: serieDe("adSpend"), color: "var(--ink-faint)" }}
              b={{ nombre: "Ingresos", valores: serieDe("revenue"), color: "var(--accent)" }}
              labels={kpis.map((r) => r.period.slice(2))}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="El embudo" sub={latest ? `${latest.period} · dónde se cae la gente` : "Sin datos"} />
          {!latest ? (
            <Vacio alto={230} texto="Sin datos del embudo." />
          ) : (
            <div className="flex flex-col gap-3.5">
              {embudo.map((e) => {
                const tope = Math.max(1, latest.leads ?? 0);
                return (
                  <div key={e.label}>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-[12.5px] text-ink-soft">{e.label}</span>
                      <span className="tabular text-[14px] font-bold">{num(e.valor)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(2, ((e.valor ?? 0) / tope) * 100)}%`, background: "var(--accent)" }} />
                    </div>
                    {e.conv != null && <div className="text-[10.5px] text-ink-faint mt-1">{pct(e.conv)} del paso anterior</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {latest && d && <Lectura latest={latest} d={d} dPrev={dPrev} embudo={embudo} />}

      {/* Tendencia de cualquier métrica */}
      <Card>
        <CardHeader
          title="Tendencia"
          sub={`${etiquetaMetrica} por período`}
          right={
            <select
              value={metrica}
              onChange={(e) => setMetrica(e.target.value)}
              className="border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-1.5 text-[12px] outline-none focus:border-accent"
            >
              <optgroup label="Calculadas">
                {METRICAS_DERIVADAS.map((m) => <option key={m.k} value={m.k}>{m.l}</option>)}
              </optgroup>
              <optgroup label="Cargadas">
                {KPI_FIELDS.map((f) => <option key={f.k} value={f.k}>{f.l}</option>)}
              </optgroup>
            </select>
          }
        />
        {kpis.length === 0 ? (
          <Vacio alto={200} texto="Sin datos todavía." />
        ) : (
          <Barras valores={serieDe(metrica)} labels={kpis.map((r) => r.period.slice(2))} formato={formatoDe(metrica)} />
        )}
      </Card>

      {/* Fuentes: de acá va a salir todo esto solo */}
      <Card>
        <CardHeader title="Fuentes de datos" sub="Conectadas, estos números dejan de cargarse a mano y se actualizan solos." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FUENTES.map((f) => (
            <div key={f.nombre} className="border border-border rounded-[var(--r-md)] p-3.5 bg-surface-2/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[13px]">{f.nombre}</span>
                <span className="text-[9.5px] font-display font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-border-strong text-ink-faint">Sin conectar</span>
              </div>
              <div className="text-[11.5px] text-ink-faint mt-1">{f.detalle}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* El histórico, que ya no es la pantalla principal */}
      <div>
        <button
          onClick={() => setVerHistorico((v) => !v)}
          className="text-[12px] text-ink-faint hover:text-ink border border-border-strong rounded-[var(--r-md)] px-3.5 py-2 transition-colors"
        >
          {verHistorico ? "Ocultar histórico" : `Ver histórico (${kpis.length})`}
        </button>

        {verHistorico && kpis.length > 0 && (
          <Card padded={false} className="mt-3">
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
        )}
      </div>
    </div>
  );
}

/* ---------------- Piezas del overview ---------------- */

function Hero({
  label, valor, delta: dlt, serie, destacado, invertido,
}: {
  label: string; valor: string; delta: number | null; serie: (number | null)[]; destacado?: boolean; invertido?: boolean;
}) {
  return (
    <div className={`rounded-[var(--r-lg)] border p-5 flex flex-col gap-1 min-w-0 ${destacado ? "border-accent/40 bg-accent/[0.05]" : "border-border bg-surface"}`}>
      <span className="text-[11.5px] text-ink-soft truncate">{label}</span>
      <div className="tabular font-extrabold text-[30px] leading-none tracking-tight mt-1" style={destacado ? { color: "var(--accent)" } : undefined}>
        {valor}
      </div>
      <div className="mt-2"><Delta value={invertido && dlt != null ? -dlt : dlt} suffix={invertido ? "vs. anterior (menos es mejor)" : "vs. período anterior"} /></div>
      <Sparkline valores={serie} color={destacado ? "var(--accent)" : "var(--ink-soft)"} />
    </div>
  );
}

function Chico({ label, valor, delta: dlt, invertido }: { label: string; valor: string; delta: number | null; invertido?: boolean }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-border bg-surface p-4 min-w-0">
      <div className="text-[11.5px] text-ink-soft truncate">{label}</div>
      <div className="tabular font-extrabold text-[22px] leading-none tracking-tight mt-1.5">{valor}</div>
      <div className="mt-1.5"><Delta value={invertido && dlt != null ? -dlt : dlt} suffix="" /></div>
    </div>
  );
}

/** Línea chiquita de tendencia, la que va adentro de cada tarjeta. */
function Sparkline({ valores, color }: { valores: (number | null)[]; color: string }) {
  const puntos = valores.filter((v): v is number => v != null);
  if (puntos.length < 2) return <div className="h-9 mt-2" />;
  const min = Math.min(...puntos), max = Math.max(...puntos);
  const rango = max - min || 1;
  const w = 220, h = 36;
  const paso = w / (puntos.length - 1);
  const d = puntos.map((v, i) => `${i === 0 ? "M" : "L"}${i * paso},${h - ((v - min) / rango) * (h - 6) - 3}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-2" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

/** Dos series en el mismo gráfico: lo que sale y lo que entra. */
function Comparada({
  a, b, labels,
}: {
  a: { nombre: string; valores: (number | null)[]; color: string };
  b: { nombre: string; valores: (number | null)[]; color: string };
  labels: string[];
}) {
  const w = 680, h = 240, padL = 52, padR = 14, padT = 14, padB = 26;
  const todos = [...a.valores, ...b.valores].filter((v): v is number => v != null);
  const max = Math.max(1, ...todos);
  const paso = (w - padL - padR) / Math.max(1, labels.length - 1);
  const y = (v: number) => padT + (h - padT - padB) - (v / max) * (h - padT - padB);

  const linea = (vals: (number | null)[]) =>
    vals.map((v, i) => (v == null ? "" : `${i === 0 ? "M" : "L"}${padL + i * paso},${y(v)}`)).join(" ");

  const area = (vals: (number | null)[]) => {
    const pts = vals.map((v, i) => (v == null ? null : [padL + i * paso, y(v)] as [number, number])).filter(Boolean) as [number, number][];
    if (pts.length === 0) return "";
    const base = h - padB;
    return `M${pts[0][0]},${base} ${pts.map(([x, yy]) => `L${x},${yy}`).join(" ")} L${pts[pts.length - 1][0]},${base} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="grad-ingresos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((g) => {
        const yy = padT + (h - padT - padB) * (1 - g / 3);
        return (
          <g key={g}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border)" />
            <text x={padL - 8} y={yy + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-faint)" className="tabular">
              {moneyCorto((max * g) / 3)}
            </text>
          </g>
        );
      })}
      <path d={area(b.valores)} fill="url(#grad-ingresos)" />
      <path d={linea(a.valores)} fill="none" stroke={a.color} strokeWidth={2} strokeDasharray="5 4" />
      <path d={linea(b.valores)} fill="none" stroke={b.color} strokeWidth={2.5} strokeLinejoin="round" />
      {labels.map((l, i) => (
        <text key={i} x={padL + i * paso} y={h - 7} textAnchor="middle" fontSize="9.5" fill="var(--ink-faint)" className="tabular">{l}</text>
      ))}
    </svg>
  );
}

function Leyenda() {
  return (
    <div className="flex items-center gap-3 text-[10.5px] text-ink-faint">
      <span className="flex items-center gap-1.5"><span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: "var(--ink-faint)" }} /> Inversión</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: "var(--accent)" }} /> Ingresos</span>
    </div>
  );
}

/** Barras por período, para la métrica que se elija. */
function Barras({ valores, labels, formato }: { valores: (number | null)[]; labels: string[]; formato: (n: number) => string }) {
  const w = 900, h = 220, padB = 30, padT = 24;
  const conocidos = valores.filter((v): v is number => v != null);
  const max = Math.max(1, ...conocidos);
  const ancho = Math.min(70, (w / Math.max(1, valores.length)) * 0.55);
  const paso = w / Math.max(1, valores.length);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <line x1={0} y1={h - padB} x2={w} y2={h - padB} stroke="var(--border)" />
      {valores.map((v, i) => {
        const cx = paso * i + paso / 2;
        if (v == null) return <text key={i} x={cx} y={h - padB - 8} textAnchor="middle" fontSize="10" fill="var(--ink-faint)">—</text>;
        const alto = Math.max(3, (v / max) * (h - padB - padT));
        const ultimo = i === valores.length - 1;
        return (
          <g key={i}>
            <rect
              x={cx - ancho / 2} y={h - padB - alto} width={ancho} height={alto} rx={5}
              fill={ultimo ? "var(--accent)" : "var(--surface-3)"}
              stroke={ultimo ? "var(--accent)" : "var(--border-strong)"}
            />
            <text x={cx} y={h - padB - alto - 7} textAnchor="middle" fontSize="10.5" fill={ultimo ? "var(--accent)" : "var(--ink-soft)"} className="tabular">
              {formato(v)}
            </text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={paso * i + paso / 2} y={h - 9} textAnchor="middle" fontSize="9.5" fill="var(--ink-faint)" className="tabular">{l}</text>
      ))}
    </svg>
  );
}

function Vacio({ alto, texto }: { alto: number; texto: string }) {
  return (
    <div className="flex items-center justify-center border border-dashed border-border-strong rounded-[var(--r-md)] text-[12.5px] text-ink-faint" style={{ height: alto }}>
      {texto}
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
