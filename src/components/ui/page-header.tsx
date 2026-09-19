import { Box, Stack, Typography } from "@mui/material";

import { webTokens } from "@/theme/tokens";

export function PageHeader({
  title,
  description,
  actions,
  backAction,
  titleVariant = "h4",
  headingComponent = "h1",
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  backAction?: React.ReactNode;
  titleVariant?: "h4" | "h5";
  headingComponent?: "h1" | "h2";
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      gap={webTokens.spacing.control}
    >
      <Box>
        {backAction}
        <Typography variant={titleVariant} component={headingComponent} gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {actions ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={webTokens.spacing.inline}
          alignItems={{ sm: "flex-start" }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
