"use client";

import { Box, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { LoadingState } from "@/components/ui/loading-state";
import { MetricCard } from "@/components/ui/metric-card";
import type { EstablishmentReviewStatus } from "@/lib/admin-api";
import { establishmentReviewStatusLabel } from "@/lib/admin-labels";
import {
  catalogsQueryOptions,
  establishmentsPageQueryOptions,
  summaryQueryOptions,
} from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

const STATUS_COLORS: Record<string, string> = {
  BORRADOR: "var(--mui-palette-grey-400)",
  EN_REVISION: "var(--mui-palette-warning-main)",
  PUBLICADO: "var(--mui-palette-success-main)",
  RECHAZADO: "var(--mui-palette-error-main)",
};

const ESTABLISHMENT_STATUSES: EstablishmentReviewStatus[] = [
  "PUBLICADO",
  "EN_REVISION",
  "BORRADOR",
  "RECHAZADO",
];

const metric = (value: number | undefined) => (value === undefined ? "—" : String(value));

export function SummarySection({ token }: { token: string }) {
  const { data: summary, error, isLoading } = useQuery(summaryQueryOptions(token));
  const { data: establishments } = useQuery(
    establishmentsPageQueryOptions(token, { limit: 1 }),
  );
  if (isLoading) return <LoadingState label="Cargando resumen" />;

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
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: webTokens.spacing.control,
        }}
      >
        <MetricCard value={metric(summary?.total)} label="Centros registrados" />
        <MetricCard
          value={metric(summary?.published)}
          label="Centros publicados"
          color="success.main"
        />
        <MetricCard
          value={metric(summary?.pendingReview)}
          label="Centros en revisión"
          color="warning.main"
        />
        <MetricCard value={metric(establishments?.total)} label="Establecimientos" />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: webTokens.spacing.control,
        }}
      >
        <ChartCard title="Centros por estado">
          <StatusDonut
            rows={(summary?.byStatus ?? []).map((status) => ({
              code: status.code,
              label: status.name,
              value: status.total,
            }))}
          />
        </ChartCard>
        <EstablishmentsByStatusChart token={token} />
      </Box>
      <EstablishmentsByActivityChart token={token} />
    </Stack>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <FlatSurface padding="default">
      <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </FlatSurface>
  );
}

function StatusDonut({
  rows,
}: {
  rows: Array<{ code: string; label: string; value: number }>;
}) {
  const data = rows
    .filter((row) => row.value > 0)
    .map((row, id) => ({ id, ...row, color: STATUS_COLORS[row.code] }));
  if (data.length === 0) return <ContentState status="empty" message="Sin registros." />;
  return (
    <PieChart
      height={220}
      series={[
        {
          data,
          innerRadius: 60,
          outerRadius: 95,
          paddingAngle: 2,
          cornerRadius: 4,
          highlightScope: { fade: "global", highlight: "item" },
        },
      ]}
    />
  );
}

/** Cuenta establecimientos por estado de revisión pidiendo solo el total de cada filtro. */
function EstablishmentsByStatusChart({ token }: { token: string }) {
  const counts = useQueries({
    queries: ESTABLISHMENT_STATUSES.map((reviewStatus) =>
      establishmentsPageQueryOptions(token, { reviewStatus, limit: 1 }),
    ),
  });
  const loading = counts.some((query) => query.isLoading);
  return (
    <ChartCard title="Establecimientos por estado">
      {loading ? (
        <LoadingState label="Cargando establecimientos" />
      ) : (
        <StatusDonut
          rows={ESTABLISHMENT_STATUSES.map((code, index) => ({
            code,
            label: establishmentReviewStatusLabel(code),
            value: counts[index]?.data?.total ?? 0,
          }))}
        />
      )}
    </ChartCard>
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
    <ChartCard title="Establecimientos por actividad">
      {loading ? (
        <LoadingState label="Cargando establecimientos" />
      ) : rows.length === 0 ? (
        <ContentState status="empty" message="Sin establecimientos registrados." />
      ) : (
        <BarChart
          height={Math.max(220, rows.length * 40 + 40)}
          layout="horizontal"
          dataset={rows}
          yAxis={[
            {
              scaleType: "band",
              dataKey: "name",
              width: 280,
              tickLabelStyle: { fontSize: 12 },
            },
          ]}
          xAxis={[{ tickMinStep: 1 }]}
          series={[
            {
              dataKey: "total",
              label: "Establecimientos",
              color: "var(--mui-palette-primary-main)",
            },
          ]}
          barLabel="value"
          borderRadius={4}
          hideLegend
          grid={{ vertical: true }}
          margin={{ left: 0, right: 16 }}
        />
      )}
    </ChartCard>
  );
}
