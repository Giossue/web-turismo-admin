import { Grid, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";

/**
 * Grupo de campos fijos (no repetibles) sobre fondo suave: título opcional,
 * descripción opcional y una rejilla. Los hijos deben ser `Grid` items.
 */
export function FieldGroup({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <FlatSurface padding="compact" tone="subtle">
      <Stack spacing={webTokens.spacing.control}>
        {title ? <Typography variant="subtitle1">{title}</Typography> : null}
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
        <Grid container spacing={webTokens.spacing.control}>
          {children}
        </Grid>
      </Stack>
    </FlatSurface>
  );
}
