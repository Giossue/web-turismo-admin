import { TextField, type TextFieldProps } from "@mui/material";

import { withHtmlInputDefaults } from "@/components/ui/text-field-slot-props";

export function SearchField({ slotProps, ...props }: TextFieldProps) {
  return (
    <TextField
      {...props}
      fullWidth
      slotProps={withHtmlInputDefaults(slotProps, { maxLength: 180 })}
    />
  );
}
