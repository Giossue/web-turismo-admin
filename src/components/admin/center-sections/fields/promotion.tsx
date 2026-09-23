import { Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SectionHeader } from "@/components/ui/section-header";
import type { AdminCatalogs } from "@/lib/admin-api";
import { emptyPromotionMedia } from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { webTokens } from "@/theme/tokens";

import { FieldGroup } from "../shared/field-group";
import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionCatalogSelect,
  SectionResponseSelect,
  SectionTextField,
} from "../shared/section-fields";
import { OBSERVATION_RULES, textRules } from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

/** La API solo acepta URL absolutas con HTTP o HTTPS. */
function validateUrl(value: unknown): true | string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return true;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:"
      ? true
      : "Usa una URL que empiece por http:// o https://.";
  } catch {
    return "Ingresa una URL válida, por ejemplo https://…";
  }
}

export function PromotionFields({ catalogs }: SectionFieldsProps) {
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Promoción y comercialización"
        description="Separa la existencia del plan, su inclusión institucional, los paquetes y los medios de promoción utilizados."
      />
      <PlanGroup />
      <RepeatableFieldArray
        name="promotionMedia"
        title="Medios de promoción"
        description="Registra página, red social, feria u otro medio con nombre, URL y periodicidad."
        addLabel="Añadir medio"
        emptyLabel="No hay medios registrados."
        createEmpty={emptyPromotionMedia}
        removeLabel="Eliminar medio"
        renderRow={(index, removeButton) => (
          <MediaRow index={index} catalogs={catalogs} removeButton={removeButton} />
        )}
      />
      <PackageGroup />
    </Stack>
  );
}

function PlanGroup() {
  const { control } = useFormContext<SectionFormValues>();
  const hasPlan = useWatch({ control, name: "promotion.hasPlan" }) === "SI";
  return (
    <FieldGroup>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionResponseSelect name="promotion.hasPlan" label="¿Tiene plan?" />
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <SectionTextField
          name="promotion.planName"
          label="Nombre del plan"
          disabled={!hasPlan}
          rules={textRules(250)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SectionResponseSelect
          name="promotion.includedInPlan"
          label="¿Está incluido en un plan?"
          disabled={!hasPlan}
        />
      </Grid>
    </FieldGroup>
  );
}

function MediaRow({
  index,
  catalogs,
  removeButton,
}: {
  index: number;
  catalogs: AdminCatalogs | null;
  removeButton: ReactNode;
}) {
  const { control } = useFormContext<SectionFormValues>();
  const used = useWatch({ control, name: `promotionMedia.${index}.response` }) === "SI";
  const mediaTypes = catalogs?.promotionMediaTypes ?? [];
  return (
    <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionResponseSelect
          name={`promotionMedia.${index}.response`}
          label="Utilizado"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionCatalogSelect
          name={`promotionMedia.${index}.typeId`}
          label="Tipo de medio"
          options={mediaTypes}
          emptyLabel="Sin seleccionar"
          disabled={mediaTypes.length === 0 || !used}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionTextField
          name={`promotionMedia.${index}.name`}
          label="Nombre o cuenta"
          disabled={!used}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionTextField
          name={`promotionMedia.${index}.url`}
          label="URL"
          type="url"
          disabled={!used}
          rules={{ ...textRules(500), validate: validateUrl }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 1 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SectionTextField
          name={`promotionMedia.${index}.periodicity`}
          label="Periodicidad"
          disabled={!used}
          rules={textRules(100)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SectionTextField
          name={`promotionMedia.${index}.detailOther`}
          label="Detalle de otro medio"
          disabled={!used}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name={`promotionMedia.${index}.observation`}
          label="Observación del medio"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function PackageGroup() {
  const { control } = useFormContext<SectionFormValues>();
  const partOfPackage = useWatch({ control, name: "promotion.partOfPackage" }) === "SI";
  return (
    <FieldGroup>
      <Grid size={{ xs: 12, sm: 6 }}>
        <SectionResponseSelect
          name="promotion.partOfPackage"
          label="¿Forma parte de un paquete?"
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name="promotion.packageDetail"
          label="Detalle del paquete"
          multiline
          minRows={2}
          disabled={!partOfPackage}
          rules={textRules(1_000)}
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name="promotion.observation"
          label="Observación de promoción"
          multiline
          minRows={2}
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </FieldGroup>
  );
}
