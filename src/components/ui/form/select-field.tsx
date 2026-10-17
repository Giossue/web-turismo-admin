"use client";

import {
  Autocomplete,
  createFilterOptions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useId } from "react";

import { SearchInputAdornment } from "../search-field";

export type SelectOption<V extends string = string> = { value: V; label: string };

const filterSelectOptions = createFilterOptions<SelectOption>({
  ignoreAccents: true,
  ignoreCase: true,
  trim: true,
  stringify: (option) => option.label,
});

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
  searchable = false,
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
  /** Permite escribir para filtrar las opciones; vaciar el campo equivale a `""`. */
  searchable?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const labelId = `${selectId}-label`;

  if (searchable) {
    const selected = options.find((option) => option.value === value) ?? null;
    return (
      <Autocomplete
        id={selectId}
        fullWidth={fullWidth}
        sx={sx}
        options={options as readonly SelectOption[]}
        value={selected}
        disabled={disabled}
        openOnFocus
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, current) => option.value === current.value}
        filterOptions={filterSelectOptions}
        clearText="Limpiar selección"
        openText="Mostrar opciones"
        closeText="Cerrar opciones"
        noOptionsText="No se encontraron resultados"
        onChange={(_, option) => onChange((option?.value ?? "") as V | "")}
        renderInput={(params) => (
          <TextField
            id={params.id}
            disabled={params.disabled}
            fullWidth={params.fullWidth}
            size={params.size}
            label={label}
            placeholder={emptyLabel ?? "Escribe para buscar"}
            slotProps={{
              inputLabel: params.InputLabelProps,
              htmlInput: params.inputProps,
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchInputAdornment />
                    {params.InputProps.startAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    );
  }

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
