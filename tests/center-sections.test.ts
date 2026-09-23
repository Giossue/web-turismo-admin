import { describe, expect, test } from "bun:test";

import { centerSectionDefinitions } from "@/lib/center-sections/definitions";
import {
  CONSERVATION_STATE_OPTIONS,
  EMPTY_RESPONSE,
  isSectionResponse,
  POLICY_DEFINITIONS,
} from "@/lib/center-sections/options";

describe("definiciones de secciones", () => {
  test("los códigos son únicos y siguen el orden de la ficha", () => {
    const codes = centerSectionDefinitions.map((definition) => definition.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes[0]).toBe("identificacion");
    expect(codes.at(-1)).toBe("anexos");
    expect(codes).toHaveLength(14);
  });
});

describe("opciones compartidas", () => {
  test("isSectionResponse reconoce los cuatro valores", () => {
    for (const value of ["SI", "NO", "SIN_INFORMACION", "NO_APLICA"]) {
      expect(isSectionResponse(value)).toBe(true);
    }
    expect(isSectionResponse("si")).toBe(false);
    expect(isSectionResponse(null)).toBe(false);
    expect(isSectionResponse(EMPTY_RESPONSE)).toBe(true);
  });

  test("el estado de conservación usa el código que valida la API", () => {
    const values = CONSERVATION_STATE_OPTIONS.map((option) => option.value);
    expect(values).toContain("EN_PROCESO_DE_DETERIORO");
  });

  test("las cuatro preguntas de políticas conservan sus códigos", () => {
    expect(POLICY_DEFINITIONS.map((policy) => policy.code)).toEqual([
      "PLAN_DESARROLLO_GAD",
      "PLANIFICACION_TERRITORIAL",
      "REGULACIONES_APLICABLES",
      "ORDENANZAS_APLICABLES",
    ]);
  });
});
