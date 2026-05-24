/**
 * Captura pantallas reales con frontend+backend en marcha.
 * Uso: node scripts/capturar-pantallas-memoria.mjs
 */
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "docs/memoria/imagenes");
let BASE = "http://localhost:5173";

async function resolveBaseUrl() {
  if (process.env.VELO_BASE_URL) return process.env.VELO_BASE_URL.replace(/\/$/, "");
  for (const port of [5174, 5173]) {
    try {
      const r = await fetch(`http://localhost:${port}/login`, { signal: AbortSignal.timeout(2500) });
      if (r.ok) return `http://localhost:${port}`;
    } catch {
      /* siguiente puerto */
    }
  }
  return "http://localhost:5173";
}

const DEMO_PASS = process.env.VELO_DEMO_PASS ?? "DemoVelo2025!";
const DEMO_PASS_ALT = "demo123";
const ADMIN_PASS = process.env.VELO_ADMIN_PASS ?? "VeloAdmin2025!";
const ADMIN_PASS_ALT = "admin123";

const USERS = {
  empleado: { email: "ana@velo.com", passwords: [DEMO_PASS, DEMO_PASS_ALT] },
  agente: { email: "carlos@velo.com", passwords: [DEMO_PASS, DEMO_PASS_ALT] },
  admin: { email: "admin@velo.com", passwords: [ADMIN_PASS, ADMIN_PASS_ALT] },
};

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (r.ok || r.status < 500) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Servidor no disponible: ${url}`);
}

async function login(page, { email, passwords }) {
  let lastErr = "";
  for (const password of passwords) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.locator("#email, input[type=email], input[name=email]").first().fill(email);
    await page.locator("#password, input[type=password]").first().fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();
    try {
      await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
      await page.waitForTimeout(1500);
      console.log(`Login OK ${email}`);
      return;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`No se pudo iniciar sesión como ${email}: ${lastErr}`);
}

async function clickTab(page, name) {
  const re = new RegExp(name, "i");
  const tab = page.getByRole("tab", { name: re });
  if (await tab.count()) {
    await tab.first().click();
    await page.waitForTimeout(1800);
    return true;
  }
  const btn = page.getByRole("button", { name: re });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(1800);
    return true;
  }
  console.warn(`Aviso: pestaña «${name}» no encontrada`);
  return false;
}

async function capturarVistasPlanificacion(page) {
  if (await clickTab(page, "roadmap")) {
    await shot(page, "14-roadmap-epicas.png", null);
  }
  if (await clickTab(page, "cronograma")) {
    await shot(page, "15-cronograma-gantt.png", null);
  }
  if (await clickTab(page, "calendario")) {
    await shot(page, "16-calendario-plazos.png", null);
  }
}

async function shot(page, name, url, opts = {}) {
  if (url) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(opts.wait ?? 2000);
  }
  const path = resolve(OUT, name);
  await page.screenshot({ path, fullPage: opts.fullPage ?? false });
  console.log("OK", name);
}

async function main() {
  BASE = await resolveBaseUrl();
  console.log("Frontend:", BASE);

  const { spawnSync } = await import("node:child_process");
  const prep = spawnSync("node", ["scripts/prepare-memoria-capturas.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (prep.status !== 0) {
    console.warn("Aviso: prepare-memoria-capturas falló; capturas pueden incompletas.");
  }

  const { chromium } = await import("playwright");
  await mkdir(OUT, { recursive: true });

  await waitForServer(`${BASE}/login`);
  await waitForServer("http://localhost:3000/api/health").catch(() =>
    waitForServer("http://localhost:3000"),
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "es-ES",
  });
  const page = await context.newPage();

  await shot(page, "10-login.png", `${BASE}/login`);

  await login(page, USERS.empleado);
  await shot(page, "06-portal-inicio.png", `${BASE}/portal`);

  const verTodas = page.getByRole("button", { name: /ver todas/i });
  if (await verTodas.count()) {
    await verTodas.first().click();
  } else {
    await page.getByText("Mis solicitudes").first().click();
  }
  await page.waitForTimeout(1500);
  await shot(page, "11-portal-mis-solicitudes.png", null);

  const nuevaBtn = page.getByRole("button", { name: /nueva solicitud/i });
  await nuevaBtn.first().click();
  await page.waitForTimeout(1500);
  await shot(page, "12-portal-nueva-solicitud.png", null);

  await context.clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await login(page, USERS.agente);
  await shot(page, "07-workspace-kanban.png", `${BASE}/workspace`);
  await capturarVistasPlanificacion(page);

  await context.clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await login(page, USERS.admin);
  await shot(page, "08-dashboard-admin.png", `${BASE}/dashboard/incidencias`);
  await capturarVistasPlanificacion(page);
  await shot(page, "13-dashboard-analisis.png", `${BASE}/dashboard/analisis`);
  await shot(page, "09-configuracion-equipos.png", `${BASE}/dashboard/config`);
  const epicasHeading = page.getByRole("heading", { name: /épicas de roadmap/i });
  if (await epicasHeading.count()) {
    await epicasHeading.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot(page, "09-configuracion-equipos.png", null);
  }

  await browser.close();
  console.log("Capturas en", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
