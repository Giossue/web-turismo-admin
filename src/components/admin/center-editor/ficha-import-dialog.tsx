"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { LoadingSpinner } from "@/components/ui/loading-state";
import { webTokens } from "@/theme/tokens";

export type FichaImportResult = {
  sections: number;
  photos: number;
  warnings: number;
};

/** Progreso de la importación del Excel y resumen breve al terminar. */
export function FichaImportDialog({
  importing,
  result,
  onClose,
}: {
  importing: boolean;
  result: FichaImportResult | null;
  onClose: () => void;
}) {
  const open = importing || result !== null;

  return (
    <Dialog
      open={open}
      onClose={() => !importing && onClose()}
      fullWidth
      maxWidth="xs"
      aria-busy={importing}
    >
      <DialogTitle>{importing ? "Importando ficha" : "Ficha importada"}</DialogTitle>
      <DialogContent>
        {importing ? (
          <Stack
            spacing={webTokens.spacing.control}
            alignItems="center"
            sx={{ py: 2 }}
            role="status"
          >
            <LoadingSpinner label="Importando ficha" size={40} />
            <Typography align="center">Leyendo el Excel…</Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Puede tardar unos segundos si la ficha trae fotos. No cierres esta pantalla.
            </Typography>
          </Stack>
        ) : result ? (
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleRounded color="success" />
              <Typography>Los datos del Excel ya están en el formulario.</Typography>
            </Stack>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 3 }}>
              <Typography component="li" variant="body2">
                {result.sections === 1
                  ? "1 apartado leído"
                  : `${result.sections} apartados leídos`}
              </Typography>
              {result.photos > 0 ? (
                <Typography component="li" variant="body2">
                  {result.photos === 1
                    ? "1 foto se adjuntará al guardar"
                    : `${result.photos} fotos se adjuntarán al guardar`}
                </Typography>
              ) : null}
              {result.warnings > 0 ? (
                <Typography component="li" variant="body2" color="warning.main">
                  {result.warnings === 1
                    ? "1 advertencia: revísala en el aviso amarillo"
                    : `${result.warnings} advertencias: revísalas en el aviso amarillo`}
                </Typography>
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Revisa los datos antes de guardar.
            </Typography>
          </Stack>
        ) : null}
      </DialogContent>
      {importing ? null : (
        <DialogActions>
          <Button variant="contained" onClick={onClose} autoFocus>
            Revisar ficha
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
