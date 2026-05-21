import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const { GET: betterAuthGet, POST: betterAuthPost } = toNextJsHandler(auth);

export const GET = betterAuthGet;

/**
 * Limita intentos contra endpoints de autenticación (signin, signup, etc.)
 * para mitigar fuerza bruta y credential stuffing. Ventana fija por IP
 * más una segunda capa por email cuando llega en el body.
 */
export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request);
  const path = new URL(request.url).pathname;
  const isSignIn = path.includes("/sign-in");
  const isSignUp = path.includes("/sign-up");

  if (isSignIn || isSignUp) {
    const max = Number(process.env.AUTH_RL_MAX ?? 8);
    const windowMs = Number(process.env.AUTH_RL_WINDOW_MS ?? 15 * 60_000);
    const limited = rateLimit(`auth:${ip}:${isSignIn ? "in" : "up"}`, max, windowMs);
    if (!limited.ok) return rateLimitResponse(limited.resetMs);

    // Capa adicional por email: clona la request para no consumir el body original
    try {
      const cloned = request.clone();
      const body = (await cloned.json().catch(() => null)) as
        | { email?: string }
        | null;
      const email = body?.email?.trim().toLowerCase();
      if (email) {
        const limitedEmail = rateLimit(
          `auth:${email}:${isSignIn ? "in" : "up"}`,
          max,
          windowMs,
        );
        if (!limitedEmail.ok) return rateLimitResponse(limitedEmail.resetMs);
      }
    } catch {
      /* sin body o no-JSON, dejamos pasar */
    }
  }

  return betterAuthPost(request);
}
