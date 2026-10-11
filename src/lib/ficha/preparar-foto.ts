import sharp from "sharp";

import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_INPUT_PIXELS,
  PHOTO_PREPARATION_STEPS,
  PHOTO_TARGET_BYTES,
} from "../photo-preparation-policy";

// El worker procesa una foto a la vez y mantiene acotada la memoria nativa.
sharp.cache({ memory: 16, files: 0, items: 16 });
sharp.concurrency(1);

export async function prepararFotoAnexo(
  contenido: Buffer,
  extension: "png" | "jpeg",
): Promise<{ contenido: Buffer; extension: "png" | "jpeg" }> {
  const imagen = sharp(contenido, {
    limitInputPixels: PHOTO_MAX_INPUT_PIXELS,
    failOn: "warning",
  });
  const metadata = await imagen.metadata();
  if (metadata.format !== extension || !metadata.width || !metadata.height) {
    throw new Error("Formato de imagen inválido");
  }

  let preparada: Buffer | undefined;
  for (const { dimension, quality } of PHOTO_PREPARATION_STEPS) {
    preparada = await imagen
      .clone()
      .rotate()
      .resize(dimension, dimension, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality })
      .timeout({ seconds: 2 })
      .toBuffer();
    // Evitar degradar una foto pequeña si recodificarla no ahorra bytes.
    if (
      contenido.length <= PHOTO_TARGET_BYTES &&
      metadata.width <= PHOTO_PREPARATION_STEPS[0].dimension &&
      metadata.height <= PHOTO_PREPARATION_STEPS[0].dimension &&
      contenido.length <= preparada.length
    ) {
      return { contenido, extension };
    }
    if (preparada.length <= PHOTO_TARGET_BYTES) break;
  }
  if (!preparada?.length || preparada.length > PHOTO_MAX_BYTES) {
    throw new Error("La foto preparada supera el límite");
  }
  return { contenido: preparada, extension: "jpeg" };
}
