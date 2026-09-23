import AutoFixHighRounded from "@mui/icons-material/AutoFixHighRounded";
import { Alert, Button, Divider, Grid, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useEditable } from "@/components/ui/form/editable-context";
import { required } from "@/components/ui/form/rules";
import type { AdminCatalogs } from "@/lib/admin-api";
import {
  emptyAerialAccess,
  emptyAquaticAccess,
  emptyCriterion,
  emptyRoad,
  emptyTransportDetail,
  emptyTransportType,
} from "@/lib/center-sections/form-defaults";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { TRANSPORT_APPLIES_OPTIONS } from "@/lib/center-sections/options";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
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
  LATITUDE_LIMITS,
  LONGITUDE_LIMITS,
  OBSERVATION_RULES,
  textRules,
} from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

type RowProps = {
  index: number;
  catalogs: AdminCatalogs | null;
  removeButton: ReactNode;
};

const ROAD_COORDINATES = [
  { key: "startLatitude", label: "Latitud inicial", limits: LATITUDE_LIMITS },
  { key: "startLongitude", label: "Longitud inicial", limits: LONGITUDE_LIMITS },
  { key: "endLatitude", label: "Latitud final", limits: LATITUDE_LIMITS },
  { key: "endLongitude", label: "Longitud final", limits: LONGITUDE_LIMITS },
] as const;

export function AccessibilityFields({ catalogs, sugerencias }: SectionFieldsProps) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Typography variant="subtitle1">Referencia territorial y conectividad</Typography>
      <ImportedLocalitySuggestion
        catalogs={catalogs}
        suggestion={sugerencias?.accesibilidad}
      />
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <SectionCatalogSelect
            name="localityId"
            label="Localidad cercana"
            options={catalogs?.localities ?? []}
            emptyLabel="Sin seleccionar"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionNumberField
            name="distanceKm"
            label="Distancia aproximada (km)"
            min={0}
            step={0.1}
          />
        </Grid>
      </Grid>

      <Divider />
      <RepeatableFieldArray
        name="accessibilityRoads"
        title="Vías terrestres de acceso"
        description="Registra cada alternativa con coordenadas, distancia, material y estado."
        addLabel="Añadir vía"
        emptyLabel="No hay vías terrestres registradas."
        createEmpty={emptyRoad}
        removeLabel="Eliminar vía terrestre"
        renderRow={(index, removeButton) => (
          <RoadRow index={index} catalogs={catalogs} removeButton={removeButton} />
        )}
      />

      <Divider />
      <RepeatableFieldArray
        name="accessibilityAquatic"
        title="Accesos acuáticos"
        description="Registra puerto o muelle de partida y llegada por modalidad."
        addLabel="Añadir acceso acuático"
        emptyLabel="No hay accesos acuáticos registrados."
        createEmpty={emptyAquaticAccess}
        removeLabel="Eliminar acceso acuático"
        renderRow={(index, removeButton) => (
          <AquaticRow index={index} catalogs={catalogs} removeButton={removeButton} />
        )}
      />

      <Divider />
      <RepeatableFieldArray
        name="accessibilityAerial"
        title="Accesos aéreos"
        description="Registra la cobertura del acceso cuando aplique."
        addLabel="Añadir acceso aéreo"
        emptyLabel="No hay accesos aéreos registrados."
        createEmpty={emptyAerialAccess}
        removeLabel="Eliminar acceso aéreo"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control}>
            <CatalogOrFreeText
              catalogName={`accessibilityAerial.${index}.coverageId`}
              catalogLabel="Cobertura"
              options={catalogs?.aerialAccessCoverages ?? []}
              textName={`accessibilityAerial.${index}.coverageLabel`}
              textLabel="Cobertura (si no está catalogada)"
              textMaxLength={120}
              requiredMessage="Indica la cobertura del acceso aéreo."
              textSize={{ xs: 12, md: 5 }}
            />
            <Grid size={{ xs: 12, md: 2 }}>{removeButton}</Grid>
            <Grid size={12}>
              <SectionTextField
                name={`accessibilityAerial.${index}.observation`}
                label="Observación del acceso aéreo"
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
        name="accessibilityTransportTypes"
        title="Servicio de transporte"
        description="Separa los tipos disponibles del detalle de operadores y traslados."
        addLabel="Añadir tipo"
        emptyLabel="No hay tipos de transporte registrados."
        createEmpty={emptyTransportType}
        removeLabel="Eliminar tipo de transporte"
        renderRow={(index, removeButton) => (
          <TransportTypeRow
            index={index}
            catalogs={catalogs}
            removeButton={removeButton}
          />
        )}
      />

      <RepeatableFieldArray
        name="accessibilityTransportDetails"
        title="Detalle de transporte hacia el atractivo"
        description="Registra cooperativa, terminal, frecuencia y traslado origen/destino."
        addLabel="Añadir operador"
        emptyLabel="No hay operadores registrados."
        createEmpty={emptyTransportDetail}
        removeLabel="Eliminar operador"
        renderRow={(index, removeButton) => (
          <TransportDetailRow
            index={index}
            catalogs={catalogs}
            removeButton={removeButton}
          />
        )}
      />

      <Divider />
      <RepeatableFieldArray
        name="accessibilityCriteria"
        title="Condiciones de accesibilidad para personas con discapacidad"
        description="Usa los criterios de la ficha por tipo de accesibilidad; el catálogo puede completarse desde administración."
        addLabel="Añadir criterio"
        emptyLabel="No hay criterios registrados."
        createEmpty={emptyCriterion}
        removeLabel="Eliminar criterio"
        renderRow={(index, removeButton) => (
          <CriterionRow index={index} catalogs={catalogs} removeButton={removeButton} />
        )}
      />

      <Divider />
      <Typography variant="subtitle1">Señalización de aproximación</Typography>
      <SignageFields catalogs={catalogs} />
    </Stack>
  );
}

