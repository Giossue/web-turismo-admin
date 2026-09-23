import type { SectionDefinition } from "./definitions";
import { emptyRow } from "./form-defaults";
import type { SectionFormValues } from "./form-types";
import {
  asRecord,
  readArray,
  readNumeric,
  readRecord,
  readResponse,
  readString,
} from "./read-helpers";
import {
  readAccessibilitySurvey,
  readAerialAccess,
  readAnnexDocument,
  readAnnexResponsible,
  readAquaticAccess,
  readComplementaryService,
  readConservationComponent,
  readConservationFactor,
  readCriterion,
  readDeclaration,
  readFacilityDetail,
  readGadValidation,
  readHumanResourceSummary,
  readHygieneContingency,
  readHygieneEntry,
  readHygieneRadios,
  readPlant,
  readPolicies,
  readPromotion,
  readPromotionMedia,
  readRoad,
  readRow,
  readSignage,
  readTraining,
  readTransportDetail,
  readTransportType,
  readVisitorInflux,
  readVisitorInformant,
  readVisitorOrigin,
  readVisitorRegistry,
  readVisitorSeason,
} from "./readers";

/**
 * Convierte el JSON guardado de un apartado (`draft.sections[code]`) en los
 * valores del formulario. Es la inversa de `toSectionContent`: cada bloque se
 * lee de la misma clave en la que se escribe. Sin contenido previo, las filas
 * genéricas parten de las sugeridas por la definición del apartado.
 */
export function createSectionValues(
  definition: Pick<SectionDefinition, "suggestedRows">,
  raw?: unknown,
): SectionFormValues {
  const section = asRecord(raw);
  const accessibility = readRecord(section, "accessibilityDetails");
  const climate = readRecord(section, "climate");
  const conservation = readRecord(section, "conservation");
  const hygiene = readRecord(section, "hygieneSafety");
  const promotion = readRecord(section, "promotion");
  const visitors = readRecord(section, "visitors");
  const humanResources = readRecord(section, "humanResources");
  const annexes = readRecord(section, "annexes");

  return {
    response: readResponse(section, "response"),
    observation: readString(section, "observation"),
    localityId: readNumeric(section, "localityId"),
    distanceKm: readNumeric(section, "distanceKm"),
    accessibilityRoads: readArray(accessibility, "roads", readRoad),
    accessibilityAquatic: readArray(accessibility, "aquatic", readAquaticAccess),
    accessibilityAerial: readArray(accessibility, "aerial", readAerialAccess),
    accessibilityTransportTypes: readArray(
      accessibility,
      "transportTypes",
      readTransportType,
    ),
    accessibilityTransportDetails: readArray(
      accessibility,
      "transportDetails",
      readTransportDetail,
    ),
    accessibilityCriteria: readArray(accessibility, "criteria", readCriterion),
    accessibilitySignage: readSignage(readRecord(accessibility, "signage")),
    plant: readArray(section, "plant", readPlant),
    facilityDetails: readArray(section, "facilitiesDetails", readFacilityDetail),
    complementaryServices: readArray(
      section,
      "complementaryServices",
      readComplementaryService,
    ),
    climateId: readNumeric(climate, "climateId"),
    minTemperature: readNumeric(climate, "minTemperature"),
    maxTemperature: readNumeric(climate, "maxTemperature"),
    minRainfall: readNumeric(climate, "minRainfall"),
    maxRainfall: readNumeric(climate, "maxRainfall"),
    rows: Array.isArray(section.rows)
      ? readArray(section, "rows", readRow)
      : definition.suggestedRows.map((label) => emptyRow(label)),
    conservation: {
      attraction: readConservationComponent(readRecord(conservation, "attraction")),
      environment: readConservationComponent(readRecord(conservation, "environment")),
    },
    conservationFactors: readArray(conservation, "factors", readConservationFactor),
    declarations: readArray(section, "declarations", readDeclaration),
    hygieneEntries: readArray(hygiene, "entries", readHygieneEntry),
    hygieneRadios: readHygieneRadios(readRecord(hygiene, "radios")),
    hygieneContingency: readHygieneContingency(readRecord(hygiene, "contingency")),
    policies: readPolicies(section.policies),
    promotion: readPromotion(promotion),
    promotionMedia: readArray(promotion, "media", readPromotionMedia),
    visitorRegistry: readVisitorRegistry(readRecord(visitors, "registry")),
    visitorSeasons: readArray(visitors, "seasons", readVisitorSeason),
    visitorOrigins: readArray(visitors, "origins", readVisitorOrigin),
    visitorInformants: readArray(visitors, "informants", readVisitorInformant),
    visitorInflux: readVisitorInflux(readRecord(visitors, "influx")),
    humanResourceSummary: readHumanResourceSummary(readRecord(humanResources, "summary")),
    humanResourceTraining: readArray(humanResources, "training", readTraining),
    annexDocuments: readArray(annexes, "documents", readAnnexDocument),
    annexResponsibles: readArray(annexes, "responsibles", readAnnexResponsible),
    accessibilitySurvey: readAccessibilitySurvey(
      readRecord(annexes, "accessibilitySurvey"),
    ),
    gadValidation: readGadValidation(readRecord(annexes, "gadValidation")),
  };
}
