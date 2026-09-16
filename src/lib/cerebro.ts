// El cerebro de Brodita: los documentos que sabe de memoria. Cada respuesta
// se arma con los documentos relevantes, no con lo que el modelo supone.
// Se puede escribir acá adentro o importar notas de Obsidian (.md).

export type TipoDoc = "marca" | "oferta" | "icp" | "proceso" | "objeciones" | "caso" | "nota";

export const TIPOS_DOC: { id: TipoDoc; label: string }[] = [
  { id: "marca", label: "Marca y tono" },
  { id: "oferta", label: "Oferta y precios" },
  { id: "icp", label: "A quién le vendemos" },
  { id: "proceso", label: "Proceso comercial" },
  { id: "objeciones", label: "Objeciones" },
  { id: "caso", label: "Casos y resultados" },
  { id: "nota", label: "Nota suelta" },
];

export interface DocCerebro {
  id: string;
  titulo: string;
  tipo: TipoDoc;
  contenido: string;
  fuente: "broda" | "obsidian" | "manual";
  activo: boolean;
  actualizado: string;
}

const uid = () => `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function nuevoDoc(parcial: Partial<DocCerebro> = {}): DocCerebro {
  return {
    id: uid(), titulo: "", tipo: "nota", contenido: "",
    fuente: "manual", activo: true, actualizado: new Date().toISOString(),
    ...parcial,
  };
}

/* ---------------- Obsidian ---------------- */

/** Saca el frontmatter y devuelve el título de la nota: el H1, o el nombre del archivo. */
export function parsearMarkdown(nombreArchivo: string, texto: string): { titulo: string; contenido: string } {
  let cuerpo = texto.replace(/^﻿/, "");
  const fm = cuerpo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let tituloFm = "";
  if (fm) {
    const t = fm[1].match(/^title:\s*(.+)$/m);
    if (t) tituloFm = t[1].trim().replace(/^["']|["']$/g, "");
    cuerpo = cuerpo.slice(fm[0].length);
  }
  const h1 = cuerpo.match(/^#\s+(.+)$/m);
  const titulo = tituloFm || h1?.[1]?.trim() || nombreArchivo.replace(/\.mdx?$/i, "");
  return { titulo, contenido: cuerpo.trim() };
}

/** Los [[enlaces]] de Obsidian, para ver qué notas se llaman entre sí. */
export function enlacesWiki(texto: string): string[] {
  const out = new Set<string>();
  for (const m of texto.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) out.add(m[1].trim());
  return [...out];
}

/* ---------------- Búsqueda ---------------- */

const VACIAS = new Set(["para", "como", "que", "con", "los", "las", "del", "una", "uno", "por", "sobre", "cual", "cuales", "esta", "este", "tiene", "hacer", "donde", "quien", "todo", "más", "mas", "the", "and"]);

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function palabras(s: string): string[] {
  return normalizar(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !VACIAS.has(w));
}

/** Documentos que más se parecen a la consulta. Sin embeddings: cuenta
 * coincidencias de palabras. Alcanza mientras el cerebro sea de decenas de notas. */
export function buscarRelevantes(docs: DocCerebro[], consulta: string, max = 4): DocCerebro[] {
  const activos = docs.filter((d) => d.activo);
  const términos = palabras(consulta);
  if (términos.length === 0) return activos.slice(0, max);

  const puntuados = activos.map((d) => {
    const texto = normalizar(`${d.titulo} ${d.titulo} ${d.contenido}`);
    let score = 0;
    for (const t of términos) {
      const hits = texto.split(t).length - 1;
      if (hits > 0) score += 1 + Math.min(hits, 4) * 0.25;
    }
    return { d, score };
  });

  const conMatch = puntuados.filter((p) => p.score > 0).sort((a, b) => b.score - a.score);
  return (conMatch.length ? conMatch : puntuados).slice(0, max).map((p) => p.d);
}

/** Arma el bloque de contexto que viaja al modelo, recortado para no gastar de más. */
export function contextoDeDocs(docs: DocCerebro[], maxPorDoc = 1600): string {
  if (docs.length === 0) return "";
  return docs
    .map((d) => {
      const cuerpo = d.contenido.length > maxPorDoc ? `${d.contenido.slice(0, maxPorDoc)}…` : d.contenido;
      return `### ${d.titulo} (${d.tipo})\n${cuerpo}`;
    })
    .join("\n\n");
}

export function pesoTotal(docs: DocCerebro[]): number {
  return docs.reduce((s, d) => s + d.contenido.length, 0);
}

/* ---------------- Lo que Brodita ya sabe ---------------- */

