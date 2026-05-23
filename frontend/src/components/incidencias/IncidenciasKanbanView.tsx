import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  apiGetIncidencias,
  apiGetUsuarios,
  apiUpdateIncidencia,
  type Incidencia,
  type IncidenciaScope,
  type Usuario,
} from "../../lib/api";
import type { EstadoKanban } from "../../lib/incidencias";
import {
  FILTROS_VACIOS,
  aplicarFiltrosIncidencias,
  opcionesFiltroDesdeIncidencias,
  type FiltrosIncidencias,
} from "../../lib/incidenciasFiltros";
import { PageHeader } from "../layout/PageHeader";
import { KanbanVistaTabs } from "./KanbanVistaTabs";
import { IncidenciasFiltrosBar } from "./IncidenciasFiltrosBar";
import { IncidenciaCrearModal } from "./IncidenciaCrearModal";
import { IncidenciaDetalleModal } from "./IncidenciaDetalleModal";
import { CerrarIncidenciaModal } from "./CerrarIncidenciaModal";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { NotificacionesCampana } from "../notificaciones/NotificacionesCampana";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";

type Props = {
  scope: IncidenciaScope;
  me: Usuario;
  title: string;
  description?: string;
  esAdmin: boolean;
  puedeGestionarEstado: boolean;
  puedeGestionarAsignacion: boolean;
};

export function IncidenciasKanbanView({
  scope,
  me,
  title,
  description,
  esAdmin,
  puedeGestionarEstado,
  puedeGestionarAsignacion,
}: Props) {
  const [items, setItems] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosIncidencias>(FILTROS_VACIOS);
  const [usuariosExtra, setUsuariosExtra] = useState<Usuario[]>([]);
  const [modalId, setModalId] = useState<number | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [cerrarId, setCerrarId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { por_incidencia: sinLeerPorIncidencia, refrescar: refrescarNotif } = useNotificaciones(
    15_000,
    !esAdmin,
  );

  useEffect(() => {
    const raw = searchParams.get("incidencia");
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id) && id > 0) {
      setModalId(id);
      searchParams.delete("incidencia");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!esAdmin) return;
    void apiGetUsuarios("")
      .then((r) => setUsuariosExtra(r.items))
      .catch(() => setUsuariosExtra([]));
  }, [esAdmin]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiGetIncidencias(scope);
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar incidencias");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const opciones = useMemo(() => {
    const desdeItems = opcionesFiltroDesdeIncidencias(items);
    if (!esAdmin) return desdeItems;

    const asignados = new Map(desdeItems.asignados.map((u) => [u.id, u.nombre]));
    const solicitantes = new Map(desdeItems.solicitantes.map((u) => [u.id, u.nombre]));
    for (const u of usuariosExtra) {
      asignados.set(u.id, u.nombre);
      solicitantes.set(u.id, u.nombre);
    }
    const sortNombre = (a: { id: number; nombre: string }, b: { id: number; nombre: string }) =>
      a.nombre.localeCompare(b.nombre, "es");

    return {
      asignados: [...asignados.entries()].map(([id, nombre]) => ({ id, nombre })).sort(sortNombre),
      solicitantes: [...solicitantes.entries()]
        .map(([id, nombre]) => ({ id, nombre }))
        .sort(sortNombre),
      equipos: desdeItems.equipos,
    };
  }, [items, usuariosExtra, esAdmin]);

  const filtradas = useMemo(
    () => aplicarFiltrosIncidencias(items, filtros),
    [items, filtros],
  );

  async function mover(id: number, estado: EstadoKanban) {
    if (!puedeGestionarEstado) return;
    if (estado === "cerrada") {
      setCerrarId(id);
      return;
    }
    try {
      const { item } = await apiUpdateIncidencia(id, { estado });
      setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo mover la tarjeta");
    }
  }

  function onActualizada(item: Incidencia) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }

  function onEliminada(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setModalId(null);
  }

  function onCreada(item: Incidencia) {
    const enriquecida: Incidencia = {
      ...item,
      solicitante_nombre: item.solicitante_nombre ?? me.nombre,
      solicitante_departamento: item.solicitante_departamento ?? me.departamento,
    };
    setItems((prev) => [enriquecida, ...prev]);
    setModalId(enriquecida.id);
  }

  return (
    <div className="flex min-h-0 flex-col lg:min-h-[calc(100dvh-8rem)]">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCrearAbierto(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--velo-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--velo-brand-hover)] transition-colors"
            >
              <Plus size={16} />
              Nueva incidencia
            </button>
            <button
              type="button"
              onClick={() => void cargar()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            {!esAdmin && (
              <NotificacionesCampana
                onIrAIncidencia={(id) => {
                  setModalId(id);
                  void refrescarNotif();
                }}
              />
            )}
          </div>
        }
      />

      <IncidenciasFiltrosBar
        scope={scope}
        filtros={filtros}
        onChange={setFiltros}
        asignados={opciones.asignados}
        solicitantes={opciones.solicitantes}
        equipos={opciones.equipos}
        mostrarSolicitante={esAdmin || opciones.solicitantes.length > 1}
        totalVisible={filtradas.length}
        totalCargadas={items.length}
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle size={18} className="shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <KanbanVistaTabs
        items={filtradas}
        me={me}
        esAdmin={esAdmin}
        loading={loading}
        sinLeerPorIncidencia={sinLeerPorIncidencia}
        onOpen={(inc) => setModalId(inc.id)}
        onMove={mover}
        readOnly={!puedeGestionarEstado}
      />

      {crearAbierto && (
        <IncidenciaCrearModal
          me={me}
          esAdmin={esAdmin}
          onClose={() => setCrearAbierto(false)}
          onCreada={onCreada}
        />
      )}

        {modalId !== null && (
        <IncidenciaDetalleModal
          incidenciaId={modalId}
          initialIncidencia={items.find((i) => i.id === modalId) ?? null}
          me={me}
          esAdmin={esAdmin}
          puedeGestionarEstado={puedeGestionarEstado}
          puedeGestionarAsignacion={puedeGestionarAsignacion}
          usuarioActualId={me.id}
          onClose={() => setModalId(null)}
          onActualizada={(item) => {
            onActualizada(item);
            void refrescarNotif();
          }}
          onEliminada={onEliminada}
        />
      )}

      {cerrarId !== null && (
        <CerrarIncidenciaModal
          incidenciaId={cerrarId}
          onClose={() => setCerrarId(null)}
          onCerrada={() => {
            void cargar();
            void refrescarNotif();
          }}
        />
      )}
    </div>
  );
}
