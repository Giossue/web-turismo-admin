"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useId } from "react";

export type SelectOption<V extends string = string> = { value: V; label: string };

/**
 * Selector simple (sin react-hook-form) para barras de filtros. `emptyLabel`
 * añade la opción `""` ("Todos"/"Todas").
 */
export function SelectField<V extends string>({
  id,
  label,
  value,
  options,
  onChange,
  emptyLabel,
  disabled = false,
  fullWidth = true,
  sx,
}: {
  id?: string;
  label: string;
  value: V | "";
  options: readonly SelectOption<V>[];
  onChange: (value: V | "") => void;
  emptyLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const labelId = `${selectId}-label`;

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} sx={sx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        id={selectId}
        labelId={labelId}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as V | "")}
      >
        {emptyLabel !== undefined ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
