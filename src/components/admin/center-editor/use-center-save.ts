"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import {
  createAdminCenter,
  publishAdminCenter,
  saveAdminCenter,
  submitAdminCenterReview,
  type AdminCatalogs,
  type AdminCenterDetail,
} from "@/lib/admin-api";
import { adminKeys, centerSaveScope, getCachedCenterVersion } from "@/lib/admin-queries";
import type { CenterFormValues } from "@/lib/center-form";
import { toPayload } from "@/lib/center-form-mappers";
import { errorMessage } from "@/lib/errors";
import { ApiError } from "@/lib/http";

/** Mensaje de la API ante un conflicto de versión (409). */
const CONFLICT_MESSAGE = "La ficha cambió mientras la editabas. Recarga antes de guardar.";

type SaveVariables = { values: CenterFormValues; submitForReview: boolean };

type SaveOptions = { submitForReview?: boolean; silent?: boolean };

/**
 * Guardado y publicación del formulario principal. Ambas mutaciones comparten
 * `centerSaveScope(code)` con los guardados de secciones, así TanStack las
 * ejecuta en serie; la versión se lee de la caché al ejecutar cada una y la
 * respuesta se escribe en `adminKeys.center(code)` antes de que corra la
 * siguiente.
 */
export function useCenterSave({
  token,
  code,
  catalogs,
  onSaved,
  onNotice,
  onError,
}: {
  token: string;
  code: string | null;
  catalogs: AdminCatalogs | null;
  onSaved: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  // Código asignado al crear: los guardados que ya estaban en cola deben
  // actualizar esa ficha en lugar de crear otra.
  const createdCodeRef = useRef<string | null>(null);
  const scope = centerSaveScope(code ?? "new");
  const storeDetail = (detail: AdminCenterDetail) =>
    queryClient.setQueryData(adminKeys.center(detail.code), detail);

  const saveMutation = useMutation({
    scope,
    mutationFn: async ({ values, submitForReview }: SaveVariables) => {
      const targetCode = code ?? createdCodeRef.current;
      let saved: AdminCenterDetail;
      if (targetCode) {
        const version = getCachedCenterVersion(queryClient, targetCode);
        saved = await saveAdminCenter(
          token,
          targetCode,
          toPayload(values, catalogs, version),
        );
      } else {
        saved = await createAdminCenter(token, toPayload(values, catalogs));
        createdCodeRef.current = saved.code;
      }
      if (!submitForReview) return saved;
      storeDetail(saved);
      return submitAdminCenterReview(token, saved.code);
    },
    onSuccess: storeDetail,
  });

  const publishMutation = useMutation({
    scope,
    mutationFn: (targetCode: string) => publishAdminCenter(token, targetCode),
    onSuccess: storeDetail,
  });

  function reportSaveError(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 409) {
      onError(errorMessage(cause, CONFLICT_MESSAGE));
      // Recarga la ficha para continuar con la versión vigente; los cambios
      // sin guardar del formulario se conservan (`keepDirtyValues`).
      const targetCode = code ?? createdCodeRef.current;
      if (targetCode) {
        void queryClient.invalidateQueries({ queryKey: adminKeys.center(targetCode) });
      }
      return;
    }
    onError(errorMessage(cause, "No se pudo actualizar la ficha."));
  }

  /** Guarda (o crea) la ficha; devuelve `true` si se guardó. */
  async function save(
    values: CenterFormValues,
    { submitForReview = false, silent = false }: SaveOptions = {},
  ): Promise<boolean> {
    onError(null);
    try {
      const saved = await saveMutation.mutateAsync({ values, submitForReview });
      onSaved(saved);
      if (!silent) {
        onNotice(
          submitForReview
            ? "La ficha fue enviada a revisión."
            : "La ficha fue actualizada.",
        );
      }
      return true;
    } catch (cause) {
      reportSaveError(cause);
      return false;
    }
  }

  async function publish() {
    if (!code) return;
    onError(null);
    try {
      const published = await publishMutation.mutateAsync(code);
      onSaved(published);
      onNotice("La ficha fue publicada en la aplicación móvil.");
    } catch (cause) {
      onError(errorMessage(cause, "No se pudo publicar la ficha."));
    }
  }

  return {
    save,
    publish,
    reviewing: saveMutation.isPending && saveMutation.variables?.submitForReview === true,
    publishing: publishMutation.isPending,
    working: saveMutation.isPending || publishMutation.isPending,
  };
}
