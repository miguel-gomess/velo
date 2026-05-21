/** URL pública del backend (Better Auth, cookies, CORS). */
export function resolveAuthBaseUrl(): string {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : undefined,
  ];
  for (const raw of candidates) {
    const v = raw?.trim();
    if (!v) continue;
    try {
      const u = v.startsWith("http") ? new URL(v) : new URL(`https://${v}`);
      return u.origin;
    } catch {
      continue;
    }
  }
  return "http://localhost:3000";
}
