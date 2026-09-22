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
  Icon?: SvgIconComponent;
  imageSrc?: string;
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
          selectedOption && (SelectedIcon || selectedOption.imageSrc) ? (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
            >
              {selectedOption.imageSrc ? (
                <Box
                  component="img"
                  src={selectedOption.imageSrc}
                  alt=""
                  sx={{ height: 28, width: 28 }}
                />
              ) : SelectedIcon ? (
                <SelectedIcon fontSize="small" />
              ) : null}
              {selectedOption.label}
            </Box>
          ) : (
            value
          )
        }
      >
        {options.map(
          ({ value: optionValue, label: optionLabel, Icon, imageSrc }) => (
          <MenuItem key={optionValue} value={optionValue}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {imageSrc ? (
                <Box
                  component="img"
                  src={imageSrc}
                  alt=""
                  sx={{ height: 32, width: 32 }}
                />
              ) : Icon ? (
                <Icon fontSize="small" />
              ) : null}
            </ListItemIcon>
            <ListItemText primary={optionLabel} />
          </MenuItem>
          ),
        )}
      </Select>
    </FormControl>
  );
}
