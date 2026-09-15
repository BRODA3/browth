"use client";

import { useEffect, useState } from "react";
import { useBroda } from "./BrodaContext";
import type { PathKey } from "@/lib/setPath";

// Primitivas de layout "documento editorial" para las secciones de Broda
// (North Star, Business Case, Infraestructura, Estrategia y Plan de
// contenido). Nada de tarjetas apiladas ni texto centrado: secciones
// corridas separadas por una línea, alineadas a la izquierda, con la
// misma jerarquía tipográfica que el documento fuente.

/** Texto editable in situ: en modo lectura es texto plano; en modo edición
 * se vuelve un campo que graba directo en BrodaContext por `path`. */
export function Editable({
  path, value, className = "", multiline, as = "span",
}: { path: PathKey[]; value: string; className?: string; multiline?: boolean; as?: "span" | "div" }) {
  const { editMode, update } = useBroda();
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  if (!editMode) {
    const As = as;
    return <As className={className}>{value}</As>;
  }

  const commit = () => { if (local !== value) update(path, local); };
  const base = `bg-accent/[0.06] border border-dashed border-accent/60 rounded px-1.5 py-0.5 -mx-1.5 outline-none focus:border-accent focus:bg-accent/10 ${className}`;

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        rows={Math.max(2, Math.ceil(local.length / 70))}
        className={`${base} w-full resize-y block`}
      />
    );
  }
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      className={`${base} inline-block`}
      style={{ width: "100%", minWidth: `${Math.min(Math.max(local.length, 4), 60)}ch` }}
    />
  );
}

export function Section({
  title, subtitle, children, first,
}: { title: string; subtitle?: string; children: React.ReactNode; first?: boolean }) {
  return (
    <section className={`py-10 md:py-14 border-b border-border ${first ? "pt-0" : ""}`}>
      <h2 className="text-[clamp(26px,3.4vw,40px)] leading-[1.02] mb-3">{title}</h2>
      {subtitle && <p className="text-ink-soft text-[15px] leading-relaxed max-w-[66ch] mb-8">{subtitle}</p>}
      {children}
    </section>
  );
}

export function Nota({ titulo, texto, path }: { titulo: string; texto: string | string[]; path?: PathKey[] }) {
  const arr = Array.isArray(texto) ? texto : [texto];
  return (
    <div className="border border-accent px-6 py-5 mt-8">
      <h4 className="text-[17px] font-bold mb-2.5 normal-case tracking-normal font-display">
        {path ? <Editable path={[...path, "titulo"]} value={titulo} /> : titulo}
      </h4>
      {arr.map((t, i) => (
        <p key={i} className="text-ink-soft text-[14.5px] leading-relaxed max-w-[72ch] mt-2 first:mt-0">
          {path ? <Editable path={Array.isArray(texto) ? [...path, "texto", i] : [...path, "texto"]} value={t} multiline /> : t}
        </p>
      ))}
    </div>
  );
}

export function DocTable({
  headers, rows, highlightCol0, destacadas, paths,
}: { headers: string[]; rows: (string | React.ReactNode)[][]; highlightCol0?: boolean; destacadas?: number[]; paths?: (PathKey[] | null)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[560px]">
        <thead>
          <tr>{headers.map((h) => <th key={h} className="text-left font-display font-extrabold text-[11px] uppercase tracking-wide text-ink-faint pb-2.5 border-b border-border pr-6">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={destacadas?.includes(i) ? "text-accent" : ""}>
              {r.map((c, j) => {
                const p = paths?.[i]?.[j];
                return (
                  <td key={j} className={`py-3 pr-6 border-b border-border text-[14px] align-top last:pr-0 ${j === 0 && highlightCol0 ? "font-display font-extrabold" : "text-ink-soft"} ${destacadas?.includes(i) ? "font-semibold" : ""}`}>
                    {p ? <Editable path={p} value={String(c)} multiline={j > 0} /> : c}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-extrabold text-[10.5px] uppercase tracking-[0.1em] text-ink-faint mb-2">{children}</div>;
}
