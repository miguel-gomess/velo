import { NextResponse } from "next/server";

export function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function forwardAuthCookies(baRes: Response, response: NextResponse): NextResponse {
  const setCookies =
    typeof baRes.headers.getSetCookie === "function" ? baRes.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      response.headers.append("Set-Cookie", cookie);
    }
  } else {
    const single = baRes.headers.get("set-cookie");
    if (single) response.headers.append("Set-Cookie", single);
  }
  return response;
}
