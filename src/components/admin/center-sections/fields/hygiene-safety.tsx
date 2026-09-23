import { Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SectionHeader } from "@/components/ui/section-header";
import type { AdminCatalogs, CatalogOption } from "@/lib/admin-api";
import { emptyHygieneEntry } from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import {
  HYGIENE_CONDITION_OPTIONS,
  HYGIENE_ENTRY_OPTIONS,
  SERVICE_SCOPE_OPTIONS,
  type HygieneEntryKind,
} from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { FieldGroup } from "../shared/field-group";
import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionCatalogSelect,
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

/** Tipos de registro que distinguen si el servicio está en el atractivo o en el poblado. */
const SCOPED_KINDS: ReadonlySet<HygieneEntryKind> = new Set([
  "BASIC_SERVICE",
  "HEALTH",
  "COMMUNICATION",
]);

const RADIO_USES = [
  { key: "available", label: "¿Hay radios disponibles?" },
  { key: "visitorUse", label: "Uso para visitantes" },
  { key: "internalUse", label: "Uso interno" },
  { key: "emergencyUse", label: "Uso en emergencias" },
] as const;

function typeOptionsFor(
  catalogs: AdminCatalogs | null,
  kind: HygieneEntryKind,
): readonly CatalogOption[] {
  if (!catalogs) return [];
  switch (kind) {
    case "BASIC_SERVICE":
      return catalogs.basicServiceTypes;
    case "SIGNAGE":
      return catalogs.signageTypes;
    case "HEALTH":
      return catalogs.healthServiceTypes;
    case "SECURITY":
      return catalogs.securityServiceTypes;
    case "COMMUNICATION":
      return catalogs.communicationTypes;
    case "THREAT":
      return catalogs.threatTypes;
  }
}

export function HygieneSafetyFields({ catalogs }: SectionFieldsProps) {
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Higiene, seguridad y amenazas"
        description="Cada registro conserva su ámbito, respuesta, cantidad y observación. Las radios y el plan de contingencia se capturan como controles separados."
      />
      <RepeatableFieldArray
        name="hygieneEntries"
        title="Servicios y amenazas"
        description="Usa el tipo de registro para separar servicios básicos, señalética, salud, seguridad, comunicación y multiamenazas."
        addLabel="Añadir registro"
        emptyLabel="No hay registros de higiene y seguridad."
        createEmpty={emptyHygieneEntry}
        removeLabel="Eliminar registro"
        renderRow={(index, removeButton) => (
          <HygieneEntryRow
            index={index}
            catalogs={catalogs}
            removeButton={removeButton}
          />
        )}
      />
      <RadiosGroup />
      <ContingencyGroup />
    </Stack>
  );
}

function HygieneEntryRow({
  index,
  catalogs,
  removeButton,
}: {
  index: number;
  catalogs: AdminCatalogs | null;
  removeButton: ReactNode;
}) {
  const { control, setValue } = useFormContext<SectionFormValues>();
  const kind = useWatch({ control, name: `hygieneEntries.${index}.kind` });
  const response = useWatch({ control, name: `hygieneEntries.${index}.response` });
  // Las amenazas siempre admiten detalle; el resto solo si el servicio existe.
  const detailEnabled =
    kind === "THREAT" || (response !== "NO" && response !== "NO_APLICA");
  const typeOptions = typeOptionsFor(catalogs, kind);
  const signageMaterials = catalogs?.signageMaterials ?? [];

  return (
    <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionSelect
          name={`hygieneEntries.${index}.kind`}
          label="Tipo de registro"
          options={HYGIENE_ENTRY_OPTIONS}
          // El tipo catalogado y el material dependen del tipo de registro.
          onValueChange={() => {
            setValue(`hygieneEntries.${index}.typeId`, "", { shouldDirty: true });
            setValue(`hygieneEntries.${index}.secondaryId`, "", { shouldDirty: true });
            setValue(`hygieneEntries.${index}.secondary`, "", { shouldDirty: true });
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionSelect
          name={`hygieneEntries.${index}.scope`}
          label="Ámbito"
          options={SERVICE_SCOPE_OPTIONS}
          emptyLabel="No aplica"
          disabled={!SCOPED_KINDS.has(kind)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 6 }}>
        <SectionCatalogSelect
          name={`hygieneEntries.${index}.typeId`}
          label="Tipo catalogado"
          options={typeOptions}
          emptyLabel="Sin seleccionar"
          disabled={typeOptions.length === 0}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionTextField
          name={`hygieneEntries.${index}.name`}
          label="Nombre alternativo (otro)"
          disabled={!detailEnabled}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionTextField
          name={`hygieneEntries.${index}.provider`}
          label="Proveedor"
          disabled={!detailEnabled}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionTextField
          name={`hygieneEntries.${index}.secondary`}
          label="Especificación o detalle"
          disabled={!detailEnabled}
          rules={textRules(250)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionResponseSelect name={`hygieneEntries.${index}.response`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionNumberField
          name={`hygieneEntries.${index}.quantity`}
          label="Cantidad"
          disabled={!detailEnabled}
          {...COUNT_LIMITS}
        />
      </Grid>
      {kind === "SIGNAGE" ? (
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SectionCatalogSelect
            name={`hygieneEntries.${index}.secondaryId`}
            label="Material de señalética"
            options={signageMaterials}
            emptyLabel="Sin seleccionar"
            disabled={signageMaterials.length === 0 || response !== "SI"}
          />
        </Grid>
      ) : null}
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionSelect
          name={`hygieneEntries.${index}.condition`}
          label="Condición"
          options={HYGIENE_CONDITION_OPTIONS}
          emptyLabel="Sin registrar"
          disabled={!detailEnabled}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name={`hygieneEntries.${index}.observation`}
          label="Observación"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function RadiosGroup() {
  const { control } = useFormContext<SectionFormValues>();
  const available = useWatch({ control, name: "hygieneRadios.available" });
  const radiosAvailable = available === "SI";
  return (
    <FieldGroup title="Radios portátiles">
      {RADIO_USES.map(({ key, label }) => (
        <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
          <SectionResponseSelect
            name={`hygieneRadios.${key}`}
            label={label}
            disabled={key !== "available" && !radiosAvailable}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionNumberField
          name="hygieneRadios.quantity"
          label="Cantidad de radios"
          disabled={!radiosAvailable}
          {...COUNT_LIMITS}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <SectionTextField
          name="hygieneRadios.observation"
          label="Observación de radios"
          disabled={!radiosAvailable}
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </FieldGroup>
  );
}

function ContingencyGroup() {
  const { control } = useFormContext<SectionFormValues>();
  const exists = useWatch({ control, name: "hygieneContingency.exists" });
  const planExists = exists === "SI";
  return (
    <FieldGroup title="Plan de contingencia">
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionResponseSelect
          name="hygieneContingency.exists"
          label="¿Existe un plan?"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionTextField
          name="hygieneContingency.institution"
          label="Institución responsable"
          disabled={!planExists}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionNumberField
          name="hygieneContingency.year"
          label="Año"
          disabled={!planExists}
          {...YEAR_LIMITS}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name="hygieneContingency.document"
          label="Nombre del documento u observación"
          disabled={!planExists}
          rules={textRules(250)}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name="hygieneContingency.observation"
          label="Observación del plan"
          multiline
          minRows={2}
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </FieldGroup>
  );
}
