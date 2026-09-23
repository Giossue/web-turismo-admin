import { Grid, Stack, Typography } from "@mui/material";
import { useId } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import { POLICY_DEFINITIONS } from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import {
  SectionNumberField,
  SectionResponseSelect,
  SectionTextField,
} from "../shared/section-fields";
import { OBSERVATION_RULES, textRules, YEAR_LIMITS } from "../shared/section-rules";

/**
 * Las cuatro preguntas fijas de la ficha. `createSectionValues` siempre
 * devuelve `policies` en el orden de `POLICY_DEFINITIONS`, por eso no hay
 * filas que añadir ni quitar.
 */
export function PoliciesFields() {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <SectionHeader
        level="subsection"
        title="Políticas institucionales"
        description="Responde las cuatro preguntas de la ficha y conserva año, especificación y observación sin convertir una ausencia de dato en una respuesta negativa."
      />
      <Stack spacing={1.5}>
        {POLICY_DEFINITIONS.map((policy, index) => (
          <PolicyRow key={policy.code} index={index} question={policy.question} />
        ))}
      </Stack>
    </Stack>
  );
}

function PolicyRow({ index, question }: { index: number; question: string }) {
  const questionId = useId();
  return (
    <FlatSurface padding="compact" tone="subtle">
      {/* El grupo toma la pregunta como nombre accesible de sus campos. */}
      <Grid
        container
        spacing={webTokens.spacing.control}
        alignItems="flex-start"
        role="group"
        aria-labelledby={questionId}
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography id={questionId} variant="body2" fontWeight={600} sx={{ pt: 1 }}>
            {question}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SectionResponseSelect name={`policies.${index}.response`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <SectionNumberField
            name={`policies.${index}.year`}
            label="Año"
            {...YEAR_LIMITS}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <SectionTextField
            name={`policies.${index}.specification`}
            label="Especificación"
            rules={textRules(1_000)}
          />
        </Grid>
        <Grid size={12}>
          <SectionTextField
            name={`policies.${index}.observation`}
            label="Observación"
            rules={OBSERVATION_RULES}
          />
        </Grid>
      </Grid>
    </FlatSurface>
  );
}
