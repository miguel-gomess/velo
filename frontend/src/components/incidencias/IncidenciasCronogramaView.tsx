import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Incidencia } from "../../lib/api";
import { datetimeLocalToIso, parseFechaApi } from "../../lib/fechas";
import { labelEstado, normalizarEstado, temaPorEstado } from "../../lib/incidencias";
import { slaEstado } from "../portal/portalUtils";
import { ChevronLeft, ChevronRight, ChevronDown, Inbox, Loader2 } from "lucide-react";

type Props = {
  items: Incidencia[];
  loading?: boolean;
  puedeEditarPlazo?: boolean;
  onOpen: (inc: Incidencia) => void;
  onCambiarPlazo?: (id: number, fecha_limite: string) => void | Promise<void>;
};

const MS_DIA = 86_400_000;
const DIAS_VENTANA = 42;

type GrupoEpica = {
  clave: string;
  epicaNombre: string | null;
  epicaClave: string | null;
  epicaColor: string | null;
  incidencias: Incidencia[];
};

function inicioDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function finDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function esFinDeSemana(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function inicioBarra(inc: Incidencia): number {
  return parseFechaApi(inc.fecha_creacion).getTime();
}

function finBarra(inc: Incidencia): number {
  const norm = normalizarEstado(inc.estado);
  if (norm === "cerrada" && inc.fecha_cierre) {
    return parseFechaApi(inc.fecha_cierre).getTime();
  }
  if (inc.fecha_limite) return parseFechaApi(inc.fecha_limite).getTime();
  return Date.now();
}

function generarDias(inicio: Date, fin: Date): Date[] {
  const dias: Date[] = [];
  const cursor = inicioDia(inicio);
  const end = inicioDia(fin);
  while (cursor.getTime() <= end.getTime()) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

function claseSlaBarra(sla: ReturnType<typeof slaEstado>): string {
  if (sla === "overdue") return "inc-crono-bar--overdue";
  if (sla === "warning") return "inc-crono-bar--warning";
  return "";
}

function fechaDesdeClienteX(
  clientX: number,
  trackRect: DOMRect,
  inicioVentana: Date,
  rangoMs: number,
): Date {
  const ratio = Math.min(1, Math.max(0, (clientX - trackRect.left) / trackRect.width));
  const ms = inicioVentana.getTime() + ratio * rangoMs;
  const d = inicioDia(new Date(ms));
  d.setHours(17, 0, 0, 0);
  return d;
}

function isoDesdeFechaLocal(d: Date): string | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return datetimeLocalToIso(local);
}

export function IncidenciasCronogramaView({
  items,
  loading,
  puedeEditarPlazo = false,
  onOpen,
  onCambiarPlazo,
}: Props) {
  const hoy = inicioDia(new Date());
  const [inicioVentana, setInicioVentana] = useState(() => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 7);
    return inicioDia(d);
  });
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});
  const [arrastrandoId, setArrastrandoId] = useState<number | null>(null);
  const [previewLimite, setPreviewLimite] = useState<Record<number, string>>({});
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const finVentana = useMemo(() => {
    const d = new Date(inicioVentana);
    d.setDate(d.getDate() + DIAS_VENTANA - 1);
    return finDia(d);
  }, [inicioVentana]);

  const rangoMs = finVentana.getTime() - inicioVentana.getTime() + 1;

  const { grupos, conPlazo, sinPlazo, fueraPlazo } = useMemo(() => {
    const map = new Map<string, GrupoEpica>();
    let sin = 0;
    let overdue = 0;

    const ordenados = [...items].sort((a, b) => {
      const ta = a.fecha_limite ? parseFechaApi(a.fecha_limite).getTime() : Infinity;
      const tb = b.fecha_limite ? parseFechaApi(b.fecha_limite).getTime() : Infinity;
      return ta - tb;
    });

    for (const inc of ordenados) {
      if (!inc.fecha_limite) {
        sin++;
        continue;
      }
      const limite = previewLimite[inc.id] ?? inc.fecha_limite;
      if (slaEstado(limite, inc.estado) === "overdue") overdue++;

      const key = inc.epica_id != null ? `ep-${inc.epica_id}` : "sin-epica";
      let grupo = map.get(key);
      if (!grupo) {
        grupo = {
          clave: key,
          epicaNombre: inc.epica_nombre ?? null,
          epicaClave: inc.epica_clave ?? null,
          epicaColor: inc.epica_color ?? null,
          incidencias: [],
        };
        map.set(key, grupo);
      }
      grupo.incidencias.push(inc);
    }

    const lista = [...map.values()].sort((a, b) => {
      if (a.clave === "sin-epica") return 1;
      if (b.clave === "sin-epica") return -1;
      return (a.epicaNombre ?? "").localeCompare(b.epicaNombre ?? "", "es");
    });

    return {
      grupos: lista,
      conPlazo: ordenados.filter((i) => i.fecha_limite).length,
      sinPlazo: sin,
      fueraPlazo: overdue,
    };
  }, [items, previewLimite]);

  const dias = useMemo(
    () => generarDias(inicioVentana, finVentana),
    [inicioVentana, finVentana],
  );

  const posicionHoy = ((hoy.getTime() - inicioVentana.getTime()) / rangoMs) * 100;

  const tituloRango = `${inicioVentana.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })} – ${finVentana.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;

  function irVentana(delta: number) {
    setInicioVentana((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * DIAS_VENTANA);
      return inicioDia(d);
    });
  }

  function irHoy() {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 7);
    setInicioVentana(inicioDia(d));
  }

  function calcularBarra(inc: Incidencia) {
    const limiteEfectivo = previewLimite[inc.id] ?? inc.fecha_limite;
    const incPreview = limiteEfectivo ? { ...inc, fecha_limite: limiteEfectivo } : inc;
    const t0 = inicioBarra(inc);
    const t1 = Math.max(t0 + MS_DIA / 4, finBarra(incPreview));
    const left = ((t0 - inicioVentana.getTime()) / rangoMs) * 100;
    const width = ((t1 - t0) / rangoMs) * 100;
    const visible = t1 >= inicioVentana.getTime() && t0 <= finVentana.getTime();
    return { left, width: Math.max(width, 1.2), visible };
  }

  function toggleGrupo(clave: string) {
    setGruposAbiertos((prev) => ({
      ...prev,
      [clave]: prev[clave] === false,
    }));
  }

  function grupoExpandido(clave: string): boolean {
    return gruposAbiertos[clave] !== false;
  }

  const finalizarArrastre = useCallback(
    async (incId: number, clientX: number) => {
      const track = trackRefs.current.get(incId);
      const inc = items.find((i) => i.id === incId);
      if (!track || !inc?.fecha_limite || !onCambiarPlazo) {
        setArrastrandoId(null);
        setPreviewLimite((prev) => {
          const next = { ...prev };
          delete next[incId];
          return next;
        });
        return;
      }

      const nueva = fechaDesdeClienteX(clientX, track.getBoundingClientRect(), inicioVentana, rangoMs);
      const iso = isoDesdeFechaLocal(nueva);
      setArrastrandoId(null);
      setPreviewLimite((prev) => {
        const next = { ...prev };
        delete next[incId];
        return next;
      });

      if (!iso || iso === inc.fecha_limite) return;
      const creacion = parseFechaApi(inc.fecha_creacion).getTime();
      if (nueva.getTime() < creacion) return;

      await onCambiarPlazo(incId, iso);
    },
    [items, inicioVentana, onCambiarPlazo, rangoMs],
  );

  useEffect(() => {
    if (arrastrandoId == null) return;

    function onMove(e: PointerEvent) {
      const track = trackRefs.current.get(arrastrandoId!);
      if (!track) return;
      const nueva = fechaDesdeClienteX(
        e.clientX,
        track.getBoundingClientRect(),
        inicioVentana,
        rangoMs,
      );
      const iso = isoDesdeFechaLocal(nueva);
      if (iso) setPreviewLimite((prev) => ({ ...prev, [arrastrandoId!]: iso }));
    }

    function onUp(e: PointerEvent) {
      void finalizarArrastre(arrastrandoId!, e.clientX);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [arrastrandoId, finalizarArrastre, inicioVentana, rangoMs]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="animate-spin text-[var(--velo-brand)]" size={22} />
        <p className="text-xs text-[var(--velo-text-muted)]">Cargando cronograma…</p>
      </div>
    );
  }

  return (
    <section className="inc-crono flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Cronograma">
      <header className="inc-crono-toolbar">
        <div className="inc-crono-toolbar__stats">
          <span className="inc-crono-toolbar__title">Línea temporal</span>
          <span className="inc-crono-toolbar__sep" aria-hidden>
            ·
          </span>
          <span>
            <strong>{conPlazo}</strong> tareas
          </span>
          {fueraPlazo > 0 && (
            <span className="inc-crono-toolbar__alert">{fueraPlazo} fuera de plazo</span>
          )}
          {puedeEditarPlazo && (
            <span className="inc-crono-toolbar__hint">Arrastra el borde derecho para cambiar el plazo</span>
          )}
        </div>

        <div className="inc-crono-toolbar__nav">
          <button type="button" onClick={() => irVentana(-1)} className="inc-crono-nav-btn" aria-label="Anterior">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={irHoy} className="inc-crono-nav-btn inc-crono-nav-btn--text">
            Hoy
          </button>
          <button type="button" onClick={() => irVentana(1)} className="inc-crono-nav-btn" aria-label="Siguiente">
            <ChevronRight size={16} />
          </button>
          <span className="inc-crono-toolbar__range">{tituloRango}</span>
        </div>
      </header>

      {conPlazo === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <Inbox className="text-[#c1c7d0]" size={32} strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-[var(--velo-text-muted)]">
            Sin tareas con fecha límite
          </p>
          <p className="mt-1 text-xs text-[var(--velo-text-subtle)]">
            Asigna un plazo para verlas en el cronograma
          </p>
        </div>
      ) : (
        <div className="inc-crono-body min-h-0 flex-1 overflow-auto">
          <div className="inc-crono-board" style={{ ["--inc-crono-dias" as string]: dias.length }}>
            <div className="inc-crono-head grid">
              <div className="inc-crono-label-col inc-crono-head-side">
                <span className="inc-crono-head-side-label">Trabajo</span>
              </div>
              <div className="inc-crono-track-head">
                <div className="inc-crono-months" aria-hidden>
                  {dias.map((d, i) => {
                    const mostrarMes =
                      i === 0 || d.getDate() === 1 || (d.getDay() === 1 && d.getDate() <= 7);
                    return (
                      <span key={`m-${d.toISOString()}`} className="inc-crono-month-cell">
                        {mostrarMes
                          ? d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
                          : ""}
                      </span>
                    );
                  })}
                </div>
                <div className="inc-crono-days">
                  {dias.map((d) => {
                    const esHoy = d.getTime() === hoy.getTime();
                    const finde = esFinDeSemana(d);
                    return (
                      <div
                        key={d.toISOString()}
                        className={`inc-crono-day ${finde ? "inc-crono-day--weekend" : ""} ${esHoy ? "inc-crono-day--hoy" : ""}`}
                      >
                        <span className="inc-crono-day-dow">
                          {d.toLocaleDateString("es-ES", { weekday: "narrow" })}
                        </span>
                        <span className="inc-crono-day-num">{d.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
                {posicionHoy >= 0 && posicionHoy <= 100 && (
                  <span className="inc-crono-hoy-tag" style={{ left: `${posicionHoy}%` }}>
                    Hoy
                  </span>
                )}
              </div>
            </div>

            {grupos.map((grupo) => {
              const abierto = grupoExpandido(grupo.clave);
              const epColor = grupo.epicaColor?.trim() || "#6554c0";

              return (
                <div key={grupo.clave} className="inc-crono-grupo">
                  <button
                    type="button"
                    className="inc-crono-epic-row"
                    onClick={() => toggleGrupo(grupo.clave)}
                    style={{ ["--epic-color" as string]: epColor }}
                  >
                    <ChevronDown
                      size={14}
                      className={`inc-crono-epic-chevron ${abierto ? "" : "inc-crono-epic-chevron--closed"}`}
                    />
                    <span className="inc-crono-epic-stripe" aria-hidden />
                    <span className="inc-crono-epic-key">{grupo.epicaClave ?? "SIN-EPICA"}</span>
                    <span className="inc-crono-epic-name">{grupo.epicaNombre ?? "Sin épica"}</span>
                    <span className="inc-crono-epic-count">{grupo.incidencias.length}</span>
                  </button>

                  {abierto &&
                    grupo.incidencias.map((inc) => {
                      const barra = calcularBarra(inc);
                      const limiteEfectivo = previewLimite[inc.id] ?? inc.fecha_limite;
                      const sla = slaEstado(limiteEfectivo, inc.estado);
                      const tema = temaPorEstado(inc.estado);
                      const estadoNorm = normalizarEstado(inc.estado);
                      const limiteTxt = parseFechaApi(limiteEfectivo!).toLocaleString("es-ES", {
                        day: "numeric",
                        month: "short",
                      });
                      const editable =
                        puedeEditarPlazo &&
                        onCambiarPlazo &&
                        estadoNorm !== "cerrada" &&
                        inc.fecha_limite;

                      return (
                        <div key={inc.id} className="inc-crono-row grid">
                          <button
                            type="button"
                            onClick={() => onOpen(inc)}
                            className="inc-crono-label-col inc-crono-issue"
                            title={inc.titulo}
                          >
                            <span
                              className="inc-crono-issue-type"
                              style={{ backgroundColor: tema.color }}
                              aria-hidden
                            />
                            <span className="inc-crono-issue-key">VEL-{inc.id}</span>
                            <span className="inc-crono-issue-summary">{inc.titulo}</span>
                          </button>

                          <div
                            className="inc-crono-track-col"
                            ref={(el) => {
                              if (el) trackRefs.current.set(inc.id, el);
                              else trackRefs.current.delete(inc.id);
                            }}
                          >
                            <div className="inc-crono-grid-bg" aria-hidden>
                              {dias.map((d) => (
                                <span
                                  key={d.toISOString()}
                                  className={`inc-crono-grid-cell ${esFinDeSemana(d) ? "inc-crono-grid-cell--weekend" : ""} ${d.getTime() === hoy.getTime() ? "inc-crono-grid-cell--hoy" : ""}`}
                                />
                              ))}
                            </div>

                            {posicionHoy >= 0 && posicionHoy <= 100 && (
                              <span
                                className="inc-crono-hoy-line"
                                style={{ left: `${posicionHoy}%` }}
                                aria-hidden
                              />
                            )}

                            {barra.visible && (
                              <div
                                className={`inc-crono-bar ${claseSlaBarra(sla)} ${estadoNorm === "cerrada" ? "inc-crono-bar--done" : ""} ${arrastrandoId === inc.id ? "inc-crono-bar--dragging" : ""}`}
                                style={{
                                  left: `${Math.min(Math.max(barra.left, 0), 99)}%`,
                                  width: `${Math.min(barra.width, 100 - Math.max(barra.left, 0))}%`,
                                  backgroundColor: tema.color,
                                }}
                                title={`${inc.titulo} · ${labelEstado(inc.estado)} · límite ${limiteTxt}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => onOpen(inc)}
                                  className="inc-crono-bar-main"
                                >
                                  <span className="inc-crono-bar-label truncate">
                                    {barra.width > 8 ? inc.titulo : `VEL-${inc.id}`}
                                  </span>
                                  {sla === "overdue" && (
                                    <span className="inc-crono-bar-flag" aria-label="Fuera de plazo" />
                                  )}
                                </button>
                                {editable ? (
                                  <span
                                    role="separator"
                                    aria-label="Arrastrar para cambiar fecha límite"
                                    className="inc-crono-bar-handle"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setArrastrandoId(inc.id);
                                    }}
                                  />
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {sinPlazo > 0 && (
            <p className="inc-crono-footer-note">
              {sinPlazo} tarea{sinPlazo === 1 ? "" : "s"} sin plazo no{" "}
              {sinPlazo === 1 ? "se muestra" : "se muestran"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
