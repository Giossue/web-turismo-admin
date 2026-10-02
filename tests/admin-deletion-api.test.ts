import { afterEach, describe, expect, mock, test } from "bun:test";

import {
  deleteAdminCatalog,
  deleteAdminCenter,
  deleteAdminEstablishment,
  deleteAdminOpinion,
  registerAdminAccessTokenRefresh,
} from "@/lib/admin-api";
import { ApiError, apiEndpoint } from "@/lib/http";

const originalFetch = globalThis.fetch;
const accessToken = "admin-access-token";
const centerCode = "EC 001/Guaranda?#";
const reviewCode = "review/visitor ?#";
let releaseRefresh: (() => void) | undefined;

afterEach(() => {
  globalThis.fetch = originalFetch;
  releaseRefresh?.();
  releaseRefresh = undefined;
});

function mockApi(status: number, body: unknown) {
  const fetchMock = mock<(...args: Parameters<typeof fetch>) => Promise<Response>>(
    async () => Response.json(body, { status }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const cases = [
  {
    label: "centros turísticos",
    path: `/admin/centers/${encodeURIComponent(centerCode)}`,
    remove: () => deleteAdminCenter(accessToken, centerCode),
  },
  {
    label: "catastro",
    path: "/admin/establishments/42",
    remove: () => deleteAdminEstablishment(accessToken, 42),
  },
  {
    label: "opiniones",
    path: `/admin/opinions/${encodeURIComponent(reviewCode)}`,
    remove: () => deleteAdminOpinion(accessToken, reviewCode),
  },
  {
    label: "catálogos",
    path: "/admin/catalogs/ACCESSIBILITY/18",
    remove: () => deleteAdminCatalog(accessToken, "ACCESSIBILITY", 18),
  },
];

describe("eliminación administrativa mediante la API", () => {
  for (const item of cases) {
    test(`${item.label}: envía DELETE autenticado sin cuerpo y devuelve el sobre de éxito`, async () => {
      const data = { deleted: true };
      const fetchMock = mockApi(200, { data });

      expect(await item.remove()).toEqual(data);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(String(url)).toBe(apiEndpoint(item.path));
      expect(init?.method).toBe("DELETE");
      expect(init?.body).toBeUndefined();
      expect(init?.credentials).toBe("include");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
      expect(headers.get("Accept")).toBe("application/json");
      expect(headers.has("Content-Type")).toBe(false);
    });

    test(`${item.label}: conserva el error 403 de autorización sin reintentar`, async () => {
      const message = "No tienes permisos para eliminar este registro.";
      const fetchMock = mockApi(403, { error: { code: "FORBIDDEN", message } });
      const deletion = item.remove();

      await expect(deletion).rejects.toBeInstanceOf(ApiError);
      await expect(deletion).rejects.toMatchObject({ status: 403, message });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test(`${item.label}: rechaza una respuesta exitosa sin el resultado de la API`, async () => {
      mockApi(200, {});

      await expect(item.remove()).rejects.toMatchObject({
        status: 200,
        message: "La API administrativa devolvió una respuesta incompleta.",
      });
    });
  }

  test("renueva una sesión vencida y conserva DELETE sin cuerpo en el único reintento", async () => {
    const fetchMock = mockApi(401, {
      error: { message: "La sesión expiró." },
    }).mockResolvedValueOnce(
      Response.json({ error: { message: "La sesión expiró." } }, { status: 401 }),
    );
    fetchMock.mockResolvedValueOnce(Response.json({ data: { deleted: true } }));
    const refresh = mock(async () => "new-admin-access-token");
    releaseRefresh = registerAdminAccessTokenRefresh(refresh);

    expect(await deleteAdminEstablishment(accessToken, 42)).toEqual({ deleted: true });
    expect(refresh).toHaveBeenCalledWith(accessToken);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retry] = fetchMock.mock.calls[1]!;
    expect(retry?.method).toBe("DELETE");
    expect(retry?.body).toBeUndefined();
    expect(new Headers(retry?.headers).get("Authorization")).toBe(
      "Bearer new-admin-access-token",
    );
  });
});
