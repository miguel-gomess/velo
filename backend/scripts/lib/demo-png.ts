import { deflateSync } from "node:zlib";

export type DemoPngVariant =
  | "error"
  | "portal"
  | "grafica"
  | "log"
  | "certificado"
  | "adjunto";

type Rgb = [number, number, number];

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba: Buffer, width: number, height: number): Buffer {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function fill(rgba: Buffer, w: number, h: number, color: Rgb) {
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    rgba[o] = color[0];
    rgba[o + 1] = color[1];
    rgba[o + 2] = color[2];
    rgba[o + 3] = 255;
  }
}

function rect(
  rgba: Buffer,
  w: number,
  x: number,
  y: number,
  rw: number,
  rh: number,
  color: Rgb,
) {
  for (let py = y; py < y + rh; py++) {
    if (py < 0 || py >= rgba.length / (w * 4)) continue;
    for (let px = x; px < x + rw; px++) {
      if (px < 0 || px >= w) continue;
      const o = (py * w + px) * 4;
      rgba[o] = color[0];
      rgba[o + 1] = color[1];
      rgba[o + 2] = color[2];
      rgba[o + 3] = 255;
    }
  }
}

const GLYPH: Record<string, number[][]> = {
  " ": [[0]],
  A: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  B: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
  ],
  C: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [0, 1, 1],
  ],
  D: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
  E: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  F: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
  ],
  G: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
  ],
  H: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  I: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  L: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  N: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  O: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ],
  P: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
  ],
  R: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  U: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ],
  V: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  X: [
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 0, 1],
  ],
  Y: [
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  "0": [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ],
  "1": [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  "2": [
    [1, 1, 0],
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  "3": [
    [1, 1, 0],
    [0, 0, 1],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
  ],
  "4": [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "5": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
  ],
  "6": [
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],
  "7": [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
  ],
  "8": [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],
  "9": [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 1],
    [0, 0, 1],
    [0, 1, 0],
  ],
  ".": [
    [0],
    [0],
    [0],
    [0],
    [1],
  ],
  "-": [
    [0],
    [0],
    [1],
    [0],
    [0],
  ],
  ":": [
    [0],
    [1],
    [0],
    [1],
    [0],
  ],
};

function texto(
  rgba: Buffer,
  w: number,
  x: number,
  y: number,
  scale: number,
  text: string,
  color: Rgb,
) {
  const upper = text.toUpperCase().slice(0, 48);
  let cx = x;
  for (const ch of upper) {
    const g = GLYPH[ch] ?? GLYPH[" "]!;
    const gw = g[0]!.length;
    for (let row = 0; row < g.length; row++) {
      for (let col = 0; col < gw; col++) {
        if (!g[row]![col]) continue;
        rect(rgba, w, cx + col * scale, y + row * scale, scale, scale, color);
      }
    }
    cx += (gw + 1) * scale;
  }
}

function dibujarChrome(rgba: Buffer, w: number, h: number, bar: Rgb) {
  rect(rgba, w, 0, 0, w, 28, bar);
  rect(rgba, w, 12, 9, 10, 10, [255, 255, 255]);
  rect(rgba, w, 28, 9, 10, 10, [255, 255, 255]);
  rect(rgba, w, 44, 9, 10, 10, [255, 255, 255]);
  rect(rgba, w, 0, 28, w, h - 28, [248, 250, 252]);
}

function pintarError(rgba: Buffer, w: number, h: number, label: string) {
  dibujarChrome(rgba, w, h, [220, 38, 38]);
  rect(rgba, w, 24, 56, w - 48, h - 100, [254, 242, 242]);
  rect(rgba, w, w / 2 - 36, 72, 72, 72, [239, 68, 68]);
  texto(rgba, w, 32, h - 44, 2, label, [127, 29, 29]);
}

function pintarPortal(rgba: Buffer, w: number, h: number, label: string) {
  dibujarChrome(rgba, w, h, [37, 99, 235]);
  rect(rgba, w, 20, 48, 160, 22, [226, 232, 240]);
  rect(rgba, w, 20, 82, w - 40, 120, [255, 255, 255]);
  rect(rgba, w, 32, 100, w - 64, 18, [219, 234, 254]);
  rect(rgba, w, 32, 128, w - 64, 18, [219, 234, 254]);
  rect(rgba, w, 32, 156, 120, 28, [34, 197, 94]);
  texto(rgba, w, 24, h - 40, 2, label, [30, 64, 175]);
}

function pintarGrafica(rgba: Buffer, w: number, h: number, label: string, seed: number) {
  fill(rgba, w, h, [15, 23, 42]);
  dibujarChrome(rgba, w, h, [51, 65, 85]);
  const base = h - 48;
  const bars = 7 + (seed % 4);
  const gap = 8;
  const bw = Math.floor((w - 40 - gap * (bars - 1)) / bars);
  for (let i = 0; i < bars; i++) {
    const bh = 40 + ((seed * (i + 3) * 17) % (h - 120));
    const colors: Rgb[] = [
      [59, 130, 246],
      [16, 185, 129],
      [245, 158, 11],
      [168, 85, 247],
      [236, 72, 153],
    ];
    rect(rgba, w, 20 + i * (bw + gap), base - bh, bw, bh, colors[i % colors.length]!);
  }
  texto(rgba, w, 20, h - 32, 2, label, [148, 163, 184]);
}

function pintarLog(rgba: Buffer, w: number, h: number, label: string, seed: number) {
  fill(rgba, w, h, [2, 6, 23]);
  dibujarChrome(rgba, w, h, [30, 41, 59]);
  for (let i = 0; i < 6; i++) {
    const y = 40 + i * 22;
    const tone: Rgb =
      i % 3 === 0 ? [74, 222, 128] : i % 3 === 1 ? [250, 204, 21] : [96, 165, 250];
    rect(rgba, w, 16, y, w - 32 - (seed % 80), 10, tone);
  }
  texto(rgba, w, 16, h - 30, 2, label, [34, 197, 94]);
}

function pintarCertificado(rgba: Buffer, w: number, h: number, label: string) {
  dibujarChrome(rgba, w, h, [202, 138, 4]);
  rect(rgba, w, 24, 48, w - 48, h - 90, [255, 251, 235]);
  rect(rgba, w, w / 2 - 40, 64, 80, 70, [251, 191, 36]);
  rect(rgba, w, 40, 150, w - 80, 14, [254, 243, 199]);
  rect(rgba, w, 40, 172, w - 120, 14, [254, 243, 199]);
  texto(rgba, w, 32, h - 38, 2, label, [146, 64, 14]);
}

function pintarAdjunto(rgba: Buffer, w: number, h: number, label: string, seed: number) {
  const tones: Rgb[] = [
    [241, 245, 249],
    [254, 249, 195],
    [236, 253, 245],
    [255, 241, 242],
  ];
  fill(rgba, w, h, tones[seed % tones.length]!);
  rect(rgba, w, 12, 12, w - 24, h - 24, [255, 255, 255]);
  rect(rgba, w, 20, 24, w - 80, 24, [226, 232, 240]);
  rect(rgba, w, 20, 58, w - 40, h - 90, [248, 250, 252]);
  rect(rgba, w, 28, 70 + (seed % 40), w - 56, 12, [203, 213, 225]);
  rect(rgba, w, 28, 90 + (seed % 30), w - 72, 12, [203, 213, 225]);
  texto(rgba, w, 24, h - 36, 2, label, [71, 85, 105]);
}

const SIZES: Record<DemoPngVariant, { w: number; h: number }> = {
  error: { w: 640, h: 360 },
  portal: { w: 520, h: 320 },
  grafica: { w: 560, h: 300 },
  log: { w: 480, h: 270 },
  certificado: { w: 500, h: 290 },
  adjunto: { w: 380, h: 240 },
};

/** Mapea tipo legacy del seed a variante visual. */
export function varianteDesdeTipo(
  tipo: "captura" | "evidencia",
  incidenciaId: number,
  seq: number,
  contenido: string,
): DemoPngVariant {
  const hint = contenido.toLowerCase();
  if (/certificad|ssl|expired|caducad/i.test(hint)) return "certificado";
  if (/log|gateway|backup|nas|i\/o/i.test(hint)) return "log";
  if (/gráf|graf|disco|uso|rendimiento|chart/i.test(hint)) return "grafica";
  if (/portal|nómina|nomina|saldo|rrhh|login|pantalla/i.test(hint)) return "portal";
  if (/error|fallo|antivirus|alerta/i.test(hint)) return "error";
  const variants: DemoPngVariant[] =
    tipo === "captura"
      ? ["portal", "error", "certificado", "adjunto"]
      : ["grafica", "log", "error", "adjunto"];
  return variants[(incidenciaId + seq) % variants.length]!;
}

export function generarPngDemo(
  variant: DemoPngVariant,
  label: string,
  seed = 0,
): Buffer {
  const { w, h } = SIZES[variant];
  const rgba = Buffer.alloc(w * h * 4);
  const short = label.replace(/[^\w\s.:0-9-]/g, " ").trim().slice(0, 28) || variant.toUpperCase();

  switch (variant) {
    case "error":
      pintarError(rgba, w, h, short);
      break;
    case "portal":
      pintarPortal(rgba, w, h, short);
      break;
    case "grafica":
      pintarGrafica(rgba, w, h, short, seed);
      break;
    case "log":
      pintarLog(rgba, w, h, short, seed);
      break;
    case "certificado":
      pintarCertificado(rgba, w, h, short);
      break;
    default:
      pintarAdjunto(rgba, w, h, short, seed);
  }

  return encodePng(rgba, w, h);
}
