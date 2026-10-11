import type { QueryClient } from "@tanstack/react-query";

import { getAdminCenter, type AdminCenterDetail } from "./admin-api";
import { adminKeys } from "./admin-queries";

/** Lee la API aunque el detalle en memoria todavía se considere fresco. */
export async function reloadAdminCenter(
  queryClient: QueryClient,
  token: string,
  code: string,
): Promise<AdminCenterDetail> {
  const queryKey = adminKeys.center(code);
  await queryClient.cancelQueries({ queryKey, exact: true });
  return queryClient.fetchQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminCenter(token, code, signal),
    staleTime: 0,
  });
}

/** Una lectura anterior no debe reemplazar el detalle confirmado ni su versión. */
export async function storeAdminCenterDetail(
  queryClient: QueryClient,
  detail: AdminCenterDetail,
): Promise<void> {
  const queryKey = adminKeys.center(detail.code);
  await queryClient.cancelQueries({ queryKey, exact: true });
  queryClient.setQueryData(queryKey, detail);
}
