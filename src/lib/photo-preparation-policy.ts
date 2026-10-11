/** Preparación previa; la API conserva su validación y su conversión final a WebP. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
export const PHOTO_MAX_INPUT_PIXELS = 40_000_000;
export const PHOTO_TARGET_BYTES = 512 * 1024;
export const PHOTO_PREPARATION_STEPS = [
  { dimension: 1600, quality: 82 },
  { dimension: 1600, quality: 70 },
  { dimension: 1280, quality: 70 },
  { dimension: 1024, quality: 70 },
] as const;

export const PHOTO_ACCEPT = "image/jpeg,image/png";
export const PHOTO_TYPES: ReadonlySet<string> = new Set(PHOTO_ACCEPT.split(","));
