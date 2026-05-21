import { useEffect, useRef, useState } from "react";
import {
  archivoDesdePortapapeles,
  markdownImagen,
  validarImagen,
} from "../../lib/imagenes";
import { apiSubirIncidenciaMedio, normalizarRutaMedio } from "../../lib/api";
import { Image as ImageIcon, Loader2, Paperclip, Send, X } from "lucide-react";
import { ImagenRedimensionable } from "./ImagenRedimensionable";

export type ImagenAdjuntaChat = {
  id: string;
  file: File;
  preview: string;
  width: number | null;
};

type Props = {
  texto: string;
  onTextoChange: (v: string) => void;
  imagenes: ImagenAdjuntaChat[];
  onImagenesChange: (items: ImagenAdjuntaChat[]) => void;
  enviando: boolean;
  disabled?: boolean;
  onSubmit: () => void | Promise<void>;
  placeholder?: string;
  rows?: number;
  className?: string;
  variant?: "default" | "embedded";
  showTip?: boolean;
  toolbarExtra?: React.ReactNode;
  onError?: (msg: string | null) => void;
};

let chatSeq = 0;
function nuevoId() {
  return `chat-img-${++chatSeq}`;
}

export function ComentarioEditor({
  texto,
  onTextoChange,
  imagenes,
  onImagenesChange,
  enviando,
  disabled,
  onSubmit,
  placeholder = "Añade un comentario…",
  rows = 3,
  className = "",
  variant = "default",
  showTip = true,
  toolbarExtra,
  onError,
}: Props) {
  const embedded = variant === "embedded";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const previewsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      for (const url of previewsRef.current) URL.revokeObjectURL(url);
      previewsRef.current.clear();
    };
  }, []);

  function añadirArchivo(file: File) {
    const err = validarImagen(file);
    if (err) {
      onError?.(err);
      return;
    }
    onError?.(null);
    const preview = URL.createObjectURL(file);
    previewsRef.current.add(preview);
    onImagenesChange([
      ...imagenes,
      { id: nuevoId(), file, preview, width: null },
    ]);
  }

  function quitarImagen(id: string) {
    const item = imagenes.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.preview);
      previewsRef.current.delete(item.preview);
    }
    onImagenesChange(imagenes.filter((i) => i.id !== id));
    if (seleccionadaId === id) setSeleccionadaId(null);
  }

  function actualizarAncho(id: string, width: number | null) {
    onImagenesChange(
      imagenes.map((i) =>
        i.id === id ? { ...i, width: width == null ? null : Math.round(width) } : i,
      ),
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) añadirArchivo(files[i]);
    e.target.value = "";
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = archivoDesdePortapapeles(e.clipboardData);
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    añadirArchivo(file);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!enviando && !disabled && (texto.trim() || imagenes.length > 0)) {
        void onSubmit();
      }
    }
  }

  const puedeEnviar =
    !disabled && !enviando && (texto.trim().length > 0 || imagenes.length > 0);

  return (
    <div
      className={`${embedded ? "comment-editor--embedded" : ""} ${className}`.trim()}
    >
      <div className={`jira-description-edit ${embedded ? "is-embedded" : ""}`}>
        {imagenes.length > 0 && (
          <div className="space-y-2 px-3 pt-3">
            {imagenes.map((img) => (
              <ImagenRedimensionable
                key={img.id}
                preview={img.preview}
                width={img.width}
                selected={seleccionadaId === img.id}
                disabled={disabled || enviando}
                label={img.file.name || "Captura"}
                onSelect={() =>
                  setSeleccionadaId((prev) => (prev === img.id ? null : img.id))
                }
                onAbrirLightbox={() => setLightboxUrl(img.preview)}
                onQuitar={() => quitarImagen(img.id)}
                onCambiarAncho={(w) => actualizarAncho(img.id, w)}
              />
            ))}
          </div>
        )}

        <div className="jira-comment-composer__input">
          <textarea
            value={texto}
            onChange={(e) => onTextoChange(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled || enviando}
            className="jira-description-edit__textarea w-full"
          />
        </div>

        <div className="jira-comment-composer__toolbar">
          <div className="jira-comment-composer__toolbar-start">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || enviando}
              className="shrink-0 rounded p-2 text-[#6b778c] hover:bg-[#f4f5f7] hover:text-[#172b4d] disabled:opacity-50"
              title="Adjuntar imágenes al mensaje"
            >
              <Paperclip size={16} />
            </button>
            {!embedded && (
              <span className="hidden text-[10px] text-[#6b778c] sm:inline">
                <ImageIcon size={10} className="mr-0.5 inline" />
                Ctrl+V pega capturas (múltiples)
              </span>
            )}
            {embedded && toolbarExtra}
          </div>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!puedeEnviar}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--velo-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--velo-brand-hover)] disabled:opacity-40"
          >
            {enviando ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            Enviar
          </button>
        </div>
      </div>
      {showTip && (
        <p className="mt-1.5 text-[10px] text-[#6b778c]">
          Enter para enviar · Shift+Enter nueva línea · Pega o adjunta varias capturas
        </p>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#091e42]/85 p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar"
            onClick={() => setLightboxUrl(null)}
          />
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="relative max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Sube las imágenes adjuntas del chat como adjuntos de la incidencia y compone
 * el contenido final del mensaje incluyéndolas como markdown con su ancho.
 */
export async function prepararContenidoMensaje(
  incidenciaId: number,
  texto: string,
  imagenes: ImagenAdjuntaChat[],
): Promise<string> {
  const partes: string[] = [];
  const t = texto.trim();
  if (t) partes.push(t);
  for (const img of imagenes) {
    const { url, ruta } = await apiSubirIncidenciaMedio(incidenciaId, img.file);
    const pathMedio = normalizarRutaMedio(url, ruta);
    partes.push(
      markdownImagen(pathMedio, img.file.name || "captura", img.width ?? undefined).trim(),
    );
  }
  return partes.join("\n\n").trim();
}
