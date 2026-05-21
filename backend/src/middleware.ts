import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders, getAllowedOrigins } from "@/lib/cors";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
};

function applySecurityHeaders(headers: Headers): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins().has(origin);

  if (request.method === "OPTIONS" && allowed) {
    const headers = new Headers(corsHeaders(origin));
    applySecurityHeaders(headers);
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();

  if (allowed) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  applySecurityHeaders(response.headers);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
