import type { ComponentType } from "react";

import type { CenterSectionCode } from "@/lib/center-sections/definitions";

import { AccessibilityFields } from "./accessibility";
import { AnnexesFields } from "./annexes";
import { CharacteristicsFields } from "./characteristics";
import { ConservationFields } from "./conservation";
import { HumanResourcesFields } from "./human-resources";
import { HygieneSafetyFields } from "./hygiene-safety";
import { PlantFields } from "./plant";
import { PoliciesFields } from "./policies";
import { PromotionFields } from "./promotion";
import type { SectionFieldsProps } from "./types";
import { VisitorsFields } from "./visitors";

/**
 * Campos propios de cada apartado. Los apartados sin entrada (identificación,
 * ubicación, actividades y descripción) se editan en el formulario principal y
 * aquí solo tienen respuesta, observación y filas genéricas.
 */
export const sectionFieldsRegistry: Partial<
  Record<CenterSectionCode, ComponentType<SectionFieldsProps>>
> = {
  caracteristicas: CharacteristicsFields,
  accesibilidad: AccessibilityFields,
  planta: PlantFields,
  conservacion: ConservationFields,
  "higiene-seguridad": HygieneSafetyFields,
  politicas: PoliciesFields,
  promocion: PromotionFields,
  visitantes: VisitorsFields,
  "recurso-humano": HumanResourcesFields,
  anexos: AnnexesFields,
};
