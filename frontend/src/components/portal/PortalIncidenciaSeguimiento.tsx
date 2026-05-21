import { useEffect, useState } from "react";
import {
  apiGetIncidencia,
  apiUpdateIncidencia,
  type IncidenciaDetalle,
  type Usuario,
} from "../../lib/api";
import { PrioridadIncidenciaSelector } from "../incidencias/selectors/PrioridadIncidenciaSelector";
import { CopiarEnlaceIncidenciaButton } from "../incidencias/CopiarEnlaceIncidenciaButton";
import {
  colorEstado,
  labelEstado,
  normalizarEstado,
  normalizarPrioridadValor,
} from "../../lib/incidencias";
import { DescripcionVistaJira } from "../incidencias/TextoConImagenes";
import { ActividadHistorialTabs } from "../incidencias/ActividadHistorialTabs";
import { UserAvatar } from "../UserAvatar";
import { labelEquipo } from "../../lib/equipos";
import { labelSlaEstado, slaEstado } from "./portalUtils";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from "lucide-react";

type Props = {
  incidenciaId: number;
  usuarioActualId: number;
  me: Usuario;
  onBack?: () => void;
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalIncidenciaSeguimiento({
  incidenciaId,
  usuarioActualId,
  me,
  onBack,
}: Props) {
  const [detalle, setDetalle] = useState<IncidenciaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descAbierta, setDescAbierta] = useState(true);
  const [guardandoPrioridad, setGuardandoPrioridad] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiGetIncidencia(incidenciaId)
      .then((r) => {
        if (!cancelled) setDetalle(r.item);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la solicitud");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [incidenciaId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[var(--velo-brand)]" size={32} />
        <p className="text-sm font-medium text-[var(--velo-text-muted)]">Cargando solicitud…</p>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center">
        <AlertCircle className="text-rose-500" size={36} />
        <p className="text-sm font-medium text-rose-700">{error ?? "Solicitud no encontrada"}</p>
      </div>
    );
  }

  const estadoNorm = normalizarEstado(detalle.estado);
  const estadoColor = colorEstado(detalle.estado);
  const sla = slaEstado(detalle.fecha_limite, detalle.estado);
  const slaLabel = labelSlaEstado(sla);
  const cerrada = estadoNorm === "cerrada";
  const puedeComentar =
    (detalle.usuario_id === usuarioActualId || detalle.asignado_a === usuarioActualId) &&
    estadoNorm !== "cerrada";

  const puedeEditarPrioridad =
    !cerrada &&
    (detalle.usuario_id === usuarioActualId || detalle.asignado_a === usuarioActualId);

  async function cambiarPrioridad(prioridad: string) {
    if (!detalle || !puedeEditarPrioridad) return;
    const p = normalizarPrioridadValor(prioridad);
    if (p === normalizarPrioridadValor(detalle.prioridad)) return;
    setGuardandoPrioridad(true);
    try {
      const { item } = await apiUpdateIncidencia(detalle.id, { prioridad: p });
      setDetalle(item as IncidenciaDetalle);
    } catch {
      setError("No se pudo actualizar la prioridad");
    } finally {
      setGuardandoPrioridad(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[var(--velo-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--velo-brand)] shadow-sm lg:hidden"
        >
          <ArrowLeft size={16} />
          Volver al listado
        </button>
      )}

      <header className="shrink-0 overflow-hidden rounded-2xl border border-[var(--velo-border)] bg-gradient-to-br from-slate-50 to-white">
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${estadoColor}, ${estadoColor}88)` }}
        />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold tracking-wide text-[var(--velo-brand)]">
                VEL-{detalle.id}
              </p>
              <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-[var(--velo-text)]">
                {detalle.titulo}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md"
                style={{ backgroundColor: estadoColor }}
              >
                {labelEstado(detalle.estado)}
              </span>
              <CopiarEnlaceIncidenciaButton incidenciaId={detalle.id} me={me} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {puedeEditarPrioridad ? (
              <div className="min-w-[9rem] max-w-[11rem]">
                <PrioridadIncidenciaSelector
                  value={normalizarPrioridadValor(detalle.prioridad)}
                  disabled={guardandoPrioridad}
                  permitirTodos={false}
                  compact
                  onChange={(p) => {
                    if (p) void cambiarPrioridad(p);
                  }}
                />
              </div>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-[var(--velo-border)] bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--velo-text)]">
                {normalizarPrioridadValor(detalle.prioridad)}
              </span>
            )}
            {detalle.equipo_codigo && (
              <span className="inline-flex items-center rounded-lg border border-[var(--velo-border)] bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--velo-text-muted)]">
                {labelEquipo(detalle.equipo_codigo)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-[10px] text-[var(--velo-text-subtle)]">
              <Calendar size={12} />
              {formatFecha(detalle.fecha_creacion)}
            </span>
            {detalle.fecha_limite && !cerrada && (
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  sla === "overdue"
                    ? "bg-rose-100 text-rose-800"
                    : sla === "warning"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-50 text-emerald-800"
                }`}
              >
                <CalendarClock size={12} />
                {slaLabel ?? "En plazo"} · {formatFecha(detalle.fecha_limite)}
              </span>
            )}
          </div>

          {slaLabel && !cerrada && (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                sla === "overdue"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {sla === "overdue"
                ? "Esta solicitud ha superado el plazo objetivo de respuesta. El equipo sigue trabajando en ella; puedes escribir en el chat si necesitas más información."
                : "El plazo de respuesta vence pronto. Si es urgente, añade un comentario en la actividad."}
            </p>
          )}

          {cerrada && (detalle.resolucion || detalle.motivo_cierre) && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                <CheckCircle2 size={14} />
                Resolución
              </p>
              {detalle.resolucion && (
                <p className="mt-2 text-sm leading-relaxed text-emerald-950">{detalle.resolucion}</p>
              )}
              {detalle.motivo_cierre && (
                <p className="mt-1 text-xs text-emerald-800/90">
                  Motivo: {detalle.motivo_cierre}
                  {detalle.fecha_cierre && ` · ${formatFecha(detalle.fecha_cierre)}`}
                </p>
              )}
            </div>
          )}

          {detalle.asignado_nombre && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--velo-brand-muted)] bg-[var(--velo-brand-muted)]/40 px-4 py-3">
              <UserAvatar nombre={detalle.asignado_nombre} userId={detalle.asignado_a} size="md" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--velo-brand)]">
                  Persona asignada
                </p>
                <p className="text-sm font-semibold text-[var(--velo-text)]">
                  {detalle.asignado_nombre}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="mt-4 shrink-0 overflow-hidden rounded-xl border border-[var(--velo-border)] bg-white">
        <button
          type="button"
          onClick={() => setDescAbierta((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--velo-text-subtle)] hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <User size={14} />
            Descripción de la solicitud
          </span>
          {descAbierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {descAbierta && (
          <div className="border-t border-[var(--velo-border)] bg-slate-50/50 px-4 py-4">
            <div className="max-h-48 overflow-y-auto">
              <DescripcionVistaJira texto={detalle.descripcion} vacioLabel="Sin descripción" />
            </div>
          </div>
        )}
      </section>

      <ActividadHistorialTabs
        incidenciaId={incidenciaId}
        puedeComentar={puedeComentar}
        className="mt-4 flex min-h-0 flex-1 flex-col"
      />
    </div>
  );
}
