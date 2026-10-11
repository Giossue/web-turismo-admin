export const DEFAULT_MAP_STYLE_URL =
  "https://maps.devs-ueb.tech/styles/basic-preview/style.json";

export function securityHeaders(production: boolean): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy":
      "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
    ...(production ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
  };
}
function origin(value: string): string {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password)
    throw new Error("La URL configurada debe usar HTTP(S) sin credenciales.");
  return url.origin;
}
export function contentSecurityPolicy({
  nonce,
  apiUrl,
  mapStyleUrl,
  development = false,
  https = false,
}: {
  nonce: string;
  apiUrl: string;
  mapStyleUrl: string;
  development?: boolean;
  https?: boolean;
}): string {
  if (!/^[A-Za-z0-9+/]{22}==$/.test(nonce)) throw new Error("Nonce inválido.");
  const recursos = [...new Set([origin(apiUrl), origin(mapStyleUrl)])].join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `connect-src 'self' ${recursos}${development ? " ws: wss:" : ""}`,
    `img-src 'self' data: blob: ${recursos}`,
    `media-src 'self' blob: ${origin(apiUrl)}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    ...(https && !development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
