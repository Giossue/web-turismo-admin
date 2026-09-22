"use client";

import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import { Button, Grid, TextField } from "@mui/material";
import { useState } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";

import { CoordinatePickerDialog } from "@/components/admin/coordinate-picker-dialog";
import { useEditable } from "@/components/ui/form/editable-context";
import { numberRule, required } from "@/components/ui/form/rules";

export const latitudeRules = {
  required: required("Ingresa la latitud."),
  validate: numberRule({ min: -90, max: 90 }),
};

export const longitudeRules = {
  required: required("Ingresa la longitud."),
  validate: numberRule({ min: -180, max: 180 }),
};

type Coordinate = { latitude: number; longitude: number };

type GridColumns = { xs?: number; sm?: number; md?: number; lg?: number };

/**
 * Latitud, longitud (texto numérico) y botón para elegirlas en el mapa. Se
 * renderiza como elementos de `Grid`, así que debe ir dentro de un
 * `<Grid container>`.
 */
export function CoordinateFieldset<
  TFieldValues extends FieldValues,
  TLatitude extends FieldPath<TFieldValues>,
  TLongitude extends FieldPath<TFieldValues>,
>({
  control,
  latitudeName,
  longitudeName,
  disabled = false,
  fieldSize = { xs: 12, sm: 6 },
  onPicked,
}: {
  control: Control<TFieldValues>;
  latitudeName: TLatitude;
  longitudeName: TLongitude;
  disabled?: boolean;
  fieldSize?: GridColumns;
  /** Se llama tras confirmar un punto en el mapa (por ejemplo, para avisar). */
  onPicked?: (coordinate: Coordinate) => void;
}) {
  const editable = useEditable();
  const [pickerOpen, setPickerOpen] = useState(false);
  const latitude = useController({
    control,
    name: latitudeName,
    rules: latitudeRules as UseControllerProps<TFieldValues, TLatitude>["rules"],
  });
  const longitude = useController({
    control,
    name: longitudeName,
    rules: longitudeRules as UseControllerProps<TFieldValues, TLongitude>["rules"],
  });
  const isDisabled = disabled || !editable;

  return (
    <>
      <Grid size={fieldSize}>
        <TextField
          label="Latitud"
          type="number"
          fullWidth
          required
          disabled={isDisabled}
          name={latitude.field.name}
          value={latitude.field.value ?? ""}
          onChange={latitude.field.onChange}
          onBlur={latitude.field.onBlur}
          inputRef={latitude.field.ref}
          error={Boolean(latitude.fieldState.error)}
          helperText={latitude.fieldState.error?.message}
          slotProps={{ htmlInput: { step: "any", min: -90, max: 90 } }}
        />
      </Grid>
      <Grid size={fieldSize}>
        <TextField
          label="Longitud"
          type="number"
          fullWidth
          required
          disabled={isDisabled}
          name={longitude.field.name}
          value={longitude.field.value ?? ""}
          onChange={longitude.field.onChange}
          onBlur={longitude.field.onBlur}
          inputRef={longitude.field.ref}
          error={Boolean(longitude.fieldState.error)}
          helperText={longitude.fieldState.error?.message}
          slotProps={{ htmlInput: { step: "any", min: -180, max: 180 } }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Button
          type="button"
          variant="outlined"
          startIcon={<LocationOnRounded />}
          disabled={isDisabled}
          onClick={() => setPickerOpen(true)}
        >
          Seleccionar coordenadas en el mapa
        </Button>
      </Grid>
      {pickerOpen ? (
        <CoordinatePickerDialog
          initialLatitude={latitude.field.value}
          initialLongitude={longitude.field.value}
          onClose={() => setPickerOpen(false)}
          onConfirm={(coordinate) => {
            latitude.field.onChange(String(coordinate.latitude));
            longitude.field.onChange(String(coordinate.longitude));
            setPickerOpen(false);
            onPicked?.(coordinate);
          }}
        />
      ) : null}
    </>
  );
}
