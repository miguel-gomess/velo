import { z } from "zod";
import { PRIORIDADES_VALIDAS } from "./prioridades";

export const crearIncidenciaSchema = z.object({
  titulo: z.string().trim().min(1).max(280),
  descripcion: z.string().trim().min(1).max(8000),
  equipo_codigo: z.string().trim().max(64).nullable().optional(),
  prioridad: z.enum(PRIORIDADES_VALIDAS).optional(),
});

export const patchIncidenciaSchema = z
  .object({
    estado: z.enum(["abierta", "en_curso", "en_revision", "cerrada"]).optional(),
    prioridad: z.enum(PRIORIDADES_VALIDAS).optional(),
    asignado_a: z.number().int().positive().nullable().optional(),
    descripcion: z.string().trim().min(1).max(8000).optional(),
    motivo_cierre: z.enum(["resuelta", "rechazada", "duplicada"]).optional(),
    resolucion: z.string().trim().max(8000).optional(),
    fecha_limite: z.string().datetime().nullable().optional(),
  })
  .strict();

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  departamento: z
    .union([z.string().trim().max(64), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : v)),
  es_admin: z.boolean().optional(),
});

export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120).optional(),
    departamento: z.string().trim().max(64).nullable().optional(),
    es_admin: z.boolean().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .strict()
  .refine(
    (val) =>
      val.nombre !== undefined ||
      val.departamento !== undefined ||
      val.es_admin !== undefined ||
      val.password !== undefined,
    { message: "Nada que actualizar" },
  );

export const mensajeSchema = z.object({
  contenido: z.string().trim().max(4000).optional(),
  es_interno: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional(),
});

export function parseJson<T>(
  schema: z.ZodType<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues.map((i) => i.message).join("; ") || "Datos inválidos";
    return { ok: false, error: msg };
  }
  return { ok: true, data: r.data };
}
