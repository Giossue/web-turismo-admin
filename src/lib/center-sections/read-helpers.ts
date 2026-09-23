import { isRecord } from "@/lib/values";

import { EMPTY_RESPONSE, isSectionResponse, type SectionResponse } from "./options";

/**
 * Lectores tolerantes del JSON sin tipar que guarda la API por apartado.
 * Nunca lanzan: un dato ausente o con otro tipo se convierte en el valor
 * vacío del formulario (`""`, `[]`, `EMPTY_RESPONSE` o el valor por defecto).
 */

export type JsonRecord = Record<string, unknown>;

/** El valor como objeto; `{}` si no es un objeto plano. */
export function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

/** `parent[key]` como objeto; `{}` si falta o no es un objeto plano. */
export function readRecord(parent: unknown, key: string): JsonRecord {
  return asRecord(asRecord(parent)[key]);
}

/** Texto de `record[key]`; `""` si no es texto. */
export function readString(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

/** Número (o texto numérico) de `record[key]` como texto de formulario; `""` si falta. */
export function readNumeric(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

/** Respuesta Sí/No/Sin información/No aplica; `EMPTY_RESPONSE` si no es válida. */
export function readResponse(record: JsonRecord, key: string): SectionResponse {
  const value = record[key];
  return isSectionResponse(value) ? value : EMPTY_RESPONSE;
}

/** Valor cerrado de `options`; `fallback` si `record[key]` no es uno de ellos. */
export function readEnum<T extends string, F extends string>(
  record: JsonRecord,
  key: string,
  options: readonly { value: T }[],
  fallback: F,
): T | F {
  const value = record[key];
  return options.find((option) => option.value === value)?.value ?? fallback;
}

/** `parent[key]` como lista, leyendo cada elemento como objeto; `[]` si no es una lista. */
export function readArray<T>(
  parent: unknown,
  key: string,
  mapItem: (item: JsonRecord) => T,
): T[] {
  const value = asRecord(parent)[key];
  return Array.isArray(value) ? value.map((item) => mapItem(asRecord(item))) : [];
}

/** Lista de números o textos de `record[key]` como textos; `[]` si no es una lista. */
export function readStrings(record: JsonRecord, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "number" || typeof item === "string")
    .map(String);
}
