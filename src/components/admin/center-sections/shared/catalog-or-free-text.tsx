import { Grid, type GridProps } from "@mui/material";
import { get, type FieldPath } from "react-hook-form";

import type { CatalogSelectOption } from "@/components/ui/catalog-select";
import { maxLen } from "@/components/ui/form/rules";
import type { SectionFormValues } from "@/lib/center-sections/form-types";

import { SectionCatalogSelect, SectionTextField } from "./section-fields";

type SectionPath = FieldPath<SectionFormValues>;
type GridSize = GridProps["size"];

const DEFAULT_SIZE: GridSize = { xs: 12, md: 4 };

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Par "valor catalogado + texto libre" de la ficha: el selector guarda el id
 * del catálogo y el texto describe el valor cuando no está catalogado. Devuelve
 * dos celdas contiguas de la rejilla del llamador.
 *
 * Con `requiredMessage`, el texto es obligatorio mientras no se elija un valor
 * del catálogo (la API rechaza filas sin ninguno de los dos).
 */
export function CatalogOrFreeText({
  catalogName,
  catalogLabel,
  options,
  emptyLabel = "Seleccionar catálogo",
  onCatalogChange,
  textName,
  textLabel,
  textMaxLength,
  textHelperText,
  requiredMessage,
  catalogSize = DEFAULT_SIZE,
  textSize = DEFAULT_SIZE,
  catalogDisabled = false,
  textDisabled = false,
}: {
  catalogName: SectionPath;
  catalogLabel: string;
  options: readonly CatalogSelectOption[];
  emptyLabel?: string;
  onCatalogChange?: (value: string) => void;
  textName: SectionPath;
  textLabel: string;
  textMaxLength?: number;
  textHelperText?: string;
  requiredMessage?: string;
  catalogSize?: GridSize;
  textSize?: GridSize;
  catalogDisabled?: boolean;
  textDisabled?: boolean;
}) {
  return (
    <>
      <Grid size={catalogSize}>
        <SectionCatalogSelect
          name={catalogName}
          label={catalogLabel}
          options={options}
          emptyLabel={emptyLabel}
          disabled={catalogDisabled}
          onValueChange={onCatalogChange}
          // Elegir un valor del catálogo vuelve a validar el texto libre.
          rules={requiredMessage ? { deps: [textName] } : undefined}
        />
      </Grid>
      <Grid size={textSize}>
        <SectionTextField
          name={textName}
          label={textLabel}
          helperText={textHelperText}
          disabled={textDisabled}
          rules={{
            ...(textMaxLength ? { maxLength: maxLen(textMaxLength) } : {}),
            ...(requiredMessage
              ? {
                  validate: (value: unknown, values: SectionFormValues) =>
                    hasText(get(values, catalogName)) ||
                    hasText(value) ||
                    requiredMessage,
                }
              : {}),
          }}
        />
      </Grid>
    </>
  );
}
