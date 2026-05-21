import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend");

const env = { ...process.env };
delete env.VITE_AUTH_BASE_URL;

const r = spawnSync("npm", ["run", "build"], {
  cwd: frontend,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
