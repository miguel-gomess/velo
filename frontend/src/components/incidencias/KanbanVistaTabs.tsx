import { useState } from "react";
import type { Epica, Incidencia, Usuario } from "../../lib/api";
import type { EstadoKanban } from "../../lib/incidencias";
import { KanbanBoard } from "./KanbanBoard";
import { IncidenciasListaView } from "./IncidenciasListaView";
import { IncidenciasCalendarioView } from "./IncidenciasCalendarioView";
import { IncidenciasCronogramaView } from "./IncidenciasCronogramaView";
import { IncidenciasRoadmapView } from "./IncidenciasRoadmapView";
import { Calendar, Columns3, GanttChart, List, Map as MapIcon } from "lucide-react";

type Vista = "tablero" | "lista" | "roadmap" | "cronograma" | "calendario";

type Props = {
  items: Incidencia[];
  epicas: Epica[];
  me: Usuario;
  esAdmin?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  puedeEditarPlazo?: boolean;
  sinLeerPorIncidencia?: Record<number, number>;
  onOpen: (inc: Incidencia) => void;
  onMove: (id: number, estado: EstadoKanban) => void | Promise<void>;
  onFiltrarEpica?: (epicaId: number | "sin_epica" | null) => void;
  onCambiarPlazo?: (id: number, fecha_limite: string) => void | Promise<void>;
};

const TABS: Array<{ id: Vista; label: string; icon: typeof Columns3 }> = [
  { id: "tablero", label: "Tablero", icon: Columns3 },
  { id: "lista", label: "Lista", icon: List },
  { id: "roadmap", label: "Roadmap", icon: MapIcon },
  { id: "cronograma", label: "Cronograma", icon: GanttChart },
  { id: "calendario", label: "Calendario", icon: Calendar },
];

export function KanbanVistaTabs({
  items,
  epicas,
  me,
  esAdmin = false,
  loading,
  readOnly,
  puedeEditarPlazo,
  sinLeerPorIncidencia,
  onOpen,
  onMove,
  onFiltrarEpica,
  onCambiarPlazo,
}: Props) {
  const [vista, setVista] = useState<Vista>("tablero");

  function irVistaConEpica(destino: "cronograma" | "calendario", epicaId: number | "sin_epica" | null) {
    onFiltrarEpica?.(epicaId);
    setVista(destino);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        className="mb-0 flex shrink-0 border border-[var(--velo-border)] border-b-0 bg-white rounded-t-lg overflow-x-auto"
        role="tablist"
        aria-label="Vista de incidencias"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            onClick={() => setVista(id)}
            className={`relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors sm:px-5 ${
              vista === id
                ? "text-[var(--velo-brand)]"
                : "text-[var(--velo-text-subtle)] hover:text-[var(--velo-text-muted)]"
            }`}
          >
            <Icon size={16} strokeWidth={2.25} />
            {label}
            {vista === id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--velo-brand)]" />
            )}
          </button>
        ))}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-lg border border-[var(--velo-border)] bg-slate-50/50"
        role="tabpanel"
      >
        {vista === "lista" ? (
          <IncidenciasListaView
            items={items}
            loading={loading}
            sinLeerPorIncidencia={sinLeerPorIncidencia}
            onOpen={onOpen}
          />
        ) : vista === "roadmap" ? (
          <IncidenciasRoadmapView
            items={items}
            epicas={epicas}
            loading={loading}
            onOpen={onOpen}
            onFiltrarEpica={(epicaId) => {
              onFiltrarEpica?.(epicaId);
              setVista("tablero");
            }}
            onIrVista={(destino, epicaId) => irVistaConEpica(destino, epicaId)}
          />
        ) : vista === "cronograma" ? (
          <IncidenciasCronogramaView
            items={items}
            loading={loading}
            puedeEditarPlazo={puedeEditarPlazo}
            onOpen={onOpen}
            onCambiarPlazo={onCambiarPlazo}
          />
        ) : vista === "calendario" ? (
          <IncidenciasCalendarioView items={items} loading={loading} onOpen={onOpen} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            <KanbanBoard
              items={items}
              me={me}
              esAdmin={esAdmin}
              loading={loading}
              readOnly={readOnly}
              sinLeerPorIncidencia={sinLeerPorIncidencia}
              onOpen={onOpen}
              onMove={onMove}
            />
          </div>
        )}
      </div>
    </section>
  );
}
