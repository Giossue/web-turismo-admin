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
import { webTokens } from "@/theme/tokens";

type DiffStatus = "ADDED" | "MODIFIED" | "REMOVED" | "UNCHANGED";

type ReviewSection = {
  code: string;
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

const REVIEW_SECTIONS: readonly ReviewSection[] = [
  {
    code: "identificacion",
    title: "Datos generales y clasificación",
    getSnapshot: (draft) => ({
      name: draft.name,
      subtypeId: draft.subtypeId,
      touristZoneId: draft.touristZoneId,
      parishId: draft.parishId,
      productLineId: draft.productLineId,
      scenarioId: draft.scenarioId,
      hierarchyId: draft.hierarchyId,
      details: draft.sections?.identificacion,
    }),
  },
  {
    code: "ubicacion-admin",
    title: "Ubicación y administración",
    getSnapshot: (draft) => ({
      latitude: draft.latitude,
      longitude: draft.longitude,
      altitudeMeters: draft.altitudeMeters,
      address: draft.address,
      administration: draft.administration,
      details: draft.sections?.["ubicacion-admin"],
    }),
  },
  {
    code: "caracteristicas",
    title: "Características e ingreso",
    getSnapshot: (draft) => ({
      climate: draft.climate,
      admission: draft.admission,
      details: draft.sections?.caracteristicas,
    }),
  },
  {
    code: "accesibilidad",
    title: "Accesibilidad y conectividad",
    getSnapshot: (draft) => ({
      accessibility: draft.accessibility,
      details: draft.sections?.accesibilidad,
    }),
  },
  {
    code: "planta",
    title: "Planta y complementarios",
    getSnapshot: (draft) => ({
      facilities: draft.facilities,
      details: draft.sections?.planta,
    }),
  },
  {
    code: "conservacion",
    title: "Conservación",
    getSnapshot: (draft) => draft.sections?.conservacion,
  },
  {
    code: "higiene-seguridad",
    title: "Higiene y seguridad",
    getSnapshot: (draft) => draft.sections?.["higiene-seguridad"],
  },
  {
    code: "politicas",
    title: "Políticas y regulaciones",
    getSnapshot: (draft) => draft.sections?.politicas,
  },
  {
    code: "actividades",
    title: "Actividades",
    getSnapshot: (draft) => ({
      activities: draft.activities,
      details: draft.sections?.actividades,
    }),
  },
  {
    code: "promocion",
    title: "Promoción y comercialización",
    getSnapshot: (draft) => draft.sections?.promocion,
  },
  {
    code: "visitantes",
    title: "Visitantes y afluencia",
    getSnapshot: (draft) => draft.sections?.visitantes,
  },
  {
    code: "recurso-humano",
    title: "Recurso humano",
    getSnapshot: (draft) => draft.sections?.["recurso-humano"],
  },
  {
    code: "descripcion",
    title: "Descripción",
    getSnapshot: (draft) => ({
      description: draft.description,
      details: draft.sections?.descripcion,
    }),
  },
  {
    code: "anexos",
    title: "Anexos y responsabilidades",
    getSnapshot: (draft) => draft.sections?.anexos,
  },
] as const;

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
    const option = findCatalogOption(path, value, catalogs);
    if (option) return option.code ? `${option.name} (${option.code})` : option.name;
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "Sin elementos" : `${value.length} elementos`;
  }
  if (isRecord(value)) return "Bloque sin detalle";
  return String(value);
}

function findCatalogOption(
  path: string,
  value: number,
  catalogs: AdminCatalogs | null,
): CatalogOption | undefined {
  if (!catalogs) return undefined;
  const key = path
    .split(".")
    .at(-1)
    ?.replace(/\[\d+\]$/, "");
  if (key === "subtypeId") return catalogs.subtypes.find((item) => item.id === value);
  if (key === "touristZoneId") return catalogs.zones.find((item) => item.id === value);
  if (key === "parishId") return catalogs.parishes.find((item) => item.id === value);
  if (key === "productLineId") return catalogs.lines.find((item) => item.id === value);
  if (key === "scenarioId") return catalogs.scenarios.find((item) => item.id === value);
  if (key === "hierarchyId")
    return catalogs.hierarchies.find((item) => item.id === value);
  if (key === "localityId") return catalogs.localities.find((item) => item.id === value);
  if (key === "climateId") return catalogs.climates.find((item) => item.id === value);
  if (key === "activityId") return catalogs.activities.find((item) => item.id === value);
  if (key === "accessibilityTypeId") {
    return catalogs.accessibilityTypes.find((item) => item.id === value);
  }
  if (key === "criterionId") {
    return catalogs.accessibilityCriteria.find((item) => item.id === value);
  }
  if (key === "roadTypeId") return catalogs.roadTypes.find((item) => item.id === value);
  if (key === "materialId") {
    return catalogs.roadMaterials.find((item) => item.id === value);
  }
  if (key === "conditionId") {
    return catalogs.conditionStates.find((item) => item.id === value);
  }
  if (key === "modalityId") {
    return catalogs.aquaticAccessModes.find((item) => item.id === value);
  }
  if (key === "coverageId") {
    return catalogs.aerialAccessCoverages.find((item) => item.id === value);
  }
  if (key === "frequencyId") {
    return catalogs.serviceFrequencies.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("plant")) {
    return catalogs.plantTypes.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("complementaryServices")) {
    return catalogs.complementaryServiceTypes.find((item) => item.id === value);
  }
  if (key === "categoryId" && path.includes("facilityDetails")) {
    return catalogs.facilityCategories.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("facilityDetails")) {
    return catalogs.facilities.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("transportTypes")) {
    return catalogs.transportTypes.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("accessibility")) {
    return catalogs.accessibilityTypes.find((item) => item.id === value);
  }
  if (key === "typeId" && path.includes("facilit")) {
    return catalogs.facilities.find((item) => item.id === value);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
