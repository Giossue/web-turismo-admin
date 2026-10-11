import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import type { AdminCenter } from "../src/lib/admin-api";

function center(code: string, name: string): AdminCenter {
  return {
    code,
    name,
    status: { code: "BORRADOR", name: "Borrador" },
    updatedAt: "2026-10-10T12:00:00Z",
    submittedAt: null,
    requestedBy: null,
    observation: null,
    active: true,
  };
}

async function mockApi(context: BrowserContext) {
  let nextRead: { started: () => void; gate: Promise<void> } | null = null;
  const state = {
    name: "Centro original",
    reads: [] as string[],
    holdNextRead() {
      let started!: () => void;
      let release!: () => void;
      const ready = new Promise<void>((resolve) => {
        started = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      nextRead = { started, gate };
      return { ready, release };
    },
  };
  await context.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const headers = {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4317",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "authorization,content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    let data: unknown = { items: [], total: 0, limit: 20, offset: 0 };
    if (url.pathname.endsWith("/auth/refresh")) {
      data = {
        accessToken: "token-de-prueba",
        user: {
          id: 1,
          name: "Administradora",
          email: "admin@example.test",
          roles: ["ADMINISTRADOR"],
        },
      };
    } else if (url.pathname.endsWith("/admin/navigation-summary")) {
      data = Object.fromEntries(
        ["review", "opinions", "centers", "establishments", "catalogs"].map((key) => [
          key,
          { pending: 0, latestChange: null },
        ]),
      );
    } else if (url.pathname.endsWith("/admin/centers")) {
      state.reads.push(url.search);
      const held = nextRead;
      nextRead = null;
      if (held) {
        held.started();
        await held.gate;
      }
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const q = url.searchParams.get("q");
      data = {
        items: [
          center(
            offset > 0 ? "EC002" : "EC001",
            state.name !== "Centro original"
              ? state.name
              : q
                ? "Centro filtrado"
                : offset > 0
                  ? "Centro página dos"
                  : state.name,
          ),
        ],
        total: 40,
        limit: 20,
        offset,
      };
    }
    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });
  return state;
}

async function openCenters(page: Page) {
  await page.goto("/admin?section=centers");
  await expect(
    page.getByRole("button", { name: "Acciones de Centro original" }),
  ).toBeEnabled();
}

for (const mobile of [false, true]) {
  test(`${mobile ? "móvil" : "escritorio"}: conserva filas y bloquea acciones al cambiar filtro`, async ({
    page,
    context,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const state = await mockApi(context);
    await openCenters(page);
    const held = state.holdNextRead();
    try {
      await page
        .getByRole("textbox", { name: "Buscar por nombre o código" })
        .fill("laguna");
      await held.ready;
      await expect(
        page.getByRole("status").filter({ hasText: "Actualizando datos" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Acciones de Centro original" }),
      ).toBeDisabled();
      if (mobile) {
        await expect(
          page.getByRole("button", { name: "Editar ficha", exact: true }),
        ).toBeDisabled();
        await expect(
          page.getByText("1–20 de 40", { exact: true }).filter({ visible: true }),
        ).toBeVisible();
      }
    } finally {
      held.release();
    }
    await expect(
      page.getByRole("button", { name: "Acciones de Centro filtrado" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("status").filter({ hasText: "Actualizando datos" }),
    ).toHaveCount(0);
  });
}

for (const mobile of [false, true]) {
  test(`${mobile ? "móvil" : "escritorio"}: conserva filas y total durante el cambio de página`, async ({
    page,
    context,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const state = await mockApi(context);
    await openCenters(page);
    const held = state.holdNextRead();
    try {
      await page
        .getByRole("button", {
          name: mobile ? "Página siguiente" : "Ir a la página siguiente",
          exact: true,
        })
        .click();
      await held.ready;
      await expect(
        page.getByRole("button", { name: "Acciones de Centro original" }),
      ).toBeDisabled();
      await expect(
        page.getByText("21–40 de 40", { exact: true }).filter({ visible: true }),
      ).toBeVisible();
    } finally {
      held.release();
    }
    await expect(
      page.getByRole("button", { name: "Acciones de Centro página dos" }),
    ).toBeEnabled();
    await expect(page).toHaveURL(/page=2/);
  });
}

test("Actualizar consulta de nuevo conservando filtros y página", async ({
  page,
  context,
}) => {
  const state = await mockApi(context);
  await page.goto("/admin?section=centers&status=BORRADOR&q=laguna&page=2");
  await expect(
    page.getByRole("button", { name: "Acciones de Centro filtrado" }),
  ).toBeEnabled();
  const previousUrl = page.url();
  state.name = "Centro actualizado";
  const held = state.holdNextRead();
  try {
    await page.getByRole("button", { name: "Actualizar", exact: true }).click();
    await held.ready;
    await expect(
      page.getByRole("button", { name: "Actualizar", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("status").filter({ hasText: "Actualizando datos" }),
    ).toBeVisible();
  } finally {
    held.release();
  }
  await expect(
    page.getByRole("button", { name: "Acciones de Centro actualizado" }),
  ).toBeEnabled();
  expect(page.url()).toBe(previousUrl);
  expect(state.reads).toHaveLength(2);
  expect(state.reads[1]).toBe(state.reads[0]);
  const params = new URLSearchParams(state.reads[1]);
  expect(params.get("q")).toBe("laguna");
  expect(params.get("status")).toBe("BORRADOR");
  expect(params.get("offset")).toBe("20");
});

test("recuperar foco actualiza un listado antiguo", async ({ page, context }) => {
  const state = await mockApi(context);
  await page.clock.install();
  await openCenters(page);
  state.name = "Centro de otra edición";
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(11_000);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Acciones de Centro de otra edición" }),
  ).toBeEnabled();
  expect(state.reads).toHaveLength(2);
});
