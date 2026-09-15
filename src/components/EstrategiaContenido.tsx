"use client";

import { Section, Nota, DocTable, Eyebrow } from "./doc";
import { ESTRATEGIA } from "@/lib/broda";

export default function EstrategiaContenido() {
  return (
    <div>
      <Section title="Estrategia de contenido" subtitle={ESTRATEGIA.bajada} first>
        <Eyebrow>A quién le hablamos</Eyebrow>
        <DocTable headers={["Quién", "Descripción", "Rol"]} rows={ESTRATEGIA.audiencia.map((a) => a.celdas)} highlightCol0 />
      </Section>

      <Section title="Las tres capas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ESTRATEGIA.embudo.map((e) => (
            <div key={e.capa}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display font-black text-lg text-accent">{e.capa}</span>
                <span className="text-[11px] text-ink-faint">{e.pilar} · {e.peso}</span>
              </div>
              <p className="text-[13.5px] text-ink-soft mb-3">{e.trabajo}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {e.temas.map((t) => <span key={t} className="text-[10.5px] px-2 py-1 rounded-md border border-border-strong text-ink-faint">{t}</span>)}
              </div>
              <div className="text-[11.5px] text-ink-faint border-t border-border pt-2.5">
                <div><b className="text-ink-soft font-semibold">Formato:</b> {e.formato}</div>
                <div className="mt-1"><b className="text-ink-soft font-semibold">Métrica:</b> {e.metrica}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="El mes" subtitle="Cuatro semanas, cuatro videos y cuatro placas. El video manda: la placa acompaña el mismo tema.">
        <DocTable headers={ESTRATEGIA.ritmo.encabezados} rows={ESTRATEGIA.ritmo.filas} highlightCol0 />
      </Section>

      <Section title="Reglas">
        <ul className="flex flex-col">
          {ESTRATEGIA.reglas.map((r, i) => (
            <li key={i} className="text-[14px] text-ink-soft py-3 border-b border-border last:border-none pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[15px] before:w-2 before:h-px before:bg-accent">{r}</li>
          ))}
        </ul>
        <Nota titulo={ESTRATEGIA.nota.titulo} texto={ESTRATEGIA.nota.texto} />
      </Section>
    </div>
  );
}
