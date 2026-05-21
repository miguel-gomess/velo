import { pool } from "@/lib/db";

let asegurado = false;

/** Alinea el esquema legacy: departamento y password opcionales en `usuarios`. */
export async function ensureUsuariosColumnasOpcionales(): Promise<void> {
  if (asegurado) return;

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuarios'
          AND column_name = 'password'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuarios'
          AND column_name = 'departamento'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE usuarios ALTER COLUMN departamento DROP NOT NULL;
      END IF;
    END $$;
  `);

  asegurado = true;
}
