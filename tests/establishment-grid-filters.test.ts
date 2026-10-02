import { describe, expect, test } from "bun:test";

import {
  changeEstablishmentFilter,
  emptyEstablishmentFilters,
  establishmentFilterOptions,
  establishmentFiltersToQuery,
  isEstablishmentFilterAvailable,
  type EstablishmentFilterValues,
} from "@/components/admin/establishment-grid-filter-state";
import type { AdminCatalogs } from "@/lib/admin-api";

const filters: EstablishmentFilterValues = {
  provinceId: "2",
  cantonId: "21",
  localityId: "5",
  activity: "Alojamiento",
  classification: "Hotel",
  category: "3 estrellas",
  active: "false",
};

const catalogs = {
  provinces: [
    { id: 2, name: "Bolívar" },
    { id: 9, name: "Guayas" },
  ],
  cantons: [
    { id: 21, name: "Guaranda", provinceId: 2 },
    { id: 91, name: "Guayaquil", provinceId: 9 },
  ],
  localities: [
    { id: 5, name: "Guaranda", provinceId: 2, cantonId: 21 },
    { id: 6, name: "Guayaquil", provinceId: 9, cantonId: 91 },
  ],
  establishmentActivities: [
    { id: 1, name: "Alojamiento" },
    { id: 2, name: "Alimentos y bebidas" },
  ],
  establishmentClassifications: [
    { id: 10, name: "Hotel", activityId: 1 },
    { id: 20, name: "Restaurante", activityId: 2 },
  ],
  establishmentCategories: [
    { id: 100, name: "3 estrellas", classificationId: 10 },
    { id: 200, name: "3 tenedores", classificationId: 20 },
  ],
} as unknown as AdminCatalogs;

describe("filtros del Data Grid de catastro", () => {
  test("envía los siete filtros combinados y conserva el estado inactivo", () => {
    expect(establishmentFiltersToQuery(filters)).toEqual({
      provinceId: 2,
      cantonId: 21,
      localityId: 5,
      activity: "Alojamiento",
      classification: "Hotel",
      category: "3 estrellas",
      active: false,
    });
    expect(Object.values(filters).filter(Boolean)).toHaveLength(7);
    expect(establishmentFiltersToQuery(emptyEstablishmentFilters).active).toBeUndefined();
  });

  test("cambiar o quitar la provincia limpia cantón y localidad, conservando otros criterios", () => {
    for (const provinceId of ["9", ""]) {
      expect(changeEstablishmentFilter(filters, "provinceId", provinceId)).toEqual({
        ...filters,
        provinceId,
        cantonId: "",
        localityId: "",
      });
    }
    expect(changeEstablishmentFilter(filters, "cantonId", "91")).toEqual({
      ...filters,
      cantonId: "91",
      localityId: "",
    });
  });

  test("cambiar actividad limpia clasificación y categoría en la misma consulta", () => {
    expect(changeEstablishmentFilter(filters, "activity", "Alimentos y bebidas")).toEqual(
      {
        ...filters,
        activity: "Alimentos y bebidas",
        classification: "",
        category: "",
      },
    );
    expect(changeEstablishmentFilter(filters, "classification", "")).toEqual({
      ...filters,
      classification: "",
      category: "",
    });
    expect(changeEstablishmentFilter(filters, "active", "true")).toEqual({
      ...filters,
      active: "true",
    });
  });

  test("muestra valores de catálogos compatibles con los filtros anteriores", () => {
    expect(establishmentFilterOptions("cantonId", filters, catalogs)).toEqual([
      { value: "21", label: "Guaranda" },
    ]);
    expect(establishmentFilterOptions("localityId", filters, catalogs)).toEqual([
      { value: "5", label: "Guaranda" },
    ]);
    expect(establishmentFilterOptions("classification", filters, catalogs)).toEqual([
      { value: "Hotel", label: "Hotel" },
    ]);
    expect(establishmentFilterOptions("category", filters, catalogs)).toEqual([
      { value: "3 estrellas", label: "3 estrellas" },
    ]);
    expect(establishmentFilterOptions("activity", filters, undefined)).toEqual([]);
    expect(
      establishmentFilterOptions("classification", filters, {} as AdminCatalogs),
    ).toEqual([]);
  });

  test("cantón, clasificación y categoría requieren sus filtros padres", () => {
    for (const field of ["cantonId", "classification", "category"] as const) {
      expect(isEstablishmentFilterAvailable(field, emptyEstablishmentFilters)).toBe(
        false,
      );
      expect(isEstablishmentFilterAvailable(field, filters)).toBe(true);
    }
    expect(isEstablishmentFilterAvailable("localityId", emptyEstablishmentFilters)).toBe(
      true,
    );
  });
});
