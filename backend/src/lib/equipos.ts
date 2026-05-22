import { pool } from "@/lib/db";

/** Equipos de gestión alineados con plantillas del portal. */
export const EQUIPOS_CATALOGO = [
  { codigo: "IT", nombre: "Tecnología" },
  { codigo: "RRHH", nombre: "Recursos humanos" },
  { codigo: "ADMIN", nombre: "Administración / sistemas" },
  { codigo: "MANTENIMIENTO", nombre: "Mantenimiento" },
  { codigo: "FINANZAS", nombre: "Finanzas" },
  { codigo: "COMERCIAL", nombre: "Comercial" },
  { codigo: "LEGAL", nombre: "Legal" },
] as const;

export type EquipoCodigo = (typeof EQUIPOS_CATALOGO)[number]["codigo"];

const CODIGOS_VALIDOS = new Set<string>(EQUIPOS_CATALOGO.map((e) => e.codigo));

/** Normaliza etiquetas de plantilla o departamento a código de equipo. */
export function normalizeEquipoCodigo(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toUpperCase();
  if (!t || t === "SEGÚN CONTENIDO" || t === "SEGUN CONTENIDO") return null;
  if (t.startsWith("IT")) return "IT";
  if (t.includes("RRHH")) return "RRHH";
  if (t.includes("MANTENIMIENTO")) return "MANTENIMIENTO";
  if (t.includes("FINANZAS")) return "FINANZAS";
  if (t.includes("COMERCIAL")) return "COMERCIAL";
  if (t.includes("LEGAL")) return "LEGAL";
  if (t.includes("ADMIN")) return "ADMIN";
  if (CODIGOS_VALIDOS.has(t)) return t;
  return null;
}

export function equipoCodigoFromDescripcion(descripcion: string): string | null {
  const m = descripcion.match(/^Equipo:\s*(.+)$/im);
  if (!m) return null;
  return normalizeEquipoCodigo(m[1]);
}

/** Equipos inferidos del departamento del usuario (fallback si no hay filas en usuario_equipos). */
export function equiposDesdeDepartamento(departamento: string | null | undefined): string[] {
  const cod = normalizeEquipoCodigo(departamento);
  if (!cod || cod === "ADMIN") return [];
  return [cod];
}

export async function getEquiposUsuario(
  usuarioId: number,
  departamento: string | null | undefined,
): Promise<string[]> {
  const { rows } = await pool.query<{ codigo: string }>(
    `
    SELECT e.codigo
    FROM usuario_equipos ue
    INNER JOIN equipos e ON e.id = ue.equipo_id
    WHERE ue.usuario_id = $1
    ORDER BY e.codigo
  `,
    [usuarioId],
  );

  const explicit = rows.map((r) => normalizeEquipoCodigo(r.codigo)).filter((c): c is string => !!c);
  if (explicit.length > 0) return [...new Set(explicit)];

  return equiposDesdeDepartamento(departamento);
}

export function puedeUsarKanbanEquipos(
  departamento: string | null | undefined,
  equipos: string[],
): boolean {
  const dept = (departamento ?? "").trim().toUpperCase();
  if (!dept) return false;
  if (dept === "ADMIN") return false;
  return equipos.length > 0;
}

export function incidenciaEnScopeKanban(
  incidencia: { asignado_a: number | null; equipo_codigo: string | null },
  usuarioId: number,
  equiposUsuario: string[],
): boolean {
  if (incidencia.asignado_a === usuarioId) return true;
  const cod = normalizeEquipoCodigo(incidencia.equipo_codigo);
  if (cod && equiposUsuario.includes(cod)) return true;
  return false;
}

export function puedeCambiarEstadoEnTablero(
  esAdmin: boolean,
  incidencia: { asignado_a: number | null; equipo_codigo: string | null },
  usuarioId: number,
  equiposUsuario: string[],
): boolean {
  if (esAdmin) return true;
  return incidenciaEnScopeKanban(incidencia, usuarioId, equiposUsuario);
}

export type EquipoListItem = {
  codigo: string;
  nombre: string;
  miembros: number;
};

/** Catálogo desde BD (con recuento de agentes); fallback al catálogo fijo si la tabla está vacía. */
export async function listEquiposConMiembros(): Promise<EquipoListItem[]> {
  try {
    const { rows } = await pool.query<{ codigo: string; nombre: string; miembros: string }>(
      `
      SELECT e.codigo, e.nombre, COUNT(ue.usuario_id)::text AS miembros
      FROM equipos e
      LEFT JOIN usuario_equipos ue ON ue.equipo_id = e.id
      GROUP BY e.id, e.codigo, e.nombre
      ORDER BY e.codigo
    `,
    );
    if (rows.length > 0) {
      return rows.map((r) => ({
        codigo: r.codigo,
        nombre: r.nombre,
        miembros: Number(r.miembros) || 0,
      }));
    }
  } catch {
    /* tabla aún no provisionada */
  }
  return EQUIPOS_CATALOGO.map((e) => ({ codigo: e.codigo, nombre: e.nombre, miembros: 0 }));
}

export async function clearUsuarioEquipos(usuarioId: number): Promise<void> {
  await pool.query(`DELETE FROM usuario_equipos WHERE usuario_id = $1`, [usuarioId]);
}

/** Vincula al usuario con equipos según su departamento (sin dept = sin equipos). */
export async function syncUsuarioEquiposDesdeDepartamento(
  usuarioId: number,
  departamento: string | null | undefined,
): Promise<void> {
  await clearUsuarioEquipos(usuarioId);
  const codigos = equiposDesdeDepartamento(departamento);
  if (codigos.length === 0) return;

  await pool.query(
    `
    INSERT INTO usuario_equipos (usuario_id, equipo_id)
    SELECT $1, e.id FROM equipos e WHERE e.codigo = ANY($2::text[])
    ON CONFLICT DO NOTHING
  `,
    [usuarioId, codigos],
  );
}
