import { Grid, Stack } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import { required } from "@/components/ui/form/rules";
import { SectionHeader } from "@/components/ui/section-header";
import {
  emptyVisitorInformant,
  emptyVisitorOrigin,
  emptyVisitorSeason,
} from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import {
  VISITOR_FREQUENCY_OPTIONS,
  VISITOR_ORIGIN_OPTIONS,
  VISITOR_REGISTRY_TYPE_OPTIONS,
  VISITOR_SEASON_OPTIONS,
} from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { FieldGroup } from "../shared/field-group";
import { MonthMultiSelect } from "../shared/month-multi-select";
import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionNumberField,
  SectionResponseSelect,
  SectionSelect,
  SectionTextField,
} from "../shared/section-fields";
import {
  COUNT_LIMITS,
  OBSERVATION_RULES,
  textRules,
  YEAR_LIMITS,
} from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

const INFLUX_COUNTS = [
  { key: "weekday", label: "Entre semana" },
  { key: "weekend", label: "Fin de semana" },
  { key: "holidays", label: "Feriados" },
] as const;

export function VisitorsFields({ catalogs }: SectionFieldsProps) {
  const months = catalogs?.months ?? [];
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Visitantes y afluencia"
        description="Conserva registro, temporadas, procedencias, informantes y afluencia como datos separados; una cantidad cero no se confunde con ausencia de información."
      />
      <RegistryGroup />

      <RepeatableFieldArray
        name="visitorSeasons"
        title="Temporadas de visitación"
        description="Registra temporadas altas o bajas, cantidad, año y meses."
        addLabel="Añadir temporada"
        emptyLabel="No hay temporadas registradas."
        createEmpty={emptyVisitorSeason}
        removeLabel="Eliminar temporada"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 3 }}>
              <SectionSelect
                name={`visitorSeasons.${index}.type`}
                label="Temporada"
                options={VISITOR_SEASON_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <SectionNumberField
                name={`visitorSeasons.${index}.quantity`}
                label="Cantidad"
                {...COUNT_LIMITS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <SectionNumberField
                name={`visitorSeasons.${index}.year`}
                label="Año"
                {...YEAR_LIMITS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MonthMultiSelect
                name={`visitorSeasons.${index}.months`}
                label="Meses"
                months={months}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }}>{removeButton}</Grid>
            <Grid size={12}>
              <SectionTextField
                name={`visitorSeasons.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <RepeatableFieldArray
        name="visitorOrigins"
        title="Procedencias"
        description="Para procedencia nacional indica la ciudad; para extranjera, el país."
        addLabel="Añadir procedencia"
        emptyLabel="No hay procedencias registradas."
        createEmpty={emptyVisitorOrigin}
        removeLabel="Eliminar procedencia"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 3 }}>
              <SectionSelect
                name={`visitorOrigins.${index}.type`}
                label="Procedencia"
                options={VISITOR_ORIGIN_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SectionTextField
                name={`visitorOrigins.${index}.place`}
                label="Ciudad o país"
                rules={{ required: required("Indica la ciudad o el país"), ...textRules(150) }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1.5 }}>
              <SectionNumberField
                name={`visitorOrigins.${index}.month`}
                label="Mes"
                integer
                min={1}
                max={12}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1.5 }}>
              <SectionNumberField
                name={`visitorOrigins.${index}.year`}
                label="Año"
                {...YEAR_LIMITS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1.5 }}>
              <SectionNumberField
                name={`visitorOrigins.${index}.quantity`}
                label="Cantidad"
                {...COUNT_LIMITS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 0.5 }}>{removeButton}</Grid>
            <Grid size={12}>
              <SectionTextField
                name={`visitorOrigins.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <RepeatableFieldArray
        name="visitorInformants"
        title="Informantes clave"
        description="Registra la persona que aportó la información y un contacto opcional."
        addLabel="Añadir informante"
        emptyLabel="No hay informantes registrados."
        createEmpty={emptyVisitorInformant}
        removeLabel="Eliminar informante"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`visitorInformants.${index}.name`}
                label="Nombre"
                rules={{ required: required("Indica el nombre"), ...textRules(180) }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`visitorInformants.${index}.contact`}
                label="Contacto"
                rules={textRules(120)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <SectionTextField
                name={`visitorInformants.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>{removeButton}</Grid>
          </Grid>
        )}
      />

      <FieldGroup title="Afluencia habitual">
        {INFLUX_COUNTS.map(({ key, label }) => (
          <Grid key={key} size={{ xs: 12, sm: 3 }}>
            <SectionNumberField
              name={`visitorInflux.${key}`}
              label={label}
              {...COUNT_LIMITS}
            />
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 3 }}>
          <SectionSelect
            name="visitorInflux.frequency"
            label="Frecuencia"
            options={VISITOR_FREQUENCY_OPTIONS}
            emptyLabel="Sin seleccionar"
          />
        </Grid>
        <Grid size={12}>
          <SectionTextField
            name="visitorInflux.observation"
            label="Observación de afluencia"
            rules={OBSERVATION_RULES}
          />
        </Grid>
      </FieldGroup>
    </Stack>
  );
}

function RegistryGroup() {
  const { control } = useFormContext<SectionFormValues>();
  const exists = useWatch({ control, name: "visitorRegistry.exists" }) === "SI";
  const reports = useWatch({ control, name: "visitorRegistry.reports" }) === "SI";
  return (
    <FieldGroup title="Registro de visitantes">
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionResponseSelect name="visitorRegistry.exists" label="¿Existe registro?" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionSelect
          name="visitorRegistry.type"
          label="Tipo de registro"
          options={VISITOR_REGISTRY_TYPE_OPTIONS}
          emptyLabel="Sin seleccionar"
          disabled={!exists}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionNumberField
          name="visitorRegistry.years"
          label="Años de registro"
          disabled={!exists}
          integer
          min={0}
          max={200}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionResponseSelect
          name="visitorRegistry.reports"
          label="¿Genera reportes?"
          disabled={!exists}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <SectionTextField
          name="visitorRegistry.frequency"
          label="Frecuencia de reportes"
          disabled={!reports}
          rules={textRules(80)}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name="visitorRegistry.observation"
          label="Observación del registro"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </FieldGroup>
  );
}
