import assert from "node:assert/strict";
import { describe, it } from "node:test";

function parseAltConWidth(alt) {
  const m = /^(.*?)\|width=(\d+)$/i.exec(alt);
  if (!m) return { alt, width: null };
  return { alt: m[1], width: Number(m[2]) };
}

function markdownImagen(url, alt = "imagen", width) {
  const altFinal = width && width > 0 ? `${alt}|width=${Math.round(width)}` : alt;
  return `\n![${altFinal}](${url})\n`;
}

function extraerAnchoDelContenido(contenido) {
  const m = /<!--imgw=(\d+)-->\s*$/.exec(contenido);
  if (!m) return { texto: contenido, width: null };
  const texto = contenido.replace(/<!--imgw=\d+-->/g, "").trimEnd();
  return { texto, width: Number(m[1]) };
}

function rutaArchivoIncidencia(rutaRelativa) {
  const rel = rutaRelativa.replace(/^\/+/, "").replace(/\.\./g, "");
  const encoded = rel.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `/api/incidencias/archivo/${encoded}`;
}

function normalizarRutaMedio(pathOrUrl, rutaFallback) {
  const trimmed = pathOrUrl.trim();
  if (!trimmed && rutaFallback) return rutaArchivoIncidencia(rutaFallback);
  if (trimmed.startsWith("/api/incidencias/archivo/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      const p = u.pathname.replace(/^\/+/, "");
      if (p.startsWith("api/incidencias/archivo/")) return `/${p}`;
      if (/^\d+\//.test(p)) return rutaArchivoIncidencia(p);
    } catch {
      /* */
    }
    return trimmed;
  }
  const rel = trimmed.replace(/^\/+/, "");
  if (rel.startsWith("api/incidencias/archivo/")) return `/${rel}`;
  if (/^\d+\//.test(rel)) return rutaArchivoIncidencia(rel);
  if (rutaFallback) return rutaArchivoIncidencia(rutaFallback);
  return trimmed;
}

describe("rutas de medios", () => {
  it("convierte ruta relativa a path API", () => {
    assert.equal(
      normalizarRutaMedio("/api/incidencias/archivo/1/inline/x.png"),
      "/api/incidencias/archivo/1/inline/x.png",
    );
    assert.equal(
      normalizarRutaMedio("http://localhost:3000/1/inline/x.png"),
      "/api/incidencias/archivo/1/inline/x.png",
    );
    assert.equal(
      normalizarRutaMedio("", "2/inline/y.png"),
      "/api/incidencias/archivo/2/inline/y.png",
    );
  });
});

describe("imagenes markdown", () => {
  it("parsea width en alt", () => {
    const r = parseAltConWidth("captura|width=320");
    assert.equal(r.alt, "captura");
    assert.equal(r.width, 320);
  });

  it("genera markdown con width", () => {
    const md = markdownImagen("http://x/img.png", "foto", 400);
    assert.match(md, /!\[foto\|width=400\]/);
  });

  it("extrae marcador de ancho en mensaje", () => {
    const r = extraerAnchoDelContenido("Hola\n<!--imgw=280-->");
    assert.equal(r.texto, "Hola");
    assert.equal(r.width, 280);
  });
});
