/**
 * Rate limiter en memoria con ventana fija. Suficiente para desarrollo y
 * despliegues de un único nodo. Para multi-instancia conviene mover el
 * estado a Redis (p.ej. @upstash/ratelimit).
 */

type Bucket = { count: number; resetAt: number };

const STORE = new Map<string, Bucket>();

function purge(now: number): void {
  if (STORE.size < 1024) return;
  for (const [k, v] of STORE) {
    if (v.resetAt <= now) STORE.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  purge(now);
  const existing = STORE.get(key);
  if (!existing || existing.resetAt <= now) {
    STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetMs: windowMs };
  }
  existing.count += 1;
  const resetMs = existing.resetAt - now;
  if (existing.count > max) {
    return { ok: false, remaining: 0, resetMs };
  }
  return { ok: true, remaining: Math.max(0, max - existing.count), resetMs };
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "anon";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

export function rateLimitResponse(reset: number): Response {
  return Response.json(
    { error: "Demasiadas peticiones. Inténtalo de nuevo en unos segundos." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(reset / 1000)),
      },
    },
  );
}
