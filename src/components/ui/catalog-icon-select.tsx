import {
  Box,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

export type CatalogIconSelectOption = {
  value: string;
  label: string;
  Icon: SvgIconComponent;
};

export function CatalogIconSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly CatalogIconSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const labelId = `${id}-label`;
  const selectedOption = options.find((option) => option.value === value);
  const SelectedIcon = selectedOption?.Icon;
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value);

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        id={id}
        labelId={labelId}
        label={label}
        value={value}
        onChange={handleChange}
        renderValue={() =>
          selectedOption && SelectedIcon ? (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
            >
              <SelectedIcon fontSize="small" />
              {selectedOption.label}
            </Box>
          ) : (
            value
          )
        }
      >
        {options.map(({ value: optionValue, label: optionLabel, Icon }) => (
          <MenuItem key={optionValue} value={optionValue}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={optionLabel} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
