import { describe, expect, test } from "bun:test";

import { createSectionValues } from "@/lib/center-sections/create-section-values";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
  type SectionDefinition,
} from "@/lib/center-sections/definitions";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { EMPTY_RESPONSE, POLICY_DEFINITIONS } from "@/lib/center-sections/options";
import { parseMonths, toSectionContent } from "@/lib/center-sections/to-section-content";

function definitionOf(code: CenterSectionCode): SectionDefinition {
  const definition = centerSectionDefinitions.find((item) => item.code === code);
  if (!definition) throw new Error(`Apartado desconocido: ${code}`);
  return definition;
}

/**
 * Valores realistas del bloque propio de cada apartado. El resto de campos
 * queda con los valores por defecto porque `toSectionContent` solo escribe
 * los bloques del apartado que se guarda.
 */
const sectionFixtures: Record<CenterSectionCode, Partial<SectionFormValues>> = {
  identificacion: {},
  "ubicacion-admin": {},
  caracteristicas: {
    climateId: "3",
    minTemperature: "-2.5",
    maxTemperature: "18",
    minRainfall: "0",
    maxRainfall: "1200.5",
  },
  accesibilidad: {
    localityId: "12",
    distanceKm: "4.5",
    accessibilityRoads: [
      {
        roadTypeId: "2",
        typeLabel: "",
        startLatitude: "-1.5923",
        startLongitude: "-79.0021",
        endLatitude: "-1.601",
        endLongitude: "-78.998",
        distanceKm: "3.2",
        materialId: "4",
        conditionId: "1",
        observation: "Tramo lastrado en la última curva",
      },
      {
        roadTypeId: "",
        typeLabel: "Sendero comunitario",
        startLatitude: "",
        startLongitude: "",
        endLatitude: "",
        endLongitude: "",
        distanceKm: "",
        materialId: "",
        conditionId: "",
        observation: "",
      },
    ],
    accessibilityAquatic: [
      {
        modalityId: "",
        modalityLabel: "Canoa",
        departure: "Muelle de Echeandía",
        departureConditionId: "2",
        arrival: "Playa del río",
        arrivalConditionId: "3",
        observation: "Solo en invierno",
      },
    ],
    accessibilityAerial: [
      { coverageId: "1", coverageLabel: "", observation: "Aeropuerto regional" },
    ],
    accessibilityTransportTypes: [
      {
        typeId: "5",
        label: "",
        applies: "SI",
        detailOther: "",
        observation: "Buses cada hora",
      },
      {
        typeId: "",
        label: "Camioneta de alquiler",
        applies: "NO",
        detailOther: "Solo bajo pedido",
        observation: "",
      },
    ],
    accessibilityTransportDetails: [
      {
        operator: "Cooperativa Flota Bolívar",
        terminal: "Terminal de Guaranda",
        frequencyId: "2",
        frequencyLabel: "",
        transferDetail: "Guaranda - Salinas",
        observation: "",
      },
    ],
    accessibilityCriteria: [
      {
        accessibilityTypeId: "1",
        criterionId: "7",
        label: "",
        response: "SI",
        detail: "Rampa en el ingreso",
        observation: "",
      },
      {
        accessibilityTypeId: "",
        criterionId: "",
        label: "Baño adaptado",
        response: "NO",
        detail: "",
        observation: "En construcción",
      },
    ],
    accessibilitySignage: {
      available: "SI",
      conditionId: "2",
      observation: "Letreros desde la vía principal",
    },
  },
  planta: {
    plant: [
      {
        scope: "EN_ATRACTIVO",
        typeId: "3",
        typeLabel: "",
        group: "Alojamiento",
        quantity1: "4",
        quantity2: "0",
        quantity3: "",
        observation: "Cabañas familiares",
      },
      {
        scope: "EN_POBLADO_CERCANO",
        typeId: "",
        typeLabel: "Picantería",
        group: "",
        quantity1: "2",
        quantity2: "",
        quantity3: "",
        observation: "",
      },
    ],
    facilityDetails: [
      {
        categoryId: "1",
        typeId: "9",
        typeLabel: "",
        quantity: "2",
        latitude: "-1.59",
        longitude: "-79.01",
        administrator: "GAD parroquial",
        universalAccessibility: "NO",
        conditionId: "1",
        detailOther: "",
        observation: "Miradores",
      },
    ],
    complementaryServices: [
      {
        scope: "EN_POBLADO_CERCANO",
        typeId: "",
        typeLabel: "Cajero automático",
        specification: "Banco del Pacífico",
        observation: "",
      },
    ],
  },
  conservacion: {
    conservation: {
      attraction: { state: "ALTERADO", observation: "Erosión en senderos" },
      environment: { state: "", observation: "" },
    },
    conservationFactors: [
      {
        component: "ENTORNO",
        factorId: "4",
        origin: "ANTROPICO",
        name: "",
        response: "SI",
        detailOther: "Basura en la orilla",
        observation: "",
      },
    ],
    declarations: [
      {
        entity: "Ministerio de Turismo",
        denomination: "Patrimonio natural",
        date: "2019-05-12",
        scope: "Nacional",
        observation: "",
      },
      {
        entity: "GAD Guaranda",
        denomination: "Área de conservación",
        date: "",
        scope: "",
        observation: "Pendiente de registro oficial",
      },
    ],
  },
  "higiene-seguridad": {
    hygieneEntries: [
      {
        kind: "BASIC_SERVICE",
        scope: "EN_ATRACTIVO",
        typeId: "2",
        name: "",
        provider: "Junta de agua",
        secondaryId: "",
        secondary: "Agua entubada",
        response: "SI",
        quantity: "1",
        condition: "BUENO",
        observation: "",
      },
      {
        kind: "SIGNAGE",
        scope: "",
        typeId: "6",
        name: "",
        provider: "",
        secondaryId: "3",
        secondary: "",
        response: "SI",
        quantity: "4",
        condition: "REGULAR",
        observation: "Letreros de madera",
      },
      {
        kind: "THREAT",
        scope: "",
        typeId: "",
        name: "Deslizamientos",
        provider: "",
        secondaryId: "",
        secondary: "",
        response: "NO",
        quantity: "",
        condition: "",
        observation: "",
      },
    ],
    hygieneRadios: {
      available: "SI",
      visitorUse: "NO",
      internalUse: "SI",
      emergencyUse: "SIN_INFORMACION",
      quantity: "3",
      observation: "Motorola",
    },
    hygieneContingency: {
      exists: "SI",
      institution: "Secretaría de Riesgos",
      document: "Plan 2024",
      year: "2024",
      observation: "",
    },
  },
  politicas: {
    policies: POLICY_DEFINITIONS.map(({ code, question }, index) => ({
      code,
      question,
      response: index === 0 ? "SI" : index === 1 ? "NO" : EMPTY_RESPONSE,
      year: index === 0 ? "2021" : "",
      specification: index === 0 ? "PDOT 2020-2030" : "",
      observation: index === 3 ? "Sin ordenanza vigente" : "",
    })),
  },
  actividades: {},
  promocion: {
    promotion: {
      hasPlan: "SI",
      planName: "Plan Bolívar Turístico",
      includedInPlan: "NO",
      partOfPackage: "SI",
      packageDetail: "Ruta del queso",
      observation: "",
    },
    promotionMedia: [
      {
        response: "SI",
        typeId: "2",
        name: "@guayco",
        url: "https://example.org/guayco",
        periodicity: "Semanal",
        detailOther: "",
        observation: "",
      },
    ],
  },
  visitantes: {
    visitorRegistry: {
      exists: "SI",
      type: "DIGITAL",
      years: "5",
      reports: "SI",
      frequency: "Mensual",
      observation: "",
    },
    visitorSeasons: [
      {
        type: "ALTA",
        quantity: "1200",
        year: "2024",
        months: ["1", "7", "8", "12"],
        observation: "Vacaciones",
      },
      { type: "BAJA", quantity: "0", year: "", months: [], observation: "" },
    ],
    visitorOrigins: [
      {
        type: "EXTRANJERA",
        place: "Colombia",
        month: "8",
        year: "2024",
        quantity: "40",
        observation: "",
      },
    ],
    visitorInformants: [
      { name: "María Chela", contact: "0999999999", observation: "Guardaparque" },
    ],
    visitorInflux: {
      weekday: "15",
      weekend: "80",
      holidays: "200",
      frequency: "ESTACIONAL",
      observation: "",
    },
  },
  "recurso-humano": {
    humanResourceSummary: {
      administrationOperation: "3",
      specializedTourism: "1",
      observation: "Personal de la comuna",
    },
    humanResourceTraining: [
      {
        group: "IDIOMA",
        typeId: "",
        name: "Inglés básico",
        quantity: "2",
        detailOther: "",
        observation: "",
      },
    ],
  },
  descripcion: {},
  anexos: {
    annexDocuments: [
      {
        fileId: "31",
        type: "Mapa de acceso",
        source: "GAD",
        author: "Equipo técnico",
        description: "Mapa de vías",
        visibility: "PUBLICA",
        observation: "",
      },
    ],
    annexResponsibles: [
      {
        typeId: "1",
        name: "Ana Pérez",
        role: "Técnica",
        institution: "UEB",
        phone: "032222222",
        email: "ana@example.org",
        observation: "",
      },
    ],
    accessibilitySurvey: {
      date: "2026-05-22",
      responsible: "Luis Gómez",
      scope: "Ingreso y senderos",
      observation: "",
    },
    gadValidation: {
      acceptance: "SI",
      name: "Pedro Ruiz",
      institution: "GAD Guaranda",
      position: "Director de turismo",
      phone: "032222223",
      email: "turismo@example.org",
      date: "2026-06-01",
      observation: "",
    },
  },
};

