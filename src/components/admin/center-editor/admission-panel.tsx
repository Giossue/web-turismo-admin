"use client";

import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import { useController } from "react-hook-form";

import { useEditable } from "@/components/ui/form/editable-context";
import { RhfCatalogSelect } from "@/components/ui/form/rhf-select";
import {
  RhfDateField,
  RhfNumberField,
  RhfTextField,
} from "@/components/ui/form/rhf-text-field";
import type { AdminCatalogs } from "@/lib/admin-api";
import type { CenterFormValues } from "@/lib/center-form";
import { webTokens } from "@/theme/tokens";

import { CenterFormSection } from "./center-form-section";

/** Ingreso y atención: tipo de ingreso, horarios, modalidad, reservas y precios. */
export function AdmissionPanel({ catalogs }: { catalogs: AdminCatalogs | null }) {
  return (
    <CenterFormSection
      icon={<AccessTimeRounded />}
      title="Ingreso y atención"
      description="Información que se mostrará en la ficha pública cuando se publique."
    >
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Tipo de ingreso"
            name="admission.incomeTypeId"
            options={catalogs?.incomeTypes ?? []}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfDateField<CenterFormValues>
            name="admission.opensAt"
            label="Hora de ingreso"
            type="time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfDateField<CenterFormValues>
            name="admission.closesAt"
            label="Hora de salida"
            type="time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfCatalogSelect<CenterFormValues>
            label="Modalidad de atención"
            name="admission.attentionModeId"
            options={catalogs?.attentionModes ?? []}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReservationsCheckbox />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfNumberField<CenterFormValues>
            name="admission.priceFrom"
            label="Precio desde"
            min={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfNumberField<CenterFormValues>
            name="admission.priceTo"
            label="Precio hasta"
            min={0}
          />
        </Grid>
        <Grid size={12}>
          <RhfTextField<CenterFormValues>
            name="admission.otherAttention"
            label="Otra modalidad o detalle"
          />
        </Grid>
        <Grid size={12}>
          <RhfTextField<CenterFormValues>
            name="admission.observation"
            label="Observación"
            multiline
            minRows={2}
          />
        </Grid>
      </Grid>
    </CenterFormSection>
  );
}

function ReservationsCheckbox() {
  const editable = useEditable();
  const { field } = useController<CenterFormValues, "admission.reservations">({
    name: "admission.reservations",
  });
  return (
    <FormControlLabel
      control={
        <Checkbox
          name={field.name}
          inputRef={field.ref}
          checked={Boolean(field.value)}
          disabled={!editable}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.checked)}
        />
      }
      label="Maneja un sistema de reservas"
      sx={{ minHeight: webTokens.form.controlHeight, alignItems: "center" }}
    />
  );
}
