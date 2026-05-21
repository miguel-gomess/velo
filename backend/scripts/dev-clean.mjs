import { rmSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3000;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function freePort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: "utf8",
      windowsHide: true,
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { windowsHide: true });
        console.log(`Puerto ${port}: proceso ${pid} detenido.`);
      } catch {
        /* ya cerrado */
      }
    }
  } catch {
    /* puerto libre */
  }
}

try {
  rmSync(resolve(root, ".next"), { recursive: true, force: true });
  console.log("Caché .next eliminada.");
} catch {
  console.log("Sin caché .next previa.");
}

freePort(PORT);

const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "--webpack", "-p", String(PORT)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
