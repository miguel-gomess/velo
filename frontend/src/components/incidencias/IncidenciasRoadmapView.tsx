import { useMemo } from "react";
import type { Epica, Incidencia } from "../../lib/api";
import { parseFechaApi } from "../../lib/fechas";
import { normalizarEstado } from "../../lib/incidencias";
import { slaEstado } from "../portal/portalUtils";
import { Calendar, ChevronRight, GanttChart, Inbox, Loader2, Map as MapIcon } from "lucide-react";

type Props = {
  items: Incidencia[];
  epicas: Epica[];
  loading?: boolean;
  onOpen: (inc: Incidencia) => void;
  onFiltrarEpica?: (epicaId: number | "sin_epica" | null) => void;
  onIrVista?: (vista: "cronograma" | "calendario", epicaId: number | "sin_epica" | null) => void;
};

type FilaRoadmap = {
  clave: string;
  epicaId: number | "sin_epica" | null;
  epicaClave: string;
  epicaNombre: string;
  epicaColor: string;
  total: number;
  abiertas: number;
  cerradas: number;
  pctCerradas: number;
  conLimite: number;
  enPlazo: number;
  fueraPlazo: number;
  pctSla: number | null;
  proximaLimite: Incidencia | null;
};

function esCerrada(estado: string): boolean {
  return normalizarEstado(estado) === "cerrada";
}

function filasRoadmap(items: Incidencia[], epicas: Epica[]): FilaRoadmap[] {
  const map = new Map<number | "sin_epica", Incidencia[]>();

  for (const inc of items) {
    const key: number | "sin_epica" = inc.epica_id ?? "sin_epica";
    const lista = map.get(key) ?? [];
    lista.push(inc);
    map.set(key, lista);
  }

  const filas: FilaRoadmap[] = [];

  for (const ep of epicas) {
    const incs = map.get(ep.id) ?? [];
    map.delete(ep.id);
    filas.push(construirFila(`ep-${ep.id}`, ep.id, ep.clave, ep.nombre, ep.color, incs));
  }

  const sinEpica = map.get("sin_epica") ?? [];
  if (sinEpica.length > 0) {
    filas.push(
      construirFila("sin-epica", "sin_epica", "SIN-EPICA", "Sin épica", "#94a3b8", sinEpica),
    );
  }

  return filas.sort((a, b) => b.total - a.total || a.epicaNombre.localeCompare(b.epicaNombre, "es"));
}

function construirFila(
  clave: string,
  epicaId: number | "sin_epica" | null,
  epicaClave: string,
  epicaNombre: string,
  epicaColor: string,
  incs: Incidencia[],
): FilaRoadmap {
  let cerradas = 0;
  let conLimite = 0;
  let enPlazo = 0;
  let fueraPlazo = 0;
  let proxima: Incidencia | null = null;
  let proximaTs = Infinity;

  for (const inc of incs) {
    if (esCerrada(inc.estado)) cerradas++;

    if (inc.fecha_limite) {
      conLimite++;
      const sla = slaEstado(inc.fecha_limite, inc.estado);
      if (sla === "overdue") fueraPlazo++;
      else enPlazo++;

      if (!esCerrada(inc.estado)) {
        const ts = parseFechaApi(inc.fecha_limite).getTime();
        if (ts < proximaTs) {
          proximaTs = ts;
          proxima = inc;
        }
      }
    }
  }

  const total = incs.length;
  return {
    clave,
    epicaId,
    epicaClave,
    epicaNombre,
    epicaColor: epicaColor.trim() || "#6366f1",
    total,
    abiertas: total - cerradas,
    cerradas,
    pctCerradas: total > 0 ? Math.round((cerradas / total) * 100) : 0,
    conLimite,
    enPlazo,
    fueraPlazo,
    pctSla: conLimite > 0 ? Math.round((enPlazo / conLimite) * 100) : null,
    proximaLimite: proxima,
  };
}

