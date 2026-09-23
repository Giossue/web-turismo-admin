import { describe, expect, test } from "bun:test";
import { MutationObserver, QueryClient } from "@tanstack/react-query";

import type { AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys, centerSaveScope, getCachedCenterVersion } from "@/lib/admin-queries";

const CODE = "0201010101010001";

function detailWithVersion(version: number): AdminCenterDetail {
  return { code: CODE, version } as AdminCenterDetail;
}

/**
 * Reproduce cómo guardan los apartados y el formulario principal: cada uno con
 * su propio observador, el mismo `centerSaveScope`, la versión leída de la
 * caché al ejecutar y la caché actualizada en `onSuccess`.
 */
function createSaver(queryClient: QueryClient, sentVersions: Array<number | undefined>) {
  return new MutationObserver<AdminCenterDetail, Error, string>(queryClient, {
    scope: centerSaveScope(CODE),
    mutationFn: async () => {
      const version = getCachedCenterVersion(queryClient, CODE);
      sentVersions.push(version);
      await new Promise((resolve) => setTimeout(resolve, 5));
      return detailWithVersion((version ?? 0) + 1);
    },
    onSuccess: async (saved) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.center(CODE) });
      queryClient.setQueryData(adminKeys.center(CODE), saved);
    },
  });
}

describe("guardados de una ficha", () => {
  test("se ejecutan en serie y cada uno envía la versión del anterior", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(adminKeys.center(CODE), detailWithVersion(7));
    const sentVersions: Array<number | undefined> = [];
    const savers = [0, 1, 2].map(() => createSaver(queryClient, sentVersions));

    // Tres formularios guardan casi a la vez.
    await Promise.all(savers.map((saver, index) => saver.mutate(`apartado-${index}`)));

    expect(sentVersions).toEqual([7, 8, 9]);
    expect(getCachedCenterVersion(queryClient, CODE)).toBe(10);
  });
});
