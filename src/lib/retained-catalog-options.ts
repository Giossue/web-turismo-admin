import type { CatalogOption } from "@/lib/admin-api";

/** Mantiene visible una referencia anterior sin ofrecerla para nuevas asignaciones. */
export function withRetainedCatalogOption(
  options: readonly CatalogOption[] | undefined,
  retained: CatalogOption | null,
): Array<CatalogOption & { disabled?: boolean }> {
  const available = [...(options ?? [])];
  if (!retained || available.some((option) => option.id === retained.id)) {
    return available;
  }
  return [
    ...available,
    {
      ...retained,
      active: false,
      disabled: true,
      displayName: `${retained.displayName ?? retained.name} (ya no disponible)`,
    },
  ];
}
