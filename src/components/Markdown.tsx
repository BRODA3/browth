"use client";

// Markdown mínimo para los informes de los agentes: títulos, listas, tablas,
// negritas y links. Arma elementos de React (nunca innerHTML), así un informe
// que trae texto de webs de terceros no puede inyectar nada en la página.

function enLinea(texto: string, key: string): React.ReactNode[] {
  const partes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1]) partes.push(<strong key={`${key}-${i++}`} className="text-ink font-semibold">{m[1]}</strong>);
    else {
      const href = m[3] ?? m[4];
      partes.push(
        <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 break-all">
          {m[2] ?? href.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)}
        </a>
      );
    }
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

export default function Markdown({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: React.ReactNode[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const k = `b${i}`;
    if (!l.trim()) continue;

    if (l.trim().startsWith("|")) {
      const filas: string[][] = [];
      while (i < lineas.length && lineas[i].trim().startsWith("|")) {
        const celdas = lineas[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!celdas.every((c) => /^:?-{2,}:?$/.test(c))) filas.push(celdas);
        i++;
      }
      i--;
      const [cab, ...cuerpo] = filas;
      bloques.push(
        <div key={k} className="overflow-x-auto my-3">
          <table className="w-full text-[12px] border-collapse min-w-[640px]">
            <thead>
              <tr>{cab.map((c, j) => <th key={j} className="text-left font-display font-extrabold uppercase text-[10px] tracking-wide text-ink-faint border-b border-border-strong px-2 py-2">{enLinea(c, `${k}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {cuerpo.map((f, r) => (
                <tr key={r} className="border-b border-border align-top">
                  {f.map((c, j) => <td key={j} className="px-2 py-2 text-ink-soft leading-snug">{enLinea(c, `${k}${r}${j}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const nivel = h[1].length;
      bloques.push(
        nivel <= 2
          ? <h3 key={k} className="font-display font-extrabold text-[16px] mt-6 mb-2 normal-case tracking-tight">{enLinea(h[2], k)}</h3>
          : <h4 key={k} className="font-display font-extrabold text-[13px] mt-4 mb-1.5 normal-case">{enLinea(h[2], k)}</h4>
      );
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const items: string[] = [];
      while (i < lineas.length && /^\s*([-*]|\d+\.)\s+/.test(lineas[i])) {
        items.push(lineas[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      i--;
      bloques.push(
        <ul key={k} className="list-disc pl-5 my-2 flex flex-col gap-1 text-[13px] text-ink-soft leading-relaxed">
          {items.map((it, j) => <li key={j}>{enLinea(it, `${k}${j}`)}</li>)}
        </ul>
      );
      continue;
    }

    bloques.push(<p key={k} className="text-[13px] text-ink-soft leading-relaxed my-2">{enLinea(l, k)}</p>);
  }

  return <div>{bloques}</div>;
}
