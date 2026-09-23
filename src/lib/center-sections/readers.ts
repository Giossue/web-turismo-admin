import type {
  AccessibilityAerialForm,
  AccessibilityAquaticForm,
  AccessibilityCriterionForm,
  AccessibilityRoadForm,
  AccessibilitySignageForm,
  AccessibilitySurveyForm,
  AccessibilityTransportDetailForm,
  AccessibilityTransportTypeForm,
  AnnexDocumentForm,
  AnnexResponsibleForm,
  ComplementaryServiceForm,
  ConservationComponentForm,
  ConservationDeclarationForm,
  ConservationFactorForm,
  FacilityDetailForm,
  GadValidationForm,
  HumanResourceSummaryForm,
  HumanResourceTrainingForm,
  HygieneContingencyForm,
  HygieneEntryForm,
  HygieneRadiosForm,
  PlantForm,
  PolicyForm,
  PromotionForm,
  PromotionMediaForm,
  SectionRowForm,
  VisitorInfluxForm,
  VisitorInformantForm,
  VisitorOriginForm,
  VisitorRegistryForm,
  VisitorSeasonForm,
} from "./form-types";
import {
  ANNEX_VISIBILITY_OPTIONS,
  CONSERVATION_COMPONENT_OPTIONS,
  CONSERVATION_ORIGIN_OPTIONS,
  CONSERVATION_STATE_OPTIONS,
  HYGIENE_CONDITION_OPTIONS,
  HYGIENE_ENTRY_OPTIONS,
  POLICY_DEFINITIONS,
  SERVICE_SCOPE_OPTIONS,
  TRAINING_GROUP_OPTIONS,
  VISITOR_FREQUENCY_OPTIONS,
  VISITOR_ORIGIN_OPTIONS,
  VISITOR_REGISTRY_TYPE_OPTIONS,
  VISITOR_SEASON_OPTIONS,
} from "./options";
import {
  asRecord,
  readEnum,
  readNumeric,
  readResponse,
  readString,
  readStrings,
  type JsonRecord,
} from "./read-helpers";

/**
 * Lectores de cada bloque del JSON de un apartado. Reciben el objeto del
 * bloque (o de la fila) ya extraído; `create-section-values.ts` decide de qué
 * clave sale cada uno.
 */

export function readRow(item: JsonRecord): SectionRowForm {
  return {
    label: readString(item, "label"),
    response: readResponse(item, "response"),
    quantity: readNumeric(item, "quantity"),
    observation: readString(item, "observation"),
  };
}

// Accesibilidad (`accessibilityDetails`)

export function readRoad(item: JsonRecord): AccessibilityRoadForm {
  return {
    roadTypeId: readNumeric(item, "roadTypeId"),
    typeLabel: readString(item, "typeLabel"),
    startLatitude: readNumeric(item, "startLatitude"),
    startLongitude: readNumeric(item, "startLongitude"),
    endLatitude: readNumeric(item, "endLatitude"),
    endLongitude: readNumeric(item, "endLongitude"),
    distanceKm: readNumeric(item, "distanceKm"),
    materialId: readNumeric(item, "materialId"),
    conditionId: readNumeric(item, "conditionId"),
    observation: readString(item, "observation"),
  };
}

export function readAquaticAccess(item: JsonRecord): AccessibilityAquaticForm {
  return {
    modalityId: readNumeric(item, "modalityId"),
    modalityLabel: readString(item, "modalityLabel"),
    departure: readString(item, "departure"),
    departureConditionId: readNumeric(item, "departureConditionId"),
    arrival: readString(item, "arrival"),
    arrivalConditionId: readNumeric(item, "arrivalConditionId"),
    observation: readString(item, "observation"),
  };
}

export function readAerialAccess(item: JsonRecord): AccessibilityAerialForm {
  return {
    coverageId: readNumeric(item, "coverageId"),
    coverageLabel: readString(item, "coverageLabel"),
    observation: readString(item, "observation"),
  };
}

export function readTransportType(item: JsonRecord): AccessibilityTransportTypeForm {
  return {
    typeId: readNumeric(item, "typeId"),
    label: readString(item, "label"),
    applies: item.applies === false ? "NO" : "SI",
    detailOther: readString(item, "detailOther"),
    observation: readString(item, "observation"),
  };
}

export function readTransportDetail(item: JsonRecord): AccessibilityTransportDetailForm {
  return {
    operator: readString(item, "operator"),
    terminal: readString(item, "terminal"),
    frequencyId: readNumeric(item, "frequencyId"),
    frequencyLabel: readString(item, "frequencyLabel"),
    transferDetail: readString(item, "transferDetail"),
    observation: readString(item, "observation"),
  };
}

export function readCriterion(item: JsonRecord): AccessibilityCriterionForm {
  return {
    accessibilityTypeId: readNumeric(item, "accessibilityTypeId"),
    criterionId: readNumeric(item, "criterionId"),
    label: readString(item, "label"),
    response: readResponse(item, "response"),
    detail: readString(item, "detail"),
    observation: readString(item, "observation"),
  };
}

