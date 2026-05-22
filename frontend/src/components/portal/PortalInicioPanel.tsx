import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  HelpCircle,
  Inbox,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Incidencia } from "../../lib/api";
import { PORTAL_CATEGORIAS } from "../../lib/portalCategorias";
import { PortalStatCard } from "./PortalStatCard";
import { PortalBadgeEstado } from "./PortalBadgeEstado";
import { PortalIncidenciaRolBadge } from "./PortalIncidenciaRolBadge";
import {
  colorEstado,
  incidenciaEsAsignada,
  incidenciaEsSolicitante,
  labelSlaEstado,
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
    .slice(0, 3);
  const novedadesTotal = Object.values(sinLeerPorIncidencia).reduce((a, b) => a + b, 0);
  const asignadasCount = misSolicitudes.filter((i) => incidenciaEsAsignada(i, usuarioId)).length;
  const creadasCount = misSolicitudes.filter((i) => incidenciaEsSolicitante(i, usuarioId)).length;

  const textoResumen =
    stats.total === 0
      ? "Crea tu primera solicitud o espera una asignación del equipo."
      : asignadasCount > 0 && creadasCount === 0
        ? `${asignadasCount} incidencia${asignadasCount === 1 ? "" : "s"} asignadas — revisa plazos y chat.`
        : `${stats.total} solicitud${stats.total === 1 ? "" : "es"} — revisa novedades y conversación.`;

  return (
    <div className="portal-inicio-fit portal-animate-in flex min-h-0 flex-col gap-2.5 lg:h-full lg:overflow-hidden lg:gap-3">
      <section className="portal-card portal-inicio-hero relative shrink-0 overflow-hidden p-3.5 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-[var(--velo-brand)]/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--velo-brand)]">
              Tu espacio de trabajo
            </p>
            <h1 className="mt-0.5 text-lg font-extrabold tracking-tight text-[var(--velo-text)] sm:text-xl">
              Hola, {nombreUsuario}
            </h1>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--velo-text-muted)]">{textoResumen}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onNueva}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--velo-brand)] to-[#0747a6] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20"
            >
              <Plus size={15} />
              Nueva solicitud
            </button>
            {stats.total > 0 && (
              <button
                type="button"
                onClick={onVerTodas}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--velo-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--velo-text)] hover:border-[var(--velo-brand)]"
              >
                Ver todas
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard icon={Inbox} label="Total solicitudes" value={stats.total} tone="brand" compact />
        <PortalStatCard
          icon={TrendingUp}
          label="En gestión"
          value={stats.activas + stats.pendientes}
          tone="amber"
          compact
        />
        <PortalStatCard icon={CheckCircle2} label="Completadas" value={stats.resueltas} tone="green" compact />
        <PortalStatCard
          icon={Bell}
          label="Mensajes nuevos"
          value={novedadesTotal}
          tone="rose"
          hint={novedadesTotal > 0 ? "Revisa el chat" : undefined}
          compact
        />
      </div>

      {atencion.length > 0 && (
        <section className="portal-card max-h-[28%] shrink-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--velo-border)] bg-gradient-to-r from-amber-50/80 to-white px-3 py-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-600" />
              <h2 className="text-xs font-extrabold text-[var(--velo-text)]">Requieren tu atención</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
              {atencion.length}
            </span>
          </div>
          <ul className="divide-y divide-[var(--velo-border)] overflow-y-auto">
            {atencion.slice(0, 2).map((inc) => (
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

      <div className="grid min-h-0 flex-1 gap-2.5 lg:grid-cols-[1.15fr_1fr] lg:gap-3">
        <section className="portal-card flex min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--velo-border)] px-3 py-2">
            <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--velo-text)]">
              <MessageSquare size={14} className="text-[var(--velo-brand)]" />
              Últimas actualizaciones
            </h2>
            {stats.total > 0 && (
              <button
                type="button"
                onClick={onVerTodas}
                className="text-[10px] font-semibold text-[var(--velo-brand)] hover:underline"
              >
                Ver listado
              </button>
            )}
          </div>
          {recientes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
              <Inbox className="mb-2 text-slate-300" size={28} />
              <p className="text-xs font-medium text-[var(--velo-text)]">Sin actividad todavía</p>
              <p className="mt-0.5 text-[10px] text-[var(--velo-text-muted)]">
                Tus solicitudes aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-[var(--velo-border)] overflow-y-auto">
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

        <div className="flex min-h-0 flex-col gap-2.5 lg:gap-2">
          <div className="portal-card flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <h2 className="flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-[var(--velo-text)]">
              <Sparkles size={14} className="text-[var(--velo-brand)]" />
              Acceso rápido por área
            </h2>
            <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-y-auto content-start sm:grid-cols-2">
              {PORTAL_CATEGORIAS.slice(0, 6).map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoria(cat.id)}
                    className="flex items-center gap-2 rounded-lg border border-[var(--velo-border)] p-2 text-left transition hover:border-[var(--velo-brand)] hover:bg-slate-50/80"
                  >
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: cat.accentSoft, color: cat.accent }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-bold leading-tight text-[var(--velo-text)]">
                        {cat.label}
                      </span>
                      <span className="block truncate text-[9px] text-[var(--velo-text-subtle)]">
                        {cat.equipoGestion}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="portal-card shrink-0 p-3">
            <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--velo-text)]">
              <HelpCircle size={14} className="text-[var(--velo-brand)]" />
              Cómo funciona
            </h2>
            <ol className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                "Crea una solicitud por área.",
                "El equipo responde en el chat.",
                "Avisos si hay novedades.",
              ].map((texto, i) => (
                <li
                  key={texto}
                  className="flex gap-2 text-[10px] leading-snug text-[var(--velo-text-muted)]"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[9px] font-bold text-[var(--velo-brand)]">
                    {i + 1}
                  </span>
                  <span>{texto}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
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
        className="flex w-full gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50/80"
      >
        <span
          className="mt-0.5 h-8 w-0.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-[var(--velo-brand)]">VEL-{inc.id}</span>
            <PortalBadgeEstado estado={inc.estado} />
            <PortalIncidenciaRolBadge inc={inc} userId={usuarioId} />
            {sinLeer > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {sinLeer > 9 ? "9+" : sinLeer}
              </span>
            )}
            {slaLabel && (
              <span
                className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                  sla === "overdue"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {slaLabel}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-[var(--velo-text)]">
            {inc.titulo}
          </p>
        </div>
        <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300" />
      </button>
    </li>
  );
}
