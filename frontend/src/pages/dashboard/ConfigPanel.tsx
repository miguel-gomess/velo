import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { equipoAccentClass } from "../../lib/equipos";
import { SLA_PRIORIDADES, formatoPlazoSla } from "../../lib/sla";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  BarChart3,
  Clock,
  ExternalLink,
  RefreshCw,
  Settings2,
  Users,
  UsersRound,
} from "lucide-react";

type Equipo = { codigo: string; nombre: string; miembros?: number };

export function ConfigPanel() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/equipos"), { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al cargar equipos");
      setEquipos(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const totalMiembros = useMemo(
    () => equipos.reduce((n, e) => n + (e.miembros ?? 0), 0),
    [equipos],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Configuración"
        description="Parámetros del portal, equipos de gestión y plazos SLA. Los agentes se asignan a equipos desde el directorio."
        actions={
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--velo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--velo-text)] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        }
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
            Equipos activos
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--velo-text)]">
            {loading ? "—" : equipos.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
            Agentes en equipos
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--velo-text)]">
            {loading ? "—" : totalMiembros}
          </p>
          <p className="mt-1 text-[11px] text-[var(--velo-text-muted)]">
            Vinculación explícita en base de datos
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
            Niveles SLA
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--velo-text)]">
            {SLA_PRIORIDADES.length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--velo-text-muted)]">
            Plazo automático al crear incidencias
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UsersRound size={18} className="text-[var(--velo-brand)]" />
          <h2 className="text-lg font-semibold text-[var(--velo-text)]">Equipos de gestión</h2>
        </div>
        <p className="max-w-2xl text-sm text-[var(--velo-text-muted)]">
          Cada equipo filtra el tablero Kanban y las plantillas del portal. Para dar acceso a un
          agente, edita su ficha en el{" "}
          <Link
            to="/dashboard/directorio"
            className="font-medium text-[var(--velo-brand)] underline-offset-2 hover:underline"
          >
            directorio
          </Link>{" "}
          (departamento distinto de ADMIN).
        </p>

        {loading && equipos.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-[var(--velo-border)] bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {equipos.map((e) => {
              const accent = equipoAccentClass(e.codigo);
              const miembros = e.miembros ?? 0;
              return (
                <li
                  key={e.codigo}
                  className={`rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm ring-1 ${accent.ring}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${accent.bg} ${accent.text}`}
                    >
                      {e.codigo}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                      {miembros} {miembros === 1 ? "agente" : "agentes"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--velo-text)]">{e.nombre}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[var(--velo-brand)]" />
            <h2 className="text-lg font-semibold text-[var(--velo-text)]">Plazos SLA</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--velo-text-muted)]">
            La fecha límite se calcula al crear o cambiar la prioridad de una incidencia.
          </p>
          <ul className="mt-4 divide-y divide-[var(--velo-border)]">
            {SLA_PRIORIDADES.map((s) => (
              <li key={s.clave} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-[var(--velo-text)]">{s.etiqueta}</span>
                <span className="rounded-lg bg-[var(--velo-brand-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--velo-brand)]">
                  {formatoPlazoSla(s.horas)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-[var(--velo-brand)]" />
            <h2 className="text-lg font-semibold text-[var(--velo-text)]">Accesos rápidos</h2>
          </div>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                to="/dashboard/directorio"
                className="flex items-center gap-3 rounded-xl border border-[var(--velo-border)] px-4 py-3 text-sm font-medium text-[var(--velo-text)] transition hover:border-[var(--velo-brand)] hover:bg-slate-50/80"
              >
                <Users size={18} className="shrink-0 text-[var(--velo-brand)]" />
                <span className="flex-1">Directorio de usuarios</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/analisis"
                className="flex items-center gap-3 rounded-xl border border-[var(--velo-border)] px-4 py-3 text-sm font-medium text-[var(--velo-text)] transition hover:border-[var(--velo-brand)] hover:bg-slate-50/80"
              >
                <BarChart3 size={18} className="shrink-0 text-[var(--velo-brand)]" />
                <span className="flex-1">Análisis y rendimiento</span>
              </Link>
            </li>
            <li>
              <a
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--velo-border)] px-4 py-3 text-sm font-medium text-[var(--velo-text)] transition hover:border-[var(--velo-brand)] hover:bg-slate-50/80"
              >
                <ExternalLink size={18} className="shrink-0 text-[var(--velo-brand)]" />
                <span className="flex-1">Portal del empleado</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