function ImportedLocalitySuggestion({
  catalogs,
  suggestion,
}: {
  catalogs: AdminCatalogs | null;
  /**
   * Localidad y distancia resueltas por el importador de fichas MINTUR (ver
   * `src/lib/ficha/sugerencias-secciones.ts`). Nunca se aplican solas: la
   * persona decide con "Cargar desde la ficha importada".
   */
  suggestion?: SugerenciasSecciones["accesibilidad"] | null;
}) {
  const editable = useEditable();
  const { setValue } = useFormContext<SectionFormValues>();
  const localityId = suggestion?.localityId ?? null;
  const distanceKm = suggestion?.distanceKm ?? null;
  const isKnownLocality =
    localityId !== null &&
    (catalogs?.localities ?? []).some((locality) => Number(locality.id) === localityId);
  if (!isKnownLocality) return null;

  return (
    <Alert
      severity="info"
      action={
        <Button
          type="button"
          color="inherit"
          size="small"
          startIcon={<AutoFixHighRounded />}
          disabled={!editable}
          onClick={() => {
            setValue("localityId", String(localityId), { shouldDirty: true });
            if (distanceKm !== null) {
              setValue("distanceKm", String(distanceKm), { shouldDirty: true });
            }
          }}
        >
          Cargar desde la ficha importada
        </Button>
      }
    >
      La ficha importada sugiere una localidad cercana y distancia para este atractivo.
    </Alert>
  );
}

