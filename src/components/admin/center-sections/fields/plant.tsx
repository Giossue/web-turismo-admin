import { Divider, Grid, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { required } from "@/components/ui/form/rules";
import type { AdminCatalogs } from "@/lib/admin-api";
import {
  emptyComplementaryService,
  emptyFacilityDetail,
  emptyPlant,
} from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { SERVICE_SCOPE_OPTIONS } from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { CatalogOrFreeText } from "../shared/catalog-or-free-text";
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
  LATITUDE_LIMITS,
  LONGITUDE_LIMITS,
  OBSERVATION_RULES,
  textRules,
} from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

type RowProps = { index: number; catalogs: AdminCatalogs | null; removeButton: ReactNode };

const PLANT_QUANTITIES = ["quantity1", "quantity2", "quantity3"] as const;

/**
 * Ámbitos con los nombres del catálogo `serviceScopes` cuando existe. El valor
 * siempre es el código que acepta la API, nunca el nombre.
 */
function scopeOptions(catalogs: AdminCatalogs | null) {
  const catalog = catalogs?.serviceScopes ?? [];
  return SERVICE_SCOPE_OPTIONS.map((option) => ({
    value: option.value,
    label: catalog.find((scope) => scope.code === option.value)?.name ?? option.label,
  }));
}

export function PlantFields({ catalogs }: SectionFieldsProps) {
  const scopes = scopeOptions(catalogs);
  return (
    <Stack spacing={webTokens.spacing.control}>
      <RepeatableFieldArray
        name="plant"
        title="Planta turística"
        description="Alojamiento, alimentos y bebidas, agencias y guías por ámbito de ubicación."
        addLabel="Añadir registro"
        emptyLabel="No hay registros de planta turística."
        createEmpty={emptyPlant}
        removeLabel="Eliminar registro de planta"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, md: 3 }}>
              <SectionSelect name={`plant.${index}.scope`} label="Ámbito" options={scopes} />
            </Grid>
            <CatalogOrFreeText
              catalogName={`plant.${index}.typeId`}
              catalogLabel="Tipo catalogado"
              options={catalogs?.plantTypes ?? []}
              emptyLabel="Usar descripción manual"
              textName={`plant.${index}.typeLabel`}
              textLabel="Tipo de planta (si no está catalogado)"
              textMaxLength={180}
              requiredMessage="Indica el tipo de planta turística."
            />
            <Grid size={{ xs: 12, md: 1 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <SectionTextField
                name={`plant.${index}.group`}
                label="Grupo"
                rules={textRules(80)}
              />
            </Grid>
            {PLANT_QUANTITIES.map((key, quantityIndex) => (
              <Grid key={key} size={{ xs: 12, sm: 4, md: 2 }}>
                <SectionNumberField
                  name={`plant.${index}.${key}`}
                  label={`Cantidad ${quantityIndex + 1}`}
                  {...COUNT_LIMITS}
                />
              </Grid>
            ))}
            <Grid size={12}>
              <SectionTextField
                name={`plant.${index}.observation`}
                label="Observación de planta turística"
                multiline
                minRows={2}
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <Divider />
      <RepeatableFieldArray
        name="facilityDetails"
        title="Facilidades en el entorno"
        description="Registra cantidad, coordenadas, administrador, accesibilidad universal y estado."
        addLabel="Añadir facilidad"
        emptyLabel="No hay facilidades detalladas registradas. Añade una para completar este apartado."
        createEmpty={emptyFacilityDetail}
        removeLabel="Eliminar facilidad"
        renderRow={(index, removeButton) => (
          <FacilityRow index={index} catalogs={catalogs} removeButton={removeButton} />
        )}
      />

      <Divider />
      <RepeatableFieldArray
        name="complementaryServices"
        title="Servicios complementarios"
        description="Registra servicios disponibles en el atractivo o en el poblado cercano."
        addLabel="Añadir servicio"
        emptyLabel="No hay servicios complementarios registrados."
        createEmpty={emptyComplementaryService}
        removeLabel="Eliminar servicio complementario"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, md: 3 }}>
              <SectionSelect
                name={`complementaryServices.${index}.scope`}
                label="Ámbito"
                options={scopes}
              />
            </Grid>
            <CatalogOrFreeText
              catalogName={`complementaryServices.${index}.typeId`}
              catalogLabel="Tipo catalogado"
              options={catalogs?.complementaryServiceTypes ?? []}
              emptyLabel="Usar descripción manual"
              textName={`complementaryServices.${index}.typeLabel`}
              textLabel="Tipo de servicio (si no está catalogado)"
              textMaxLength={180}
              requiredMessage="Indica el tipo de servicio complementario."
              catalogSize={{ xs: 12, md: 3 }}
            />
            <Grid size={{ xs: 12, md: 1 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <SectionTextField
                name={`complementaryServices.${index}.specification`}
                label="Especificación"
                rules={textRules(250)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <SectionTextField
                name={`complementaryServices.${index}.observation`}
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

function FacilityRow({ index, catalogs, removeButton }: RowProps) {
  const { control, setValue } = useFormContext<SectionFormValues>();
  const categoryId = useWatch({ control, name: `facilityDetails.${index}.categoryId` });
  const typeOptions = categoryId
    ? (catalogs?.facilities ?? []).filter(
        (option) => Number(option.categoryId) === Number(categoryId),
      )
    : [];
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionCatalogSelect
          name={`facilityDetails.${index}.categoryId`}
          label="Categoría"
          options={catalogs?.facilityCategories ?? []}
          emptyLabel="Sin seleccionar"
          // El tipo catalogado depende de la categoría: al cambiarla se descarta.
          onValueChange={() =>
            setValue(`facilityDetails.${index}.typeId`, "", { shouldDirty: true })
          }
        />
      </Grid>
      <CatalogOrFreeText
        catalogName={`facilityDetails.${index}.typeId`}
        catalogLabel="Tipo catalogado"
        options={typeOptions}
        emptyLabel="Usar descripción manual"
        textName={`facilityDetails.${index}.typeLabel`}
        textLabel="Tipo de facilidad (si no está catalogado)"
        textMaxLength={180}
        requiredMessage="Indica el tipo de facilidad."
        catalogSize={{ xs: 12, md: 3 }}
        catalogDisabled={!categoryId}
        textDisabled={!categoryId}
      />
      <Grid size={{ xs: 12, md: 1 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <SectionNumberField
          name={`facilityDetails.${index}.quantity`}
          label="Cantidad"
          {...COUNT_LIMITS}
          rules={{ required: required() }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <SectionNumberField
          name={`facilityDetails.${index}.latitude`}
          label="Latitud"
          {...LATITUDE_LIMITS}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <SectionNumberField
          name={`facilityDetails.${index}.longitude`}
          label="Longitud"
          {...LONGITUDE_LIMITS}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SectionTextField
          name={`facilityDetails.${index}.administrator`}
          label="Administrador"
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionResponseSelect
          name={`facilityDetails.${index}.universalAccessibility`}
          label="Accesibilidad universal"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SectionCatalogSelect
          name={`facilityDetails.${index}.conditionId`}
          label="Estado"
          options={catalogs?.conditionStates ?? []}
          emptyLabel="Sin seleccionar"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionTextField
          name={`facilityDetails.${index}.detailOther`}
          label="Detalle de otro tipo"
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionTextField
          name={`facilityDetails.${index}.observation`}
          label="Observación"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}
