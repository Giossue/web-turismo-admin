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
import { adminKeys, centerSaveScope } from "@/lib/admin-queries";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import {
  contarApartadosImportados,
  type SeccionesImportadas,
} from "@/lib/ficha/mapear-secciones";
import { saveImportedCenterSection } from "@/lib/imported-center-sections";
import type { CenterFormValues } from "@/lib/center-form";
import { mergeImportedValues } from "@/lib/center-form-mappers";
import { errorMessage } from "@/lib/errors";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import type { FichaImportResult } from "./ficha-import-dialog";

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
  code,
  catalogs,
  form: { getValues, reset },
  onNotice,
  onError,
}: {
  token: string;
  code: string | null;
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
  const [importResult, setImportResult] = useState<FichaImportResult | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const pendingPhotosRef = useRef<FichaImportPhoto[]>([]);
  const pendingSectionsRef = useRef<SeccionesImportadas>({});
  const savingSectionsRef = useRef(false);
  const [savingSections, setSavingSections] = useState(false);
  const [pendingSectionCount, setPendingSectionCount] = useState(0);
  const uploadingPhotosRef = useRef(false);
  const { mutateAsync: saveSection } = useMutation({
    scope: centerSaveScope(code ?? "new"),
    mutationFn: ({
      centerCode,
      sectionCode,
      content,
    }: {
      centerCode: string;
      sectionCode: CenterSectionCode;
      content: Record<string, unknown>;
    }) => saveImportedCenterSection(queryClient, token, centerCode, sectionCode, content),
  });
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
              sourceAuthor: photo.fuente ?? undefined,
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
   * ficha. Comparten el scope de los demás guardados; después de un conflicto
   * se consulta la ficha y se conserva cualquier apartado que ya exista.
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
      // Apartados que ya tenían datos y se respetaron; no son un error.
      const skipped: string[] = [];
      const failed: string[] = [];
      let firstError: unknown;
      const title = (sectionCode: CenterSectionCode) =>
        centerSectionDefinitions.find((item) => item.code === sectionCode)?.title ??
        sectionCode;
      try {
        for (const [sectionCode, content] of entries) {
          try {
            const detail = await saveSection({ centerCode, sectionCode, content });
            (detail ? saved : skipped).push(title(sectionCode));
          } catch (cause) {
            firstError ??= cause;
            failed.push(title(sectionCode));
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
          `No se pudieron guardar algunos apartados importados (${failed.join(", ")}). ${errorMessage(firstError, "")}`.trim(),
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
    [onError, onNotice, queryClient, saveSection],
  );

  const importMutation = useMutation({
    mutationFn: (file: File) => importFichaFile(token, file),
    onMutate: () => {
      setWarnings([]);
      setImportResult(null);
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
      // El resumen se muestra en el diálogo de importación, no en un aviso.
      setImportResult({
        sections: contarApartadosImportados(imported.formulario, imported.secciones),
        totalSections: centerSectionDefinitions.length,
        photos: imported.fotos?.length ?? 0,
        warnings: new Set(imported.advertencias).size,
      });
    },
    onError: (cause) => onError(errorMessage(cause, "No se pudo importar la ficha.")),
  });

  return {
    importing: importMutation.isPending,
    importResult,
    dismissImportResult: () => setImportResult(null),
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
