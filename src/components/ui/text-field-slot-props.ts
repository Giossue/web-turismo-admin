import type { TextFieldProps } from "@mui/material";

type TextFieldSlotProps = NonNullable<TextFieldProps["slotProps"]>;

/**
 * Añade atributos por defecto al `<input>` de un `TextField` (vía
 * `slotProps.htmlInput`) sin descartar los `slotProps` del llamador, que
 * tienen prioridad.
 */
export function withHtmlInputDefaults(
  slotProps: TextFieldProps["slotProps"],
  defaults: Record<string, unknown>,
): TextFieldSlotProps {
  const current = slotProps?.htmlInput;
  return {
    ...slotProps,
    htmlInput:
      typeof current === "function"
        ? (ownerState) => ({ ...defaults, ...current(ownerState) })
        : { ...defaults, ...current },
  };
}

/** Igual que `withHtmlInputDefaults`, para `slotProps.inputLabel`. */
export function withInputLabelDefaults(
  slotProps: TextFieldProps["slotProps"],
  defaults: Record<string, unknown>,
): TextFieldSlotProps {
  const current = slotProps?.inputLabel;
  return {
    ...slotProps,
    inputLabel:
      typeof current === "function"
        ? (ownerState) => ({ ...defaults, ...current(ownerState) })
        : { ...defaults, ...current },
  };
}
