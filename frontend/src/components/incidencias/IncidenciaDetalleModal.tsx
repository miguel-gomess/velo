import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "../../hooks/useVisibilityPolling";
import { chatCercaDelFinal, scrollChatAlFinal } from "../../lib/scrollChat";
import {
  apiAssetUrl,
  apiDeleteIncidencia,
  apiEnviarIncidenciaMensaje,
  apiGetIncidencia,
  apiGetIncidenciaAdjuntos,
  apiGetIncidenciaMensajes,
  apiGetUsuarios,
  apiMarcarIncidenciaLeida,
  apiSubirIncidenciaAdjunto,
  apiUpdateIncidencia,
  type Incidencia,
  type IncidenciaAdjunto,
  type IncidenciaDetalle,
  type IncidenciaMensaje,
  type Usuario,
} from "../../lib/api";
import {
  colorEstado,
  labelEstado,
  normalizarEstado,
  normalizarPrioridadValor,
  type EstadoKanban,
} from "../../lib/incidencias";
import { validarImagen } from "../../lib/imagenes";
import {
  ComentarioEditor,
  prepararContenidoMensaje,
  type ImagenAdjuntaChat,
} from "./ComentarioEditor";
import { ComentarioComposerZona } from "./ComentarioComposerZona";
import { MensajeIncidenciaItem } from "./MensajeIncidenciaItem";
import { DescripcionEditor } from "./DescripcionEditor";
import { DescripcionVistaJira } from "./TextoConImagenes";
import { IncidenciaHistorial } from "./IncidenciaHistorial";
import { CerrarIncidenciaModal } from "./CerrarIncidenciaModal";
import { PersonaAsignadaSelector } from "./selectors/PersonaAsignadaSelector";
import { EstadoIncidenciaSelector } from "./selectors/EstadoIncidenciaSelector";
import { PrioridadIncidenciaSelector } from "./selectors/PrioridadIncidenciaSelector";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  UserCheck,
  UserCircle,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  IssueSidebar,
  IssueSidebarBadge,
  IssueSidebarDeadline,
  IssueSidebarField,
  IssueSidebarHeading,
  IssueSidebarPerson,
} from "./IssueSidebar";
import { CopiarEnlaceIncidenciaButton } from "./CopiarEnlaceIncidenciaButton";
import { TiempoRelativo } from "../TiempoRelativo";

