import type { Usuario } from "./api";
import { isAdminUsuario, puedeUsarWorkspaceKanban } from "./roles";

/** Ruta donde el usuario ve el detalle de incidencias (kanban o portal). */
export function rutaIncidenciaParaUsuario(me: Usuario): string {
  if (isAdminUsuario(me)) return "/dashboard/incidencias";
  if (puedeUsarWorkspaceKanban(me)) return "/workspace";
  return "/portal";
}

export function buildEnlaceIncidencia(
  incidenciaId: number,
  me: Usuario,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  const ruta = rutaIncidenciaParaUsuario(me);
  return `${origin}${ruta}?incidencia=${incidenciaId}`;
}

export function parseIncidenciaIdDesdeSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get("incidencia");
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
}
