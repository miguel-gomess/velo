import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { syncUsuarioEquiposDesdeDepartamento } from "@/lib/equipos";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";
import { ensureUsuariosColumnasOpcionales } from "@/lib/usuariosSchema";
import { crearUsuarioSchema, parseJson } from "@/lib/validate";
import { isAPIError } from "better-auth/api";

type UsuarioRow = {
  id: number;
  nombre: string;
  email: string;
  departamento: string | null;
  es_admin: boolean;
  fecha_creacion: string;
};

type PgError = { code?: string; constraint?: string; column?: string; message?: string };

async function emailEnUsuarios(email: string): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)) AS ok`,
    [email],
  );
  return Boolean(rows[0]?.ok);
}

async function emailEnBetterAuth(email: string): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM "user" WHERE LOWER(email) = LOWER($1)) AS ok`,
    [email],
  );
  return Boolean(rows[0]?.ok);
}

async function eliminarUsuarioAuth(email: string) {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  for (const { id } of rows) {
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
    await pool.query(`DELETE FROM account WHERE "userId" = $1`, [id]);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);
  }
}

async function insertarUsuarioYEquipos(
  nombre: string,
  email: string,
  departamento: string | null,
  esAdmin: boolean,
): Promise<UsuarioRow> {
  await ensureUsuariosColumnasOpcionales();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<UsuarioRow>(
      `
      INSERT INTO usuarios (nombre, email, departamento, es_admin, password)
      VALUES ($1, $2, $3, $4, NULL)
      RETURNING id, nombre, email, departamento, es_admin, fecha_creacion
    `,
      [nombre, email, departamento, esAdmin],
    );
    const inserted = rows[0];
    if (!inserted) throw new Error("No se pudo crear el usuario en el directorio");
    await client.query("COMMIT");
    // El sync de equipos hace su propio DELETE+INSERT idempotente; queda fuera
    // de la transacción para no extenderla con el lookup adicional.
    await syncUsuarioEquiposDesdeDepartamento(inserted.id, inserted.departamento);
    return inserted;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

function errorDesdePg(e: unknown): Response | null {
  const err = e as PgError;
  if (err.code === "23505") {
    if (err.constraint === "usuarios_email_key") {
      return Response.json(
        { error: "Ese email ya está registrado en el directorio" },
        { status: 409 },
      );
    }
    return Response.json({ error: "Ya existe un registro con esos datos" }, { status: 409 });
  }
  if (err.code === "23502") {
    const col = err.column ?? "";
    if (col === "password") {
      return Response.json(
        {
          error:
            "La base de datos aún exige contraseña en el directorio. Reinicia el backend o ejecuta: node scripts/ensure-mejoras.mjs",
        },
        { status: 500 },
      );
    }
    return Response.json(
      { error: "Faltan datos obligatorios en el formulario" },
      { status: 400 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0") || 0, 0);

  const where = q ? `WHERE nombre ILIKE $1 OR email ILIKE $1` : "";
  const values = q ? [`%${q}%`, limit, offset] : [limit, offset];
  const limitIndex = q ? 2 : 1;
  const offsetIndex = q ? 3 : 2;

  const { rows } = await pool.query<UsuarioRow>(
    `
    SELECT id, nombre, email, departamento, es_admin, fecha_creacion
    FROM usuarios
    ${where}
    ORDER BY id DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `,
    values,
  );

  return Response.json({ items: rows });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`users:create:${ip}`, 30, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.resetMs);

  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;

  const raw = await request.json().catch(() => null);
  if (raw === null) {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = parseJson(crearUsuarioSchema, raw);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { nombre, email, password, departamento: deptRaw, es_admin: esAdminFlag } = parsed.data;
  const departamentoRaw = (deptRaw ?? "").trim();
  const departamento = departamentoRaw ? departamentoRaw.toUpperCase() : null;
  const esAdmin = Boolean(esAdminFlag);

  if (await emailEnUsuarios(email)) {
    return Response.json(
      { error: "Ese email ya está registrado en el directorio" },
      { status: 409 },
    );
  }

  const yaEnAuth = await emailEnBetterAuth(email);

  try {
    if (!yaEnAuth) {
      await auth.api.signUpEmail({ body: { name: nombre, email, password } });
    }

    try {
      const item = await insertarUsuarioYEquipos(nombre, email, departamento, esAdmin);
      return Response.json({ item }, { status: 201 });
    } catch (e) {
      // Si la creación local falla y nosotros habíamos creado el usuario en
      // Better Auth, lo eliminamos para no dejar huérfanos.
      if (!yaEnAuth) {
        await eliminarUsuarioAuth(email).catch((cleanupErr) =>
          logger.error("Fallo limpiando usuario Better Auth", {
            email,
            error: (cleanupErr as Error).message,
          }),
        );
      }
      const pgErr = errorDesdePg(e);
      if (pgErr) return pgErr;
      logger.error("POST /api/users insert usuarios", {
        email,
        error: (e as Error).message,
      });
      return Response.json(
        { error: "No se pudo guardar el usuario en el directorio" },
        { status: 500 },
      );
    }
  } catch (e) {
    if (isAPIError(e)) {
      const msg = (e.message ?? "").toLowerCase();
      if (msg.includes("exist") || msg.includes("already")) {
        return Response.json(
          {
            error:
              "Ese email ya tiene cuenta de acceso. Si no aparece en el directorio, contacta con soporte para vincularlo.",
          },
          { status: 409 },
        );
      }
      return Response.json(
        { error: e.message },
        { status: typeof e.status === "number" ? e.status : 400 },
      );
    }

    const pgErr = errorDesdePg(e);
    if (pgErr) return pgErr;

    logger.error("POST /api/users", { email, error: (e as Error).message });
    return Response.json(
      { error: e instanceof Error ? e.message : "Error al crear usuario" },
      { status: 500 },
    );
  }
}
