import { pool } from "@/lib/db";

export type Epica = {
  id: number;
  clave: string;
  nombre: string;
  color: string;
  activa: boolean;
};

export async function listEpicasActivas(): Promise<Epica[]> {
  const { rows } = await pool.query<Epica>(
    `
    SELECT id, clave, nombre, color, activa
    FROM epicas
    WHERE activa
    ORDER BY nombre ASC
  `,
  );
  return rows;
}

export async function epicaActivaExiste(id: number): Promise<boolean> {
  const { rows } = await pool.query<{ ok: number }>(
    `SELECT 1 AS ok FROM epicas WHERE id = $1 AND activa LIMIT 1`,
    [id],
  );
  return Boolean(rows[0]);
}

export async function labelEpicaPorId(id: number | null): Promise<string> {
  if (id == null) return "Sin épica";
  const { rows } = await pool.query<{ nombre: string }>(
    `SELECT nombre FROM epicas WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0]?.nombre ?? `#${id}`;
}

export async function listEpicasTodas(): Promise<Epica[]> {
  const { rows } = await pool.query<Epica>(
    `
    SELECT id, clave, nombre, color, activa
    FROM epicas
    ORDER BY activa DESC, nombre ASC
  `,
  );
  return rows;
}

export async function crearEpica(input: {
  clave: string;
  nombre: string;
  color?: string;
}): Promise<Epica> {
  const { rows } = await pool.query<Epica>(
    `
    INSERT INTO epicas (clave, nombre, color)
    VALUES ($1, $2, $3)
    RETURNING id, clave, nombre, color, activa
  `,
    [input.clave.toUpperCase(), input.nombre, input.color ?? "#6366f1"],
  );
  const row = rows[0];
  if (!row) throw new Error("No se pudo crear la épica");
  return row;
}

export async function actualizarEpica(
  id: number,
  input: Partial<{ clave: string; nombre: string; color: string; activa: boolean }>,
): Promise<Epica | null> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  if (input.clave !== undefined) {
    params.push(input.clave.toUpperCase());
    sets.push(`clave = $${params.length}`);
  }
  if (input.nombre !== undefined) {
    params.push(input.nombre);
    sets.push(`nombre = $${params.length}`);
  }
  if (input.color !== undefined) {
    params.push(input.color);
    sets.push(`color = $${params.length}`);
  }
  if (input.activa !== undefined) {
    params.push(input.activa);
    sets.push(`activa = $${params.length}`);
  }
  if (!sets.length) return null;
  const { rows } = await pool.query<Epica>(
    `
    UPDATE epicas SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING id, clave, nombre, color, activa
  `,
    params,
  );
  return rows[0] ?? null;
}
