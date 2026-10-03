"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import {
  createAdminCenter,
  getAdminCenter,
  saveAdminCenter,
  setAdminCenterActive,
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
const CONFLICT_MESSAGE =
  "La ficha cambió mientras la editabas. Se cargó la versión vigente.";

type SaveVariables = { values: CenterFormValues; submitForReview: boolean };

type SaveOptions = { submitForReview?: boolean; silent?: boolean };

/**
 * Guardado y activación del formulario principal. Ambas mutaciones comparten
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
  onConflictReload,
}: {
  token: string;
  code: string | null;
  catalogs: AdminCatalogs | null;
  onSaved: (detail: AdminCenterDetail) => void;
  /** Tras un 409, recibe la ficha vigente para reemplazar el formulario. */
  onConflictReload: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  // Código asignado al crear: los guardados que ya estaban en cola deben
  // actualizar esa ficha en lugar de crear otra.
  const createdCodeRef = useRef<string | null>(null);
  const applyingActiveRef = useRef(false);
  const scope = centerSaveScope(code ?? "new");
  const storeDetail = async (detail: AdminCenterDetail) => {
    const queryKey = adminKeys.center(detail.code);
    // Una lectura en curso no debe pisar lo recién guardado (y su versión).
    await queryClient.cancelQueries({ queryKey, exact: true });
    queryClient.setQueryData(queryKey, detail);
  };

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
      await storeDetail(saved);
      return submitAdminCenterReview(token, saved.code);
    },
    onSuccess: storeDetail,
  });

  const activeMutation = useMutation({
    scope,
    mutationFn: (active: boolean) => setAdminCenterActive(token, code as string, active),
    onSuccess: storeDetail,
  });

  function reportSaveError(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 409) {
      onError(errorMessage(cause, CONFLICT_MESSAGE));
      // Otra edición ganó: se recarga la ficha y el formulario la adopta, en
      // lugar de sobrescribirla con los cambios locales en el siguiente guardado.
      const targetCode = code ?? createdCodeRef.current;
      if (targetCode) {
        void queryClient
          .fetchQuery({
            queryKey: adminKeys.center(targetCode),
            queryFn: () => getAdminCenter(token, targetCode),
          })
          .then(onConflictReload, () => undefined);
      }
      return;
    }
    onError(errorMessage(cause, "No se pudo actualizar la ficha."));
  }

  /** Guarda (o crea) la ficha; devuelve la ficha guardada o `null` si falló. */
  async function save(
    values: CenterFormValues,
    { submitForReview = false, silent = false }: SaveOptions = {},
  ): Promise<AdminCenterDetail | null> {
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
      return saved;
    } catch (cause) {
      reportSaveError(cause);
      return null;
    }
  }

  async function setActive(active: boolean) {
    if (!code || applyingActiveRef.current) return;
    applyingActiveRef.current = true;
    onError(null);
    try {
      const saved = await activeMutation.mutateAsync(active);
      onSaved(saved);
      onNotice(active ? "La ficha fue activada." : "La ficha fue desactivada.");
    } catch (cause) {
      onError(errorMessage(cause, "No se pudo cambiar la activación de la ficha."));
    } finally {
      applyingActiveRef.current = false;
    }
  }

  return {
    save,
    setActive,
    reviewing: saveMutation.isPending && saveMutation.variables?.submitForReview === true,
    activating: activeMutation.isPending,
    working: saveMutation.isPending || activeMutation.isPending,
  };
}
