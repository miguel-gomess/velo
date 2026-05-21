import { colorEstado, labelEstado } from "../../lib/incidencias";

export function BadgeEstado({ estado, compact = false }: { estado: string; compact?: boolean }) {
  const color = colorEstado(estado);
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide text-white ${
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[10px] shadow-sm"
      }`}
      style={{ backgroundColor: color }}
    >
      {labelEstado(estado)}
    </span>
  );
}
