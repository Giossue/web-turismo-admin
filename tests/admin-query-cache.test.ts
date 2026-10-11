import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  focusManager,
  isCancelledError,
  QueryClient,
  QueryObserver,
  type QueryFunction,
} from "@tanstack/react-query";

import {
  activityPageQueryOptions,
  catalogsQueryOptions,
  centerMediaQueryOptions,
  centerQueryOptions,
  centerSectionsQueryOptions,
  centersPageQueryOptions,
  establishmentMediaQueryOptions,
  establishmentsPageQueryOptions,
  navigationSummaryQueryOptions,
  opinionHistoryQueryOptions,
  opinionsPageQueryOptions,
  summaryQueryOptions,
  usersPageQueryOptions,
} from "@/lib/admin-queries";
import type { AdminCenter, Page } from "@/lib/admin-api";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
const cleanups: Array<() => void> = [];

function client() {
  const value = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
    },
  });
  clients.push(value);
  return value;
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  clients.splice(0).forEach((value) => value.clear());
  globalThis.fetch = originalFetch;
  focusManager.setFocused(undefined);
});

const reads = [
  catalogsQueryOptions("token"),
  catalogsQueryOptions("token", true),
  centerQueryOptions("token", "EC001"),
  centerSectionsQueryOptions("token", "EC001"),
  centerMediaQueryOptions("token", "EC001"),
  establishmentMediaQueryOptions("token", 1),
  centersPageQueryOptions("token", { q: "laguna" }),
  establishmentsPageQueryOptions("token", { offset: 25 }),
  opinionsPageQueryOptions("token", { status: "PENDIENTE" }),
  usersPageQueryOptions("token", {}),
  activityPageQueryOptions("token", {}),
  summaryQueryOptions("token"),
  navigationSummaryQueryOptions("token", 1),
  opinionHistoryQueryOptions("token", "opinion-1"),
];

describe("cancelación de lecturas administrativas", () => {
  for (const options of reads) {
    test(`cancela el transporte de ${JSON.stringify(options.queryKey)}`, async () => {
      const queryClient = client();
      let networkSignal: AbortSignal | undefined;
      let notifyStarted!: () => void;
      const started = new Promise<void>((resolve) => {
        notifyStarted = resolve;
      });
      globalThis.fetch = mock((_url: unknown, init?: RequestInit) => {
        networkSignal = init?.signal ?? undefined;
        notifyStarted();
        return new Promise<Response>((_resolve, reject) => {
          networkSignal?.addEventListener("abort", () => reject(networkSignal?.reason), {
            once: true,
          });
        });
      }) as unknown as typeof fetch;

      const result = queryClient
        .fetchQuery({
          queryKey: options.queryKey,
          queryFn: options.queryFn as QueryFunction<unknown>,
        })
        .catch((cause: unknown) => cause);
      await started;
      await queryClient.cancelQueries({ queryKey: options.queryKey, exact: true });

      expect(networkSignal?.aborted).toBe(true);
      expect(isCancelledError(await result)).toBe(true);
      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    });
  }

  test("abandonar un filtro cancela su lectura sin tocar el siguiente", async () => {
    const queryClient = client();
    const signals = new Map<string, AbortSignal>();
    globalThis.fetch = mock((url: unknown, init?: RequestInit) => {
      signals.set(String(url), init!.signal!);
      return new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason));
      });
    }) as unknown as typeof fetch;
    const observer = new QueryObserver(
      queryClient,
      centersPageQueryOptions("token", { q: "viejo" }),
    );
    const unsubscribe = observer.subscribe(() => {});
    cleanups.push(unsubscribe);
    observer.setOptions(centersPageQueryOptions("token", { q: "nuevo" }));

    expect(
      [...signals.entries()].find(([url]) => url.includes("q=viejo"))?.[1].aborted,
    ).toBe(true);
    expect(
      [...signals.entries()].find(([url]) => url.includes("q=nuevo"))?.[1].aborted,
    ).toBe(false);
  });
});

describe("frescura de listados", () => {
  const lists = [
    centersPageQueryOptions("token", {}),
    establishmentsPageQueryOptions("token", {}),
    opinionsPageQueryOptions("token", {}),
    usersPageQueryOptions("token", {}),
    activityPageQueryOptions("token", {}),
  ];

  for (const options of lists) {
    test(`recuperar foco actualiza ${JSON.stringify(options.queryKey)}`, async () => {
      const queryClient = client();
      queryClient.mount();
      cleanups.push(() => queryClient.unmount());
      focusManager.setFocused(false);
      const oldPage = { items: [], total: 1, limit: 25, offset: 0 };
      queryClient.setQueryData(options.queryKey, oldPage);
      const { staleTime, refetchOnWindowFocus } = options;
      if (typeof staleTime !== "number" || typeof refetchOnWindowFocus !== "boolean") {
        throw new Error("La prueba requiere una política de frescura explícita");
      }
      const observer = new QueryObserver<unknown>(queryClient, {
        queryKey: options.queryKey,
        queryFn: options.queryFn as QueryFunction<unknown>,
        staleTime,
        refetchOnWindowFocus,
      });
      cleanups.push(observer.subscribe(() => {}));
      queryClient.setQueryData(options.queryKey, oldPage, {
        updatedAt: Date.now() - 11_000,
      });
      let notifyFetched!: () => void;
      const fetched = new Promise<void>((resolve) => {
        notifyFetched = resolve;
      });
      globalThis.fetch = mock(async () => {
        notifyFetched();
        return Response.json({ data: { ...oldPage, total: 2 } });
      }) as unknown as typeof fetch;

      focusManager.setFocused(true);
      await fetched;
      await observer.refetch({ cancelRefetch: false });
      expect(queryClient.getQueryData<typeof oldPage>(options.queryKey)).toEqual({
        ...oldPage,
        total: 2,
      });
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  }

  test("cambiar página conserva filas y marca los datos anteriores", async () => {
    const queryClient = client();
    const first = centersPageQueryOptions("token", { offset: 0 });
    const oldPage: Page<AdminCenter> = {
      items: [{ code: "anterior" } as AdminCenter],
      total: 50,
      limit: 25,
      offset: 0,
    };
    queryClient.setQueryData(first.queryKey, oldPage);
    let complete!: (value: Response) => void;
    globalThis.fetch = mock(
      () =>
        new Promise<Response>((resolve) => {
          complete = resolve;
        }),
    ) as unknown as typeof fetch;
    const observer = new QueryObserver(queryClient, first);
    cleanups.push(observer.subscribe(() => {}));
    observer.setOptions(centersPageQueryOptions("token", { offset: 25 }));

    expect(observer.getCurrentResult().isPlaceholderData).toBe(true);
    expect(observer.getCurrentResult().isFetching).toBe(true);
    expect(observer.getCurrentResult().data).toEqual(oldPage);
    complete(
      Response.json({ data: { ...oldPage, items: [{ code: "actual" }], offset: 25 } }),
    );
    await observer.refetch({ cancelRefetch: false });
    expect(observer.getCurrentResult().isPlaceholderData).toBe(false);
    expect(observer.getCurrentResult().data?.items[0].code).toBe("actual");
  });
});
