import { useCallback, useEffect, useId, useRef, useState } from "react";
import { apiAssetUrl, apiSubirIncidenciaMedio, normalizarRutaMedio } from "../../lib/api";
import {
  archivoDesdePortapapeles,
  markdownImagen,
  parseAltConWidth,
  validarImagen,
} from "../../lib/imagenes";
import { Loader2, X } from "lucide-react";
import { ImagenRedimensionable } from "./ImagenRedimensionable";

export type ImagenPendiente = {
  id: string;
  file: File;
  preview: string;
  width?: number | null;
};

type BloqueTexto = { type: "texto"; id: string; content: string };
type BloqueImagen = {
  type: "imagen";
  id: string;
  preview: string;
  url?: string;
  file?: File;
  width?: number | null;
};
type Bloque = BloqueTexto | BloqueImagen;

type Props = {
  value: string;
  onChange: (value: string) => void;
  incidenciaId?: number | null;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onError?: (msg: string | null) => void;
  imagenesPendientes?: ImagenPendiente[];
  onImagenesPendientesChange?: (items: ImagenPendiente[]) => void;
};

let bloqueSeq = 0;
function nuevoId() {
  return `blk-${++bloqueSeq}`;
}

function compactarTextosAdyacentes(bloques: Bloque[]): Bloque[] {
  const out: Bloque[] = [];
  for (const b of bloques) {
    if (b.type === "texto" && out.length > 0 && out[out.length - 1].type === "texto") {
      const prev = out[out.length - 1] as BloqueTexto;
      const sep = prev.content && b.content ? "\n\n" : "";
      out[out.length - 1] = { ...prev, content: prev.content + sep + b.content };
    } else {
      out.push(b.type === "texto" ? { ...b } : { ...b });
    }
  }
  return out;
}

function descripcionABloques(descripcion: string): Bloque[] {
  const bloques: Bloque[] = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let last = 0;

  for (const m of descripcion.matchAll(re)) {
    const idx = m.index ?? 0;
    const antes = descripcion.slice(last, idx).replace(/^\n+|\n+$/g, "");
    if (antes) {
      bloques.push({ type: "texto", id: nuevoId(), content: antes });
    }
    const url = m[2];
    const { width } = parseAltConWidth(m[1] || "");
    bloques.push({
      type: "imagen",
      id: nuevoId(),
      preview: url.startsWith("blob:") ? url : apiAssetUrl(url),
      url: url.startsWith("blob:") ? undefined : url,
      width: width ?? null,
    });
    last = idx + m[0].length;
  }

  const resto = descripcion.slice(last).replace(/^\n+|\n+$/g, "");
  if (resto) {
    bloques.push({ type: "texto", id: nuevoId(), content: resto });
  }

  if (bloques.length === 0) {
    bloques.push({ type: "texto", id: nuevoId(), content: "" });
  }

  return compactarTextosAdyacentes(bloques);
}

function bloquesADescripcion(bloques: Bloque[]): string {
  const partes: string[] = [];
  for (const b of compactarTextosAdyacentes(bloques)) {
    if (b.type === "texto") {
      const t = b.content.trim();
      if (t) partes.push(t);
    } else if (b.url) {
      const w = b.width && b.width > 0 ? b.width : undefined;
      partes.push(markdownImagen(normalizarRutaMedio(b.url), "captura", w).trim());
    }
  }
  return partes.join("\n\n").trim();
}

function bloquesAPendientes(bloques: Bloque[]): ImagenPendiente[] {
  return bloques
    .filter((b): b is BloqueImagen => b.type === "imagen" && !!b.file)
    .map((b) => ({
      id: b.id,
      file: b.file!,
      preview: b.preview,
      width: b.width ?? null,
    }));
}

