import type { FieldPath } from "react-hook-form";

import type { CenterSectionCode } from "./center-sections/definitions";

/**
 * Valores del formulario principal de la ficha turística (editor del panel y
 * precarga desde la ficha MINTUR). Los ids de catálogo y los números se
 * guardan como texto, igual que los campos del formulario.
 */
export type CenterFormValues = {
  name: string;
  categoryId: string;
  typeId: string;
  subtypeId: string;
  touristZoneId: string;
  provinceId: string;
  cantonId: string;
  parishId: string;
  productLineId: string;
  scenarioId: string;
  hierarchyId: string;
  latitude: string;
  longitude: string;
  altitudeMeters: string;
  description: string;
  address: {
    barrio: string;
    street: string;
    number: string;
    crossStreet: string;
  };
  administration: {
    type: string;
    institution: string;
    name: string;
    position: string;
    phone: string;
    email: string;
    observation: string;
  };
  admission: {
    incomeTypeId: string;
    attentionModeId: string;
    opensAt: string;
    closesAt: string;
    otherAttention: string;
    reservations: boolean;
    priceFrom: string;
    priceTo: string;
    observation: string;
  };
  activityIds: string[];
  accessibilityIds: string[];
  facilityIds: string[];
  facilityQuantities: Record<string, string>;
  facilityObservations: Record<string, string>;
};

export type CenterFormField = FieldPath<CenterFormValues>;

export const CENTER_NAME_MAX_LENGTH = 180;
export const CENTER_DESCRIPTION_MAX_LENGTH = 500;

export const emptyCenterFormValues: CenterFormValues = {
  name: "",
  categoryId: "",
  typeId: "",
  subtypeId: "",
  touristZoneId: "",
  provinceId: "",
  cantonId: "",
  parishId: "",
  productLineId: "",
  scenarioId: "",
  hierarchyId: "",
  latitude: "",
  longitude: "",
  altitudeMeters: "",
  description: "",
  address: { barrio: "", street: "", number: "", crossStreet: "" },
  administration: {
    type: "",
    institution: "",
    name: "",
    position: "",
    phone: "",
    email: "",
    observation: "",
  },
  admission: {
    incomeTypeId: "",
    attentionModeId: "",
    opensAt: "",
    closesAt: "",
    otherAttention: "",
    reservations: false,
    priceFrom: "",
    priceTo: "",
    observation: "",
  },
  activityIds: [],
  accessibilityIds: [],
  facilityIds: [],
  facilityQuantities: {},
  facilityObservations: {},
};

const IDENTIFICATION_FIELDS = [
  "name",
  "categoryId",
  "typeId",
  "subtypeId",
  "provinceId",
  "cantonId",
  "parishId",
  "touristZoneId",
  "productLineId",
  "scenarioId",
] as const satisfies readonly CenterFormField[];

/**
 * Campos del formulario principal que muestra cada paso del asistente; se
 * validan al pulsar "Siguiente". Los pasos sin entrada solo tienen campos de
 * sección (se guardan aparte).
 */
export const CENTER_STEP_FIELDS: Partial<
  Record<CenterSectionCode, readonly CenterFormField[]>
> = {
  identificacion: IDENTIFICATION_FIELDS,
  "ubicacion-admin": [
    "address",
    "latitude",
    "longitude",
    "altitudeMeters",
    "administration",
  ],
  caracteristicas: ["admission"],
  descripcion: ["description"],
  actividades: ["activityIds"],
  accesibilidad: ["accessibilityIds"],
  planta: ["facilityIds", "facilityQuantities", "facilityObservations"],
};

/**
 * Campos que la API exige para crear una ficha. Las coordenadas se piden en el
 * primer paso mientras la ficha es nueva.
 */
export const CENTER_CREATE_FIELDS: readonly CenterFormField[] = [
  ...IDENTIFICATION_FIELDS,
  "latitude",
  "longitude",
];

function isCoordinate(text: string, limit: number): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && Math.abs(value) <= limit;
}

/**
 * Comprobación silenciosa (sin mostrar errores) de que los valores bastan
 * para crear la ficha: sirve para no disparar el autoguardado de una ficha
 * nueva a medio completar.
 */
export function isReadyToCreate(values: CenterFormValues): boolean {
  return (
    IDENTIFICATION_FIELDS.every(
      // La zona turística es opcional (no es un campo de la ficha MINTUR).
      (field) => field === "touristZoneId" || values[field].trim() !== "",
    ) &&
    values.name.trim().length <= CENTER_NAME_MAX_LENGTH &&
    isCoordinate(values.latitude, 90) &&
    isCoordinate(values.longitude, 180)
  );
}
