"use client";

import { useState } from "react";
import { Section, Nota, DocTable, Editable } from "./doc";
import { useBroda } from "./BrodaContext";
import FlujoCapa from "./FlujoCapa";
import { type EstadoCapa, type CapaEmbudo } from "@/lib/broda";

// Embudo plano copiado del documento original de Broda: tres capas que se
// angostan hasta el cuello (Convertir, en lima) y tres que se abren punteadas.

const LIMA = "#C8F542";
const ESTADO_COLOR: Record<EstadoCapa, string> = { hecho: "#8a8a8a", foco: LIMA, falta: LIMA };

const X0 = 120, XN1 = 540, XN2 = 720, X1 = 1140;
const YT = 110, YB = 510, NT = 250, NB = 370;
const FILLS = ["#2f2f2f", "#3a3a3a", "#454545"];

const yTop = (x: number) => YT + ((x - X0) / (XN1 - X0)) * (NT - YT);
const yBot = (x: number) => YB - ((x - X0) / (XN1 - X0)) * (YB - NB);
const yTopD = (x: number) => NT - ((x - XN2) / (X1 - XN2)) * (NT - YT);
const yBotD = (x: number) => NB + ((x - XN2) / (X1 - XN2)) * (YB - NB);

const LABEL = { fontSize: 18, letterSpacing: "0.02em", fontWeight: 900, textTransform: "uppercase" as const };
const TAG = { fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-inter)" };
const ROL = { fontSize: 12, fontWeight: 700, fontFamily: "var(--font-inter)", fill: LIMA };
const ZONA = { fontSize: 13, fontWeight: 700, fontFamily: "var(--font-inter)", fill: "#5c5c5c", letterSpacing: "0.08em" };

function EmbudoSVG({ capas, meta, open, onPick }: {
  capas: CapaEmbudo[];
  meta: { entradas: string[]; zonaIzq: string; zonaDer: string; loop: string };
  open: string | null;
  onPick: (id: string) => void;
}) {
  const izq = capas.slice(0, 3), cuello = capas[3], der = capas.slice(4);
  const wI = (XN1 - X0) / izq.length, wD = (X1 - XN2) / der.length;
  const ncx = (XN1 + XN2) / 2;

  const rol = (c: CapaEmbudo, cx: number) => (
    <>
      <text x={cx} y={548} textAnchor="middle" style={ROL}>{c.quien}</text>
      {open === c.id && <rect x={cx - 22} y={558} width={44} height={2.5} fill={LIMA} />}
    </>
  );

  return (
    <svg viewBox="0 0 1200 660" className="w-full h-auto block" role="img" aria-label={`Embudo comercial: ${capas.map((c) => c.nombre).join(", ")}`}>
      {meta.entradas.map((e, i) => (
        <text key={e} x={12} y={86 + i * 32} style={{ ...TAG, fill: "#8d8d8d" }}>{e}</text>
      ))}
      <g stroke="#4a4a4a" strokeWidth={1.5} fill="none">
        <path d="M78 80 L118 120" /><path d="M78 112 L118 132" />
        <path d="M78 144 L118 148" /><path d="M78 176 L118 164" />
      </g>

      {izq.map((c, i) => {
        const a = X0 + i * wI, b = X0 + (i + 1) * wI, cx = (a + b) / 2;
        const dashed = c.estado === "falta";
        return (
          <g key={c.id} className="cursor-pointer hover:opacity-85" onClick={() => onPick(c.id)}>
            <polygon
              points={`${a},${yTop(a)} ${b},${yTop(b)} ${b},${yBot(b)} ${a},${yBot(a)}`}
              fill={dashed ? "rgba(0,0,0,0)" : FILLS[i]} stroke={dashed ? LIMA : "#4a4a4a"}
              strokeWidth={dashed ? 1.5 : 1} strokeDasharray={dashed ? "5 5" : undefined}
            />
            <text className="font-display" style={LABEL} fill={dashed ? LIMA : "#ffffff"} transform={`rotate(-90 ${cx} 310)`} x={cx} y={316} textAnchor="middle">{c.nombre}</text>
            {rol(c, cx)}
          </g>
        );
      })}

      {cuello && (
        <g className="cursor-pointer hover:opacity-90" onClick={() => onPick(cuello.id)}>
          <rect x={XN1} y={NT} width={XN2 - XN1} height={NB - NT} fill={LIMA} />
          <text className="font-display" style={LABEL} fill="#111111" x={ncx} y={303} textAnchor="middle">{cuello.nombre}</text>
          {cuello.sub && <text x={ncx} y={326} textAnchor="middle" style={{ ...TAG, fill: "#111111" }}>{cuello.sub}</text>}
          {rol(cuello, ncx)}
        </g>
      )}

      {der.map((c, i) => {
        const a = XN2 + i * wD, b = XN2 + (i + 1) * wD, cx = (a + b) / 2;
        const dashed = c.estado === "falta";
        return (
          <g key={c.id} className="cursor-pointer hover:opacity-85" onClick={() => onPick(c.id)}>
            <polygon
              points={`${a},${yTopD(a)} ${b},${yTopD(b)} ${b},${yBotD(b)} ${a},${yBotD(a)}`}
              fill={dashed ? "rgba(0,0,0,0)" : "#3a3a3a"} stroke={LIMA} strokeWidth={1.5}
              strokeDasharray={dashed ? "5 5" : undefined}
            />
            <text className="font-display" style={LABEL} fill={LIMA} transform={`rotate(-90 ${cx} 310)`} x={cx} y={316} textAnchor="middle">{c.nombre}</text>
            {rol(c, cx)}
          </g>
        );
      })}

      <path d="M1120 578 C 950 640, 380 640, 175 583" fill="none" stroke={LIMA} strokeWidth={1.5} strokeDasharray="4 6" />
      <polygon points="175,583 190,588 186,574" fill={LIMA} />
      <text x={640} y={634} textAnchor="middle" style={{ ...TAG, fill: "#8d8d8d" }}>{meta.loop}</text>
      <text x={(X0 + XN1) / 2} y={46} textAnchor="middle" style={ZONA}>{meta.zonaIzq}</text>
      <line x1={X0} y1={58} x2={XN1} y2={58} stroke="#3a3a3a" />
      <text x={(XN2 + X1) / 2} y={46} textAnchor="middle" style={ZONA}>{meta.zonaDer}</text>
      <line x1={XN2} y1={58} x2={X1} y2={58} stroke="#3a3a3a" />
    </svg>
  );
}

