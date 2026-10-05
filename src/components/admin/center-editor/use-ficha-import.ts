"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  importFichaFile,
  saveAdminCenterSection,
  uploadAdminCenterMedia,
  type AdminCatalogs,
  type AdminCenterDetail,
  type FichaImportPhoto,
} from "@/lib/admin-api";
import { adminKeys, getCachedCenterVersion } from "@/lib/admin-queries";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import type { SeccionesImportadas } from "@/lib/ficha/mapear-secciones";
import { ApiError } from "@/lib/http";
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
  const pendingSectionsRef = useRef<SeccionesImportadas>({});
  const savingSectionsRef = useRef(false);
  const [savingSections, setSavingSections] = useState(false);
  const [pendingSectionCount, setPendingSectionCount] = useState(0);
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

  /**
   * Guarda los apartados importados que aún no tienen información en la
   * ficha (nunca pisa lo que ya se capturó). Van en serie con la versión
   * vigente; ante un conflicto (409) se relee la ficha y se reintenta una vez.
   */
  const saveImportedSections = useCallback(
    async (centerCode: string) => {
      const entries = Object.entries(pendingSectionsRef.current) as Array<
        [CenterSectionCode, Record<string, unknown>]
      >;
      if (entries.length === 0 || savingSectionsRef.current) return;
      savingSectionsRef.current = true;
      setSavingSections(true);
      const saved: string[] = [];
      const skipped: string[] = [];
      let firstError: unknown;
      const title = (sectionCode: CenterSectionCode) =>
        centerSectionDefinitions.find((item) => item.code === sectionCode)?.title ??
        sectionCode;
      try {
        for (const [sectionCode, content] of entries) {
          const current = queryClient.getQueryData<AdminCenterDetail>(
            adminKeys.center(centerCode),
          );
          const currentSections = (current?.draft ?? current?.published)?.sections;
          if (currentSections?.[sectionCode] !== undefined) {
            skipped.push(title(sectionCode));
            continue;
          }
          const save = () =>
            saveAdminCenterSection(
              token,
              centerCode,
              sectionCode,
              content,
              getCachedCenterVersion(queryClient, centerCode),
            );
          try {
            let detail: AdminCenterDetail;
            try {
              detail = await save();
            } catch (cause) {
              if (!(cause instanceof ApiError) || cause.status !== 409) throw cause;
              await queryClient.refetchQueries({
                queryKey: adminKeys.center(centerCode),
              });
              detail = await save();
            }
            queryClient.setQueryData(adminKeys.center(centerCode), detail);
            saved.push(title(sectionCode));
          } catch (cause) {
            firstError ??= cause;
            skipped.push(title(sectionCode));
          }
        }
      } finally {
        pendingSectionsRef.current = {};
        setPendingSectionCount(0);
        savingSectionsRef.current = false;
        setSavingSections(false);
        await queryClient.invalidateQueries({
          queryKey: adminKeys.centerSections(centerCode),
        });
      }
      if (firstError) {
        onError(
          `No se pudieron guardar algunos apartados importados (${skipped.join(", ")}). ${errorMessage(firstError, "")}`.trim(),
        );
      } else if (saved.length > 0) {
        onNotice(
          `Se cargaron ${saved.length} apartado(s) desde la ficha${
            skipped.length > 0
              ? `; se conservaron sin cambios los que ya tenían información (${skipped.join(", ")})`
              : ""
          }.`,
        );
      }
    },
    [onError, onNotice, queryClient, token],
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
      pendingSectionsRef.current = imported.secciones ?? {};
      setPendingSectionCount(Object.keys(pendingSectionsRef.current).length);
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
    pendingSectionCount,
    savingSections,
    saveImportedSections,
  };
}
