import { useState } from "react";
import {
  apiActualizarIncidenciaMensaje,
  apiAssetUrl,
  apiEliminarIncidenciaMensaje,
  type IncidenciaMensaje,
} from "../../lib/api";
import { limpiarMarcadoresMensaje } from "../../lib/imagenes";
import { TextoConImagenes } from "./TextoConImagenes";
import { AuthImage } from "../AuthImage";
import { UserAvatar } from "../UserAvatar";
import { TiempoRelativo } from "../TiempoRelativo";
import { Check, Loader2, Lock, Pencil, Trash2, X } from "lucide-react";

type Props = {
  incidenciaId: number;
  mensaje: IncidenciaMensaje;
  puedeGestionar: boolean;
  onImagenClick?: (url: string) => void;
  onActualizado?: (m: IncidenciaMensaje) => void;
  onEliminado?: (id: number) => void;
  onError?: (msg: string) => void;
  className?: string;
};

export function MensajeIncidenciaItem({
  incidenciaId,
  mensaje,
  puedeGestionar,
  onImagenClick,
  onActualizado,
  onEliminado,
  onError,
  className = "",
}: Props) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(mensaje.contenido ?? "");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const imgUrlLegacy = mensaje.imagen_url ? apiAssetUrl(mensaje.imagen_url) : null;
  const contenidoMostrar = limpiarMarcadoresMensaje(mensaje.contenido ?? "");
  const tieneMarkdownImg = /!\[[^\]]*\]\([^)]+\)/.test(contenidoMostrar);
  const interno = mensaje.es_interno === true;

  async function guardarEdicion() {
    setGuardando(true);
    try {
      const { item } = await apiActualizarIncidenciaMensaje(incidenciaId, mensaje.id, {
        contenido: texto.trim(),
      });
      onActualizado?.(item);
      setEditando(false);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    setEliminando(true);
    try {
      await apiEliminarIncidenciaMensaje(incidenciaId, mensaje.id);
      onEliminado?.(mensaje.id);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo eliminar");
      setEliminando(false);
    }
  }

  return (
    <article
      className={`issue-chat-message ${interno ? "issue-chat-message--internal" : "issue-chat-message--public"} ${className}`}
    >
      <UserAvatar nombre={mensaje.autor_nombre} userId={mensaje.autor_id} size="sm" />
      <div className="min-w-0 flex-1">
        <header className="issue-chat-message__header">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-[var(--velo-text)]">
                {mensaje.autor_nombre}
              </span>
              {mensaje.autor_departamento && (
                <span className="text-[11px] text-[var(--velo-text-subtle)]">
                  {mensaje.autor_departamento}
                </span>
              )}
              {interno && (
                <span className="issue-chat-badge-internal">
                  <Lock size={10} strokeWidth={2.5} />
                  Interno
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {puedeGestionar && !editando && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTexto(mensaje.contenido ?? "");
                    setEditando(true);
                  }}
                  className="rounded p-1 text-[var(--velo-text-subtle)] hover:bg-[var(--velo-bg)] hover:text-[var(--velo-brand)]"
                  aria-label="Editar comentario"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void eliminar()}
                  disabled={eliminando}
                  className="rounded p-1 text-[var(--velo-text-subtle)] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label="Eliminar comentario"
                >
                  {eliminando ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </>
            )}
            <TiempoRelativo
              iso={mensaje.fecha_creacion}
              className="text-[11px] tabular-nums text-[var(--velo-text-subtle)]"
            />
          </div>
        </header>

        <div className="issue-chat-message__body">
          {editando ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={3}
                maxLength={4000}
                className="w-full rounded-lg border border-[var(--velo-border)] px-3 py-2 text-sm"
                placeholder="Escribe el comentario…"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setEditando(false)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)]"
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando || (!texto.trim() && !imgUrlLegacy)}
                  onClick={() => void guardarEdicion()}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--velo-brand)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <>
              {contenidoMostrar && (
                <TextoConImagenes
                  texto={contenidoMostrar}
                  variant="jira"
                  onImagenClick={onImagenClick}
                />
              )}
              {!tieneMarkdownImg && imgUrlLegacy && (
                <figure className="jira-description-media">
                  <button
                    type="button"
                    onClick={() => onImagenClick?.(imgUrlLegacy)}
                    className="jira-description-media__img-btn"
                  >
                    <AuthImage src={imgUrlLegacy} alt="Adjunto" className="max-w-full" />
                  </button>
                </figure>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
