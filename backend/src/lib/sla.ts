/** Horas de SLA por prioridad (para fecha_limite automática). */
export const SLA_HORAS: Record<string, number> = {
  critica: 8,
  urgente: 8,
  alta: 24,
  normal: 72,
  media: 72,
  baja: 168,
};

export function horasSlaPrioridad(prioridad: string): number {
  const p = prioridad.trim().toLowerCase();
  return SLA_HORAS[p] ?? SLA_HORAS.media;
}

export function calcularFechaLimite(prioridad: string, desde = new Date()): Date {
  const h = horasSlaPrioridad(prioridad);
  return new Date(desde.getTime() + h * 3600 * 1000);
}

export function estaEnPlazo(
  fechaLimite: string | null | undefined,
  fechaCierre: string | null | undefined,
): boolean | null {
  if (!fechaLimite) return null;
  const limite = new Date(fechaLimite).getTime();
  const fin = fechaCierre ? new Date(fechaCierre).getTime() : Date.now();
  return fin <= limite;
}
