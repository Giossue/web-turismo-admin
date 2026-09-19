import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import { webTokens } from "@/theme/tokens";

export function SectionHeader({
  title,
  description,
  loading = false,
  inset = false,
  icon,
}: {
  title: string;
  description: string;
  loading?: boolean;
  inset?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Box
      sx={
        inset
          ? { p: webTokens.spacing.surface, pb: webTokens.spacing.surfaceCompact }
          : undefined
      }
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={webTokens.spacing.control}
      >
        <Stack direction="row" spacing={webTokens.spacing.inline} alignItems="flex-start">
          {icon}
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>
        {loading ? <CircularProgress size={22} aria-label="Cargando" /> : null}
      </Stack>
    </Box>
  );
}
