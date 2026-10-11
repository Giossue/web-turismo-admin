import type { QueryClient } from "@tanstack/react-query";

import { saveAdminCenterSection, type AdminCenterDetail } from "./admin-api";
import { adminKeys } from "./admin-queries";
import { reloadAdminCenter, storeAdminCenterDetail } from "./center-cache";
import type { CenterSectionCode } from "./center-sections/definitions";
import { ApiError } from "./http";

/**
 * Importa solo un apartado ausente. Debe ejecutarse dentro del scope de guardado
 * de la ficha; tras un 409 comprueba otra vez su existencia antes del único reintento.
 * `null` significa que se conservó el apartado que ya tenía información.
 */
export async function saveImportedCenterSection(
  queryClient: QueryClient,
  token: string,
  code: string,
  sectionCode: CenterSectionCode,
  content: Record<string, unknown>,
): Promise<AdminCenterDetail | null> {
  let current =
    queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(code)) ??
    (await reloadAdminCenter(queryClient, token, code));
  const exists = () =>
    (current.draft ?? current.published)?.sections?.[sectionCode] !== undefined;
  if (exists()) return null;

  const save = () =>
    saveAdminCenterSection(token, code, sectionCode, content, current.version);
  let saved: AdminCenterDetail;
  try {
    saved = await save();
  } catch (cause) {
    if (!(cause instanceof ApiError) || cause.status !== 409) throw cause;
    current = await reloadAdminCenter(queryClient, token, code);
    if (exists()) return null;
    saved = await save();
  }
  await storeAdminCenterDetail(queryClient, saved);
  return saved;
}
