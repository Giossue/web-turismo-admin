import { Grid, Stack, Typography } from "@mui/material";
import { get } from "react-hook-form";

import { FlatSurface } from "@/components/ui/flat-surface";
import { required } from "@/components/ui/form/rules";
import { SectionHeader } from "@/components/ui/section-header";
import {
  emptyConservationFactor,
  emptyDeclaration,
} from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import {
  CONSERVATION_COMPONENT_OPTIONS,
  CONSERVATION_ORIGIN_OPTIONS,
  CONSERVATION_STATE_OPTIONS,
} from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionCatalogSelect,
  SectionDateField,
  SectionResponseSelect,
  SectionSelect,
  SectionTextField,
} from "../shared/section-fields";
import { OBSERVATION_RULES, textRules } from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

const COMPONENTS = [
  { key: "attraction", label: "Atractivo" },
  { key: "environment", label: "Entorno" },
] as const;

export function ConservationFields({ catalogs }: SectionFieldsProps) {
  const factorOptions = catalogs?.conservationFactors ?? [];
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Estado por componente"
        description="La ficha distingue el estado del atractivo y de su entorno antes de registrar factores de alteración o declaratorias."
      />
      <Grid container spacing={webTokens.spacing.control}>
        {COMPONENTS.map(({ key, label }) => (
          <Grid key={key} size={{ xs: 12, md: 6 }}>
            <FlatSurface padding="compact" tone="subtle">
              <Stack spacing={webTokens.spacing.control}>
                <Typography variant="subtitle2">{label}</Typography>
                <SectionSelect
                  name={`conservation.${key}.state`}
                  label="Estado de conservación"
                  options={CONSERVATION_STATE_OPTIONS}
                  emptyLabel="Sin seleccionar"
                />
                <SectionTextField
                  name={`conservation.${key}.observation`}
                  label={`Observación del ${label.toLowerCase()}`}
                  multiline
                  minRows={2}
                  rules={textRules(2_000)}
                />
              </Stack>
            </FlatSurface>
          </Grid>
        ))}
      </Grid>

      <RepeatableFieldArray
        name="conservationFactors"
        title="Factores de alteración"
        description="Registra factores naturales o antrópicos con respuesta explícita y observación."
        addLabel="Añadir factor"
        emptyLabel="No hay factores registrados."
        createEmpty={emptyConservationFactor}
        removeLabel="Eliminar factor"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <SectionSelect
                name={`conservationFactors.${index}.component`}
                label="Componente"
                options={CONSERVATION_COMPONENT_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <SectionSelect
                name={`conservationFactors.${index}.origin`}
                label="Origen"
                options={CONSERVATION_ORIGIN_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SectionCatalogSelect
                name={`conservationFactors.${index}.factorId`}
                label="Factor catalogado"
                options={factorOptions}
                emptyLabel="Sin seleccionar"
                disabled={factorOptions.length === 0}
                rules={{ deps: [`conservationFactors.${index}.name`] }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <SectionResponseSelect
                name={`conservationFactors.${index}.response`}
                label="Presente"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`conservationFactors.${index}.name`}
                label="Nombre alternativo (otro)"
                rules={{
                  ...textRules(180),
                  // La API exige un factor catalogado o un nombre.
                  validate: (value: unknown, values: SectionFormValues) =>
                    Boolean(get(values, `conservationFactors.${index}.factorId`)) ||
                    (typeof value === "string" && value.trim().length > 0) ||
                    "Elige un factor catalogado o escribe un nombre.",
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTextField
                name={`conservationFactors.${index}.detailOther`}
                label="Detalle adicional"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTextField
                name={`conservationFactors.${index}.observation`}
                label="Observación del factor"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <RepeatableFieldArray
        name="declarations"
        title="Declaratorias del espacio turístico"
        description="Conserva entidad, denominación, fecha y ámbito de cada declaratoria."
        addLabel="Añadir declaratoria"
        emptyLabel="No hay declaratorias registradas."
        createEmpty={emptyDeclaration}
        removeLabel="Eliminar declaratoria"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`declarations.${index}.entity`}
                label="Entidad declarante"
                rules={{
                  required: required("Indica la entidad declarante"),
                  ...textRules(180),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`declarations.${index}.denomination`}
                label="Denominación"
                rules={{
                  required: required("Indica la denominación"),
                  ...textRules(250),
                }}
              />
            </Grid>
            <Grid size={{ xs: 10, sm: 5, md: 3 }}>
              <SectionDateField name={`declarations.${index}.date`} label="Fecha" />
            </Grid>
            <Grid size={{ xs: 2, sm: 1, md: 1 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTextField
                name={`declarations.${index}.scope`}
                label="Ámbito"
                rules={textRules(120)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTextField
                name={`declarations.${index}.observation`}
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
