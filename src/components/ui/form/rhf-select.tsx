"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { useId } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";

import { CatalogSelect, type CatalogSelectOption } from "@/components/ui/catalog-select";
import { CatalogAutocomplete } from "@/components/ui/catalog-autocomplete";
import {
  SECTION_RESPONSE_OPTIONS,
  type SectionResponse,
} from "@/lib/center-sections/options";

import { useEditable } from "./editable-context";
import { required as requiredRule } from "./rules";
import type { SelectOption } from "./select-field";

type RhfControlProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  name: TName;
  /** Opcional si el formulario está envuelto en `FormProvider`. */
  control?: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>["rules"];
  label: string;
  /** Muestra el asterisco y exige un valor (salvo que `rules.required` lo defina). */
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Id del control; por defecto se genera uno estable con `useId`. */
  id?: string;
};

function withRequiredRule<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  rules: UseControllerProps<TFieldValues, TName>["rules"],
  required: boolean,
): UseControllerProps<TFieldValues, TName>["rules"] {
  if (!required || rules?.required) return rules;
  return { ...rules, required: requiredRule() } as UseControllerProps<
    TFieldValues,
    TName
  >["rules"];
}

type RhfSelectProps<
  V extends string,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = RhfControlProps<TFieldValues, TName> & {
  options: readonly SelectOption<V>[];
  /** Añade una opción vacía (valor `""`) con este texto, por ejemplo "Sin seleccionar". */
  emptyLabel?: string;
  onValueChange?: (value: V | "") => void;
};

/**
 * `Select` controlado por react-hook-form. A diferencia de
 * `<Select defaultValue {...register()}>`, siempre refleja el valor del
 * formulario (también tras `reset` o una carga asíncrona).
 */
export function RhfSelect<
  V extends string,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  required = false,
  disabled = false,
  helperText,
  id,
  options,
  emptyLabel,
  onValueChange,
}: RhfSelectProps<V, TFieldValues, TName>) {
  const editable = useEditable();
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const labelId = `${selectId}-label`;
  const { field, fieldState } = useController({
    name,
    control,
    rules: withRequiredRule(rules, required),
  });
  const value = typeof field.value === "string" ? field.value : "";
  const displayValue = options.some((option) => option.value === value) ? value : "";
  const errorText = fieldState.error?.message;

  return (
    <FormControl
      fullWidth
      required={required}
      disabled={disabled || !editable}
      error={Boolean(fieldState.error)}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        id={selectId}
        labelId={labelId}
        label={label}
        name={field.name}
        value={displayValue}
        inputRef={field.ref}
        onBlur={field.onBlur}
        onChange={(event) => {
          const next = event.target.value as V | "";
          field.onChange(next);
          onValueChange?.(next);
        }}
      >
        {emptyLabel !== undefined ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {errorText || helperText ? (
        <FormHelperText>{errorText ?? helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}

type RhfCatalogSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<RhfControlProps<TFieldValues, TName>, "helperText"> & {
  options: readonly CatalogSelectOption[];
  emptyLabel?: string;
  searchable?: boolean;
  loading?: boolean;
  onValueChange?: (value: string) => void;
};

/** Selector de catálogo (ids como texto) controlado por react-hook-form. */
export function RhfCatalogSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  required = false,
  disabled = false,
  id,
  options,
  emptyLabel,
  searchable = false,
  loading = false,
  onValueChange,
}: RhfCatalogSelectProps<TFieldValues, TName>) {
  const editable = useEditable();
  const generatedId = useId();
  const { field, fieldState } = useController({
    name,
    control,
    rules: withRequiredRule(rules, required),
  });

  if (searchable) {
    return (
      <CatalogAutocomplete
        id={id ?? `catalog-${generatedId}`}
        label={label}
        name={field.name}
        value={field.value == null ? "" : String(field.value)}
        options={options}
        required={required}
        disabled={disabled || !editable}
        loading={loading}
        helperText={fieldState.error?.message}
        inputRef={field.ref}
        onBlur={field.onBlur}
        onChange={(value) => {
          field.onChange(value);
          onValueChange?.(value);
        }}
      />
    );
  }

  return (
    <CatalogSelect
      id={id ?? `catalog-${generatedId}`}
      label={label}
      name={field.name}
      value={field.value == null ? "" : String(field.value)}
      options={options}
      emptyLabel={emptyLabel}
      required={required}
      disabled={disabled || !editable}
      helperText={fieldState.error?.message}
      inputRef={field.ref}
      onBlur={field.onBlur}
      onChange={(value) => {
        field.onChange(value);
        onValueChange?.(value);
      }}
    />
  );
}

type RhfResponseSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<RhfControlProps<TFieldValues, TName>, "label" | "required"> & {
  label?: string;
};

/** Selector Sí / No / Sin información / No aplica de las secciones de la ficha. */
export function RhfResponseSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ label = "Respuesta", ...props }: RhfResponseSelectProps<TFieldValues, TName>) {
  return (
    <RhfSelect<SectionResponse, TFieldValues, TName>
      {...props}
      label={label}
      options={SECTION_RESPONSE_OPTIONS}
    />
  );
}
