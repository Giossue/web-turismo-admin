"use client";

import { TextField, type TextFieldProps } from "@mui/material";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";

import {
  withHtmlInputDefaults,
  withInputLabelDefaults,
} from "@/components/ui/text-field-slot-props";

import { useEditable } from "./editable-context";
import { numberRule } from "./rules";

type ControlledTextFieldKeys =
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "inputRef" | "error";

type RhfTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<TextFieldProps, ControlledTextFieldKeys> & {
  name: TName;
  /** Opcional si el formulario está envuelto en `FormProvider`. */
  control?: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>["rules"];
};

/**
 * `TextField` controlado por react-hook-form: muestra el error del campo como
 * texto de ayuda y se deshabilita con `disabled` o con `EditableContext`.
 */
export function RhfTextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  disabled,
  helperText,
  ...props
}: RhfTextFieldProps<TFieldValues, TName>) {
  const editable = useEditable();
  const { field, fieldState } = useController({ name, control, rules });

  return (
    <TextField
      fullWidth
      {...props}
      name={field.name}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      inputRef={field.ref}
      disabled={Boolean(disabled) || !editable}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
    />
  );
}

type RhfNumberFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<RhfTextFieldProps<TFieldValues, TName>, "type"> & {
  integer?: boolean;
  min?: number;
  max?: number;
  /** Por defecto `1` para enteros y `"any"` para decimales. */
  step?: number | "any";
};

/**
 * Campo numérico (guardado como texto). Los mismos límites generan los
 * atributos HTML `min`/`max`/`step` y la validación de react-hook-form.
 */
export function RhfNumberField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  integer = false,
  min,
  max,
  step,
  rules,
  slotProps,
  ...props
}: RhfNumberFieldProps<TFieldValues, TName>) {
  const existingValidate = rules?.validate;
  const mergedRules = {
    ...rules,
    validate: {
      ...(typeof existingValidate === "function"
        ? { custom: existingValidate }
        : existingValidate),
      number: numberRule({ integer, min, max }),
    },
  } as UseControllerProps<TFieldValues, TName>["rules"];

  return (
    <RhfTextField<TFieldValues, TName>
      {...props}
      type="number"
      rules={mergedRules}
      slotProps={withHtmlInputDefaults(slotProps, {
        min,
        max,
        step: step ?? (integer ? 1 : "any"),
      })}
    />
  );
}

type RhfDateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<RhfTextFieldProps<TFieldValues, TName>, "type"> & {
  type?: "date" | "time" | "datetime-local";
};

/** Campo de fecha u hora nativo con la etiqueta siempre contraída. */
export function RhfDateField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ type = "date", slotProps, ...props }: RhfDateFieldProps<TFieldValues, TName>) {
  return (
    <RhfTextField<TFieldValues, TName>
      {...props}
      type={type}
      slotProps={withInputLabelDefaults(slotProps, { shrink: true })}
    />
  );
}
