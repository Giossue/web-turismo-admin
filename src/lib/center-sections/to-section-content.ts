import { toNullableNumber } from "@/lib/values";

import type { CenterSectionCode } from "./definitions";
import type { SectionFormValues } from "./form-types";

/** JSON de un apartado tal como lo guarda `PATCH /admin/centers/:code/sections/:section`. */
export type SectionContent = Record<string, unknown>;

type SectionWriter = (values: SectionFormValues) => SectionContent;

/** Texto recortado o `null` si queda vacío (fechas y valores cerrados opcionales). */
function textOrNull(value: string): string | null {
  return value.trim() || null;
}

/**
 * Meses de una temporada como números 1–12 ordenados y sin repetir (la API
 * rechaza meses repetidos o fuera de rango).
 */
export function parseMonths(months: readonly string[]): number[] {
  const numbers = months
    .map((month) => Number(month.trim()))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);
  return [...new Set(numbers)].sort((a, b) => a - b);
}

const writeAccessibility: SectionWriter = (values) => ({
  localityId: toNullableNumber(values.localityId),
  distanceKm: toNullableNumber(values.distanceKm),
  accessibilityDetails: {
    roads: values.accessibilityRoads.map((road) => ({
      roadTypeId: toNullableNumber(road.roadTypeId),
      typeLabel: road.typeLabel.trim(),
      startLatitude: toNullableNumber(road.startLatitude),
      startLongitude: toNullableNumber(road.startLongitude),
      endLatitude: toNullableNumber(road.endLatitude),
      endLongitude: toNullableNumber(road.endLongitude),
      distanceKm: toNullableNumber(road.distanceKm),
      materialId: toNullableNumber(road.materialId),
      conditionId: toNullableNumber(road.conditionId),
      observation: road.observation.trim(),
    })),
    aquatic: values.accessibilityAquatic.map((access) => ({
      modalityId: toNullableNumber(access.modalityId),
      modalityLabel: access.modalityLabel.trim(),
      departure: access.departure.trim(),
      departureConditionId: toNullableNumber(access.departureConditionId),
      arrival: access.arrival.trim(),
      arrivalConditionId: toNullableNumber(access.arrivalConditionId),
      observation: access.observation.trim(),
    })),
    aerial: values.accessibilityAerial.map((access) => ({
      coverageId: toNullableNumber(access.coverageId),
      coverageLabel: access.coverageLabel.trim(),
      observation: access.observation.trim(),
    })),
    transportTypes: values.accessibilityTransportTypes.map((transport) => ({
      typeId: toNullableNumber(transport.typeId),
      label: transport.label.trim(),
      applies: transport.applies === "SI",
      detailOther: transport.detailOther.trim(),
      observation: transport.observation.trim(),
    })),
    transportDetails: values.accessibilityTransportDetails.map((detail) => ({
      operator: detail.operator.trim(),
      terminal: detail.terminal.trim(),
      frequencyId: toNullableNumber(detail.frequencyId),
      frequencyLabel: detail.frequencyLabel.trim(),
      transferDetail: detail.transferDetail.trim(),
      observation: detail.observation.trim(),
    })),
    criteria: values.accessibilityCriteria.map((criterion) => ({
      accessibilityTypeId: toNullableNumber(criterion.accessibilityTypeId),
      criterionId: toNullableNumber(criterion.criterionId),
      label: criterion.label.trim(),
      response: criterion.response,
      detail: criterion.detail.trim(),
      observation: criterion.observation.trim(),
    })),
    signage: {
      available: values.accessibilitySignage.available,
      conditionId: toNullableNumber(values.accessibilitySignage.conditionId),
      observation: values.accessibilitySignage.observation.trim(),
    },
  },
});

const writeCharacteristics: SectionWriter = (values) => ({
  climate: {
    climateId: toNullableNumber(values.climateId),
    minTemperature: toNullableNumber(values.minTemperature),
    maxTemperature: toNullableNumber(values.maxTemperature),
    minRainfall: toNullableNumber(values.minRainfall),
    maxRainfall: toNullableNumber(values.maxRainfall),
  },
});

