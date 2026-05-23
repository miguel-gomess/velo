import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pool } from "./db";

const MAX_BYTES = 5 * 1024 * 1024;

/** En Vercel el disco es efímero; persistimos bytes en PostgreSQL (Neon). */
function usarAlmacenDb(): boolean {
  return process.env.UPLOAD_STORAGE === "db" || !!process.env.VERCEL;
}

/** Directorio base de ficheros en desarrollo local. */
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
  buffer: Buffer;
};

function incidenciaIdDesdeRuta(rutaRelativa: string): number {
  const id = Number(rutaRelativa.split(/[/\\]+/)[0]);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error("Ruta inválida");
  }
  return id;
}

function bytesDesdePg(val: unknown): Buffer | null {
  if (val == null) return null;
  if (Buffer.isBuffer(val)) return val;
  if (val instanceof Uint8Array) return Buffer.from(val);
  if (typeof val === "string") {
    if (val.startsWith("\\x")) return Buffer.from(val.slice(2), "hex");
    return Buffer.from(val, "binary");
  }
  return null;
}

async function guardarEnDb(
  rutaRelativa: string,
  buffer: Buffer,
  mime: string,
): Promise<void> {
  await asegurarAlmacenArchivos();
  const incidenciaId = incidenciaIdDesdeRuta(rutaRelativa);
  await pool.query(
    `
    INSERT INTO incidencia_archivos (incidencia_id, ruta, contenido, mime_type, tamano_bytes)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (incidencia_id, ruta) DO UPDATE SET
      contenido = EXCLUDED.contenido,
      mime_type = EXCLUDED.mime_type,
      tamano_bytes = EXCLUDED.tamano_bytes
  `,
    [incidenciaId, rutaRelativa, buffer, mime, buffer.length],
  );
}

async function leerDesdeDb(rutaRelativa: string): Promise<{ buffer: Buffer; mime_type: string } | null> {
  try {
    await asegurarAlmacenArchivos();
    const incidenciaId = incidenciaIdDesdeRuta(rutaRelativa);
    const { rows } = await pool.query<{ contenido: unknown; mime_type: string }>(
      `SELECT contenido, mime_type FROM incidencia_archivos WHERE incidencia_id = $1 AND ruta = $2`,
      [incidenciaId, rutaRelativa],
    );
    const buffer = bytesDesdePg(rows[0]?.contenido);
    if (buffer && buffer.length > 0) {
      return { buffer, mime_type: rows[0]?.mime_type ?? "application/octet-stream" };
    }

    const adj = await pool.query<{ contenido: unknown; mime_type: string }>(
      `SELECT contenido, mime_type FROM incidencia_adjuntos WHERE incidencia_id = $1 AND ruta = $2 AND contenido IS NOT NULL`,
      [incidenciaId, rutaRelativa],
    );
    const adjBuffer = bytesDesdePg(adj.rows[0]?.contenido);
    if (adjBuffer && adjBuffer.length > 0) {
      return { buffer: adjBuffer, mime_type: adj.rows[0]?.mime_type ?? "application/octet-stream" };
    }

    return null;
  } catch {
    return null;
  }
}

async function borrarEnDb(incidenciaId: number): Promise<void> {
  await pool.query(`DELETE FROM incidencia_archivos WHERE incidencia_id = $1`, [incidenciaId]);
}

let almacenArchivosListo: Promise<void> | null = null;

async function asegurarAlmacenArchivos(): Promise<void> {
  if (!almacenArchivosListo) {
    almacenArchivosListo = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS incidencia_archivos (
          id SERIAL PRIMARY KEY,
          incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
          ruta TEXT NOT NULL,
          contenido BYTEA NOT NULL,
          mime_type VARCHAR(80) NOT NULL,
          tamano_bytes INTEGER NOT NULL,
          fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (incidencia_id, ruta)
        );
      `);
      await pool.query(`
        ALTER TABLE incidencia_adjuntos ADD COLUMN IF NOT EXISTS contenido BYTEA;
      `);
    })();
  }
  await almacenArchivosListo;
}

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

async function escribirSeguro(
  rutaRelativa: string,
  buffer: Buffer,
  mime: string,
): Promise<void> {
  if (usarAlmacenDb()) {
    await guardarEnDb(rutaRelativa, buffer, mime);
    return;
  }
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
  await escribirSeguro(rutaRelativa, buffer, mime);

  return {
    ruta: rutaRelativa,
    mime_type: mime,
    tamano_bytes: file.size,
    nombre_original: file.name || nombre,
    buffer,
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
  await escribirSeguro(rutaRelativa, buffer, mime);

  return {
    ruta: rutaRelativa,
    mime_type: mime,
    tamano_bytes: file.size,
    nombre_original: file.name || nombre,
    buffer,
  };
}

/** Elimina ficheros de la incidencia en disco y en BD (no falla si no existen). */
export async function borrarArchivosIncidencia(incidenciaId: number): Promise<void> {
  await borrarEnDb(incidenciaId);
  if (!usarAlmacenDb()) {
    const dir = rutaAbsoluta(String(incidenciaId));
    await rm(dir, { recursive: true, force: true });
  }
}

export async function leerImagen(rutaRelativa: string): Promise<{
  buffer: Buffer;
  mime_type: string;
}> {
  const desdeDb = await leerDesdeDb(rutaRelativa);
  if (desdeDb) {
    const mimeReal = detectarMimeReal(desdeDb.buffer) ?? desdeDb.mime_type;
    return {
      buffer: desdeDb.buffer,
      mime_type: mimeReal,
    };
  }

  if (usarAlmacenDb()) {
    throw new Error("Archivo no encontrado");
  }

  const buffer = await readFile(rutaAbsoluta(rutaRelativa));
  const mimeReal = detectarMimeReal(buffer);
  return {
    buffer,
    mime_type: mimeReal ?? "application/octet-stream",
  };
}
