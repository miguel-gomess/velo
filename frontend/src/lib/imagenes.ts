export const MAX_IMAGEN_MB = 5;

export function validarImagen(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Solo se permiten imágenes (JPG, PNG, WEBP, GIF).";
  }
  if (file.size > MAX_IMAGEN_MB * 1024 * 1024) {
    return `La imagen no puede superar ${MAX_IMAGEN_MB} MB.`;
  }
  return null;
}

export function nombreImagenPegada(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `captura-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
}

/** Obtiene la primera imagen del portapapeles (captura pegada). */
export function archivoDesdePortapapeles(data: DataTransfer | null): File | null {
  if (!data) return null;
  const items = data.items;
  if (items?.length) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) {
          return f.name ? f : new File([f], nombreImagenPegada(), { type: f.type || "image/png" });
        }
      }
    }
  }
  const files = data.files;
  if (files?.length) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith("image/")) {
        return f.name ? f : new File([f], nombreImagenPegada(), { type: f.type || "image/png" });
      }
    }
  }
  return null;
}

export function markdownImagen(url: string, alt = "imagen", width?: number): string {
  const altFinal = width && width > 0 ? `${alt}|width=${Math.round(width)}` : alt;
  return `\n![${altFinal}](${url})\n`;
}

/** Extrae width opcional del alt (formato Jira: "alt|width=400"). */
export function parseAltConWidth(alt: string): { alt: string; width: number | null } {
  const m = /^(.*?)\|width=(\d+)$/i.exec(alt);
  if (!m) return { alt, width: null };
  return { alt: m[1], width: Number(m[2]) };
}

const ANCHO_MENSAJE_RE = /<!--imgw=(\d+)-->\s*$/;

/** Compone el contenido de un mensaje añadiendo un marcador con el ancho elegido. */
export function componerContenidoConAncho(texto: string, width: number | null): string {
  const t = texto.trimEnd();
  if (!width || width <= 0) return t;
  return `${t}\n<!--imgw=${Math.round(width)}-->`;
}

/** Separa un mensaje en texto visible y ancho almacenado en el marcador (si existe). */
export function extraerAnchoDelContenido(
  contenido: string,
): { texto: string; width: number | null } {
  const m = ANCHO_MENSAJE_RE.exec(contenido);
  if (!m) return { texto: contenido, width: null };
  const texto = contenido.replace(ANCHO_MENSAJE_RE, "").trimEnd();
  return { texto, width: Number(m[1]) };
}

/** Limpia marcadores internos para visualizar un mensaje (compatibilidad). */
export function limpiarMarcadoresMensaje(contenido: string): string {
  return contenido.replace(/<!--imgw=\d+-->/g, "").trim();
}

const IMG_MD_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

/** Separa texto plano y bloques de imagen markdown. */
export function parseDescripcionConImagenes(descripcion: string): {
  texto: string;
  imagenesMd: string;
} {
  let imagenesMd = "";
  for (const m of descripcion.matchAll(IMG_MD_RE)) {
    imagenesMd += m[0];
  }
  const texto = descripcion
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { texto, imagenesMd };
}

export function combinarDescripcion(texto: string, imagenesMd: string): string {
  const t = texto.trim();
  const imgs = imagenesMd.trim();
  if (!t) return imgs;
  if (!imgs) return t;
  return `${t}\n${imgs}`.trim();
}

/** Texto mostrado en el editor (texto + imágenes pendientes como blob). */
export function descripcionParaMostrar(
  descripcion: string,
  pendientes: { preview: string }[],
): string {
  let out = descripcion.trimEnd();
  for (const p of pendientes) {
    out += markdownImagen(p.preview, "captura");
  }
  return out;
}

export function insertarEnTextarea(
  textarea: HTMLTextAreaElement,
  valorActual: string,
  textoInsertar: string,
): string {
  const start = textarea.selectionStart ?? valorActual.length;
  const end = textarea.selectionEnd ?? valorActual.length;
  const nuevo = valorActual.slice(0, start) + textoInsertar + valorActual.slice(end);
  const pos = start + textoInsertar.length;
  requestAnimationFrame(() => {
    textarea.selectionStart = pos;
    textarea.selectionEnd = pos;
    textarea.focus();
  });
  return nuevo;
}