function RoadRow({ index, catalogs, removeButton }: RowProps) {
  const conditionOptions = catalogs?.conditionStates ?? [];
  return (
    <Stack spacing={1.5}>
      <Grid container spacing={webTokens.spacing.control}>
        <CatalogOrFreeText
          catalogName={`accessibilityRoads.${index}.roadTypeId`}
          catalogLabel="Tipo de vía"
          options={catalogs?.roadTypes ?? []}
          textName={`accessibilityRoads.${index}.typeLabel`}
          textLabel="Tipo de vía (si no está catalogado)"
          textMaxLength={180}
          requiredMessage="Indica el tipo de vía."
        />
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <SectionNumberField
            name={`accessibilityRoads.${index}.distanceKm`}
            label="Distancia (km)"
            min={0}
            step={0.1}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>{removeButton}</Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCatalogSelect
            name={`accessibilityRoads.${index}.materialId`}
            label="Material de vía"
            options={catalogs?.roadMaterials ?? []}
            emptyLabel="Sin seleccionar"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCatalogSelect
            name={`accessibilityRoads.${index}.conditionId`}
            label="Estado de la vía"
            options={conditionOptions}
            emptyLabel="Sin seleccionar"
          />
        </Grid>
      </Grid>
      <Typography variant="caption" color="text.secondary">
        Coordenadas de inicio y fin (grados decimales)
      </Typography>
      <Grid container spacing={webTokens.spacing.control}>
        {ROAD_COORDINATES.map(({ key, label, limits }) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
            <SectionNumberField
              name={`accessibilityRoads.${index}.${key}`}
              label={label}
              {...limits}
            />
          </Grid>
        ))}
      </Grid>
      <SectionTextField
        name={`accessibilityRoads.${index}.observation`}
        label="Observación de la vía"
        multiline
        minRows={2}
        rules={OBSERVATION_RULES}
      />
    </Stack>
  );
}

