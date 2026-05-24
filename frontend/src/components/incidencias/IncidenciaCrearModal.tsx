import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiCreateIncidencia,
  apiGetEpicas,
  apiUpdateIncidencia,
  type Epica,
  type Incidencia,
  type Usuario,
} from "../../lib/api";
import {
  adjuntarImagenesPendientesADescripcion,
  DescripcionEditor,
  type ImagenPendiente,
} from "./DescripcionEditor";
import { EQUIPOS_CATALOGO, labelEquipo } from "../../lib/equipos";
import { KANBAN_COLUMNAS } from "../../lib/incidencias";
import { PrioridadIncidenciaSelector } from "./selectors/PrioridadIncidenciaSelector";
import { EpicaIncidenciaSelector } from "./selectors/EpicaIncidenciaSelector";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { UserAvatar } from "../UserAvatar";

type Props = {
  me: Usuario;
  esAdmin: boolean;
  onClose: () => void;
  onCreada: (item: Incidencia) => void;
};

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b border-[var(--velo-border)] last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)] mb-1.5">
        {label}
      </p>
      <div className="text-sm text-[var(--velo-text)]">{children}</div>
    </div>
  );
}

function SelectorEquipo({
  value,
  opciones,
  permitirVacio,
  disabled,
  onChange,
}: {
  value: string;
  opciones: { codigo: string; nombre: string }[];
  permitirVacio?: boolean;
  disabled?: boolean;
  onChange: (codigo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actual = opciones.find((o) => o.codigo === value);
  const etiqueta = actual
    ? `${actual.nombre} (${actual.codigo})`
    : permitirVacio
      ? "Sin equipo"
      : "Seleccionar equipo";

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--velo-border)] bg-white px-2.5 py-2 text-left text-sm text-[var(--velo-text)] shadow-[var(--velo-shadow)] outline-none hover:bg-[var(--velo-bg)] focus:ring-2 focus:ring-[var(--velo-brand-muted)] disabled:opacity-60"
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <span className="truncate">{etiqueta}</span>
        <ChevronRight
          size={16}
          className={`shrink-0 text-[var(--velo-text-subtle)] transition-transform ${abierto ? "-rotate-90" : "rotate-90"}`}
        />
      </button>
      {abierto && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[var(--velo-border)] bg-white py-1 shadow-[var(--velo-shadow-md)]"
        >
          {permitirVacio && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange("");
                  setAbierto(false);
                }}
                className="flex w-full px-2.5 py-2 text-left text-sm text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)]"
              >
                Sin equipo
              </button>
            </li>
          )}
          {opciones.map((eq) => (
            <li key={eq.codigo}>
              <button
                type="button"
                role="option"
                aria-selected={value === eq.codigo}
                onClick={() => {
                  onChange(eq.codigo);
                  setAbierto(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm hover:bg-[var(--velo-bg)] ${
                  value === eq.codigo ? "bg-[var(--velo-brand-muted)]" : ""
                }`}
              >
                <span className="truncate font-medium text-[var(--velo-text)]">{eq.nombre}</span>
                <span className="shrink-0 text-xs text-[var(--velo-text-subtle)]">{eq.codigo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IncidenciaCrearModal({ me, esAdmin, onClose, onCreada }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [equipoCodigo, setEquipoCodigo] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [epicaId, setEpicaId] = useState<number | null>(null);
  const [epicas, setEpicas] = useState<Epica[]>([]);
  const [imagenesPendientes, setImagenesPendientes] = useState<ImagenPendiente[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadoInicial = KANBAN_COLUMNAS[0];

  const equiposOpciones = useMemo(() => {
    if (esAdmin) {
      return EQUIPOS_CATALOGO.map((e) => ({ codigo: e.codigo, nombre: e.nombre }));
    }
    const codigos = me.equipos ?? [];
    return codigos
      .map((codigo) => {
        const cat = EQUIPOS_CATALOGO.find((e) => e.codigo === codigo);
        return { codigo, nombre: cat?.nombre ?? labelEquipo(codigo) };
      })
      .filter((e) => e.codigo);
  }, [esAdmin, me.equipos]);

  const mostrarEquipo = equiposOpciones.length > 0;

  useEffect(() => {
    void apiGetEpicas()
      .then((r) => setEpicas(r.items))
      .catch(() => setEpicas([]));
  }, []);

  useEffect(() => {
    if (equiposOpciones.length === 1) {
      setEquipoCodigo(equiposOpciones[0].codigo);
    }
  }, [equiposOpciones]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, enviando]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = titulo.trim();
    const d = descripcion.trim();
    if (!t || (!d && imagenesPendientes.length === 0)) {
      setError("El título y la descripción son obligatorios.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const { item } = await apiCreateIncidencia({
        titulo: t,
        descripcion: d || " ",
        equipo_codigo: equipoCodigo.trim() || null,
        prioridad: prioridad.trim() || "media",
        epica_id: epicaId,
      });
      let final = item;
      if (imagenesPendientes.length > 0) {
        const descConImg = await adjuntarImagenesPendientesADescripcion(
          item.id,
          d || "",
          imagenesPendientes,
        );
        const { item: actualizado } = await apiUpdateIncidencia(item.id, {
          descripcion: descConImg,
        });
        final = actualizado;
        for (const p of imagenesPendientes) URL.revokeObjectURL(p.preview);
        setImagenesPendientes([]);
      }
      onCreada(final);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la incidencia");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="velo-modal-shell fixed inset-0 z-50 justify-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#091e42]/50 backdrop-blur-[2px]"
        onClick={() => !enviando && onClose()}
        aria-label="Cerrar"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-title"
        className="velo-modal-dialog relative flex w-full max-w-6xl flex-col overflow-hidden border border-[var(--velo-border)] bg-[var(--velo-surface)] shadow-[var(--velo-shadow-md)] sm:rounded-xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--velo-border)] bg-[var(--velo-surface)] px-4 py-3 sm:px-6">
          <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <span className="shrink-0 font-medium text-[var(--velo-text-muted)]">Incidencias</span>
            <ChevronRight size={14} className="shrink-0 text-[var(--velo-text-subtle)]" />
            <span className="shrink-0 font-semibold text-[var(--velo-brand)]">Nueva</span>
            <ChevronRight size={14} className="hidden shrink-0 text-[var(--velo-text-subtle)] sm:block" />
            <span className="hidden truncate text-[var(--velo-text-muted)] sm:inline">
              {titulo.trim() || "Sin título"}
            </span>
          </nav>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="rounded p-2 text-[var(--velo-text-subtle)] hover:bg-[var(--velo-bg)] hover:text-[var(--velo-text)] disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        {error && (
          <div className="mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:mx-6">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 rounded p-0.5 hover:bg-rose-100"
              aria-label="Descartar error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
            <main className="min-h-0 overflow-y-auto">
              <div className="px-4 py-5 sm:px-8 sm:py-6">
                <label htmlFor="issue-title" className="sr-only">
                  Título
                </label>
                <input
                  id="issue-title"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={280}
                  placeholder="Título de la incidencia"
                  disabled={enviando}
                  autoFocus
                  className="w-full border-0 bg-transparent p-0 text-xl font-semibold leading-snug text-[var(--velo-text)] outline-none placeholder:text-[var(--velo-text-subtle)] focus:ring-0 sm:text-2xl"
                />

                <section className="mt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
                    Descripción
                  </h2>
                  <DescripcionEditor
                    className="mt-2"
                    value={descripcion}
                    onChange={setDescripcion}
                    imagenesPendientes={imagenesPendientes}
                    onImagenesPendientesChange={setImagenesPendientes}
                    onError={setError}
                    placeholder="Detalla la solicitud: contexto, pasos, urgencia…"
                    disabled={enviando}
                  />
                </section>

                <p className="mt-6 text-xs text-[var(--velo-text-subtle)]">
                  Tras crear la incidencia podrás asignarla, adjuntar archivos y comentar desde el
                  detalle.
                </p>
              </div>
            </main>

            <aside className="flex min-h-0 flex-col border-t border-[var(--velo-border)] bg-[#fafbfc] lg:h-full lg:self-stretch lg:border-t-0 lg:border-l">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
                  Detalles
                </p>

                <SidebarField label="Estado">
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: estadoInicial.color }}
                  >
                    {estadoInicial.label}
                  </span>
                </SidebarField>

                {mostrarEquipo && (
                  <SidebarField label="Equipo">
                    <SelectorEquipo
                      value={equipoCodigo}
                      opciones={equiposOpciones}
                      permitirVacio={esAdmin}
                      disabled={enviando}
                      onChange={setEquipoCodigo}
                    />
                  </SidebarField>
                )}

                <SidebarField label="Épica">
                  <EpicaIncidenciaSelector
                    value={epicaId}
                    onChange={setEpicaId}
                    epicas={epicas}
                    disabled={enviando}
                    size="sidebar"
                  />
                  <p className="mt-1.5 text-[10px] text-[var(--velo-text-subtle)]">
                    Agrupa la tarea bajo un objetivo principal.
                  </p>
                </SidebarField>

                <SidebarField label="Prioridad">
                  <PrioridadIncidenciaSelector
                    value={prioridad}
                    onChange={setPrioridad}
                    permitirTodos={false}
                    disabled={enviando}
                  />
                  <p className="mt-1.5 text-[10px] text-[var(--velo-text-subtle)]">
                    Opcional. Por defecto: media.
                  </p>
                </SidebarField>

                <SidebarField label="Persona asignada">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--velo-border)] bg-[var(--velo-bg)] text-[10px] font-semibold text-[var(--velo-text-subtle)]"
                      aria-hidden
                    >
                      —
                    </div>
                    <div>
                      <p className="font-medium leading-tight text-[var(--velo-text-muted)]">
                        Sin asignar
                      </p>
                      <p className="text-xs text-[var(--velo-text-subtle)]">
                        Tras crear la incidencia
                      </p>
                    </div>
                  </div>
                </SidebarField>

                <SidebarField label="Informador">
                  <div className="flex items-center gap-2">
                    <UserAvatar nombre={me.nombre} userId={me.id} size="sm" />
                    <div>
                      <p className="font-medium leading-tight">{me.nombre}</p>
                      <p className="text-xs text-[var(--velo-text-muted)]">
                        {me.departamento ?? "Sin departamento"}
                      </p>
                    </div>
                  </div>
                </SidebarField>

                <SidebarField label="Creada">
                  <span className="inline-flex items-center gap-1.5 text-[var(--velo-text-muted)]">
                    <Calendar size={14} />
                    Al guardar
                  </span>
                </SidebarField>
              </div>

              <div className="shrink-0 border-t border-[var(--velo-border)] bg-[#fafbfc] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={enviando}
                    className="rounded-md border border-[var(--velo-border)] px-4 py-2 text-sm font-medium text-[var(--velo-text-muted)] hover:bg-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--velo-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--velo-brand-hover)] disabled:opacity-50"
                  >
                    {enviando ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    Crear incidencia
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
