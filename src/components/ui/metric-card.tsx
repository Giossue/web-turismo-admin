import { Typography } from "@mui/material";

import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";

export function MetricCard({
  value,
  label,
  color = "primary.main",
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <FlatSurface padding="compact">
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: webTokens.spacing.inline }}
      >
        {label}
      </Typography>
    </FlatSurface>
  );
}