function AquaticRow({ index, catalogs, removeButton }: RowProps) {
  const conditionOptions = catalogs?.conditionStates ?? [];
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <CatalogOrFreeText
        catalogName={`accessibilityAquatic.${index}.modalityId`}
        catalogLabel="Modalidad"
        options={catalogs?.aquaticAccessModes ?? []}
        textName={`accessibilityAquatic.${index}.modalityLabel`}
        textLabel="Modalidad (si no está catalogada)"
        textMaxLength={120}
        requiredMessage="Indica la modalidad del acceso acuático."
      />
      <Grid size={{ xs: 12, md: 4 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionTextField
          name={`accessibilityAquatic.${index}.departure`}
          label="Puerto / muelle de partida"
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionCatalogSelect
          name={`accessibilityAquatic.${index}.departureConditionId`}
          label="Estado de partida"
          options={conditionOptions}
          emptyLabel="Sin seleccionar"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionTextField
          name={`accessibilityAquatic.${index}.arrival`}
          label="Puerto / muelle de llegada"
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionCatalogSelect
          name={`accessibilityAquatic.${index}.arrivalConditionId`}
          label="Estado de llegada"
          options={conditionOptions}
          emptyLabel="Sin seleccionar"
        />
      </Grid>
      <Grid size={12}>
        <SectionTextField
          name={`accessibilityAquatic.${index}.observation`}
          label="Observación del acceso acuático"
          multiline
          minRows={2}
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function TransportTypeRow({ index, catalogs, removeButton }: RowProps) {
  const { control } = useFormContext<SectionFormValues>();
  const applies = useWatch({
    control,
    name: `accessibilityTransportTypes.${index}.applies`,
  });
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <CatalogOrFreeText
        catalogName={`accessibilityTransportTypes.${index}.typeId`}
        catalogLabel="Tipo"
        options={catalogs?.transportTypes ?? []}
        textName={`accessibilityTransportTypes.${index}.label`}
        textLabel="Tipo (si no está catalogado)"
        textMaxLength={120}
        requiredMessage="Indica el tipo de transporte."
      />
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SectionSelect
          name={`accessibilityTransportTypes.${index}.applies`}
          label="Aplica"
          options={TRANSPORT_APPLIES_OPTIONS}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionTextField
          name={`accessibilityTransportTypes.${index}.detailOther`}
          label="Detalle de otro tipo"
          disabled={applies !== "SI"}
          rules={textRules(180)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionTextField
          name={`accessibilityTransportTypes.${index}.observation`}
          label="Observación"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function TransportDetailRow({ index, catalogs, removeButton }: RowProps) {
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <Grid size={{ xs: 12, md: 4 }}>
        <SectionTextField
          name={`accessibilityTransportDetails.${index}.operator`}
          label="Cooperativa o asociación"
          rules={{ required: required("Indica el operador"), ...textRules(180) }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SectionTextField
          name={`accessibilityTransportDetails.${index}.terminal`}
          label="Estación / terminal"
          rules={textRules(180)}
        />
      </Grid>
      <CatalogOrFreeText
        catalogName={`accessibilityTransportDetails.${index}.frequencyId`}
        catalogLabel="Frecuencia"
        options={catalogs?.serviceFrequencies ?? []}
        textName={`accessibilityTransportDetails.${index}.frequencyLabel`}
        textLabel="Frecuencia (si no está catalogada)"
        textMaxLength={80}
      />
      <Grid size={{ xs: 12, md: 7 }}>
        <SectionTextField
          name={`accessibilityTransportDetails.${index}.transferDetail`}
          label="Detalle del traslado (origen / destino)"
          rules={textRules(1_000)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 1 }}>{removeButton}</Grid>
      <Grid size={12}>
        <SectionTextField
          name={`accessibilityTransportDetails.${index}.observation`}
          label="Observación"
          multiline
          minRows={2}
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function CriterionRow({ index, catalogs, removeButton }: RowProps) {
  const { control, setValue } = useFormContext<SectionFormValues>();
  const typeId = useWatch({
    control,
    name: `accessibilityCriteria.${index}.accessibilityTypeId`,
  });
  const criterionOptions = typeId
    ? (catalogs?.accessibilityCriteria ?? []).filter(
        (option) => Number(option.typeId) === Number(typeId),
      )
    : [];
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionCatalogSelect
          name={`accessibilityCriteria.${index}.accessibilityTypeId`}
          label="Tipo"
          options={catalogs?.accessibilityTypes ?? []}
          emptyLabel="Sin clasificar"
          // El criterio catalogado depende del tipo: al cambiarlo se descarta.
          onValueChange={() =>
            setValue(`accessibilityCriteria.${index}.criterionId`, "", {
              shouldDirty: true,
            })
          }
        />
      </Grid>
      <CatalogOrFreeText
        catalogName={`accessibilityCriteria.${index}.criterionId`}
        catalogLabel="Criterio catalogado"
        options={criterionOptions}
        emptyLabel="Usar descripción manual"
        textName={`accessibilityCriteria.${index}.label`}
        textLabel="Descripción manual del criterio"
        textHelperText="Obligatoria solo si no eliges un criterio catalogado"
        textMaxLength={300}
        requiredMessage="Elige un criterio catalogado o escribe una descripción."
      />
      <Grid size={{ xs: 12, sm: 10, md: 1 }}>{removeButton}</Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SectionResponseSelect name={`accessibilityCriteria.${index}.response`} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SectionTextField
          name={`accessibilityCriteria.${index}.detail`}
          label="Detalle"
          rules={textRules(1_000)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionTextField
          name={`accessibilityCriteria.${index}.observation`}
          label="Observación"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}

function SignageFields({ catalogs }: { catalogs: AdminCatalogs | null }) {
  const { control } = useFormContext<SectionFormValues>();
  const available = useWatch({ control, name: "accessibilitySignage.available" });
  return (
    <Grid container spacing={webTokens.spacing.control}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionResponseSelect name="accessibilitySignage.available" label="Disponible" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionCatalogSelect
          name="accessibilitySignage.conditionId"
          label="Estado"
          options={catalogs?.conditionStates ?? []}
          emptyLabel="Sin seleccionar"
          disabled={available !== "SI"}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SectionTextField
          name="accessibilitySignage.observation"
          label="Observación"
          rules={OBSERVATION_RULES}
        />
      </Grid>
    </Grid>
  );
}
