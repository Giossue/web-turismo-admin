import { Alert, Box, Button, Stack, Typography } from "@mui/material";

import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";

export function AdminAccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: webTokens.spacing.surface,
      }}
    >
      <FlatSurface sx={{ width: "100%", maxWidth: 520 }} padding="default">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="h5" component="h1">
            Acceso no autorizado
          </Typography>
          <Alert severity="warning">
            Esta cuenta no tiene un rol institucional. El panel está reservado para
            administradores y agentes turísticos.
          </Alert>
          <Button variant="outlined" onClick={onLogout} sx={{ alignSelf: "flex-start" }}>
            Cerrar sesión
          </Button>
        </Stack>
      </FlatSurface>
    </Box>
  );
}
