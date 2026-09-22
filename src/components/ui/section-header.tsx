import { Box, Stack, Typography } from "@mui/material";

import { webTokens } from "@/theme/tokens";

export function SectionHeader({
  title,
  description,
  icon,
  level = "section",
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  /** `subsection` reduce el título para bloques dentro de una sección. */
  level?: "section" | "subsection";
  /** Acción alineada a la derecha del encabezado (por ejemplo, "Añadir"). */
  action?: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      gap={webTokens.spacing.control}
    >
      <Stack direction="row" spacing={webTokens.spacing.inline} alignItems="flex-start">
        {icon ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pt: 0.25,
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box>
          <Typography variant={level === "section" ? "h6" : "subtitle1"}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
  );
}
