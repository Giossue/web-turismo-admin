import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import { Divider, Stack } from "@mui/material";
import { memo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { FlatSurface } from "@/components/ui/flat-surface";
import { EditableContext } from "@/components/ui/form/editable-context";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminCatalogs, AdminCenterDetail, AdminMediaItem } from "@/lib/admin-api";
import { createSectionValues } from "@/lib/center-sections/create-section-values";
import type { SectionDefinition } from "@/lib/center-sections/definitions";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import { webTokens } from "@/theme/tokens";

import { GenericRowsFields } from "./fields/generic-rows";
import { sectionFieldsRegistry } from "./fields/registry";
import { SectionResponseSelect, SectionTextField } from "./shared/section-fields";
import { textRules } from "./shared/section-rules";
import { useSectionAutosave } from "./use-section-autosave";

type SectionCardProps = {
  active: boolean;
  definition: SectionDefinition;
  token: string;
  code: string | null;
  canEdit: boolean;
  /** Contenido guardado del apartado; su identidad solo cambia si cambia el apartado. */
  rawSection: unknown;
  catalogs: AdminCatalogs | null;
  mediaItems: readonly AdminMediaItem[];
  sugerencias?: SugerenciasSecciones | null;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
};

/**
 * Un apartado de la ficha con su propio formulario y guardado automático.
 * Todas las tarjetas quedan montadas (las inactivas ocultas) para conservar
 * ediciones pendientes al navegar entre pasos.
 */
export const SectionCard = memo(function SectionCard({
  active,
  definition,
  token,
  code,
  canEdit,
  rawSection,
  catalogs,
  mediaItems,
  sugerencias,
  onDetailChanged,
  onError,
}: SectionCardProps) {
  const [defaultValues] = useState(() => createSectionValues(definition, rawSection));
  // El foco en el primer error lo decide el guardado automático para no
  // quitárselo a quien está escribiendo.
  const form = useForm<SectionFormValues>({
    defaultValues,
    mode: "onBlur",
    shouldFocusError: false,
  });
  useSectionAutosave({
    form,
    token,
    code,
    definition,
    rawSection,
    canEdit,
    onDetailChanged,
    onError,
  });

  const response = useWatch({ control: form.control, name: "response" });
  // Con "No" o "No aplica" el detalle no se muestra. Los campos ocultos se
  // desmontan (en vez de ocultarse con CSS): react-hook-form conserva sus
  // valores, que se siguen guardando, pero no los valida, así un dato oculto
  // e inválido no bloquea el guardado.
  const showDetails = response !== "NO" && response !== "NO_APLICA";
  const Fields = sectionFieldsRegistry[definition.code];

  return (
    <FormProvider {...form}>
      <EditableContext value={canEdit}>
        <FlatSurface
          id={`center-detail-section-${definition.code}`}
          padding="default"
          sx={{ display: active ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<FactCheckRounded />}
              title={definition.title}
              description={definition.description}
            />
            <SectionResponseSelect name="response" label="Resultado de la sección" />
            {Fields && showDetails ? (
              <>
                <Fields
                  catalogs={catalogs}
                  mediaItems={mediaItems}
                  sugerencias={sugerencias}
                />
                <Divider />
              </>
            ) : null}
            <Stack spacing={webTokens.spacing.control}>
              <SectionTextField
                name="observation"
                label="Observación general del apartado"
                multiline
                minRows={3}
                rules={textRules(2_000)}
              />
              {showDetails ? (
                <GenericRowsFields
                  hasSuggestedRows={definition.suggestedRows.length > 0}
                />
              ) : null}
            </Stack>
          </Stack>
        </FlatSurface>
      </EditableContext>
    </FormProvider>
  );
});
