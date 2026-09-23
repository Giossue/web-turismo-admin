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

/** Ámbito de planta, servicios complementarios e higiene (`SERVICE_SCOPE_VALUES` en la API). */
export const SERVICE_SCOPE_OPTIONS = [
  { value: "EN_ATRACTIVO", label: "En el atractivo" },
  { value: "EN_POBLADO_CERCANO", label: "En el poblado cercano" },
] as const;

export type ServiceScope = (typeof SERVICE_SCOPE_OPTIONS)[number]["value"];

/** Si un tipo de transporte aplica; la API lo guarda como booleano. */
export const TRANSPORT_APPLIES_OPTIONS = [
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
] as const;

export type TransportApplies = (typeof TRANSPORT_APPLIES_OPTIONS)[number]["value"];

export const CONSERVATION_COMPONENT_OPTIONS = [
  { value: "ATRACTIVO", label: "Atractivo" },
  { value: "ENTORNO", label: "Entorno" },
] as const;

export type ConservationComponent =
  (typeof CONSERVATION_COMPONENT_OPTIONS)[number]["value"];

export const CONSERVATION_ORIGIN_OPTIONS = [
  { value: "NATURAL", label: "Natural" },
  { value: "ANTROPICO", label: "Antrópico" },
] as const;

export type ConservationOrigin = (typeof CONSERVATION_ORIGIN_OPTIONS)[number]["value"];

/** Condición de un registro de higiene y seguridad (`SIGNAGE_CONDITION_VALUES`). */
export const HYGIENE_CONDITION_OPTIONS = [
  { value: "BUENO", label: "Bueno" },
  { value: "REGULAR", label: "Regular" },
  { value: "MALO", label: "Malo" },
] as const;

export type HygieneCondition = (typeof HYGIENE_CONDITION_OPTIONS)[number]["value"];

export const VISITOR_REGISTRY_TYPE_OPTIONS = [
  { value: "DIGITAL", label: "Digital" },
  { value: "PAPEL", label: "Papel" },
] as const;

export type VisitorRegistryType = (typeof VISITOR_REGISTRY_TYPE_OPTIONS)[number]["value"];

export const VISITOR_SEASON_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "BAJA", label: "Baja" },
] as const;

export type VisitorSeason = (typeof VISITOR_SEASON_OPTIONS)[number]["value"];

export const VISITOR_ORIGIN_OPTIONS = [
  { value: "NACIONAL", label: "Nacional" },
  { value: "EXTRANJERA", label: "Extranjera" },
] as const;

export type VisitorOrigin = (typeof VISITOR_ORIGIN_OPTIONS)[number]["value"];

export const VISITOR_FREQUENCY_OPTIONS = [
  { value: "PERMANENTE", label: "Permanente" },
  { value: "ESTACIONAL", label: "Estacional" },
  { value: "ESPORADICA", label: "Esporádica" },
  { value: "INEXISTENTE", label: "Inexistente" },
] as const;

export type VisitorFrequency = (typeof VISITOR_FREQUENCY_OPTIONS)[number]["value"];

export const TRAINING_GROUP_OPTIONS = [
  { value: "EDUCACION", label: "Educación" },
  { value: "CAPACITACION", label: "Capacitación" },
  { value: "IDIOMA", label: "Idioma" },
] as const;

export type TrainingGroup = (typeof TRAINING_GROUP_OPTIONS)[number]["value"];

export const ANNEX_VISIBILITY_OPTIONS = [
  { value: "PUBLICA", label: "Pública" },
  { value: "ADMINISTRATIVA", label: "Administrativa" },
  { value: "RESTRINGIDA", label: "Restringida" },
] as const;

export type AnnexVisibility = (typeof ANNEX_VISIBILITY_OPTIONS)[number]["value"];
