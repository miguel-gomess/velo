import type { Incidencia } from "../../lib/api";
import {
  formatFechaRelativa,
  formatFechaLimiteSla,
  parseFechaApi,
  textoVenceSla,
} from "../../lib/fechas";
import { colorEstado, labelEstado, normalizarEstado } from "../../lib/incidencias";

export type PortalTabId = "inicio" | "nueva" | "seguimiento";

export type FiltroListaSolicitudes = "todas" | "activas" | "cerradas" | "novedades";

export function saludoSegunHora(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function contarPorEstado(solicitudes: Incidencia[]) {
  let pendientes = 0;
  let activas = 0;
  let resueltas = 0;
  for (const i of solicitudes) {
    const e = normalizarEstado(i.estado);
    if (e === "cerrada") resueltas++;
    else if (e === "en_curso" || e === "en_revision") activas++;
    else pendientes++;
  }
  return { total: solicitudes.length, pendientes, activas, resueltas };
}

export function prioridadTone(prioridad: string): string {
  const p = prioridad.toLowerCase();
  if (p.includes("crítica") || p.includes("critica") || p === "alta")
    return "border-rose-200 bg-rose-50 text-rose-800";
  if (p.includes("media")) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export { formatFechaRelativa, formatFechaLimiteSla, textoVenceSla };

export function slaEstado(
  fechaLimite: string | null | undefined,
  estado: string,
): "none" | "ok" | "warning" | "overdue" {
  if (!fechaLimite) return "none";
  const norm = normalizarEstado(estado);
  if (norm === "cerrada") return "none";
  const limite = parseFechaApi(fechaLimite).getTime();
  if (Number.isNaN(limite)) return "none";
  const now = Date.now();
  if (limite < now) return "overdue";
  const horas = (limite - now) / 3_600_000;
  if (horas <= 24) return "warning";
  return "ok";
}

export function mensajeAlertaSla(estado: ReturnType<typeof slaEstado>): string | null {
  if (estado === "overdue") {
    return "Esta solicitud ha superado el plazo objetivo de respuesta. El equipo sigue trabajando en ella; puedes escribir en el chat si necesitas más información.";
  }
  if (estado === "warning") {
    return "El plazo de respuesta vence en menos de 24 horas. Si es urgente, añade un comentario en la actividad.";
  }
  return null;
}

export function labelSlaEstado(estado: ReturnType<typeof slaEstado>): string | null {
  if (estado === "overdue") return "Fuera de plazo";
  if (estado === "warning") return "Plazo próximo";
  if (estado === "ok") return "En plazo";
  return null;
}

export function filtrarSolicitudes(
  items: Incidencia[],
  filtro: FiltroListaSolicitudes,
  sinLeerPorIncidencia: Record<number, number>,
  busqueda: string,
): Incidencia[] {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.fecha_actualizacion ?? b.fecha_creacion).getTime() -
      new Date(a.fecha_actualizacion ?? a.fecha_creacion).getTime(),
  );

  let list = sorted;
  if (filtro === "activas") {
    list = list.filter((i) => normalizarEstado(i.estado) !== "cerrada");
  } else if (filtro === "cerradas") {
    list = list.filter((i) => normalizarEstado(i.estado) === "cerrada");
  } else if (filtro === "novedades") {
    list = list.filter((i) => (sinLeerPorIncidencia[i.id] ?? 0) > 0);
  }

  const q = busqueda.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (i) =>
      i.titulo.toLowerCase().includes(q) ||
      String(i.id).includes(q) ||
      `vel-${i.id}`.includes(q),
  );
}

/** Solicitudes creadas por el usuario o asignadas a él (alcance API scope=portal). */
export function incidenciasVisiblesEnPortal(items: Incidencia[], userId: number): Incidencia[] {
  return items.filter((i) => i.usuario_id === userId || i.asignado_a === userId);
}

export function incidenciaEsAsignada(inc: Incidencia, userId: number): boolean {
  return inc.asignado_a === userId && inc.usuario_id !== userId;
}

export function incidenciaEsSolicitante(inc: Incidencia, userId: number): boolean {
  return inc.usuario_id === userId;
}

export function solicitudesRequierenAtencion(
  items: Incidencia[],
  sinLeerPorIncidencia: Record<number, number>,
): Incidencia[] {
  return items
    .filter((i) => {
      const sinLeer = sinLeerPorIncidencia[i.id] ?? 0;
      if (sinLeer > 0) return true;
      const sla = slaEstado(i.fecha_limite, i.estado);
      return sla === "overdue" || sla === "warning";
    })
    .sort(
      (a, b) =>
        new Date(b.fecha_actualizacion ?? b.fecha_creacion).getTime() -
        new Date(a.fecha_actualizacion ?? a.fecha_creacion).getTime(),
    )
    .slice(0, 5);
}

export { colorEstado, labelEstado, normalizarEstado };
