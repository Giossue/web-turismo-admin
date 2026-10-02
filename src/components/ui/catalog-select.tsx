import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";

export type CatalogSelectOption = {
  id: number;
  name: string;
  displayName?: string;
  active?: boolean;
  disabled?: boolean;
};

export function CatalogSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  helperText,
  emptyLabel,
  displayEmpty = false,
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
  /** Texto de error bajo el control; marca el campo como inválido. */
  helperText?: string;
  /** Añade una opción vacía (valor `""`) con este texto, por ejemplo "Todas". */
  emptyLabel?: string;
  /** Muestra la opción vacía en el control cerrado y mantiene la etiqueta flotante. */
  displayEmpty?: boolean;
  name?: string;
  inputRef?: React.Ref<unknown>;
  onBlur?: () => void;
}) {
  const labelId = `${id}-label`;
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value);
  // Mientras las opciones cargan (o si el valor quedó fuera del filtro) se
  // muestra vacío en lugar de un valor fuera de rango para MUI.
  const displayValue = options.some((option) => String(option.id) === value) ? value : "";

  return (
    <FormControl
      fullWidth
      required={required}
      error={Boolean(helperText)}
      disabled={disabled}
    >
      <InputLabel id={labelId} shrink={displayEmpty ? true : undefined}>
        {label}
      </InputLabel>
      <Select
        id={id}
        labelId={labelId}
        label={label}
        name={name}
        value={displayValue}
        displayEmpty={displayEmpty}
        inputRef={inputRef}
        onBlur={onBlur}
        onChange={handleChange}
      >
        {emptyLabel !== undefined ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)} disabled={option.disabled}>
            {option.displayName ?? option.name}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
