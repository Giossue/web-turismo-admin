import type { AdminCatalogs, AdminCenterDetail } from "./admin-api";
import { withRetainedCatalogOption } from "./retained-catalog-options";

const RETAINED_CATALOG_KEYS = [
  "activities",
  "accessibilityTypes",
  "accessibilityCriteria",
  "facilities",
] as const;

/** Catálogos del editor, con las referencias anteriores que conserva esta ficha. */
export function centerEditorCatalogs(
  catalogs: AdminCatalogs | null,
  retained: AdminCenterDetail["retainedCatalogOptions"],
): AdminCatalogs | null {
  if (!catalogs || !retained) return catalogs;
  const result = { ...catalogs };
  for (const key of RETAINED_CATALOG_KEYS) {
    let options = catalogs[key];
    for (const option of retained[key] ?? []) {
      options = withRetainedCatalogOption(options, option);
    }
    result[key] = options;
  }
  return result;
}
