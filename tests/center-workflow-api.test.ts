import { afterEach, describe, expect, mock, test } from "bun:test";

import {
  getAdminCenters,
  reviewAdminCenter,
  setAdminCenterActive,
} from "@/lib/admin-api";
import { centerStatusLabel, centerStatusTone, establishmentReviewStatusLabel } from "@/lib/admin-labels";
import { apiEndpoint } from "@/lib/http";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockApi(data: unknown) {
  const fetchMock = mock(async () => Response.json({ data }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("flujo de centros independiente de activación", () => {
  test("filtra por estado editorial y conserva active=false en la API", async () => {
    const page = { items: [], total: 0, limit: 25, offset: 0 };
    const fetchMock = mockApi(page);
    expect(
      await getAdminCenters("token", { status: "PUBLICADO", active: false }),
    ).toEqual(page);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      apiEndpoint("/admin/centers?status=PUBLICADO&active=false&limit=25&offset=0"),
    );
  });

  for (const active of [false, true]) {
    test(`${active ? "activa" : "desactiva"} sin enviar un estado editorial`, async () => {
      const detail = { code: "CT/1", active, status: { code: "PUBLICADO" } };
      const fetchMock = mockApi(detail);
      expect(await setAdminCenterActive("token", "CT/1", active)).toEqual(detail);
      const [url, init] = fetchMock.mock.calls[0] as unknown as Parameters<typeof fetch>;
      expect(url).toBe(
        apiEndpoint(`/admin/centers/CT%2F1/${active ? "reactivate" : "deactivate"}`),
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeUndefined();
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
    });
  }

  test("aprobar envía una sola decisión y devolver conserva el motivo", async () => {
    const fetchMock = mockApi({ code: "CT1" });
    await reviewAdminCenter("token", "CT1", "APPROVE");
    await reviewAdminCenter("token", "CT1", "REJECT", "Corregir el acceso.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls as unknown as Parameters<typeof fetch>[]) {
      expect(call[0]).toBe(apiEndpoint("/admin/centers/CT1/review"));
      expect(call[1]?.method).toBe("PATCH");
    }
    const first = fetchMock.mock.calls[0] as unknown as Parameters<typeof fetch>;
    const second = fetchMock.mock.calls[1] as unknown as Parameters<typeof fetch>;
    expect(JSON.parse(String(first[1]?.body))).toEqual({ action: "APPROVE" });
    expect(JSON.parse(String(second[1]?.body))).toEqual({
      action: "REJECT",
      observation: "Corregir el acceso.",
    });
  });

  test("conserva estados desconocidos y el rechazo independiente de catastro", () => {
    expect(centerStatusLabel({ code: "BORRADOR", name: "Draft" })).toBe("Borrador");
    expect(centerStatusLabel({ code: "FUTURO", name: "Estado futuro" })).toBe("Estado futuro");
    expect(centerStatusTone("FUTURO")).toBe("default");
    expect(establishmentReviewStatusLabel("RECHAZADO")).toBe("Rechazado");
  });
});
