import { Typography } from "@mui/material";

import { FlatSurface } from "@/components/ui/flat-surface";
export function MetricCard({
  value,
  label,
  color = "text.primary",
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <FlatSurface
      padding="compact"
      sx={{
        height: "100%",
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
        {label}
      </Typography>
      <Typography
        variant="h4"
        color={color}
        sx={{ fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.03em" }}
      >
        {value}
      </Typography>
    </FlatSurface>
  );
}
