"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import {
  getAdminCenterSections,
  saveAdminCenterSection,
  type AdminCenterDetail,
  type AdminCenterSectionCode,
} from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

export const SECTION_RESPONSE_OPTIONS = [
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
  { value: "SIN_INFORMACION", label: "Sin información" },
  { value: "NO_APLICA", label: "No aplica" },
] as const;

export type SectionResponse = (typeof SECTION_RESPONSE_OPTIONS)[number]["value"];

type SectionDefinition = {
  code: AdminCenterSectionCode;
  title: string;
  description: string;
  coreAnchor?: string;
  suggestedRows: string[];
};

export const centerSectionDefinitions: readonly SectionDefinition[] = [
  {
    code: "identificacion",
    title: "Datos generales y clasificación",
    description: "Nombre, clasificación, territorio y código institucional.",
    coreAnchor: "center-section-identificacion",
    suggestedRows: [],
  },
  {
    code: "ubicacion-admin",
    title: "Ubicación y administración",
    description: "Coordenadas, dirección y responsable institucional.",
    coreAnchor: "center-section-ubicacion-admin",
    suggestedRows: [],
  },
  {
    code: "caracteristicas",
    title: "Características e ingreso",
    description: "Clima, línea de producto, escenario, horarios y tarifas.",
    coreAnchor: "center-section-caracteristicas",
    suggestedRows: [
      "Clima y condiciones habituales",
      "Formas de pago",
      "Meses recomendados",
    ],
  },
  {
    code: "accesibilidad",
    title: "Accesibilidad y conectividad",
    description: "Localidad cercana, vías, transporte, accesibilidad y señalización.",
    coreAnchor: "center-section-accesibilidad",
    suggestedRows: [
      "Localidad cercana",
      "Vía terrestre",
      "Vía acuática",
      "Vía aérea",
      "Accesibilidad detallada",
      "Señalización de aproximación",
    ],
  },
  {
    code: "planta",
    title: "Planta y complementarios",
    description: "Agregados del atractivo, localidad cercana, facilidades y servicios.",
    coreAnchor: "center-section-planta",
    suggestedRows: [
      "Planta turística en el atractivo",
      "Planta turística en la localidad cercana",
      "Facilidades",
      "Servicios complementarios",
    ],
  },
  {
    code: "conservacion",
    title: "Conservación",
    description: "Estado de conservación, alteraciones y declaratorias.",
    suggestedRows: ["Estado de conservación", "Factores de alteración", "Declaratorias"],
  },
  {
    code: "higiene-seguridad",
    title: "Higiene y seguridad",
    description: "Servicios básicos, salud, seguridad, comunicación y contingencia.",
    suggestedRows: [
      "Servicios básicos",
      "Señalética",
      "Servicios de salud",
      "Servicios de seguridad",
      "Comunicación y radios",
      "Amenazas y plan de contingencia",
    ],
  },
  {
    code: "politicas",
    title: "Políticas y regulaciones",
    description: "Políticas institucionales, restricciones y regulaciones aplicables.",
    suggestedRows: [
      "Políticas del atractivo",
      "Regulaciones aplicables",
      "Plan de contingencia",
    ],
  },
  {
    code: "actividades",
    title: "Actividades",
    description: "Actividades compatibles con la categoría y sus condiciones.",
    coreAnchor: "center-section-actividades",
    suggestedRows: [],
  },
  {
    code: "promocion",
    title: "Promoción y comercialización",
    description: "Difusión, comercialización y medios utilizados.",
    suggestedRows: ["Promoción institucional", "Comercialización", "Medios de promoción"],
  },
  {
    code: "visitantes",
    title: "Visitantes y afluencia",
    description: "Temporadas, procedencias, informantes y registros de visitantes.",
    suggestedRows: [
      "Registro de visitantes",
      "Temporadas de visitación",
      "Procedencias",
      "Informantes clave",
      "Afluencia",
    ],
  },
  {
    code: "recurso-humano",
    title: "Recurso humano",
    description: "Personal, formación, idiomas y capacidades disponibles.",
    suggestedRows: ["Resumen de recurso humano", "Formación del personal", "Idiomas"],
  },
  {
    code: "descripcion",
    title: "Descripción",
    description: "Descripción narrativa y observaciones públicas del centro.",
    coreAnchor: "center-section-descripcion",
    suggestedRows: [],
  },
  {
    code: "anexos",
    title: "Anexos y responsabilidades",
    description: "Archivos, responsables, levantamiento y validación del GAD.",
    suggestedRows: [
      "Anexos documentales",
      "Responsables de la ficha",
      "Levantamiento de accesibilidad",
      "Validación del GAD",
    ],
  },
] as const;

