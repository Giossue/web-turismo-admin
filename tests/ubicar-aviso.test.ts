import { describe, expect, test } from "bun:test";

import { ubicarAviso } from "@/lib/ficha/ubicar-aviso";

describe("ubicarAviso", () => {
  test("ubica los avisos del catálogo en su campo", () => {
    expect(
      ubicarAviso('Clima: "Frio X" no coincide con ningún valor activo del catálogo.'),
    ).toEqual({ sectionCode: "caracteristicas", field: "climateId", form: "section" });
    expect(ubicarAviso('Parroquia: "X" no coincide')).toEqual({
      sectionCode: "identificacion",
      field: "parishId",
      form: "main",
    });
  });

  test("ubica los errores de la API", () => {
    expect(
      ubicarAviso(
        "La validación del GAD requiere una aceptación SI o NO antes de publicar.",
      ),
    ).toEqual({
      sectionCode: "anexos",
      field: "gadValidation.acceptance",
      form: "section",
    });
  });

  test("distingue la coordenada de inicio y la de fin de una vía", () => {
    expect(ubicarAviso("Vía TERCER_ORDEN - coordenada de fin: formato")?.field).toBe(
      "accessibilityRoads.0.endLatitude",
    );
    expect(ubicarAviso("Vía TERCER_ORDEN - coordenada de inicio: formato")?.field).toBe(
      "accessibilityRoads.0.startLatitude",
    );
  });

  test("devuelve null si no hay campo concreto", () => {
    expect(ubicarAviso("La imagen 1 de los anexos tiene un formato no compatible")).toBe(
      null,
    );
  });
});
