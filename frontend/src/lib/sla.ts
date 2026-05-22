/** Plazos SLA por prioridad (alineado con backend/src/lib/sla.ts). */
export const SLA_PRIORIDADES: { clave: string; etiqueta: string; horas: number }[] = [
  { clave: "critica", etiqueta: "Crítica / urgente", horas: 8 },
  { clave: "alta", etiqueta: "Alta", horas: 24 },
  { clave: "normal", etiqueta: "Normal / media", horas: 72 },
  { clave: "baja", etiqueta: "Baja", horas: 168 },
];

export function formatoPlazoSla(horas: number): string {
  if (horas < 24) return `${horas} h`;
  const dias = horas / 24;
  return dias === 1 ? "1 día" : `${dias} días`;
}
