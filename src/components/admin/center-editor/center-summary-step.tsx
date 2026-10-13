"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import PanToolRounded from "@mui/icons-material/PanToolRounded";
import { Alert, Box, Divider, Grid, Stack, Typography } from "@mui/material";

import { CenterReviewDiff } from "@/components/admin/center-review-diff";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminCatalogs, AdminCenterDetail } from "@/lib/admin-api";
import type { CenterFormValues } from "@/lib/center-form";
import { centerStatusLabel } from "@/lib/admin-labels";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import { findCatalogOption } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

const PENDING = "Pendiente";

function findCatalogName(
  options: ReadonlyArray<{ id: number; name: string }> | undefined,
  id: number | undefined,
) {
  return findCatalogOption(options, id)?.name ?? PENDING;
}

function formatCoordinates(
  latitude: number | string | undefined,
  longitude: number | string | undefined,
) {
  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude === "" ||
    longitude === ""
  ) {
    return PENDING;
  }
  return `${latitude}, ${longitude}`;
}

const filled = (value: string | undefined) => Boolean(value?.trim());

/**
 * Apartados que viven en el formulario principal y se registran al guardar la
 * ficha; se consideran completos en cuanto el formulario tiene su información.
 */
export function sectionsFilledInForm(
  values: CenterFormValues | undefined,
): ReadonlySet<CenterSectionCode> {
  const done = new Set<CenterSectionCode>();
  if (!values) return done;
  if (filled(values.name) && filled(values.subtypeId) && filled(values.parishId)) {
    done.add("identificacion");
  }
  const location = [
    ...Object.values(values.address ?? {}),
    ...Object.values(values.administration ?? {}),
  ];
  if (location.some((value) => filled(value))) done.add("ubicacion-admin");
  if ((values.activityIds ?? []).length > 0) done.add("actividades");
  if (filled(values.description)) done.add("descripcion");
  return done;
}

/** Último paso del asistente: datos principales, avance por apartado y, en revisión, diferencias. */
export function CenterSummaryStep({
  detail,
  catalogs,
  publishesDirectly = false,
  importingSections = [],
  formValues,
}: {
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
  /** El administrador publica sin pasar por revisión. */
  publishesDirectly?: boolean;
  /** Apartados importados que se están guardando: ya cuentan como completos. */
  importingSections?: readonly CenterSectionCode[];
  /** Valores actuales del formulario, aunque todavía no se hayan guardado. */
  formValues?: CenterFormValues;
}) {
  const sendLabel = publishesDirectly ? "publicarla" : "enviarla a revisión";
  const draft = detail?.draft ?? detail?.published ?? null;
  const sectionValues = draft?.sections ?? {};
  const filledInForm = sectionsFilledInForm(formValues);
  const isRegistered = (code: CenterSectionCode) =>
    sectionValues[code] !== undefined ||
    importingSections.includes(code) ||
    filledInForm.has(code);
  const completedSections = centerSectionDefinitions.filter((section) =>
    isRegistered(section.code),
  ).length;
  const missingSections = centerSectionDefinitions.filter(
    (section) => !isRegistered(section.code),
  );
  const state = detail?.status.code;
  const readiness = !detail
    ? {
        severity: "warning" as const,
        message: `La ficha aún no está guardada. Pulsa «Guardar ficha» para crearla; después podrás ${sendLabel}.`,
      }
    : state && state !== "BORRADOR"
      ? {
          severity: "info" as const,
          message: `La ficha está en estado «${centerStatusLabel(detail.status)}»; no hay nada que enviar.`,
        }
      : missingSections.length > 0
        ? {
            severity: "warning" as const,
            message: `Faltan ${missingSections.length} apartado(s) por completar: ${missingSections
              .map((section) => section.title)
              .join(", ")}. Complétalos antes de ${sendLabel}.`,
          }
        : {
            severity: "success" as const,
            message: publishesDirectly
              ? "Todos los apartados tienen información. Pulsa «Publicar» para publicarla."
              : "Todos los apartados tienen información. Pulsa «Enviar a revisión» para que se apruebe y publique.",
          };
  const summaryRows = [
    ["Nombre", draft?.name || formValues?.name?.trim() || PENDING],
    [
      "Subtipo",
      findCatalogName(
        catalogs?.subtypes,
        draft?.subtypeId ?? (Number(formValues?.subtypeId) || undefined),
      ),
    ],
    [
      "Parroquia",
      findCatalogName(
        catalogs?.parishes,
        draft?.parishId ?? (Number(formValues?.parishId) || undefined),
      ),
    ],
    [
      "Coordenadas",
      draft
        ? formatCoordinates(draft.latitude, draft.longitude)
        : formatCoordinates(formValues?.latitude, formValues?.longitude),
    ],
    ["Estado", detail ? centerStatusLabel(detail.status) : "Sin guardar"],
  ];

  return (
    <Stack spacing={webTokens.spacing.section}>
      <Alert severity={readiness.severity}>{readiness.message}</Alert>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
            icon={<FactCheckRounded />}
            title="Resumen de la ficha"
            description={`Revisa los datos principales y el avance de cada apartado antes de ${sendLabel}.`}
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
            {centerSectionDefinitions.map((section) => {
              const registered = isRegistered(section.code);
              return (
                <Grid key={section.code} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={webTokens.spacing.inline}
                    sx={{
                      border: webTokens.border,
                      borderRadius: `${webTokens.shape.radius}px`,
                      p: webTokens.spacing.inline,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {section.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {registered ? "Información registrada" : "Pendiente de completar"}
                      </Typography>
                    </Box>
                    {registered ? (
                      <CheckCircleRounded
                        color="success"
                        titleAccess="Completo"
                        sx={{ flexShrink: 0 }}
                      />
                    ) : (
                      <PanToolRounded
                        color="error"
                        titleAccess="Falta completar"
                        sx={{ flexShrink: 0 }}
                      />
                    )}
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </FlatSurface>
      {state === "EN_REVISION" ? (
        <CenterReviewDiff detail={detail} catalogs={catalogs} />
      ) : null}
    </Stack>
  );
}
