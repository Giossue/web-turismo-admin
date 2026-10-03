"use client";

import { Box, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useQueries, useQuery } from "@tanstack/react-query";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { LoadingState } from "@/components/ui/loading-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  catalogsQueryOptions,
  establishmentsPageQueryOptions,
  summaryQueryOptions,
} from "@/lib/admin-queries";
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
      <EstablishmentsByActivityChart token={token} />
    </Stack>
  );
}

/** Cuenta establecimientos por actividad pidiendo solo el total de cada filtro. */
function EstablishmentsByActivityChart({ token }: { token: string }) {
  const { data: catalogs } = useQuery(catalogsQueryOptions(token));
  const activities = catalogs?.establishmentActivities ?? [];
  const counts = useQueries({
    queries: activities.map((activity) =>
      establishmentsPageQueryOptions(token, { activity: activity.name, limit: 1 }),
    ),
  });
  const rows = activities
    .map((activity, index) => ({
      name: activity.name,
      total: counts[index]?.data?.total,
    }))
    .filter((row): row is { name: string; total: number } => row.total !== undefined)
    .sort((a, b) => b.total - a.total);
  const loading = activities.length === 0 || counts.some((query) => query.isLoading);

  return (
    <FlatSurface>
      <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
        Establecimientos por actividad
      </Typography>
      {loading ? (
        <LoadingState label="Cargando establecimientos" />
      ) : rows.length === 0 ? (
        <ContentState status="empty" message="Sin establecimientos registrados." />
      ) : (
        <BarChart
          height={Math.max(220, rows.length * 36 + 40)}
          layout="horizontal"
          dataset={rows}
          yAxis={[{ scaleType: "band", dataKey: "name", width: 160 }]}
          series={[
            {
              dataKey: "total",
              label: "Establecimientos",
              color: "var(--mui-palette-primary-main)",
            },
          ]}
          hideLegend
          grid={{ vertical: true }}
          margin={{ left: 8, right: 16 }}
        />
      )}
    </FlatSurface>
  );
}