export function DescripcionEditor({
  value,
  onChange,
  incidenciaId,
  disabled,
  placeholder = "Añade una descripción más detallada…",
  className = "",
  onError,
  imagenesPendientes: _pendientesProp,
  onImagenesPendientesChange,
}: Props) {
  const editorId = useId();
  const [bloques, setBloques] = useState<Bloque[]>(() => descripcionABloques(value));
  const [bloqueTextoActivo, setBloqueTextoActivo] = useState<string | null>(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const sincronizandoRef = useRef(false);
  const valorEmitidoRef = useRef(value);
  const previewsRef = useRef<Set<string>>(new Set());
  const pegandoImagenRef = useRef(false);

  const registrarPreview = useCallback((url: string) => {
    if (url.startsWith("blob:")) previewsRef.current.add(url);
  }, []);

  const revocarPreview = useCallback((url: string) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      previewsRef.current.delete(url);
    }
  }, []);

  const emitir = useCallback(
    (nuevos: Bloque[]) => {
      const compactos = compactarTextosAdyacentes(nuevos);
      const desc = bloquesADescripcion(compactos);
      sincronizandoRef.current = true;
      valorEmitidoRef.current = desc;
      onChange(desc);
      onImagenesPendientesChange?.(bloquesAPendientes(compactos));
      queueMicrotask(() => {
        sincronizandoRef.current = false;
      });
      return compactos;
    },
    [onChange, onImagenesPendientesChange],
  );

  const actualizarBloques = useCallback(
    (fn: (prev: Bloque[]) => Bloque[]) => {
      setBloques((prev) => {
        const next = emitir(fn(prev));
        return next;
      });
    },
    [emitir],
  );

  useEffect(() => {
    if (sincronizandoRef.current || value === valorEmitidoRef.current) return;
    valorEmitidoRef.current = value;
    setBloques(descripcionABloques(value));
  }, [value]);

  useEffect(() => {
    return () => {
      for (const url of previewsRef.current) {
        URL.revokeObjectURL(url);
      }
      previewsRef.current.clear();
    };
  }, []);

  function indiceBloqueTextoActivo(lista: Bloque[]): number {
    if (bloqueTextoActivo) {
      const i = lista.findIndex((b) => b.id === bloqueTextoActivo);
      if (i >= 0) return i;
    }
    for (let i = lista.length - 1; i >= 0; i--) {
      if (lista[i].type === "texto") return i;
    }
    return lista.length - 1;
  }

  async function insertarImagen(file: File) {
    const err = validarImagen(file);
    if (err) {
      onError?.(err);
      return;
    }
    onError?.(null);

    if (incidenciaId) {
      setSubiendo(true);
      try {
        const { url, ruta } = await apiSubirIncidenciaMedio(incidenciaId, file);
        const pathMedio = normalizarRutaMedio(url, ruta);
        actualizarBloques((prev) => {
          const idx = indiceBloqueTextoActivo(prev);
          const img: BloqueImagen = {
            type: "imagen",
            id: nuevoId(),
            preview: apiAssetUrl(pathMedio),
            url: pathMedio,
          };
          const textoSiguiente: BloqueTexto = {
            type: "texto",
            id: nuevoId(),
            content: "",
          };
          return [
            ...prev.slice(0, idx + 1),
            img,
            textoSiguiente,
            ...prev.slice(idx + 1),
          ];
        });
        setBloqueTextoActivo(null);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "No se pudo subir la imagen");
      } finally {
        setSubiendo(false);
      }
      return;
    }

    const preview = URL.createObjectURL(file);
    registrarPreview(preview);

    actualizarBloques((prev) => {
      const idx = indiceBloqueTextoActivo(prev);
      const img: BloqueImagen = {
        type: "imagen",
        id: nuevoId(),
        preview,
        file,
      };
      const textoSiguiente: BloqueTexto = {
        type: "texto",
        id: nuevoId(),
        content: "",
      };
      const next = [...prev.slice(0, idx + 1), img, textoSiguiente, ...prev.slice(idx + 1)];
      setBloqueTextoActivo(textoSiguiente.id);
      return next;
    });
  }

  function onPasteImagen(e: React.ClipboardEvent) {
    const file = archivoDesdePortapapeles(e.clipboardData);
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    if (pegandoImagenRef.current) return;
    pegandoImagenRef.current = true;
    void Promise.resolve(insertarImagen(file)).finally(() => {
      pegandoImagenRef.current = false;
    });
  }

  function actualizarTexto(id: string, content: string) {
    actualizarBloques((prev) =>
      prev.map((b) => (b.id === id && b.type === "texto" ? { ...b, content } : b)),
    );
  }

  function quitarImagen(id: string) {
    actualizarBloques((prev) => {
      const b = prev.find((x) => x.id === id);
      if (b?.type === "imagen") revocarPreview(b.preview);
      const filtrado = prev.filter((x) => x.id !== id);
      if (filtrado.some((x) => x.type === "texto")) return filtrado;
      return [{ type: "texto", id: nuevoId(), content: "" }];
    });
    if (imagenSeleccionada === id) setImagenSeleccionada(null);
  }

  function actualizarAnchoImagen(id: string, width: number | null) {
    actualizarBloques((prev) =>
      prev.map((b) =>
        b.id === id && b.type === "imagen"
          ? { ...b, width: width == null ? null : Math.round(width) }
          : b,
      ),
    );
  }

  const bloquesVisibles = compactarTextosAdyacentes(bloques);

  return (
    <div className={className}>
      <div
        role="textbox"
        aria-labelledby={editorId}
        className={`jira-description-edit ${disabled || subiendo ? "is-disabled" : ""}`}
      >
        <span id={editorId} className="sr-only">
          Descripción
        </span>

        {subiendo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <Loader2 className="animate-spin text-[#0052cc]" size={22} />
          </div>
        )}

        <div className="jira-description-edit__body">
          {bloquesVisibles.map((bloque, index) => {
            if (bloque.type === "texto") {
              const lineas = bloque.content.split("\n").length;
              const esUnico = bloquesVisibles.length === 1;
              return (
                <textarea
                  key={bloque.id}
                  value={bloque.content}
                  onChange={(e) => actualizarTexto(bloque.id, e.target.value)}
                  onFocus={() => setBloqueTextoActivo(bloque.id)}
                  onPaste={onPasteImagen}
                  disabled={disabled || subiendo}
                  rows={Math.max(esUnico ? 4 : 2, Math.min(14, lineas + 1))}
                  placeholder={
                    index === 0 && esUnico
                      ? placeholder
                      : "Continúa escribiendo debajo de la imagen…"
                  }
                  className="jira-description-edit__textarea"
                />
              );
            }

            return (
              <ImagenRedimensionable
                key={bloque.id}
                preview={bloque.preview}
                width={bloque.width ?? null}
                selected={imagenSeleccionada === bloque.id}
                disabled={!!disabled}
                onSelect={() =>
                  setImagenSeleccionada((prev) => (prev === bloque.id ? null : bloque.id))
                }
                onAbrirLightbox={() => setLightboxUrl(bloque.preview)}
                onQuitar={() => quitarImagen(bloque.id)}
                onCambiarAncho={(w) => actualizarAnchoImagen(bloque.id, w)}
              />
            );
          })}
        </div>

        <p className="jira-description-edit__tip">
          Pega capturas con Ctrl+V; se insertan debajo del párrafo donde escribes.
        </p>
      </div>

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
            alt="Vista ampliada"
            className="relative max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export async function adjuntarImagenesPendientesADescripcion(
  incidenciaId: number,
  descripcion: string,
  pendientes: ImagenPendiente[],
): Promise<string> {
  if (pendientes.length === 0) return descripcion.trim();
  let bloques = descripcionABloques(descripcion);
  for (const p of pendientes) {
    const { url, ruta } = await apiSubirIncidenciaMedio(incidenciaId, p.file);
    const pathMedio = normalizarRutaMedio(url, ruta);
    bloques = [
      ...bloques,
      {
        type: "imagen",
        id: p.id,
        preview: apiAssetUrl(pathMedio),
        url: pathMedio,
        width: p.width ?? null,
      },
    ];
  }
  return bloquesADescripcion(bloques);
}