type Props = {
  incidenciaId: number;
  me: Usuario;
  esAdmin: boolean;
  puedeGestionarEstado?: boolean;
  puedeGestionarAsignacion?: boolean;
  usuarioActualId: number;
  onClose: () => void;
  onActualizada?: (item: Incidencia) => void;
  onEliminada?: (id: number) => void;
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

function StatusLozenge({ estado }: { estado: string }) {
  const color = colorEstado(estado);
  return (
    <span
      className="issue-sidebar-status-lozenge"
      style={{ backgroundColor: color }}
    >
      {labelEstado(estado)}
    </span>
  );
}

export function IncidenciaDetalleModal({
  incidenciaId,
  me,
  esAdmin,
  puedeGestionarEstado,
  puedeGestionarAsignacion,
  usuarioActualId,
  onClose,
  onActualizada,
  onEliminada,
}: Props) {
  const gestionarEstado = puedeGestionarEstado ?? esAdmin;
  const gestionarAsignacion = puedeGestionarAsignacion ?? esAdmin;
  const [detalle, setDetalle] = useState<IncidenciaDetalle | null>(null);
  const [mensajes, setMensajes] = useState<IncidenciaMensaje[]>([]);
  const [adjuntos, setAdjuntos] = useState<IncidenciaAdjunto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [imagenesChat, setImagenesChat] = useState<ImagenAdjuntaChat[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionDraft, setDescripcionDraft] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cerrarAbierto, setCerrarAbierto] = useState(false);
  const [tabActividad, setTabActividad] = useState<"actividad" | "historico">("actividad");
  const [puedeComentariosInternos, setPuedeComentariosInternos] = useState(
    () => Boolean(gestionarEstado || esAdmin),
  );
  const [comentarioInterno, setComentarioInterno] = useState(false);

  const mainScrollRef = useRef<HTMLElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const adjuntoInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mensajesPreviosRef = useRef(0);
  const forzarScrollChatRef = useRef(false);
  const incidenciaScrollInicialRef = useRef<number | null>(null);
  const [historialRefresh, setHistorialRefresh] = useState(0);

  const cargarMensajes = useCallback(async () => {
    const r = await apiGetIncidenciaMensajes(incidenciaId);
    setMensajes(r.items);
    setPuedeComentariosInternos(r.puede_comentarios_internos);
  }, [incidenciaId]);

  const cargarAdjuntos = useCallback(async () => {
    const r = await apiGetIncidenciaAdjuntos(incidenciaId);
    setAdjuntos(r.items);
  }, [incidenciaId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiGetIncidencia(incidenciaId),
      apiGetIncidenciaMensajes(incidenciaId),
      apiGetIncidenciaAdjuntos(incidenciaId),
      gestionarAsignacion ? apiGetUsuarios("") : Promise.resolve({ items: [] }),
    ])
      .then(([inc, msgs, adj, users]) => {
        if (cancelled) return;
        setDetalle(inc.item);
        setMensajes(msgs.items);
        setPuedeComentariosInternos(msgs.puede_comentarios_internos);
        setAdjuntos(adj.items);
        setUsuarios(users.items);
        const ultimo = msgs.items[msgs.items.length - 1];
        void apiMarcarIncidenciaLeida(incidenciaId, ultimo?.id ?? null).catch(() => {});
      })
      .catch(() => setError("Error al sincronizar datos"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [incidenciaId, gestionarAsignacion]);

  const refrescarActividadModal = useCallback(async () => {
    await Promise.allSettled([
      cargarMensajes(),
      cargarAdjuntos(),
      apiGetIncidencia(incidenciaId).then((r) => setDetalle(r.item)),
    ]);
    setHistorialRefresh((n) => n + 1);
  }, [cargarMensajes, cargarAdjuntos, incidenciaId]);

  useVisibilityPolling(refrescarActividadModal, 3000);

  useEffect(() => {
    setEditandoDescripcion(false);
    setMenuAbierto(false);
    setConfirmarEliminar(false);
    setTabActividad("actividad");
    setComentarioInterno(false);
    mensajesPreviosRef.current = 0;
    incidenciaScrollInicialRef.current = null;
  }, [incidenciaId]);

  // Solo al abrir otra incidencia: no resetear scroll del modal al enviar mensajes.
  useEffect(() => {
    if (loading || !detalle) return;
    if (incidenciaScrollInicialRef.current === incidenciaId) return;
    incidenciaScrollInicialRef.current = incidenciaId;
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [incidenciaId, loading, detalle]);

  useEffect(() => {
    const prev = mensajesPreviosRef.current;
    const crecio = mensajes.length > prev;
    mensajesPreviosRef.current = mensajes.length;
    if (!crecio) return;

    const contenedor = chatScrollRef.current;
    if (!contenedor) return;

    const debeBajar =
      forzarScrollChatRef.current ||
      prev === 0 ||
      chatCercaDelFinal(contenedor);

    if (debeBajar) {
      scrollChatAlFinal(contenedor, forzarScrollChatRef.current ? "smooth" : "auto");
    }
    forzarScrollChatRef.current = false;
  }, [mensajes]);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmarEliminar) setConfirmarEliminar(false);
        else if (editandoDescripcion) setEditandoDescripcion(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirmarEliminar, editandoDescripcion]);

  useEffect(() => {
    if (!menuAbierto) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuAbierto]);

  function limpiarPreview() {
    for (const img of imagenesChat) URL.revokeObjectURL(img.preview);
    setImagenesChat([]);
  }

  async function handleAdjuntoTarea(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validarImagen(file);
    if (err) {
      setError(err);
      e.target.value = "";
      return;
    }
    setSubiendoAdjunto(true);
    setError(null);
    try {
      const { item } = await apiSubirIncidenciaAdjunto(incidenciaId, file);
      setAdjuntos((prev) => [...prev, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendoAdjunto(false);
      e.target.value = "";
    }
  }

  async function enviarMensaje() {
    if (!texto.trim() && imagenesChat.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      const contenidoFinal = await prepararContenidoMensaje(
        incidenciaId,
        texto,
        imagenesChat,
      );
      const interno = mostrarVisibilidadComentario && comentarioInterno;
      const { item } = await apiEnviarIncidenciaMensaje(
        incidenciaId,
        contenidoFinal,
        null,
        interno,
      );
      forzarScrollChatRef.current = true;
      setMensajes((prev) => [...prev, item]);
      setDetalle((prev) =>
        prev ? { ...prev, fecha_actualizacion: item.fecha_creacion } : null,
      );
      setHistorialRefresh((n) => n + 1);
      setTexto("");
      setComentarioInterno(false);
      limpiarPreview();
      void apiMarcarIncidenciaLeida(incidenciaId, item.id).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(estado: EstadoKanban) {
    if (!detalle || !gestionarEstado) return;
    if (estado === "cerrada") {
      setCerrarAbierto(true);
      return;
    }
    setGuardando(true);
    try {
      const { item } = await apiUpdateIncidencia(detalle.id, { estado });
      setDetalle(item as IncidenciaDetalle);
      setHistorialRefresh((n) => n + 1);
      onActualizada?.(item);
    } catch {
      setError("Error al cambiar estado");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPrioridad(prioridad: string) {
    if (!detalle || !gestionarEstado) return;
    const p = normalizarPrioridadValor(prioridad);
    if (p === normalizarPrioridadValor(detalle.prioridad)) return;
    setGuardando(true);
    try {
      const { item } = await apiUpdateIncidencia(detalle.id, { prioridad: p });
      setDetalle(item as IncidenciaDetalle);
      setHistorialRefresh((n) => n + 1);
      onActualizada?.(item);
    } catch {
      setError("Error al cambiar prioridad");
    } finally {
      setGuardando(false);
    }
  }

  async function asignarA(asignadoId: number | null) {
    if (!detalle || !gestionarAsignacion) return;
    const elegido = asignadoId ? usuarios.find((u) => u.id === asignadoId) : null;
    setGuardando(true);
    setDetalle((prev) =>
      prev
        ? {
            ...prev,
            asignado_a: asignadoId,
            asignado_nombre: elegido?.nombre ?? null,
          }
        : null,
    );
    try {
      const { item } = await apiUpdateIncidencia(detalle.id, { asignado_a: asignadoId });
      setDetalle(item as IncidenciaDetalle);
      setHistorialRefresh((n) => n + 1);
      onActualizada?.(item);
    } catch {
      setError("Error al asignar técnico");
    } finally {
      setGuardando(false);
    }
  }

  const puedeComentar =
    detalle &&
    (esAdmin ||
      gestionarEstado ||
      detalle.usuario_id === usuarioActualId ||
      detalle.asignado_a === usuarioActualId);

  /** Selector Público/Interno: agentes y admin siempre; API puede reforzar para portal. */
  const mostrarVisibilidadComentario =
    puedeComentariosInternos || gestionarEstado || esAdmin;

  const puedeEditarContenido =
    detalle && (esAdmin || detalle.usuario_id === usuarioActualId);

  const puedeEliminar =
    detalle && (esAdmin || detalle.usuario_id === usuarioActualId);

  const estadoActual = detalle ? normalizarEstado(detalle.estado) : "abierta";

  const asignadoUsuario =
    detalle?.asignado_a != null ? usuarios.find((u) => u.id === detalle.asignado_a) : null;
  const asignadoNombre = detalle?.asignado_nombre ?? asignadoUsuario?.nombre ?? null;
  const asignadoDepartamento = asignadoUsuario?.departamento ?? null;

  function iniciarEdicionDescripcion() {
    if (!detalle) return;
    setDescripcionDraft(detalle.descripcion);
    setEditandoDescripcion(true);
    setMenuAbierto(false);
  }

  async function guardarDescripcion() {
    if (!detalle) return;
    const texto = descripcionDraft.trim();
    if (!texto) {
      setError("La descripción no puede estar vacía");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { item } = await apiUpdateIncidencia(detalle.id, { descripcion: texto });
      setDetalle(item as IncidenciaDetalle);
      onActualizada?.(item);
      setEditandoDescripcion(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la descripción");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarIncidencia() {
    if (!detalle) return;
    setEliminando(true);
    setError(null);
    try {
      await apiDeleteIncidencia(detalle.id);
      onEliminada?.(detalle.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la incidencia");
      setConfirmarEliminar(false);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="velo-modal-shell fixed inset-0 z-50 flex sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#091e42]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar incidencia"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-title"
        className="velo-modal-dialog relative flex w-full max-w-6xl flex-col overflow-hidden border border-[var(--velo-border)] bg-[var(--velo-surface)] shadow-[var(--velo-shadow-md)] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior estilo Jira */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--velo-border)] bg-[var(--velo-surface)] px-4 py-3 sm:px-6">
          <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <span className="shrink-0 font-medium text-[var(--velo-text-muted)]">Incidencias</span>
            <ChevronRight size={14} className="shrink-0 text-[var(--velo-text-subtle)]" />
            {loading ? (
              <span className="text-[var(--velo-text-subtle)]">Cargando…</span>
            ) : detalle ? (
              <>
                <span className="shrink-0 font-semibold text-[var(--velo-brand)]">VEL-{detalle.id}</span>
                <ChevronRight size={14} className="hidden shrink-0 text-[var(--velo-text-subtle)] sm:block" />
                <span className="hidden truncate text-[var(--velo-text-muted)] sm:inline">
                  {detalle.titulo}
                </span>
              </>
            ) : null}
          </nav>

          <div className="relative flex shrink-0 items-center gap-1" ref={menuRef}>
            {detalle && (
              <CopiarEnlaceIncidenciaButton
                incidenciaId={detalle.id}
                me={me}
                className="!text-xs"
              />
            )}
            {(puedeEditarContenido || puedeEliminar) && (
              <>
                <button
                  type="button"
                  onClick={() => setMenuAbierto((v) => !v)}
                  className="rounded p-2 text-[var(--velo-text-subtle)] hover:bg-[var(--velo-bg)] hover:text-[var(--velo-text)]"
                  aria-label="Más opciones"
                  aria-expanded={menuAbierto}
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuAbierto && (
                  <div className="absolute right-10 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-[var(--velo-border)] bg-white py-1 shadow-[var(--velo-shadow-md)]">
                    {puedeEditarContenido && (
                      <button
                        type="button"
                        onClick={iniciarEdicionDescripcion}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--velo-text)] hover:bg-[var(--velo-bg)]"
                      >
                        <Pencil size={15} />
                        Editar descripción
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuAbierto(false);
                          setConfirmarEliminar(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={15} />
                        Eliminar incidencia
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-2 text-[var(--velo-text-subtle)] hover:bg-[var(--velo-bg)] hover:text-[var(--velo-text)]"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
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

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--velo-text-muted)]">
            <Loader2 className="animate-spin text-[var(--velo-brand)]" size={28} />
            <p className="text-sm font-medium">Cargando incidencia…</p>
          </div>
        ) : detalle ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
            {/* Columna principal */}
            <main ref={mainScrollRef} className="min-h-0 overflow-y-auto">
              <div className="px-4 py-5 pb-8 sm:px-8 sm:py-6 sm:pb-10">
                <h1
                  id="issue-title"
                  className="text-xl font-semibold leading-snug text-[var(--velo-text)] sm:text-2xl"
                >
                  {detalle.titulo}
                </h1>

                {/* Descripción */}
                <section className="mt-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
                      Descripción
                    </h2>
                    {puedeEditarContenido && !editandoDescripcion && (
                      <button
                        type="button"
                        onClick={iniciarEdicionDescripcion}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--velo-brand)] hover:bg-[var(--velo-brand-muted)]"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    )}
                  </div>
                  {editandoDescripcion ? (
                    <div className="mt-2 space-y-2">
                      <DescripcionEditor
                        value={descripcionDraft}
                        onChange={setDescripcionDraft}
                        incidenciaId={detalle.id}
                        onError={setError}
                        disabled={guardando}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditandoDescripcion(false)}
                          disabled={guardando}
                          className="rounded-md border border-[var(--velo-border)] px-3 py-1.5 text-xs font-medium text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)] disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => void guardarDescripcion()}
                          disabled={guardando}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--velo-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--velo-brand-hover)] disabled:opacity-50"
                        >
                          {guardando ? (
                            <Loader2 className="animate-spin" size={13} />
                          ) : (
                            <Check size={13} />
                          )}
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <DescripcionVistaJira
                      className="mt-2"
                      texto={detalle.descripcion}
                      onImagenClick={(url) => setLightboxUrl(url)}
                      vacioLabel="Ninguna descripción"
                    />
                  )}
                </section>

                {/* Adjuntos */}
                <section className="mt-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
                      Archivos adjuntos
                      <span className="ml-1.5 font-normal normal-case text-[var(--velo-text-muted)]">
                        ({adjuntos.length})
                      </span>
                    </h2>
                    {puedeComentar && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--velo-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--velo-text)] shadow-[var(--velo-shadow)] hover:bg-[var(--velo-bg)]">
                        {subiendoAdjunto ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Upload size={14} />
                        )}
                        Adjuntar
                        <input
                          type="file"
                          ref={adjuntoInputRef}
                          onChange={handleAdjuntoTarea}
                          accept="image/*"
                          disabled={subiendoAdjunto}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {adjuntos.length === 0 ? (
                    <p className="mt-3 rounded-md border border-dashed border-[var(--velo-border)] bg-[var(--velo-bg)]/40 px-4 py-6 text-center text-xs text-[var(--velo-text-muted)]">
                      Arrastra imágenes aquí o usa «Adjuntar» para añadir evidencias.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {adjuntos.map((adj) => {
                        const url = apiAssetUrl(adj.imagen_url);
                        return (
                          <button
                            key={adj.id}
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            className="group relative size-20 overflow-hidden rounded-md border border-[var(--velo-border)] bg-[var(--velo-bg)] shadow-[var(--velo-shadow)]"
                          >
                            <img
                              src={url}
                              alt={adj.nombre_original}
                              className="size-full object-cover transition-transform group-hover:scale-105"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-[#091e42]/0 opacity-0 transition-opacity group-hover:bg-[#091e42]/40 group-hover:opacity-100">
                              <Eye size={16} className="text-white" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Actividad / histórico */}
                <section className="mt-8">
                  <div className="issue-activity-tabs" role="tablist" aria-label="Actividad de la incidencia">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tabActividad === "actividad"}
                      onClick={() => setTabActividad("actividad")}
                      className={`issue-activity-tab ${tabActividad === "actividad" ? "is-active" : ""}`}
                    >
                      Actividad
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tabActividad === "historico"}
                      onClick={() => setTabActividad("historico")}
                      className={`issue-activity-tab ${tabActividad === "historico" ? "is-active" : ""}`}
                    >
                      Histórico
                    </button>
                  </div>

                  <div className="issue-activity-panel" role="tabpanel">
                    {tabActividad === "historico" ? (
                      <IncidenciaHistorial
                        incidenciaId={incidenciaId}
                        embedded
                        refreshToken={historialRefresh}
                      />
                    ) : (
                      <>
                        <div ref={chatScrollRef} className="issue-modal-chat-thread">
                          {mensajes.length === 0 ? (
                            <div className="issue-chat-empty">
                              <p className="issue-chat-empty__title">Sin comentarios aún</p>
                              <p className="issue-chat-empty__hint">
                                {mostrarVisibilidadComentario
                                  ? "Usa Público para el solicitante o Interno para notas del equipo."
                                  : "Escribe el primer mensaje en esta incidencia."}
                              </p>
                            </div>
                          ) : (
                            <div className="issue-chat-message-list">
                              {mensajes.map((m) => (
                                <MensajeIncidenciaItem
                                  key={m.id}
                                  mensaje={m}
                                  onImagenClick={(url) => setLightboxUrl(url)}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {puedeComentar ? (
                          <div className="issue-composer-wrap">
                            <input
                              type="file"
                              ref={adjuntoInputRef}
                              onChange={handleAdjuntoTarea}
                              accept="image/*"
                              className="hidden"
                            />
                            <ComentarioComposerZona
                              puedeInternos={mostrarVisibilidadComentario}
                              esInterno={comentarioInterno}
                              onEsInternoChange={setComentarioInterno}
                              disabled={enviando}
                            >
                              <ComentarioEditor
                                variant="embedded"
                                texto={texto}
                                onTextoChange={setTexto}
                                imagenes={imagenesChat}
                                onImagenesChange={setImagenesChat}
                                enviando={enviando}
                                onSubmit={() => void enviarMensaje()}
                                onError={setError}
                                placeholder={
                                  comentarioInterno
                                    ? "Nota interna para el equipo…"
                                    : "Comentario visible para el solicitante…"
                                }
                                showTip={false}
                                toolbarExtra={
                                  <button
                                    type="button"
                                    onClick={() => adjuntoInputRef.current?.click()}
                                    className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium text-[var(--velo-text-subtle)] hover:bg-white hover:text-[var(--velo-brand)]"
                                  >
                                    <ImageIcon size={11} />
                                    Adjuntos
                                  </button>
                                }
                              />
                            </ComentarioComposerZona>
                          </div>
                        ) : (
                          <p className="border-t border-[var(--velo-border)] bg-[#fafbfc] px-4 py-3 text-center text-xs text-[var(--velo-text-muted)]">
                            Solo lectura — no puedes comentar en esta incidencia.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </section>
              </div>
            </main>

            <IssueSidebar>
              <IssueSidebarHeading />

              <div className="issue-sidebar__stack">
                <IssueSidebarField label="Estado" icon={Workflow}>
                  {gestionarEstado ? (
                    <EstadoIncidenciaSelector
                      value={estadoActual}
                      disabled={guardando}
                      size="sidebar"
                      onChange={(estado) => {
                        if (estado) void cambiarEstado(estado);
                      }}
                    />
                  ) : (
                    <StatusLozenge estado={detalle.estado} />
                  )}
                </IssueSidebarField>

                {detalle.equipo_codigo && (
                  <IssueSidebarField label="Equipo" icon={Users}>
                    <IssueSidebarBadge>{detalle.equipo_codigo}</IssueSidebarBadge>
                  </IssueSidebarField>
                )}

                <IssueSidebarField label="Prioridad" icon={Flag}>
                  {gestionarEstado && estadoActual !== "cerrada" ? (
                    <>
                      <PrioridadIncidenciaSelector
                        value={normalizarPrioridadValor(detalle.prioridad)}
                        disabled={guardando}
                        permitirTodos={false}
                        size="sidebar"
                        onChange={(p) => {
                          if (p) void cambiarPrioridad(p);
                        }}
                      />
                      {detalle.fecha_limite && (
                        <IssueSidebarDeadline>
                          Plazo: {formatFecha(detalle.fecha_limite)}
                        </IssueSidebarDeadline>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold capitalize text-[var(--velo-text)]">
                      {normalizarPrioridadValor(detalle.prioridad)}
                    </span>
                  )}
                </IssueSidebarField>

                <IssueSidebarField label="Persona asignada" icon={UserCheck}>
                  {gestionarAsignacion ? (
                    <PersonaAsignadaSelector
                      value={detalle.asignado_a}
                      usuarios={usuarios}
                      disabled={guardando}
                      size="sidebar"
                      onChange={(id) => void asignarA(id)}
                    />
                  ) : (
                    <IssueSidebarPerson
                      vacio={!asignadoNombre}
                      nombre={asignadoNombre ?? ""}
                      userId={detalle.asignado_a}
                      subtitulo={asignadoDepartamento}
                    />
                  )}
                </IssueSidebarField>

                <IssueSidebarField label="Informador" icon={UserCircle}>
                  <IssueSidebarPerson
                    nombre={detalle.solicitante_nombre}
                    userId={detalle.usuario_id}
                    subtitulo={detalle.solicitante_departamento}
                  />
                </IssueSidebarField>

                <IssueSidebarField label="Creada" icon={Calendar}>
                  <span className="issue-sidebar-date">{formatFecha(detalle.fecha_creacion)}</span>
                </IssueSidebarField>

                {detalle.estado === "cerrada" && detalle.resolucion && (
                  <IssueSidebarField label="Cierre" icon={Check}>
                    <p className="text-xs font-semibold capitalize text-[var(--velo-text-muted)]">
                      {detalle.motivo_cierre ?? "cerrada"}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--velo-text)]">
                      {detalle.resolucion}
                    </p>
                  </IssueSidebarField>
                )}

                {detalle.fecha_actualizacion && (
                  <IssueSidebarField label="Actualizada" icon={Clock}>
                    <TiempoRelativo
                      iso={detalle.fecha_actualizacion}
                      className="issue-sidebar-date"
                    />
                  </IssueSidebarField>
                )}
              </div>
            </IssueSidebar>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--velo-text-muted)]">
            No se encontró la incidencia.
          </div>
        )}
      </div>

      {confirmarEliminar && detalle && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#091e42]/60 p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => !eliminando && setConfirmarEliminar(false)}
            aria-label="Cancelar"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-xl border border-[var(--velo-border)] bg-white p-6 shadow-[var(--velo-shadow-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--velo-text)]">Eliminar incidencia</h3>
            <p className="mt-2 text-sm text-[var(--velo-text-muted)]">
              ¿Seguro que quieres eliminar <strong>VEL-{detalle.id}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setConfirmarEliminar(false)}
                className="rounded-md border border-[var(--velo-border)] px-4 py-2 text-sm font-medium text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={() => void eliminarIncidencia()}
                className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {eliminando ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {cerrarAbierto && detalle && (
        <CerrarIncidenciaModal
          incidenciaId={detalle.id}
          onClose={() => setCerrarAbierto(false)}
          onCerrada={() => {
            void apiGetIncidencia(detalle.id).then((r) => {
              setDetalle(r.item);
              onActualizada?.(r.item);
            });
          }}
        />
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#091e42]/85 p-6"
          onClick={() => setLightboxUrl(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxUrl(null)}
            aria-label="Cerrar vista ampliada"
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt="Vista ampliada"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}


