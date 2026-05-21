import { useEffect, useState } from "react";
import { apiGetMe, type Usuario } from "../../lib/api";
import { IncidenciasKanbanView } from "../../components/incidencias/IncidenciasKanbanView";

export function IncidenciasPanel() {
  const [me, setMe] = useState<Usuario | null>(null);

  useEffect(() => {
    void apiGetMe().then(setMe).catch(() => setMe(null));
  }, []);

  if (!me) return null;

  return (
    <IncidenciasKanbanView
      scope="all"
      me={me}
      title="Tablero de incidencias"
      esAdmin
      puedeGestionarEstado
      puedeGestionarAsignacion
    />
  );
}
