"use client";

import { Autocomplete, TextField, createFilterOptions } from "@mui/material";

import type { CatalogSelectOption } from "./catalog-select";
import { SearchInputAdornment } from "./search-field";

const optionLabel = (option: CatalogSelectOption) => option.displayName ?? option.name;

export const filterCatalogOptions = createFilterOptions<CatalogSelectOption>({
  ignoreAccents: true,
  ignoreCase: true,
  trim: true,
  stringify: optionLabel,
});

/** Buscador de catálogo: el texto filtra opciones y solo la selección cambia el id. */
export function CatalogAutocomplete({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  loading = false,
  helperText,
  name,
  inputRef,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly CatalogSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  helperText?: string;
  name?: string;
  inputRef?: React.Ref<unknown>;
  onBlur?: () => void;
}) {
  const selected = options.find((option) => String(option.id) === value) ?? null;

  return (
    <Autocomplete
      id={id}
      fullWidth
      options={options}
      value={selected}
      disabled={disabled}
      loading={loading}
      openOnFocus
      getOptionLabel={optionLabel}
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      getOptionDisabled={(option) => Boolean(option.disabled)}
      filterOptions={filterCatalogOptions}
      clearText="Limpiar selección"
      openText="Mostrar opciones"
      closeText="Cerrar opciones"
      loadingText="Cargando opciones…"
      noOptionsText="No se encontraron resultados"
      onChange={(_, option) => {
        if (!disabled && !option?.disabled) {
          onChange(option ? String(option.id) : "");
        }
      }}
      renderInput={(params) => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          label={label}
          required={required}
          error={Boolean(helperText)}
          helperText={helperText}
          placeholder="Escribe para buscar"
          inputRef={inputRef}
          slotProps={{
            inputLabel: params.InputLabelProps,
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <SearchInputAdornment />
                  {params.InputProps.startAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.inputProps,
              name,
              onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                params.inputProps.onBlur?.(event);
                onBlur?.();
              },
            },
          }}
        />
      )}
    />
  );
}
