import { describe, expect, test } from "bun:test";

import type { AdminCatalogs, AdminCenterDetail, CenterDraft } from "@/lib/admin-api";
import { emptyCenterFormValues, isReadyToCreate } from "@/lib/center-form";
import {
  centerCatalogOptions,
  mergeImportedValues,
  sanitizeFormValues,
  toFormValues,
  toPayload,
  withEditorDraft,
} from "@/lib/center-form-mappers";

const catalogs = {
  categories: [
    { id: 1, name: "Manifestaciones culturales" },
    { id: 2, name: "Atractivos naturales" },
  ],
  types: [
    { id: 10, name: "Arquitectura", categoryId: 1 },
    { id: 20, name: "Bosque", categoryId: 2 },
  ],
  subtypes: [
    { id: 100, name: "Religiosa", typeId: 10 },
    { id: 200, name: "Nublado", typeId: 20 },
  ],
  provinces: [
    { id: 2, name: "Bolívar" },
    { id: 9, name: "Guayas" },
  ],
  cantons: [
    { id: 21, name: "Guaranda", provinceId: 2 },
    { id: 91, name: "Guayaquil", provinceId: 9 },
  ],
  parishes: [
    { id: 211, name: "Guanujo", cantonId: 21 },
    { id: 911, name: "Tarqui", cantonId: 91 },
  ],
  localities: [
    { id: 5, name: "Guaranda", provinceId: 2, cantonId: 21 },
    { id: 6, name: "Guayaquil", provinceId: 9, cantonId: 91 },
  ],
  zones: [
    { id: 50, name: "Zona Guaranda", localityId: 5 },
    { id: 60, name: "Zona Guayaquil", localityId: 6 },
  ],
  activities: [
    { id: 7, name: "Fotografía", categoryId: 1 },
    { id: 8, name: "Senderismo", categoryId: 2 },
  ],
} as unknown as AdminCatalogs;

const draft: CenterDraft = {
  name: "Santuario del Guayco",
  subtypeId: 100,
  touristZoneId: 50,
  parishId: 211,
  productLineId: 3,
  scenarioId: 4,
  hierarchyId: 1,
  latitude: -1.67041,
  longitude: -79.06123,
  altitudeMeters: 2138,
  description: "  Iglesia  ",
  admission: {
    incomeTypeId: 1,
    attentionModeId: 2,
    priceFrom: 1.5,
    reservations: true,
  },
  activities: [
    { activityId: 7, active: true },
    { activityId: 8, active: true },
    { activityId: 9, active: false },
  ],
  accessibility: [
    { typeId: 1, applies: true },
    { typeId: 2, applies: false },
  ],
  facilities: [{ typeId: 30, quantity: 2, observation: "Baños" }],
};

describe("toFormValues", () => {
  test("deriva la clasificación y el territorio desde subtipo y parroquia", () => {
    const values = toFormValues(draft, catalogs);
    expect(values).toMatchObject({
      categoryId: "1",
      typeId: "10",
      subtypeId: "100",
      provinceId: "2",
      cantonId: "21",
      parishId: "211",
      touristZoneId: "50",
      latitude: "-1.67041",
      altitudeMeters: "2138",
    });
    expect(values.admission.priceFrom).toBe("1.5");
    expect(values.admission.priceTo).toBe("");
    expect(values.accessibilityIds).toEqual(["1"]);
    expect(values.facilityQuantities).toEqual({ "30": "2" });
    expect(values.facilityObservations).toEqual({ "30": "Baños" });
  });

  test("descarta actividades de otra categoría y zonas fuera del cantón", () => {
    const values = toFormValues({ ...draft, touristZoneId: 60 }, catalogs);
    expect(values.activityIds).toEqual(["7"]);
    expect(values.touristZoneId).toBe("");
  });

  test("sin datos devuelve el formulario vacío", () => {
    expect(toFormValues(null, catalogs)).toEqual(emptyCenterFormValues);
  });
});

describe("sanitizeFormValues", () => {
  test("limpia dependientes incoherentes en cascada", () => {
    const values = sanitizeFormValues(
      {
        ...emptyCenterFormValues,
        categoryId: "2",
        typeId: "10",
        subtypeId: "100",
        provinceId: "9",
        cantonId: "21",
        parishId: "211",
        touristZoneId: "50",
        activityIds: ["7", "8"],
      },
      catalogs,
    );
    expect(values).toMatchObject({
      typeId: "",
      subtypeId: "",
      cantonId: "",
      parishId: "",
      touristZoneId: "",
      activityIds: ["8"],
    });
  });
});

