import { Box, CircularProgress, Typography } from "@mui/material";

import { webTokens } from "@/theme/tokens";

export function ContentState({
  status,
  message,
  label,
}: {
  status: "loading" | "empty";
  message?: string;
  label?: string;
}) {
  if (status === "loading") {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: webTokens.spacing.state }}>
        <CircularProgress aria-label={label ?? "Cargando"} />
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
