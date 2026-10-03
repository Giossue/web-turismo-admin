"use client";

import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import { Box, Divider, Grid, Stack, Typography } from "@mui/material";

import { CenterReviewDiff } from "@/components/admin/center-review-diff";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminCatalogs, AdminCenterDetail } from "@/lib/admin-api";
import { activeLabel, centerStatusLabel } from "@/lib/admin-labels";
import { centerSectionDefinitions } from "@/lib/center-sections/definitions";
import { findCatalogOption } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

const PENDING = "Pendiente";

function findCatalogName(
  options: ReadonlyArray<{ id: number; name: string }> | undefined,
  id: number | undefined,
) {
  return findCatalogOption(options, id)?.name ?? PENDING;
}

function formatCoordinates(latitude: number | undefined, longitude: number | undefined) {
  if (latitude === undefined || longitude === undefined) return PENDING;
  return `${latitude}, ${longitude}`;
}

/** Último paso del asistente: datos principales, avance por apartado y diferencias. */
export function CenterSummaryStep({
  detail,
  catalogs,
}: {
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
}) {
  const draft = detail?.draft ?? detail?.published ?? null;
  const sectionValues = draft?.sections ?? {};
  const completedSections = centerSectionDefinitions.filter(
    (section) => sectionValues[section.code] !== undefined,
  ).length;
  const summaryRows = [
    ["Nombre", draft?.name ?? PENDING],
    ["Subtipo", findCatalogName(catalogs?.subtypes, draft?.subtypeId)],
    ["Zona turística", findCatalogName(catalogs?.zones, draft?.touristZoneId)],
    ["Parroquia", findCatalogName(catalogs?.parishes, draft?.parishId)],
    ["Coordenadas", formatCoordinates(draft?.latitude, draft?.longitude)],
    ["Estado", detail ? centerStatusLabel(detail.status) : PENDING],
    ["Activación", detail ? activeLabel(detail.active) : PENDING],
  ];

  return (
    <Stack spacing={webTokens.spacing.section}>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
            icon={<FactCheckRounded />}
            title="Resumen de la ficha"
            description="Revisa los datos principales y el avance de cada apartado antes de enviarla a revisión."
          />
          <Grid container spacing={webTokens.spacing.control}>
            {summaryRows.map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {label}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {value}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            {completedSections} de {centerSectionDefinitions.length} apartados tienen
            información registrada.
          </Typography>
          <Grid container spacing={webTokens.spacing.inline}>
            {centerSectionDefinitions.map((section) => (
              <Grid key={section.code} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    border: webTokens.border,
                    borderRadius: `${webTokens.shape.radius}px`,
                    p: webTokens.spacing.inline,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {section.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {sectionValues[section.code]
                      ? "Información registrada"
                      : "Pendiente de completar"}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </FlatSurface>
      <CenterReviewDiff detail={detail} catalogs={catalogs} />
    </Stack>
  );
}
