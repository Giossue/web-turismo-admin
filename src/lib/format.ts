const LOCALE = "es-EC";
const EMPTY_VALUE = "—";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fecha corta en formato local de Ecuador; "—" si el valor falta o no es válido. */
export function formatDate(value: string | null | undefined): string {
  return parseDate(value)?.toLocaleDateString(LOCALE) ?? EMPTY_VALUE;
}

/** Fecha y hora en formato local de Ecuador; "—" si el valor falta o no es válido. */
export function formatDateTime(value: string | null | undefined): string {
  return (
    parseDate(value)?.toLocaleString(LOCALE, {
      dateStyle: "medium",
      timeStyle: "short",
    }) ?? EMPTY_VALUE
  );
}
