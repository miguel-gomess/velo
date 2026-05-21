/**
 * Logger mínimo estructurado para servidor. Evita el ruido de console.log directo
 * y deja un punto único para enchufar pino/sentry más adelante.
 */

type LogLevel = "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 };

const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "info";

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
