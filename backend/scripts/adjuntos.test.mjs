import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads", "incidencias");

// Reimplementación local del helper de adjuntos.ts. Debe quedar alineada con
// backend/src/lib/adjuntos.ts → rutaAbsoluta.
function rutaAbsoluta(rutaRelativa) {
  if (typeof rutaRelativa !== "string" || rutaRelativa.length === 0) {
    throw new Error("Ruta vacía");
  }
  if (rutaRelativa.includes("\0")) throw new Error("Ruta inválida");
  if (rutaRelativa.startsWith("/") || rutaRelativa.startsWith("\\")) {
    throw new Error("Ruta absoluta no permitida");
  }
  if (path.isAbsolute(rutaRelativa)) {
    throw new Error("Ruta absoluta no permitida");
  }
  const segments = rutaRelativa.split(/[/\\]+/).filter((s) => s.length > 0);
  if (segments.length === 0) throw new Error("Ruta vacía");
  for (const seg of segments) {
    if (seg === "." || seg === ".." || /^\.+$/.test(seg)) {
      throw new Error("Ruta fuera del directorio de uploads");
    }
  }
  const resolved = path.resolve(UPLOAD_ROOT, ...segments);
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error("Ruta fuera del directorio de uploads");
  }
  return resolved;
}

function detectarMimeReal(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "image/png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return "image/webp";
  return null;
}

describe("rutaAbsoluta (path traversal)", () => {
  it("acepta rutas dentro de uploads", () => {
    const abs = rutaAbsoluta("42/abc.png");
    assert.ok(abs.startsWith(UPLOAD_ROOT + path.sep));
  });

  it("rechaza ../ y similares", () => {
    assert.throws(() => rutaAbsoluta("../etc/passwd"));
    assert.throws(() => rutaAbsoluta("..//etc/passwd"));
    assert.throws(() => rutaAbsoluta("....//etc/passwd"));
    assert.throws(() => rutaAbsoluta("42/../43/abc.png"));
    assert.throws(() => rutaAbsoluta("42/./abc.png"));
  });

  it("rechaza rutas absolutas y null bytes", () => {
    assert.throws(() => rutaAbsoluta("/etc/passwd"));
    assert.throws(() => rutaAbsoluta("\\windows\\system32"));
    assert.throws(() => rutaAbsoluta("42/foo\0bar.png"));
    assert.throws(() => rutaAbsoluta(""));
  });
});

describe("detectarMimeReal", () => {
  it("PNG", () => {
    const buf = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x00,
    ]);
    assert.equal(detectarMimeReal(buf), "image/png");
  });
  it("JPEG", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(detectarMimeReal(buf), "image/jpeg");
  });
  it("rechaza payload de texto", () => {
    const buf = Buffer.from("<?php evil();");
    assert.equal(detectarMimeReal(buf), null);
  });
});
