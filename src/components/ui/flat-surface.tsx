import { Paper, type PaperProps } from "@mui/material";

import { webTokens } from "@/theme/tokens";

type FlatSurfaceProps = PaperProps & {
  padding?: "none" | "compact" | "default";
  tone?: "paper" | "subtle";
};

export function FlatSurface({
  sx,
  padding = "none",
  tone = "paper",
  ...props
}: FlatSurfaceProps) {
  const paddingSx =
    padding === "default"
      ? { p: webTokens.spacing.surface }
      : padding === "compact"
        ? { p: webTokens.spacing.surfaceCompact }
        : {};

  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        border: webTokens.border,
        borderRadius: `${webTokens.shape.radius}px`,
        boxShadow: "none",
        bgcolor: tone === "subtle" ? "background.subtle" : "background.paper",
        ...paddingSx,
        ...sx,
      }}
    />
  );
}