export function readSignage(item: JsonRecord): AccessibilitySignageForm {
  return {
    available: readResponse(item, "available"),
    conditionId: readNumeric(item, "conditionId"),
    observation: readString(item, "observation"),
  };
}

// Planta y complementarios

export function readPlant(item: JsonRecord): PlantForm {
  return {
    scope: readEnum(item, "scope", SERVICE_SCOPE_OPTIONS, "EN_ATRACTIVO"),
    typeId: readNumeric(item, "typeId"),
    typeLabel: readString(item, "typeLabel"),
    group: readString(item, "group"),
    quantity1: readNumeric(item, "quantity1"),
    quantity2: readNumeric(item, "quantity2"),
    quantity3: readNumeric(item, "quantity3"),
    observation: readString(item, "observation"),
  };
}

export function readFacilityDetail(item: JsonRecord): FacilityDetailForm {
  return {
    categoryId: readNumeric(item, "categoryId"),
    typeId: readNumeric(item, "typeId"),
    typeLabel: readString(item, "typeLabel"),
    // La API exige una cantidad: una facilidad sin dato se muestra como 0.
    quantity: readNumeric(item, "quantity") || "0",
    latitude: readNumeric(item, "latitude"),
    longitude: readNumeric(item, "longitude"),
    administrator: readString(item, "administrator"),
    universalAccessibility: readResponse(item, "universalAccessibility"),
    conditionId: readNumeric(item, "conditionId"),
    detailOther: readString(item, "detailOther"),
    observation: readString(item, "observation"),
  };
}

export function readComplementaryService(item: JsonRecord): ComplementaryServiceForm {
  return {
    scope: readEnum(item, "scope", SERVICE_SCOPE_OPTIONS, "EN_ATRACTIVO"),
    typeId: readNumeric(item, "typeId"),
    typeLabel: readString(item, "typeLabel"),
    specification: readString(item, "specification"),
    observation: readString(item, "observation"),
  };
}

// Conservación

export function readConservationComponent(item: JsonRecord): ConservationComponentForm {
  return {
    state: readEnum(item, "state", CONSERVATION_STATE_OPTIONS, ""),
    observation: readString(item, "observation"),
  };
}

export function readConservationFactor(item: JsonRecord): ConservationFactorForm {
  return {
    component: readEnum(item, "component", CONSERVATION_COMPONENT_OPTIONS, "ATRACTIVO"),
    factorId: readNumeric(item, "factorId"),
    origin: readEnum(item, "origin", CONSERVATION_ORIGIN_OPTIONS, "NATURAL"),
    name: readString(item, "name"),
    response: readResponse(item, "response"),
    detailOther: readString(item, "detailOther"),
    observation: readString(item, "observation"),
  };
}

export function readDeclaration(item: JsonRecord): ConservationDeclarationForm {
  return {
    entity: readString(item, "entity"),
    denomination: readString(item, "denomination"),
    date: readString(item, "date"),
    scope: readString(item, "scope"),
    observation: readString(item, "observation"),
  };
}

// Higiene y seguridad (`hygieneSafety`)

export function readHygieneEntry(item: JsonRecord): HygieneEntryForm {
  return {
    kind: readEnum(item, "kind", HYGIENE_ENTRY_OPTIONS, "BASIC_SERVICE"),
    scope: readEnum(item, "scope", SERVICE_SCOPE_OPTIONS, ""),
    typeId: readNumeric(item, "typeId"),
    name: readString(item, "name"),
    provider: readString(item, "provider"),
    secondaryId: readNumeric(item, "secondaryId"),
    secondary: readString(item, "secondary"),
    response: readResponse(item, "response"),
    quantity: readNumeric(item, "quantity"),
    condition: readEnum(item, "condition", HYGIENE_CONDITION_OPTIONS, ""),
    observation: readString(item, "observation"),
  };
}

export function readHygieneRadios(item: JsonRecord): HygieneRadiosForm {
  return {
    available: readResponse(item, "available"),
    visitorUse: readResponse(item, "visitorUse"),
    internalUse: readResponse(item, "internalUse"),
    emergencyUse: readResponse(item, "emergencyUse"),
    quantity: readNumeric(item, "quantity"),
    observation: readString(item, "observation"),
  };
}

export function readHygieneContingency(item: JsonRecord): HygieneContingencyForm {
  return {
    exists: readResponse(item, "exists"),
    institution: readString(item, "institution"),
    document: readString(item, "document"),
    year: readNumeric(item, "year"),
    observation: readString(item, "observation"),
  };
}

// Políticas: siempre las cuatro preguntas de la ficha, en su orden.

export function readPolicies(value: unknown): PolicyForm[] {
  const entries = Array.isArray(value) ? value.map(asRecord) : [];
  return POLICY_DEFINITIONS.map(({ code, question }) => {
    const item = entries.find((entry) => entry.code === code) ?? {};
    return {
      code,
      question,
      response: readResponse(item, "response"),
      year: readNumeric(item, "year"),
      specification: readString(item, "specification"),
      observation: readString(item, "observation"),
    };
  });
}

