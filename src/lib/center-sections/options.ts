/**
 * Valores cerrados que comparten el editor de secciones y el importador de
 * fichas MINTUR. Los códigos deben coincidir con las validaciones de la API
 * (`apps/api/src/admin/admin-centers.service.ts`).
 */

export const SECTION_RESPONSE_OPTIONS = [
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
  { value: "SIN_INFORMACION", label: "Sin información" },
  { value: "NO_APLICA", label: "No aplica" },
] as const;

export type SectionResponse = (typeof SECTION_RESPONSE_OPTIONS)[number]["value"];

/** Respuesta por defecto: la ausencia de dato nunca se interpreta como "No". */
export const EMPTY_RESPONSE: SectionResponse = "SIN_INFORMACION";

export function isSectionResponse(value: unknown): value is SectionResponse {
  return SECTION_RESPONSE_OPTIONS.some((option) => option.value === value);
}

/** Preguntas de políticas y regulaciones, en el orden a/b/c/d de la ficha. */
export const POLICY_DEFINITIONS = [
  {
    code: "PLAN_DESARROLLO_GAD",
    question: "¿El atractivo está incluido en el plan de desarrollo turístico del GAD?",
  },
  {
    code: "PLANIFICACION_TERRITORIAL",
    question: "¿El atractivo está incluido en la planificación territorial?",
  },
  {
    code: "REGULACIONES_APLICABLES",
    question: "¿Existen regulaciones específicas aplicables al atractivo?",
  },
  {
    code: "ORDENANZAS_APLICABLES",
    question: "¿Existen ordenanzas aplicables al atractivo?",
  },
] as const;

export type PolicyCode = (typeof POLICY_DEFINITIONS)[number]["code"];

export const CONSERVATION_STATE_OPTIONS = [
  { value: "CONSERVADO", label: "Conservado" },
  { value: "ALTERADO", label: "Alterado" },
  { value: "EN_PROCESO_DE_DETERIORO", label: "En proceso de deterioro" },
  { value: "DETERIORADO", label: "Deteriorado" },
] as const;

export type ConservationState = (typeof CONSERVATION_STATE_OPTIONS)[number]["value"];

export const HYGIENE_ENTRY_OPTIONS = [
  { value: "BASIC_SERVICE", label: "Servicio básico" },
  { value: "SIGNAGE", label: "Señalética" },
  { value: "HEALTH", label: "Servicio de salud" },
  { value: "SECURITY", label: "Servicio de seguridad" },
  { value: "COMMUNICATION", label: "Comunicación" },
  { value: "THREAT", label: "Amenaza" },
] as const;

export type HygieneEntryKind = (typeof HYGIENE_ENTRY_OPTIONS)[number]["value"];
