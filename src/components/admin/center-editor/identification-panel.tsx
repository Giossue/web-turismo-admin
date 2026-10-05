"use client";

import CategoryRounded from "@mui/icons-material/CategoryRounded";
import { Grid } from "@mui/material";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { CoordinateFieldset } from "@/components/admin/coordinate-fieldset";
import { RhfCatalogSelect } from "@/components/ui/form/rhf-select";
import { RhfTextField } from "@/components/ui/form/rhf-text-field";
import { maxLen, required } from "@/components/ui/form/rules";
import type { AdminCatalogs } from "@/lib/admin-api";
import { CENTER_NAME_MAX_LENGTH, type CenterFormValues } from "@/lib/center-form";
import { centerCatalogOptions } from "@/lib/center-form-mappers";
import { webTokens } from "@/theme/tokens";

import { CenterFormSection } from "./center-form-section";

type DependentField = "typeId" | "subtypeId" | "cantonId" | "parishId" | "touristZoneId";

const NAME_RULES = {
  required: required("El nombre es obligatorio"),
  maxLength: maxLen(CENTER_NAME_MAX_LENGTH),
};

/**
 * Identificación y clasificación. Cada selector limpia sus dependientes al
 * cambiar (tipo → subtipo, provincia → cantón → parroquia y zona, categoría →
 * actividades). Mientras la ficha es nueva también pide las coordenadas, que
 * la API exige para crearla.
 */
export function IdentificationPanel({
  catalogs,
  showCoordinates,
  onCoordinatesPicked,
}: {
  catalogs: AdminCatalogs | null;
  showCoordinates: boolean;
  onCoordinatesPicked: () => void;
}) {
  const { control, setValue } = useFormContext<CenterFormValues>();
  const [categoryId, typeId, provinceId, cantonId] = useWatch({
    control,
    name: ["categoryId", "typeId", "provinceId", "cantonId"],
  });
  const options = useMemo(
    () => centerCatalogOptions(catalogs, { categoryId, typeId, provinceId, cantonId }),
    [cantonId, catalogs, categoryId, provinceId, typeId],
  );
  const clear = (...fields: DependentField[]) => {
    for (const field of fields) setValue(field, "", { shouldDirty: true });
  };

  return (
    <CenterFormSection
      icon={<CategoryRounded />}
      title="Identificación y clasificación"
      description="Estos campos determinan el código institucional y la ubicación territorial."
    >
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RhfTextField<CenterFormValues>
            name="name"
            label="Nombre del atractivo"
            required
            rules={NAME_RULES}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Categoría"
            name="categoryId"
            options={catalogs?.categories ?? []}
            required
            onValueChange={() => {
              clear("typeId", "subtypeId");
              setValue("activityIds", [], { shouldDirty: true });
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Tipo"
            name="typeId"
            options={options.types}
            disabled={!categoryId}
            required
            onValueChange={() => clear("subtypeId")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Subtipo"
            name="subtypeId"
            options={options.subtypes}
            disabled={!typeId}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Provincia"
            name="provinceId"
            options={catalogs?.provinces ?? []}
            required
            onValueChange={() => clear("cantonId", "parishId", "touristZoneId")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Cantón"
            name="cantonId"
            options={options.cantons}
            disabled={!provinceId}
            required
            onValueChange={() => clear("parishId", "touristZoneId")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Parroquia"
            name="parishId"
            options={options.parishes}
            disabled={!cantonId}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Zona turística"
            name="touristZoneId"
            options={options.zones}
            disabled={!cantonId}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Línea de producto"
            name="productLineId"
            options={catalogs?.lines ?? []}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Escenario"
            name="scenarioId"
            options={catalogs?.scenarios ?? []}
            required
          />
        </Grid>
        {showCoordinates ? (
          <CoordinateFieldset<CenterFormValues, "latitude", "longitude">
            control={control}
            latitudeName="latitude"
            longitudeName="longitude"
            onPicked={onCoordinatesPicked}
          />
        ) : null}
      </Grid>
    </CenterFormSection>
  );
}
