/** Parsea fechas ISO o timestamps de PostgreSQL de forma consistente. */
export function parseFechaApi(iso: string): Date {
  if (!iso) return new Date(NaN);
  const direct = new Date(iso);
  if (!Number.isNaN(direct.getTime())) return direct;
  const normalizado = iso.includes("T") ? iso : iso.replace(" ", "T");
  const conZona =
    /[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalizado) ? normalizado : `${normalizado}Z`;
  return new Date(conZona);
}

/** Hora absoluta corta (tooltip / mensajes antiguos). */
export function formatFechaHora(iso: string): string {
  const d = parseFechaApi(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tiempo relativo en español. Pasa `ahora` (p. ej. de useRelojTick) para que se actualice solo.
 */
export function formatFechaRelativa(iso: string, ahora = Date.now()): string {
  const t = parseFechaApi(iso).getTime();
  if (Number.isNaN(t)) return "—";

  const diff = Math.max(0, ahora - t);
  const secs = Math.floor(diff / 1000);

  if (secs < 10) return "Ahora";
  if (secs < 60) return `Hace ${secs} s`;

  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins === 1 ? "Hace 1 min" : `Hace ${mins} min`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "Hace 1 h" : `Hace ${hrs} h`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return days === 1 ? "Hace 1 d" : `Hace ${days} d`;

  return parseFechaApi(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Intervalo de tick recomendado según antigüedad del timestamp. */
export function intervaloRelojPara(iso: string): number {
  const t = parseFechaApi(iso).getTime();
  if (Number.isNaN(t)) return 30_000;
  const diff = Date.now() - t;
  if (diff < 120_000) return 5_000;
  if (diff < 3_600_000) return 15_000;
  return 60_000;
}
