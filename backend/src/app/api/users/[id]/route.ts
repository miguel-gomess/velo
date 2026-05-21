import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { syncUsuarioEquiposDesdeDepartamento } from "@/lib/equipos";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";
import { actualizarUsuarioSchema, parseJson } from "@/lib/validate";
import { isAPIError } from "better-auth/api";

type UsuarioRow = {
  id: number;
  nombre: string;
  email: string;
  departamento: string | null;
  es_admin: boolean;
  fecha_creacion: string;
};

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const raw = await request.json().catch(() => null);
  if (raw === null) {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = parseJson(actualizarUsuarioSchema, raw);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;
  const nombre = body.nombre;
  const departamento =
    body.departamento === undefined
      ? undefined
      : body.departamento === null || body.departamento.trim() === ""
        ? null
        : body.departamento.trim().toUpperCase();
  const esAdmin = body.es_admin;
  const passwordPlain = body.password ?? "";
  const hasPassword = passwordPlain.length > 0;

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (nombre) {
    sets.push(`nombre = $${i++}`);
    values.push(nombre);
  }
  if (departamento !== undefined) {
    sets.push(`departamento = $${i++}`);
    values.push(departamento);
  }
  if (esAdmin !== undefined) {
    sets.push(`es_admin = $${i++}`);
    values.push(esAdmin);
  }

  // Importante: la contraseña vive solo en las tablas de Better Auth.
  // Ya no escribimos en usuarios.password.
  values.push(id);

  let rows: UsuarioRow[] = [];
  if (sets.length > 0) {
    const result = await pool.query<UsuarioRow>(
      `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${i}
       RETURNING id, nombre, email, departamento, es_admin, fecha_creacion`,
      values,
    );
    rows = result.rows;
  } else {
    const result = await pool.query<UsuarioRow>(
      `SELECT id, nombre, email, departamento, es_admin, fecha_creacion FROM usuarios WHERE id = $1`,
      [id],
    );
    rows = result.rows;
  }

  if (!rows[0]) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  const actualizado = rows[0];

  if (departamento !== undefined) {
    await syncUsuarioEquiposDesdeDepartamento(actualizado.id, actualizado.departamento);
  }

  if (nombre) {
    await pool
      .query(`UPDATE "user" SET name = $1 WHERE email = $2`, [nombre, actualizado.email])
      .catch((e) =>
        logger.warn("No se pudo sincronizar name en Better Auth", {
          email: actualizado.email,
          error: (e as Error).message,
        }),
      );
  }

  if (hasPassword) {
    try {
      const ctx = await auth.$context;
      const authHash = await ctx.password.hash(passwordPlain);
      const { rows: baUsers } = await pool.query<{ id: string }>(
        `SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)`,
        [actualizado.email],
      );
      const baId = baUsers[0]?.id;
      if (baId) {
        await ctx.internalAdapter.updatePassword(baId, authHash);
        await ctx.internalAdapter.deleteSessions(baId);
      }
    } catch (err) {
      if (isAPIError(err)) {
        return Response.json(
          { error: err.message },
          { status: typeof err.status === "number" ? err.status : 400 },
        );
      }
      throw err;
    }
  }

  return Response.json({ item: actualizado });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ email: string }>(
      `DELETE FROM usuarios WHERE id = $1 RETURNING email`,
      [id],
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }

    const email = rows[0].email;
    await client.query(
      `DELETE FROM session WHERE "userId" IN (SELECT id FROM "user" WHERE email = $1)`,
      [email],
    );
    await client.query(
      `DELETE FROM account WHERE "userId" IN (SELECT id FROM "user" WHERE email = $1)`,
      [email],
    );
    await client.query(`DELETE FROM "user" WHERE email = $1`, [email]);

    await client.query("COMMIT");
    return Response.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error("DELETE /api/users/[id]", { id, error: (e as Error).message });
    return Response.json({ error: "Error eliminando" }, { status: 500 });
  } finally {
    client.release();
  }
}
