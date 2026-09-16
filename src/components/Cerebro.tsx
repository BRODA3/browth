"use client";

import { useRef, useState } from "react";
import { useBroda } from "./BrodaContext";
import { Card, CardHeader } from "./ui";
import GrafoCerebro from "./GrafoCerebro";
import {
  TIPOS_DOC, nuevoDoc, parsearMarkdown, enlacesWiki, buscarRelevantes, pesoTotal,
  type DocCerebro, type TipoDoc,
} from "@/lib/cerebro";

// El cerebro de Brodita: lo que sabe de memoria. Se escribe acá o se importan
// notas de Obsidian. Cada respuesta del chat usa los documentos activos que
// más se parecen a la pregunta.

export default function Cerebro() {
  const { data, update } = useBroda();
  const docs: DocCerebro[] = data.CEREBRO ?? [];
  const [selId, setSelId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [vista, setVista] = useState<"lista" | "grafo">("lista");
  const [prueba, setPrueba] = useState("");
  const archivos = useRef<HTMLInputElement>(null);
  const carpeta = useRef<HTMLInputElement>(null);

  const setDocs = (next: DocCerebro[]) => update(["CEREBRO"], next);
  const guardar = (d: DocCerebro) => setDocs(docs.map((x) => (x.id === d.id ? { ...d, actualizado: new Date().toISOString() } : x)));
  const sel = docs.find((d) => d.id === selId) ?? null;

  const activos = docs.filter((d) => d.activo);
  const peso = pesoTotal(activos);
  const relevantes = prueba.trim() ? buscarRelevantes(docs, prueba, 4) : [];

  async function importar(lista: FileList | null) {
    if (!lista) return;
    const mds = [...lista].filter((f) => /\.mdx?$/i.test(f.name));
    if (mds.length === 0) return;
    const nuevos: DocCerebro[] = [];
    for (const f of mds) {
      const texto = await f.text();
      const { titulo, contenido } = parsearMarkdown(f.name, texto);
      if (!contenido) continue;
      nuevos.push(nuevoDoc({ titulo, contenido, fuente: "obsidian", tipo: "nota" }));
    }
    // Una nota importada dos veces pisa a la anterior, no se duplica.
    const porTitulo = new Map(docs.map((d) => [d.titulo, d]));
    for (const n of nuevos) porTitulo.set(n.titulo, { ...(porTitulo.get(n.titulo) ?? n), ...n, id: porTitulo.get(n.titulo)?.id ?? n.id });
    setDocs([...porTitulo.values()]);
  }

  const visibles = filtro.trim()
    ? docs.filter((d) => `${d.titulo} ${d.contenido}`.toLowerCase().includes(filtro.toLowerCase()))
    : docs;

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <h2 className="text-[clamp(26px,3.4vw,40px)] leading-[1.02] mb-2">Cerebro de Brodita</h2>
        <p className="text-ink-soft text-[14.5px] max-w-[66ch]">
          Lo que Brodita sabe cuando le preguntás. Escribí acá adentro o importá tus notas de Obsidian: en cada respuesta usa los documentos activos que más se parecen a la pregunta.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Documentos" valor={String(docs.length)} />
        <Mini label="Activos en el chat" valor={String(activos.length)} />
        <Mini label="Peso del cerebro" valor={`${Math.round(peso / 1024)} KB`} />
        <Mini label="De Obsidian" valor={String(docs.filter((d) => d.fuente === "obsidian").length)} />
      </div>

      {peso > 1_500_000 && (
        <div className="border border-warn/40 bg-warn/[0.07] rounded-[var(--r-md)] p-3.5 text-[12.5px] text-warn">
          El cerebro pasó 1,5 MB. El navegador guarda hasta unos 5 MB: para un vault entero de Obsidian necesitamos la base de datos.
        </div>
      )}

      <Card padded={false}>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-5 pb-4">
          <CardHeader title="Documentos" sub="Tocá uno para editarlo. Apagá el interruptor y deja de usarse en el chat." />
          <div className="flex items-center gap-2 shrink-0">
            <input ref={archivos} type="file" accept=".md,.mdx" multiple hidden onChange={(e) => importar(e.target.files)} />
            <input
              ref={carpeta} type="file" hidden onChange={(e) => importar(e.target.files)}
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            />
            <Boton onClick={() => archivos.current?.click()}>Importar notas .md</Boton>
            <Boton onClick={() => carpeta.current?.click()}>Importar carpeta</Boton>
            <button
              onClick={() => { const d = nuevoDoc({ titulo: "Nota nueva" }); setDocs([...docs, d]); setSelId(d.id); }}
              className="bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors"
            >
              + Documento
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 px-5 pb-3">
          {(["lista", "grafo"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`font-display font-extrabold uppercase text-[10.5px] tracking-wide px-3.5 py-1.5 rounded-full border transition-colors ${vista === v ? "bg-accent text-accent-ink border-accent" : "text-ink-soft border-border-strong hover:text-ink"}`}
            >
              {v === "lista" ? "Lista" : "Grafo"}
            </button>
          ))}
        </div>

        {vista === "grafo" ? (
          <div className="px-5 pb-5">
            <GrafoCerebro docs={docs} onAbrir={(id) => { setVista("lista"); setSelId(id); }} />
            <p className="text-[11.5px] text-ink-faint mt-2.5">Cada nota es un nodo y cada enlace [[así]] una línea. Arrastrá los nodos, tocá uno para abrirlo y usá la rueda del mouse para acercarte.</p>
          </div>
        ) : (
        <>
        <div className="px-5 pb-4">
          <input
            value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar en el cerebro…"
            className="w-full border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
        </div>

        <div className="border-t border-border">
          {visibles.length === 0 && <p className="px-5 py-6 text-[13px] text-ink-faint italic">No hay documentos que coincidan.</p>}
          {visibles.map((d) => {
            const links = enlacesWiki(d.contenido);
            return (
              <div key={d.id} className={`flex items-center gap-3 px-5 py-3 border-b border-border last:border-none ${selId === d.id ? "bg-accent/[0.05]" : ""}`}>
                <button onClick={() => setSelId(selId === d.id ? null : d.id)} className="min-w-0 flex-1 text-left">
                  <div className="text-[13.5px] font-semibold text-ink truncate">{d.titulo || "Sin título"}</div>
                  <div className="text-[11px] text-ink-faint truncate">
                    {TIPOS_DOC.find((t) => t.id === d.tipo)?.label} · {Math.max(1, Math.round(d.contenido.length / 1024))} KB
                    {d.fuente === "obsidian" && " · Obsidian"}
                    {links.length > 0 && ` · ${links.length} enlaces`}
                  </div>
                </button>
                <button
                  onClick={() => guardar({ ...d, activo: !d.activo })}
                  title={d.activo ? "Activo en el chat" : "Apagado"}
                  className={`shrink-0 w-9 h-5 rounded-full border transition-colors relative ${d.activo ? "bg-accent border-accent" : "bg-surface-3 border-border-strong"}`}
                >
                  <span className={`absolute top-[2px] w-3.5 h-3.5 rounded-full transition-all ${d.activo ? "left-[18px] bg-accent-ink" : "left-[2px] bg-ink-faint"}`} />
                </button>
              </div>
            );
          })}
        </div>
        </>
        )}
      </Card>

      {sel && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="eyebrow">Documento</span>
            <button onClick={() => setSelId(null)} className="text-ink-faint hover:text-ink text-[16px] leading-none">×</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mb-3">
            <input
              value={sel.titulo} onChange={(e) => guardar({ ...sel, titulo: e.target.value })} placeholder="Título"
              className="w-full bg-transparent border-none outline-none font-display font-extrabold text-[20px] text-ink placeholder:text-ink-faint"
            />
            <select
              value={sel.tipo} onChange={(e) => guardar({ ...sel, tipo: e.target.value as TipoDoc })}
              className="border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent"
            >
              {TIPOS_DOC.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <textarea
            value={sel.contenido} onChange={(e) => guardar({ ...sel, contenido: e.target.value })} rows={16}
            placeholder="Escribí acá lo que Brodita tiene que saber. Acepta Markdown y enlaces [[así]]."
            className="w-full border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-accent resize-y font-sans"
          />
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-[11px] text-ink-faint">
              {sel.contenido.length.toLocaleString("es-AR")} caracteres · {sel.fuente === "obsidian" ? "importado de Obsidian" : "escrito acá"}
            </span>
            <button
              onClick={() => { if (confirm(`¿Borrar "${sel.titulo}" del cerebro?`)) { setDocs(docs.filter((d) => d.id !== sel.id)); setSelId(null); } }}
              className="text-[12px] text-critical hover:underline"
            >
              Borrar del cerebro
            </button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Probar el cerebro" sub="Escribí una pregunta y mirá qué documentos usaría Brodita para responderla." />
        <input
          value={prueba} onChange={(e) => setPrueba(e.target.value)} placeholder="Ej: ¿cómo respondo que somos caros?"
          className="w-full border border-border-strong rounded-[var(--r-md)] bg-bg text-ink px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        {relevantes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {relevantes.map((d) => (
              <span key={d.id} className="text-[11px] px-2.5 py-1 rounded-full border border-accent/40 text-accent bg-accent/[0.08]">{d.titulo}</span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Mini({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-surface border border-border rounded-[var(--r-lg)] p-4">
      <div className="text-[11.5px] text-ink-soft truncate">{label}</div>
      <div className="tabular font-extrabold text-[24px] leading-none tracking-tight mt-2">{valor}</div>
    </div>
  );
}

function Boton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border border-border-strong rounded-[var(--r-md)] px-3 py-2 text-[11.5px] text-ink-soft hover:text-ink hover:border-ink-faint transition-colors">
      {children}
    </button>
  );
}
