import type { CSSProperties } from "react";
import type { Epica } from "./api";

export function labelEpica(epica: Pick<Epica, "nombre" | "clave"> | null | undefined): string {
  if (!epica) return "Sin épica";
  return epica.nombre;
}

export function badgeEpicaStyle(color: string | null | undefined): CSSProperties {
  const c = color?.trim() || "#6366f1";
  return {
    backgroundColor: `color-mix(in srgb, ${c} 14%, white)`,
    borderColor: `color-mix(in srgb, ${c} 35%, transparent)`,
    color: c,
  };
}
