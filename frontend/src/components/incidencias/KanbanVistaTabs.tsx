import { useState } from "react";
import type { Incidencia, Usuario } from "../../lib/api";
import type { EstadoKanban } from "../../lib/incidencias";
import { KanbanBoard } from "./KanbanBoard";
import { IncidenciasListaView } from "./IncidenciasListaView";
import { Columns3, List } from "lucide-react";

type Props = {
  items: Incidencia[];
  me: Usuario;
  esAdmin?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  sinLeerPorIncidencia?: Record<number, number>;
  onOpen: (inc: Incidencia) => void;
  onMove: (id: number, estado: EstadoKanban) => void | Promise<void>;
};

const TABS = [
  { id: "tablero" as const, label: "Tablero", icon: Columns3 },
  { id: "lista" as const, label: "Lista", icon: List },
];

export function KanbanVistaTabs({
  items,
  me,
  esAdmin = false,
  loading,
  readOnly,
  sinLeerPorIncidencia,
  onOpen,
  onMove,
}: Props) {
  const [vista, setVista] = useState<"tablero" | "lista">("tablero");

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        className="mb-0 flex shrink-0 border border-[var(--velo-border)] border-b-0 bg-white rounded-t-lg"
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
            className={`relative inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
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
