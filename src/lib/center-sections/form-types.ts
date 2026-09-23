import type {
  AnnexVisibility,
  ConservationComponent,
  ConservationOrigin,
  ConservationState,
  HygieneCondition,
  HygieneEntryKind,
  PolicyCode,
  SectionResponse,
  ServiceScope,
  TrainingGroup,
  TransportApplies,
  VisitorFrequency,
  VisitorOrigin,
  VisitorRegistryType,
  VisitorSeason,
} from "./options";

/**
 * Valores del formulario de un apartado de la ficha. Los números se editan
 * como texto (`""` = sin dato) y los ids de catálogo también; la conversión al
 * JSON que guarda la API vive en `to-section-content.ts` y la lectura inversa
 * en `create-section-values.ts`.
 */

export type SectionRowForm = {
  label: string;
  response: SectionResponse;
  quantity: string;
  observation: string;
};

export type AccessibilityRoadForm = {
  roadTypeId: string;
  typeLabel: string;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
  distanceKm: string;
  materialId: string;
  conditionId: string;
  observation: string;
};

export type AccessibilityAquaticForm = {
  modalityId: string;
  modalityLabel: string;
  departure: string;
  departureConditionId: string;
  arrival: string;
  arrivalConditionId: string;
  observation: string;
};

export type AccessibilityAerialForm = {
  coverageId: string;
  coverageLabel: string;
  observation: string;
};

export type AccessibilityTransportTypeForm = {
  typeId: string;
  label: string;
  applies: TransportApplies;
  detailOther: string;
  observation: string;
};

export type AccessibilityTransportDetailForm = {
  operator: string;
  terminal: string;
  frequencyId: string;
  frequencyLabel: string;
  transferDetail: string;
  observation: string;
};

export type AccessibilityCriterionForm = {
  accessibilityTypeId: string;
  criterionId: string;
  label: string;
  response: SectionResponse;
  detail: string;
  observation: string;
};

export type AccessibilitySignageForm = {
  available: SectionResponse;
  conditionId: string;
  observation: string;
};

export type PlantForm = {
  scope: ServiceScope;
  typeId: string;
  typeLabel: string;
  group: string;
  quantity1: string;
  quantity2: string;
  quantity3: string;
  observation: string;
};

export type FacilityDetailForm = {
  categoryId: string;
  typeId: string;
  typeLabel: string;
  quantity: string;
  latitude: string;
  longitude: string;
  administrator: string;
  universalAccessibility: SectionResponse;
  conditionId: string;
  detailOther: string;
  observation: string;
};

export type ComplementaryServiceForm = {
  scope: ServiceScope;
  typeId: string;
  typeLabel: string;
  specification: string;
  observation: string;
};

export type ConservationComponentForm = {
  state: ConservationState | "";
  observation: string;
};

export type ConservationFactorForm = {
  component: ConservationComponent;
  factorId: string;
  origin: ConservationOrigin;
  name: string;
  response: SectionResponse;
  detailOther: string;
  observation: string;
};

export type ConservationDeclarationForm = {
  entity: string;
  denomination: string;
  date: string;
  scope: string;
  observation: string;
};

export type HygieneEntryForm = {
  kind: HygieneEntryKind;
  scope: ServiceScope | "";
  typeId: string;
  name: string;
  provider: string;
  secondaryId: string;
  secondary: string;
  response: SectionResponse;
  quantity: string;
  condition: HygieneCondition | "";
  observation: string;
};

export type HygieneRadiosForm = {
  available: SectionResponse;
  visitorUse: SectionResponse;
  internalUse: SectionResponse;
  emergencyUse: SectionResponse;
  quantity: string;
  observation: string;
};

export type HygieneContingencyForm = {
  exists: SectionResponse;
  institution: string;
  document: string;
  year: string;
  observation: string;
};

export type PolicyForm = {
  code: PolicyCode;
  question: string;
  response: SectionResponse;
  year: string;
  specification: string;
  observation: string;
};

export type PromotionForm = {
  hasPlan: SectionResponse;
  planName: string;
  includedInPlan: SectionResponse;
  partOfPackage: SectionResponse;
  packageDetail: string;
  observation: string;
};

