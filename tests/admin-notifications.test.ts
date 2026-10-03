import { afterEach, describe, expect, mock, test } from "bun:test";

import { getAdminNavigationSummary, type AdminNavigationSummary } from "@/lib/admin-api";
import {
  createNavigationReadStore,
  navigationNotificationFlags,
  parseNavigationReadMarkers,
} from "@/lib/admin-notifications";
import { adminKeys } from "@/lib/admin-queries";
import { apiEndpoint } from "@/lib/http";

const originalFetch = globalThis.fetch;
const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
  else Reflect.deleteProperty(globalThis, "window");
});

const changedAt = "2026-10-03T12:00:00.000Z";
const timestamp = Date.parse(changedAt);
function summary(): AdminNavigationSummary {
  return {
    review: { pending: 0, latestChange: null },
    opinions: { pending: 0, latestChange: null },
    centers: { pending: 0, latestChange: null },
    establishments: { pending: 0, latestChange: null },
    catalogs: { pending: 0, latestChange: null },
  };
}

describe("señales de la navegación", () => {
  test("una novedad desaparece al leer, un pendiente persiste hasta resolverse", () => {
    const data = summary();
    data.catalogs.latestChange = changedAt;
    data.review = { pending: 7, latestChange: changedAt };
    expect(navigationNotificationFlags(data, {})).toMatchObject({
      catalogs: true,
      review: true,
    });
    const seen = { catalogs: timestamp, review: timestamp };
    expect(navigationNotificationFlags(data, seen)).toMatchObject({
      catalogs: false,
      review: true,
    });
    data.review.pending = 0;
    expect(navigationNotificationFlags(data, seen).review).toBe(false);
  });

  test("la marca debe avanzar; timestamps antiguos, vacíos e inválidos no crean novedades", () => {
    const data = summary();
    data.centers.latestChange = changedAt;
    data.opinions.latestChange = "fecha inválida";
    expect(navigationNotificationFlags(data, { centers: timestamp + 1 })).toEqual({
      review: false,
      opinions: false,
      centers: false,
      establishments: false,
      catalogs: false,
    });
    expect(navigationNotificationFlags(undefined, {})).toEqual({});
  });

  test("solo acepta fechas locales finitas de secciones conocidas", () => {
    expect(parseNavigationReadMarkers("no JSON")).toEqual({});
    expect(parseNavigationReadMarkers("null")).toEqual({});
    expect(
      parseNavigationReadMarkers(
        JSON.stringify({
          catalogs: timestamp,
          centers: -1,
          review: "2026-10-03",
          summary: timestamp,
        }),
      ),
    ).toEqual({ catalogs: timestamp });
  });

  test("consulta un agregado autenticado y separa la caché de cada cuenta", async () => {
    const data = summary();
    const fetchMock = mock(async () => Response.json({ data }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    expect(await getAdminNavigationSummary("test-token")).toEqual(data);
    const request = fetchMock.mock.calls[0] as unknown as Parameters<typeof fetch>;
    expect(request[0]).toBe(apiEndpoint("/admin/navigation-summary"));
    expect(new Headers(request[1]?.headers).get("Authorization")).toBe(
      "Bearer test-token",
    );
    expect(adminKeys.navigationSummary(1)).not.toEqual(adminKeys.navigationSummary(2));
    expect(adminKeys.navigationSummary(1).slice(0, 2)).toEqual([
      ...adminKeys.allNavigationSummaries(),
    ]);
  });
});

class BrowserStorage extends EventTarget {
  values = new Map<string, string>();
  blocked = false;
  localStorage = {
    getItem: (key: string) => this.values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (this.blocked) throw new Error("Storage unavailable");
      this.values.set(key, value);
    },
  };
}

function browser() {
  const target = new BrowserStorage();
  Object.defineProperty(globalThis, "window", { configurable: true, value: target });
  return target;
}

describe("lectura por cuenta", () => {
  test("persiste solo fechas, notifica y conserva lectura al volver a la misma cuenta", () => {
    const target = browser();
    const store = createNavigationReadStore(1001);
    const listener = mock(() => undefined);
    const unsubscribe = store.subscribe(listener);
    store.markSeen("catalogs", changedAt);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(
      parseNavigationReadMarkers(createNavigationReadStore(1001).getSnapshot()),
    ).toEqual({ catalogs: timestamp });
    expect(
      parseNavigationReadMarkers(createNavigationReadStore(1002).getSnapshot()),
    ).toEqual({});
    expect([...target.values.values()]).toEqual([
      JSON.stringify({ catalogs: timestamp }),
    ]);
    store.markSeen("catalogs", "2026-10-02T12:00:00.000Z");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.markSeen("centers", changedAt);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("el almacenamiento bloqueado conserva la lectura en memoria durante la sesión", () => {
    const target = browser();
    target.blocked = true;
    const store = createNavigationReadStore(2001);
    expect(() => store.markSeen("opinions", changedAt)).not.toThrow();
    expect(parseNavigationReadMarkers(store.getSnapshot())).toEqual({
      opinions: timestamp,
    });
    expect(createNavigationReadStore(2001).getSnapshot()).toBe(store.getSnapshot());
    expect(target.values.size).toBe(0);
    expect(store.getServerSnapshot()).toBe("{}");
  });
});
