import { colorEstado, labelEstado } from "./portalUtils";

export function PortalBadgeEstado({ estado }: { estado: string }) {
  const color = colorEstado(estado);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {labelEstado(estado)}
    </span>
  );
}
