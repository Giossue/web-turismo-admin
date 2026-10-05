"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  importFichaFile,
  uploadAdminCenterMedia,
  type AdminCatalogs,
  type FichaImportPhoto,
} from "@/lib/admin-api";
import { adminKeys } from "@/lib/admin-queries";
import type { CenterFormValues } from "@/lib/center-form";
import { mergeImportedValues } from "@/lib/center-form-mappers";
import { errorMessage } from "@/lib/errors";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";

function toImportedPhotoFile(photo: FichaImportPhoto): File {
  const binary = atob(photo.contenidoBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], photo.nombre, { type: photo.mimeType });
}

/**
 * Precarga el formulario desde una ficha MINTUR (.xlsx/.xlsm). Los valores
 * importados quedan como cambios sin guardar (no como valores base): no se
 * guardan solos, para que la persona revise las advertencias; su siguiente
 * edición (o "Siguiente") los guarda, y una recarga de la ficha no los descarta.
 */
export function useFichaImport({
  token,
  catalogs,
  form: { getValues, reset },
  onNotice,
  onError,
}: {
  token: string;
  catalogs: AdminCatalogs | null;
  form: UseFormReturn<CenterFormValues>;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciasSecciones | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<FichaImportPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const pendingPhotosRef = useRef<FichaImportPhoto[]>([]);
  const uploadingPhotosRef = useRef(false);
  const replacePendingPhotos = useCallback((photos: FichaImportPhoto[]) => {
    pendingPhotosRef.current = photos;
    setPendingPhotos(photos);
  }, []);

  const uploadImportedPhotos = useCallback(
    async (code: string) => {
      const photos = pendingPhotosRef.current;
      if (photos.length === 0 || uploadingPhotosRef.current) return;

      uploadingPhotosRef.current = true;
      setUploadingPhotos(true);
      setPhotoUploadError(null);
      const failed: FichaImportPhoto[] = [];
      try {
        let firstError: unknown;
        for (const photo of photos) {
          try {
            await uploadAdminCenterMedia(token, code, toImportedPhotoFile(photo), {
              typeCode: "FOTOGRAFIA",
              description: "Importada desde ficha MINTUR",
            });
          } catch (cause) {
            firstError ??= cause;
            failed.push(photo);
          }
        }

        replacePendingPhotos(failed);
        await Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: adminKeys.media(code) }),
          queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
        ]);

        if (failed.length > 0) {
          const message = errorMessage(
            firstError,
            "No se pudieron cargar todas las fotos importadas.",
          );
          setPhotoUploadError(
            `No se pudieron cargar ${failed.length} de ${photos.length} fotos. ${message}`,
          );
          onError(
            `La ficha quedó guardada. Reintenta la carga de fotos o súbelas desde Anexos. ${message}`,
          );
        } else {
          onNotice(
            photos.length === 1
              ? "Se adjuntó la fotografía importada."
              : `Se adjuntaron las ${photos.length} fotografías importadas.`,
          );
        }
      } finally {
        uploadingPhotosRef.current = false;
        setUploadingPhotos(false);
      }
    },
    [onError, onNotice, queryClient, replacePendingPhotos, token],
  );

  const importMutation = useMutation({
    mutationFn: (file: File) => importFichaFile(token, file),
    onMutate: () => {
      setWarnings([]);
      onError(null);
      setPhotoUploadError(null);
      replacePendingPhotos([]);
    },
    onSuccess: (imported) => {
      const current = getValues();
      const next = catalogs
        ? mergeImportedValues(current, imported.formulario, catalogs)
        : { ...current, ...imported.formulario };
      reset(next, { keepDefaultValues: true, keepDirtyValues: false });
      setWarnings([...new Set(imported.advertencias)]);
      setSugerencias(imported.sugerenciasSecciones ?? null);
      replacePendingPhotos(imported.fotos ?? []);
      const photoMessage =
        imported.fotos.length === 0
          ? ""
          : imported.fotos.length === 1
            ? " Se detectó 1 foto de anexos; se adjuntará al guardar la ficha."
            : ` Se detectaron ${imported.fotos.length} fotos de anexos; se adjuntarán al guardar la ficha.`;
      onNotice(
        `Se precargó el formulario desde la ficha. Revisa las advertencias antes de guardar.${photoMessage}`,
      );
    },
    onError: (cause) => onError(errorMessage(cause, "No se pudo importar la ficha.")),
  });

  return {
    importing: importMutation.isPending,
    importFile: (file: File) => importMutation.mutate(file),
    warnings,
    dismissWarnings: () => setWarnings([]),
    sugerencias,
    pendingPhotos,
    pendingPhotoCount: pendingPhotos.length,
    uploadingPhotos,
    photoUploadError,
    uploadImportedPhotos,
  };
}
