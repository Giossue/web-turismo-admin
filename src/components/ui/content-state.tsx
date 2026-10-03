import { Box, Typography } from "@mui/material";

import { LoadingState } from "@/components/ui/loading-state";
import { webTokens } from "@/theme/tokens";

export function ContentState({
  status,
  message,
  label,
}: {
  status: "loading" | "empty" | "error";
  message?: string;
  label?: string;
}) {
  if (status === "loading") {
    return <LoadingState label={label} />;
  }

  if (status === "error") {
    return (
      <Box
        role="alert"
        sx={{ p: webTokens.spacing.surface, pt: webTokens.spacing.stateInset }}
      >
        <Typography color="error">
          {message ?? "No se pudo cargar la información."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: webTokens.spacing.surface, pt: webTokens.spacing.stateInset }}>
      <Typography color="text.secondary">
        {message ?? "No hay información para mostrar."}
      </Typography>
    </Box>
  );
}
