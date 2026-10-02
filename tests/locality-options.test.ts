import { describe, expect, test } from "bun:test";

import type { AdminCatalogs } from "@/lib/admin-api";
import { localityOptions } from "@/lib/locality-options";

const catalogs: Pick<AdminCatalogs, "localities" | "cantons" | "provinces"> = {
  provinces: [
    { id: 1, name: "Bolívar" },
    { id: 2, name: "Pichincha" },
    { id: 3, name: "Carchi" },
  ],
  cantons: [
    { id: 11, name: "Guaranda", provinceId: 1 },
    { id: 22, name: "Quito", provinceId: 2 },
    { id: 33, name: "Tulcán", provinceId: 3 },
  ],
  localities: [
    { id: 100, name: "Guaranda", cantonId: 11, provinceId: 1 },
    { id: 200, name: "San José", cantonId: 22, provinceId: 2 },
    { id: 300, name: "San José", cantonId: 33 },
  ],
};

describe("opciones nacionales de localidad", () => {
  test("distingue nombres repetidos con cantón y provincia y conserva su id", () => {
    const options = localityOptions(catalogs);
    expect(options.map((option) => [option.id, option.displayName])).toEqual([
      [100, "Guaranda — Guaranda, Bolívar"],
      [200, "San José — Quito, Pichincha"],
      [300, "San José — Tulcán, Carchi"],
    ]);
    expect(catalogs.localities.every((option) => option.displayName === undefined)).toBe(
      true,
    );
  });

  test("soporta catálogos cargando y una localidad sin referencias geográficas", () => {
    expect(localityOptions(undefined)).toEqual([]);
    expect(
      localityOptions({
        provinces: [],
        cantons: [],
        localities: [{ id: 1, name: "Localidad registrada", cantonId: 99 }],
      }),
    ).toEqual([
      {
        id: 1,
        name: "Localidad registrada",
        displayName: "Localidad registrada",
        cantonId: 99,
      },
    ]);
  });
});
