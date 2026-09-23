"use client";

import BusinessRounded from "@mui/icons-material/BusinessRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import { Grid, Stack } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { CoordinateFieldset } from "@/components/admin/coordinate-fieldset";
import { RhfNumberField, RhfTextField } from "@/components/ui/form/rhf-text-field";
import type { CenterFormValues } from "@/lib/center-form";
import { webTokens } from "@/theme/tokens";

import { CenterFormSection } from "./center-form-section";

/** Ubicación (dirección, coordenadas y altitud) y administración del atractivo. */
export function LocationPanel({
  onCoordinatesPicked,
}: {
  onCoordinatesPicked: () => void;
}) {
  const { control } = useFormContext<CenterFormValues>();

  return (
    <Stack spacing={webTokens.spacing.control}>
      <CenterFormSection
        icon={<MapRounded />}
        title="Ubicación"
        description="La API sincroniza las coordenadas con PostGIS."
      >
        <Grid container spacing={webTokens.spacing.control}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <RhfTextField<CenterFormValues>
              name="address.barrio"
              label="Barrio, sector o comuna"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTextField<CenterFormValues>
              name="address.street"
              label="Calle principal"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <RhfTextField<CenterFormValues> name="address.number" label="Número" />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <RhfTextField<CenterFormValues>
              name="address.crossStreet"
              label="Calle transversal"
            />
          </Grid>
          <CoordinateFieldset<CenterFormValues, "latitude", "longitude">
            control={control}
            latitudeName="latitude"
            longitudeName="longitude"
            onPicked={onCoordinatesPicked}
          />
          <Grid size={{ xs: 12, sm: 4 }}>
            <RhfNumberField<CenterFormValues>
              name="altitudeMeters"
              label="Altitud (msnm)"
            />
          </Grid>
        </Grid>
      </CenterFormSection>

      <CenterFormSection
        icon={<BusinessRounded />}
        title="Administración"
        description="Contacto institucional responsable del atractivo."
      >
        <Grid container spacing={webTokens.spacing.control}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <RhfTextField<CenterFormValues>
              name="administration.type"
              label="Tipo de administrador"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <RhfTextField<CenterFormValues>
              name="administration.institution"
              label="Institución"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTextField<CenterFormValues>
              name="administration.name"
              label="Nombre del responsable"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTextField<CenterFormValues>
              name="administration.position"
              label="Cargo"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTextField<CenterFormValues>
              name="administration.phone"
              label="Teléfono"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RhfTextField<CenterFormValues>
              name="administration.email"
              label="Correo"
              type="email"
            />
          </Grid>
          <Grid size={12}>
            <RhfTextField<CenterFormValues>
              name="administration.observation"
              label="Observación"
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </CenterFormSection>
    </Stack>
  );
}
