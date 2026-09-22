import { describe, expect, test } from "bun:test";

import { normalizarTextoCatalogo } from "@/lib/ficha/normalizacion";

describe("normalizarTextoCatalogo — regresión de producción", () => {
  test("no lanza si el valor es undefined (elemento de catálogo sin `name`)", () => {
    // 2026-09-22: en producción, un elemento real de un catálogo llegó sin
    // `name` y tumbó todo el endpoint con un TypeError sin capturar
    // ("Cannot read properties of undefined (reading 'normalize')").
    expect(() => normalizarTextoCatalogo(undefined)).not.toThrow();
    expect(normalizarTextoCatalogo(undefined)).toBe("");
  });

  test("no lanza si el valor es null", () => {
    expect(() => normalizarTextoCatalogo(null)).not.toThrow();
    expect(normalizarTextoCatalogo(null)).toBe("");
  });

  test("sigue normalizando correctamente un valor real", () => {
    expect(normalizarTextoCatalogo("BOLIVAR")).toBe("BOLIVAR");
    expect(normalizarTextoCatalogo("Bolívar")).toBe("BOLIVAR");
    expect(normalizarTextoCatalogo("MANIFESTACIONES_CULTURALES")).toBe(
      "MANIFESTACIONES CULTURALES",
    );
  });
});
