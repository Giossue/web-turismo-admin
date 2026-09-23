import { Grid, Stack } from "@mui/material";

import { SectionHeader } from "@/components/ui/section-header";
import { emptyTraining } from "@/lib/center-sections/form-defaults";
import { TRAINING_GROUP_OPTIONS } from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { FieldGroup } from "../shared/field-group";
import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionCatalogSelect,
  SectionNumberField,
  SectionSelect,
  SectionTextField,
} from "../shared/section-fields";
import { COUNT_LIMITS, OBSERVATION_RULES, textRules } from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

export function HumanResourcesFields({ catalogs }: SectionFieldsProps) {
  const trainingTypes = catalogs?.trainingTypes ?? [];
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Recurso humano"
        description="Registra el resumen del personal y la formación, capacitación e idiomas disponibles en el mismo centro turístico."
      />
      <FieldGroup title="Resumen del personal">
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionNumberField
            name="humanResourceSummary.administrationOperation"
            label="Administración y operación"
            {...COUNT_LIMITS}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionNumberField
            name="humanResourceSummary.specializedTourism"
            label="Personal especializado en turismo"
            {...COUNT_LIMITS}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="humanResourceSummary.observation"
            label="Observación"
            rules={OBSERVATION_RULES}
          />
        </Grid>
      </FieldGroup>

      <RepeatableFieldArray
        name="humanResourceTraining"
        title="Formación y capacidades"
        description="Agrupa educación, capacitación e idiomas y conserva la cantidad de personas."
        addLabel="Añadir formación"
        emptyLabel="No hay formación registrada."
        createEmpty={emptyTraining}
        removeLabel="Eliminar formación"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <SectionSelect
                name={`humanResourceTraining.${index}.group`}
                label="Grupo"
                options={TRAINING_GROUP_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCatalogSelect
                name={`humanResourceTraining.${index}.typeId`}
                label="Tipo de formación"
                options={trainingTypes}
                emptyLabel="Sin seleccionar"
                disabled={trainingTypes.length === 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionTextField
                name={`humanResourceTraining.${index}.name`}
                label="Formación, curso o idioma"
                rules={textRules(140)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <SectionNumberField
                name={`humanResourceTraining.${index}.quantity`}
                label="Personas"
                {...COUNT_LIMITS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SectionTextField
                name={`humanResourceTraining.${index}.detailOther`}
                label="Detalle de otro"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={12}>
              <SectionTextField
                name={`humanResourceTraining.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />
    </Stack>
  );
}
