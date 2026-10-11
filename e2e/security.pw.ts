import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const data = {
  accessToken: "token-de-prueba",
  user: {
    id: 1,
    name: "Cuenta de prueba",
    email: "cuenta@example.test",
    roles: ["ADMINISTRADOR"],
  },
};
const catalogs = Object.fromEntries(
  [
    "establishmentActivities",
    "establishmentClassifications",
    "establishmentCategories",
    "categories",
    "types",
    "subtypes",
    "provinces",
    "cantons",
    "parishes",
    "localities",
    "zones",
    "lines",
    "scenarios",
    "hierarchies",
    "climates",
    "incomeTypes",
    "attentionModes",
    "accessibilityTypes",
    "accessibilityCriteria",
    "conditionStates",
    "roadTypes",
    "roadMaterials",
    "aquaticAccessModes",
    "aerialAccessCoverages",
    "transportTypes",
    "serviceFrequencies",
    "serviceScopes",
    "conservationStates",
    "conservationFactors",
    "basicServiceCategories",
    "basicServiceTypes",
    "signageTypes",
    "signageMaterials",
    "healthServiceTypes",
    "securityServiceTypes",
    "communicationTypes",
    "threatTypes",
    "policyQuestions",
    "promotionMediaTypes",
    "trainingTypes",
    "responsibilityTypes",
    "months",
    "plantTypes",
    "complementaryServiceTypes",
    "activityGroups",
    "activities",
    "facilityCategories",
    "facilities",
  ].map((key) => [key, []]),
);
async function mockApi(context: BrowserContext, initial = false) {
  const state = { authenticated: initial, failLogout: false, refreshes: 0, logouts: 0 };
  await context.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4317",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "authorization,content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    let body: unknown = { data: { items: [], total: 0, limit: 20, offset: 0 } },
      status = 200;
    if (path.endsWith("/auth/login")) {
      state.authenticated = true;
      body = { data };
    } else if (path.endsWith("/auth/refresh")) {
      state.refreshes++;
      status = state.authenticated ? 200 : 401;
      body = state.authenticated ? { data } : { error: { message: "Sin sesión." } };
    } else if (path.endsWith("/auth/logout")) {
      state.logouts++;
      if (state.failLogout) {
        status = 503;
        body = { error: { message: "Sin conexión." } };
      } else {
        state.authenticated = false;
        body = { data: { loggedOut: true } };
      }
    } else if (path.endsWith("/admin/catalogs")) body = { data: catalogs };
    else if (path.endsWith("/admin/summary"))
      body = {
        data: {
          total: 0,
          active: 0,
          pendingReview: 0,
          published: 0,
          inactive: 0,
          byStatus: [],
        },
      };
    else if (path.endsWith("/admin/navigation-summary"))
      body = {
        data: Object.fromEntries(
          ["review", "opinions", "centers", "establishments", "catalogs"].map((key) => [
            key,
            { pending: 0, latestChange: null },
          ]),
        ),
      };
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return state;
}
async function login(page: Page) {
  await page.getByLabel("Correo institucional").fill("cuenta@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("contraseña-de-prueba");
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.getByRole("button", { name: "Abrir perfil" }).last()).toBeVisible();
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Abrir perfil" }).last().click();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
}

test("CSP de producción: hidrata MUI, usa nonces únicos y bloquea un script inyectado", async ({
  page,
  context,
}) => {
  await mockApi(context);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Inyección en el HTML recibido: el script no lleva el nonce del servidor.
  await page.route("**/admin", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    await route.fulfill({
      response,
      body: body.replace(
        "</body>",
        "<script>document.documentElement.dataset.injected='yes'</script></body>",
      ),
    });
  });
  const response = await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
  const headers = response!.headers();
  const nonce = headers["content-security-policy"].match(/'nonce-([^']+)'/)![1];
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  expect(headers["x-powered-by"]).toBeUndefined();
  expect(
    await page
      .locator("script")
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLScriptElement).nonce)),
  ).toEqual(expect.arrayContaining([nonce]));
  expect(
    await page
      .locator("style[data-emotion]")
      .evaluateAll(
        (nodes, expectedNonce) =>
          nodes.every((node) => (node as HTMLStyleElement).nonce === expectedNonce),
        nonce,
      ),
  ).toBe(true);
  await login(page);
  expect(errors).toEqual([]);
  expect(
    await page
      .getByRole("button", { name: "Abrir perfil" })
      .last()
      .evaluate((node) => getComputedStyle(node).display),
  ).not.toBe("inline");
  await expect(page.locator("html")).not.toHaveAttribute("data-injected", "yes");
  const next = await page.reload();
  expect(next!.headers()["content-security-policy"]).not.toContain(`'nonce-${nonce}'`);
  await expect(page.locator("html")).not.toHaveAttribute("data-injected", "yes");
});

test("el cierre se comunica a otra pestaña y permanece después de recargar", async ({
  page,
  context,
}) => {
  const state = await mockApi(context);
  await page.goto("/admin");
  await login(page);
  const second = await context.newPage();
  await second.goto("/admin");
  await expect(second.getByRole("button", { name: "Abrir perfil" }).last()).toBeVisible();
  await logout(page);
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
  await expect(
    second.getByRole("heading", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
  const before = state.refreshes;
  await second.reload();
  await expect(
    second.getByRole("heading", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
  expect(state.refreshes).toBe(before);
  expect(
    await page.evaluate(() => localStorage.getItem("turismo-admin-session-status")),
  ).toBe("logged-out");
});

test("un cierre fallido exige revocación y no restaura la sesión al recargar", async ({
  page,
  context,
}) => {
  const state = await mockApi(context, true);
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Abrir perfil" }).last()).toBeVisible();
  state.failLogout = true;
  await logout(page);
  await expect(
    page.getByRole("alert").filter({ hasText: "no se pudo revocar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión", exact: true }),
  ).toBeDisabled();
  const before = state.refreshes;
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "no se pudo revocar" }),
  ).toBeVisible();
  expect(state.refreshes).toBe(before);
  state.failLogout = false;
  await page
    .getByRole("button", { name: "Reintentar cierre de sesión", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión", exact: true }),
  ).toBeEnabled();
  expect(state.authenticated).toBe(false);
});

test("el mapa funciona con CSP y solicita GPS únicamente al pulsar", async ({
  page,
  context,
}) => {
  await mockApi(context, true);
  await context.route("**/styles/**/style.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#e4eee8" },
          },
        ],
      }),
    }),
  );
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      document.documentElement.dataset.cspViolation = event.violatedDirective;
    });
    Object.defineProperty(navigator, "geolocation", {
      value: {
        watchPosition: (success: PositionCallback) => {
          document.documentElement.dataset.gpsRequested = "yes";
          setTimeout(
            () =>
              success({
                timestamp: Date.now(),
                coords: { latitude: -1.59, longitude: -79.0, accuracy: 10 },
              } as GeolocationPosition),
            10,
          );
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
  });
  await page.goto("/admin?section=centers");
  await page.getByRole("button", { name: "Nueva ficha", exact: true }).click();
  await page.getByRole("button", { name: /Sección \d+: Ubicación/ }).click();
  await page
    .getByRole("button", { name: "Seleccionar coordenadas en el mapa", exact: true })
    .click();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-gps-requested", "yes");
  await page
    .getByRole("button", { name: "Ubicación del dispositivo", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-gps-requested", "yes");
  await expect(
    page.getByRole("button", { name: "Usar esta ubicación", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Usar esta ubicación", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-csp-violation");
});
