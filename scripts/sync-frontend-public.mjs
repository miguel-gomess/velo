/**
 * Copia el build de Vite (frontend/dist) a backend/public para servir la SPA
 * desde el mismo origen que la API en producción (Vercel).
 */
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "frontend", "dist");
const publicDir = path.join(root, "backend", "public");

try {
  await stat(dist);
} catch {
  console.error(
    "No existe frontend/dist. Ejecuta antes: npm run build --prefix frontend",
  );
  process.exit(1);
}

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
await cp(dist, publicDir, { recursive: true });

console.log("SPA copiada a backend/public");
