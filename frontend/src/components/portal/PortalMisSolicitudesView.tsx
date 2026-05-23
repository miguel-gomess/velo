import { useMemo, useState } from "react";
import {
  Clock,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type { Incidencia, Usuario } from "../../lib/api";
import { labelEquipo } from "../../lib/equipos";
import { PortalIncidenciaSeguimiento } from "./PortalIncidenciaSeguimiento";
import { PortalBadgeEstado } from "./PortalBadgeEstado";
import { PortalIncidenciaRolBadge } from "./PortalIncidenciaRolBadge";
import { TiempoRelativo } from "../TiempoRelativo";
import {
  colorEstado,
  filtrarSolicitudes,
  labelSlaEstado,
  prioridadTone,
  slaEstado,
  type FiltroListaSolicitudes,
} from "./portalUtils";

const FILTROS: { id: FiltroListaSolicitudes; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "activas", label: "Activas" },
  { id: "novedades", label: "Con novedades" },
  { id: "cerradas", label: "Cerradas" },
];

type Props = {
  misSolicitudes: Incidencia[];
  listLoading: boolean;
  sinLeerPorIncidencia: Record<number, number>;
  me: Usuario;
  usuarioId: number;
  seleccionadaId: number | null;
  onSeleccionar: (id: number | null) => void;
  onRefresh: () => void;
  onNueva: () => void;
  onRefrescarNotif: () => void;
};

