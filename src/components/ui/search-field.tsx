import SearchRounded from "@mui/icons-material/SearchRounded";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

import { withHtmlInputDefaults } from "@/components/ui/text-field-slot-props";

export function SearchInputAdornment() {
  return (
    <InputAdornment position="start" disablePointerEvents aria-hidden="true">
      <SearchRounded fontSize="small" sx={{ color: "text.secondary" }} />
    </InputAdornment>
  );
}

export function SearchField({ label, placeholder, slotProps, ...props }: TextFieldProps) {
  const searchLabel = typeof label === "string" ? label : (placeholder ?? "Buscar");
  const input = slotProps?.input;
  const searchSlots: TextFieldProps["slotProps"] = {
    ...slotProps,
    input:
      typeof input === "function"
        ? (ownerState) => {
            const current = input(ownerState);
            return {
              ...current,
              startAdornment: (
                <>
                  <SearchInputAdornment />
                  {current.startAdornment}
                </>
              ),
            };
          }
        : {
            ...input,
            startAdornment: (
              <>
                <SearchInputAdornment />
                {input?.startAdornment}
              </>
            ),
          },
  };
  return (
    <TextField
      {...props}
      label={typeof label === "string" ? undefined : label}
      placeholder={placeholder ?? searchLabel}
      hiddenLabel
      fullWidth
      slotProps={withHtmlInputDefaults(searchSlots, {
        maxLength: 180,
        "aria-label": searchLabel,
      })}
    />
  );
}
