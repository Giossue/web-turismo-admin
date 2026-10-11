import { afterEach, describe, expect, mock, test } from "bun:test";
import { MutationObserver, QueryClient } from "@tanstack/react-query";

import { saveAdminCenterSection, type AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys, centerSaveScope, getCachedCenterVersion } from "@/lib/admin-queries";
import { storeAdminCenterDetail } from "@/lib/center-cache";
import { saveImportedCenterSection } from "@/lib/imported-center-sections";

const originalFetch = globalThis.fetch;
const CODE = "EC001";
const content = { response: "NO", observation: "Importada" };
const clients: QueryClient[] = [];
function detail(
  version: number,
  sections: Record<string, unknown> = {},
): AdminCenterDetail {
  return {
    code: CODE,
    version,
    draft: { sections },
    published: { sections: {} },
  } as AdminCenterDetail;
}
function client(initial?: AdminCenterDetail) {
  const value = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false } },
  });
  if (initial) value.setQueryData(adminKeys.center(CODE), initial);
  clients.push(value);
  return value;
}
function responses(...values: Response[]) {
  const fn = mock(async () => {
    const response = values.shift();
    if (!response) throw new Error("Petición inesperada");
    return response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}
const conflict = () =>
  Response.json({ error: { message: "Conflicto de versión" } }, { status: 409 });
afterEach(() => {
  clients.splice(0).forEach((value) => value.clear());
  globalThis.fetch = originalFetch;
});

describe("importación de apartados", () => {
  test("omite un apartado existente sin enviar otra escritura", async () => {
    const queryClient = client(detail(7, { planta: { response: "SI" } }));
    const fetchMock = responses();
    expect(
      await saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("conserva el apartado de otra edición encontrado después de un conflicto", async () => {
    const queryClient = client(detail(7));
    const current = detail(8, {
      planta: { response: "SI", observation: "Otra persona" },
    });
    const fetchMock = responses(conflict(), Response.json({ data: current }));

    expect(
      await saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(CODE))).toEqual(
      current,
    );
  });

  test("reintenta una vez con la nueva versión si el apartado sigue ausente", async () => {
    const queryClient = client(detail(7));
    const saved = detail(9, { planta: content });
    const fetchMock = responses(
      conflict(),
      Response.json({ data: detail(8) }),
      Response.json({ data: saved }),
    );

    expect(
      await saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).toEqual(saved);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(JSON.parse(String(calls[0]![1].body)).version).toBe(7);
    expect(JSON.parse(String(calls[2]![1].body)).version).toBe(8);
    expect(getCachedCenterVersion(queryClient, CODE)).toBe(9);
  });

  test("un segundo conflicto se comunica sin más reintentos", async () => {
    const queryClient = client(detail(7));
    const fetchMock = responses(
      conflict(),
      Response.json({ data: detail(8) }),
      conflict(),
    );

    await expect(
      saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).rejects.toMatchObject({ status: 409 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("una lectura de recuperación fallida impide el reintento", async () => {
    const queryClient = client(detail(7));
    const fetchMock = responses(
      conflict(),
      Response.json({ error: { message: "Sin acceso" } }, { status: 403 }),
    );

    await expect(
      saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getCachedCenterVersion(queryClient, CODE)).toBe(7);
  });

  test("consulta la ficha antes de guardar si no existe detalle en memoria", async () => {
    const queryClient = client();
    const fetchMock = responses(Response.json({ data: detail(8, { planta: content }) }));

    expect(
      await saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("un rechazo de permisos no produce recuperación ni reintento de escritura", async () => {
    const queryClient = client(detail(7));
    const fetchMock = responses(
      Response.json({ error: { message: "Sin permiso" } }, { status: 403 }),
    );

    await expect(
      saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("el apartado importado espera al guardado anterior y usa su versión confirmada", async () => {
    const queryClient = client(detail(7));
    const versions: number[] = [];
    let releaseFirst!: () => void;
    let notifyFirst!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      notifyFirst = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    globalThis.fetch = mock(async (_url: unknown, init?: RequestInit) => {
      const version = JSON.parse(String(init?.body)).version as number;
      versions.push(version);
      if (versions.length === 1) {
        notifyFirst();
        await gate;
      }
      return Response.json({ data: detail(version + 1) });
    }) as unknown as typeof fetch;
    const ordinary = new MutationObserver(queryClient, {
      scope: centerSaveScope(CODE),
      mutationFn: () =>
        saveAdminCenterSection(
          "token",
          CODE,
          "conservacion",
          {},
          getCachedCenterVersion(queryClient, CODE),
        ),
      onSuccess: (saved) => storeAdminCenterDetail(queryClient, saved),
    });
    const imported = new MutationObserver(queryClient, {
      scope: centerSaveScope(CODE),
      mutationFn: () =>
        saveImportedCenterSection(queryClient, "token", CODE, "planta", content),
    });

    const first = ordinary.mutate(undefined);
    await firstStarted;
    const second = imported.mutate(undefined);
    expect(versions).toEqual([7]);
    releaseFirst();
    await Promise.all([first, second]);
    expect(versions).toEqual([7, 8]);
    expect(getCachedCenterVersion(queryClient, CODE)).toBe(9);
  });
});
