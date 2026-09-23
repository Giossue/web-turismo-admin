import { Grid, Stack, Typography } from "@mui/material";

import type { SectionFormValues } from "@/lib/center-sections/form-types";
import { toNullableNumber } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

import { SectionCatalogSelect, SectionNumberField } from "../shared/section-fields";
import type { SectionFieldsProps } from "./types";

/** El máximo no puede quedar por debajo del mínimo (la API lo rechaza). */
function notBelow(minKey: "minTemperature" | "minRainfall", message: string) {
  return (value: unknown, values: SectionFormValues): true | string => {
    const min = toNullableNumber(values[minKey]);
    const max = toNullableNumber(typeof value === "string" ? value : null);
    return min === null || max === null || max >= min ? true : message;
  };
}

export function CharacteristicsFields({ catalogs }: SectionFieldsProps) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Typography variant="subtitle1">Clima y rangos observados</Typography>
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionCatalogSelect
            name="climateId"
            label="Tipo de clima"
            options={catalogs?.climates ?? []}
            emptyLabel="Sin seleccionar"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionNumberField
            name="minTemperature"
            label="Temperatura mínima (°C)"
            step={0.1}
            rules={{ deps: ["maxTemperature"] }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionNumberField
            name="maxTemperature"
            label="Temperatura máxima (°C)"
            step={0.1}
            rules={{
              validate: notBelow(
                "minTemperature",
                "La temperatura máxima no puede ser menor que la mínima.",
              ),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionNumberField
            name="minRainfall"
            label="Precipitación mínima (mm)"
            min={0}
            step={0.1}
            rules={{ deps: ["maxRainfall"] }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionNumberField
            name="maxRainfall"
            label="Precipitación máxima (mm)"
            min={0}
            step={0.1}
            rules={{
              validate: notBelow(
                "minRainfall",
                "La precipitación máxima no puede ser menor que la mínima.",
              ),
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
