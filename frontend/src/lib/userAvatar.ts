/** Paleta con buen contraste sobre texto blanco (estilo Atlassian). */
const PALETA = [
  "#0052CC",
  "#00875A",
  "#6554C0",
  "#FF5630",
  "#FF8B00",
  "#00B8D9",
  "#DE350B",
  "#5243AA",
  "#253858",
  "#36B37E",
  "#8777D9",
  "#FF991F",
] as const;

function hashClave(clave: string): number {
  let h = 0;
  for (let i = 0; i < clave.length; i++) {
    h = (Math.imul(31, h) + clave.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function claveUsuario(userId?: number | null, nombre?: string | null): string {
  if (userId != null && userId > 0) return `id:${userId}`;
  return `name:${(nombre ?? "?").trim().toLowerCase()}`;
}

export function colorUsuario(userId?: number | null, nombre?: string | null): string {
  return PALETA[hashClave(claveUsuario(userId, nombre)) % PALETA.length];
}

export function inicialesUsuario(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