const writePlant: SectionWriter = (values) => ({
  plant: values.plant.map((item) => ({
    scope: item.scope,
    typeId: toNullableNumber(item.typeId),
    typeLabel: item.typeLabel.trim(),
    group: item.group.trim(),
    quantity1: toNullableNumber(item.quantity1),
    quantity2: toNullableNumber(item.quantity2),
    quantity3: toNullableNumber(item.quantity3),
    observation: item.observation.trim(),
  })),
  facilitiesDetails: values.facilityDetails.map((item) => ({
    categoryId: toNullableNumber(item.categoryId),
    typeId: toNullableNumber(item.typeId),
    typeLabel: item.typeLabel.trim(),
    quantity: toNullableNumber(item.quantity),
    latitude: toNullableNumber(item.latitude),
    longitude: toNullableNumber(item.longitude),
    administrator: item.administrator.trim(),
    universalAccessibility: item.universalAccessibility,
    conditionId: toNullableNumber(item.conditionId),
    detailOther: item.detailOther.trim(),
    observation: item.observation.trim(),
  })),
  complementaryServices: values.complementaryServices.map((item) => ({
    scope: item.scope,
    typeId: toNullableNumber(item.typeId),
    typeLabel: item.typeLabel.trim(),
    specification: item.specification.trim(),
    observation: item.observation.trim(),
  })),
});

const writeConservation: SectionWriter = (values) => ({
  conservation: {
    attraction: {
      state: values.conservation.attraction.state || null,
      observation: values.conservation.attraction.observation.trim(),
    },
    environment: {
      state: values.conservation.environment.state || null,
      observation: values.conservation.environment.observation.trim(),
    },
    factors: values.conservationFactors.map((factor) => ({
      component: factor.component,
      factorId: toNullableNumber(factor.factorId),
      origin: factor.origin,
      name: factor.name.trim(),
      response: factor.response,
      detailOther: factor.detailOther.trim(),
      observation: factor.observation.trim(),
    })),
  },
  declarations: values.declarations.map((declaration) => ({
    entity: declaration.entity.trim(),
    denomination: declaration.denomination.trim(),
    date: textOrNull(declaration.date),
    scope: declaration.scope.trim(),
    observation: declaration.observation.trim(),
  })),
});

const writeHygieneSafety: SectionWriter = (values) => ({
  hygieneSafety: {
    entries: values.hygieneEntries.map((entry) => ({
      kind: entry.kind,
      scope: entry.scope || null,
      typeId: toNullableNumber(entry.typeId),
      name: entry.name.trim(),
      provider: entry.provider.trim(),
      secondaryId: toNullableNumber(entry.secondaryId),
      secondary: entry.secondary.trim(),
      response: entry.response,
      quantity: toNullableNumber(entry.quantity),
      condition: entry.condition || null,
      observation: entry.observation.trim(),
    })),
    radios: {
      available: values.hygieneRadios.available,
      visitorUse: values.hygieneRadios.visitorUse,
      internalUse: values.hygieneRadios.internalUse,
      emergencyUse: values.hygieneRadios.emergencyUse,
      quantity: toNullableNumber(values.hygieneRadios.quantity),
      observation: values.hygieneRadios.observation.trim(),
    },
    contingency: {
      exists: values.hygieneContingency.exists,
      institution: values.hygieneContingency.institution.trim(),
      document: values.hygieneContingency.document.trim(),
      year: toNullableNumber(values.hygieneContingency.year),
      observation: values.hygieneContingency.observation.trim(),
    },
  },
});

const writePolicies: SectionWriter = (values) => ({
  policies: values.policies.map((policy) => ({
    code: policy.code,
    question: policy.question,
    response: policy.response,
    year: toNullableNumber(policy.year),
    specification: policy.specification.trim(),
    observation: policy.observation.trim(),
  })),
});

const writePromotion: SectionWriter = (values) => ({
  promotion: {
    hasPlan: values.promotion.hasPlan,
    planName: values.promotion.planName.trim(),
    includedInPlan: values.promotion.includedInPlan,
    partOfPackage: values.promotion.partOfPackage,
    packageDetail: values.promotion.packageDetail.trim(),
    observation: values.promotion.observation.trim(),
    media: values.promotionMedia.map((media) => ({
      response: media.response,
      typeId: toNullableNumber(media.typeId),
      name: media.name.trim(),
      url: media.url.trim(),
      periodicity: media.periodicity.trim(),
      detailOther: media.detailOther.trim(),
      observation: media.observation.trim(),
    })),
  },
});

