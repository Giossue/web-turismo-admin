"use client";

import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import { useController } from "react-hook-form";

import { useEditable } from "@/components/ui/form/editable-context";
import type { CatalogOption } from "@/lib/admin-api";
import type { CenterFormValues } from "@/lib/center-form";
import { webTokens } from "@/theme/tokens";

type OptionListField = "activityIds" | "accessibilityIds" | "facilityIds";

/**
 * Casillas de selección múltiple sobre un catálogo; guarda los ids marcados
 * como texto. `renderSelected` añade campos bajo cada opción marcada.
 */
export function OptionGrid({
  name,
  options,
  disabled = false,
  renderSelected,
}: {
  name: OptionListField;
  options: readonly CatalogOption[];
  disabled?: boolean;
  renderSelected?: (option: CatalogOption) => React.ReactNode;
}) {
  const editable = useEditable();
  const { field } = useController<CenterFormValues, OptionListField>({ name });
  const selected = field.value ?? [];

  if (options.length === 0) {
    return <Typography color="text.secondary">No hay opciones configuradas.</Typography>;
  }

  const toggle = (id: string, checked: boolean) =>
    field.onChange(
      checked ? [...selected, id] : selected.filter((current) => current !== id),
    );

  return (
    <Grid container spacing={webTokens.spacing.inline}>
      {options.map((option) => {
        const id = String(option.id);
        const checked = selected.includes(id);
        return (
          <Grid key={option.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name={field.name}
                  value={id}
                  checked={checked}
                  disabled={disabled || !editable}
                  onBlur={field.onBlur}
                  onChange={(event) => toggle(id, event.target.checked)}
                />
              }
              label={option.name}
            />
            {checked && renderSelected ? renderSelected(option) : null}
          </Grid>
        );
      })}
    </Grid>
  );
}
