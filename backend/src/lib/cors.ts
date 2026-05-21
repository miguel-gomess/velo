const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

let cached: Set<string> | null = null;

function originFromEnvUrl(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  try {
    const u = v.startsWith("http") ? new URL(v) : new URL(`https://${v}`);
    return u.origin;
  } catch {
    return null;
  }
}

function buildAllowed(): Set<string> {
  const set = new Set(DEFAULT_ORIGINS);

  const extra = process.env.ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const o of extra.split(",")) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }

  const authOrigin = originFromEnvUrl(process.env.BETTER_AUTH_URL);
  if (authOrigin) set.add(authOrigin);

  const vercelOrigin = originFromEnvUrl(process.env.VERCEL_URL);
  if (vercelOrigin) set.add(vercelOrigin);

  const prodOrigin = originFromEnvUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (prodOrigin) set.add(prodOrigin);

  return set;
}

export function getAllowedOrigins(): Set<string> {
  if (cached) return cached;
  cached = buildAllowed();
  return cached;
}

/** Devuelve la lista como array (necesario para Better Auth trustedOrigins). */
export function getAllowedOriginsList(): string[] {
  return [...getAllowedOrigins()];
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Cookie, Set-Cookie, better-auth-agent, X-Requested-With",
    "Access-Control-Expose-Headers": "Set-Cookie",
    "Vary": "Origin",
  };
}
