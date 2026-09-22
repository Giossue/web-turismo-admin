"use client";

import DifferenceRounded from "@mui/icons-material/DifferenceRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import {
  type AdminCatalogs,
  type AdminCenterDetail,
  type CatalogOption,
  type CenterDraft,
} from "@/lib/admin-api";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import { findCatalogOption, isRecord } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

type DiffStatus = "ADDED" | "MODIFIED" | "REMOVED" | "UNCHANGED";

type ReviewSection = {
  code: CenterSectionCode;
  title: string;
  getSnapshot: (draft: CenterDraft) => unknown;
};

type ScalarChange = {
  path: string;
  before: unknown;
  after: unknown;
};

type SectionDiff = ReviewSection & {
  status: DiffStatus;
  changes: ScalarChange[];
};

/** Parte del borrador que se compara en cada apartado de la ficha. */
const SECTION_SNAPSHOTS: Record<CenterSectionCode, (draft: CenterDraft) => unknown> = {
  identificacion: (draft) => ({
    name: draft.name,
    subtypeId: draft.subtypeId,
    touristZoneId: draft.touristZoneId,
    parishId: draft.parishId,
    productLineId: draft.productLineId,
    scenarioId: draft.scenarioId,
    hierarchyId: draft.hierarchyId,
    details: draft.sections?.identificacion,
  }),
  "ubicacion-admin": (draft) => ({
    latitude: draft.latitude,
    longitude: draft.longitude,
    altitudeMeters: draft.altitudeMeters,
    address: draft.address,
    administration: draft.administration,
    details: draft.sections?.["ubicacion-admin"],
  }),
  caracteristicas: (draft) => ({
    climate: draft.climate,
    admission: draft.admission,
    details: draft.sections?.caracteristicas,
  }),
  accesibilidad: (draft) => ({
    accessibility: draft.accessibility,
    details: draft.sections?.accesibilidad,
  }),
  planta: (draft) => ({
    facilities: draft.facilities,
    details: draft.sections?.planta,
  }),
  conservacion: (draft) => draft.sections?.conservacion,
  "higiene-seguridad": (draft) => draft.sections?.["higiene-seguridad"],
  politicas: (draft) => draft.sections?.politicas,
  actividades: (draft) => ({
    activities: draft.activities,
    details: draft.sections?.actividades,
  }),
  promocion: (draft) => draft.sections?.promocion,
  visitantes: (draft) => draft.sections?.visitantes,
  "recurso-humano": (draft) => draft.sections?.["recurso-humano"],
  descripcion: (draft) => ({
    description: draft.description,
    details: draft.sections?.descripcion,
  }),
  anexos: (draft) => draft.sections?.anexos,
};

const REVIEW_SECTIONS: readonly ReviewSection[] = centerSectionDefinitions.map(
  (section) => ({
    code: section.code,
    title: section.title,
    getSnapshot: SECTION_SNAPSHOTS[section.code],
  }),
);

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  subtypeId: "Subtipo",
  touristZoneId: "Zona turística",
  parishId: "Parroquia",
  productLineId: "Línea de producto",
  scenarioId: "Escenario",
  hierarchyId: "Jerarquía calculada",
  latitude: "Latitud",
  longitude: "Longitud",
  altitudeMeters: "Altitud (msnm)",
  address: "Dirección",
  administration: "Administración",
  climate: "Clima",
  admission: "Ingreso y atención",
  accessibility: "Accesibilidad",
  facilities: "Facilidades",
  activities: "Actividades",
  description: "Descripción",
  details: "Detalle de la sección",
  response: "Resultado",
  observation: "Observación",
  rows: "Filas repetibles",
  label: "Elemento",
  quantity: "Cantidad",
  localityId: "Localidad cercana",
  distanceKm: "Distancia (km)",
  climateId: "Tipo de clima",
  minTemperature: "Temperatura mínima (°C)",
  maxTemperature: "Temperatura máxima (°C)",
  minRainfall: "Precipitación mínima (mm)",
  maxRainfall: "Precipitación máxima (mm)",
  activityId: "Actividad",
  typeId: "Tipo",
  applies: "Aplica",
  active: "Activo",
  detailOther: "Detalle",
  accessibilityDetails: "Detalle de accesibilidad y conectividad",
  accessibilityTypeId: "Tipo de accesibilidad",
  criterionId: "Criterio de accesibilidad",
  roadTypeId: "Tipo de vía terrestre",
  materialId: "Material de vía",
  conditionId: "Estado",
  modalityId: "Modalidad acuática",
  coverageId: "Cobertura aérea",
  frequencyId: "Frecuencia de transporte",
  transportDetails: "Operadores de transporte",
  transportTypes: "Tipos de transporte",
  roads: "Vías terrestres",
  aquatic: "Accesos acuáticos",
  aerial: "Accesos aéreos",
  criteria: "Criterios de accesibilidad",
  signage: "Señalización de aproximación",
  plant: "Planta turística",
  facilityDetails: "Facilidades en el entorno",
  complementaryServices: "Servicios complementarios",
  plantTypes: "Tipos de planta",
  typeLabel: "Descripción manual",
  quantity1: "Cantidad 1",
  quantity2: "Cantidad 2",
  quantity3: "Cantidad 3",
  categoryId: "Categoría",
  administrator: "Administrador",
  universalAccessibility: "Accesibilidad universal",
  specification: "Especificación",
};

