import { useEffect, useState } from "react";
import { apiGetMe, type Usuario } from "../../lib/api";
import { IncidenciasKanbanView } from "../../components/incidencias/IncidenciasKanbanView";

export function WorkspaceKanbanPanel() {
  const [me, setMe] = useState<Usuario | null>(null);

  useEffect(() => {
    void apiGetMe().then(setMe).catch(() => setMe(null));
  }, []);

  if (!me) return null;

  return (
    <IncidenciasKanbanView
      scope="kanban"
      me={me}
      title="Tablero de tu equipo"
      description="Incidencias de tu equipo y las solicitudes que has creado."
      esAdmin={false}
      puedeGestionarEstado
      puedeGestionarAsignacion={false}
    />
  );
}
