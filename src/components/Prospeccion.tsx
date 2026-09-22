"use client";

import { pedir } from "@/lib/api";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, StatCard, Pill } from "./ui";
import Markdown from "./Markdown";
import {
  CUESTIONARIO, ZONAS_SUGERIDAS, depurar, leadsACsv, perfilATexto,
  type AnalisisCompetencia, type Investigacion, type Lead, type PerfilProspeccion,
} from "@/lib/prospeccion";

// Agente de research de la cuenta: arma el perfil de búsqueda, trae empresas de
// Google Maps, investiga a cada una (decisor, contacto, score, gancho) y analiza
// la competencia. Lo que sirve pasa al CRM o al brain con un botón.

export type TabProspeccion = "perfil" | "leads" | "competencia";

export interface BusquedaEnCurso {
  runId: string;
  inicio: string;
  maximo: number;
}

/** Lo que Brodita le pide al agente: abrir una pestaña y, si corresponde, arrancar. */
export interface PedidoProspeccion {
  tab: TabProspeccion;
  arrancar: boolean;
}

const CONCURRENCIA = 3;

const lista = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const fmtFecha = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const inputCls = "w-full border border-border-strong rounded-[var(--r-md)] bg-surface-2 text-ink px-3 py-2 text-[13px] outline-none focus:border-accent";
const btnPrimario = "bg-accent text-accent-ink font-display font-extrabold uppercase text-[11px] px-4 py-2.5 rounded-[var(--r-md)] hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnSecundario = "border border-border-strong text-ink-soft hover:text-ink font-display font-extrabold uppercase text-[10.5px] px-3.5 py-2.5 rounded-[var(--r-md)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

const COLOR_CONFIANZA: Record<string, string> = { alta: "var(--accent)", media: "#fbbf24", baja: "#f87171" };
const COLOR_NIVEL: Record<string, string> = { directa: "#f87171", indirecta: "#fbbf24", sustituto: "#8A6FE0" };

export default function Prospeccion({
  cuenta, perfil, onPerfil, leads, onLeads, busqueda, onBusqueda,
  analisis, onAnalisis, cerebro, onPasarCrm, onGuardarInforme, pedido, onPedidoAtendido,
}: {
  cuenta: string;
  perfil: PerfilProspeccion;
  onPerfil: (p: PerfilProspeccion) => void;
  leads: Lead[];
  onLeads: (fn: (prev: Lead[]) => Lead[]) => void;
  busqueda: BusquedaEnCurso | null;
  onBusqueda: (b: BusquedaEnCurso | null) => void;
  analisis: AnalisisCompetencia[];
  onAnalisis: (fn: (prev: AnalisisCompetencia[]) => AnalisisCompetencia[]) => void;
  cerebro: string;
  onPasarCrm: (leads: Lead[]) => void;
  onGuardarInforme: (a: AnalisisCompetencia) => void;
  pedido: PedidoProspeccion | null;
  onPedidoAtendido: () => void;
}) {
  const [tab, setTab] = useState<TabProspeccion>(perfil.rubros.length ? "leads" : "perfil");
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [encontrados, setEncontrados] = useState(0);
  const [investigando, setInvestigando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [verAnalisis, setVerAnalisis] = useState<string | null>(null);
  const cortar = useRef(false);

  // Lo que va a costar la búsqueda, con el precio por empresa medido en corridas reales.
  const combinaciones = Math.min(perfil.rubros.length * perfil.zonas.length, 40);
  const maximo = combinaciones * perfil.porBusqueda;
  const estimado = maximo * 0.0065;

  const pendientes = leads.filter((l) => l.estado === "encontrado" || l.estado === "error");
  const investigados = leads.filter((l) => l.score != null);
  const visibles = [...leads].filter((l) => l.estado !== "descartado" && (l.score ?? 10) >= minScore)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  // Si se cortó una investigación a mitad de camino (recarga, cambio de vista), queda para retomar.
  useEffect(() => {
    if (leads.some((l) => l.estado === "investigando")) {
      onLeads((prev) => prev.map((l) => (l.estado === "investigando" ? { ...l, estado: "encontrado" } : l)));
    }
    return () => { cortar.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Búsqueda en Google Maps ---------------- */

  async function buscar(confirmado = false) {
    setError(null);
    if (!perfil.rubros.length || !perfil.zonas.length) {
      setTab("perfil");
      setError("Para buscar hacen falta al menos un rubro y una zona.");
      return;
    }
    // Cada empresa se paga: sin este aviso es fácil quemar el crédito del mes de un clic.
    if (!confirmado && !confirm(
      `Vas a buscar ${combinaciones} combinaciones de rubro y zona, hasta ${maximo} empresas.\n\n` +
      `Costo estimado en Apify: US$ ${estimado.toFixed(2)} (el plan gratis da US$ 5 por mes).\n\n` +
      `¿Lanzo la búsqueda?`
    )) return;
    try {
      const res = await pedir("/api/prospeccion/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubros: perfil.rubros, zonas: perfil.zonas, porBusqueda: perfil.porBusqueda }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onBusqueda({ runId: json.runId, inicio: new Date().toISOString(), maximo: json.maximo });
      setTab("leads");
      setAviso(`Buscando en Google Maps: ${json.busquedas} búsquedas, hasta ${json.maximo} empresas. Tarda unos minutos; podés seguir usando la app.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo lanzar la búsqueda.");
    }
  }

  /** Suma al listado lo que trajo una corrida, sin repetidos ni excluidos. */
  function guardarLeads(nuevos: Lead[], costoUsd?: number | null) {
    let sumados = 0;
    onLeads((prev) => {
      const limpios = depurar(nuevos, perfil, prev);
      sumados = limpios.length;
      return [...prev, ...limpios];
    });
    setAviso(`${sumados || nuevos.length} empresas nuevas${costoUsd != null ? ` · costo de Apify US$ ${Number(costoUsd).toFixed(2)}` : ""}. Ahora tocá "Investigar" para encontrar a los decisores.`);
  }

  /** Rescata una corrida vieja de Apify (por ejemplo, una que se cortó) sin volver a pagarla. */
  async function recuperar(runId: string) {
    setError(null);
    try {
      const res = await pedir(`/api/prospeccion/estado?run=${encodeURIComponent(runId.trim())}`);
      const json = await res.json();
      if (!res.ok || json.estado === "fallo") throw new Error(json.error ?? "No pude recuperar esa búsqueda.");
      if (json.estado === "corriendo") {
        onBusqueda({ runId: runId.trim(), inicio: new Date().toISOString(), maximo: 0 });
        setAviso("Esa búsqueda todavía está corriendo: la sigo desde acá.");
        return;
      }
      guardarLeads(json.leads as Lead[], json.costoUsd);
      if (json.estado === "parcial") setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude recuperar esa búsqueda.");
    }
  }

  // Consulta el estado de la búsqueda cada 8 segundos hasta que termina.
  useEffect(() => {
    if (!busqueda) return;
    let vivo = true;
    const consultar = async () => {
      try {
        const res = await pedir(`/api/prospeccion/estado?run=${busqueda.runId}`);
        const json = await res.json();
        if (!vivo) return;
        if (!res.ok || json.estado === "fallo") {
          setError(json.error ?? "La búsqueda falló.");
          onBusqueda(null);
          return;
        }
        if (json.estado === "corriendo") {
          setEncontrados(json.encontrados ?? 0);
          timer = setTimeout(consultar, 8000);
          return;
        }
        guardarLeads(json.leads as Lead[], json.costoUsd);
        onBusqueda(null);
        // "parcial": la corrida se cortó pero alcanzó a juntar empresas.
        if (json.estado === "parcial") setError(json.error);
      } catch {
        if (vivo) timer = setTimeout(consultar, 15000);
      }
    };
    let timer = setTimeout(consultar, 1500);
    return () => { vivo = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda?.runId]);

  /* ---------------- Investigación de cada lead ---------------- */

  async function investigarUno(lead: Lead) {
    onLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, estado: "investigando", error: undefined } : l)));
    try {
      const res = await pedir("/api/prospeccion/investigar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, perfil: perfilATexto(perfil), cuenta }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const inv = json.investigacion as Investigacion;
      onLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...inv, estado: "investigado" } : l)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error investigando";
      onLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, estado: "error", error: msg } : l)));
      if (/ANTHROPIC_API_KEY/.test(msg)) throw e;
    }
  }

  async function investigarPendientes(cuantos?: number) {
    setError(null);
    setInvestigando(true);
    cortar.current = false;
    const cola = [...pendientes].slice(0, cuantos ?? pendientes.length);
    try {
      const trabajador = async () => {
        while (cola.length && !cortar.current) await investigarUno(cola.shift()!);
      };
      await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));
      if (!cortar.current) setAviso("Investigación terminada. Revisá los de score alto y pasalos al CRM.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Se cortó la investigación.");
    } finally {
      setInvestigando(false);
    }
  }

  /* ---------------- Competencia ---------------- */

  async function analizarCompetencia() {
    setError(null);
    if (!perfil.oferta && !perfil.rubros.length) {
      setTab("perfil");
      setError("Para analizar la competencia completá al menos la oferta y el rubro de la cuenta.");
      return;
    }
    setAnalizando(true);
    try {
      const res = await pedir("/api/competencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuenta, perfil: perfilATexto(perfil), cerebro }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const a = json.analisis as AnalisisCompetencia;
      onAnalisis((prev) => [a, ...prev]);
      setVerAnalisis(a.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar la competencia.");
    } finally {
      setAnalizando(false);
    }
  }

  /* ---------------- Pedidos de Brodita ---------------- */

  // La pestaña se ajusta en el render; el efecto solo dispara el trabajo pedido.
  const [pedidoVisto, setPedidoVisto] = useState<PedidoProspeccion | null>(null);
  if (pedido && pedido !== pedidoVisto) {
    setPedidoVisto(pedido);
    setTab(pedido.tab);
  }

  useEffect(() => {
    if (!pedido) return;
    // En un timer con limpieza: si el efecto corre dos veces (StrictMode), se lanza una sola vez.
    const t = setTimeout(() => {
      onPedidoAtendido();
      if (!pedido.arrancar) return;
      if (pedido.tab === "leads" && !busqueda) buscar();
      if (pedido.tab === "competencia" && !analizando) analizarCompetencia();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  /* ---------------- Salidas ---------------- */

  function exportarCsv() {
    const blob = new Blob([leadsACsv(leads.filter((l) => l.estado !== "descartado"))], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Leads - ${cuenta} - ${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function pasarAlCrm() {
    const lote = leads.filter((l) => elegidos.has(l.id) && l.estado !== "en_crm");
    if (!lote.length) return;
    onPasarCrm(lote);
    onLeads((prev) => prev.map((l) => (elegidos.has(l.id) ? { ...l, estado: "en_crm" } : l)));
    setElegidos(new Set());
  }

  const toggle = (id: string) => setElegidos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const elegirBuenos = () => setElegidos(new Set(visibles.filter((l) => (l.score ?? 0) >= 7 && l.estado !== "en_crm").map((l) => l.id)));

  const conDecisor = leads.filter((l) => l.decisor).length;
  const conContacto = leads.filter((l) => l.email || l.whatsapp).length;
  const actual = analisis.find((a) => a.id === verAnalisis) ?? analisis[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[clamp(24px,3vw,34px)] leading-[1.02] mb-1.5">Prospección y competencia</h2>
          <p className="text-ink-soft text-[13.5px] max-w-[70ch]">
            El agente busca empresas B2B en Buenos Aires, encuentra a quién decide y con qué contactarlo, y mapea la competencia directa, indirecta y sustitutos.
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["perfil", "leads", "competencia"] as TabProspeccion[]).map((t) => (
            <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === "perfil" ? "1 · Perfil" : t === "leads" ? `2 · Leads${leads.length ? ` (${leads.length})` : ""}` : "3 · Competencia"}
            </Pill>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-[#f87171]/50 bg-[#f87171]/10 text-[#fca5a5] rounded-[var(--r-md)] px-4 py-3 text-[12.5px] flex justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
      {aviso && !error && (
        <div className="border border-accent/40 bg-accent/[0.07] text-ink-soft rounded-[var(--r-md)] px-4 py-3 text-[12.5px] flex justify-between gap-3">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {tab === "perfil" && <PerfilForm perfil={perfil} onPerfil={onPerfil} onListo={() => setTab("leads")} />}

      {tab === "leads" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Empresas encontradas" value={leads.length} icon="⌖" />
            <StatCard label="Investigadas" value={investigados.length} icon="◎" />
            <StatCard label="Con decisor" value={conDecisor} icon="◍" accent="var(--accent)" />
            <StatCard label="Con email o WhatsApp" value={conContacto} icon="✉" />
          </div>

          <Card>
            <CardHeader
              title="Leads"
              sub={busqueda
                ? `Buscando en Google Maps desde las ${fmtFecha(busqueda.inicio)}… ${encontrados} de hasta ${busqueda.maximo} empresas.`
                : `1) Buscá empresas con el perfil de la cuenta. 2) Investigá: el agente lee cada web y busca al decisor. 3) Pasá los mejores al CRM. · Próxima búsqueda: ${combinaciones} combinaciones, hasta ${maximo} empresas, unos US$ ${estimado.toFixed(2)} de Apify.`}
              right={
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => buscar()} disabled={Boolean(busqueda)} className={btnPrimario}>
                    {busqueda ? "Buscando…" : "⌖ Buscar empresas"}
                  </button>
                  {investigando ? (
                    <button onClick={() => { cortar.current = true; }} className={btnSecundario}>■ Frenar</button>
                  ) : (
                    <button onClick={() => investigarPendientes()} disabled={!pendientes.length} className={btnSecundario}>
                      ◎ Investigar {pendientes.length ? `(${pendientes.length})` : ""}
                    </button>
                  )}
                </div>
              }
            />

            {leads.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-2 text-[12px] text-ink-faint">
                  Score mínimo
                  {[0, 5, 7, 8].map((n) => (
                    <Pill key={n} active={minScore === n} onClick={() => setMinScore(n)}>{n === 0 ? "Todos" : `${n}+`}</Pill>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={elegirBuenos} className={btnSecundario}>Elegir score 7+</button>
                  <button onClick={pasarAlCrm} disabled={!elegidos.size} className={btnPrimario}>
                    → CRM {elegidos.size ? `(${elegidos.size})` : ""}
                  </button>
                  <button onClick={exportarCsv} className={btnSecundario}>⤓ CSV para Sheets</button>
                </div>
              </div>
            )}

            {leads.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center text-ink-faint text-[13px] py-12 border border-dashed border-border-strong rounded-[var(--r-md)] px-4">
                <div>Todavía no hay leads. {perfil.rubros.length ? "Tocá “Buscar empresas”." : "Primero completá el perfil de la cuenta."}</div>
                <div className="flex gap-2 items-center flex-wrap justify-center">
                  <span className="text-[11.5px]">¿Se te cortó una búsqueda? Pegá su ID de Apify y la rescato sin pagarla de nuevo:</span>
                  <input
                    placeholder="ID de la corrida"
                    className={`${inputCls} max-w-[200px]`}
                    onKeyDown={(e) => {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (e.key === "Enter" && v) { recuperar(v); (e.target as HTMLInputElement).value = ""; }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="text-left font-display font-extrabold uppercase text-[9.5px] tracking-wide text-ink-faint border-b border-border-strong">
                      <th className="px-2 py-2 w-8" />
                      <th className="px-2 py-2">Empresa</th>
                      <th className="px-2 py-2">Contacto</th>
                      <th className="px-2 py-2">Decisor</th>
                      <th className="px-2 py-2 w-16">Score</th>
                      <th className="px-2 py-2">Gancho</th>
                      <th className="px-2 py-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((l) => <FilaLead key={l.id} l={l} elegido={elegidos.has(l.id)} onToggle={() => toggle(l.id)}
                      onReintentar={() => investigarUno(l).catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                      onDescartar={() => onLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, estado: "descartado" } : x)))} />)}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === "competencia" && (
        <Card>
          <CardHeader
            title="Mapa competitivo"
            sub="El agente investiga la competencia directa (misma solución), la indirecta (otra solución al mismo problema) y los sustitutos (resolverlo sin comprar). Tarda de 1 a 4 minutos."
            right={
              <button onClick={analizarCompetencia} disabled={analizando} className={btnPrimario}>
                {analizando ? "Investigando…" : analisis.length ? "↻ Nuevo análisis" : "◈ Analizar competencia"}
              </button>
            }
          />

          {analizando && <div className="text-[12.5px] text-ink-faint italic mb-3">El agente está buscando y leyendo webs de la competencia…</div>}

          {!actual && !analizando && (
            <div className="text-center text-ink-faint text-[13px] py-12 border border-dashed border-border-strong rounded-[var(--r-md)]">
              Sin análisis todavía. Cargá los competidores conocidos en el perfil (si los hay) y tocá “Analizar competencia”.
            </div>
          )}

          {actual && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {analisis.map((a) => (
                    <Pill key={a.id} active={a.id === actual.id} onClick={() => setVerAnalisis(a.id)}>{fmtFecha(a.fecha)}</Pill>
                  ))}
                </div>
                <button onClick={() => { onGuardarInforme(actual); setAviso("Guardado en el brain de la cuenta: Brodita ya lo usa."); }} className={btnSecundario}>
                  ◉ Guardar en el brain
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {(["directa", "indirecta", "sustituto"] as const).map((nivel) => (
                  <div key={nivel} className="border border-border rounded-[var(--r-md)] p-3.5 bg-surface-2/50">
                    <div className="font-display font-extrabold uppercase text-[10px] tracking-wide mb-2" style={{ color: COLOR_NIVEL[nivel] }}>
                      {nivel === "directa" ? "Directa" : nivel === "indirecta" ? "Indirecta" : "Sustitutos"}
                    </div>
                    <div className="flex flex-col gap-2">
                      {actual.competidores.filter((c) => c.nivel === nivel).map((c) => (
                        <div key={c.nombre}>
                          <div className="text-[12.5px] font-semibold">{c.nombre}</div>
                          <div className="text-[11.5px] text-ink-faint leading-snug">{c.porQue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-2"><Markdown texto={actual.informe} /></div>

              {actual.fuentes.length > 0 && (
                <details className="text-[11.5px] text-ink-faint">
                  <summary className="cursor-pointer">{actual.fuentes.length} fuentes consultadas</summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {actual.fuentes.map((f) => <li key={f}><a href={f} target="_blank" rel="noopener noreferrer" className="hover:text-ink break-all">{f}</a></li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function FilaLead({ l, elegido, onToggle, onReintentar, onDescartar }: {
  l: Lead; elegido: boolean; onToggle: () => void; onReintentar: () => void; onDescartar: () => void;
}) {
  const link = (href: string, texto: string) => <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-accent break-all">{texto}</a>;
  return (
    <tr className={`border-b border-border align-top ${l.estado === "en_crm" ? "opacity-50" : ""}`}>
      <td className="px-2 py-2.5">
        <input type="checkbox" checked={elegido} disabled={l.estado === "en_crm"} onChange={onToggle} className="accent-[var(--accent)]" />
      </td>
      <td className="px-2 py-2.5">
        <div className="font-semibold text-[12.5px] text-ink">{l.mapsUrl ? link(l.mapsUrl, l.empresa) : l.empresa}</div>
        <div className="text-ink-faint text-[11px]">{[l.rubro, l.localidad].filter(Boolean).join(" · ")}</div>
        {l.web && <div className="text-ink-faint text-[11px]">{link(l.web, l.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</div>}
      </td>
      <td className="px-2 py-2.5 text-ink-soft leading-relaxed">
        {l.email && <div>✉ {link(`mailto:${l.email}`, l.email)}</div>}
        {!l.email && l.emailGenerico && <div className="text-ink-faint">✉ {l.emailGenerico}</div>}
        {l.whatsapp && (
          <div>
            ◍ {link(`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`, l.whatsapp)}
            {!l.whatsappConfirmado && <span className="text-ink-faint text-[10.5px]"> (probable)</span>}
          </div>
        )}
        {l.telefono && !l.whatsapp && <div className="text-ink-faint">☏ {l.telefono}</div>}
      </td>
      <td className="px-2 py-2.5">
        {l.estado === "investigando" ? <span className="text-ink-faint italic">Investigando…</span>
          : l.estado === "error" ? <span className="text-[#fca5a5] text-[11px]">{l.error}</span>
          : l.decisor ? (
            <>
              <div className="text-ink font-semibold">{l.linkedinDecisor ? link(l.linkedinDecisor, l.decisor) : l.decisor}</div>
              <div className="text-ink-faint text-[11px]">{l.cargo}</div>
              {l.confianza && (
                <span className="text-[9.5px] font-display font-extrabold uppercase tracking-wide" style={{ color: COLOR_CONFIANZA[l.confianza] }}>
                  confianza {l.confianza}
                </span>
              )}
            </>
          ) : <span className="text-ink-faint">{l.score != null ? "No encontrado" : "—"}</span>}
      </td>
      <td className="px-2 py-2.5">
        {l.score != null && (
          <span className={`font-display font-black text-[15px] ${l.score >= 7 ? "text-accent" : l.score >= 5 ? "text-ink" : "text-ink-faint"}`}>{l.score}</span>
        )}
      </td>
      <td className="px-2 py-2.5 text-ink-soft leading-snug max-w-[340px]">
        {l.gancho}
        {l.motivo && <div className="text-ink-faint text-[11px] mt-1">{l.motivo}</div>}
      </td>
      <td className="px-2 py-2.5 text-right whitespace-nowrap">
        {l.estado === "en_crm" ? <span className="text-[10.5px] text-ink-faint">En CRM</span> : (
          <>
            {(l.estado === "error" || l.estado === "investigado") && <button onClick={onReintentar} title="Investigar de nuevo" className="text-ink-faint hover:text-ink px-1.5">↻</button>}
            <button onClick={onDescartar} title="Descartar" className="text-ink-faint hover:text-ink px-1.5">✕</button>
          </>
        )}
      </td>
    </tr>
  );
}

function PerfilForm({ perfil, onPerfil, onListo }: { perfil: PerfilProspeccion; onPerfil: (p: PerfilProspeccion) => void; onListo: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const [pegado, setPegado] = useState("");
  const [leyendo, setLeyendo] = useState(false);
  const [faltan, setFaltan] = useState<string[]>([]);
  const [errorTexto, setErrorTexto] = useState<string | null>(null);

  /** Convierte lo pegado (respuestas del cliente, un mail, notas) en el perfil. */
  async function leerTexto() {
    setErrorTexto(null);
    setLeyendo(true);
    try {
      const res = await pedir("/api/prospeccion/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: pegado }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const p = json.perfil as Partial<PerfilProspeccion>;
      // Lo que el texto no dice no pisa lo que ya estaba cargado.
      onPerfil({
        ...perfil,
        ...Object.fromEntries(Object.entries(p).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))),
      } as PerfilProspeccion);
      setFaltan(json.faltan ?? []);
      setPegado("");
    } catch (e) {
      setErrorTexto(e instanceof Error ? e.message : "No pude leer ese texto.");
    } finally {
      setLeyendo(false);
    }
  }

  const set = <K extends keyof PerfilProspeccion>(k: K, v: PerfilProspeccion[K]) => onPerfil({ ...perfil, [k]: v });
  const toggleZona = (z: string) => set("zonas", perfil.zonas.includes(z) ? perfil.zonas.filter((x) => x !== z) : [...perfil.zonas, z]);
  const listo = perfil.rubros.length > 0 && perfil.zonas.length > 0 && perfil.cargos.length > 0;

  const campo = (label: string, hint: string, el: React.ReactNode, critico = false) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-ink">{critico && <span className="text-accent">★ </span>}{label}</span>
      {el}
      <span className="text-[11px] text-ink-faint">{hint}</span>
    </label>
  );

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
      <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="Pegá lo que tengas y listo"
          sub="Las respuestas del cliente, un mail, las notas de la reunión o lo que devolvió el proyecto de Claude. El agente lo lee y completa los campos de abajo; lo que no diga, queda vacío."
        />
        <textarea
          value={pegado}
          onChange={(e) => setPegado(e.target.value)}
          rows={5}
          placeholder={"Ej.: Vendemos limpieza de oficinas, abono desde $400.000. Les vendemos a estudios contables y jurídicos de 10 a 50 empleados en Palermo y Microcentro. Decide el socio o el gerente de administración. No nos sirven consultorios médicos. Competencia: Limpiolux, CleanOffice BA."}
          className={`${inputCls} leading-relaxed`}
        />
        <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
          <span className="text-[11.5px] text-ink-faint">
            {pegado.trim().length > 0 ? `${pegado.trim().length} caracteres` : "También sirve pegar el chat con el cliente."}
          </span>
          <button onClick={leerTexto} disabled={leyendo || pegado.trim().length < 40} className={btnPrimario}>
            {leyendo ? "Leyendo…" : "✦ Leer y completar el perfil"}
          </button>
        </div>
        {errorTexto && <div className="text-[12px] text-[#fca5a5] mt-2">{errorTexto}</div>}
        {faltan.length > 0 && (
          <div className="mt-3 border border-accent/40 bg-accent/[0.06] rounded-[var(--r-md)] p-3">
            <div className="font-display font-extrabold uppercase text-[10px] tracking-wide text-accent mb-1.5">Falta preguntarle al cliente</div>
            <ul className="list-disc pl-4 text-[12px] text-ink-soft flex flex-col gap-1">
              {faltan.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          {campo("Qué vende la cuenta", "Una o dos líneas, con precio aproximado si lo hay.",
            <textarea rows={2} value={perfil.oferta} onChange={(e) => set("oferta", e.target.value)} className={inputCls} />)}
          {campo("Rubros a buscar", "Separados por coma, como se buscarían en Google Maps: constructora, estudio contable…",
            <input value={perfil.rubros.join(", ")} onChange={(e) => set("rubros", lista(e.target.value))} className={inputCls} />, true)}
          {campo("Cargos que deciden", "En orden de prioridad: Dueño, Gerente general, Compras…",
            <input value={perfil.cargos.join(", ")} onChange={(e) => set("cargos", lista(e.target.value))} className={inputCls} />, true)}
          {campo("Empresas por búsqueda", "Se hace una búsqueda por rubro × zona. 20 es un buen punto de partida.",
            <input type="number" min={5} max={100} value={perfil.porBusqueda} onChange={(e) => set("porBusqueda", Number(e.target.value) || 20)} className={inputCls} />)}
        </div>

        <div className="mt-4">
          {campo("Zonas de Buenos Aires", "Tocá para sumar o sacar. Podés escribir otras separadas por coma.",
            <>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...ZONAS_SUGERIDAS, ...perfil.zonas])].map((z) => (
                  <Pill key={z} active={perfil.zonas.includes(z)} onClick={() => toggleZona(z)}>{z}</Pill>
                ))}
              </div>
              <input placeholder="Otra zona y Enter" className={`${inputCls} mt-2`} onKeyDown={(e) => {
                const v = (e.target as HTMLInputElement).value.trim();
                if (e.key === "Enter" && v) { set("zonas", [...new Set([...perfil.zonas, ...lista(v)])]); (e.target as HTMLInputElement).value = ""; }
              }} />
            </>, true)}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {campo("Tamaño", "Empleados aproximados, pymes o grandes.",
            <input value={perfil.tamano} onChange={(e) => set("tamano", e.target.value)} className={inputCls} />)}
          {campo("Señales de compra", "Qué le pasa a una empresa justo antes de necesitarla.",
            <input value={perfil.senales} onChange={(e) => set("senales", e.target.value)} className={inputCls} />)}
          {campo("Excluir", "Rubros, tamaños o zonas que no sirven.",
            <input value={perfil.excluir} onChange={(e) => set("excluir", e.target.value)} className={inputCls} />)}
          {campo("No contactar", "Clientes actuales o en negociación: nombres o dominios, separados por coma.",
            <input value={perfil.noContactar} onChange={(e) => set("noContactar", e.target.value)} className={inputCls} />)}
          {campo("Competidores conocidos", "Nombre y web o Instagram, uno por línea.",
            <textarea rows={3} value={perfil.competidores} onChange={(e) => set("competidores", e.target.value)} className={inputCls} />)}
          {campo("Si no contratan a nadie…", "Cómo lo resuelven: personal propio, planilla, no lo resuelven. Es la competencia indirecta.",
            <textarea rows={3} value={perfil.alternativas} onChange={(e) => set("alternativas", e.target.value)} className={inputCls} />)}
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onListo} disabled={!listo} className={btnPrimario}>Listo, ir a buscar →</button>
        </div>
      </Card>
      </div>

      <Card>
        <CardHeader title="Cuestionario para el cliente" sub="Mandáselo por WhatsApp o mail. Con sus respuestas completás este perfil." />
        <pre className="whitespace-pre-wrap text-[11.5px] text-ink-soft leading-relaxed font-[inherit] max-h-[360px] overflow-y-auto">{CUESTIONARIO}</pre>
        <button
          onClick={() => { navigator.clipboard.writeText(CUESTIONARIO).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }}
          className={`${btnSecundario} mt-3 w-full`}
        >
          {copiado ? "✓ Copiado" : "Copiar cuestionario"}
        </button>
      </Card>
    </div>
  );
}
