"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setPath, type PathKey } from "@/lib/setPath";
import { SEED_CEREBRO, type DocCerebro } from "@/lib/cerebro";
import {
  LINEAS, LINEAS_TABLA, LINEAS_NOTA, CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION,
  EQUIPO_BRODA, ESTRUCTURA, ROLES_TABLA, BRODAWEEK, ECONOMIA, PRECIOS, Q4, ESTRATEGIA, PLAN, FLUJOS,
  type PiezaPlan,
} from "@/lib/broda";

// Todo el contenido "real" de Broda vive acá adentro, editable desde la UI.
// Arranca con los valores de src/lib/broda.ts y a partir de ahí el usuario
// puede tocar cualquier campo — persiste en localStorage, no en el código.

const DEFAULT_DATA = {
  LINEAS, LINEAS_TABLA, LINEAS_NOTA, CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION,
  EQUIPO_BRODA, ESTRUCTURA, ROLES_TABLA, BRODAWEEK, ECONOMIA, PRECIOS, Q4, ESTRATEGIA, PLAN, FLUJOS,
  CEREBRO: SEED_CEREBRO as DocCerebro[],
};

export type BrodaData = typeof DEFAULT_DATA;

const STORAGE_KEY = "browth:broda:v1";

/** Lleva datos guardados con una versión vieja del modelo a la actual,
 * sin pisar lo que el usuario ya editó. */
function normalize(parsed: Partial<BrodaData>): BrodaData {
  const data = { ...DEFAULT_DATA, ...parsed } as BrodaData;

  // Las "reservas" eran strings sueltos; ahora son piezas sin fecha.
  const reservas = (parsed.PLAN?.reservas ?? []) as string[];
  if (reservas.length > 0) {
    const nuevas: PiezaPlan[] = reservas.map((r, i) => ({
      id: `res-${Date.now()}-${i}`, prioridad: false, fecha: "", canal: "ig", canalLabel: "Instagram",
      formato: "Placa", tema: r.split("—")[0].trim(), pilar: "Sin asignar", estado: "Listo para publicar", detalle: r,
    }));
    data.PLAN = { ...data.PLAN, filas: [...data.PLAN.filas, ...nuevas], reservas: [] };
  }

  // Personas agregadas al equipo después de la primera carga.
  const personas = new Set(data.EQUIPO_BRODA.map((m) => m.persona));
  const faltantes = DEFAULT_DATA.EQUIPO_BRODA.filter((m) => !personas.has(m.persona));
  if (faltantes.length) data.EQUIPO_BRODA = [...data.EQUIPO_BRODA, ...faltantes];

  // Documentos base del cerebro: se agregan los que faltan y se actualizan los
  // que solo crecieron desde el codigo (sin pisar lo que el usuario edito).
  data.CEREBRO = (data.CEREBRO ?? []).map((d) => {
    const base = SEED_CEREBRO.find((s) => s.titulo === d.titulo);
    return base && base.contenido.startsWith(d.contenido) ? { ...d, contenido: base.contenido } : d;
  });

  const titulos = new Set((data.CEREBRO ?? []).map((x) => x.titulo));
  data.CEREBRO = [...(data.CEREBRO ?? []), ...SEED_CEREBRO.filter((s) => !titulos.has(s.titulo))];

  // Capas nuevas del flujo que todavia no estaban en lo guardado.
  data.FLUJOS = { ...DEFAULT_DATA.FLUJOS, ...(parsed.FLUJOS ?? {}) };

  // La estructura no se edita desde la UI: siempre manda la del código.
  data.ESTRUCTURA = DEFAULT_DATA.ESTRUCTURA;

  // Roles viejos de Marce y Fabi (antes estaban en la red).
  const rolesViejos: Record<string, string> = { Marce: "Growth Partner", Fabi: "Editor de BRODA" };
  data.EQUIPO_BRODA = data.EQUIPO_BRODA.map((m) => {
    if (rolesViejos[m.persona] !== m.rol) return m;
    return DEFAULT_DATA.EQUIPO_BRODA.find((d) => d.persona === m.persona) ?? m;
  });

  return data;
}

function loadPersisted(): BrodaData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_DATA;
  }
}

interface BrodaCtx {
  data: BrodaData;
  update: (path: PathKey[], value: unknown) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  resetSection: (key: keyof BrodaData) => void;
}

const Ctx = createContext<BrodaCtx | null>(null);

export function BrodaProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BrodaData>(() => loadPersisted());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const value = useMemo<BrodaCtx>(() => ({
    data,
    update: (path, val) => setData((d) => setPath(d, path, val)),
    editMode,
    setEditMode,
    resetSection: (key) => setData((d) => ({ ...d, [key]: DEFAULT_DATA[key] })),
  }), [data, editMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBroda() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBroda debe usarse dentro de <BrodaProvider>");
  return ctx;
}
