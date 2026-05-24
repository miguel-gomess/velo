import { useEffect, useState } from "react";
import {
  FILTROS_VACIOS,
  type FiltrosIncidencias,
  type PresetFiltrosIncidencias,
  contarFiltrosActivos,
  cargarPresetsFiltros,
  guardarPresetsFiltros,
} from "../../lib/incidenciasFiltros";
import type { OpcionPersona } from "../../lib/incidenciasFiltros";
import { PersonaAsignadaSelector } from "./selectors/PersonaAsignadaSelector";
import { EstadoIncidenciaSelector } from "./selectors/EstadoIncidenciaSelector";
import { PrioridadIncidenciaSelector } from "./selectors/PrioridadIncidenciaSelector";
import { EquipoIncidenciaSelector } from "./selectors/EquipoIncidenciaSelector";
import { EpicaIncidenciaSelector } from "./selectors/EpicaIncidenciaSelector";
import { FiltrosGuardadosSelector } from "./FiltrosGuardadosSelector";
import { Filter, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import type { Epica } from "../../lib/api";

type Props = {
  scope: string;
  filtros: FiltrosIncidencias;
  onChange: (f: FiltrosIncidencias) => void;
  asignados: OpcionPersona[];
  solicitantes: OpcionPersona[];
  equipos: string[];
  epicas: Epica[];
  mostrarSolicitante?: boolean;
  totalVisible: number;
  totalCargadas: number;
};

export function IncidenciasFiltrosBar({
  scope,
  filtros,
  onChange,
  asignados,
  solicitantes,
  equipos,
  epicas,
  mostrarSolicitante = false,
  totalVisible,
  totalCargadas,
}: Props) {
  const [presets, setPresets] = useState<PresetFiltrosIncidencias[]>(() =>
    cargarPresetsFiltros(scope),
  );
  const [presetActivo, setPresetActivo] = useState("");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [mostrarGuardar, setMostrarGuardar] = useState(false);

  useEffect(() => {
    guardarPresetsFiltros(scope, presets);
  }, [scope, presets]);

  const activos = contarFiltrosActivos(filtros);

  function patch(partial: Partial<FiltrosIncidencias>) {
    setPresetActivo("");
    onChange({ ...filtros, ...partial });
  }

  function limpiar() {
    setPresetActivo("");
    onChange({ ...FILTROS_VACIOS });
  }

  function aplicarPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setPresetActivo(id);
    onChange({ ...p.filtros });
  }

  function guardarPreset() {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    const id = crypto.randomUUID();
    const nuevo: PresetFiltrosIncidencias = {
      id,
      nombre,
      filtros: { ...filtros },
    };
    setPresets((prev) => [...prev, nuevo]);
    setPresetActivo(id);
    setNombreNuevo("");
    setMostrarGuardar(false);
  }

  function eliminarPreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (presetActivo === id) setPresetActivo("");
  }

  return (
    <section className="mb-5 space-y-2.5 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={filtros.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Buscar por título, ID, equipo o persona…"
            className="h-10 w-full rounded-lg border border-slate-200 py-2 pl-10 pr-9 text-sm outline-none focus:border-[var(--velo-brand)] focus:ring-2 focus:ring-blue-50"
          />
          {filtros.q && (
            <button
              type="button"
              onClick={() => patch({ q: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Borrar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <p className="hidden shrink-0 text-xs text-slate-500 sm:block">
          <span className="font-bold text-slate-800">{totalVisible}</span>
          {totalVisible !== totalCargadas ? ` / ${totalCargadas}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 shrink-0 items-center gap-1.5 pr-1 text-xs font-bold text-slate-700">
          <Filter size={14} className="text-[var(--velo-brand)]" />
          Filtros
          {activos > 0 && (
            <span className="rounded-full bg-[var(--velo-brand)] px-1.5 py-px text-[9px] font-bold text-white">
              {activos}
            </span>
          )}
        </span>

        <PersonaAsignadaSelector
          modo="filtro"
          compact
          usuarios={asignados}
          value={filtros.asignado_a}
          onChange={(v) => patch({ asignado_a: v })}
          etiquetaCualquiera="Asignado"
        />

        <EstadoIncidenciaSelector
          compact
          permitirTodos
          value={filtros.estado}
          onChange={(v) => patch({ estado: v })}
        />

        <PrioridadIncidenciaSelector
          compact
          value={filtros.prioridad}
          onChange={(v) => patch({ prioridad: v })}
        />

        <EquipoIncidenciaSelector
          compact
          equipos={equipos}
          value={filtros.equipo_codigo}
          onChange={(v) => patch({ equipo_codigo: v })}
        />

        <EpicaIncidenciaSelector
          compact
          permitirTodos
          epicas={epicas}
          value={filtros.epica_id ? Number(filtros.epica_id) : null}
          onChange={(id) => patch({ epica_id: id == null ? "" : String(id) })}
        />

        {mostrarSolicitante && (
          <PersonaAsignadaSelector
            modo="filtro"
            compact
            usuarios={solicitantes}
            value={filtros.solicitante_id}
            onChange={(v) => patch({ solicitante_id: v })}
            etiquetaCualquiera="Solicitante"
          />
        )}

        <label
          className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50/80"
          title="Fuera de plazo SLA"
        >
          <input
            type="checkbox"
            checked={filtros.solo_fuera_sla}
            onChange={(e) => patch({ solo_fuera_sla: e.target.checked })}
            className="size-3.5 rounded border-slate-300 text-[var(--velo-brand)]"
          />
          SLA
        </label>

        <span className="mx-0.5 h-6 w-px shrink-0 bg-slate-200" aria-hidden />

        <FiltrosGuardadosSelector
          presets={presets}
          presetActivo={presetActivo}
          onSelect={(id) => {
            if (!id) {
              setPresetActivo("");
              return;
            }
            aplicarPreset(id);
          }}
        />

        {presetActivo && (
          <button
            type="button"
            onClick={() => eliminarPreset(presetActivo)}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            title="Borrar configuración"
          >
            <Trash2 size={13} />
          </button>
        )}

        {!mostrarGuardar ? (
          <button
            type="button"
            onClick={() => setMostrarGuardar(true)}
            disabled={activos === 0}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[var(--velo-brand)]/30 bg-[var(--velo-brand-muted)] px-2.5 text-xs font-semibold text-[var(--velo-brand)] shadow-sm disabled:opacity-40"
            title="Guardar configuración"
          >
            <Save size={13} />
            <span className="hidden lg:inline">Guardar</span>
          </button>
        ) : (
          <>
            <input
              type="text"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nombre…"
              className="h-9 w-28 shrink-0 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-[var(--velo-brand)]"
              onKeyDown={(e) => e.key === "Enter" && guardarPreset()}
            />
            <button
              type="button"
              onClick={guardarPreset}
              className="h-9 shrink-0 rounded-lg bg-[var(--velo-brand)] px-2.5 text-xs font-semibold text-white"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarGuardar(false);
                setNombreNuevo("");
              }}
              className="h-9 shrink-0 rounded-lg border border-slate-200 px-2 text-xs text-slate-600"
            >
              <X size={14} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={limpiar}
          disabled={activos === 0}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50/80 disabled:opacity-40"
          title="Limpiar filtros"
        >
          <RotateCcw size={13} />
          <span className="hidden md:inline">Limpiar</span>
        </button>

        <p className="shrink-0 pl-1 text-xs text-slate-500 sm:hidden">
          <span className="font-bold text-slate-800">{totalVisible}</span>
          {totalVisible !== totalCargadas ? `/${totalCargadas}` : ""}
        </p>
      </div>
    </section>
  );
}
