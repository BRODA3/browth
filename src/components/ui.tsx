"use client";

// Primitivas de dashboard: tarjetas, KPIs, chips de variación y gráficos.
// Todo comparte el mismo radio, padding y jerarquía tipográfica para que
// la app se lea como un solo sistema y no como pantallas sueltas.

export function Card({
  children, className = "", padded = true,
}: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`bg-surface border border-border rounded-[var(--r-lg)] ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title, sub, right,
}: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="text-[17px] leading-tight m-0 normal-case tracking-tight font-display font-extrabold">{title}</h2>
        {sub && <p className="text-[12.5px] text-ink-faint mt-1 max-w-[62ch]">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/** Variación porcentual con flecha, como en los KPI del referente. */
export function Delta({ value, suffix = "vs. período anterior" }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="text-[11.5px] text-ink-faint">primer período</span>;
  const up = value > 0.5;
  const down = value < -0.5;
  const color = up ? "text-good" : down ? "text-critical" : "text-ink-faint";
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${color}`}>
      <Arrow dir={up ? "up" : down ? "down" : "flat"} />
      <span className="tabular">{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
      <span className="text-ink-faint font-normal">{suffix}</span>
    </span>
  );
}

function Arrow({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "flat") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  const up = dir === "up";
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: up ? undefined : "scaleY(-1)" }}>
      <path d="M2 7.5 L5 2.5 L8 7.5 Z" fill="currentColor" />
    </svg>
  );
}

/** Tarjeta de KPI: etiqueta chica arriba, número grande, variación abajo. */
export function StatCard({
  label, value, unit, delta, accent, icon,
}: {
  label: string; value: React.ReactNode; unit?: string;
  delta?: number | null; accent?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-[var(--r-lg)] p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        {icon && <span className="w-6 h-6 rounded-[var(--r-sm)] bg-surface-3 flex items-center justify-center text-[11px]">{icon}</span>}
        <span className="text-[11.5px] text-ink-soft truncate">{label}</span>
      </div>
      <div className="tabular font-extrabold text-[26px] leading-none tracking-tight mt-1" style={accent ? { color: accent } : undefined}>
        {value}{unit && <span className="text-[16px] font-bold ml-0.5">{unit}</span>}
      </div>
      {delta !== undefined && <div className="mt-0.5"><Delta value={delta} /></div>}
    </div>
  );
}

export function Pill({
  children, color, active, onClick,
}: { children: React.ReactNode; color?: string; active?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-[10.5px] font-extrabold uppercase tracking-wide border transition-colors"
      style={{
        borderColor: active ? (color || "var(--accent)") : "var(--border-strong)",
        color: active ? (color || "var(--accent)") : "var(--ink-soft)",
        background: active ? `color-mix(in srgb, ${color || "var(--accent)"} 12%, transparent)` : "transparent",
      }}
    >
      {children}
    </Tag>
  );
}

/** Donut con métrica al centro (patrón del referente). */
export function Donut({
  segments, centerValue, centerLabel, size = 180,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string; centerLabel: string; size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  const gap = 2.5; // separación entre segmentos, en unidades de arco
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const dash = Math.max(len - gap, 0);
          const el = (
            <circle
              key={i}
              cx="90" cy="90" r={r} fill="none"
              stroke={s.color} strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="tabular font-extrabold text-[26px] leading-none tracking-tight">{centerValue}</div>
        <div className="text-[11px] text-ink-faint mt-1">{centerLabel}</div>
      </div>
    </div>
  );
}

/** Área con degradado + punto final destacado, estilo referente. */
export function AreaChart({
  points, labels, color = "var(--accent)", height = 170, valueFormat,
}: {
  points: (number | null)[]; labels: string[]; color?: string; height?: number;
  valueFormat?: (n: number) => string;
}) {
  const w = 640;
  const padL = 46, padR = 16, padT = 16, padB = 26;
  const known = points.filter((v): v is number => v != null);
  if (known.length === 0) return <p className="text-ink-faint text-[12.5px] italic py-6">Sin datos para esta métrica.</p>;

  const min = Math.min(...known, 0);
  const max = Math.max(...known);
  const range = max - min || 1;
  const stepX = (w - padL - padR) / Math.max(1, points.length - 1);
  const yOf = (v: number) => padT + (height - padT - padB) - ((v - min) / range) * (height - padT - padB);

  const pts: [number, number][] = [];
  points.forEach((v, i) => { if (v != null) pts.push([padL + i * stepX, yOf(v)]); });

  // curva suave (catmull-rom simplificado a bézier)
  let d = "";
  pts.forEach(([x, y], i) => {
    if (i === 0) { d += `M${x},${y}`; return; }
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    d += ` C${cx},${py} ${cx},${y} ${x},${y}`;
  });
  const baseY = padT + (height - padT - padB);
  const area = pts.length ? `${d} L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z` : "";
  const last = pts[pts.length - 1];
  const gradId = `area-grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((g) => {
        const y = baseY - (g / 3) * (height - padT - padB);
        const val = min + (g / 3) * range;
        return (
          <g key={g}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-faint)" className="tabular">
              {valueFormat ? valueFormat(val) : Math.round(val).toLocaleString("es-AR")}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="6" fill={color} opacity="0.25" />
          <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
        </>
      )}
      {labels.map((l, i) => (
        <text key={i} x={padL + i * stepX} y={height - 7} textAnchor="middle" fontSize="9.5" fill="var(--ink-faint)" className="tabular">{l}</text>
      ))}
    </svg>
  );
}

/** Barra de progreso horizontal con etiqueta, para coberturas. */
export function ProgressRow({
  label, pct, color, meta,
}: { label: string; pct: number; color: string; meta?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12.5px] w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
      <span className="tabular text-[12px] font-semibold w-10 text-right" style={{ color }}>{pct}%</span>
      {meta && <span className="text-[11px] text-ink-faint w-28 shrink-0">{meta}</span>}
    </div>
  );
}
