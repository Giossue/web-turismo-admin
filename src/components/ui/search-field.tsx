import { TextField, type TextFieldProps } from "@mui/material";

export function SearchField({ inputProps, ...props }: TextFieldProps) {
  return (
    <TextField {...props} fullWidth inputProps={{ maxLength: 180, ...inputProps }} />
  );
}
