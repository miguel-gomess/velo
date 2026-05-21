export const KANBAN_TEMAS = {
  abierta: {
    color: "#2563eb",
    soft: "#dbeafe",
    ring: "rgba(37, 99, 235, 0.45)",
    border: "#93c5fd",
  },
  en_curso: {
    color: "#ea580c",
    soft: "#ffedd5",
    ring: "rgba(234, 88, 12, 0.45)",
    border: "#fdba74",
  },
  en_revision: {
    color: "#9333ea",
    soft: "#f3e8ff",
    ring: "rgba(147, 51, 234, 0.45)",
    border: "#d8b4fe",
  },
  cerrada: {
    color: "#059669",
    soft: "#d1fae5",
    ring: "rgba(5, 150, 105, 0.45)",
    border: "#6ee7b7",
  },
} as const;

export const KANBAN_COLUMNAS = [
  { id: "abierta" as const, label: "Por hacer", color: KANBAN_TEMAS.abierta.color },
  { id: "en_curso" as const, label: "En curso", color: KANBAN_TEMAS.en_curso.color },
  { id: "en_revision" as const, label: "En revisión", color: KANBAN_TEMAS.en_revision.color },
  { id: "cerrada" as const, label: "Hecho", color: KANBAN_TEMAS.cerrada.color },
] as const;

export type EstadoKanban = (typeof KANBAN_COLUMNAS)[number]["id"];

export type KanbanTema = (typeof KANBAN_TEMAS)[EstadoKanban];

export function normalizarEstado(estado: string): EstadoKanban {
  const e = estado.toLowerCase().replace(/\s+/g, "_");
  if (e === "en_curso" || e === "en curso" || e === "proceso") return "en_curso";
  if (e === "en_revision" || e === "en revision" || e === "revision" || e === "revisión")
    return "en_revision";
  if (e === "cerrada" || e === "cerrado" || e === "resuelta" || e === "resuelto") return "cerrada";
  return "abierta";
}

export function labelEstado(estado: string): string {
  return KANBAN_COLUMNAS.find((c) => c.id === normalizarEstado(estado))?.label ?? estado;
}

export function temaPorEstado(estado: string): KanbanTema {
  return KANBAN_TEMAS[normalizarEstado(estado)];
}

export function colorEstado(estado: string): string {
  return temaPorEstado(estado).color;
}

/** Clases Tailwind para badges de prioridad (más saturados). */
const PRIORIDADES_VALIDAS = ["baja", "normal", "media", "alta", "critica"] as const;

export function normalizarPrioridadValor(prioridad?: string | null): string {
  const p = (prioridad ?? "media").trim().toLowerCase();
  return (PRIORIDADES_VALIDAS as readonly string[]).includes(p) ? p : "media";
}

export function prioridadTone(prioridad?: string | null): string {
  const p = (prioridad ?? "normal").toLowerCase();
  if (p === "critica") return "bg-red-600 text-white border-red-700 shadow-sm";
  if (p === "alta") return "bg-orange-500 text-white border-orange-600 shadow-sm";
  if (p === "media") return "bg-violet-500 text-white border-violet-600 shadow-sm";
  if (p === "baja") return "bg-teal-500 text-white border-teal-600 shadow-sm";
  return "bg-blue-500 text-white border-blue-600 shadow-sm";
}
