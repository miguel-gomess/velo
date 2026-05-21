import type { Incidencia } from "../../lib/api";
import { incidenciaEsAsignada } from "./portalUtils";

export function PortalIncidenciaRolBadge({
  inc,
  userId,
}: {
  inc: Incidencia;
  userId: number;
}) {
  if (!incidenciaEsAsignada(inc, userId)) return null;
  return (
    <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-800">
      Asignada a ti
    </span>
  );
}
