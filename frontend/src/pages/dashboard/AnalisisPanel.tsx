import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGetIncidenciasStats, type IncidenciasStats } from "../../lib/api";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Download,
  Inbox,
  Kanban,
  RefreshCw,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

function exportarCsv(data: IncidenciasStats) {
  const lines: string[] = [
    "tipo,clave,valor",
    `total,incidencias,${data.totalIncidencias}`,
    `kpi,tiempo_medio_horas,${data.tiempoMedioResolucionHoras ?? ""}`,
    `sla,en_plazo_pct,${data.sla?.porcentaje_en_plazo ?? ""}`,
  ];
  for (const d of data.porDepartamento) {
    lines.push(`departamento,${d.departamento},${d.total}`);
  }
  for (const e of data.porEstado) {
    lines.push(`estado,${e.estado},${e.total}`);
  }
  for (const t of data.tendenciaSemanal ?? []) {
    lines.push(`semana,${t.semana},creadas=${t.creadas};cerradas=${t.cerradas}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `velo-analisis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const PIE_COLORS = ["#0052cc", "#0d9488", "#d97706", "#e11d48", "#64748b", "#7c3aed"];

const BAR_FILLS = {
  Abiertas: "#818cf8",
  "En curso": "#f59e0b",
  Cerradas: "#34d399",
  Otras: "#94a3b8",
};

const RANGOS = [
  { id: "todo", label: "Todo", dias: null as number | null },
  { id: "7d", label: "7 días", dias: 7 },
  { id: "30d", label: "30 días", dias: 30 },
  { id: "90d", label: "90 días", dias: 90 },
] as const;

function isoHaceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function labelEstado(estado: string): string {
  const e = estado.toLowerCase().replace(/_/g, " ");
  if (e === "abierta" || e === "abierto") return "Abiertas";
  if (e === "cerrada" || e === "cerrado") return "Cerradas";
  if (e === "en curso" || e === "en_curso") return "En curso";
  return estado;
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value > 0);
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-[var(--velo-border)] bg-white px-3 py-2.5 text-xs shadow-md">
      <p className="mb-2 border-b border-[var(--velo-border)] pb-1.5 font-semibold text-[var(--velo-text)]">
        {label}
      </p>
      <ul className="space-y-1">
        {rows.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-8 text-[var(--velo-text-muted)]">
            <span className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: BAR_FILLS[p.name as keyof typeof BAR_FILLS] ?? "#94a3b8" }}
              />
              {p.name}
            </span>
            <span className="tabular-nums font-medium text-[var(--velo-text)]">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-[var(--velo-border)] bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-[var(--velo-text)]">{p.name}</p>
      <p className="mt-0.5 tabular-nums text-[var(--velo-text-muted)]">{p.value} incidencias</p>
    </div>
  );
}

function AnalisisKpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: typeof Inbox;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "brand" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    brand: "from-blue-500/10 to-blue-600/5 text-[var(--velo-brand)]",
    emerald: "from-emerald-500/12 to-green-500/5 text-emerald-700",
    amber: "from-amber-500/12 to-orange-500/5 text-amber-700",
    violet: "from-violet-500/12 to-purple-500/5 text-violet-700",
  };
  return (
    <div
      className={`rounded-2xl border border-[var(--velo-border)] bg-gradient-to-br p-4 shadow-sm ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 shadow-sm">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--velo-text)]">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--velo-text-muted)]">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--velo-text-subtle)]">{sub}</p>}
    </div>
  );
}

export function PanelAnalisis() {
  const [data, setData] = useState<IncidenciasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [rangoActivo, setRangoActivo] = useState<string>("todo");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await apiGetIncidenciasStats({
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setData(s);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    void load();
  }, [load]);

  function aplicarRango(dias: number | null, id: string) {
    setRangoActivo(id);
    if (dias === null) {
      setDesde("");
      setHasta("");
      return;
    }
    setDesde(isoHaceDias(dias));
    setHasta(new Date().toISOString().slice(0, 10));
  }

  const barData = useMemo(() => {
    if (!data?.porDepartamento.length) return [];
    return data.porDepartamento.map((d) => ({
      nombre: d.departamento,
      Abiertas: d.abiertas,
      "En curso": d.en_curso,
      Cerradas: d.cerradas,
      Otras: d.otras,
      total: d.total,
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.porEstado.length) return [];
    return data.porEstado.map((r) => ({
      name: labelEstado(r.estado),
      value: r.total,
      key: r.estado,
    }));
  }, [data]);

  const vacio = !loading && data && data.totalIncidencias === 0;
  const conDatos = !loading && data && data.totalIncidencias > 0;

  const filtroLabel =
    desde || hasta
      ? `${desde || "…"} → ${hasta || "hoy"}`
      : "Sin filtro de fechas";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Análisis de incidencias"
        description="Rendimiento por departamento del solicitante, cumplimiento SLA y carga del equipo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--velo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--velo-text)] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[var(--velo-brand)]" : ""} />
              Actualizar
            </button>
            {data && data.totalIncidencias > 0 ? (
              <button
                type="button"
                onClick={() => exportarCsv(data)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--velo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--velo-text)] shadow-sm transition hover:bg-slate-50"
              >
                <Download size={15} />
                CSV
              </button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--velo-border)] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => aplicarRango(r.dias, r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                rangoActivo === r.id
                  ? "bg-[var(--velo-brand)] text-white shadow-sm"
                  : "bg-slate-100 text-[var(--velo-text-muted)] hover:bg-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] font-medium text-[var(--velo-text-muted)]">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setRangoActivo("custom");
              }}
              className="rounded-lg border border-[var(--velo-border)] px-2.5 py-1.5 text-sm text-[var(--velo-text)]"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] font-medium text-[var(--velo-text-muted)]">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setRangoActivo("custom");
              }}
              className="rounded-lg border border-[var(--velo-border)] px-2.5 py-1.5 text-sm text-[var(--velo-text)]"
            />
          </label>
        </div>
        <p className="w-full text-[10px] text-[var(--velo-text-subtle)] sm:w-auto sm:text-right">
          {filtroLabel}
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-[var(--velo-border)] bg-slate-100"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <AnalisisKpi icon={Inbox} label="Total incidencias" value={data.totalIncidencias} />
            <AnalisisKpi
              icon={Timer}
              label="Tiempo medio cierre"
              value={
                data.tiempoMedioResolucionHoras != null
                  ? `${data.tiempoMedioResolucionHoras} h`
                  : "—"
              }
              tone="emerald"
            />
            <AnalisisKpi
              icon={Building2}
              label="Departamentos"
              value={data.porDepartamento.length}
              tone="amber"
            />
            <AnalisisKpi
              icon={TrendingUp}
              label="Estados distintos"
              value={data.porEstado.length}
            />
            <AnalisisKpi
              icon={ShieldCheck}
              label="SLA en plazo"
              value={
                data.sla?.porcentaje_en_plazo != null ? `${data.sla.porcentaje_en_plazo}%` : "—"
              }
              sub={
                data.sla
                  ? `${data.sla.en_plazo} de ${data.sla.con_limite} con límite`
                  : "Sin datos de plazo"
              }
              tone="violet"
            />
          </div>

          {vacio ? (
            <section className="rounded-2xl border border-dashed border-[var(--velo-border)] bg-gradient-to-br from-slate-50/80 to-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
                <BarChart3 size={28} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[var(--velo-text)]">
                Aún no hay datos para analizar
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--velo-text-muted)]">
                Los gráficos y el desglose por departamento aparecerán cuando existan incidencias en
                el sistema. Puedes crear solicitudes desde el portal o cargar datos de demostración.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/dashboard/incidencias"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--velo-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--velo-brand-hover)]"
                >
                  <Kanban size={16} />
                  Ir al tablero
                </Link>
                <a
                  href="/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--velo-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--velo-text)] hover:bg-slate-50"
                >
                  Portal empleado
                </a>
              </div>
            </section>
          ) : null}

          {conDatos ? (
            <div className="space-y-5">
              {(data.tendenciaSemanal?.length ?? 0) > 0 ? (
                <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--velo-brand)]" />
                    <h2 className="text-sm font-bold text-[var(--velo-text)]">Tendencia semanal</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--velo-text-muted)]">
                    Incidencias creadas vs cerradas por semana.
                  </p>
                  <div className="mt-4 h-[200px] w-full min-w-0 overflow-x-auto sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.tendenciaSemanal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="creadas"
                          name="Creadas"
                          stroke="#0052cc"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="cerradas"
                          name="Cerradas"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-5">
                <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm lg:col-span-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[var(--velo-brand)]" />
                    <h2 className="text-sm font-bold text-[var(--velo-text)]">
                      Por departamento del solicitante
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--velo-text-muted)]">
                    Abiertas, en curso, cerradas y otras por área.
                  </p>
                  <div className="mt-4 h-[240px] w-full min-w-0 overflow-x-auto sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 44 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="nombre"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          interval={0}
                          angle={-22}
                          textAnchor="end"
                          height={56}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(0, 82, 204, 0.06)" }}
                          content={<BarTooltip />}
                        />
                        <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                        <Bar
                          dataKey="Abiertas"
                          stackId="s"
                          fill={BAR_FILLS.Abiertas}
                          maxBarSize={40}
                        />
                        <Bar dataKey="En curso" stackId="s" fill={BAR_FILLS["En curso"]} maxBarSize={40} />
                        <Bar dataKey="Cerradas" stackId="s" fill={BAR_FILLS.Cerradas} maxBarSize={40} />
                        <Bar
                          dataKey="Otras"
                          stackId="s"
                          fill={BAR_FILLS.Otras}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-[var(--velo-brand)]" />
                    <h2 className="text-sm font-bold text-[var(--velo-text)]">Por estado global</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--velo-text-muted)]">
                    Distribución de todas las incidencias.
                  </p>
                  <div className="mt-4 h-[220px] w-full min-w-0 sm:h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={2}
                          stroke="#fff"
                          strokeWidth={2}
                          label={({ name, percent }) =>
                            percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                          }
                          labelLine={{ stroke: "#cbd5e1" }}
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={`pie-${i}-${pieData[i]!.key}`}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              {data.cargaPorAgente.length > 0 ? (
                <section className="rounded-2xl border border-[var(--velo-border)] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--velo-brand)]" />
                    <h2 className="text-sm font-bold text-[var(--velo-text)]">Carga por agente</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--velo-text-muted)]">
                    Incidencias abiertas asignadas a cada agente.
                  </p>
                  <ul className="mt-3 divide-y divide-[var(--velo-border)]">
                    {data.cargaPorAgente.map((a) => {
                      const maxAbiertas = Math.max(
                        ...data.cargaPorAgente.map((x) => x.abiertas),
                        1,
                      );
                      const barW = Math.round((a.abiertas / maxAbiertas) * 100) || 0;
                      return (
                        <li key={a.agente_id} className="py-3">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="font-medium text-[var(--velo-text)]">{a.agente_nombre}</span>
                            <span className="shrink-0 tabular-nums text-xs text-[var(--velo-text-muted)]">
                              <span className="font-bold text-amber-700">{a.abiertas}</span> abiertas ·{" "}
                              {a.total} total
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[var(--velo-brand)] transition-all"
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {data.sla && data.sla.con_limite > 0 ? (
                <section className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-emerald-800">En plazo</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">
                      {data.sla.en_plazo}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-rose-800">Fuera de plazo</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">
                      {data.sla.fuera_plazo}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--velo-border)] bg-slate-50/80 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-[var(--velo-text-muted)]">
                      Con fecha límite
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--velo-text)]">
                      {data.sla.con_limite}
                    </p>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