export default function InfraFunnel() {
  const { data } = useBroda();
  const { CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION } = data;
  const [open, setOpen] = useState<string | null>("convertir");
  const activeIdx = open ? CAPAS.findIndex((c) => c.id === open) : -1;
  const activeCapa = activeIdx >= 0 ? CAPAS[activeIdx] : null;

  return (
    <div>
      <Section title="Infraestructura comercial" subtitle="El sistema que convierte atención en ventas. No es contenido: es lo que pasa después de que alguien levanta la mano, y es lo único que hacemos que produce un número defendible." first>
        <div className="w-full border border-[#2b2b2b] bg-[#171717] px-2 py-5">
          <EmbudoSVG capas={CAPAS} meta={EMBUDO_META} open={open} onPick={(id) => setOpen(open === id ? null : id)} />
        </div>
        <div className="flex flex-wrap gap-6 mt-5 text-[13.5px] text-[#8d8d8d]">
          {EMBUDO_META.leyenda.map((l) => (
            <span key={l.tipo} className="flex items-center gap-2">
              <i
                className="inline-block w-3.5 h-3.5"
                style={l.tipo === "hecho" ? { background: "#2f2f2f", border: "1px solid #4a4a4a" } : l.tipo === "foco" ? { background: LIMA } : { border: `1.5px dashed ${LIMA}` }}
              />
              {l.texto}
            </span>
          ))}
          <span className="ml-auto text-[12px]">Tocá una capa para ver su proceso</span>
        </div>

        {activeCapa && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="mb-4">
              <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint">Capa {activeCapa.n} · <Editable path={["CAPAS", activeIdx, "quien"]} value={activeCapa.quien} /></div>
              <h3 className="text-2xl m-0 normal-case tracking-normal" style={{ color: ESTADO_COLOR[activeCapa.estado] }}>
                <Editable path={["CAPAS", activeIdx, "nombre"]} value={activeCapa.nombre} />
                {activeCapa.sub != null && <> — <Editable path={["CAPAS", activeIdx, "sub"]} value={activeCapa.sub} /></>}
              </h3>
            </div>
            <FlujoCapa capaId={activeCapa.id} dueno={activeCapa.quien} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-5 mt-8 pt-8 border-t border-border">
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Proceso</div>
                <ul className="flex flex-col gap-1.5">
                  {activeCapa.proceso.map((p, i) => (
                    <li key={i} className="text-[13.5px] text-ink-soft pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[10px] before:w-1.5 before:h-px before:bg-accent">
                      <Editable path={["CAPAS", activeIdx, "proceso", i]} value={p} multiline />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-display font-extrabold text-[10.5px] uppercase tracking-wider text-ink-faint mb-2">Tareas</div>
                <ul className="flex flex-col gap-1.5">
                  {activeCapa.tareas.map((t, i) => (
                    <li key={i} className="text-[13.5px] text-ink-soft pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[10px] before:w-1.5 before:h-px before:bg-accent">
                      <Editable path={["CAPAS", activeIdx, "tareas", i]} value={t} multiline />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-l-[3px] pl-4 py-1 text-[13.5px] text-ink-soft" style={{ borderColor: ESTADO_COLOR[activeCapa.estado] }}>
              <Editable path={["CAPAS", activeIdx, "estadoTexto"]} value={activeCapa.estadoTexto} multiline />
            </div>
          </div>
        )}

        <Nota titulo={EMBUDO_META.nota.titulo} texto={EMBUDO_META.nota.texto} path={["EMBUDO_META", "nota"]} />
      </Section>

      <Section title="En qué orden se construye" subtitle="Una capa por vez. Saltar de la 01 a la 06 es lo que hace que el sistema no arranque nunca.">
        <DocTable
          headers={ORDEN_CONSTRUCCION.encabezados}
          rows={ORDEN_CONSTRUCCION.filas}
          paths={ORDEN_CONSTRUCCION.filas.map((_, i) => [["ORDEN_CONSTRUCCION", "filas", i, 0], ["ORDEN_CONSTRUCCION", "filas", i, 1], ["ORDEN_CONSTRUCCION", "filas", i, 2]])}
        />
        <Nota titulo={ORDEN_CONSTRUCCION.nota.titulo} texto={ORDEN_CONSTRUCCION.nota.texto} path={["ORDEN_CONSTRUCCION", "nota"]} />
      </Section>
    </div>
  );
}
