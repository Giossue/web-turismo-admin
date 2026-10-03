import { afterEach, describe, expect, mock, test } from "bun:test";

import { getAdminCenters, reviewAdminCenter } from "@/lib/admin-api";
import {
  centerStatusLabel,
  centerStatusTone,
  establishmentReviewStatusLabel,
} from "@/lib/admin-labels";
import { apiEndpoint } from "@/lib/http";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockApi(data: unknown) {
  const fetchMock = mock<(...args: Parameters<typeof fetch>) => Promise<Response>>(
    async () => Response.json({ data }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("flujo de centros con tres estados", () => {
  test("filtra por estado editorial sin restringir por activación", async () => {
    const page = { items: [], total: 0, limit: 25, offset: 0 };
    const fetchMock = mockApi(page);
    expect(await getAdminCenters("token", { status: "PUBLICADO" })).toEqual(page);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      apiEndpoint("/admin/centers?status=PUBLICADO&limit=25&offset=0"),
    );
  });

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
    expect(centerStatusLabel({ code: "FUTURO", name: "Estado futuro" })).toBe(
      "Estado futuro",
    );
    expect(centerStatusTone("FUTURO")).toBe("default");
    expect(establishmentReviewStatusLabel("RECHAZADO")).toBe("Rechazado");
  });
});
