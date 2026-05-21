import { useCallback, useEffect, useMemo, useState } from "react";
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
import { LayoutDashboard, RefreshCw, AlertCircle, Download } from "lucide-react";

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

/** Paleta suave pero distinguible */
const PIE_COLORS = ["#6366f1", "#0d9488", "#d97706", "#e11d48", "#64748b", "#7c3aed"];

const BAR_FILLS = {
  Abiertas: "#818cf8",
  "En curso": "#f59e0b",
  Cerradas: "#34d399",
  Otras: "#94a3b8",
};

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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-md">
      <p className="mb-2 border-b border-slate-100 pb-1.5 font-semibold text-slate-800">{label}</p>
      <ul className="space-y-1">
        {rows.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-8 text-slate-600">
            <span className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: BAR_FILLS[p.name as keyof typeof BAR_FILLS] ?? "#94a3b8" }}
              />
              {p.name}
            </span>
            <span className="tabular-nums font-medium text-slate-900">{p.value}</span>
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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{p.name}</p>
      <p className="mt-0.5 tabular-nums text-slate-600">{p.value} incidencias</p>
    </div>
  );
}

export function PanelAnalisis() {
  const [data, setData] = useState<IncidenciasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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

  return (
    <div className="space-y-8 text-left">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            <LayoutDashboard size={14} className="text-indigo-600" />
            Análisis de incidencias
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Rendimiento por área</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Por <span className="font-medium text-slate-800">departamento del solicitante</span> y reparto por estado
            (abiertas, en curso, resueltas).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : "text-slate-500"} />
            Actualizar datos
          </button>
          {data ? (
            <button
              type="button"
              onClick={() => exportarCsv(data)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw className="size-9 animate-spin text-indigo-500" />
        </div>
      ) : data && data.totalIncidencias === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-14 text-center">
          <p className="text-sm text-slate-600">
            Aún no hay incidencias registradas. Los gráficos aparecerán cuando existan datos.
          </p>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total incidencias</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{data.totalIncidencias}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tiempo medio cierre</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-700">
                {data.tiempoMedioResolucionHoras != null
                  ? `${data.tiempoMedioResolucionHoras} h`
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Departamentos</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-indigo-600">{data.porDepartamento.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estados distintos</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-amber-700">{data.porEstado.length}</p>
            </div>
            {data.sla ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SLA en plazo</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-violet-700">
                  {data.sla.porcentaje_en_plazo != null ? `${data.sla.porcentaje_en_plazo}%` : "—"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {data.sla.en_plazo} de {data.sla.con_limite} con fecha límite
                </p>
              </div>
            ) : null}
          </div>

          {(data.tendenciaSemanal?.length ?? 0) > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Tendencia semanal</h2>
              <p className="mt-1 text-xs text-slate-500">Incidencias creadas vs cerradas por semana.</p>
              <div className="mt-6 h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.tendenciaSemanal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="creadas" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cerradas" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          {data.cargaPorAgente.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Carga por agente</h2>
              <p className="mt-1 text-xs text-slate-500">Incidencias abiertas asignadas a cada agente.</p>
              <ul className="mt-4 divide-y divide-slate-100">
                {data.cargaPorAgente.map((a) => (
                  <li key={a.agente_id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">{a.agente_nombre}</span>
                    <span className="tabular-nums text-slate-600">
                      <span className="font-semibold text-amber-700">{a.abiertas}</span> abiertas · {a.total} total
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="text-base font-semibold text-slate-900">Por departamento del solicitante</h2>
              <p className="mt-1 text-xs text-slate-500">
                Incidencias abiertas, en curso, cerradas y otras por área.
              </p>
              <div className="mt-6 h-[340px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-24}
                      textAnchor="end"
                      height={68}
                      stroke="#cbd5e1"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      allowDecimals={false}
                      stroke="#cbd5e1"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.06)" }} content={<BarTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                    <Bar dataKey="Abiertas" stackId="s" fill={BAR_FILLS.Abiertas} radius={[0, 0, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="En curso" stackId="s" fill={BAR_FILLS["En curso"]} maxBarSize={48} />
                    <Bar dataKey="Cerradas" stackId="s" fill={BAR_FILLS.Cerradas} maxBarSize={48} />
                    <Bar dataKey="Otras" stackId="s" fill={BAR_FILLS.Otras} radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-900">Por estado global</h2>
              <p className="mt-1 text-xs text-slate-500">Distribución de todas las incidencias por estado.</p>
              <div className="mt-6 h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, percent }) => (percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : "")}
                      labelLine={{ stroke: "#cbd5e1" }}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={`pie-${i}-${pieData[i]!.key}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