const writeVisitors: SectionWriter = (values) => ({
  visitors: {
    registry: {
      exists: values.visitorRegistry.exists,
      type: values.visitorRegistry.type || null,
      years: toNullableNumber(values.visitorRegistry.years),
      reports: values.visitorRegistry.reports,
      frequency: values.visitorRegistry.frequency.trim(),
      observation: values.visitorRegistry.observation.trim(),
    },
    seasons: values.visitorSeasons.map((season) => ({
      type: season.type,
      quantity: toNullableNumber(season.quantity),
      year: toNullableNumber(season.year),
      months: parseMonths(season.months),
      observation: season.observation.trim(),
    })),
    origins: values.visitorOrigins.map((origin) => ({
      type: origin.type,
      place: origin.place.trim(),
      month: toNullableNumber(origin.month),
      year: toNullableNumber(origin.year),
      quantity: toNullableNumber(origin.quantity),
      observation: origin.observation.trim(),
    })),
    informants: values.visitorInformants.map((informant) => ({
      name: informant.name.trim(),
      contact: informant.contact.trim(),
      observation: informant.observation.trim(),
    })),
    influx: {
      weekday: toNullableNumber(values.visitorInflux.weekday),
      weekend: toNullableNumber(values.visitorInflux.weekend),
      holidays: toNullableNumber(values.visitorInflux.holidays),
      frequency: values.visitorInflux.frequency || null,
      observation: values.visitorInflux.observation.trim(),
    },
  },
});

const writeHumanResources: SectionWriter = (values) => ({
  humanResources: {
    summary: {
      administrationOperation: toNullableNumber(
        values.humanResourceSummary.administrationOperation,
      ),
      specializedTourism: toNullableNumber(values.humanResourceSummary.specializedTourism),
      observation: values.humanResourceSummary.observation.trim(),
    },
    training: values.humanResourceTraining.map((training) => ({
      group: training.group,
      typeId: toNullableNumber(training.typeId),
      name: training.name.trim(),
      quantity: toNullableNumber(training.quantity),
      detailOther: training.detailOther.trim(),
      observation: training.observation.trim(),
    })),
  },
});

const writeAnnexes: SectionWriter = (values) => ({
  annexes: {
    documents: values.annexDocuments.map((document) => ({
      fileId: toNullableNumber(document.fileId),
      type: document.type.trim(),
      source: document.source.trim(),
      author: document.author.trim(),
      description: document.description.trim(),
      visibility: document.visibility,
      observation: document.observation.trim(),
    })),
    responsibles: values.annexResponsibles.map((responsible) => ({
      typeId: toNullableNumber(responsible.typeId),
      name: responsible.name.trim(),
      role: responsible.role.trim(),
      institution: responsible.institution.trim(),
      phone: responsible.phone.trim(),
      email: responsible.email.trim(),
      observation: responsible.observation.trim(),
    })),
    accessibilitySurvey: {
      date: textOrNull(values.accessibilitySurvey.date),
      responsible: values.accessibilitySurvey.responsible.trim(),
      scope: values.accessibilitySurvey.scope.trim(),
      observation: values.accessibilitySurvey.observation.trim(),
    },
    gadValidation: {
      acceptance: values.gadValidation.acceptance,
      name: values.gadValidation.name.trim(),
      institution: values.gadValidation.institution.trim(),
      position: values.gadValidation.position.trim(),
      phone: values.gadValidation.phone.trim(),
      email: values.gadValidation.email.trim(),
      date: textOrNull(values.gadValidation.date),
      observation: values.gadValidation.observation.trim(),
    },
  },
});

/** Bloques propios de cada apartado; el resto solo guarda respuesta, observación y filas. */
const sectionWriters: Partial<Record<CenterSectionCode, SectionWriter>> = {
  accesibilidad: writeAccessibility,
  caracteristicas: writeCharacteristics,
  planta: writePlant,
  conservacion: writeConservation,
  "higiene-seguridad": writeHygieneSafety,
  politicas: writePolicies,
  promocion: writePromotion,
  visitantes: writeVisitors,
  "recurso-humano": writeHumanResources,
  anexos: writeAnnexes,
};

/**
 * Arma el JSON que se guarda para un apartado. Solo incluye los bloques del
 * propio apartado; `createSectionValues` lo lee de vuelta sin pérdidas.
 */
export function toSectionContent(
  sectionCode: CenterSectionCode,
  values: SectionFormValues,
): SectionContent {
  return {
    schemaVersion: 1,
    response: values.response,
    observation: values.observation.trim(),
    ...sectionWriters[sectionCode]?.(values),
    rows: values.rows.map((row) => ({
      label: row.label.trim(),
      response: row.response,
      quantity: toNullableNumber(row.quantity),
      observation: row.observation.trim(),
    })),
  };
}
