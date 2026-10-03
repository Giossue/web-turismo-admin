"use client";

import { Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useState } from "react";

/** La activación se aplica de forma independiente de la propuesta editorial. */
export function CenterVisibilityControl({
  active,
  working,
  applying,
  onApply,
}: {
  active: boolean;
  working: boolean;
  applying: boolean;
  onApply: (active: boolean) => Promise<void>;
}) {
  const [desiredActive, setDesiredActive] = useState(active);
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={desiredActive}
              onChange={(_, checked) => setDesiredActive(checked)}
              disabled={working}
            />
          }
          label="Ficha activa"
        />
        <Button
          variant="outlined"
          disabled={working || desiredActive === active}
          onClick={() => void onApply(desiredActive)}
        >
          {applying ? "Aplicando…" : "Aplicar"}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Desactivar oculta la ficha en la app. Activar no publica un borrador.
      </Typography>
    </Stack>
  );
}
