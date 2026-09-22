"use client";

import { useState } from "react";
import { Card, CardHeader, Pill } from "./ui";
import { useBroda } from "./BrodaContext";
import { CATEGORIAS, completar, nuevoPrompt, type CategoriaPrompt, type Prompt } from "@/lib/prompts";

// Banco de prompts de BRODA: lo que el equipo le pega a Claude, a un proyecto de
// cliente o a un lead. Se copia con un clic, se edita en la página y Brodita
// puede usarlos y guardar los nuevos que definan juntos.

const inputCls = "w-full border border-border-strong rounded-[var(--r-md)] bg-surface-2 text-ink px-3 py-2 text-[13px] outline-none focus:border-accent";
const btn = "border border-border-strong text-ink-soft hover:text-ink font-display font-extrabold uppercase text-[10.5px] px-3 py-2 rounded-[var(--r-md)] transition-colors";

export default function Prompts({ cuenta }: { cuenta?: string }) {
  const { data, update } = useBroda();
  const prompts: Prompt[] = data.PROMPTS ?? [];

  const [selId, setSelId] = useState<string | null>(prompts[0]?.id ?? null);
  const [filtro, setFiltro] = useState<CategoriaPrompt | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const visibles = prompts.filter((p) =>
    (!filtro || p.categoria === filtro) &&
    (!busqueda || `${p.titulo} ${p.cuando} ${p.contenido}`.toLowerCase().includes(busqueda.toLowerCase()))
  );
  const sel = prompts.find((p) => p.id === selId) ?? visibles[0] ?? null;

  const guardar = (p: Prompt) => update(["PROMPTS"], prompts.map((x) => (x.id === p.id ? { ...p, actualizado: new Date().toISOString() } : x)));
  const crear = () => {
    const p = nuevoPrompt();
    update(["PROMPTS"], [...prompts, p]);
    setSelId(p.id);
    setEditando(true);
  };
  const borrar = (p: Prompt) => {
    if (!confirm(`¿Borrar "${p.titulo}"? No se puede deshacer.`)) return;
    update(["PROMPTS"], prompts.filter((x) => x.id !== p.id));
    setSelId(null);
    setEditando(false);
  };
  const copiar = (p: Prompt) => {
    navigator.clipboard.writeText(completar(p.contenido, cuenta)).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const color = (c: CategoriaPrompt) => CATEGORIAS.find((x) => x.id === c)?.color ?? "var(--accent)";
  const label = (c: CategoriaPrompt) => CATEGORIAS.find((x) => x.id === c)?.label ?? c;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[clamp(24px,3vw,34px)] leading-[1.02] mb-1.5">Banco de prompts</h2>
          <p className="text-ink-soft text-[13.5px] max-w-[70ch]">
            Lo que le pedimos a Claude, siempre igual: el pedido a los proyectos de cliente, el cuestionario, los primeros contactos.
            Donde dice <code className="text-accent">[CLIENTE]</code> se completa solo con la cuenta activa al copiar.
          </p>
        </div>
        <button onClick={crear} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">
          + Prompt
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Pill active={!filtro} onClick={() => setFiltro(null)}>Todos ({prompts.length})</Pill>
        {CATEGORIAS.map((c) => {
          const n = prompts.filter((p) => p.categoria === c.id).length;
          return n > 0 ? <Pill key={c.id} color={c.color} active={filtro === c.id} onClick={() => setFiltro(c.id)}>{c.label} ({n})</Pill> : null;
        })}
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar…"
          className={`${inputCls} ml-auto max-w-[220px]`}
        />
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
        <Card padded={false}>
          <div className="flex flex-col max-h-[70vh] overflow-y-auto">
            {visibles.length === 0 && <div className="text-ink-faint text-[12.5px] p-4">No hay prompts con ese filtro.</div>}
            {visibles.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelId(p.id); setEditando(false); }}
                className={`text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${sel?.id === p.id ? "bg-accent/[0.08]" : "hover:bg-surface-2"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color(p.categoria) }} />
                  <span className="text-[12.5px] font-semibold text-ink truncate">{p.titulo}</span>
                </div>
                <div className="text-[11px] text-ink-faint mt-1 line-clamp-2 leading-snug">{p.cuando || p.contenido.slice(0, 80)}</div>
              </button>
            ))}
          </div>
        </Card>

        {sel ? (
          <Card>
            {editando ? (
              <div className="flex flex-col gap-3">
                <input value={sel.titulo} onChange={(e) => guardar({ ...sel, titulo: e.target.value })} className={inputCls} placeholder="Título" />
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIAS.map((c) => (
                    <Pill key={c.id} color={c.color} active={sel.categoria === c.id} onClick={() => guardar({ ...sel, categoria: c.id })}>{c.label}</Pill>
                  ))}
                </div>
                <input value={sel.cuando} onChange={(e) => guardar({ ...sel, cuando: e.target.value })} className={inputCls} placeholder="Cuándo se usa y dónde se pega" />
                <textarea
                  value={sel.contenido}
                  onChange={(e) => guardar({ ...sel, contenido: e.target.value })}
                  rows={22}
                  className={`${inputCls} font-mono text-[12px] leading-relaxed`}
                  placeholder="El prompt. Usá [CLIENTE] donde va el nombre de la cuenta."
                />
                <div className="flex justify-between">
                  <button onClick={() => borrar(sel)} className={`${btn} text-[#fca5a5] border-[#f87171]/40`}>Borrar</button>
                  <button onClick={() => setEditando(false)} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)]">Listo</button>
                </div>
              </div>
            ) : (
              <>
                <CardHeader
                  title={sel.titulo}
                  sub={sel.cuando}
                  right={
                    <div className="flex gap-2">
                      <button onClick={() => setEditando(true)} className={btn}>✎ Editar</button>
                      <button onClick={() => copiar(sel)} className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors">
                        {copiado ? "✓ Copiado" : "⧉ Copiar"}
                      </button>
                    </div>
                  }
                />
                <div className="flex items-center gap-2 mb-3">
                  <Pill color={color(sel.categoria)} active>{label(sel.categoria)}</Pill>
                  {sel.contenido.includes("[CLIENTE]") && (
                    <span className="text-[11px] text-ink-faint">
                      Al copiar, <code className="text-accent">[CLIENTE]</code> se reemplaza por {cuenta ? <b className="text-ink">{cuenta}</b> : "la cuenta activa (elegí una en Clientes)"}.
                    </span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-[12px] text-ink-soft leading-relaxed font-[inherit] bg-surface-2/50 border border-border rounded-[var(--r-md)] p-4 max-h-[60vh] overflow-y-auto">
                  {completar(sel.contenido, cuenta)}
                </pre>
              </>
            )}
          </Card>
        ) : (
          <Card>
            <div className="text-center text-ink-faint text-[13px] py-16">Elegí un prompt de la lista o creá uno nuevo.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
