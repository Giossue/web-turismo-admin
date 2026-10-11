import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";
import { proxy } from "@/proxy";

const options = {
  nonce: "abcdefghijklmnopqrstuw==",
  apiUrl: "https://api.example.test/api/v1",
  mapStyleUrl: "https://maps.example.test/style.json",
};
describe("cabeceras de seguridad", () => {
  test("la CSP limita orígenes y bloquea scripts inline, evaluación y marcos", () => {
    const csp = contentSecurityPolicy({ ...options, https: true });
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain(
      "connect-src 'self' https://api.example.test https://maps.example.test",
    );
    expect(csp.split(";").find((v) => v.trim().startsWith("script-src"))).not.toContain(
      "unsafe-",
    );
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).toContain("upgrade-insecure-requests");
  });
  test("solo desarrollo permite eval y los websockets de recarga", () => {
    const csp = contentSecurityPolicy({ ...options, development: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws: wss:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
  test("rechaza configuraciones con credenciales o protocolos ejecutables", () => {
    expect(() =>
      contentSecurityPolicy({ ...options, apiUrl: "javascript:alert(1)" }),
    ).toThrow();
    expect(() =>
      contentSecurityPolicy({
        ...options,
        apiUrl: "https://usuario:secreto@example.test",
      }),
    ).toThrow();
    expect(() =>
      contentSecurityPolicy({ ...options, nonce: "inject; script-src *" }),
    ).toThrow();
  });
  test("el nonce cambia en cada respuesta y reemplaza el encabezado del cliente", () => {
    const request = new NextRequest("https://admin.example.test/admin", {
      headers: { "x-nonce": "valor-atacante" },
    });
    const a = proxy(request),
      b = proxy(request);
    expect(a.headers.get("content-security-policy")).not.toBe(
      b.headers.get("content-security-policy"),
    );
    expect(a.headers.get("content-security-policy")).not.toContain("valor-atacante");
    expect(a.headers.get("x-middleware-request-x-nonce")).toMatch(
      /^[A-Za-z0-9+/]{22}==$/,
    );
    expect(a.headers.get("cache-control")).toBe("private, no-store");
  });
  test("protege tipos, referrer, marcos y GPS sin impedir el permiso explícito", () => {
    expect(securityHeaders(true)).toMatchObject({
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Strict-Transport-Security": "max-age=31536000",
    });
    expect(securityHeaders(true)["Permissions-Policy"]).toContain("geolocation=(self)");
    expect(securityHeaders(false)).not.toHaveProperty("Strict-Transport-Security");
  });
});
