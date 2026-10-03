import { Box, CircularProgress } from "@mui/material";

import { webTokens } from "@/theme/tokens";

/** Indicador circular compartido; los botones usan su tamaño compacto. */
export function LoadingSpinner({
  label = "Cargando",
  size = 32,
  color = "primary",
}: {
  label?: string;
  size?: number;
  color?: "primary" | "inherit";
}) {
  return <CircularProgress aria-label={label} size={size} color={color} />;
}

/** Estado de carga para pantallas, tablas y contenido de diálogos. */
export function LoadingState({ label }: { label?: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        py: webTokens.spacing.state,
      }}
    >
      <LoadingSpinner label={label} />
    </Box>
  );
}
