import { useState } from "react";
import { IncidenciaActividadChat } from "../portal/IncidenciaActividadChat";
import { IncidenciaHistorial } from "./IncidenciaHistorial";

type Props = {
  incidenciaId: number;
  puedeComentar: boolean;
  className?: string;
};

export function ActividadHistorialTabs({
  incidenciaId,
  puedeComentar,
  className = "",
}: Props) {
  const [tab, setTab] = useState<"actividad" | "historico">("actividad");

  return (
    <section className={className}>
      <div className="issue-activity-tabs" role="tablist" aria-label="Actividad de la incidencia">
        {(["actividad", "historico"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`issue-activity-tab ${tab === id ? "is-active" : ""}`}
          >
            {id === "actividad" ? "Actividad" : "Histórico"}
          </button>
        ))}
      </div>

      <div className="issue-activity-panel" role="tabpanel">
        {tab === "historico" ? (
          <IncidenciaHistorial incidenciaId={incidenciaId} embedded />
        ) : (
          <IncidenciaActividadChat
            incidenciaId={incidenciaId}
            puedeComentar={puedeComentar}
          />
        )}
      </div>
    </section>
  );
}
