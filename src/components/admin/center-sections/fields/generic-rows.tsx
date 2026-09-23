import { Grid } from "@mui/material";

import { required } from "@/components/ui/form/rules";
import { emptyRow } from "@/lib/center-sections/form-defaults";
import { webTokens } from "@/theme/tokens";

import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionNumberField,
  SectionResponseSelect,
  SectionTextField,
} from "../shared/section-fields";
import { COUNT_LIMITS, OBSERVATION_RULES, textRules } from "../shared/section-rules";

/**
 * Filas genéricas "elemento / respuesta / cantidad" de un apartado. Si el
 * apartado no sugiere filas, el bloque solo aparece cuando ya hay alguna.
 */
export function GenericRowsFields({ hasSuggestedRows }: { hasSuggestedRows: boolean }) {
  return (
    <RepeatableFieldArray
      name="rows"
      addLabel="Añadir fila"
      createEmpty={emptyRow}
      removeLabel="Eliminar fila"
      hideWhenEmpty={!hasSuggestedRows}
      renderRow={(index, removeButton) => (
        <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionTextField
              name={`rows.${index}.label`}
              label="Elemento o indicador"
              rules={{
                required: required("Indica el elemento o indicador"),
                ...textRules(180),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SectionResponseSelect name={`rows.${index}.response`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <SectionNumberField
              name={`rows.${index}.quantity`}
              label="Cantidad"
              {...COUNT_LIMITS}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>{removeButton}</Grid>
          <Grid size={12}>
            <SectionTextField
              name={`rows.${index}.observation`}
              label="Observación de la fila"
              multiline
              minRows={2}
              rules={OBSERVATION_RULES}
            />
          </Grid>
        </Grid>
      )}
    />
  );
}
