"use client";

import { Box, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { LoadingState } from "@/components/ui/loading-state";
import { MetricCard } from "@/components/ui/metric-card";
import { summaryQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

export function SummarySection({ token }: { token: string }) {
  const { data: summary, error, isLoading } = useQuery(summaryQueryOptions(token));
  if (isLoading) return <LoadingState label="Cargando resumen" />;
  const metric = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  return (
    <Stack spacing={webTokens.spacing.section}>
      {error ? (
        <FlatSurface>
          <ContentState
            status="error"
            message={errorMessage(error, "No se pudo cargar el resumen.")}
          />
        </FlatSurface>
      ) : null}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          gap: webTokens.spacing.control,
        }}
      >
        <MetricCard value={metric(summary?.total)} label="Centros registrados" />
        <MetricCard
          value={metric(summary?.published)}
          label="Publicados"
          color="success.main"
        />
        <MetricCard
          value={metric(summary?.pendingReview)}
          label="En revisión"
          color="warning.main"
        />
      </Box>
    </Stack>
  );
}
