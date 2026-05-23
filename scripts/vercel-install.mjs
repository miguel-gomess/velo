import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

function findMonorepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 6; i++) {
    const hasFrontend = fs.existsSync(path.join(dir, "frontend", "package.json"));
    const hasBackend = fs.existsSync(path.join(dir, "backend", "package.json"));
    if (hasFrontend && hasBackend) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const root =
  findMonorepoRoot(process.cwd()) ??
  findMonorepoRoot(scriptsDir);

if (!root) {
  console.error(
    [
      "ERROR: No se encuentra frontend/ del monorepo durante el build.",
      "",
      "En Vercel → proyecto → Settings → Build and Deployment:",
      "  1. Root Directory = backend",
      "  2. Activa «Include files outside of the Root Directory in the Build Step»",
      "",
      "O usa el proyecto «velo» con la raíz del repo (Root Directory vacío) y vercel.json en la raíz.",
      "",
      "Si el log muestra ~94 archivos, el deploy no incluye el monorepo completo.",
    ].join("\n"),
  );
  process.exit(1);
}

const shell = process.platform === "win32";

function run(label, args) {
  console.log(`> npm ${args.join(" ")}  (${label})`);
  const r = spawnSync("npm", args, { cwd: root, stdio: "inherit", shell });
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);
}

run("backend", ["install", "--prefix", "backend"]);
run("frontend", ["install", "--prefix", "frontend"]);
