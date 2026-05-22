/** Códigos de equipo alineados con plantillas y backend. */
export const EQUIPOS_CATALOGO = [
  { codigo: "IT", nombre: "Tecnología" },
  { codigo: "RRHH", nombre: "Recursos humanos" },
  { codigo: "ADMIN", nombre: "Administración / sistemas" },
  { codigo: "MANTENIMIENTO", nombre: "Mantenimiento" },
  { codigo: "FINANZAS", nombre: "Finanzas" },
  { codigo: "COMERCIAL", nombre: "Comercial" },
  { codigo: "LEGAL", nombre: "Legal" },
] as const;

const CODIGOS = new Set<string>(EQUIPOS_CATALOGO.map((e) => e.codigo));

export function normalizeEquipoCodigo(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toUpperCase();
  if (!t || t === "SEGÚN CONTENIDO" || t === "SEGUN CONTENIDO") return null;
  if (t.startsWith("IT")) return "IT";
  if (t.includes("RRHH")) return "RRHH";
  if (t.includes("MANTENIMIENTO")) return "MANTENIMIENTO";
  if (t.includes("FINANZAS")) return "FINANZAS";
  if (t.includes("COMERCIAL")) return "COMERCIAL";
  if (t.includes("LEGAL")) return "LEGAL";
  if (t.includes("ADMIN")) return "ADMIN";
  if (CODIGOS.has(t)) return t;
  return null;
}

export function equipoCodigoFromPlantilla(equipoGestion: string): string | null {
  return normalizeEquipoCodigo(equipoGestion);
}

export function labelEquipo(codigo: string | null | undefined): string {
  if (!codigo) return "Sin equipo";
  return EQUIPOS_CATALOGO.find((e) => e.codigo === codigo)?.nombre ?? codigo;
}

const EQUIPO_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  IT: { bg: "bg-sky-50", text: "text-sky-800", ring: "ring-sky-200" },
  RRHH: { bg: "bg-violet-50", text: "text-violet-800", ring: "ring-violet-200" },
  ADMIN: { bg: "bg-slate-100", text: "text-slate-800", ring: "ring-slate-200" },
  MANTENIMIENTO: { bg: "bg-amber-50", text: "text-amber-900", ring: "ring-amber-200" },
  FINANZAS: { bg: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-200" },
  COMERCIAL: { bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200" },
  LEGAL: { bg: "bg-indigo-50", text: "text-indigo-800", ring: "ring-indigo-200" },
};

export function equipoAccentClass(codigo: string): { bg: string; text: string; ring: string } {
  return (
    EQUIPO_ACCENT[codigo] ?? {
      bg: "bg-[var(--velo-brand-muted)]",
      text: "text-[var(--velo-brand)]",
      ring: "ring-[var(--velo-border)]",
    }
  );
}
