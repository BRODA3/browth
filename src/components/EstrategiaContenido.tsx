"use client";

import { Section, Nota, DocTable, Eyebrow, Editable } from "./doc";
import ContentFunnel from "./ContentFunnel";
import { useBroda } from "./BrodaContext";

export default function EstrategiaContenido() {
  const { data } = useBroda();
  const { ESTRATEGIA } = data;

  return (
    <div>
      <Section title="Estrategia de contenido" subtitle={ESTRATEGIA.bajada} first>
        <Eyebrow>A quién le hablamos</Eyebrow>
        <DocTable
          headers={["Quién", "Descripción", "Rol"]}
          rows={ESTRATEGIA.audiencia.map((a) => a.celdas)}
          highlightCol0
          paths={ESTRATEGIA.audiencia.map((_, i) => [["ESTRATEGIA", "audiencia", i, "celdas", 0], ["ESTRATEGIA", "audiencia", i, "celdas", 1], ["ESTRATEGIA", "audiencia", i, "celdas", 2]])}
        />
      </Section>

      <Section title="Las tres capas" subtitle="Mismo lenguaje visual que Infraestructura comercial: tocá cualquier capa para ver temas, formato y métrica.">
        <ContentFunnel />
      </Section>

      <Section title="El mes" subtitle="Cuatro semanas, cuatro videos y cuatro placas. El video manda: la placa acompaña el mismo tema.">
        <DocTable
          headers={ESTRATEGIA.ritmo.encabezados}
          rows={ESTRATEGIA.ritmo.filas}
          highlightCol0
          paths={ESTRATEGIA.ritmo.filas.map((_, i) => [["ESTRATEGIA", "ritmo", "filas", i, 0], ["ESTRATEGIA", "ritmo", "filas", i, 1], ["ESTRATEGIA", "ritmo", "filas", i, 2], ["ESTRATEGIA", "ritmo", "filas", i, 3]])}
        />
      </Section>

      <Section title="Reglas">
        <ul className="flex flex-col">
          {ESTRATEGIA.reglas.map((r, i) => (
            <li key={i} className="text-[14px] text-ink-soft py-3 border-b border-border last:border-none pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[15px] before:w-2 before:h-px before:bg-accent">
              <Editable path={["ESTRATEGIA", "reglas", i]} value={r} multiline />
            </li>
          ))}
        </ul>
        <Nota titulo={ESTRATEGIA.nota.titulo} texto={ESTRATEGIA.nota.texto} path={["ESTRATEGIA", "nota"]} />
      </Section>
    </div>
  );
}
