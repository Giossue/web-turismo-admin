"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { importFichaFile, type AdminCatalogs } from "@/lib/admin-api";
import type { CenterFormValues } from "@/lib/center-form";
import { mergeImportedValues } from "@/lib/center-form-mappers";
import { errorMessage } from "@/lib/errors";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";

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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciasSecciones | null>(null);
  const importMutation = useMutation({
    mutationFn: (file: File) => importFichaFile(token, file),
    onMutate: () => {
      setWarnings([]);
      onError(null);
    },
    onSuccess: (imported) => {
      const current = getValues();
      const next = catalogs
        ? mergeImportedValues(current, imported.formulario, catalogs)
        : { ...current, ...imported.formulario };
      reset(next, { keepDefaultValues: true, keepDirtyValues: false });
      setWarnings([...new Set(imported.advertencias)]);
      setSugerencias(imported.sugerenciasSecciones ?? null);
      onNotice(
        "Se precargó el formulario desde la ficha. Revisa las advertencias antes de guardar.",
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
  };
}
