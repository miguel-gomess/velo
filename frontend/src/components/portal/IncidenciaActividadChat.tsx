import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "../../hooks/useVisibilityPolling";
import {
  apiEnviarIncidenciaMensaje,
  apiGetIncidenciaMensajes,
  apiMarcarIncidenciaLeida,
  type IncidenciaMensaje,
} from "../../lib/api";
import {
  ComentarioEditor,
  prepararContenidoMensaje,
  type ImagenAdjuntaChat,
} from "../incidencias/ComentarioEditor";
import { ComentarioComposerZona } from "../incidencias/ComentarioComposerZona";
import { MensajeIncidenciaItem } from "../incidencias/MensajeIncidenciaItem";
import { chatCercaDelFinal, scrollChatAlFinal } from "../../lib/scrollChat";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";

type Props = {
  incidenciaId: number;
  puedeComentar: boolean;
  className?: string;
};

export function IncidenciaActividadChat({
  incidenciaId,
  puedeComentar,
  className = "",
}: Props) {
  const [mensajes, setMensajes] = useState<IncidenciaMensaje[]>([]);
  const [puedeInternos, setPuedeInternos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [esInterno, setEsInterno] = useState(false);
  const [imagenes, setImagenes] = useState<ImagenAdjuntaChat[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mensajesPreviosRef = useRef(0);
  const forzarScrollChatRef = useRef(false);

  const cargar = useCallback(async () => {
    const r = await apiGetIncidenciaMensajes(incidenciaId);
    setMensajes(r.items);
    setPuedeInternos(r.puede_comentarios_internos);
  }, [incidenciaId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void cargar()
      .catch(() => !cancelled && setError("No se pudo cargar la conversación"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cargar]);

  useVisibilityPolling(() => void cargar().catch(() => {}), 3000);

  useEffect(() => {
    const prev = mensajesPreviosRef.current;
    const crecio = mensajes.length > prev;
    mensajesPreviosRef.current = mensajes.length;

    if (crecio) {
      const contenedor = chatScrollRef.current;
      if (contenedor) {
        const debeBajar =
          forzarScrollChatRef.current || prev === 0 || chatCercaDelFinal(contenedor);
        if (debeBajar) {
          scrollChatAlFinal(contenedor, forzarScrollChatRef.current ? "smooth" : "auto");
        }
      }
      forzarScrollChatRef.current = false;
    }

    const ultimo = mensajes[mensajes.length - 1];
    if (ultimo) {
      void apiMarcarIncidenciaLeida(incidenciaId, ultimo.id).catch(() => {});
    }
  }, [mensajes, incidenciaId]);

  function liberarImagenes() {
    for (const img of imagenes) URL.revokeObjectURL(img.preview);
    setImagenes([]);
  }

  async function enviarMensaje() {
    if (!texto.trim() && imagenes.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      const contenidoFinal = await prepararContenidoMensaje(
        incidenciaId,
        texto,
        imagenes,
      );
      const interno = puedeInternos && esInterno;
      const { item } = await apiEnviarIncidenciaMensaje(
        incidenciaId,
        contenidoFinal,
        null,
        interno,
      );
      forzarScrollChatRef.current = true;
      setMensajes((prev) => [...prev, item]);
      void cargar().catch(() => {});
      setTexto("");
      setEsInterno(false);
      liberarImagenes();
      void apiMarcarIncidenciaLeida(incidenciaId, item.id).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div ref={chatScrollRef} className="issue-modal-chat-thread min-h-[12rem] flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[var(--velo-brand)]" size={28} />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="issue-chat-empty">
            <MessageSquare size={28} className="text-slate-300" />
            <p className="issue-chat-empty__title">Sin mensajes aún</p>
            <p className="issue-chat-empty__hint">
              El equipo te responderá aquí. Puedes escribir o pegar capturas (Ctrl+V).
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

      {error && (
        <p className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {puedeComentar ? (
        <div className="issue-composer-wrap shrink-0">
          <ComentarioComposerZona
            puedeInternos={puedeInternos}
            esInterno={esInterno}
            onEsInternoChange={setEsInterno}
            disabled={enviando}
          >
            <ComentarioEditor
              variant="embedded"
              texto={texto}
              onTextoChange={setTexto}
              imagenes={imagenes}
              onImagenesChange={setImagenes}
              enviando={enviando}
              onSubmit={() => void enviarMensaje()}
              onError={setError}
              placeholder={
                esInterno ? "Nota interna para el equipo…" : "Escribe un mensaje al equipo…"
              }
              rows={2}
              showTip={false}
            />
          </ComentarioComposerZona>
        </div>
      ) : (
        <p className="shrink-0 border-t border-[var(--velo-border)] bg-[var(--velo-bg)] px-4 py-3 text-center text-xs text-[var(--velo-text-muted)]">
          Esta incidencia está cerrada o no puedes comentar.
        </p>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#091e42]/80 p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar"
            onClick={() => setLightboxUrl(null)}
          />
          <img
            src={lightboxUrl}
            alt=""
            className="relative max-h-[90vh] max-w-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
