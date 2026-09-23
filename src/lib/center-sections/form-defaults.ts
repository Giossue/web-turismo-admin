import type {
  AccessibilityAerialForm,
  AccessibilityAquaticForm,
  AccessibilityCriterionForm,
  AccessibilityRoadForm,
  AccessibilityTransportDetailForm,
  AccessibilityTransportTypeForm,
  AnnexDocumentForm,
  AnnexResponsibleForm,
  ComplementaryServiceForm,
  ConservationDeclarationForm,
  ConservationFactorForm,
  FacilityDetailForm,
  HumanResourceTrainingForm,
  HygieneEntryForm,
  PlantForm,
  PromotionMediaForm,
  SectionRowForm,
  VisitorInformantForm,
  VisitorOriginForm,
  VisitorSeasonForm,
} from "./form-types";
import { EMPTY_RESPONSE } from "./options";

/**
 * Filas vacías de los bloques repetibles. Son las que se añaden con los
 * botones "Añadir…" y los valores por defecto que usan los lectores.
 */

export function emptyRow(label = ""): SectionRowForm {
  return { label, response: EMPTY_RESPONSE, quantity: "", observation: "" };
}

export function emptyRoad(): AccessibilityRoadForm {
  return {
    roadTypeId: "",
    typeLabel: "",
    startLatitude: "",
    startLongitude: "",
    endLatitude: "",
    endLongitude: "",
    distanceKm: "",
    materialId: "",
    conditionId: "",
    observation: "",
  };
}

export function emptyAquaticAccess(): AccessibilityAquaticForm {
  return {
    modalityId: "",
    modalityLabel: "",
    departure: "",
    departureConditionId: "",
    arrival: "",
    arrivalConditionId: "",
    observation: "",
  };
}

export function emptyAerialAccess(): AccessibilityAerialForm {
  return { coverageId: "", coverageLabel: "", observation: "" };
}

export function emptyTransportType(): AccessibilityTransportTypeForm {
  return { typeId: "", label: "", applies: "SI", detailOther: "", observation: "" };
}

export function emptyTransportDetail(): AccessibilityTransportDetailForm {
  return {
    operator: "",
    terminal: "",
    frequencyId: "",
    frequencyLabel: "",
    transferDetail: "",
    observation: "",
  };
}

export function emptyCriterion(): AccessibilityCriterionForm {
  return {
    accessibilityTypeId: "",
    criterionId: "",
    label: "",
    response: EMPTY_RESPONSE,
    detail: "",
    observation: "",
  };
}

export function emptyPlant(): PlantForm {
  return {
    scope: "EN_ATRACTIVO",
    typeId: "",
    typeLabel: "",
    group: "",
    quantity1: "",
    quantity2: "",
    quantity3: "",
    observation: "",
  };
}

export function emptyFacilityDetail(): FacilityDetailForm {
  return {
    categoryId: "",
    typeId: "",
    typeLabel: "",
    quantity: "0",
    latitude: "",
    longitude: "",
    administrator: "",
    universalAccessibility: EMPTY_RESPONSE,
    conditionId: "",
    detailOther: "",
    observation: "",
  };
}

export function emptyComplementaryService(): ComplementaryServiceForm {
  return {
    scope: "EN_ATRACTIVO",
    typeId: "",
    typeLabel: "",
    specification: "",
    observation: "",
  };
}

export function emptyConservationFactor(): ConservationFactorForm {
  return {
    component: "ATRACTIVO",
    factorId: "",
    origin: "NATURAL",
    name: "",
    response: EMPTY_RESPONSE,
    detailOther: "",
    observation: "",
  };
}

export function emptyDeclaration(): ConservationDeclarationForm {
  return { entity: "", denomination: "", date: "", scope: "", observation: "" };
}

export function emptyHygieneEntry(): HygieneEntryForm {
  return {
    kind: "BASIC_SERVICE",
    scope: "EN_ATRACTIVO",
    typeId: "",
    name: "",
    provider: "",
    secondaryId: "",
    secondary: "",
    response: EMPTY_RESPONSE,
    quantity: "",
    condition: "",
    observation: "",
  };
}

export function emptyPromotionMedia(): PromotionMediaForm {
  return {
    response: EMPTY_RESPONSE,
    typeId: "",
    name: "",
    url: "",
    periodicity: "",
    detailOther: "",
    observation: "",
  };
}

export function emptyVisitorSeason(): VisitorSeasonForm {
  return { type: "ALTA", quantity: "", year: "", months: [], observation: "" };
}

export function emptyVisitorOrigin(): VisitorOriginForm {
  return { type: "NACIONAL", place: "", month: "", year: "", quantity: "", observation: "" };
}

export function emptyVisitorInformant(): VisitorInformantForm {
  return { name: "", contact: "", observation: "" };
}

export function emptyTraining(): HumanResourceTrainingForm {
  return {
    group: "EDUCACION",
    typeId: "",
    name: "",
    quantity: "",
    detailOther: "",
    observation: "",
  };
}

export function emptyAnnexDocument(): AnnexDocumentForm {
  return {
    fileId: "",
    type: "",
    source: "",
    author: "",
    description: "",
    visibility: "ADMINISTRATIVA",
    observation: "",
  };
}

export function emptyAnnexResponsible(): AnnexResponsibleForm {
  return {
    typeId: "",
    name: "",
    role: "",
    institution: "",
    phone: "",
    email: "",
    observation: "",
  };
}
