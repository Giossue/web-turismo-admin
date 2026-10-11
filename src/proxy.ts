import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicApiUrl } from "./lib/config";
import { contentSecurityPolicy, DEFAULT_MAP_STYLE_URL } from "./lib/security-headers";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = contentSecurityPolicy({
    nonce,
    apiUrl: publicApiUrl,
    mapStyleUrl: process.env.NEXT_PUBLIC_TILESERVER_STYLE_URL || DEFAULT_MAP_STYLE_URL,
    development: process.env.NODE_ENV === "development",
    https: request.nextUrl.protocol === "https:",
  });
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!api/|_next/static/|_next/image|favicon.ico|robots.txt|maplibre/|templates/).*)",
  ],
};
