import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const shell = process.platform === "win32";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell,
    ...opts,
  });
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);
}

run("node", ["scripts/build-frontend-production.mjs"]);
run("node", ["scripts/sync-frontend-public.mjs"]);
run("npm", ["run", "build", "--prefix", "backend"]);