function fixtureValues(definition: SectionDefinition): SectionFormValues {
  return {
    ...createSectionValues(definition),
    response: "SI",
    observation: `Observación de ${definition.title}`,
    rows:
      definition.suggestedRows.length > 0
        ? [
            {
              label: definition.suggestedRows[0],
              response: "SI",
              quantity: "2",
              observation: "Registrada en campo",
            },
            { label: "Fila adicional", response: "NO_APLICA", quantity: "", observation: "" },
          ]
        : [],
    ...sectionFixtures[definition.code],
  };
}

describe("createSectionValues(toSectionContent(values))", () => {
  test("hay datos de prueba para los 14 apartados", () => {
    expect(Object.keys(sectionFixtures).sort()).toEqual(
      centerSectionDefinitions.map((definition) => definition.code).sort(),
    );
  });

  for (const definition of centerSectionDefinitions) {
    test(`conserva todos los datos de "${definition.code}"`, () => {
      const values = fixtureValues(definition);
      const content = toSectionContent(definition.code, values);
      // El contenido pasa por JSON igual que al guardarlo en la API.
      const saved: unknown = JSON.parse(JSON.stringify(content));
      expect(createSectionValues(definition, saved)).toEqual(values);
    });
  }
});

describe("lectura del contenido guardado", () => {
  test("lee el detalle de accesibilidad desde el primer nivel del apartado", () => {
    const values = createSectionValues(definitionOf("accesibilidad"), {
      response: "SI",
      accessibilityDetails: {
        roads: [{ roadTypeId: 2, typeLabel: "", distanceKm: 3 }],
        transportTypes: [{ typeId: 5, applies: false }],
        criteria: [{ criterionId: 7, response: "SI" }],
        signage: { available: "NO", conditionId: 1 },
      },
    });
    expect(values.accessibilityRoads).toHaveLength(1);
    expect(values.accessibilityRoads[0]?.roadTypeId).toBe("2");
    expect(values.accessibilityRoads[0]?.distanceKm).toBe("3");
    expect(values.accessibilityTransportTypes[0]?.applies).toBe("NO");
    expect(values.accessibilityCriteria[0]?.criterionId).toBe("7");
    expect(values.accessibilitySignage).toEqual({
      available: "NO",
      conditionId: "1",
      observation: "",
    });
  });

  test("sin contenido usa las filas sugeridas y respuestas sin información", () => {
    const definition = definitionOf("visitantes");
    const values = createSectionValues(definition);
    expect(values.response).toBe(EMPTY_RESPONSE);
    expect(values.rows.map((row) => row.label)).toEqual([...definition.suggestedRows]);
    expect(values.policies.map((policy) => policy.code)).toEqual(
      POLICY_DEFINITIONS.map((policy) => policy.code),
    );
  });

  test("descarta valores cerrados desconocidos", () => {
    const values = createSectionValues(definitionOf("higiene-seguridad"), {
      hygieneSafety: {
        entries: [{ kind: "OTRO", scope: "LEJOS", condition: "EXCELENTE", response: "X" }],
      },
    });
    expect(values.hygieneEntries[0]).toMatchObject({
      kind: "BASIC_SERVICE",
      scope: "",
      condition: "",
      response: EMPTY_RESPONSE,
    });
  });
});

describe("parseMonths", () => {
  test("ordena, quita repetidos y descarta meses fuera de 1–12", () => {
    expect(parseMonths(["12", "1", " 7 ", "1", "13", "0", "abc", ""])).toEqual([1, 7, 12]);
  });
});