export function IncidenciasRoadmapView({
  items,
  epicas,
  loading,
  onOpen,
  onFiltrarEpica,
  onIrVista,
}: Props) {
  const filas = useMemo(() => filasRoadmap(items, epicas), [items, epicas]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="animate-spin text-[var(--velo-brand)]" size={22} />
        <p className="text-xs text-[var(--velo-text-muted)]">Cargando roadmap…</p>
      </div>
    );
  }

  if (items.length === 0 && epicas.length === 0) {
    return (
      <p className="flex flex-1 flex-col items-center justify-center py-12 text-sm text-[var(--velo-text-muted)]">
        <Inbox className="text-[#c1c7d0]" size={32} strokeWidth={1.5} />
        Sin incidencias para mostrar
      </p>
    );
  }

  return (
    <section className="inc-roadmap flex min-h-0 flex-1 flex-col overflow-auto p-4 sm:p-5" aria-label="Roadmap">
      <header className="inc-roadmap-header">
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-[var(--velo-brand)]" />
          <h2 className="text-sm font-bold text-[var(--velo-text)]">Roadmap por épica</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--velo-text-muted)]">
          Avance de cierre, cumplimiento SLA y acceso al cronograma o calendario filtrado.
        </p>
      </header>

      <div className="inc-roadmap-grid mt-4">
        {filas.map((fila) => (
          <article
            key={fila.clave}
            className="inc-roadmap-card"
            style={{ ["--epic-color" as string]: fila.epicaColor }}
          >
            <div className="inc-roadmap-card-head">
              <span className="inc-roadmap-stripe" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="inc-roadmap-key">{fila.epicaClave}</p>
                <h3 className="inc-roadmap-name">{fila.epicaNombre}</h3>
              </div>
              <span className="inc-roadmap-total">{fila.total}</span>
            </div>

            <div className="inc-roadmap-metrics">
              <div>
                <span className="inc-roadmap-metric-label">Cerradas</span>
                <span className="inc-roadmap-metric-value">{fila.pctCerradas}%</span>
                <div className="inc-roadmap-progress" aria-hidden>
                  <span style={{ width: `${fila.pctCerradas}%` }} />
                </div>
                <span className="inc-roadmap-metric-sub">
                  {fila.cerradas} de {fila.total}
                </span>
              </div>
              <div>
                <span className="inc-roadmap-metric-label">SLA en plazo</span>
                <span
                  className={`inc-roadmap-metric-value ${fila.fueraPlazo > 0 ? "inc-roadmap-metric-value--warn" : ""}`}
                >
                  {fila.pctSla != null ? `${fila.pctSla}%` : "—"}
                </span>
                <span className="inc-roadmap-metric-sub">
                  {fila.conLimite > 0
                    ? `${fila.enPlazo} ok · ${fila.fueraPlazo} fuera`
                    : "Sin plazos"}
                </span>
              </div>
            </div>

            {fila.proximaLimite ? (
              <button
                type="button"
                onClick={() => onOpen(fila.proximaLimite!)}
                className="inc-roadmap-next"
              >
                <span>Próximo límite</span>
                <strong className="truncate">
                  VEL-{fila.proximaLimite.id} · {fila.proximaLimite.titulo}
                </strong>
                <span>
                  {parseFechaApi(fila.proximaLimite.fecha_limite!).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </button>
            ) : (
              <p className="inc-roadmap-next inc-roadmap-next--empty">Sin plazos pendientes</p>
            )}

            <div className="inc-roadmap-actions">
              {onFiltrarEpica ? (
                <button
                  type="button"
                  onClick={() => onFiltrarEpica(fila.epicaId)}
                  className="inc-roadmap-btn"
                >
                  Filtrar
                  <ChevronRight size={14} />
                </button>
              ) : null}
              {onIrVista ? (
                <>
                  <button
                    type="button"
                    onClick={() => onIrVista?.("cronograma", fila.epicaId)}
                    className="inc-roadmap-btn inc-roadmap-btn--ghost"
                  >
                    <GanttChart size={14} />
                    Cronograma
                  </button>
                  <button
                    type="button"
                    onClick={() => onIrVista?.("calendario", fila.epicaId)}
                    className="inc-roadmap-btn inc-roadmap-btn--ghost"
                  >
                    <Calendar size={14} />
                    Calendario
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