export function PortalMisSolicitudesView({
  misSolicitudes,
  listLoading,
  sinLeerPorIncidencia,
  me,
  usuarioId,
  seleccionadaId,
  onSeleccionar,
  onRefresh,
  onNueva,
  onRefrescarNotif,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroListaSolicitudes>("todas");

  const listadoFiltrado = useMemo(
    () => filtrarSolicitudes(misSolicitudes, filtro, sinLeerPorIncidencia, busqueda),
    [misSolicitudes, filtro, sinLeerPorIncidencia, busqueda],
  );

  const mostrarDetalleMovil = seleccionadaId != null;
  const sinSolicitudes = !listLoading && misSolicitudes.length === 0;

  if (sinSolicitudes && seleccionadaId == null) {
    return (
      <div className="portal-animate-in portal-stagger-2 flex min-h-0 flex-1 flex-col">
        <div className="portal-card flex min-h-0 flex-1 flex-col">
          <EmptySeguimiento onNueva={onNueva} variant="full" />
        </div>
      </div>
    );
  }

  return (
    <div className="portal-animate-in portal-stagger-2 flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
      <aside
        className={`portal-card flex min-h-0 flex-col overflow-hidden ${
          mostrarDetalleMovil ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="border-b border-[var(--velo-border)] bg-gradient-to-b from-slate-50/80 to-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[var(--velo-text)]">Tus solicitudes</h2>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-[var(--velo-border)] bg-white p-2 text-[var(--velo-text-subtle)] transition hover:text-[var(--velo-brand)]"
              aria-label="Actualizar"
            >
              <RefreshCw size={15} className={listLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="relative mt-3">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título o VEL-…"
              className="w-full rounded-xl border-2 border-[var(--velo-border)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--velo-brand)] focus:ring-2 focus:ring-[var(--velo-brand-muted)]"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => {
              const active = filtro === f.id;
              const count =
                f.id === "novedades"
                  ? misSolicitudes.filter((i) => (sinLeerPorIncidencia[i.id] ?? 0) > 0).length
                  : null;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    active
                      ? "bg-[var(--velo-brand)] text-white shadow-sm"
                      : "border border-[var(--velo-border)] bg-white text-[var(--velo-text-muted)] hover:border-slate-300"
                  }`}
                >
                  {f.label}
                  {count != null && count > 0 && (
                    <span className={active ? " text-white/90" : " text-rose-600"}> ({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {listLoading && misSolicitudes.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="animate-spin text-[var(--velo-brand)]" size={28} />
              <span className="text-xs text-[var(--velo-text-muted)]">Cargando…</span>
            </li>
          ) : listadoFiltrado.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <Inbox className="mx-auto mb-3 text-slate-300" size={40} />
              <p className="text-sm font-medium text-[var(--velo-text)]">
                {misSolicitudes.length === 0 ? "Sin solicitudes aún" : "Sin resultados"}
              </p>
              <p className="mt-1 text-xs text-[var(--velo-text-muted)]">
                {misSolicitudes.length === 0
                  ? "Crea tu primera desde «Nueva solicitud»"
                  : filtro !== "todas"
                    ? "Prueba otro filtro o búsqueda"
                    : "Prueba otra búsqueda"}
              </p>
            </li>
          ) : (
            listadoFiltrado.map((inc) => {
              const activa = seleccionadaId === inc.id;
              const sinLeer = sinLeerPorIncidencia[inc.id] ?? 0;
              const accent = colorEstado(inc.estado);
              const sla = slaEstado(inc.fecha_limite, inc.estado);
              const slaLabel = labelSlaEstado(sla);
              return (
                <li key={inc.id} className="mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSeleccionar(inc.id);
                      onRefrescarNotif();
                    }}
                    className={`relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-left transition-all ${
                      activa
                        ? "bg-[var(--velo-brand-muted)] shadow-md ring-2 ring-[var(--velo-brand)]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="absolute bottom-0 left-0 top-0 w-1 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex items-center justify-between gap-2 pl-2">
                      <span className="font-mono text-[11px] font-bold text-[var(--velo-brand)]">
                        VEL-{inc.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {sinLeer > 0 && (
                          <span
                            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                            title="Mensajes nuevos"
                          >
                            {sinLeer > 9 ? "9+" : sinLeer}
                          </span>
                        )}
                        <PortalBadgeEstado estado={inc.estado} />
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 pl-2 text-sm font-semibold leading-snug text-[var(--velo-text)]">
                      {inc.titulo}
                    </p>
                    {inc.solicitante_nombre && inc.asignado_a === usuarioId && inc.usuario_id !== usuarioId && (
                      <p className="mt-1 pl-2 text-[10px] text-[var(--velo-text-subtle)]">
                        Solicitante: {inc.solicitante_nombre}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-2">
                      <PortalIncidenciaRolBadge inc={inc} userId={usuarioId} />
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${prioridadTone(inc.prioridad)}`}
                      >
                        {inc.prioridad}
                      </span>
                      {inc.equipo_codigo && (
                        <span className="text-[9px] font-semibold text-[var(--velo-text-subtle)]">
                          {labelEquipo(inc.equipo_codigo)}
                        </span>
                      )}
                      {slaLabel && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            sla === "overdue" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {slaLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-1 pl-2 text-[10px] text-[var(--velo-text-subtle)]">
                      <Clock size={11} />
                      <TiempoRelativo iso={inc.fecha_actualizacion ?? inc.fecha_creacion} />
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section
        className={`portal-card flex min-h-0 flex-1 flex-col overflow-hidden ${
          mostrarDetalleMovil ? "flex" : "hidden lg:flex"
        }`}
      >
        {seleccionadaId != null ? (
          <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
            <PortalIncidenciaSeguimiento
              incidenciaId={seleccionadaId}
              usuarioActualId={usuarioId}
              me={me}
              onBack={() => onSeleccionar(null)}
            />
          </div>
        ) : (
          <EmptySeguimiento onNueva={onNueva} variant="pane" />
        )}
      </section>
      </div>
    </div>
  );
}

function EmptySeguimiento({
  onNueva,
  variant = "pane",
}: {
  onNueva: () => void;
  variant?: "pane" | "full";
}) {
  const full = variant === "full";
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col items-center justify-center text-center ${
        full ? "bg-gradient-to-b from-slate-50/90 to-white px-6 py-12 sm:px-12" : "px-8 py-10"
      }`}
    >
      <div
        className={`mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--velo-brand-muted)] to-white shadow-inner ${
          full ? "size-24" : "size-20"
        }`}
      >
        <MessageSquare className="text-[var(--velo-brand)]" size={full ? 44 : 36} />
      </div>
      <h3 className={`font-bold text-[var(--velo-text)] ${full ? "text-xl sm:text-2xl" : "text-lg"}`}>
        {full ? "Aún no tienes solicitudes" : "Selecciona una solicitud"}
      </h3>
      <p
        className={`mt-2 leading-relaxed text-[var(--velo-text-muted)] ${
          full ? "max-w-md text-sm sm:text-base" : "max-w-sm text-sm"
        }`}
      >
        {full
          ? "Crea la primera y podrás seguirla desde aquí: estado, plazos y conversación con el equipo."
          : "Aquí verás el estado, los plazos y podrás escribir con el equipo responsable."}
      </p>
      <button
        type="button"
        onClick={onNueva}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--velo-brand)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl"
      >
        <Plus size={16} />
        Nueva solicitud
      </button>
    </div>
  );
}