const SECTION_STATUS_LABELS: Record<DiffStatus, string> = {
  ADDED: "Agregado",
  MODIFIED: "Modificado",
  REMOVED: "Retirado",
  UNCHANGED: "Sin cambios",
};

export function CenterReviewDiff({
  detail,
  catalogs,
}: {
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
}) {
  const proposed = detail?.draft;
  if (!proposed || !detail) return null;

  const published = detail.published;
  const diffs = REVIEW_SECTIONS.map((section) =>
    buildSectionDiff(section, published, proposed),
  );
  const changed = diffs.filter((section) => section.status !== "UNCHANGED");

  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.section}>
        <SectionHeader
          icon={<DifferenceRounded />}
          title="Revisión por diferencias"
          description="Compara la versión publicada con la propuesta actual antes de aprobar o publicar la ficha. Los valores mostrados se resuelven con los catálogos administrativos."
        />
        <Alert severity={changed.length > 0 ? "info" : "success"}>
          {changed.length > 0
            ? `${changed.length} de ${diffs.length} secciones tienen cambios pendientes.`
            : "La propuesta no tiene diferencias frente a la versión publicada."}
        </Alert>
        <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
          {diffs.map((section) => (
            <Chip
              key={section.code}
              size="small"
              variant={section.status === "UNCHANGED" ? "outlined" : "filled"}
              color={statusColor(section.status)}
              label={`${section.title}: ${SECTION_STATUS_LABELS[section.status]}`}
            />
          ))}
        </Stack>
        <Stack spacing={1}>
          {diffs
            .filter((section) => section.status !== "UNCHANGED")
            .map((section) => (
              <Accordion
                key={section.code}
                defaultExpanded={changed[0]?.code === section.code}
                disableGutters
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  "&:before": { display: "none" },
                  overflow: "hidden",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={{ xs: 0.5, sm: 1 }}
                  >
                    <Typography fontWeight={700}>{section.title}</Typography>
                    <Chip
                      size="small"
                      color={statusColor(section.status)}
                      label={SECTION_STATUS_LABELS[section.status]}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {section.changes.map((change) => (
                      <Box key={change.path}>
                        <Typography variant="body2" fontWeight={700} gutterBottom>
                          {formatPath(change.path)}
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <DiffValue
                              label="Publicado"
                              value={change.before}
                              catalogs={catalogs}
                              path={change.path}
                              tone="before"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <DiffValue
                              label="Propuesto"
                              value={change.after}
                              catalogs={catalogs}
                              path={change.path}
                              tone="after"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
        </Stack>
        {changed.length === 0 ? <Divider /> : null}
      </Stack>
    </FlatSurface>
  );
}

function DiffValue({
  label,
  value,
  catalogs,
  path,
  tone,
}: {
  label: string;
  value: unknown;
  catalogs: AdminCatalogs | null;
  path: string;
  tone: "before" | "after";
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: tone === "after" ? "primary.light" : "divider",
        bgcolor: tone === "after" ? "primary.50" : "background.default",
        borderRadius: 1,
        p: 1.25,
        minHeight: 54,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {formatValue(value, path, catalogs)}
      </Typography>
    </Box>
  );
}

function buildSectionDiff(
  section: ReviewSection,
  published: CenterDraft,
  proposed: CenterDraft,
): SectionDiff {
  const before = flattenSnapshot(normalize(section.getSnapshot(published)));
  const after = flattenSnapshot(normalize(section.getSnapshot(proposed)));
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: ScalarChange[] = [];

  for (const path of paths) {
    if (!areEqual(before[path], after[path])) {
      changes.push({ path, before: before[path], after: after[path] });
    }
  }

  changes.sort((left, right) => left.path.localeCompare(right.path));
  const beforeHasValue = Object.keys(before).length > 0;
  const afterHasValue = Object.keys(after).length > 0;
  let status: DiffStatus = "UNCHANGED";
  if (beforeHasValue !== afterHasValue) {
    status = afterHasValue ? "ADDED" : "REMOVED";
  } else if (changes.length > 0) {
    status = "MODIFIED";
  }

  return { ...section, status, changes };
}

function normalize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

function flattenSnapshot(value: unknown, prefix = ""): Record<string, unknown> {
  if (Array.isArray(value)) {
    if (value.length === 0) return { [prefix || "valor"]: value };
    return Object.assign(
      {},
      ...value.map((item, index) => flattenSnapshot(item, `${prefix}[${index + 1}]`)),
    );
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return { [prefix || "valor"]: value };
    return Object.assign(
      {},
      ...entries.map(([key, item]) =>
        flattenSnapshot(item, prefix ? `${prefix}.${key}` : key),
      ),
    );
  }
  return { [prefix || "valor"]: value };
}

function areEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatPath(path: string) {
  return path
    .split(".")
    .map((segment) => {
      const match = segment.match(/^(.*)\[(\d+)\]$/);
      if (!match) return FIELD_LABELS[segment] ?? humanize(segment);
      const label = FIELD_LABELS[match[1]] ?? humanize(match[1]);
      return `${label} ${match[2]}`;
    })
    .join(" · ");
}

function formatValue(value: unknown, path: string, catalogs: AdminCatalogs | null) {
  if (value === undefined) return "Sin dato en esta versión";
  if (value === null) return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") return value || "Texto vacío";
  if (typeof value === "number") {
    const option = resolveCatalogOption(path, value, catalogs);
    if (option) return option.code ? `${option.name} (${option.code})` : option.name;
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "Sin elementos" : `${value.length} elementos`;
  }
  if (isRecord(value)) return "Bloque sin detalle";
  return String(value);
}

function resolveCatalogOption(
  path: string,
  value: number,
  catalogs: AdminCatalogs | null,
): CatalogOption | undefined {
  if (!catalogs) return undefined;
  const key = path
    .split(".")
    .at(-1)
    ?.replace(/\[\d+\]$/, "");
  if (key === "subtypeId") return findCatalogOption(catalogs.subtypes, value);
  if (key === "touristZoneId") return findCatalogOption(catalogs.zones, value);
  if (key === "parishId") return findCatalogOption(catalogs.parishes, value);
  if (key === "productLineId") return findCatalogOption(catalogs.lines, value);
  if (key === "scenarioId") return findCatalogOption(catalogs.scenarios, value);
  if (key === "hierarchyId") return findCatalogOption(catalogs.hierarchies, value);
  if (key === "localityId") return findCatalogOption(catalogs.localities, value);
  if (key === "climateId") return findCatalogOption(catalogs.climates, value);
  if (key === "activityId") return findCatalogOption(catalogs.activities, value);
  if (key === "accessibilityTypeId") {
    return findCatalogOption(catalogs.accessibilityTypes, value);
  }
  if (key === "criterionId") {
    return findCatalogOption(catalogs.accessibilityCriteria, value);
  }
  if (key === "roadTypeId") return findCatalogOption(catalogs.roadTypes, value);
  if (key === "materialId") {
    return findCatalogOption(catalogs.roadMaterials, value);
  }
  if (key === "conditionId") {
    return findCatalogOption(catalogs.conditionStates, value);
  }
  if (key === "modalityId") {
    return findCatalogOption(catalogs.aquaticAccessModes, value);
  }
  if (key === "coverageId") {
    return findCatalogOption(catalogs.aerialAccessCoverages, value);
  }
  if (key === "frequencyId") {
    return findCatalogOption(catalogs.serviceFrequencies, value);
  }
  if (key === "typeId" && path.includes("plant")) {
    return findCatalogOption(catalogs.plantTypes, value);
  }
  if (key === "typeId" && path.includes("complementaryServices")) {
    return findCatalogOption(catalogs.complementaryServiceTypes, value);
  }
  if (key === "categoryId" && path.includes("facilityDetails")) {
    return findCatalogOption(catalogs.facilityCategories, value);
  }
  if (key === "typeId" && path.includes("facilityDetails")) {
    return findCatalogOption(catalogs.facilities, value);
  }
  if (key === "typeId" && path.includes("transportTypes")) {
    return findCatalogOption(catalogs.transportTypes, value);
  }
  if (key === "typeId" && path.includes("accessibility")) {
    return findCatalogOption(catalogs.accessibilityTypes, value);
  }
  if (key === "typeId" && path.includes("facilit")) {
    return findCatalogOption(catalogs.facilities, value);
  }
  return undefined;
}

function statusColor(status: DiffStatus): "success" | "info" | "warning" | "error" {
  if (status === "ADDED") return "success";
  if (status === "REMOVED") return "error";
  if (status === "MODIFIED") return "warning";
  return "info";
}

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}
