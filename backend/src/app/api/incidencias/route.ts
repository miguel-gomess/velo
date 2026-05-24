import { pool } from "@/lib/db";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { epicaActivaExiste } from "@/lib/epicas";
import { getEquiposUsuario, normalizeEquipoCodigo } from "@/lib/equipos";
import { PRIORIDAD_DEFECTO, normalizarPrioridad } from "@/lib/prioridades";
import { calcularFechaLimite } from "@/lib/sla";
import { crearIncidenciaSchema, parseJson } from "@/lib/validate";
import { getIncidenciaById } from "@/lib/incidencias";
import { getUsuarioFromRequest, isAdminUsuario } from "@/lib/session";

type IncidenciaRow = {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  equipo_codigo: string | null;
  epica_id: number | null;
  epica_nombre: string | null;
  epica_clave: string | null;
  epica_color: string | null;
  asignado_a: number | null;
  asignado_por: number | null;
  fecha_asignacion: string | null;
  fecha_cierre: string | null;
  fecha_limite: string | null;
  resolucion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  solicitante_nombre?: string;
  solicitante_departamento?: string | null;
  asignado_nombre?: string | null;
};

const INCIDENCIA_SELECT = `
  i.id, i.usuario_id, i.titulo, i.descripcion, i.estado, i.prioridad, i.equipo_codigo,
  i.epica_id, ep.nombre AS epica_nombre, ep.clave AS epica_clave, ep.color AS epica_color,
  i.asignado_a, i.asignado_por, i.fecha_asignacion, i.fecha_cierre, i.fecha_limite, i.resolucion,
  i.fecha_creacion, i.fecha_actualizacion
`;

const JOIN_SOLICITANTE = `
  FROM incidencias i
  INNER JOIN usuarios u ON u.id = i.usuario_id
  LEFT JOIN usuarios a ON a.id = i.asignado_a
  LEFT JOIN epicas ep ON ep.id = i.epica_id
`;

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") ?? "portal").toLowerCase();
  const admin = isAdminUsuario(usuario);

  let rows: IncidenciaRow[];

  if (scope === "all" && !admin) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  if (admin && scope === "all") {
    const q = url.searchParams.get("q")?.trim() ?? "";
    const estado = url.searchParams.get("estado")?.trim().toLowerCase() ?? "";
    const prioridad = url.searchParams.get("prioridad")?.trim().toLowerCase() ?? "";
    const conds: string[] = [];
    const vals: unknown[] = [];
    let n = 1;
    if (q) {
      conds.push(
        `(i.titulo ILIKE $${n} OR i.descripcion ILIKE $${n} OR CAST(i.id AS TEXT) ILIKE $${n} OR u.nombre ILIKE $${n})`,
      );
      vals.push(`%${q}%`);
      n++;
    }
    if (estado) {
      conds.push(`LOWER(TRIM(i.estado)) = $${n++}`);
      vals.push(estado);
    }
    if (prioridad) {
      conds.push(`LOWER(TRIM(i.prioridad)) = $${n++}`);
      vals.push(prioridad);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const result = await pool.query<IncidenciaRow>(
      `
        SELECT ${INCIDENCIA_SELECT},
          u.nombre AS solicitante_nombre,
          u.departamento AS solicitante_departamento,
          a.nombre AS asignado_nombre
        ${JOIN_SOLICITANTE}
        ${where}
        ORDER BY i.fecha_actualizacion DESC, i.id DESC
      `,
      vals,
    );
    rows = result.rows;
  } else if (scope === "kanban") {
    const equipos = await getEquiposUsuario(usuario.id, usuario.departamento);
    if (equipos.length === 0) {
      return Response.json({ items: [] });
    }
    const result = await pool.query<IncidenciaRow>(
      `
        SELECT ${INCIDENCIA_SELECT},
          u.nombre AS solicitante_nombre,
          u.departamento AS solicitante_departamento,
          a.nombre AS asignado_nombre
        ${JOIN_SOLICITANTE}
        WHERE i.asignado_a = $1
           OR i.usuario_id = $1
           OR i.equipo_codigo = ANY($2::varchar[])
        ORDER BY i.id DESC
      `,
      [usuario.id, equipos],
    );
    rows = result.rows;
  } else {
    const result = await pool.query<IncidenciaRow>(
      `
        SELECT ${INCIDENCIA_SELECT},
          u.nombre AS solicitante_nombre,
          u.departamento AS solicitante_departamento,
          a.nombre AS asignado_nombre
        ${JOIN_SOLICITANTE}
        WHERE i.usuario_id = $1 OR i.asignado_a = $1
        ORDER BY i.id DESC
      `,
      [usuario.id],
    );
    rows = result.rows;
  }

  return Response.json({ items: rows });
}

export async function POST(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = parseJson(crearIncidenciaSchema, raw);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { titulo, descripcion, equipo_codigo, prioridad: prioridadRaw, epica_id } = parsed.data;
  const equipoCodigo = normalizeEquipoCodigo(equipo_codigo ?? null);
  const prioridad = normalizarPrioridad(prioridadRaw) ?? PRIORIDAD_DEFECTO;
  const fechaLimite = calcularFechaLimite(prioridad);

  let epicaId: number | null = epica_id ?? null;
  if (epicaId != null) {
    const ok = await epicaActivaExiste(epicaId);
    if (!ok) {
      return Response.json({ error: "Épica no válida" }, { status: 400 });
    }
  }

  const { rows } = await pool.query<{ id: number }>(
    `
    INSERT INTO incidencias (usuario_id, titulo, descripcion, equipo_codigo, prioridad, fecha_limite, epica_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `,
    [usuario.id, titulo, descripcion, equipoCodigo, prioridad, fechaLimite.toISOString(), epicaId],
  );

  if (!rows[0]) {
    return Response.json({ error: "No se pudo crear" }, { status: 500 });
  }

  await registrarEventoIncidencia({
    incidenciaId: rows[0].id,
    usuarioId: usuario.id,
    tipo: "creada",
    detalle: titulo.slice(0, 120),
  });

  const detalle = await getIncidenciaById(rows[0].id);
  return Response.json({ item: detalle ?? rows[0] }, { status: 201 });
}
