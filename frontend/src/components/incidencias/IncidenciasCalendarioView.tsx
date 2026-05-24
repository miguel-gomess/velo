import { useMemo, useState } from "react";
import type { Incidencia } from "../../lib/api";
import { parseFechaApi } from "../../lib/fechas";
import { temaPorEstado } from "../../lib/incidencias";
import { slaEstado } from "../portal/portalUtils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Props = {
  items: Incidencia[];
  loading?: boolean;
  onOpen: (inc: Incidencia) => void;
};

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function claveDiaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function claveDiaDesdeIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = parseFechaApi(iso);
  if (Number.isNaN(d.getTime())) return null;
  return claveDiaLocal(d);
}

function generarCeldasMes(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

function claseSlaChip(sla: ReturnType<typeof slaEstado>): string {
  if (sla === "overdue") return "inc-cal-event--overdue";
  if (sla === "warning") return "inc-cal-event--warning";
  if (sla === "ok") return "inc-cal-event--ok";
  return "inc-cal-event--muted";
}

function accentSla(sla: ReturnType<typeof slaEstado>, fallback: string): string {
  if (sla === "overdue") return "#dc2626";
  if (sla === "warning") return "#ca8a04";
  if (sla === "ok") return "#2563eb";
  return fallback;
}

export function IncidenciasCalendarioView({ items, loading, onOpen }: Props) {
  const hoy = new Date();
  const [mesVisible, setMesVisible] = useState(() => ({
    year: hoy.getFullYear(),
    month: hoy.getMonth(),
  }));

  const { porDia, sinPlazo, fueraPlazo, enMes } = useMemo(() => {
    const map = new Map<string, Incidencia[]>();
    let sin = 0;
    let overdue = 0;
    const mesInicio = new Date(mesVisible.year, mesVisible.month, 1);
    const mesFin = new Date(mesVisible.year, mesVisible.month + 1, 0, 23, 59, 59, 999);
    let countMes = 0;

    for (const inc of items) {
      const key = claveDiaDesdeIso(inc.fecha_limite);
      if (!key) {
        sin++;
        continue;
      }
      const lista = map.get(key) ?? [];
      lista.push(inc);
      map.set(key, lista);

      const t = parseFechaApi(inc.fecha_limite!).getTime();
      if (t >= mesInicio.getTime() && t <= mesFin.getTime()) countMes++;

      if (slaEstado(inc.fecha_limite, inc.estado) === "overdue") overdue++;
    }

    for (const lista of map.values()) {
      lista.sort(
        (a, b) =>
          parseFechaApi(a.fecha_limite!).getTime() - parseFechaApi(b.fecha_limite!).getTime(),
      );
    }

    return { porDia: map, sinPlazo: sin, fueraPlazo: overdue, enMes: countMes };
  }, [items, mesVisible.month, mesVisible.year]);

  const celdas = useMemo(
    () => generarCeldasMes(mesVisible.year, mesVisible.month),
    [mesVisible.month, mesVisible.year],
  );

  const tituloMes = new Date(mesVisible.year, mesVisible.month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  function irMes(delta: number) {
    setMesVisible((m) => {
      const d = new Date(m.year, m.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function irHoy() {
    const n = new Date();
    setMesVisible({ year: n.getFullYear(), month: n.getMonth() });
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="animate-spin text-[var(--velo-brand)]" size={22} />
        <p className="text-xs text-[var(--velo-text-muted)]">Cargando calendario…</p>
      </div>
    );
  }

  return (
    <section className="inc-cal flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Calendario de plazos">
      <header className="inc-cal-header flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--velo-border)] bg-gradient-to-r from-slate-50 to-white px-3 py-2.5 sm:px-4">
        <div className="mr-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--velo-text-muted)]">
          <span>
            <span className="font-bold tabular-nums text-[var(--velo-text)]">{enMes}</span> con plazo
            este mes
          </span>
          {fueraPlazo > 0 && (
            <span className="font-semibold text-red-700">{fueraPlazo} fuera de plazo</span>
          )}
          {sinPlazo > 0 && (
            <span>
              <span className="font-bold tabular-nums">{sinPlazo}</span> sin fecha límite
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => irMes(-1)}
            className="inc-cal-nav-btn"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={irHoy} className="inc-cal-hoy-btn">
            Hoy
          </button>
          <button
            type="button"
            onClick={() => irMes(1)}
            className="inc-cal-nav-btn"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="w-full text-center text-sm font-semibold capitalize text-[var(--velo-text)] sm:w-auto sm:min-w-[10rem] sm:text-left">
          {tituloMes}
        </p>
      </header>

      <div className="inc-cal-body min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="inc-cal-leyenda mb-3 flex flex-wrap gap-3 text-[10px] font-medium text-[var(--velo-text-muted)]">
          <span className="inc-cal-leyenda-item">
            <span className="inc-cal-leyenda-dot inc-cal-event--ok" /> En plazo
          </span>
          <span className="inc-cal-leyenda-item">
            <span className="inc-cal-leyenda-dot inc-cal-event--warning" /> Vence pronto
          </span>
          <span className="inc-cal-leyenda-item">
            <span className="inc-cal-leyenda-dot inc-cal-event--overdue" /> Fuera de plazo
          </span>
        </div>

        <div className="inc-cal-grid" role="grid" aria-label={tituloMes}>
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="inc-cal-weekday" role="columnheader">
              {d}
            </div>
          ))}

          {celdas.map(({ date, inMonth }) => {
            const key = claveDiaLocal(date);
            const eventos = porDia.get(key) ?? [];
            const esHoy = claveDiaLocal(hoy) === key;
            const visibles = eventos.slice(0, 3);
            const resto = eventos.length - visibles.length;

            return (
              <div
                key={key}
                role="gridcell"
                className={`inc-cal-cell ${inMonth ? "" : "inc-cal-cell--fuera"} ${esHoy ? "inc-cal-cell--hoy" : ""}`}
              >
                <div className="inc-cal-cell-day">
                  <span className={esHoy ? "inc-cal-day-num inc-cal-day-num--hoy" : "inc-cal-day-num"}>
                    {date.getDate()}
                  </span>
                  {eventos.length > 0 && (
                    <span className="inc-cal-cell-count">{eventos.length}</span>
                  )}
                </div>

                <ul className="inc-cal-events">
                  {visibles.map((inc) => {
                    const sla = slaEstado(inc.fecha_limite, inc.estado);
                    const tema = temaPorEstado(inc.estado);
                    return (
                      <li key={inc.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(inc)}
                          className={`inc-cal-event ${claseSlaChip(sla)}`}
                          title={`${inc.titulo} — ${parseFechaApi(inc.fecha_limite!).toLocaleString("es-ES")}`}
                        >
                          <span
                            className="inc-cal-event-accent"
                            style={{ backgroundColor: accentSla(sla, tema.color) }}
                            aria-hidden
                          />
                          <span className="inc-cal-event-id">VEL-{inc.id}</span>
                          <span className="inc-cal-event-title">{inc.titulo}</span>
                        </button>
                      </li>
                    );
                  })}
                  {resto > 0 && <li className="inc-cal-more">+{resto} más</li>}
                </ul>
              </div>
            );
          })}
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-center text-[11px] text-[var(--velo-text-subtle)]">
            No hay incidencias con plazo en este listado. Navega por el calendario o crea una solicitud
            con fecha límite.
          </p>
        ) : sinPlazo > 0 ? (
          <p className="mt-4 text-center text-[11px] text-[var(--velo-text-subtle)]">
            {sinPlazo} incidencia{sinPlazo === 1 ? "" : "s"} sin fecha límite asignada (no aparecen en el
            calendario).
          </p>
        ) : null}
      </div>
    </section>
  );
}
