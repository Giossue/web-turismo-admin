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
}: {
  id: string;
  label: string;
  value: string;
  options: CatalogSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}) {
  const labelId = `${id}-label`;
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value);

  return (
    <FormControl
      fullWidth
      required={required}
      error={Boolean(helperText)}
      disabled={disabled}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        id={id}
        labelId={labelId}
        label={label}
        value={value}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>
            {option.displayName ?? option.name}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
