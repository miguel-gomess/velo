import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  HelpCircle,
  Inbox,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Incidencia } from "../../lib/api";
import { labelEquipo } from "../../lib/equipos";
import { PORTAL_CATEGORIAS } from "../../lib/portalCategorias";
import { PortalStatCard } from "./PortalStatCard";
import { PortalBadgeEstado } from "./PortalBadgeEstado";
import { PortalIncidenciaRolBadge } from "./PortalIncidenciaRolBadge";
import { TiempoRelativo } from "../TiempoRelativo";
import {
  colorEstado,
  incidenciaEsAsignada,
  incidenciaEsSolicitante,
  labelSlaEstado,
  prioridadTone,
  slaEstado,
  solicitudesRequierenAtencion,
} from "./portalUtils";

type Stats = ReturnType<typeof import("./portalUtils").contarPorEstado>;

type Props = {
  nombreUsuario: string;
  usuarioId: number;
  stats: Stats;
  misSolicitudes: Incidencia[];
  sinLeerPorIncidencia: Record<number, number>;
  onNueva: () => void;
  onVerTodas: () => void;
  onAbrir: (id: number) => void;
  onCategoria: (categoriaId: string) => void;
};

export function PortalInicioPanel({
  nombreUsuario,
  usuarioId,
  stats,
  misSolicitudes,
  sinLeerPorIncidencia,
  onNueva,
  onVerTodas,
  onAbrir,
  onCategoria,
}: Props) {
  const atencion = solicitudesRequierenAtencion(misSolicitudes, sinLeerPorIncidencia);
  const recientes = [...misSolicitudes]
    .sort(
      (a, b) =>
        new Date(b.fecha_actualizacion ?? b.fecha_creacion).getTime() -
        new Date(a.fecha_actualizacion ?? a.fecha_creacion).getTime(),
    )
    .slice(0, 4);
  const novedadesTotal = Object.values(sinLeerPorIncidencia).reduce((a, b) => a + b, 0);
  const asignadasCount = misSolicitudes.filter((i) => incidenciaEsAsignada(i, usuarioId)).length;
  const creadasCount = misSolicitudes.filter((i) => incidenciaEsSolicitante(i, usuarioId)).length;

  const textoResumen =
    stats.total === 0
      ? "Aún no tienes solicitudes ni incidencias asignadas. Crea la primera o espera una asignación del equipo."
      : asignadasCount > 0 && creadasCount === 0
        ? `Tienes ${asignadasCount} incidencia${asignadasCount === 1 ? "" : "s"} asignadas. Revisa novedades, plazos y el chat con el solicitante.`
        : `Tienes ${stats.total} solicitud${stats.total === 1 ? "" : "es"} (creadas o asignadas). Revisa novedades, plazos y conversación con el equipo.`;

  return (
    <div className="portal-animate-in space-y-6">
      <section className="portal-card portal-inicio-hero relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-[var(--velo-brand)]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--velo-brand)]">
              Tu espacio de trabajo
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--velo-text)] sm:text-3xl">
              Hola, {nombreUsuario}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--velo-text-muted)]">
              {textoResumen}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onNueva}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--velo-brand)] to-[#0747a6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
            >
              <Plus size={18} />
              Nueva solicitud
            </button>
            {stats.total > 0 && (
              <button
                type="button"
                onClick={onVerTodas}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--velo-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--velo-text)] hover:border-[var(--velo-brand)]"
              >
                Ver todas
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard icon={Inbox} label="Total solicitudes" value={stats.total} tone="brand" />
        <PortalStatCard
          icon={TrendingUp}
          label="En gestión"
          value={stats.activas + stats.pendientes}
          tone="amber"
        />
        <PortalStatCard icon={CheckCircle2} label="Completadas" value={stats.resueltas} tone="green" />
        <PortalStatCard
          icon={Bell}
          label="Mensajes nuevos"
          value={novedadesTotal}
          tone="rose"
          hint={novedadesTotal > 0 ? "Revisa el chat de tus tickets" : "Sin novedades"}
        />
      </div>

      {atencion.length > 0 && (
        <section className="portal-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--velo-border)] bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-sm font-extrabold text-[var(--velo-text)]">Requieren tu atención</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
              {atencion.length}
            </span>
          </div>
          <ul className="divide-y divide-[var(--velo-border)]">
            {atencion.map((inc) => (
              <SolicitudFilaCompacta
                key={inc.id}
                inc={inc}
                usuarioId={usuarioId}
                sinLeer={sinLeerPorIncidencia[inc.id] ?? 0}
                onClick={() => onAbrir(inc.id)}
              />
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="portal-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--velo-border)] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--velo-text)]">
              <MessageSquare size={16} className="text-[var(--velo-brand)]" />
              Últimas actualizaciones
            </h2>
            {stats.total > 0 && (
              <button
                type="button"
                onClick={onVerTodas}
                className="text-xs font-semibold text-[var(--velo-brand)] hover:underline"
              >
                Ver listado
              </button>
            )}
          </div>
          {recientes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
              <Inbox className="mb-3 text-slate-300" size={40} />
              <p className="text-sm font-medium text-[var(--velo-text)]">Sin actividad todavía</p>
              <p className="mt-1 text-xs text-[var(--velo-text-muted)]">
                Tus solicitudes aparecerán aquí tras crearlas.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--velo-border)]">
              {recientes.map((inc) => (
                <SolicitudFilaCompacta
                  key={inc.id}
                  inc={inc}
                  usuarioId={usuarioId}
                  sinLeer={sinLeerPorIncidencia[inc.id] ?? 0}
                  onClick={() => onAbrir(inc.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="portal-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--velo-text)]">
              <Sparkles size={16} className="text-[var(--velo-brand)]" />
              Acceso rápido por área
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {PORTAL_CATEGORIAS.slice(0, 6).map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoria(cat.id)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--velo-border)] p-3 text-left transition hover:border-[var(--velo-brand)] hover:bg-slate-50/80"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: cat.accentSoft, color: cat.accent }}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-[var(--velo-text)]">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-[var(--velo-text-subtle)]">{cat.equipoGestion}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="portal-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--velo-text)]">
              <HelpCircle size={16} className="text-[var(--velo-brand)]" />
              Cómo funciona
            </h2>
            <ol className="mt-4 space-y-3">
              {[
                "Crea una solicitud eligiendo el área y describiendo el problema.",
                "El equipo la asigna y puede escribirte en el chat de la solicitud.",
                "Recibirás avisos si hay mensajes nuevos o cambios de estado.",
              ].map((texto, i) => (
                <li key={texto} className="flex gap-3 text-xs leading-relaxed text-[var(--velo-text-muted)]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[10px] font-bold text-[var(--velo-brand)]">
                    {i + 1}
                  </span>
                  {texto}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}

function SolicitudFilaCompacta({
  inc,
  usuarioId,
  sinLeer,
  onClick,
}: {
  inc: Incidencia;
  usuarioId: number;
  sinLeer: number;
  onClick: () => void;
}) {
  const sla = slaEstado(inc.fecha_limite, inc.estado);
  const slaLabel = labelSlaEstado(sla);
  const accent = colorEstado(inc.estado);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
      >
        <span
          className="mt-1 h-10 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[var(--velo-brand)]">VEL-{inc.id}</span>
            <PortalBadgeEstado estado={inc.estado} />
            <PortalIncidenciaRolBadge inc={inc} userId={usuarioId} />
            {sinLeer > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {sinLeer > 9 ? "9+" : sinLeer} nuevo{sinLeer === 1 ? "" : "s"}
              </span>
            )}
            {slaLabel && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  sla === "overdue"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {slaLabel}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-[var(--velo-text)]">{inc.titulo}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--velo-text-subtle)]">
            <span className={`rounded border px-1.5 py-0.5 font-bold uppercase ${prioridadTone(inc.prioridad)}`}>
              {inc.prioridad}
            </span>
            {inc.equipo_codigo && (
              <span>{labelEquipo(inc.equipo_codigo)}</span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Clock size={10} />
              <TiempoRelativo iso={inc.fecha_actualizacion ?? inc.fecha_creacion} />
            </span>
          </div>
        </div>
        <ArrowRight size={16} className="mt-2 shrink-0 text-slate-300" />
      </button>
    </li>
  );
}
