"use client";

import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { CenterFormValues } from "@/lib/center-form";

const AUTOSAVE_DELAY_MS = 2_000;

type AutosaveOptions = {
  /** Guarda solo si la ficha es editable. */
  enabled: boolean;
  /** Comprobación silenciosa previa; si falla, el cambio queda pendiente sin mostrar errores. */
  canSave: (values: CenterFormValues) => boolean;
  save: (values: CenterFormValues) => Promise<boolean>;
};

/**
 * Autoguardado del formulario principal: tras 2 s sin cambios de la persona
 * (eventos de los campos, no los `reset` de datos del servidor) valida y
 * guarda. Nunca hay dos guardados propios en curso: un cambio durante un
 * guardado espera a que termine.
 */
export function useCenterAutosave(
  { subscribe, getValues, trigger }: UseFormReturn<CenterFormValues>,
  options: AutosaveOptions,
) {
  const optionsRef = useRef(options);
  const pendingRef = useRef(false);
  const runningRef = useRef<Promise<boolean> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /**
   * Guarda ya los cambios pendientes (o, con `force`, aunque no los haya).
   * Devuelve `true` si no había nada que guardar o si se guardó.
   */
  const flush = useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<boolean> => {
      cancel();
      // Si otro guardado empezó mientras se validaba, se espera y se vuelve a comprobar.
      do {
        while (runningRef.current) await runningRef.current;
        const { enabled, canSave } = optionsRef.current;
        if (!enabled || (!force && !pendingRef.current)) return true;
        if (!canSave(getValues()) || !(await trigger())) return false;
      } while (runningRef.current);
      pendingRef.current = false;
      const run = optionsRef.current.save(getValues());
      runningRef.current = run;
      try {
        const saved = await run;
        if (!saved) pendingRef.current = true;
        return saved;
      } finally {
        runningRef.current = null;
      }
    },
    [cancel, getValues, trigger],
  );

  /** Marca cambios sin guardar y reprograma el guardado. */
  const markChanged = useCallback(() => {
    pendingRef.current = true;
    if (!optionsRef.current.enabled) return;
    cancel();
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  }, [cancel, flush]);

  /** Descarta el guardado programado y los cambios pendientes. */
  const discard = useCallback(() => {
    cancel();
    pendingRef.current = false;
  }, [cancel]);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ name, type }) => {
        // Solo los eventos de los campos traen `type`; los `reset` y los
        // `setValue` de la sincronización con el servidor no cuentan.
        if (name && type) markChanged();
      },
    });
    return () => {
      unsubscribe();
      cancel();
    };
  }, [cancel, markChanged, subscribe]);

  return { flush, markChanged, discard };
}
