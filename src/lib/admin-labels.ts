import type {
  AdminMediaItem,
  CenterStatus,
  EstablishmentReviewStatus,
  OpinionStatus,
  OpinionTargetType,
} from "./admin-api";

/** Tono visual de un estado; coincide con los colores de `Chip` de MUI. */
export type StatusTone = "default" | "success" | "warning" | "error" | "info";

const ESTABLISHMENT_REVIEW_STATUS_LABELS: Record<EstablishmentReviewStatus, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  PUBLICADO: "Publicado",
  RECHAZADO: "Rechazado",
};

const ESTABLISHMENT_REVIEW_STATUS_TONES: Record<EstablishmentReviewStatus, StatusTone> = {
  BORRADOR: "default",
  EN_REVISION: "warning",
  PUBLICADO: "success",
  RECHAZADO: "error",
};

export function establishmentReviewStatusLabel(
  status: EstablishmentReviewStatus,
): string {
  return ESTABLISHMENT_REVIEW_STATUS_LABELS[status];
}

export function establishmentReviewStatusTone(
  status: EstablishmentReviewStatus,
): StatusTone {
  return ESTABLISHMENT_REVIEW_STATUS_TONES[status];
}

const CENTER_STATUS_LABELS: Record<CenterStatus, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  PUBLICADO: "Publicado",
};

const CENTER_STATUS_TONES: Record<CenterStatus, StatusTone> = {
  BORRADOR: "default",
  EN_REVISION: "warning",
  PUBLICADO: "success",
};

function isCenterStatus(code: string): code is CenterStatus {
  return Object.hasOwn(CENTER_STATUS_LABELS, code);
}

/** Las respuestas con un estado desconocido conservan la etiqueta de la API. */
export function centerStatusLabel(status: { code: string; name: string }): string {
  return isCenterStatus(status.code)
    ? CENTER_STATUS_LABELS[status.code]
    : status.name || status.code;
}

export function centerStatusTone(code: string): StatusTone {
  return isCenterStatus(code) ? CENTER_STATUS_TONES[code] : "default";
}

const OPINION_TARGET_TYPE_LABELS: Record<OpinionTargetType, string> = {
  CENTRO: "Centro turístico",
  PUNTO_INTERES: "Punto de interés",
};

export function opinionTargetTypeLabel(type: OpinionTargetType): string {
  return OPINION_TARGET_TYPE_LABELS[type];
}

const OPINION_STATUS_LABELS: Record<OpinionStatus, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Publicada",
  RECHAZADA: "Rechazada",
  REEMPLAZADA: "Reemplazada",
};

const OPINION_STATUS_TONES: Record<OpinionStatus, StatusTone> = {
  PENDIENTE: "warning",
  APROBADA: "success",
  RECHAZADA: "error",
  REEMPLAZADA: "default",
};

export function opinionStatusLabel(status: OpinionStatus): string {
  return OPINION_STATUS_LABELS[status];
}

export function opinionStatusTone(status: OpinionStatus): StatusTone {
  return OPINION_STATUS_TONES[status];
}

/** Estado operativo (activa/inactiva) de fichas y opciones de catálogo. */
export function activeLabel(active: boolean): string {
  return active ? "Activa" : "Inactiva";
}

export function activeTone(active: boolean): StatusTone {
  return active ? "success" : "default";
}

type MediaState = AdminMediaItem["state"];

const MEDIA_STATE_LABELS: Record<MediaState, string> = {
  PENDIENTE: "Pendiente",
  PUBLICADO: "Publicado",
  ELIMINADO: "Eliminado",
};

const MEDIA_STATE_TONES: Record<MediaState, StatusTone> = {
  PENDIENTE: "warning",
  PUBLICADO: "success",
  ELIMINADO: "default",
};

export function mediaStateLabel(state: MediaState): string {
  return MEDIA_STATE_LABELS[state];
}

export function mediaStateTone(state: MediaState): StatusTone {
  return MEDIA_STATE_TONES[state];
}
