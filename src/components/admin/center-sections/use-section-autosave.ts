import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { FieldErrors, FieldPath, UseFormReturn } from "react-hook-form";

import {
  saveAdminCenterSection,
  type AdminCenterDetail,
  type AdminCenterSections,
} from "@/lib/admin-api";
import { adminKeys, centerSaveScope, getCachedCenterVersion } from "@/lib/admin-queries";
import { createSectionValues } from "@/lib/center-sections/create-section-values";
import type { SectionDefinition } from "@/lib/center-sections/definitions";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import {
  toSectionContent,
  type SectionContent,
} from "@/lib/center-sections/to-section-content";
import { errorMessage } from "@/lib/errors";
import { isRecord } from "@/lib/values";

/** Espera desde el último cambio hasta el guardado automático. */
const AUTOSAVE_DELAY_MS = 2_000;

type SaveVariables = { code: string; content: SectionContent; key: string };

/**
 * Clave comparable del contenido que se guardaría. Dos formularios con la
 * misma clave guardan lo mismo (ignora espacios sobrantes, formato numérico…).
 */
function contentKey(definition: SectionDefinition, values: SectionFormValues): string {
  return JSON.stringify(toSectionContent(definition.code, values));
}

/** Ruta del primer campo con error, en el orden en que se validaron. */
function firstErrorPath(errors: object, prefix = ""): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value !== "object" || value === null) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof (value as { type?: unknown }).type === "string") return path;
    const nested = firstErrorPath(value, path);
    if (nested) return nested;
  }
  return null;
}

/** Si la persona está escribiendo en un campo de texto (no se le quita el foco). */
function isEditingText(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
}

/**
 * Guardado automático de un apartado de la ficha.
 *
 * - Se suscribe una sola vez al formulario y programa el guardado
 *   `AUTOSAVE_DELAY_MS` después del último cambio de contenido; el
 *   temporizador solo se cancela si el contenido vuelve a coincidir con lo
 *   guardado, y al desmontar un cambio pendiente se guarda de inmediato.
 * - Los guardados corren por `useMutation` con `centerSaveScope(code)`: todos
 *   los de la ficha (formulario principal y apartados) van en serie y cada uno
 *   lee la versión de la caché al ejecutarse, así no chocan (409).
 * - Tras guardar actualiza las cachés de la ficha y de secciones antes de
 *   avisar al editor. El formulario no se reinicia con el eco del servidor
 *   (su contenido es el mismo); solo adopta cambios externos cuando no hay
 *   ediciones locales pendientes.
 * - Solo limpia los errores que este apartado informó.
 */
export function useSectionAutosave({
  form,
  token,
  code,
  definition,
  rawSection,
  canEdit,
  onDetailChanged,
  onError,
}: {
  form: UseFormReturn<SectionFormValues>;
  token: string;
  code: string | null;
  definition: SectionDefinition;
  /** Contenido guardado del apartado (caché de secciones de la ficha). */
  rawSection: unknown;
  canEdit: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { getValues, handleSubmit, reset, setFocus, subscribe } = form;
  const [initialKey] = useState(() => contentKey(definition, getValues()));
  /** Contenido que el servidor ya tiene (última carga o último guardado confirmado). */
  const savedKeyRef = useRef(initialKey);
  /** Contenido enviado y todavía sin confirmar (en curso o en cola). */
  const pendingKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedErrorRef = useRef(false);

  function reportError(message: string) {
    reportedErrorRef.current = true;
    onError(message);
  }

  function clearReportedError() {
    if (!reportedErrorRef.current) return;
    reportedErrorRef.current = false;
    onError(null);
  }

  function clearTimer() {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function isUnchanged(key: string): boolean {
    return key === savedKeyRef.current || key === pendingKeyRef.current;
  }

  const mutation = useMutation({
    scope: code ? centerSaveScope(code) : undefined,
    // La versión se lee al ejecutar, no al programar: la mutación anterior del
    // mismo alcance ya dejó la suya en la caché.
    mutationFn: ({ code: centerCode, content }: SaveVariables) =>
      saveAdminCenterSection(
        token,
        centerCode,
        definition.code,
        content,
        getCachedCenterVersion(queryClient, centerCode),
      ),
    // Se espera a este `onSuccess` antes de ejecutar la siguiente mutación en
    // cola, por eso las cachés se actualizan aquí.
    onSuccess: async (saved, { code: centerCode, key }) => {
      const section = saved.draft?.sections?.[definition.code];
      savedKeyRef.current = isRecord(section)
        ? contentKey(definition, createSectionValues(definition, section))
        : key;
      if (pendingKeyRef.current === key) pendingKeyRef.current = null;
      // Una lectura en curso no debe pisar lo recién guardado.
      await queryClient.cancelQueries({ queryKey: adminKeys.center(centerCode) });
      queryClient.setQueryData(adminKeys.center(centerCode), saved);
      if (isRecord(section)) {
        queryClient.setQueryData<AdminCenterSections>(
          adminKeys.centerSections(centerCode),
          (current) =>
            current && {
              ...current,
              version: saved.version,
              sections: { ...current.sections, [definition.code]: section },
            },
        );
      }
      clearReportedError();
      onDetailChanged(saved);
    },
    onError: (cause, { key }) => {
      if (pendingKeyRef.current === key) pendingKeyRef.current = null;
      reportError(
        errorMessage(cause, "No se pudo actualizar la información de esta sección."),
      );
    },
  });

  const flush = useEffectEvent(() => {
    clearTimer();
    if (!code || !canEdit) return;
    const centerCode = code;
    void handleSubmit(
      (values) => {
        const content = toSectionContent(definition.code, values);
        const key = JSON.stringify(content);
        if (isUnchanged(key)) return;
        pendingKeyRef.current = key;
        mutation.mutate({ code: centerCode, content, key });
      },
      (errors: FieldErrors<SectionFormValues>) => {
        reportError("Corrige los campos marcados.");
        const path = firstErrorPath(errors);
        if (path && !isEditingText()) setFocus(path as FieldPath<SectionFormValues>);
      },
    )();
  });

  const scheduleSave = useEffectEvent((values: SectionFormValues) => {
    if (!code || !canEdit) return;
    clearTimer();
    if (isUnchanged(contentKey(definition, values))) {
      // Nada pendiente de guardar: el aviso anterior de este apartado ya no aplica.
      clearReportedError();
      return;
    }
    timerRef.current = setTimeout(() => flush(), AUTOSAVE_DELAY_MS);
  });

  const flushPending = useEffectEvent(() => {
    if (timerRef.current !== null) flush();
  });

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => scheduleSave(values),
    });
    return () => {
      unsubscribe();
      // Al desmontar, el cambio pendiente se guarda en lugar de perderse.
      flushPending();
    };
  }, [subscribe]);

  // Cambios del apartado que no vienen de este formulario (otra pestaña,
  // recarga de la caché): se adoptan solo si no hay ediciones locales.
  const syncFromServer = useEffectEvent((section: unknown) => {
    const next = createSectionValues(definition, section);
    const nextKey = contentKey(definition, next);
    if (nextKey === savedKeyRef.current) return;
    const hasLocalChanges = contentKey(definition, getValues()) !== savedKeyRef.current;
    savedKeyRef.current = nextKey;
    if (!hasLocalChanges) reset(next);
  });

  useEffect(() => {
    syncFromServer(rawSection);
  }, [rawSection]);
}
