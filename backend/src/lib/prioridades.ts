/** Valores de prioridad alineados con el frontend (selectores y kanban). */
export const PRIORIDADES_VALIDAS = ["baja", "normal", "media", "alta", "critica"] as const;

export type PrioridadIncidencia = (typeof PRIORIDADES_VALIDAS)[number];

export const PRIORIDAD_DEFECTO: PrioridadIncidencia = "media";

export function normalizarPrioridad(raw: string | null | undefined): PrioridadIncidencia | null {
  const p = (raw ?? "").trim().toLowerCase();
  if (!p) return null;
  if ((PRIORIDADES_VALIDAS as readonly string[]).includes(p)) return p as PrioridadIncidencia;
  return null;
}
