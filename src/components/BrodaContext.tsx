"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setPath, type PathKey } from "@/lib/setPath";
import {
  LINEAS, LINEAS_TABLA, LINEAS_NOTA, CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION,
  EQUIPO_BRODA, ESTRUCTURA, ROLES_TABLA, BRODAWEEK, ECONOMIA, PRECIOS, Q4, ESTRATEGIA, PLAN,
  type PiezaPlan,
} from "@/lib/broda";

// Todo el contenido "real" de Broda vive acá adentro, editable desde la UI.
// Arranca con los valores de src/lib/broda.ts y a partir de ahí el usuario
// puede tocar cualquier campo — persiste en localStorage, no en el código.

const DEFAULT_DATA = {
  LINEAS, LINEAS_TABLA, LINEAS_NOTA, CAPAS, EMBUDO_META, ORDEN_CONSTRUCCION,
  EQUIPO_BRODA, ESTRUCTURA, ROLES_TABLA, BRODAWEEK, ECONOMIA, PRECIOS, Q4, ESTRATEGIA, PLAN,
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
