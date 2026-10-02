import type { AdminCatalogs, CatalogOption } from "./admin-api";

/** Añade el contexto geográfico para buscar y distinguir localidades con el mismo nombre. */
export function localityOptions(
  catalogs: Pick<AdminCatalogs, "localities" | "cantons" | "provinces"> | null | undefined,
): CatalogOption[] {
  if (!catalogs) return [];

  const cantons = new Map(catalogs.cantons.map((canton) => [canton.id, canton]));
  const provinces = new Map(catalogs.provinces.map((province) => [province.id, province]));

  return catalogs.localities.map((locality) => {
    const canton = locality.cantonId ? cantons.get(locality.cantonId) : undefined;
    const provinceId = locality.provinceId ?? canton?.provinceId;
    const province = provinceId ? provinces.get(provinceId) : undefined;
    const context = [canton?.name, province?.name].filter(Boolean).join(", ");
    const name = locality.displayName ?? locality.name;
    return { ...locality, displayName: context ? `${name} — ${context}` : name };
  });
}
