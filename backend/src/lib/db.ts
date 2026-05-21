import { Pool, type PoolConfig } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __veloPgPool: Pool | undefined;
}

function buildConfig(): PoolConfig {
  const config: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30_000),
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS ?? 5_000),
  };
  if (process.env.DATABASE_SSL === "true") {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

export const pool = globalThis.__veloPgPool ?? new Pool(buildConfig());

if (process.env.NODE_ENV !== "production") {
  globalThis.__veloPgPool = pool;
}
