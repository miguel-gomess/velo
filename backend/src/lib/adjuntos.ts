import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;

/** Directorio base de ficheros. En Vercel solo `/tmp` es escribible (efímero). */
export function getUploadRoot(): string {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "velo", "uploads", "incidencias");
  }
  return path.resolve(process.cwd(), "uploads", "incidencias");
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ImagenGuardada = {
  ruta: string;
  mime_type: string;
  tamano_bytes: number;
  nombre_original: string;
};

/**
 * Resuelve una ruta relativa dentro de UPLOAD_ROOT.
 *
 * - Rechaza rutas vacías, absolutas, con null bytes o que empiecen por separador.
 * - Rechaza segmentos vacíos, `.`, `..` o secuencias de solo puntos (`....`).
 * - Hace una verificación final con `path.resolve` + `startsWith` como defensa
 *   en profundidad.
 */
export function rutaAbsoluta(rutaRelativa: string): string {
  if (typeof rutaRelativa !== "string" || rutaRelativa.length === 0) {
    throw new Error("Ruta vacía");
  }
  if (rutaRelativa.includes("\0")) {
    throw new Error("Ruta inválida");
  }
  if (rutaRelativa.startsWith("/") || rutaRelativa.startsWith("\\")) {
    throw new Error("Ruta absoluta no permitida");
  }
  if (path.isAbsolute(rutaRelativa)) {
    throw new Error("Ruta absoluta no permitida");
  }

  const segments = rutaRelativa.split(/[/\\]+/).filter((s) => s.length > 0);
  if (segments.length === 0) {
    throw new Error("Ruta vacía");
  }
  for (const seg of segments) {
    if (seg === "." || seg === ".." || /^\.+$/.test(seg)) {
      throw new Error("Ruta fuera del directorio de uploads");
    }
  }

  const UPLOAD_ROOT = getUploadRoot();
  const resolved = path.resolve(UPLOAD_ROOT, ...segments);
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error("Ruta fuera del directorio de uploads");
  }
  return resolved;
}

export function urlImagenIncidencia(rutaRelativa: string): string {
  const encoded = rutaRelativa
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `/api/incidencias/archivo/${encoded}`;
}

/**
 * Detecta el tipo real de la imagen a partir de los bytes mágicos.
 * Devuelve null si no coincide con ninguno permitido.
 */
function detectarMimeReal(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

async function validarYLeer(file: File): Promise<{ buffer: Buffer; mime: string }> {
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeReal = detectarMimeReal(buffer);
  if (!mimeReal || !MIME_EXT[mimeReal]) {
    throw new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF");
  }
  return { buffer, mime: mimeReal };
}

async function escribirSeguro(rutaRelativa: string, buffer: Buffer): Promise<void> {
  const destino = rutaAbsoluta(rutaRelativa);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, buffer);
}

/** Imagen embebida en descripción/chat (no aparece en listado de evidencias). */
export async function guardarImagenInlineIncidencia(
  incidenciaId: number,
  file: File,
): Promise<ImagenGuardada> {
  const { buffer, mime } = await validarYLeer(file);
  const ext = MIME_EXT[mime];
  const nombre = `${randomUUID()}.${ext}`;
  const rutaRelativa = `${incidenciaId}/inline/${nombre}`;
  await escribirSeguro(rutaRelativa, buffer);

  return {
    ruta: rutaRelativa,
    mime_type: mime,
    tamano_bytes: file.size,
    nombre_original: file.name || nombre,
  };
}

export async function guardarImagenIncidencia(
  incidenciaId: number,
  file: File,
): Promise<ImagenGuardada> {
  const { buffer, mime } = await validarYLeer(file);
  const ext = MIME_EXT[mime];
  const nombre = `${randomUUID()}.${ext}`;
  const rutaRelativa = `${incidenciaId}/${nombre}`;
  await escribirSeguro(rutaRelativa, buffer);

  return {
    ruta: rutaRelativa,
    mime_type: mime,
    tamano_bytes: file.size,
    nombre_original: file.name || nombre,
  };
}

/** Elimina todos los ficheros físicos asociados a la incidencia (no falla si no existen). */
export async function borrarArchivosIncidencia(incidenciaId: number): Promise<void> {
  const dir = rutaAbsoluta(String(incidenciaId));
  await rm(dir, { recursive: true, force: true });
}

export async function leerImagen(rutaRelativa: string): Promise<{
  buffer: Buffer;
  mime_type: string;
}> {
  const buffer = await readFile(rutaAbsoluta(rutaRelativa));
  const mimeReal = detectarMimeReal(buffer);
  return {
    buffer,
    mime_type: mimeReal ?? "application/octet-stream",
  };
}
