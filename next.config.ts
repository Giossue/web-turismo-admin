import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "/api/admin/ficha/import": ["./.runtime/ficha-import.cjs"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: Object.entries(
          securityHeaders(process.env.NODE_ENV === "production"),
        ).map(([key, value]) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