export const SEED_CEREBRO: DocCerebro[] = [
  {
    id: "doc-oferta", titulo: "Oferta y precios de BRODA", tipo: "oferta", fuente: "broda", activo: true, actualizado: "2026-09-16",
    contenido: `Servicio: infraestructura comercial y contenido para empresas (BROWTH).

Precios:
- Cartera actual: USD 650, migrando a 750 en septiembre. Es transición, no destino.
- Clientes nuevos: USD 850. Primer precio con margen real (12%).
- Cuentas con sistema comercial: USD 850 + comisión sobre lo que el cliente vende.

Costo real de atender un cliente: 1.150.000 ARS por mes (socios 600.000, Juan producción 220.000, Mecha diseño 200.000, editor 80.000, herramientas 50.000). Tipo de cambio de referencia 1.540.

Reglas: el precio se da en la reunión, nunca antes. A 650 cada cuenta pierde 149.000 por mes cuando Juan produce en todas. El retainer solo no llega a los 2 millones por socio: la diferencia sale del modelo variable.`,
  },
  {
    id: "doc-icp", titulo: "A quién le vendemos", tipo: "icp", fuente: "broda", activo: true, actualizado: "2026-09-16",
    contenido: `Cliente (B2B): dueños de negocios con 2 a 5 años de tracción, creciendo sin sistema. Es el ICP: todo MOFU y BOFU se escribe para él.

Audiencia (B2C): emprendedores y freelance de 20 a 40 años con una habilidad. No son clientes: entran en TOFU, comparten y validan autoridad.

Señales de buen lead: ya factura, tiene equipo o quiere armarlo, se quemó con una agencia antes, entiende que el problema es de proceso y no de "más contenido".
Señales para descartar: busca solo edición de videos, no tiene presupuesto de 850 por mes, quiere resultados en 30 días.`,
  },
  {
    id: "doc-proceso", titulo: "Las 7 capas del embudo", tipo: "proceso", fuente: "broda", activo: true, actualizado: "2026-09-16",
    contenido: `Atraer (Thiago) → Capturar (Tomi) → Calificar (Tomi) → Convertir (Charly + Thiago) → Retener (Charly + Tomi) → Expandir → Referir.

Estado: Atraer funciona. Capturar está a medias (el tráfico llega pero se dispersa en chats sueltos). Calificar es manual y colapsa a los 30 chats. Convertir es el cuello: ahí está la venta y no la controlamos. Retener, Expandir y Referir no existen.

Orden de construcción, una capa por vez: Capturar → Calificar → Convertir → Retener → recién ahí replicar a otra cuenta.

Regla que ordena todo: no importa por dónde entre alguien, todo va a un solo canal y termina en un solo lugar de gestión. Un contacto suelto en un DM no existe.`,
  },
  {
    id: "doc-contenido", titulo: "Estrategia de contenido", tipo: "marca", fuente: "broda", activo: true, actualizado: "2026-09-16",
    contenido: `Ocho piezas al mes: un video horizontal y una placa por semana.
- TOFU (4 piezas) — pilar Filosofía: que alguien que no nos conoce se quede. Se mide por alcance de no seguidores y guardados.
- MOFU (3 piezas) — pilar Criterio: que entienda que sabemos. Se mide por seguidores nuevos y respuestas.
- BOFU (1 pieza) — pilar Documental: que quiera hablar con nosotros. Se mide por conversaciones iniciadas por DM.

El contenido no responde por leads: responde por autoridad, que es lo que hace defendible el precio de 850. Prueba social está bloqueada hasta tener un resultado verificable.

Tono: español rioplatense, directo, con criterio. Nada de corporativo vacío ni promesas sin número.`,
  },
  {
    id: "doc-objeciones", titulo: "Objeciones frecuentes", tipo: "objeciones", fuente: "broda", activo: true, actualizado: "2026-09-16",
    contenido: `"Es caro" → No se baja el precio: se muestra el costo de no tener sistema (leads perdidos en DMs, cierre que depende del dueño). El precio se sostiene con criterio demostrado, no con descuento.

"Ya trabajé con una agencia y no funcionó" → Preguntar qué entregaban. Casi siempre entregaban piezas, no sistema. Nosotros respondemos por el embudo, no por la cantidad de posts.

"Quiero ver resultados primero" → Se ofrece el primer tramo medible (capturar y calificar funcionando en su cuenta), con baseline al arrancar. Sin baseline no hay forma de probar que se movió.

"Lo hablo con mi socio" → Se agenda la próxima con los dos. Nunca se manda la propuesta sin reunión.`,
  },
];
