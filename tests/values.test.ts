import { describe, expect, test } from "bun:test";

import {
  findCatalogIdByName,
  findCatalogOption,
  isRecord,
  toNullableNumber,
  toOptionalNumber,
} from "@/lib/values";

describe("isRecord", () => {
  test("acepta objetos planos", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  test("rechaza null, arreglos y primitivos", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("texto")).toBe(false);
    expect(isRecord(3)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("toNullableNumber / toOptionalNumber", () => {
  test("convierte texto numérico", () => {
    expect(toNullableNumber("12")).toBe(12);
    expect(toNullableNumber(" -1.5 ")).toBe(-1.5);
    expect(toNullableNumber("0")).toBe(0);
  });

  test("devuelve null para vacío o valores no numéricos", () => {
    expect(toNullableNumber("")).toBeNull();
    expect(toNullableNumber("   ")).toBeNull();
    expect(toNullableNumber("abc")).toBeNull();
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
  });

  test("toOptionalNumber usa undefined en lugar de null", () => {
    expect(toOptionalNumber("7")).toBe(7);
    expect(toOptionalNumber("")).toBeUndefined();
    expect(toOptionalNumber("x")).toBeUndefined();
  });
});

describe("catálogos", () => {
  const options = [
    { id: 1, name: "Bolívar" },
    { id: 2, name: "Guaranda" },
  ];

  test("findCatalogOption busca por id numérico o texto", () => {
    expect(findCatalogOption(options, 2)?.name).toBe("Guaranda");
    expect(findCatalogOption(options, "1")?.name).toBe("Bolívar");
    expect(findCatalogOption(options, 3)).toBeUndefined();
    expect(findCatalogOption(options, null)).toBeUndefined();
    expect(findCatalogOption(options, "")).toBeUndefined();
    expect(findCatalogOption(undefined, 1)).toBeUndefined();
  });

  test("findCatalogIdByName busca por nombre exacto", () => {
    expect(findCatalogIdByName(options, "Guaranda")).toBe(2);
    expect(findCatalogIdByName(options, "guaranda")).toBeNull();
    expect(findCatalogIdByName(options, null)).toBeNull();
    expect(findCatalogIdByName(undefined, "Bolívar")).toBeNull();
  });
});
