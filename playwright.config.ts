import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.pw.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4317",
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node scripts/security-test-api.mjs",
      url: "http://127.0.0.1:4318/health",
      reuseExistingServer: false,
      timeout: 10_000,
    },
    {
      command: "PORT=4317 HOSTNAME=127.0.0.1 node .next/standalone/server.js",
      url: "http://127.0.0.1:4317/admin",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { TURISMO_API_URL: "http://127.0.0.1:4318/api/v1" },
    },
  ],
});
