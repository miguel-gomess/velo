import { pool } from "@/lib/db";
import { access } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const checks: Record<string, string> = { api: "ok" };

  try {
    await pool.query("SELECT 1");
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    const uploadDir = path.join(process.cwd(), "uploads", "incidencias");
    await access(uploadDir);
    checks.uploads = "ok";
  } catch {
    checks.uploads = "missing";
  }

  const ok = checks.database === "ok";
  return Response.json(
    { status: ok ? "healthy" : "degraded", checks },
    { status: ok ? 200 : 503 },
  );
}