describe("centerCatalogOptions", () => {
  test("filtra las opciones por la selección actual", () => {
    const options = centerCatalogOptions(catalogs, {
      categoryId: "1",
      typeId: "10",
      provinceId: "2",
      cantonId: "21",
    });
    expect(options.types.map((option) => option.id)).toEqual([10]);
    expect(options.subtypes.map((option) => option.id)).toEqual([100]);
    expect(options.cantons.map((option) => option.id)).toEqual([21]);
    expect(options.parishes.map((option) => option.id)).toEqual([211]);
    expect(options.zones.map((option) => option.id)).toEqual([50]);
    expect(options.activities.map((option) => option.id)).toEqual([7]);
  });

  test("sin cantón no ofrece zonas turísticas", () => {
    const options = centerCatalogOptions(catalogs, {
      categoryId: "",
      typeId: "",
      provinceId: "2",
      cantonId: "",
    });
    expect(options.zones).toEqual([]);
    expect(options.types).toEqual([]);
  });
});

describe("toPayload", () => {
  test("convierte textos a números, recorta y omite campos vacíos", () => {
    const values = toFormValues(draft, catalogs);
    const payload = toPayload(
      { ...values, activityIds: ["7", "8"], facilityQuantities: { "30": "" } },
      catalogs,
      4,
    );
    expect(payload).toMatchObject({
      name: "Santuario del Guayco",
      subtypeId: 100,
      touristZoneId: 50,
      latitude: -1.67041,
      description: "Iglesia",
      administration: undefined,
      activities: [{ activityId: 7, active: true }],
      facilities: [{ typeId: 30, quantity: 1, observation: "Baños" }],
      version: 4,
    });
    expect(payload.admission).toMatchObject({
      incomeTypeId: 1,
      attentionModeId: 2,
      priceFrom: 1.5,
      priceTo: undefined,
      reservations: true,
    });
  });

  test("omite el ingreso sin tipo o modalidad y usa OTRO como tipo de administrador", () => {
    const payload = toPayload(
      {
        ...emptyCenterFormValues,
        administration: { ...emptyCenterFormValues.administration, name: " Ana " },
        admission: { ...emptyCenterFormValues.admission, incomeTypeId: "1" },
      },
      null,
    );
    expect(payload.admission).toBeUndefined();
    expect(payload.administration).toMatchObject({ type: "OTRO", name: "Ana" });
    expect(payload.version).toBeUndefined();
  });
});

describe("mergeImportedValues", () => {
  test("conserva los campos sin fuente en la ficha y limpia ids incoherentes", () => {
    const current = toFormValues(draft, catalogs);
    const merged = mergeImportedValues(
      current,
      { name: "Importado", categoryId: "2", typeId: "20", activityIds: ["7", "8"] },
      catalogs,
    );
    expect(merged.name).toBe("Importado");
    expect(merged.touristZoneId).toBe("50");
    expect(merged.hierarchyId).toBe("1");
    expect(merged.subtypeId).toBe("");
    expect(merged.activityIds).toEqual(["8"]);
  });
});

describe("isReadyToCreate", () => {
  const complete = {
    ...emptyCenterFormValues,
    name: "Ficha",
    categoryId: "1",
    typeId: "10",
    subtypeId: "100",
    provinceId: "2",
    cantonId: "21",
    parishId: "211",
    touristZoneId: "50",
    productLineId: "3",
    scenarioId: "4",
    latitude: "-1.6",
    longitude: "-79",
  };

  test("exige identificación completa y coordenadas válidas", () => {
    expect(isReadyToCreate(complete)).toBe(true);
    expect(isReadyToCreate({ ...complete, touristZoneId: "" })).toBe(false);
    expect(isReadyToCreate({ ...complete, latitude: "" })).toBe(false);
    expect(isReadyToCreate({ ...complete, longitude: "-181" })).toBe(false);
    expect(isReadyToCreate({ ...complete, name: "x".repeat(181) })).toBe(false);
  });
});

describe("withEditorDraft", () => {
  const detail: AdminCenterDetail = {
    code: "C-1",
    status: { code: "BORRADOR", name: "Borrador" },
    baseStatus: { code: "BORRADOR", name: "Borrador" },
    active: true,
    publishedAt: null,
    version: 3,
    published: { ...draft, sections: { conservacion: { response: "NO" } } },
    draft: { ...draft, description: "", accessibility: [], sections: {} },
    review: null,
  };

  test("combina secciones publicadas y marca las cubiertas por el formulario", () => {
    const sections = withEditorDraft(detail).draft?.sections ?? {};
    expect(sections.conservacion).toEqual({ response: "NO" });
    expect(sections.identificacion).toEqual({
      schemaVersion: 1,
      response: "SI",
      observation: "",
    });
    expect(sections["ubicacion-admin"]).toBeDefined();
    expect(sections.planta).toBeDefined();
    expect(sections.descripcion).toBeUndefined();
    expect(sections.accesibilidad).toBeUndefined();
  });

  test("sin borrador devuelve el detalle sin cambios", () => {
    const published = { ...detail, draft: null };
    expect(withEditorDraft(published)).toBe(published);
  });
});
