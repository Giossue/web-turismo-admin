import { maxLen } from "@/components/ui/form/rules";

/**
 * Reglas y límites repetidos en los apartados. Los límites coinciden con la
 * validación de la API (`validateAdminSectionContent`).
 */

export function textRules(max: number) {
  return { maxLength: maxLen(max) };
}

export const OBSERVATION_RULES = textRules(1_000);

/** Props de `RhfNumberField` para cantidades enteras no negativas. */
export const COUNT_LIMITS = { integer: true, min: 0 } as const;

/** Props de `RhfNumberField` para años. */
export const YEAR_LIMITS = { integer: true, min: 1900, max: 2200 } as const;

export const LATITUDE_LIMITS = { min: -90, max: 90 } as const;
export const LONGITUDE_LIMITS = { min: -180, max: 180 } as const;
