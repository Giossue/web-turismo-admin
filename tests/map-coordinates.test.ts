import { describe, expect, test } from "bun:test";

import { readMapCoordinate, type MapCoordinate } from "@/lib/map-coordinates";

type CoordinateInput = Parameters<typeof readMapCoordinate>[0];
type InvalidCase = [string, CoordinateInput, CoordinateInput];
type ValidCase = [string, CoordinateInput, CoordinateInput, MapCoordinate];

describe("readMapCoordinate", () => {
  describe("ausencia e integridad del punto", () => {
    const cases: InvalidCase[] = [
      ["campos vacíos", "", ""],
      ["sólo espacios", " \t ", "\n "],
      ["valores ausentes", null, undefined],
      ["latitud vacía y longitud válida", "", -79.0016],
      ["latitud válida y longitud vacía", -1.5923, ""],
      ["longitud ausente", -1.5923, null],
      ["latitud no numérica", "abc", -79.0016],
      ["longitud no numérica", -1.5923, "abc"],
    ];

    test.each(cases)("rechaza %s", (_name, latitude, longitude) => {
      expect(readMapCoordinate(latitude, longitude)).toBeNull();
    });
  });

  describe("rangos geográficos y valores finitos", () => {
    const cases: InvalidCase[] = [
      ["latitud mayor que 90", 90.000001, 0],
      ["latitud menor que -90", -90.000001, 0],
      ["longitud mayor que 180", 0, 180.000001],
      ["longitud menor que -180", 0, -180.000001],
      ["NaN", Number.NaN, -79.0016],
      ["infinito numérico", -1.5923, Number.POSITIVE_INFINITY],
      ["infinitos como texto", "Infinity", "-Infinity"],
    ];

    test.each(cases)("rechaza %s", (_name, latitude, longitude) => {
      expect(readMapCoordinate(latitude, longitude)).toBeNull();
    });
  });

  describe("puntos válidos", () => {
    const cases: ValidCase[] = [
      ["números", -1.5923, -79.0016, { latitude: -1.5923, longitude: -79.0016 }],
      [
        "texto con espacios",
        " -1.5923 ",
        " -79.0016 ",
        { latitude: -1.5923, longitude: -79.0016 },
      ],
      ["límites superiores", 90, 180, { latitude: 90, longitude: 180 }],
      ["límites inferiores", -90, -180, { latitude: -90, longitude: -180 }],
      ["cero numérico explícito", 0, 0, { latitude: 0, longitude: 0 }],
      ["cero explícito como texto", "0", "0", { latitude: 0, longitude: 0 }],
    ];

    test.each(cases)("acepta %s", (_name, latitude, longitude, expected) => {
      expect(readMapCoordinate(latitude, longitude)).toEqual(expected);
    });
  });
});
