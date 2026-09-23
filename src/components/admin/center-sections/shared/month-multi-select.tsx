import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useId } from "react";
import { useController } from "react-hook-form";

import { useEditable } from "@/components/ui/form/editable-context";
import type { CatalogOption } from "@/lib/admin-api";
import type { SectionFormValues } from "@/lib/center-sections/form-types";

type MonthsPath = `visitorSeasons.${number}.months`;

function sortMonths(months: readonly string[]): string[] {
  return [...new Set(months)].sort((a, b) => Number(a) - Number(b));
}

/**
 * Selector múltiple de meses de una temporada. Usa el catálogo de meses (su
 * `code` es el número de mes que valida la API) y guarda los números como
 * texto ordenado.
 */
export function MonthMultiSelect({
  name,
  label,
  months,
}: {
  name: MonthsPath;
  label: string;
  months: readonly CatalogOption[];
}) {
  const editable = useEditable();
  const generatedId = useId();
  const selectId = `months-${generatedId}`;
  const labelId = `${selectId}-label`;
  const { field } = useController<SectionFormValues, MonthsPath>({ name });
  const value = Array.isArray(field.value) ? field.value : [];
  const options = months.flatMap((month) =>
    month.code ? [{ value: month.code, label: month.name }] : [],
  );
  const labels = new Map(options.map((option) => [option.value, option.label]));

  return (
    <FormControl fullWidth disabled={!editable}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select<string[]>
        multiple
        id={selectId}
        labelId={labelId}
        label={label}
        name={field.name}
        value={value}
        inputRef={field.ref}
        onBlur={field.onBlur}
        onChange={(event: SelectChangeEvent<string[]>) => {
          const next = event.target.value;
          field.onChange(sortMonths(typeof next === "string" ? next.split(",") : next));
        }}
        renderValue={(selected) =>
          selected.map((month) => labels.get(month) ?? month).join(", ")
        }
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
