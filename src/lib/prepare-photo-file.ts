import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_INPUT_PIXELS,
  PHOTO_PREPARATION_STEPS,
  PHOTO_SOURCE_MAX_BYTES,
  PHOTO_TARGET_BYTES,
  PHOTO_TYPES,
} from "./photo-preparation-policy";
import { readPhotoDimensions } from "./read-photo-dimensions";

export function photoFileError(file: File): string | null {
  if (!PHOTO_TYPES.has(file.type)) return "Solo se aceptan imágenes JPEG o PNG.";
  if (file.size === 0) return "La fotografía está vacía.";
  if (file.size > PHOTO_SOURCE_MAX_BYTES) {
    return "La fotografía supera los 20 MB admitidos para procesarla de forma segura.";
  }
  return null;
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob?.size && blob.type === "image/jpeg"
          ? resolve(blob)
          : reject(new Error("No se pudo preparar la fotografía para subirla.")),
      "image/jpeg",
      quality / 100,
    );
  });
}

/** Reduce antes del multipart y libera las superficies incluso cuando falla. */
export async function preparePhotoFile(file: File): Promise<File> {
  const error = photoFileError(file);
  if (error) throw new Error(error);
  const dimensions = await readPhotoDimensions(file);
  if (
    !dimensions.width ||
    !dimensions.height ||
    dimensions.width * dimensions.height > PHOTO_MAX_INPUT_PIXELS
  ) {
    throw new Error(
      "La fotografía supera la resolución que se puede procesar de forma segura.",
    );
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "No se pudo leer la fotografía. Comprueba que sea un JPEG o PNG válido.",
    );
  }
  const canvas = document.createElement("canvas");
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > PHOTO_MAX_INPUT_PIXELS
    ) {
      throw new Error(
        "La fotografía supera la resolución que se puede procesar de forma segura.",
      );
    }
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la fotografía para subirla.");
    let prepared: Blob | undefined;
    for (const { dimension, quality } of PHOTO_PREPARATION_STEPS) {
      const scale = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      prepared = await encode(canvas, quality);
      if (
        file.size <= PHOTO_TARGET_BYTES &&
        Math.max(bitmap.width, bitmap.height) <= PHOTO_PREPARATION_STEPS[0].dimension &&
        file.size <= prepared.size
      ) {
        return file;
      }
      if (prepared.size <= PHOTO_TARGET_BYTES) break;
    }
    if (!prepared?.size || prepared.size > PHOTO_MAX_BYTES) {
      throw new Error("No se pudo preparar la fotografía dentro del límite de subida.");
    }
    const name = `${file.name.replace(/\.[^.]+$/, "") || "fotografia"}.jpeg`;
    return new File([prepared], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
