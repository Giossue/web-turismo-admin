/** Objeto plano (no `null` ni arreglo) leído de un JSON sin tipar. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Convierte el texto de un campo numérico a número. Devuelve `null` para un
 * campo vacío o un valor que no es un número finito.
 */
export function toNullableNumber(value: string | null | undefined): number | null {
  const text = value?.trim() ?? "";
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Igual que `toNullableNumber`, pero con `undefined` para omitir el campo en un payload. */
export function toOptionalNumber(value: string | null | undefined): number | undefined {
  return toNullableNumber(value) ?? undefined;
}

type CatalogLike = { id: number; name: string };

/** Busca una opción de catálogo por id (acepta ids numéricos o como texto). */
export function findCatalogOption<T extends { id: number }>(
  options: readonly T[] | null | undefined,
  id: number | string | null | undefined,
): T | undefined {
  if (id === null || id === undefined || id === "") return undefined;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return undefined;
  return options?.find((option) => Number(option.id) === numericId);
}

/** Busca el id de una opción de catálogo por su nombre exacto. */
export function findCatalogIdByName(
  options: readonly CatalogLike[] | null | undefined,
  name: string | null | undefined,
): number | null {
  if (!name) return null;
  return options?.find((option) => option.name === name)?.id ?? null;
}
