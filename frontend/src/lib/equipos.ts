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
