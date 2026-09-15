"use client";

import { ECONOMIA, PRECIOS, Q4 } from "@/lib/broda";

export default function BusinessCase() {
  return (
    <>
      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-0.5">Cuánto cuesta un cliente</h2>
        <p className="text-ink-soft text-[12.5px] mb-4 max-w-[75ch]">{ECONOMIA.bajada}</p>
        <table className="w-full border-collapse">
          <thead><tr><th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border">Concepto</th><th className="text-right font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border">ARS / cliente</th><th className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border pl-4">Nota</th></tr></thead>
          <tbody>
            {ECONOMIA.filas.map((f, i) => (
              <tr key={i}>
                <td className="py-2.5 border-b border-border text-[13px] text-ink-soft">{f[0]}</td>
                <td className="py-2.5 border-b border-border text-[13px] text-ink tabular text-right font-semibold">{f[1]}</td>
                <td className="py-2.5 border-b border-border text-[12px] text-ink-faint pl-4">{f[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          {ECONOMIA.totales.map((t, i) => (
            <div key={i} className={`flex justify-between gap-4 px-4 py-3 text-[13px] ${i < ECONOMIA.totales.length - 1 ? "border-b border-border" : ""} ${t.destacado ? "bg-accent text-accent-ink font-display font-extrabold" : ""}`}>
              <span>{t.concepto}</span>
              <span className="tabular font-semibold">{t.valor}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-l-[3px] border-accent pl-4 py-1">
          <div className="font-display font-bold text-sm normal-case tracking-normal mb-1.5">{ECONOMIA.nota.titulo}</div>
          {ECONOMIA.nota.texto.map((t, i) => <p key={i} className="text-ink-soft text-[13px] mt-1.5 max-w-[75ch]">{t}</p>)}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-3">Los tres precios</h2>
        <div className="flex flex-col gap-3">
          {PRECIOS.filas.map((f, i) => (
            <div key={i} className={`rounded-lg p-4 border ${f.destacado ? "border-accent bg-accent/10" : "border-border"}`}>
              <div className="flex justify-between items-baseline gap-3 flex-wrap mb-1">
                <span className={`font-display font-extrabold uppercase text-sm ${f.destacado ? "text-accent" : "text-ink"}`}>{f.celdas[0]}</span>
                <span className="tabular font-semibold text-ink-soft">{f.celdas[1]}</span>
              </div>
              <p className="text-[12.5px] text-ink-faint m-0">{f.celdas[2]}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-l-[3px] border-accent pl-4 py-1">
          <div className="font-display font-bold text-sm normal-case tracking-normal mb-1.5">{PRECIOS.nota.titulo}</div>
          {PRECIOS.nota.texto.map((t, i) => <p key={i} className="text-ink-soft text-[13px] mt-1.5 max-w-[75ch]">{t}</p>)}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
        <h2 className="text-xl m-0 mb-3">El camino a dos millones</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {Q4.cifras.map((c, i) => (
            <div key={i} className="border border-border rounded-lg p-3.5 text-center">
              <div className={`font-display font-black text-2xl ${c.on ? "text-accent" : "text-ink"}`}>{c.n}</div>
              <div className="text-[10.5px] text-ink-faint mt-1.5 leading-snug">{c.l}</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead><tr>{Q4.tabla.encabezados.map((h) => <th key={h} className="text-left font-display font-extrabold text-[10px] uppercase tracking-wide text-ink-faint pb-2 border-b border-border pr-4">{h}</th>)}</tr></thead>
            <tbody>
              {Q4.tabla.filas.map((f, i) => (
                <tr key={i} className={Q4.tabla.filasDestacadas.includes(i) ? "bg-accent/10" : ""}>
                  {f.map((c, j) => <td key={j} className={`py-2.5 pr-4 border-b border-border text-[13px] last:border-none ${j === 0 ? "text-ink-soft" : "tabular text-ink font-semibold"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-l-[3px] border-accent pl-4 py-1">
          <div className="font-display font-bold text-sm normal-case tracking-normal mb-1.5">{Q4.nota.titulo}</div>
          {Q4.nota.texto.map((t, i) => <p key={i} className="text-ink-soft text-[13px] mt-1.5 max-w-[75ch]">{t}</p>)}
        </div>
      </div>

      {Q4.meses.map((m) => (
        <div key={m.nombre} className="rounded-xl border border-border bg-panel-raised shadow-lg p-5 mb-4">
          <div className="flex items-baseline gap-3 flex-wrap mb-3">
            <h2 className="text-xl m-0">{m.nombre}</h2>
            <span className="text-accent text-[13px] font-medium">{m.foco}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {m.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3 text-[13px] border-b border-border last:border-none pb-2 last:pb-0">
                <span className="text-ink-soft">{it[0]}</span>
                <span className="text-ink-faint shrink-0">{it[1]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
