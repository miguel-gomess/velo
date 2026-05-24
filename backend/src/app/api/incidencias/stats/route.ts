import { pool } from "@/lib/db";
import { getUsuarioFromRequest, isAdminUsuario } from "@/lib/session";

export type DeptIncidenciaStats = {
  departamento: string;
  total: number;
  abiertas: number;
  en_curso: number;
  cerradas: number;
  otras: number;
};

export type EstadoIncidenciaStats = {
  estado: string;
  total: number;
};

export type EpicaIncidenciaStats = {
  epica_id: number | null;
  epica_clave: string | null;
  epica_nombre: string | null;
  epica_color: string | null;
  total: number;
  abiertas: number;
  cerradas: number;
  con_limite: number;
  en_plazo: number;
  fuera_plazo: number;
  porcentaje_en_plazo: number | null;
};

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminUsuario(usuario)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(request.url);
  const desde = url.searchParams.get("desde");
  const hasta = url.searchParams.get("hasta");
  const params: unknown[] = [];
  let filtroFecha = "";
  if (desde) {
    params.push(desde);
    filtroFecha += ` AND i.fecha_creacion >= $${params.length}::timestamptz`;
  }
  if (hasta) {
    params.push(hasta);
    filtroFecha += ` AND i.fecha_creacion <= $${params.length}::timestamptz`;
  }

  const { rows: porDept } = await pool.query<{
    departamento: string;
    total: string;
    abiertas: string;
    en_curso: string;
    cerradas: string;
    otras: string;
  }>(
    `
    SELECT
      CASE
        WHEN COALESCE(NULLIF(TRIM(BOTH FROM u.departamento), ''), '') = '' THEN '(sin departamento)'
        ELSE TRIM(BOTH FROM u.departamento)
      END AS departamento,
      COUNT(*)::text AS total,
      SUM(
        CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) IN ('abierta', 'abierto', 'pendiente') THEN 1 ELSE 0 END
      )::text AS abiertas,
      SUM(
        CASE
          WHEN LOWER(TRIM(BOTH FROM i.estado)) IN ('en_curso', 'en curso', 'proceso', 'en proceso', 'en_revision', 'en revision')
          THEN 1 ELSE 0 END
      )::text AS en_curso,
      SUM(
        CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) IN ('cerrada', 'cerrado', 'resuelta', 'resuelto') THEN 1 ELSE 0 END
      )::text AS cerradas,
      SUM(
        CASE
          WHEN LOWER(TRIM(BOTH FROM i.estado)) NOT IN (
            'abierta', 'abierto', 'pendiente',
            'en_curso', 'en curso', 'proceso', 'en proceso', 'en_revision', 'en revision',
            'cerrada', 'cerrado', 'resuelta', 'resuelto'
          ) THEN 1 ELSE 0 END
      )::text AS otras
    FROM incidencias i
    INNER JOIN usuarios u ON u.id = i.usuario_id
    WHERE 1=1 ${filtroFecha}
    GROUP BY 1
    ORDER BY COUNT(*) DESC
    `,
    params,
  );

  const { rows: porEstado } = await pool.query<{ estado: string; total: string }>(
    `
    SELECT LOWER(TRIM(BOTH FROM estado)) AS estado, COUNT(*)::text AS total
    FROM incidencias i
    WHERE 1=1 ${filtroFecha}
    GROUP BY 1
    ORDER BY COUNT(*) DESC
    `,
    params,
  );

  const { rows: totalRow } = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM incidencias i WHERE 1=1 ${filtroFecha}`,
    params,
  );

  const { rows: tiempoRow } = await pool.query<{ horas: string | null }>(
    `
    SELECT AVG(EXTRACT(EPOCH FROM (fecha_cierre - fecha_creacion)) / 3600)::text AS horas
    FROM incidencias i
    WHERE fecha_cierre IS NOT NULL ${filtroFecha}
    `,
    params,
  );

  const { rows: cargaAgente } = await pool.query<{
    agente_id: number;
    agente_nombre: string;
    abiertas: string;
    total: string;
  }>(
    `
    SELECT
      a.id AS agente_id,
      a.nombre AS agente_nombre,
      SUM(CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) NOT IN ('cerrada', 'cerrado', 'resuelta', 'resuelto') THEN 1 ELSE 0 END)::text AS abiertas,
      COUNT(*)::text AS total
    FROM incidencias i
    INNER JOIN usuarios a ON a.id = i.asignado_a
    WHERE i.asignado_a IS NOT NULL ${filtroFecha}
    GROUP BY a.id, a.nombre
    ORDER BY SUM(CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) NOT IN ('cerrada', 'cerrado', 'resuelta', 'resuelto') THEN 1 ELSE 0 END) DESC
    LIMIT 12
    `,
    params,
  );

  const porDepartamento: DeptIncidenciaStats[] = porDept.map((r) => ({
    departamento: r.departamento,
    total: Number(r.total),
    abiertas: Number(r.abiertas),
    en_curso: Number(r.en_curso),
    cerradas: Number(r.cerradas),
    otras: Number(r.otras),
  }));

  const porEstadoNorm: EstadoIncidenciaStats[] = porEstado.map((r) => ({
    estado: r.estado,
    total: Number(r.total),
  }));

  const horas = tiempoRow[0]?.horas ? Number(tiempoRow[0].horas) : null;

  const { rows: slaRows } = await pool.query<{
    con_limite: string;
    en_plazo: string;
    fuera_plazo: string;
  }>(
    `
    SELECT
      COUNT(*) FILTER (WHERE fecha_limite IS NOT NULL)::text AS con_limite,
      COUNT(*) FILTER (
        WHERE fecha_limite IS NOT NULL
          AND (
            (fecha_cierre IS NOT NULL AND fecha_cierre <= fecha_limite)
            OR (fecha_cierre IS NULL AND NOW() <= fecha_limite)
          )
      )::text AS en_plazo,
      COUNT(*) FILTER (
        WHERE fecha_limite IS NOT NULL
          AND (
            (fecha_cierre IS NOT NULL AND fecha_cierre > fecha_limite)
            OR (fecha_cierre IS NULL AND NOW() > fecha_limite)
          )
      )::text AS fuera_plazo
    FROM incidencias i
    WHERE 1=1 ${filtroFecha}
    `,
    params,
  );

  const { rows: creadasSem } = await pool.query<{ semana: string; n: string }>(
    `
    SELECT to_char(date_trunc('week', fecha_creacion), 'YYYY-MM-DD') AS semana, COUNT(*)::text AS n
    FROM incidencias i
    WHERE fecha_creacion >= date_trunc('week', NOW()) - interval '8 weeks' ${filtroFecha}
    GROUP BY 1
    ORDER BY 1
    `,
    params,
  );
  const { rows: cerradasSem } = await pool.query<{ semana: string; n: string }>(
    `
    SELECT to_char(date_trunc('week', fecha_cierre), 'YYYY-MM-DD') AS semana, COUNT(*)::text AS n
    FROM incidencias i
    WHERE fecha_cierre IS NOT NULL
      AND fecha_cierre >= date_trunc('week', NOW()) - interval '8 weeks' ${filtroFecha}
    GROUP BY 1
    ORDER BY 1
    `,
    params,
  );
  const mapC = new Map(creadasSem.map((r) => [r.semana, Number(r.n)]));
  const mapX = new Map(cerradasSem.map((r) => [r.semana, Number(r.n)]));
  const semanas = [...new Set([...mapC.keys(), ...mapX.keys()])].sort();
  const tendencia = semanas.map((semana) => ({
    semana,
    creadas: mapC.get(semana) ?? 0,
    cerradas: mapX.get(semana) ?? 0,
  }));

  const { rows: porEpicaRows } = await pool.query<{
    epica_id: number | null;
    epica_clave: string | null;
    epica_nombre: string | null;
    epica_color: string | null;
    total: string;
    abiertas: string;
    cerradas: string;
    con_limite: string;
    en_plazo: string;
    fuera_plazo: string;
  }>(
    `
    SELECT
      e.id AS epica_id,
      e.clave AS epica_clave,
      e.nombre AS epica_nombre,
      e.color AS epica_color,
      COUNT(*)::text AS total,
      SUM(
        CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) NOT IN ('cerrada', 'cerrado', 'resuelta', 'resuelto')
        THEN 1 ELSE 0 END
      )::text AS abiertas,
      SUM(
        CASE WHEN LOWER(TRIM(BOTH FROM i.estado)) IN ('cerrada', 'cerrado', 'resuelta', 'resuelto')
        THEN 1 ELSE 0 END
      )::text AS cerradas,
      COUNT(*) FILTER (WHERE i.fecha_limite IS NOT NULL)::text AS con_limite,
      COUNT(*) FILTER (
        WHERE i.fecha_limite IS NOT NULL
          AND (
            (i.fecha_cierre IS NOT NULL AND i.fecha_cierre <= i.fecha_limite)
            OR (i.fecha_cierre IS NULL AND NOW() <= i.fecha_limite)
          )
      )::text AS en_plazo,
      COUNT(*) FILTER (
        WHERE i.fecha_limite IS NOT NULL
          AND (
            (i.fecha_cierre IS NOT NULL AND i.fecha_cierre > i.fecha_limite)
            OR (i.fecha_cierre IS NULL AND NOW() > i.fecha_limite)
          )
      )::text AS fuera_plazo
    FROM incidencias i
    LEFT JOIN epicas e ON e.id = i.epica_id
    WHERE 1=1 ${filtroFecha}
    GROUP BY e.id, e.clave, e.nombre, e.color
    ORDER BY COUNT(*) DESC, COALESCE(e.nombre, 'zzz') ASC
    `,
    params,
  );

  const porEpica: EpicaIncidenciaStats[] = porEpicaRows.map((r) => {
    const conLimiteEp = Number(r.con_limite);
    const enPlazoEp = Number(r.en_plazo);
    return {
      epica_id: r.epica_id,
      epica_clave: r.epica_clave,
      epica_nombre: r.epica_nombre,
      epica_color: r.epica_color,
      total: Number(r.total),
      abiertas: Number(r.abiertas),
      cerradas: Number(r.cerradas),
      con_limite: conLimiteEp,
      en_plazo: enPlazoEp,
      fuera_plazo: Number(r.fuera_plazo),
      porcentaje_en_plazo:
        conLimiteEp > 0 ? Math.round((enPlazoEp / conLimiteEp) * 1000) / 10 : null,
    };
  });

  const sla = slaRows[0];
  const conLimite = Number(sla?.con_limite ?? 0);
  const enPlazo = Number(sla?.en_plazo ?? 0);

  return Response.json({
    porDepartamento,
    porEstado: porEstadoNorm,
    totalIncidencias: Number(totalRow[0]?.n ?? 0),
    tiempoMedioResolucionHoras: horas != null && Number.isFinite(horas) ? Math.round(horas * 10) / 10 : null,
    cargaPorAgente: cargaAgente.map((r) => ({
      agente_id: r.agente_id,
      agente_nombre: r.agente_nombre,
      abiertas: Number(r.abiertas),
      total: Number(r.total),
    })),
    sla: {
      con_limite: conLimite,
      en_plazo: enPlazo,
      fuera_plazo: Number(sla?.fuera_plazo ?? 0),
      porcentaje_en_plazo:
        conLimite > 0 ? Math.round((enPlazo / conLimite) * 1000) / 10 : null,
    },
    tendenciaSemanal: tendencia,
    porEpica,
  });
}