// Promoción

export function readPromotion(item: JsonRecord): PromotionForm {
  return {
    hasPlan: readResponse(item, "hasPlan"),
    planName: readString(item, "planName"),
    includedInPlan: readResponse(item, "includedInPlan"),
    partOfPackage: readResponse(item, "partOfPackage"),
    packageDetail: readString(item, "packageDetail"),
    observation: readString(item, "observation"),
  };
}

export function readPromotionMedia(item: JsonRecord): PromotionMediaForm {
  return {
    response: readResponse(item, "response"),
    typeId: readNumeric(item, "typeId"),
    name: readString(item, "name"),
    url: readString(item, "url"),
    periodicity: readString(item, "periodicity"),
    detailOther: readString(item, "detailOther"),
    observation: readString(item, "observation"),
  };
}

// Visitantes

export function readVisitorRegistry(item: JsonRecord): VisitorRegistryForm {
  return {
    exists: readResponse(item, "exists"),
    type: readEnum(item, "type", VISITOR_REGISTRY_TYPE_OPTIONS, ""),
    years: readNumeric(item, "years"),
    reports: readResponse(item, "reports"),
    frequency: readString(item, "frequency"),
    observation: readString(item, "observation"),
  };
}

export function readVisitorSeason(item: JsonRecord): VisitorSeasonForm {
  return {
    type: readEnum(item, "type", VISITOR_SEASON_OPTIONS, "ALTA"),
    quantity: readNumeric(item, "quantity"),
    year: readNumeric(item, "year"),
    months: readStrings(item, "months"),
    observation: readString(item, "observation"),
  };
}

export function readVisitorOrigin(item: JsonRecord): VisitorOriginForm {
  return {
    type: readEnum(item, "type", VISITOR_ORIGIN_OPTIONS, "NACIONAL"),
    place: readString(item, "place"),
    month: readNumeric(item, "month"),
    year: readNumeric(item, "year"),
    quantity: readNumeric(item, "quantity"),
    observation: readString(item, "observation"),
  };
}

export function readVisitorInformant(item: JsonRecord): VisitorInformantForm {
  return {
    name: readString(item, "name"),
    contact: readString(item, "contact"),
    observation: readString(item, "observation"),
  };
}

export function readVisitorInflux(item: JsonRecord): VisitorInfluxForm {
  return {
    weekday: readNumeric(item, "weekday"),
    weekend: readNumeric(item, "weekend"),
    holidays: readNumeric(item, "holidays"),
    frequency: readEnum(item, "frequency", VISITOR_FREQUENCY_OPTIONS, ""),
    observation: readString(item, "observation"),
  };
}

// Recurso humano

export function readHumanResourceSummary(item: JsonRecord): HumanResourceSummaryForm {
  return {
    administrationOperation: readNumeric(item, "administrationOperation"),
    specializedTourism: readNumeric(item, "specializedTourism"),
    observation: readString(item, "observation"),
  };
}

export function readTraining(item: JsonRecord): HumanResourceTrainingForm {
  return {
    group: readEnum(item, "group", TRAINING_GROUP_OPTIONS, "EDUCACION"),
    typeId: readNumeric(item, "typeId"),
    name: readString(item, "name"),
    quantity: readNumeric(item, "quantity"),
    detailOther: readString(item, "detailOther"),
    observation: readString(item, "observation"),
  };
}

// Anexos

export function readAnnexDocument(item: JsonRecord): AnnexDocumentForm {
  return {
    fileId: readNumeric(item, "fileId"),
    type: readString(item, "type"),
    source: readString(item, "source"),
    author: readString(item, "author"),
    description: readString(item, "description"),
    visibility: readEnum(item, "visibility", ANNEX_VISIBILITY_OPTIONS, "ADMINISTRATIVA"),
    observation: readString(item, "observation"),
  };
}

export function readAnnexResponsible(item: JsonRecord): AnnexResponsibleForm {
  return {
    typeId: readNumeric(item, "typeId"),
    name: readString(item, "name"),
    role: readString(item, "role"),
    institution: readString(item, "institution"),
    phone: readString(item, "phone"),
    email: readString(item, "email"),
    observation: readString(item, "observation"),
  };
}

export function readAccessibilitySurvey(item: JsonRecord): AccessibilitySurveyForm {
  return {
    date: readString(item, "date"),
    responsible: readString(item, "responsible"),
    scope: readString(item, "scope"),
    observation: readString(item, "observation"),
  };
}

export function readGadValidation(item: JsonRecord): GadValidationForm {
  return {
    acceptance: readResponse(item, "acceptance"),
    name: readString(item, "name"),
    institution: readString(item, "institution"),
    position: readString(item, "position"),
    phone: readString(item, "phone"),
    email: readString(item, "email"),
    date: readString(item, "date"),
    observation: readString(item, "observation"),
  };
}
