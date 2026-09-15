"use client";

import { Section, Nota, DocTable, Eyebrow, Editable } from "./doc";
import { useBroda } from "./BrodaContext";

export default function BusinessCase() {
  const { data } = useBroda();
  const { ECONOMIA, PRECIOS, Q4 } = data;

  return (
    <div>
      <Section title="Cuánto cuesta un cliente" subtitle={ECONOMIA.bajada} first>
        <DocTable
          headers={["Concepto", "ARS / cliente", "Nota"]}
          rows={ECONOMIA.filas}
          paths={ECONOMIA.filas.map((_, i) => [["ECONOMIA", "filas", i, 0], ["ECONOMIA", "filas", i, 1], ["ECONOMIA", "filas", i, 2]])}
        />
        <div className="mt-6 border border-border">
          {ECONOMIA.totales.map((t, i) => (
            <div key={i} className={`flex justify-between gap-4 px-5 py-3 text-[14px] ${i < ECONOMIA.totales.length - 1 ? "border-b border-border" : ""} ${t.destacado ? "bg-accent text-accent-ink font-display font-extrabold" : ""}`}>
              <span><Editable path={["ECONOMIA", "totales", i, "concepto"]} value={t.concepto} /></span>
              <span className="tabular font-semibold"><Editable path={["ECONOMIA", "totales", i, "valor"]} value={t.valor} /></span>
            </div>
          ))}
        </div>
        <Nota titulo={ECONOMIA.nota.titulo} texto={ECONOMIA.nota.texto} path={["ECONOMIA", "nota"]} />
      </Section>

      <Section title="Los tres precios">
        <div className="flex flex-col">
          {PRECIOS.filas.map((f, i) => (
            <div key={i} className={`flex flex-col md:flex-row md:items-baseline gap-1.5 md:gap-6 py-4 ${i < PRECIOS.filas.length - 1 ? "border-b border-border" : ""}`}>
              <span className={`font-display font-extrabold uppercase text-[15px] w-56 shrink-0 ${f.destacado ? "text-accent" : "text-ink"}`}><Editable path={["PRECIOS", "filas", i, "celdas", 0]} value={f.celdas[0]} /></span>
              <span className="tabular font-semibold text-ink-soft w-36 shrink-0"><Editable path={["PRECIOS", "filas", i, "celdas", 1]} value={f.celdas[1]} /></span>
              <p className="text-[13.5px] text-ink-faint m-0 flex-1"><Editable path={["PRECIOS", "filas", i, "celdas", 2]} value={f.celdas[2]} multiline /></p>
            </div>
          ))}
        </div>
        <Nota titulo={PRECIOS.nota.titulo} texto={PRECIOS.nota.texto} path={["PRECIOS", "nota"]} />
      </Section>

      <Section title="El camino a dos millones">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border mb-8">
          {Q4.cifras.map((c, i) => (
            <div key={i} className="bg-bg p-4">
              <div className={`font-display font-black text-[28px] ${c.on ? "text-accent" : "text-ink"}`}><Editable path={["Q4", "cifras", i, "n"]} value={c.n} /></div>
              <div className="text-[10.5px] text-ink-faint mt-1.5 leading-snug"><Editable path={["Q4", "cifras", i, "l"]} value={c.l} multiline /></div>
            </div>
          ))}
        </div>
        <DocTable
          headers={Q4.tabla.encabezados}
          rows={Q4.tabla.filas}
          destacadas={Q4.tabla.filasDestacadas}
          paths={Q4.tabla.filas.map((_, i) => [["Q4", "tabla", "filas", i, 0], ["Q4", "tabla", "filas", i, 1], ["Q4", "tabla", "filas", i, 2]])}
        />
        <Nota titulo={Q4.nota.titulo} texto={Q4.nota.texto} path={["Q4", "nota"]} />
      </Section>

      <Section title="El plan, mes a mes">
        <div className="flex flex-col gap-8">
          {Q4.meses.map((m, mi) => (
            <div key={mi}>
              <div className="flex items-baseline gap-3 flex-wrap mb-3">
                <Eyebrow><Editable path={["Q4", "meses", mi, "nombre"]} value={m.nombre} /></Eyebrow>
                <span className="text-accent text-[13px] font-medium"><Editable path={["Q4", "meses", mi, "foco"]} value={m.foco} /></span>
              </div>
              <ul className="flex flex-col">
                {m.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-4 text-[13.5px] py-2.5 border-b border-border last:border-none">
                    <span className="text-ink-soft flex-1"><Editable path={["Q4", "meses", mi, "items", i, 0]} value={it[0]} multiline /></span>
                    <span className="text-ink-faint shrink-0"><Editable path={["Q4", "meses", mi, "items", i, 1]} value={it[1]} /></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
