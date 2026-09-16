"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { enlacesWiki, TIPOS_DOC, type DocCerebro, type TipoDoc } from "@/lib/cerebro";

// Vista de grafo del cerebro, al estilo Obsidian: cada nota es un nodo, cada
// [[enlace]] una línea. Los nodos se acomodan solos con fuerzas (se repelen,
// los enlaces tiran) y se pueden arrastrar, buscar y abrir.

const COLOR_TIPO: Record<TipoDoc, string> = {
  marca: "#C8F542",
  oferta: "#4FD18A",
  icp: "#4F91E0",
  proceso: "#38B79E",
  objeciones: "#f87171",
  caso: "#8A6FE0",
  nota: "#8a8a8a",
};

const COLOR_TAG = "#fbbf24";
const COLOR_ROTO = "#5c5c5c";

interface Nodo {
  id: string;
  label: string;
  clase: "doc" | "tag" | "roto";
  tipo?: TipoDoc;
  peso: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grados: number;
}

interface Arista { a: string; b: string }

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Etiquetas #asi, sin confundirlas con los títulos de Markdown. */
function tags(texto: string): string[] {
  const out = new Set<string>();
  for (const m of texto.matchAll(/(?:^|[\s(])#([A-Za-zÀ-ÿ][\w\/-]{1,40})/g)) out.add(m[1]);
  return [...out];
}

export default function GrafoCerebro({ docs, onAbrir }: { docs: DocCerebro[]; onAbrir: (id: string) => void }) {
  const [verTags, setVerTags] = useState(true);
  const [verRotos, setVerRotos] = useState(true);
  const [verSueltos, setVerSueltos] = useState(true);
  const [tamano, setTamano] = useState(1);
  const [distancia, setDistancia] = useState(150);
  const [busqueda, setBusqueda] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const [medida, setMedida] = useState({ w: 900, h: 520 });
  const nodosRef = useRef<Nodo[]>([]);
  const arrastre = useRef<{ id: string } | null>(null);
  const paneo = useRef<{ x: number; y: number } | null>(null);
  const [, redibujar] = useState(0);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setMedida({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const grafo = useMemo(() => {
    const porTitulo = new Map(docs.map((d) => [normalizar(d.titulo), d.id]));
    const nodos: Nodo[] = [];
    const aristas: Arista[] = [];
    const grados = new Map<string, number>();
    const sumar = (id: string) => grados.set(id, (grados.get(id) ?? 0) + 1);

    for (const d of docs) {
      nodos.push({
        id: d.id, label: d.titulo || "Sin título", clase: "doc", tipo: d.tipo,
        peso: Math.min(4, 1 + d.contenido.length / 3000),
        x: 0, y: 0, vx: 0, vy: 0, grados: 0,
      });
    }

    for (const d of docs) {
      for (const link of enlacesWiki(d.contenido)) {
        const destino = porTitulo.get(normalizar(link));
        if (destino) {
          if (destino !== d.id) { aristas.push({ a: d.id, b: destino }); sumar(d.id); sumar(destino); }
        } else if (verRotos) {
          const id = `roto:${normalizar(link)}`;
          if (!nodos.some((n) => n.id === id)) nodos.push({ id, label: link, clase: "roto", peso: 0.7, x: 0, y: 0, vx: 0, vy: 0, grados: 0 });
          aristas.push({ a: d.id, b: id }); sumar(d.id); sumar(id);
        }
      }
      if (verTags) {
        for (const t of tags(d.contenido)) {
          const id = `tag:${normalizar(t)}`;
          if (!nodos.some((n) => n.id === id)) nodos.push({ id, label: `#${t}`, clase: "tag", peso: 0.8, x: 0, y: 0, vx: 0, vy: 0, grados: 0 });
          aristas.push({ a: d.id, b: id }); sumar(d.id); sumar(id);
        }
      }
    }

    for (const n of nodos) n.grados = grados.get(n.id) ?? 0;
    const visibles = verSueltos ? nodos : nodos.filter((n) => n.grados > 0);
    const ids = new Set(visibles.map((n) => n.id));
    return { nodos: visibles, aristas: aristas.filter((e) => ids.has(e.a) && ids.has(e.b)) };
  }, [docs, verTags, verRotos, verSueltos]);

  // Arranque: posiciones en círculo y simulación de fuerzas hasta que se aquieta.
  useEffect(() => {
    const previas = new Map(nodosRef.current.map((n) => [n.id, n]));
    nodosRef.current = grafo.nodos.map((n, i) => {
      const vieja = previas.get(n.id);
      const ang = (i / Math.max(1, grafo.nodos.length)) * Math.PI * 2;
      return vieja
        ? { ...n, x: vieja.x, y: vieja.y, vx: 0, vy: 0 }
        : { ...n, x: Math.cos(ang) * 300 + (Math.random() - 0.5) * 40, y: Math.sin(ang) * 240 + (Math.random() - 0.5) * 40 };
    });

    let alpha = 1;
    let raf = 0;
    const paso = (pintar = true) => {
      const ns = nodosRef.current;
      // Repulsión entre todos los nodos.
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i], b = ns[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
          const f = (4600 * alpha) / d2;
          const d = Math.sqrt(d2);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }
      // Resortes de los enlaces.
      const idx = new Map(ns.map((n) => [n.id, n]));
      for (const e of grafo.aristas) {
        const a = idx.get(e.a), b = idx.get(e.b);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = ((d - distancia) * 0.035 * alpha) / d;
        a.vx += dx * f; a.vy += dy * f;
        b.vx -= dx * f; b.vy -= dy * f;
      }
      // Gravedad al centro + rozamiento.
      for (const n of ns) {
        if (arrastre.current?.id === n.id) { n.vx = 0; n.vy = 0; continue; }
        n.vx -= n.x * 0.009 * alpha;
        n.vy -= n.y * 0.009 * alpha;
        n.vx *= 0.82; n.vy *= 0.82;
        n.x += n.vx; n.y += n.vy;
      }
      alpha *= 0.985;
      if (pintar) {
        redibujar((t) => t + 1);
        if (alpha > 0.02) raf = requestAnimationFrame(() => paso());
      }
    };

    // Primero se acomoda sin pintar (rápido y sin depender del navegador),
    // después se anima el resto para que se vea vivo.
    for (let i = 0; i < 90 && alpha > 0.25; i++) paso(false);
    redibujar((t) => t + 1);
    raf = requestAnimationFrame(() => paso());
    return () => cancelAnimationFrame(raf);
  }, [grafo, distancia]);

  const aMundo = (ev: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (ev.clientX - r.left - r.width / 2 - pan.x) / zoom, y: (ev.clientY - r.top - r.height / 2 - pan.y) / zoom };
  };

  useEffect(() => {
    const mover = (ev: PointerEvent) => {
      if (arrastre.current) {
        const n = nodosRef.current.find((x) => x.id === arrastre.current!.id);
        if (n) { const p = aMundo(ev); n.x = p.x; n.y = p.y; redibujar((t) => t + 1); }
      } else if (paneo.current) {
        setPan({ x: ev.clientX - paneo.current.x, y: ev.clientY - paneo.current.y });
      }
    };
    const soltar = () => { arrastre.current = null; paneo.current = null; };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
  });

  const vecinos = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    for (const e of grafo.aristas) {
      if (e.a === hover) set.add(e.b);
      if (e.b === hover) set.add(e.a);
    }
    return set;
  }, [hover, grafo.aristas]);

  const coincide = (n: Nodo) => busqueda.trim() !== "" && normalizar(n.label).includes(normalizar(busqueda));
  const colorDe = (n: Nodo) => (n.clase === "tag" ? COLOR_TAG : n.clase === "roto" ? COLOR_ROTO : COLOR_TIPO[n.tipo ?? "nota"]);
  const radio = (n: Nodo) => (5 + n.peso * 2.5 + Math.min(n.grados, 6) * 1.1) * tamano;
  const ns = nodosRef.current;
  const idx = new Map(ns.map((n) => [n.id, n]));

  return (
    <div className="relative rounded-[var(--r-lg)] border border-border bg-surface-2/40 overflow-hidden" style={{ height: 520 }}>
      <svg
        ref={svgRef}
        width="100%" height="100%"
        className="block w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(ev) => { if (ev.target === ev.currentTarget) paneo.current = { x: ev.clientX - pan.x, y: ev.clientY - pan.y }; }}
        onWheel={(ev) => setZoom((z) => Math.min(2.5, Math.max(0.3, +(z * (ev.deltaY > 0 ? 0.92 : 1.08)).toFixed(3))))}
      >
        <g transform={`translate(${medida.w / 2 + pan.x} ${medida.h / 2 + pan.y}) scale(${zoom})`}>
          {grafo.aristas.map((e, i) => {
            const a = idx.get(e.a), b = idx.get(e.b);
            if (!a || !b) return null;
            const apagado = vecinos && !(vecinos.has(e.a) && vecinos.has(e.b));
            return (
              <line
                key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={b.clase === "roto" || a.clase === "roto" ? COLOR_ROTO : "rgba(255,255,255,0.18)"}
                strokeWidth={1} strokeDasharray={a.clase === "roto" || b.clase === "roto" ? "3 3" : undefined}
                opacity={apagado ? 0.12 : 1}
              />
            );
          })}

          {ns.map((n) => {
            const apagado = (vecinos && !vecinos.has(n.id)) || (busqueda.trim() !== "" && !coincide(n));
            const r = radio(n);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                opacity={apagado ? 0.2 : 1}
                className="cursor-pointer"
                onPointerDown={(ev) => { ev.stopPropagation(); arrastre.current = { id: n.id }; }}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onClick={() => n.clase === "doc" && onAbrir(n.id)}
              >
                <circle
                  r={r}
                  fill={n.clase === "roto" ? "none" : colorDe(n)}
                  stroke={colorDe(n)}
                  strokeWidth={n.clase === "roto" ? 1.2 : 0}
                  strokeDasharray={n.clase === "roto" ? "2 2" : undefined}
                />
                {(zoom > 0.6 || n.grados > 2) && (
                  <text
                    y={r + 11} textAnchor="middle"
                    style={{ fontSize: 10 / Math.max(0.8, zoom * 0.9), fill: "var(--ink-soft)", fontFamily: "var(--font-inter)", pointerEvents: "none" }}
                  >
                    {n.label.length > 26 ? `${n.label.slice(0, 26)}…` : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-3 right-3 w-[208px] bg-surface/95 border border-border-strong rounded-[var(--r-md)] p-3 backdrop-blur-sm">
        <input
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nota…"
          className="w-full border border-border-strong rounded-[var(--r-sm)] bg-bg text-ink px-2 py-1.5 text-[11.5px] outline-none focus:border-accent mb-3"
        />
        <Interruptor label="Etiquetas" on={verTags} set={setVerTags} />
        <Interruptor label="Enlaces rotos" on={verRotos} set={setVerRotos} />
        <Interruptor label="Notas sueltas" on={verSueltos} set={setVerSueltos} />
        <Deslizador label="Tamaño" valor={tamano} min={0.6} max={2} paso={0.1} set={setTamano} />
        <Deslizador label="Distancia" valor={distancia} min={60} max={220} paso={10} set={setDistancia} />
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="flex-1 text-[10.5px] text-ink-soft hover:text-ink border border-border-strong rounded-[var(--r-sm)] py-1">
            Centrar
          </button>
          <span className="tabular text-[10.5px] text-ink-faint w-9 text-center">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[70%]">
        {TIPOS_DOC.filter((t) => docs.some((d) => d.tipo === t.id)).map((t) => (
          <span key={t.id} className="flex items-center gap-1.5 text-[10px] text-ink-faint bg-surface/80 border border-border rounded-full px-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR_TIPO[t.id] }} /> {t.label}
          </span>
        ))}
        {verTags && (
          <span className="flex items-center gap-1.5 text-[10px] text-ink-faint bg-surface/80 border border-border rounded-full px-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR_TAG }} /> Etiquetas
          </span>
        )}
      </div>

      <div className="absolute bottom-3 right-3 text-[10.5px] text-ink-faint bg-surface/80 border border-border rounded-full px-2.5 py-1">
        {grafo.nodos.length} nodos · {grafo.aristas.length} enlaces
      </div>
    </div>
  );
}

function Interruptor({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} className="flex items-center justify-between w-full mb-2 text-[11px] text-ink-soft">
      {label}
      <span className={`w-8 h-4 rounded-full border relative transition-colors ${on ? "bg-accent border-accent" : "bg-surface-3 border-border-strong"}`}>
        <span className={`absolute top-[1.5px] w-2.5 h-2.5 rounded-full transition-all ${on ? "left-[17px] bg-accent-ink" : "left-[2px] bg-ink-faint"}`} />
      </span>
    </button>
  );
}

function Deslizador({ label, valor, min, max, paso, set }: {
  label: string; valor: number; min: number; max: number; paso: number; set: (v: number) => void;
}) {
  return (
    <label className="block text-[11px] text-ink-soft mb-2">
      {label}
      <input
        type="range" min={min} max={max} step={paso} value={valor}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-[var(--accent)] mt-1"
      />
    </label>
  );
}
