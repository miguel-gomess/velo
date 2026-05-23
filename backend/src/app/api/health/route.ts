import { pool } from "@/lib/db";
import { getUploadRoot } from "@/lib/adjuntos";
import { access, mkdir } from "node:fs/promises";

export async function GET() {
  const checks: Record<string, string> = { api: "ok" };

  try {
    await pool.query("SELECT 1");
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    const uploadDir = getUploadRoot();
    await mkdir(uploadDir, { recursive: true });
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
