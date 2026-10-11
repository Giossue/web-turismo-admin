import { afterEach, describe, expect, mock, test } from "bun:test";
import { isCancelledError, QueryClient } from "@tanstack/react-query";

import type { AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys, centerQueryOptions } from "@/lib/admin-queries";
import { reloadAdminCenter, storeAdminCenterDetail } from "@/lib/center-cache";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
const CODE = "EC001";
const detail = (version: number) => ({ code: CODE, version }) as AdminCenterDetail;
function client() {
  const value = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false } },
  });
  clients.push(value);
  return value;
}
afterEach(() => {
  clients.splice(0).forEach((value) => value.clear());
  globalThis.fetch = originalFetch;
});

describe("recuperación de la ficha", () => {
  test("consulta la API aunque la versión local se acabe de guardar", async () => {
    const queryClient = client();
    queryClient.setQueryData(adminKeys.center(CODE), detail(7));
    globalThis.fetch = mock(async () =>
      Response.json({ data: detail(8) }),
    ) as unknown as typeof fetch;

    expect(await reloadAdminCenter(queryClient, "token", CODE)).toEqual(detail(8));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(CODE))).toEqual(
      detail(8),
    );
  });

  test("una recuperación fallida rechaza el resultado y conserva el detalle anterior", async () => {
    const queryClient = client();
    queryClient.setQueryData(adminKeys.center(CODE), detail(7));
    globalThis.fetch = mock(async () =>
      Response.json({ error: { message: "Sin acceso." } }, { status: 403 }),
    ) as unknown as typeof fetch;

    await expect(reloadAdminCenter(queryClient, "token", CODE)).rejects.toMatchObject({
      status: 403,
    });
    expect(queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(CODE))).toEqual(
      detail(7),
    );
  });

  test("una lectura anterior no reemplaza la versión confirmada de un guardado", async () => {
    const queryClient = client();
    let finish!: (value: Response) => void;
    globalThis.fetch = mock(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    ) as unknown as typeof fetch;
    const options = centerQueryOptions("token", CODE);
    const reading = queryClient
      .fetchQuery({
        queryKey: options.queryKey,
        queryFn: ({ signal }) => {
          // Usa la misma lectura cancelable que el editor.
          return typeof options.queryFn === "function"
            ? options.queryFn({
                client: queryClient,
                queryKey: options.queryKey,
                signal,
                meta: undefined,
              })
            : Promise.reject(new Error("Sin lectura"));
        },
      })
      .catch((cause: unknown) => cause);

    await storeAdminCenterDetail(queryClient, detail(9));
    finish(Response.json({ data: detail(7) }));
    expect(isCancelledError(await reading)).toBe(true);
    expect(queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(CODE))).toEqual(
      detail(9),
    );
  });
});
