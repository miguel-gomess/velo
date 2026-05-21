import { apiAssetUrl } from "../../lib/api";
import type { IncidenciaMensaje } from "../../lib/api";
import { limpiarMarcadoresMensaje } from "../../lib/imagenes";
import { TextoConImagenes } from "./TextoConImagenes";
import { UserAvatar } from "../UserAvatar";
import { TiempoRelativo } from "../TiempoRelativo";
import { Lock } from "lucide-react";

type Props = {
  mensaje: IncidenciaMensaje;
  onImagenClick?: (url: string) => void;
  className?: string;
};

export function MensajeIncidenciaItem({ mensaje, onImagenClick, className = "" }: Props) {
  const imgUrlLegacy = mensaje.imagen_url ? apiAssetUrl(mensaje.imagen_url) : null;
  const contenidoMostrar = limpiarMarcadoresMensaje(mensaje.contenido ?? "");
  const tieneMarkdownImg = /!\[[^\]]*\]\([^)]+\)/.test(contenidoMostrar);
  const interno = mensaje.es_interno === true;

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
          <TiempoRelativo
            iso={mensaje.fecha_creacion}
            className="shrink-0 text-[11px] tabular-nums text-[var(--velo-text-subtle)]"
          />
        </header>

        <div className="issue-chat-message__body">
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
                <img src={imgUrlLegacy} alt="Adjunto" />
              </button>
            </figure>
          )}
        </div>
      </div>
    </article>
  );
}
