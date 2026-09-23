import AddRounded from "@mui/icons-material/AddRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  useFieldArray,
  useFormContext,
  type FieldArray,
  type FieldArrayPath,
} from "react-hook-form";

import { FlatSurface } from "@/components/ui/flat-surface";
import { useEditable } from "@/components/ui/form/editable-context";
import { SectionHeader } from "@/components/ui/section-header";
import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { webTokens } from "@/theme/tokens";

import { RemoveRowButton } from "./remove-row-button";

type ArrayName = FieldArrayPath<SectionFormValues>;

/**
 * Bloque repetible de un apartado: encabezado con un único botón "Añadir",
 * mensaje vacío y una tarjeta por fila (con clave estable `field.id`). Es el
 * dueño del `useFieldArray` de `name`, que obtiene del `FormProvider`.
 */
export function RepeatableFieldArray<TName extends ArrayName>({
  name,
  title,
  description,
  addLabel,
  emptyLabel,
  createEmpty,
  removeLabel,
  hideWhenEmpty = false,
  renderRow,
}: {
  name: TName;
  /** Sin título solo se muestra el botón "Añadir" sobre las filas. */
  title?: string;
  description?: string;
  addLabel: string;
  emptyLabel?: string;
  createEmpty: () => FieldArray<SectionFormValues, TName>;
  /** Prefijo del nombre accesible del botón de quitar; se completa con el número de fila. */
  removeLabel: string;
  /** Oculta el bloque completo (incluido el botón) mientras no haya filas. */
  hideWhenEmpty?: boolean;
  renderRow: (index: number, removeButton: ReactNode) => ReactNode;
}) {
  const editable = useEditable();
  const { control } = useFormContext<SectionFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  if (hideWhenEmpty && fields.length === 0) return null;

  const addButton = (
    <Button
      type="button"
      size="small"
      variant="outlined"
      startIcon={<AddRounded />}
      disabled={!editable}
      onClick={() => append(createEmpty())}
    >
      {addLabel}
    </Button>
  );

  return (
    <Stack spacing={webTokens.spacing.control}>
      {title ? (
        <SectionHeader
          level="subsection"
          title={title}
          description={description ?? ""}
          action={addButton}
        />
      ) : (
        <Box>{addButton}</Box>
      )}
      {fields.length === 0 ? (
        emptyLabel ? (
          <Typography variant="body2" color="text.secondary">
            {emptyLabel}
          </Typography>
        ) : null
      ) : (
        <Stack spacing={1.5}>
          {fields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              {renderRow(
                index,
                <RemoveRowButton
                  label={`${removeLabel} ${index + 1}`}
                  onClick={() => remove(index)}
                />,
              )}
            </FlatSurface>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