type SectionRowForm = {
  label: string;
  response: SectionResponse;
  quantity: string;
  observation: string;
};

type SectionFormValues = {
  response: SectionResponse;
  observation: string;
  rows: SectionRowForm[];
};

type SectionProgress =
  "SIN_INICIAR" | "INCOMPLETA" | "COMPLETA" | "CON_ERRORES" | "NO_APLICA";

const EMPTY_RESPONSE: SectionResponse = "SIN_INFORMACION";

export function CenterSectionWorkflow({
  token,
  code,
  detail,
  canEdit,
  onDetailChanged,
  onNotice,
  onError,
  onOpenCoreSection,
}: {
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  canEdit: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
  onOpenCoreSection: (anchor: string) => void;
}) {
  const [activeCode, setActiveCode] = useState<AdminCenterSectionCode>(
    centerSectionDefinitions[0].code,
  );
  const [working, setWorking] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<
    Partial<Record<AdminCenterSectionCode, SectionFormValues>>
  >({});
  const queryClient = useQueryClient();
  const sectionsQuery = useQuery({
    queryKey: ["admin", "center", code, "sections"],
    queryFn: () => getAdminCenterSections(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 10_000,
  });
  const sectionData = sectionsQuery.data;
  const sections = useMemo(
    () => sectionData?.sections ?? detail?.draft?.sections ?? {},
    [detail?.draft?.sections, sectionData?.sections],
  );
  const definition =
    centerSectionDefinitions.find((item) => item.code === activeCode) ??
    centerSectionDefinitions[0];
  const coreCompletion = useMemo(() => getCoreCompletion(detail), [detail]);
  const serverProgress = useMemo(
    () => new Map((sectionData?.progress ?? []).map((item) => [item.code, item.status])),
    [sectionData?.progress],
  );
  const progress = useMemo(
    () =>
      centerSectionDefinitions.filter(
        (item) =>
          getProgress(
            item,
            sections[item.code],
            coreCompletion[item.code],
            serverProgress.get(item.code),
          ) !== "SIN_INICIAR",
      ).length,
    [coreCompletion, sections, serverProgress],
  );

  const form = useForm<SectionFormValues>({
    defaultValues: createSectionValues(definition),
    mode: "onBlur",
  });
  const { control, register, reset, handleSubmit, getValues, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "rows" });
  const activeLocalDraft = localDrafts[definition.code];

  useEffect(() => {
    reset(activeLocalDraft ?? createSectionValues(definition, sections[definition.code]));
    onError(null);
  }, [activeLocalDraft, definition, onError, reset, sections]);

  function selectSection(nextCode: AdminCenterSectionCode) {
    if (nextCode === activeCode) return;
    setLocalDrafts((current) => ({ ...current, [activeCode]: getValues() }));
    setActiveCode(nextCode);
  }

  async function saveSection(values: SectionFormValues) {
    if (!code) {
      onError("Guarda primero los campos núcleo para obtener el código de la ficha.");
      return;
    }
    setWorking(true);
    onError(null);
    try {
      const content = toSectionContent(values);
      const saved = await saveAdminCenterSection(
        token,
        code,
        definition.code,
        content,
        detail?.version,
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "center", code, "sections"],
      });
      setLocalDrafts((current) => {
        const next = { ...current };
        delete next[definition.code];
        return next;
      });
      onDetailChanged(saved);
      onNotice(`Sección «${definition.title}» guardada.`);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "No se pudo guardar la sección.");
    } finally {
      setWorking(false);
    }
  }

  if (code && sectionsQuery.isLoading) {
    return <ContentState status="loading" label="Cargando secciones de la ficha" />;
  }

  const sectionsError = sectionsQuery.error;
  if (sectionsError) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            type="button"
            color="inherit"
            size="small"
            onClick={() => void sectionsQuery.refetch()}
          >
            Reintentar
          </Button>
        }
      >
        {sectionsError instanceof Error
          ? sectionsError.message
          : "No se pudieron cargar las secciones de la ficha."}
      </Alert>
    );
  }

  return (
    <FlatSurface
      padding="default"
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          (event.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          event.preventDefault();
        }
      }}
    >
      <Stack spacing={webTokens.spacing.section}>
        <SectionHeader
          icon={<FactCheckRounded />}
          title="Ficha integral por secciones"
          description="Registra cada apartado de la ficha sin crear centros derivados. Las secciones se guardan como un borrador versionado."
        />
        <InstitutionalCodeCard code={detail?.code ?? null} />
        {!code ? (
          <Alert severity="info">
            Completa y guarda primero los datos generales. Después podrás capturar las 14
            secciones y conservar el avance aunque la ficha todavía no se publique.
          </Alert>
        ) : null}
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Typography variant="body2" color="text.secondary">
              Progreso de captura: {progress} de {centerSectionDefinitions.length}{" "}
              secciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round((progress / centerSectionDefinitions.length) * 100)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(progress / centerSectionDefinitions.length) * 100}
            aria-label="Progreso de la ficha integral"
          />
        </Stack>
        <Grid container spacing={webTokens.spacing.section}>
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Stack
              component="nav"
              aria-label="Secciones de la ficha turística"
              spacing={0.5}
            >
              {centerSectionDefinitions.map((item, index) => {
                const status = getProgress(
                  item,
                  sections[item.code],
                  coreCompletion[item.code],
                  serverProgress.get(item.code),
                );
                const selected = item.code === activeCode;
                return (
                  <Button
                    key={item.code}
                    type="button"
                    variant={selected ? "contained" : "text"}
                    color={selected ? "primary" : "inherit"}
                    onClick={() => selectSection(item.code)}
                    aria-current={selected ? "step" : undefined}
                    sx={{
                      justifyContent: "space-between",
                      textAlign: "left",
                      minHeight: 44,
                      px: 1.5,
                      color: selected ? undefined : "text.primary",
                    }}
                  >
                    <Box component="span" sx={{ minWidth: 0, mr: 1 }}>
                      <Typography component="span" variant="body2" fontWeight={600}>
                        {index + 1}. {item.title}
                      </Typography>
                    </Box>
                    <SectionStatusChip status={status} />
                  </Button>
                );
              })}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Stack spacing={webTokens.spacing.control}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={2}
              >
                <Box>
                  <Typography variant="h6">{definition.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {definition.description}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={0.5}>
                  <SectionStatusChip
                    status={getProgress(
                      definition,
                      sections[definition.code],
                      coreCompletion[definition.code],
                      serverProgress.get(definition.code),
                    )}
                  />
                  {formState.isDirty || activeLocalDraft ? (
                    <Chip size="small" color="warning" label="Cambios sin guardar" />
                  ) : null}
                </Stack>
              </Stack>
              {definition.coreAnchor ? (
                <Alert
                  severity="info"
                  action={
                    <Button
                      type="button"
                      color="inherit"
                      size="small"
                      onClick={() => onOpenCoreSection(definition.coreAnchor as string)}
                    >
                      Ir al formulario núcleo
                    </Button>
                  }
                >
                  Esta sección reutiliza campos normalizados del formulario principal. Sus
                  respuestas detalladas y observaciones adicionales se guardan aquí.
                </Alert>
              ) : null}
              <Divider />
              <Stack spacing={webTokens.spacing.control}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id="section-response-label">
                    Resultado de la sección
                  </InputLabel>
                  <Select
                    labelId="section-response-label"
                    label="Resultado de la sección"
                    defaultValue={EMPTY_RESPONSE}
                    {...register("response")}
                  >
                    {SECTION_RESPONSE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Observación general del apartado"
                  multiline
                  minRows={3}
                  fullWidth
                  disabled={!canEdit}
                  {...register("observation", {
                    maxLength: { value: 2_000, message: "Máximo 2.000 caracteres" },
                  })}
                  error={Boolean(formState.errors.observation)}
                  helperText={formState.errors.observation?.message}
                />
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={2}
                  >
                    <Box>
                      <Typography variant="subtitle1">Filas repetibles</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conserva el resultado, la cantidad y la observación de cada
                        elemento. Cero y dato desconocido no significan lo mismo.
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      startIcon={<AddRounded />}
                      disabled={!canEdit}
                      onClick={() =>
                        append({
                          label: "",
                          response: EMPTY_RESPONSE,
                          quantity: "",
                          observation: "",
                        })
                      }
                    >
                      Añadir fila
                    </Button>
                  </Stack>
                  {fields.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No hay filas añadidas. Usa «Añadir fila» para registrar un detalle.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {fields.map((field, index) => (
                        <FlatSurface key={field.id} padding="compact" tone="subtle">
                          <Grid
                            container
                            spacing={webTokens.spacing.control}
                            alignItems="flex-start"
                          >
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                label="Elemento o indicador"
                                fullWidth
                                disabled={!canEdit}
                                {...register(`rows.${index}.label`, {
                                  required: "Indica el elemento o indicador",
                                  maxLength: {
                                    value: 180,
                                    message: "Máximo 180 caracteres",
                                  },
                                })}
                                error={Boolean(formState.errors.rows?.[index]?.label)}
                                helperText={
                                  formState.errors.rows?.[index]?.label?.message
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <FormControl fullWidth disabled={!canEdit}>
                                <InputLabel id={`row-response-${index}`}>
                                  Respuesta
                                </InputLabel>
                                <Select
                                  labelId={`row-response-${index}`}
                                  label="Respuesta"
                                  defaultValue={EMPTY_RESPONSE}
                                  {...register(`rows.${index}.response`)}
                                >
                                  {SECTION_RESPONSE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                              <TextField
                                label="Cantidad"
                                type="number"
                                fullWidth
                                disabled={!canEdit}
                                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                                {...register(`rows.${index}.quantity`, {
                                  validate: (value) =>
                                    !value.trim() ||
                                    (Number.isInteger(Number(value)) &&
                                      Number(value) >= 0)
                                      ? true
                                      : "Usa un entero igual o mayor que cero",
                                })}
                                error={Boolean(formState.errors.rows?.[index]?.quantity)}
                                helperText={
                                  formState.errors.rows?.[index]?.quantity?.message
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                              <Tooltip title="Eliminar fila">
                                <IconButton
                                  type="button"
                                  aria-label={`Eliminar fila ${index + 1}`}
                                  disabled={!canEdit}
                                  onClick={() => remove(index)}
                                  sx={{ mt: { md: 1 } }}
                                >
                                  <DeleteOutlineRounded />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid size={12}>
                              <TextField
                                label="Observación de la fila"
                                fullWidth
                                multiline
                                minRows={2}
                                disabled={!canEdit}
                                {...register(`rows.${index}.observation`, {
                                  maxLength: {
                                    value: 1_000,
                                    message: "Máximo 1.000 caracteres",
                                  },
                                })}
                                error={Boolean(
                                  formState.errors.rows?.[index]?.observation,
                                )}
                                helperText={
                                  formState.errors.rows?.[index]?.observation?.message
                                }
                              />
                            </Grid>
                          </Grid>
                        </FlatSurface>
                      ))}
                    </Stack>
                  )}
                </Stack>
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<SaveRounded />}
                    disabled={!code || !canEdit || working}
                    onClick={() => void handleSubmit(saveSection)()}
                  >
                    {working ? "Guardando…" : "Guardar sección"}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </FlatSurface>
  );
}

function InstitutionalCodeCard({ code }: { code: string | null }) {
  const normalized = code?.replace(/\s/g, "") ?? "";
  const parts =
    normalized.length === 17
      ? [
          ["PP", normalized.slice(0, 2)],
          ["CC", normalized.slice(2, 4)],
          ["QQ", normalized.slice(4, 6)],
          ["CA", normalized.slice(6, 8)],
          ["TI", normalized.slice(8, 10)],
          ["ST", normalized.slice(10, 12)],
          ["JE", normalized.slice(12, 14)],
          ["NNN", normalized.slice(14)],
        ]
      : [];
  return (
    <FlatSurface padding="compact" tone="subtle">
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Box>
            <Typography variant="subtitle1">Código institucional</Typography>
            <Typography variant="body2" color="text.secondary">
              Lo genera el servidor a partir del territorio, clasificación, valoración y
              secuencial.
            </Typography>
          </Box>
          <Typography variant="h6" component="code" sx={{ letterSpacing: 1 }}>
            {normalized || "Pendiente"}
          </Typography>
        </Stack>
        {parts.length > 0 ? (
          <Grid container spacing={1} aria-label="Partes del código institucional">
            {parts.map(([label, value]) => (
              <Grid key={label} size={{ xs: 6, sm: 3, md: 1.5 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} component="code">
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Stack>
    </FlatSurface>
  );
}

function SectionStatusChip({ status }: { status: SectionProgress }) {
  if (status === "COMPLETA")
    return <Chip size="small" color="success" label="Completa" />;
  if (status === "NO_APLICA") return <Chip size="small" color="info" label="No aplica" />;
  if (status === "INCOMPLETA")
    return <Chip size="small" color="warning" label="Incompleta" />;
  if (status === "CON_ERRORES")
    return <Chip size="small" color="error" label="Con errores" />;
  return <Chip size="small" variant="outlined" label="Sin iniciar" />;
}

function getProgress(
  definition: SectionDefinition,
  raw: unknown,
  coreComplete: boolean | undefined,
  serverStatus?: SectionProgress,
): SectionProgress {
  if (serverStatus && serverStatus !== "SIN_INICIAR") return serverStatus;
  if (isRecord(raw) && isSectionResponse(raw.response)) {
    return raw.response === "NO_APLICA" ? "NO_APLICA" : "COMPLETA";
  }
  if (definition.coreAnchor && coreComplete) return "COMPLETA";
  return "SIN_INICIAR";
}

function getCoreCompletion(
  detail: AdminCenterDetail | null,
): Partial<Record<AdminCenterSectionCode, boolean>> {
  const draft = detail?.draft ?? detail?.published;
  if (!draft) return {};
  const hasCoreClassification = Boolean(
    draft.name &&
    draft.subtypeId &&
    draft.touristZoneId &&
    draft.parishId &&
    draft.productLineId &&
    draft.scenarioId,
  );
  return {
    identificacion: hasCoreClassification,
    "ubicacion-admin":
      Number.isFinite(draft.latitude) && Number.isFinite(draft.longitude),
    caracteristicas: Boolean(draft.productLineId && draft.scenarioId),
    accesibilidad: Array.isArray(draft.accessibility),
    planta: Array.isArray(draft.facilities),
    actividades: Array.isArray(draft.activities),
    descripcion: Boolean(draft.description?.trim()),
  };
}

function createSectionValues(
  definition: SectionDefinition,
  raw?: unknown,
): SectionFormValues {
  const record = isRecord(raw) ? raw : null;
  const rawRows = record && Array.isArray(record.rows) ? record.rows : null;
  const rows = rawRows
    ? rawRows.map((row) => toRowForm(row))
    : definition.suggestedRows.map((label) => ({
        label,
        response: EMPTY_RESPONSE,
        quantity: "",
        observation: "",
      }));
  return {
    response:
      record && isSectionResponse(record.response) ? record.response : EMPTY_RESPONSE,
    observation: typeof record?.observation === "string" ? record.observation : "",
    rows,
  };
}

function toSectionContent(values: SectionFormValues) {
  return {
    schemaVersion: 1,
    response: values.response,
    observation: values.observation.trim(),
    rows: values.rows.map((row) => ({
      label: row.label.trim(),
      response: row.response,
      quantity: row.quantity.trim() === "" ? null : Number(row.quantity),
      observation: row.observation.trim(),
    })),
  };
}

function toRowForm(raw: unknown): SectionRowForm {
  const row = isRecord(raw) ? raw : {};
  const response = isSectionResponse(row.response) ? row.response : EMPTY_RESPONSE;
  const quantity =
    typeof row.quantity === "number" && Number.isFinite(row.quantity)
      ? String(row.quantity)
      : typeof row.quantity === "string"
        ? row.quantity
        : "";
  return {
    label: typeof row.label === "string" ? row.label : "",
    response,
    quantity,
    observation: typeof row.observation === "string" ? row.observation : "",
  };
}

function isSectionResponse(value: unknown): value is SectionResponse {
  return SECTION_RESPONSE_OPTIONS.some((option) => option.value === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