export type PromotionMediaForm = {
  response: SectionResponse;
  typeId: string;
  name: string;
  url: string;
  periodicity: string;
  detailOther: string;
  observation: string;
};

export type VisitorRegistryForm = {
  exists: SectionResponse;
  type: VisitorRegistryType | "";
  years: string;
  reports: SectionResponse;
  frequency: string;
  observation: string;
};

export type VisitorSeasonForm = {
  type: VisitorSeason;
  quantity: string;
  year: string;
  /** Números de mes (`"1"`…`"12"`) ordenados. */
  months: string[];
  observation: string;
};

export type VisitorOriginForm = {
  type: VisitorOrigin;
  place: string;
  month: string;
  year: string;
  quantity: string;
  observation: string;
};

export type VisitorInformantForm = {
  name: string;
  contact: string;
  observation: string;
};

export type VisitorInfluxForm = {
  weekday: string;
  weekend: string;
  holidays: string;
  frequency: VisitorFrequency | "";
  observation: string;
};

export type HumanResourceSummaryForm = {
  administrationOperation: string;
  specializedTourism: string;
  observation: string;
};

export type HumanResourceTrainingForm = {
  group: TrainingGroup;
  typeId: string;
  name: string;
  quantity: string;
  detailOther: string;
  observation: string;
};

export type AnnexDocumentForm = {
  fileId: string;
  type: string;
  source: string;
  author: string;
  description: string;
  visibility: AnnexVisibility;
  observation: string;
};

export type AnnexResponsibleForm = {
  typeId: string;
  name: string;
  role: string;
  institution: string;
  phone: string;
  email: string;
  observation: string;
};

export type AccessibilitySurveyForm = {
  date: string;
  responsible: string;
  scope: string;
  observation: string;
};

export type GadValidationForm = {
  acceptance: SectionResponse;
  name: string;
  institution: string;
  position: string;
  phone: string;
  email: string;
  date: string;
  observation: string;
};

/**
 * Todos los apartados comparten el mismo tipo de formulario; cada uno solo
 * edita y guarda los bloques que le corresponden.
 */
export type SectionFormValues = {
  response: SectionResponse;
  observation: string;
  localityId: string;
  distanceKm: string;
  accessibilityRoads: AccessibilityRoadForm[];
  accessibilityAquatic: AccessibilityAquaticForm[];
  accessibilityAerial: AccessibilityAerialForm[];
  accessibilityTransportTypes: AccessibilityTransportTypeForm[];
  accessibilityTransportDetails: AccessibilityTransportDetailForm[];
  accessibilityCriteria: AccessibilityCriterionForm[];
  accessibilitySignage: AccessibilitySignageForm;
  plant: PlantForm[];
  facilityDetails: FacilityDetailForm[];
  complementaryServices: ComplementaryServiceForm[];
  climateId: string;
  minTemperature: string;
  maxTemperature: string;
  minRainfall: string;
  maxRainfall: string;
  rows: SectionRowForm[];
  conservation: {
    attraction: ConservationComponentForm;
    environment: ConservationComponentForm;
  };
  conservationFactors: ConservationFactorForm[];
  declarations: ConservationDeclarationForm[];
  hygieneEntries: HygieneEntryForm[];
  hygieneRadios: HygieneRadiosForm;
  hygieneContingency: HygieneContingencyForm;
  policies: PolicyForm[];
  promotion: PromotionForm;
  promotionMedia: PromotionMediaForm[];
  visitorRegistry: VisitorRegistryForm;
  visitorSeasons: VisitorSeasonForm[];
  visitorOrigins: VisitorOriginForm[];
  visitorInformants: VisitorInformantForm[];
  visitorInflux: VisitorInfluxForm;
  humanResourceSummary: HumanResourceSummaryForm;
  humanResourceTraining: HumanResourceTrainingForm[];
  annexDocuments: AnnexDocumentForm[];
  annexResponsibles: AnnexResponsibleForm[];
  accessibilitySurvey: AccessibilitySurveyForm;
  gadValidation: GadValidationForm;
};
