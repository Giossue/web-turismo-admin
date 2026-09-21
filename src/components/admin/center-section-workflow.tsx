"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import {
  Alert,
  Box,
  Button,
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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormReturn,
} from "react-hook-form";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import {
  getAdminCenterSections,
  getAdminCenterValuation,
  getAdminCenterMedia,
  saveAdminCenterSection,
  type AdminCenterDetail,
  type AdminCenterSectionCode,
  type AdminCatalogs,
  type AdminCenterValuation,
  type AdminMediaItem,
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
    suggestedRows: [],
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

type AccessibilityRoadForm = {
  roadTypeId: string;
  typeLabel: string;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
  distanceKm: string;
  materialId: string;
  conditionId: string;
  observation: string;
};

type AccessibilityAquaticForm = {
  modalityId: string;
  modalityLabel: string;
  departure: string;
  departureConditionId: string;
  arrival: string;
  arrivalConditionId: string;
  observation: string;
};

type AccessibilityAerialForm = {
  coverageId: string;
  coverageLabel: string;
  observation: string;
};

type AccessibilityTransportTypeForm = {
  typeId: string;
  label: string;
  applies: "SI" | "NO";
  detailOther: string;
  observation: string;
};

type AccessibilityTransportDetailForm = {
  operator: string;
  terminal: string;
  frequencyId: string;
  frequencyLabel: string;
  transferDetail: string;
  observation: string;
};

type AccessibilityCriterionForm = {
  accessibilityTypeId: string;
  criterionId: string;
  label: string;
  response: SectionResponse;
  detail: string;
  observation: string;
};

type AccessibilitySignageForm = {
  available: SectionResponse;
  conditionId: string;
  observation: string;
};

type PlantForm = {
  scope: "EN_ATRACTIVO" | "EN_POBLADO_CERCANO";
  typeId: string;
  typeLabel: string;
  group: string;
  quantity1: string;
  quantity2: string;
  quantity3: string;
  observation: string;
};

type FacilityDetailForm = {
  categoryId: string;
  typeId: string;
  typeLabel: string;
  quantity: string;
  latitude: string;
  longitude: string;
  administrator: string;
  universalAccessibility: SectionResponse;
  conditionId: string;
  detailOther: string;
  observation: string;
};

type ComplementaryServiceForm = {
  scope: "EN_ATRACTIVO" | "EN_POBLADO_CERCANO";
  typeId: string;
  typeLabel: string;
  specification: string;
  observation: string;
};

type ConservationComponentForm = {
  state: string;
  observation: string;
};

type ConservationFactorForm = {
  component: "ATRACTIVO" | "ENTORNO";
  factorId: string;
  origin: "NATURAL" | "ANTROPICO";
  name: string;
  response: SectionResponse;
  detailOther: string;
  observation: string;
};

type ConservationDeclarationForm = {
  entity: string;
  denomination: string;
  date: string;
  scope: string;
  observation: string;
};

type HygieneEntryKind =
  "BASIC_SERVICE" | "SIGNAGE" | "HEALTH" | "SECURITY" | "COMMUNICATION" | "THREAT";

type HygieneEntryForm = {
  kind: HygieneEntryKind;
  scope: "EN_ATRACTIVO" | "EN_POBLADO_CERCANO" | "";
  typeId: string;
  name: string;
  provider: string;
  secondaryId: string;
  secondary: string;
  response: SectionResponse;
  quantity: string;
  condition: "BUENO" | "REGULAR" | "MALO" | "";
  observation: string;
};

type HygieneRadiosForm = {
  available: SectionResponse;
  visitorUse: SectionResponse;
  internalUse: SectionResponse;
  emergencyUse: SectionResponse;
  quantity: string;
  observation: string;
};

type HygieneContingencyForm = {
  exists: SectionResponse;
  institution: string;
  document: string;
  year: string;
  observation: string;
};

type PolicyForm = {
  code: string;
  question: string;
  response: SectionResponse;
  year: string;
  specification: string;
  observation: string;
};

type PromotionMediaForm = {
  response: SectionResponse;
  typeId: string;
  name: string;
  url: string;
  periodicity: string;
  detailOther: string;
  observation: string;
};

type VisitorRegistryForm = {
  exists: SectionResponse;
  type: "DIGITAL" | "PAPEL" | "";
  years: string;
  reports: SectionResponse;
  frequency: string;
  observation: string;
};

type VisitorSeasonForm = {
  type: "ALTA" | "BAJA";
  quantity: string;
  year: string;
  months: string;
  observation: string;
};

type VisitorOriginForm = {
  type: "NACIONAL" | "EXTRANJERA";
  place: string;
  month: string;
  year: string;
  quantity: string;
  observation: string;
};

type VisitorInformantForm = {
  name: string;
  contact: string;
  observation: string;
};

type VisitorInfluxForm = {
  weekday: string;
  weekend: string;
  holidays: string;
  frequency: "PERMANENTE" | "ESTACIONAL" | "ESPORADICA" | "INEXISTENTE" | "";
  observation: string;
};

type HumanResourceTrainingForm = {
  group: "EDUCACION" | "CAPACITACION" | "IDIOMA";
  typeId: string;
  name: string;
  quantity: string;
  detailOther: string;
  observation: string;
};

type AnnexDocumentForm = {
  fileId: string;
  type: string;
  source: string;
  author: string;
  description: string;
  visibility: "PUBLICA" | "ADMINISTRATIVA" | "RESTRINGIDA";
  observation: string;
};

type AnnexResponsibleForm = {
  typeId: string;
  name: string;
  role: string;
  institution: string;
  phone: string;
  email: string;
  observation: string;
};

type SectionFormValues = {
  response: SectionResponse;
  observation: string;
  localityId: string;
  distanceKm: string;
  accessibilityRoads: AccessibilityRoadForm[];
  accessibilityAquatic: AccessibilityAquaticForm[];
  accessibilityAerial: AccessibilityAerialForm[];
  accessibilityTransportTypes: AccessibilityTransportTypeForm[];
  accessibilityTransportDetails: AccessibilityTransportDetailForm[];
  accessibilityCriteria: AccessibilityCriterionForm[];
  accessibilitySignage: AccessibilitySignageForm;
  plant: PlantForm[];
  facilityDetails: FacilityDetailForm[];
  complementaryServices: ComplementaryServiceForm[];
  climateId: string;
  minTemperature: string;
  maxTemperature: string;
  minRainfall: string;
  maxRainfall: string;
  rows: SectionRowForm[];
  conservation: {
    attraction: ConservationComponentForm;
    environment: ConservationComponentForm;
  };
  conservationFactors: ConservationFactorForm[];
  declarations: ConservationDeclarationForm[];
  hygieneEntries: HygieneEntryForm[];
  hygieneRadios: HygieneRadiosForm;
  hygieneContingency: HygieneContingencyForm;
  policies: PolicyForm[];
  promotion: {
    hasPlan: SectionResponse;
    planName: string;
    includedInPlan: SectionResponse;
    partOfPackage: SectionResponse;
    packageDetail: string;
    observation: string;
  };
  promotionMedia: PromotionMediaForm[];
  visitorRegistry: VisitorRegistryForm;
  visitorSeasons: VisitorSeasonForm[];
  visitorOrigins: VisitorOriginForm[];
  visitorInformants: VisitorInformantForm[];
  visitorInflux: VisitorInfluxForm;
  humanResourceSummary: {
    administrationOperation: string;
    specializedTourism: string;
    observation: string;
  };
  humanResourceTraining: HumanResourceTrainingForm[];
  annexDocuments: AnnexDocumentForm[];
  annexResponsibles: AnnexResponsibleForm[];
  accessibilitySurvey: {
    date: string;
    responsible: string;
    scope: string;
    observation: string;
  };
  gadValidation: {
    acceptance: SectionResponse;
    name: string;
    institution: string;
    position: string;
    phone: string;
    email: string;
    date: string;
    observation: string;
  };
};

type SectionProgress =
  "SIN_INICIAR" | "INCOMPLETA" | "COMPLETA" | "CON_ERRORES" | "NO_APLICA";

const EMPTY_RESPONSE: SectionResponse = "SIN_INFORMACION";

function useSectionAutosave({
  form,
  token,
  code,
  detail,
  definition,
  rawSection,
  canEdit,
  onDetailChanged,
  onError,
}: {
  form: UseFormReturn<SectionFormValues>;
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  definition: SectionDefinition;
  rawSection: unknown;
  canEdit: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { reset, getValues, handleSubmit, subscribe, formState } = form;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosaveRef = useRef(false);

  const saveSection = useCallback(
    async (values: SectionFormValues) => {
      if (!code) {
        onError("Completa los datos obligatorios de la ficha para continuar.");
        return;
      }
      const submittedSignature = JSON.stringify(values);
      onError(null);
      try {
        const content = toSectionContent(definition.code, values);
        const saved = await saveAdminCenterSection(
          token,
          code,
          definition.code,
          content,
          detail?.version,
        );
        const latestSignature = JSON.stringify(getValues());
        if (latestSignature === submittedSignature) {
          skipNextAutosaveRef.current = true;
          reset(
            createSectionValues(definition, saved.draft?.sections?.[definition.code]),
          );
        }
        onDetailChanged(saved);
        await queryClient.invalidateQueries({
          queryKey: ["admin", "center", code, "sections"],
        });
      } catch (cause) {
        onError(
          cause instanceof Error
            ? cause.message
            : "No se pudo actualizar la información de esta sección.",
        );
      }
    },
    [
      code,
      definition,
      detail,
      getValues,
      onDetailChanged,
      onError,
      queryClient,
      reset,
      token,
    ],
  );

  useEffect(() => {
    if (formState.isDirty) return;
    skipNextAutosaveRef.current = true;
    reset(createSectionValues(definition, rawSection));
  }, [definition, formState.isDirty, rawSection, reset]);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true, isDirty: true },
      callback: ({ isDirty: subscribedIsDirty }) => {
        if (!subscribedIsDirty) {
          skipNextAutosaveRef.current = false;
          return;
        }
        if (!code || !canEdit) return;
        if (skipNextAutosaveRef.current) {
          skipNextAutosaveRef.current = false;
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          void handleSubmit(saveSection, () => {
            onError("Corrige los campos marcados.");
          })();
        }, 2_000);
      },
    });
    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [canEdit, code, handleSubmit, onError, saveSection, subscribe]);
}

export function CenterSectionWorkflow({
  token,
  code,
  detail,
  catalogs,
  canEdit,
  onDetailChanged,
  onError,
}: {
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
}) {
  const [activeCode, setActiveCode] = useState<AdminCenterSectionCode>(
    centerSectionDefinitions[0].code,
  );
  const [localDrafts, setLocalDrafts] = useState<
    Partial<Record<AdminCenterSectionCode, SectionFormValues>>
  >({});
  const sectionsQuery = useQuery({
    queryKey: ["admin", "center", code, "sections"],
    queryFn: () => getAdminCenterSections(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 10_000,
  });
  const valuationQuery = useQuery<AdminCenterValuation>({
    queryKey: ["admin", "center", code, "valuation"],
    queryFn: () => getAdminCenterValuation(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 10_000,
  });
  const mediaQuery = useQuery<{ items: AdminMediaItem[] }>({
    queryKey: ["admin", "media", code],
    queryFn: () => getAdminCenterMedia(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 5_000,
  });
  const annexMedia = mediaQuery.data?.items ?? [];
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
  const { control, register, setValue, getValues, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "rows" });
  const {
    fields: conservationFactorFields,
    append: appendConservationFactor,
    remove: removeConservationFactor,
  } = useFieldArray({ control, name: "conservationFactors" });
  const {
    fields: declarationFields,
    append: appendDeclaration,
    remove: removeDeclaration,
  } = useFieldArray({ control, name: "declarations" });
  const {
    fields: hygieneEntryFields,
    append: appendHygieneEntry,
    remove: removeHygieneEntry,
  } = useFieldArray({ control, name: "hygieneEntries" });
  const { fields: policyFields } = useFieldArray({ control, name: "policies" });
  const {
    fields: promotionMediaFields,
    append: appendPromotionMedia,
    remove: removePromotionMedia,
  } = useFieldArray({ control, name: "promotionMedia" });
  const {
    fields: visitorSeasonFields,
    append: appendVisitorSeason,
    remove: removeVisitorSeason,
  } = useFieldArray({ control, name: "visitorSeasons" });
  const {
    fields: visitorOriginFields,
    append: appendVisitorOrigin,
    remove: removeVisitorOrigin,
  } = useFieldArray({ control, name: "visitorOrigins" });
  const {
    fields: visitorInformantFields,
    append: appendVisitorInformant,
    remove: removeVisitorInformant,
  } = useFieldArray({ control, name: "visitorInformants" });
  const {
    fields: humanResourceTrainingFields,
    append: appendHumanResourceTraining,
    remove: removeHumanResourceTraining,
  } = useFieldArray({ control, name: "humanResourceTraining" });
  const {
    fields: annexDocumentFields,
    append: appendAnnexDocument,
    remove: removeAnnexDocument,
  } = useFieldArray({ control, name: "annexDocuments" });
  const {
    fields: annexResponsibleFields,
    append: appendAnnexResponsible,
    remove: removeAnnexResponsible,
  } = useFieldArray({ control, name: "annexResponsibles" });
  const activeLocalDraft = localDrafts[definition.code];
  useSectionAutosave({
    form,
    token,
    code,
    detail,
    definition,
    rawSection: activeLocalDraft ?? sections[definition.code],
    canEdit,
    onDetailChanged,
    onError,
  });

  function selectSection(nextCode: AdminCenterSectionCode) {
    if (nextCode === activeCode) return;
    setLocalDrafts((current) => ({ ...current, [activeCode]: getValues() }));
    setActiveCode(nextCode);
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
          description="Completa cada apartado de la ficha para su revisión."
        />
        <InstitutionalCodeCard
          code={detail?.code ?? null}
          valuation={valuationQuery.data ?? null}
        />
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
              </Stack>
              {definition.code === "accesibilidad" ? (
                <AccessibilitySectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  control={control}
                  register={register}
                  setValue={setValue}
                />
              ) : null}
              {definition.code === "caracteristicas" ? (
                <CharacteristicsSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  register={register}
                />
              ) : null}
              {definition.code === "planta" ? (
                <PlantSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  control={control}
                  register={register}
                  setValue={setValue}
                />
              ) : null}
              {definition.code === "conservacion" ? (
                <ConservationSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  register={register}
                  factorFields={conservationFactorFields}
                  declarationFields={declarationFields}
                  appendFactor={appendConservationFactor}
                  removeFactor={removeConservationFactor}
                  appendDeclaration={appendDeclaration}
                  removeDeclaration={removeDeclaration}
                />
              ) : null}
              {definition.code === "higiene-seguridad" ? (
                <HygieneSafetySectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  control={control}
                  register={register}
                  entryFields={hygieneEntryFields}
                  appendEntry={appendHygieneEntry}
                  removeEntry={removeHygieneEntry}
                />
              ) : null}
              {definition.code === "politicas" ? (
                <PoliciesSectionFields
                  canEdit={canEdit}
                  register={register}
                  fields={policyFields}
                />
              ) : null}
              {definition.code === "promocion" ? (
                <PromotionSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  control={control}
                  register={register}
                  mediaFields={promotionMediaFields}
                  appendMedia={appendPromotionMedia}
                  removeMedia={removePromotionMedia}
                />
              ) : null}
              {definition.code === "visitantes" ? (
                <VisitorsSectionFields
                  canEdit={canEdit}
                  control={control}
                  register={register}
                  seasonFields={visitorSeasonFields}
                  originFields={visitorOriginFields}
                  informantFields={visitorInformantFields}
                  appendSeason={appendVisitorSeason}
                  removeSeason={removeVisitorSeason}
                  appendOrigin={appendVisitorOrigin}
                  removeOrigin={removeVisitorOrigin}
                  appendInformant={appendVisitorInformant}
                  removeInformant={removeVisitorInformant}
                />
              ) : null}
              {definition.code === "recurso-humano" ? (
                <HumanResourcesSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  register={register}
                  trainingFields={humanResourceTrainingFields}
                  appendTraining={appendHumanResourceTraining}
                  removeTraining={removeHumanResourceTraining}
                />
              ) : null}
              {definition.code === "anexos" ? (
                <AnnexesSectionFields
                  catalogs={catalogs}
                  canEdit={canEdit}
                  register={register}
                  mediaItems={annexMedia}
                  documentFields={annexDocumentFields}
                  responsibleFields={annexResponsibleFields}
                  appendDocument={appendAnnexDocument}
                  removeDocument={removeAnnexDocument}
                  appendResponsible={appendAnnexResponsible}
                  removeResponsible={removeAnnexResponsible}
                />
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
                  {fields.length > 0 ? (
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
                  ) : null}
                </Stack>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </FlatSurface>
  );
}

function InstitutionalCodeCard({
  code,
  valuation,
}: {
  code: string | null;
  valuation: AdminCenterValuation | null;
}) {
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
        {valuation ? (
          <Alert
            severity={
              valuation.configured && valuation.total !== null ? "success" : "warning"
            }
          >
            {valuation.configured && valuation.total !== null
              ? `Valoración calculada: ${valuation.total.toFixed(2)} puntos · jerarquía ${valuation.hierarchyCode}.`
              : valuation.configured
                ? "Hay indicadores configurados, pero todavía no existe un resultado persistido para esta ficha."
                : "No hay indicadores de valoración configurados; la jerarquía 00 es provisional."}
          </Alert>
        ) : null}
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

function AccessibilitySectionFields({
  catalogs,
  canEdit,
  control,
  register,
  setValue,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  control: Control<SectionFormValues>;
  register: UseFormRegister<SectionFormValues>;
  setValue: UseFormSetValue<SectionFormValues>;
}) {
  const {
    fields: roadFields,
    append: appendRoad,
    remove: removeRoad,
  } = useFieldArray({ control, name: "accessibilityRoads" });
  const {
    fields: aquaticFields,
    append: appendAquatic,
    remove: removeAquatic,
  } = useFieldArray({ control, name: "accessibilityAquatic" });
  const {
    fields: aerialFields,
    append: appendAerial,
    remove: removeAerial,
  } = useFieldArray({ control, name: "accessibilityAerial" });
  const {
    fields: transportTypeFields,
    append: appendTransportType,
    remove: removeTransportType,
  } = useFieldArray({ control, name: "accessibilityTransportTypes" });
  const {
    fields: transportDetailFields,
    append: appendTransportDetail,
    remove: removeTransportDetail,
  } = useFieldArray({ control, name: "accessibilityTransportDetails" });
  const {
    fields: criterionFields,
    append: appendCriterion,
    remove: removeCriterion,
  } = useFieldArray({ control, name: "accessibilityCriteria" });

  const conditionOptions = catalogs?.conditionStates ?? [];
  const roadTypeOptions = catalogs?.roadTypes ?? [];
  const roadMaterialOptions = catalogs?.roadMaterials ?? [];
  const aquaticModeOptions = catalogs?.aquaticAccessModes ?? [];
  const aerialCoverageOptions = catalogs?.aerialAccessCoverages ?? [];
  const transportOptions = catalogs?.transportTypes ?? [];
  const frequencyOptions = catalogs?.serviceFrequencies ?? [];
  const accessibilityTypeOptions = catalogs?.accessibilityTypes ?? [];
  const criterionOptions = useMemo(
    () => catalogs?.accessibilityCriteria ?? [],
    [catalogs?.accessibilityCriteria],
  );
  const watchedTransportTypes = useWatch({
    control,
    name: "accessibilityTransportTypes",
  });
  const watchedCriteria = useWatch({ control, name: "accessibilityCriteria" });
  const signageAvailable = useWatch({
    control,
    name: "accessibilitySignage.available",
  });

  useEffect(() => {
    watchedCriteria?.forEach((criterion, index) => {
      const typeId = criterion?.accessibilityTypeId;
      const criterionId = criterion?.criterionId;
      if (!typeId || !criterionId) return;
      const selected = criterionOptions.find(
        (option) => Number(option.id) === Number(criterionId),
      );
      if (!selected || Number(selected.typeId) !== Number(typeId)) {
        setValue(`accessibilityCriteria.${index}.criterionId`, "");
      }
    });
  }, [criterionOptions, setValue, watchedCriteria]);

  const emptyState = (label: string, actionLabel: string, onAdd: () => void) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Button
        type="button"
        size="small"
        variant="outlined"
        startIcon={<AddRounded />}
        disabled={!canEdit}
        onClick={onAdd}
      >
        {actionLabel}
      </Button>
    </Stack>
  );

  const conditionSelect = (
    name: string,
    label: string,
    options: AdminCatalogs["conditionStates"] = conditionOptions,
    disabled = false,
  ) => (
    <FormControl fullWidth disabled={!canEdit || disabled}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        label={label}
        defaultValue=""
        {...register(name as never)}
      >
        <MenuItem value="">Sin seleccionar</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Stack spacing={webTokens.spacing.control}>
      <Typography variant="subtitle1">Referencia territorial y conectividad</Typography>
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormControl fullWidth disabled={!canEdit}>
            <InputLabel id="section-nearby-locality-label">Localidad cercana</InputLabel>
            <Select
              labelId="section-nearby-locality-label"
              label="Localidad cercana"
              defaultValue=""
              {...register("localityId")}
            >
              <MenuItem value="">Sin seleccionar</MenuItem>
              {(catalogs?.localities ?? []).map((locality) => (
                <MenuItem key={locality.id} value={String(locality.id)}>
                  {locality.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Distancia aproximada (km)"
            type="number"
            fullWidth
            disabled={!canEdit}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            {...register("distanceKm", {
              validate: (value) =>
                !value.trim() || (Number.isFinite(Number(value)) && Number(value) >= 0)
                  ? true
                  : "Usa una distancia igual o mayor que cero",
            })}
          />
        </Grid>
      </Grid>

      <Divider />
      <AccessibilitySubsectionHeader
        title="Vías terrestres de acceso"
        description="Registra cada alternativa con coordenadas, distancia, material y estado."
        actionLabel="Añadir vía"
        canEdit={canEdit}
        onAdd={() =>
          appendRoad({
            roadTypeId: "",
            typeLabel: "",
            startLatitude: "",
            startLongitude: "",
            endLatitude: "",
            endLongitude: "",
            distanceKm: "",
            materialId: "",
            conditionId: "",
            observation: "",
          })
        }
      />
      {roadFields.length === 0
        ? emptyState("No hay vías terrestres registradas.", "Añadir vía", () =>
            appendRoad({
              roadTypeId: "",
              typeLabel: "",
              startLatitude: "",
              startLongitude: "",
              endLatitude: "",
              endLongitude: "",
              distanceKm: "",
              materialId: "",
              conditionId: "",
              observation: "",
            }),
          )
        : roadFields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              <Stack spacing={1.5}>
                <Grid container spacing={webTokens.spacing.control}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`access-road-type-${index}-label`}>
                        Tipo de vía
                      </InputLabel>
                      <Select
                        labelId={`access-road-type-${index}-label`}
                        label="Tipo de vía"
                        defaultValue=""
                        {...register(`accessibilityRoads.${index}.roadTypeId`)}
                      >
                        <MenuItem value="">Seleccionar catálogo</MenuItem>
                        {roadTypeOptions.map((option) => (
                          <MenuItem key={option.id} value={String(option.id)}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Tipo de vía (si no está catalogado)"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`accessibilityRoads.${index}.typeLabel`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="Distancia (km)"
                      type="number"
                      fullWidth
                      disabled={!canEdit}
                      slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                      {...register(`accessibilityRoads.${index}.distanceKm`)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <IconButton
                      type="button"
                      aria-label={`Eliminar vía terrestre ${index + 1}`}
                      disabled={!canEdit}
                      onClick={() => removeRoad(index)}
                      sx={{ mt: { md: 1 } }}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {conditionSelect(
                      `accessibilityRoads.${index}.materialId`,
                      "Material de vía",
                      roadMaterialOptions,
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {conditionSelect(
                      `accessibilityRoads.${index}.conditionId`,
                      "Estado de la vía",
                    )}
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">
                  Coordenadas de inicio y fin (grados decimales)
                </Typography>
                <Grid container spacing={webTokens.spacing.control}>
                  {(
                    [
                      ["startLatitude", "Latitud inicial"],
                      ["startLongitude", "Longitud inicial"],
                      ["endLatitude", "Latitud final"],
                      ["endLongitude", "Longitud final"],
                    ] as const
                  ).map(([key, label]) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                      <TextField
                        label={label}
                        type="number"
                        fullWidth
                        disabled={!canEdit}
                        {...register(`accessibilityRoads.${index}.${key}`)}
                      />
                    </Grid>
                  ))}
                </Grid>
                <TextField
                  label="Observación de la vía"
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={!canEdit}
                  {...register(`accessibilityRoads.${index}.observation`, {
                    maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                  })}
                />
              </Stack>
            </FlatSurface>
          ))}

      <Divider />
      <AccessibilitySubsectionHeader
        title="Accesos acuáticos"
        description="Registra puerto o muelle de partida y llegada por modalidad."
        actionLabel="Añadir acceso acuático"
        canEdit={canEdit}
        onAdd={() =>
          appendAquatic({
            modalityId: "",
            modalityLabel: "",
            departure: "",
            departureConditionId: "",
            arrival: "",
            arrivalConditionId: "",
            observation: "",
          })
        }
      />
      {aquaticFields.length === 0
        ? emptyState(
            "No hay accesos acuáticos registrados.",
            "Añadir acceso acuático",
            () =>
              appendAquatic({
                modalityId: "",
                modalityLabel: "",
                departure: "",
                departureConditionId: "",
                arrival: "",
                arrivalConditionId: "",
                observation: "",
              }),
          )
        : aquaticFields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              <Grid container spacing={webTokens.spacing.control}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-aquatic-mode-${index}-label`}>
                      Modalidad
                    </InputLabel>
                    <Select
                      labelId={`access-aquatic-mode-${index}-label`}
                      label="Modalidad"
                      defaultValue=""
                      {...register(`accessibilityAquatic.${index}.modalityId`)}
                    >
                      <MenuItem value="">Seleccionar catálogo</MenuItem>
                      {aquaticModeOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Modalidad (si no está catalogada)"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityAquatic.${index}.modalityLabel`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <IconButton
                    type="button"
                    aria-label={`Eliminar acceso acuático ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeAquatic(index)}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label="Puerto / muelle de partida"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityAquatic.${index}.departure`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {conditionSelect(
                    `accessibilityAquatic.${index}.departureConditionId`,
                    "Estado de partida",
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label="Puerto / muelle de llegada"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityAquatic.${index}.arrival`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {conditionSelect(
                    `accessibilityAquatic.${index}.arrivalConditionId`,
                    "Estado de llegada",
                  )}
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Observación del acceso acuático"
                    fullWidth
                    multiline
                    minRows={2}
                    disabled={!canEdit}
                    {...register(`accessibilityAquatic.${index}.observation`)}
                  />
                </Grid>
              </Grid>
            </FlatSurface>
          ))}

      <Divider />
      <AccessibilitySubsectionHeader
        title="Accesos aéreos"
        description="Registra la cobertura del acceso cuando aplique."
        actionLabel="Añadir acceso aéreo"
        canEdit={canEdit}
        onAdd={() => appendAerial({ coverageId: "", coverageLabel: "", observation: "" })}
      />
      {aerialFields.length === 0
        ? emptyState("No hay accesos aéreos registrados.", "Añadir acceso aéreo", () =>
            appendAerial({ coverageId: "", coverageLabel: "", observation: "" }),
          )
        : aerialFields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              <Grid container spacing={webTokens.spacing.control}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-aerial-coverage-${index}-label`}>
                      Cobertura
                    </InputLabel>
                    <Select
                      labelId={`access-aerial-coverage-${index}-label`}
                      label="Cobertura"
                      defaultValue=""
                      {...register(`accessibilityAerial.${index}.coverageId`)}
                    >
                      <MenuItem value="">Seleccionar catálogo</MenuItem>
                      {aerialCoverageOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label="Cobertura (si no está catalogada)"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityAerial.${index}.coverageLabel`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <IconButton
                    type="button"
                    aria-label={`Eliminar acceso aéreo ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeAerial(index)}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Observación del acceso aéreo"
                    fullWidth
                    multiline
                    minRows={2}
                    disabled={!canEdit}
                    {...register(`accessibilityAerial.${index}.observation`)}
                  />
                </Grid>
              </Grid>
            </FlatSurface>
          ))}

      <Divider />
      <AccessibilitySubsectionHeader
        title="Servicio de transporte"
        description="Separa los tipos disponibles del detalle de operadores y traslados."
        actionLabel="Añadir tipo"
        canEdit={canEdit}
        onAdd={() =>
          appendTransportType({
            typeId: "",
            label: "",
            applies: "SI",
            detailOther: "",
            observation: "",
          })
        }
      />
      {transportTypeFields.length === 0
        ? emptyState("No hay tipos de transporte registrados.", "Añadir tipo", () =>
            appendTransportType({
              typeId: "",
              label: "",
              applies: "SI",
              detailOther: "",
              observation: "",
            }),
          )
        : transportTypeFields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              <Grid container spacing={webTokens.spacing.control}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-transport-type-${index}-label`}>
                      Tipo
                    </InputLabel>
                    <Select
                      labelId={`access-transport-type-${index}-label`}
                      label="Tipo"
                      defaultValue=""
                      {...register(`accessibilityTransportTypes.${index}.typeId`)}
                    >
                      <MenuItem value="">Seleccionar catálogo</MenuItem>
                      {transportOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Tipo (si no está catalogado)"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityTransportTypes.${index}.label`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-transport-applies-${index}-label`}>
                      Aplica
                    </InputLabel>
                    <Select
                      labelId={`access-transport-applies-${index}-label`}
                      label="Aplica"
                      defaultValue="SI"
                      {...register(`accessibilityTransportTypes.${index}.applies`)}
                    >
                      <MenuItem value="SI">Sí</MenuItem>
                      <MenuItem value="NO">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <IconButton
                    type="button"
                    aria-label={`Eliminar tipo de transporte ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeTransportType(index)}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Detalle de otro tipo"
                    fullWidth
                    disabled={
                      !canEdit || watchedTransportTypes?.[index]?.applies !== "SI"
                    }
                    {...register(`accessibilityTransportTypes.${index}.detailOther`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Observación"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityTransportTypes.${index}.observation`)}
                  />
                </Grid>
              </Grid>
            </FlatSurface>
          ))}

      <Stack spacing={1.5}>
        <AccessibilitySubsectionHeader
          title="Detalle de transporte hacia el atractivo"
          description="Registra cooperativa, terminal, frecuencia y traslado origen/destino."
          actionLabel="Añadir operador"
          canEdit={canEdit}
          onAdd={() =>
            appendTransportDetail({
              operator: "",
              terminal: "",
              frequencyId: "",
              frequencyLabel: "",
              transferDetail: "",
              observation: "",
            })
          }
        />
        {transportDetailFields.length === 0
          ? emptyState("No hay operadores registrados.", "Añadir operador", () =>
              appendTransportDetail({
                operator: "",
                terminal: "",
                frequencyId: "",
                frequencyLabel: "",
                transferDetail: "",
                observation: "",
              }),
            )
          : transportDetailFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid container spacing={webTokens.spacing.control}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Cooperativa o asociación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`accessibilityTransportDetails.${index}.operator`, {
                        required: "Indica el operador",
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Estación / terminal"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`accessibilityTransportDetails.${index}.terminal`)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`access-frequency-${index}-label`}>
                        Frecuencia
                      </InputLabel>
                      <Select
                        labelId={`access-frequency-${index}-label`}
                        label="Frecuencia"
                        defaultValue=""
                        {...register(
                          `accessibilityTransportDetails.${index}.frequencyId`,
                        )}
                      >
                        <MenuItem value="">Seleccionar catálogo</MenuItem>
                        {frequencyOptions.map((option) => (
                          <MenuItem key={option.id} value={String(option.id)}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Frecuencia (si no está catalogada)"
                      fullWidth
                      disabled={!canEdit}
                      {...register(
                        `accessibilityTransportDetails.${index}.frequencyLabel`,
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TextField
                      label="Detalle del traslado (origen / destino)"
                      fullWidth
                      disabled={!canEdit}
                      {...register(
                        `accessibilityTransportDetails.${index}.transferDetail`,
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <IconButton
                      type="button"
                      aria-label={`Eliminar operador ${index + 1}`}
                      disabled={!canEdit}
                      onClick={() => removeTransportDetail(index)}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Observación"
                      fullWidth
                      multiline
                      minRows={2}
                      disabled={!canEdit}
                      {...register(`accessibilityTransportDetails.${index}.observation`)}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
      </Stack>

      <Divider />
      <AccessibilitySubsectionHeader
        title="Condiciones de accesibilidad para personas con discapacidad"
        description="Usa los criterios de la ficha por tipo de accesibilidad; el catálogo puede completarse desde administración."
        actionLabel="Añadir criterio"
        canEdit={canEdit}
        onAdd={() =>
          appendCriterion({
            accessibilityTypeId: "",
            criterionId: "",
            label: "",
            response: EMPTY_RESPONSE,
            detail: "",
            observation: "",
          })
        }
      />
      {criterionFields.length === 0
        ? emptyState("No hay criterios registrados.", "Añadir criterio", () =>
            appendCriterion({
              accessibilityTypeId: "",
              criterionId: "",
              label: "",
              response: EMPTY_RESPONSE,
              detail: "",
              observation: "",
            }),
          )
        : criterionFields.map((field, index) => (
            <FlatSurface key={field.id} padding="compact" tone="subtle">
              <Grid container spacing={webTokens.spacing.control}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-criterion-type-${index}-label`}>
                      Tipo
                    </InputLabel>
                    <Select
                      labelId={`access-criterion-type-${index}-label`}
                      label="Tipo"
                      defaultValue=""
                      {...register(`accessibilityCriteria.${index}.accessibilityTypeId`)}
                    >
                      <MenuItem value="">Sin clasificar</MenuItem>
                      {accessibilityTypeOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-criterion-${index}-label`}>
                      Criterio catalogado
                    </InputLabel>
                    <Select
                      labelId={`access-criterion-${index}-label`}
                      label="Criterio catalogado"
                      defaultValue=""
                      {...register(`accessibilityCriteria.${index}.criterionId`)}
                    >
                      <MenuItem value="">Usar descripción manual</MenuItem>
                      {(watchedCriteria?.[index]?.accessibilityTypeId
                        ? criterionOptions.filter(
                            (option) =>
                              Number(option.typeId) ===
                              Number(watchedCriteria[index]?.accessibilityTypeId),
                          )
                        : []
                      ).map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Descripción manual del criterio"
                    fullWidth
                    disabled={!canEdit}
                    helperText="Obligatoria solo si no eliges un criterio catalogado"
                    {...register(`accessibilityCriteria.${index}.label`, {
                      maxLength: { value: 300, message: "Máximo 300 caracteres" },
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 10, md: 1 }}>
                  <IconButton
                    type="button"
                    aria-label={`Eliminar criterio ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeCriterion(index)}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel id={`access-criterion-response-${index}-label`}>
                      Respuesta
                    </InputLabel>
                    <Select
                      labelId={`access-criterion-response-${index}-label`}
                      label="Respuesta"
                      defaultValue={EMPTY_RESPONSE}
                      {...register(`accessibilityCriteria.${index}.response`)}
                    >
                      {SECTION_RESPONSE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Detalle"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityCriteria.${index}.detail`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label="Observación"
                    fullWidth
                    disabled={!canEdit}
                    {...register(`accessibilityCriteria.${index}.observation`)}
                  />
                </Grid>
              </Grid>
            </FlatSurface>
          ))}

      <Divider />
      <Typography variant="subtitle1">Señalización de aproximación</Typography>
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth disabled={!canEdit}>
            <InputLabel id="access-signage-available-label">Disponible</InputLabel>
            <Select
              labelId="access-signage-available-label"
              label="Disponible"
              defaultValue={EMPTY_RESPONSE}
              {...register("accessibilitySignage.available")}
            >
              {SECTION_RESPONSE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {conditionSelect(
            "accessibilitySignage.conditionId",
            "Estado",
            conditionOptions,
            signageAvailable !== "SI",
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Observación"
            fullWidth
            disabled={!canEdit}
            {...register("accessibilitySignage.observation")}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

function AccessibilitySubsectionHeader({
  title,
  description,
  actionLabel,
  canEdit,
  onAdd,
}: {
  title: string;
  description: string;
  actionLabel: string;
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Button
        type="button"
        size="small"
        variant="outlined"
        startIcon={<AddRounded />}
        disabled={!canEdit}
        onClick={onAdd}
      >
        {actionLabel}
      </Button>
    </Stack>
  );
}

function PlantSectionFields({
  catalogs,
  canEdit,
  control,
  register,
  setValue,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  control: Control<SectionFormValues>;
  register: UseFormRegister<SectionFormValues>;
  setValue: UseFormSetValue<SectionFormValues>;
}) {
  const {
    fields: plantFields,
    append: appendPlant,
    remove: removePlant,
  } = useFieldArray({ control, name: "plant" });
  const {
    fields: facilityFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({ control, name: "facilityDetails" });
  const {
    fields: complementaryFields,
    append: appendComplementary,
    remove: removeComplementary,
  } = useFieldArray({ control, name: "complementaryServices" });

  const scopeOptions = catalogs?.serviceScopes ?? [];
  const plantOptions = catalogs?.plantTypes ?? [];
  const facilityCategoryOptions = catalogs?.facilityCategories ?? [];
  const facilityOptions = useMemo(
    () => catalogs?.facilities ?? [],
    [catalogs?.facilities],
  );
  const conditionOptions = catalogs?.conditionStates ?? [];
  const complementaryOptions = catalogs?.complementaryServiceTypes ?? [];
  const watchedFacilityDetails = useWatch({ control, name: "facilityDetails" });

  useEffect(() => {
    watchedFacilityDetails?.forEach((facility, index) => {
      const categoryId = facility?.categoryId;
      const typeId = facility?.typeId;
      if (!categoryId || !typeId) return;
      const type = facilityOptions.find((option) => Number(option.id) === Number(typeId));
      if (!type || Number(type.categoryId) !== Number(categoryId)) {
        setValue(`facilityDetails.${index}.typeId`, "");
      }
    });
  }, [facilityOptions, setValue, watchedFacilityDetails]);

  const appendEmptyPlant = () =>
    appendPlant({
      scope: "EN_ATRACTIVO",
      typeId: "",
      typeLabel: "",
      group: "",
      quantity1: "",
      quantity2: "",
      quantity3: "",
      observation: "",
    });
  const appendEmptyFacility = () =>
    appendFacility({
      categoryId: "",
      typeId: "",
      typeLabel: "",
      quantity: "0",
      latitude: "",
      longitude: "",
      administrator: "",
      universalAccessibility: EMPTY_RESPONSE,
      conditionId: "",
      detailOther: "",
      observation: "",
    });
  const appendEmptyComplementary = () =>
    appendComplementary({
      scope: "EN_ATRACTIVO",
      typeId: "",
      typeLabel: "",
      specification: "",
      observation: "",
    });

  const scopeSelect = (name: string, label: string) => (
    <FormControl fullWidth disabled={!canEdit}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        label={label}
        defaultValue="EN_ATRACTIVO"
        {...register(name as never)}
      >
        {scopeOptions.length > 0 ? (
          scopeOptions.map((option) => (
            <MenuItem key={option.id} value={option.code ?? option.name}>
              {option.name}
            </MenuItem>
          ))
        ) : (
          <>
            <MenuItem value="EN_ATRACTIVO">En el atractivo</MenuItem>
            <MenuItem value="EN_POBLADO_CERCANO">En el poblado cercano</MenuItem>
          </>
        )}
      </Select>
    </FormControl>
  );

  const conditionSelect = (name: string) => (
    <FormControl fullWidth disabled={!canEdit}>
      <InputLabel id={`${name}-label`}>Estado</InputLabel>
      <Select
        labelId={`${name}-label`}
        label="Estado"
        defaultValue=""
        {...register(name as never)}
      >
        <MenuItem value="">Sin seleccionar</MenuItem>
        {conditionOptions.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AccessibilitySubsectionHeader
        title="Planta turística"
        description="Alojamiento, alimentos y bebidas, agencias y guías por ámbito de ubicación."
        actionLabel="Añadir registro"
        canEdit={canEdit}
        onAdd={appendEmptyPlant}
      />
      {plantFields.length === 0 ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            No hay registros de planta turística.
          </Typography>
          <Button
            type="button"
            size="small"
            variant="outlined"
            disabled={!canEdit}
            onClick={appendEmptyPlant}
          >
            Añadir registro
          </Button>
        </Stack>
      ) : (
        plantFields.map((field, index) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 3 }}>
                {scopeSelect(`plant.${index}.scope`, "Ámbito")}
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`plant-type-${index}-label`}>
                    Tipo catalogado
                  </InputLabel>
                  <Select
                    labelId={`plant-type-${index}-label`}
                    label="Tipo catalogado"
                    defaultValue=""
                    {...register(`plant.${index}.typeId`)}
                  >
                    <MenuItem value="">Usar descripción manual</MenuItem>
                    {plantOptions.map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Tipo de planta (si no está catalogado)"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`plant.${index}.typeLabel`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton
                  type="button"
                  aria-label={`Eliminar registro de planta ${index + 1}`}
                  disabled={!canEdit}
                  onClick={() => removePlant(index)}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Grupo"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`plant.${index}.group`)}
                />
              </Grid>
              {(["quantity1", "quantity2", "quantity3"] as const).map(
                (key, quantityIndex) => (
                  <Grid size={{ xs: 12, sm: 4, md: 2 }} key={key}>
                    <TextField
                      label={`Cantidad ${quantityIndex + 1}`}
                      type="number"
                      fullWidth
                      disabled={!canEdit}
                      slotProps={{ htmlInput: { min: 0, step: 1 } }}
                      {...register(`plant.${index}.${key}`, {
                        validate: (value) =>
                          !value.trim() ||
                          (Number.isInteger(Number(value)) && Number(value) >= 0)
                            ? true
                            : "Usa un entero igual o mayor que cero",
                      })}
                    />
                  </Grid>
                ),
              )}
              <Grid size={12}>
                <TextField
                  label="Observación de planta turística"
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={!canEdit}
                  {...register(`plant.${index}.observation`)}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        ))
      )}

      <Divider />
      <AccessibilitySubsectionHeader
        title="Facilidades en el entorno"
        description="Registra cantidad, coordenadas, administrador, accesibilidad universal y estado."
        actionLabel="Añadir facilidad"
        canEdit={canEdit}
        onAdd={appendEmptyFacility}
      />
      {facilityFields.length === 0 ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            No hay facilidades detalladas registradas. Añade una para completar este
            apartado.
          </Typography>
          <Button
            type="button"
            size="small"
            variant="outlined"
            disabled={!canEdit}
            onClick={appendEmptyFacility}
          >
            Añadir facilidad
          </Button>
        </Stack>
      ) : (
        facilityFields.map((field, index) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`facility-category-${index}-label`}>
                    Categoría
                  </InputLabel>
                  <Select
                    labelId={`facility-category-${index}-label`}
                    label="Categoría"
                    defaultValue=""
                    {...register(`facilityDetails.${index}.categoryId`)}
                  >
                    <MenuItem value="">Sin seleccionar</MenuItem>
                    {facilityCategoryOptions.map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl
                  fullWidth
                  disabled={!canEdit || !watchedFacilityDetails?.[index]?.categoryId}
                >
                  <InputLabel id={`facility-type-${index}-label`}>
                    Tipo catalogado
                  </InputLabel>
                  <Select
                    labelId={`facility-type-${index}-label`}
                    label="Tipo catalogado"
                    defaultValue=""
                    {...register(`facilityDetails.${index}.typeId`)}
                  >
                    <MenuItem value="">Usar descripción manual</MenuItem>
                    {(watchedFacilityDetails?.[index]?.categoryId
                      ? facilityOptions.filter(
                          (option) =>
                            Number(option.categoryId) ===
                            Number(watchedFacilityDetails[index]?.categoryId),
                        )
                      : []
                    ).map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Tipo de facilidad (si no está catalogado)"
                  fullWidth
                  disabled={!canEdit || !watchedFacilityDetails?.[index]?.categoryId}
                  {...register(`facilityDetails.${index}.typeLabel`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton
                  type="button"
                  aria-label={`Eliminar facilidad ${index + 1}`}
                  disabled={!canEdit}
                  onClick={() => removeFacility(index)}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  label="Cantidad"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  {...register(`facilityDetails.${index}.quantity`, {
                    validate: (value) =>
                      Number.isInteger(Number(value)) && Number(value) >= 0
                        ? true
                        : "Usa un entero igual o mayor que cero",
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  label="Latitud"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`facilityDetails.${index}.latitude`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  label="Longitud"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`facilityDetails.${index}.longitude`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Administrador"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`facilityDetails.${index}.administrator`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`facility-accessibility-${index}-label`}>
                    Accesibilidad universal
                  </InputLabel>
                  <Select
                    labelId={`facility-accessibility-${index}-label`}
                    label="Accesibilidad universal"
                    defaultValue={EMPTY_RESPONSE}
                    {...register(`facilityDetails.${index}.universalAccessibility`)}
                  >
                    {SECTION_RESPONSE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                {conditionSelect(`facilityDetails.${index}.conditionId`)}
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Detalle de otro tipo"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`facilityDetails.${index}.detailOther`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`facilityDetails.${index}.observation`)}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        ))
      )}

      <Divider />
      <AccessibilitySubsectionHeader
        title="Servicios complementarios"
        description="Registra servicios disponibles en el atractivo o en el poblado cercano."
        actionLabel="Añadir servicio"
        canEdit={canEdit}
        onAdd={appendEmptyComplementary}
      />
      {complementaryFields.length === 0 ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            No hay servicios complementarios registrados.
          </Typography>
          <Button
            type="button"
            size="small"
            variant="outlined"
            disabled={!canEdit}
            onClick={appendEmptyComplementary}
          >
            Añadir servicio
          </Button>
        </Stack>
      ) : (
        complementaryFields.map((field, index) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 3 }}>
                {scopeSelect(`complementaryServices.${index}.scope`, "Ámbito")}
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`complementary-type-${index}-label`}>
                    Tipo catalogado
                  </InputLabel>
                  <Select
                    labelId={`complementary-type-${index}-label`}
                    label="Tipo catalogado"
                    defaultValue=""
                    {...register(`complementaryServices.${index}.typeId`)}
                  >
                    <MenuItem value="">Usar descripción manual</MenuItem>
                    {complementaryOptions.map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Tipo de servicio (si no está catalogado)"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`complementaryServices.${index}.typeLabel`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton
                  type="button"
                  aria-label={`Eliminar servicio complementario ${index + 1}`}
                  disabled={!canEdit}
                  onClick={() => removeComplementary(index)}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  label="Especificación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`complementaryServices.${index}.specification`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`complementaryServices.${index}.observation`)}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        ))
      )}
    </Stack>
  );
}

const CONSERVATION_STATE_OPTIONS = [
  { value: "CONSERVADO", label: "Conservado" },
  { value: "ALTERADO", label: "Alterado" },
  { value: "EN_PROCESO_DE_DETERIORO", label: "En proceso de deterioro" },
  { value: "DETERIORADO", label: "Deteriorado" },
] as const;

function ConservationSectionFields({
  catalogs,
  canEdit,
  register,
  factorFields,
  declarationFields,
  appendFactor,
  removeFactor,
  appendDeclaration,
  removeDeclaration,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
  factorFields: Array<{ id: string }>;
  declarationFields: Array<{ id: string }>;
  appendFactor: (value: ConservationFactorForm) => void;
  removeFactor: (index: number) => void;
  appendDeclaration: (value: ConservationDeclarationForm) => void;
  removeDeclaration: (index: number) => void;
}) {
  const conservationFactors = catalogs?.conservationFactors ?? [];
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Estado por componente</Typography>
        <Typography variant="body2" color="text.secondary">
          La ficha distingue el estado del atractivo y de su entorno antes de registrar
          factores de alteración o declaratorias.
        </Typography>
      </Box>
      <Grid container spacing={webTokens.spacing.control}>
        {(
          [
            ["attraction", "Atractivo"],
            ["environment", "Entorno"],
          ] as const
        ).map(([component, label]) => (
          <Grid key={component} size={{ xs: 12, md: 6 }}>
            <FlatSurface padding="compact" tone="subtle">
              <Stack spacing={webTokens.spacing.control}>
                <Typography variant="subtitle2">{label}</Typography>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`conservation-state-${component}`}>
                    Estado de conservación
                  </InputLabel>
                  <Select
                    labelId={`conservation-state-${component}`}
                    label="Estado de conservación"
                    defaultValue=""
                    {...register(`conservation.${component}.state`)}
                  >
                    <MenuItem value="">Sin seleccionar</MenuItem>
                    {CONSERVATION_STATE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={`Observación del ${label.toLowerCase()}`}
                  multiline
                  minRows={2}
                  fullWidth
                  disabled={!canEdit}
                  {...register(`conservation.${component}.observation`, {
                    maxLength: { value: 2_000, message: "Máximo 2.000 caracteres" },
                  })}
                />
              </Stack>
            </FlatSurface>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Factores de alteración</Typography>
            <Typography variant="body2" color="text.secondary">
              Registra factores naturales o antrópicos con respuesta explícita y
              observación.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendFactor({
                component: "ATRACTIVO",
                factorId: "",
                origin: "NATURAL",
                name: "",
                response: EMPTY_RESPONSE,
                detailOther: "",
                observation: "",
              })
            }
          >
            Añadir factor
          </Button>
        </Stack>
        {factorFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay factores registrados.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {factorFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`factor-component-${index}`}>Componente</InputLabel>
                      <Select
                        labelId={`factor-component-${index}`}
                        label="Componente"
                        defaultValue="ATRACTIVO"
                        {...register(`conservationFactors.${index}.component`)}
                      >
                        <MenuItem value="ATRACTIVO">Atractivo</MenuItem>
                        <MenuItem value="ENTORNO">Entorno</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`factor-origin-${index}`}>Origen</InputLabel>
                      <Select
                        labelId={`factor-origin-${index}`}
                        label="Origen"
                        defaultValue="NATURAL"
                        {...register(`conservationFactors.${index}.origin`)}
                      >
                        <MenuItem value="NATURAL">Natural</MenuItem>
                        <MenuItem value="ANTROPICO">Antrópico</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl
                      fullWidth
                      disabled={!canEdit || conservationFactors.length === 0}
                    >
                      <InputLabel id={`factor-catalog-${index}`}>
                        Factor catalogado
                      </InputLabel>
                      <Select
                        labelId={`factor-catalog-${index}`}
                        label="Factor catalogado"
                        defaultValue=""
                        {...register(`conservationFactors.${index}.factorId`)}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {conservationFactors.map((factor) => (
                          <MenuItem key={factor.id} value={String(factor.id)}>
                            {factor.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`factor-response-${index}`}>Presente</InputLabel>
                      <Select
                        labelId={`factor-response-${index}`}
                        label="Presente"
                        defaultValue={EMPTY_RESPONSE}
                        {...register(`conservationFactors.${index}.response`)}
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
                    <Tooltip title="Eliminar factor">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar factor ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeFactor(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Nombre alternativo (otro)"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`conservationFactors.${index}.name`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Detalle adicional"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`conservationFactors.${index}.detailOther`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Observación del factor"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`conservationFactors.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">
              Declaratorias del espacio turístico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conserva entidad, denominación, fecha y ámbito de cada declaratoria.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendDeclaration({
                entity: "",
                denomination: "",
                date: "",
                scope: "",
                observation: "",
              })
            }
          >
            Añadir declaratoria
          </Button>
        </Stack>
        {declarationFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay declaratorias registradas.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {declarationFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Entidad declarante"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`declarations.${index}.entity`, {
                        required: "Indica la entidad declarante",
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Denominación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`declarations.${index}.denomination`, {
                        required: "Indica la denominación",
                        maxLength: { value: 250, message: "Máximo 250 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 10, sm: 5, md: 3 }}>
                    <TextField
                      label="Fecha"
                      type="date"
                      fullWidth
                      disabled={!canEdit}
                      InputLabelProps={{ shrink: true }}
                      {...register(`declarations.${index}.date`)}
                    />
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1, md: 1 }}>
                    <Tooltip title="Eliminar declaratoria">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar declaratoria ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeDeclaration(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Ámbito"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`declarations.${index}.scope`, {
                        maxLength: { value: 120, message: "Máximo 120 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Observación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`declarations.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

const HYGIENE_ENTRY_OPTIONS: Array<{ value: HygieneEntryKind; label: string }> = [
  { value: "BASIC_SERVICE", label: "Servicio básico" },
  { value: "SIGNAGE", label: "Señalética" },
  { value: "HEALTH", label: "Servicio de salud" },
  { value: "SECURITY", label: "Servicio de seguridad" },
  { value: "COMMUNICATION", label: "Comunicación" },
  { value: "THREAT", label: "Amenaza" },
];

function HygieneSafetySectionFields({
  catalogs,
  canEdit,
  control,
  register,
  entryFields,
  appendEntry,
  removeEntry,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  control: Control<SectionFormValues>;
  register: UseFormRegister<SectionFormValues>;
  entryFields: Array<{ id: string }>;
  appendEntry: (value: HygieneEntryForm) => void;
  removeEntry: (index: number) => void;
}) {
  const watchedEntries = useWatch({ control, name: "hygieneEntries" });
  const watchedRadios = useWatch({ control, name: "hygieneRadios" });
  const watchedContingency = useWatch({ control, name: "hygieneContingency" });
  const typeOptions = (kind: HygieneEntryKind) => {
    if (!catalogs) return [];
    switch (kind) {
      case "BASIC_SERVICE":
        return catalogs.basicServiceTypes;
      case "SIGNAGE":
        return catalogs.signageTypes;
      case "HEALTH":
        return catalogs.healthServiceTypes;
      case "SECURITY":
        return catalogs.securityServiceTypes;
      case "COMMUNICATION":
        return catalogs.communicationTypes;
      case "THREAT":
        return catalogs.threatTypes;
    }
  };
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Higiene, seguridad y amenazas</Typography>
        <Typography variant="body2" color="text.secondary">
          Cada registro conserva su ámbito, respuesta, cantidad y observación. Las radios
          y el plan de contingencia se capturan como controles separados.
        </Typography>
      </Box>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Servicios y amenazas</Typography>
            <Typography variant="body2" color="text.secondary">
              Usa el tipo de registro para separar servicios básicos, señalética, salud,
              seguridad, comunicación y multiamenazas.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendEntry({
                kind: "BASIC_SERVICE",
                scope: "EN_ATRACTIVO",
                typeId: "",
                name: "",
                provider: "",
                secondaryId: "",
                secondary: "",
                response: EMPTY_RESPONSE,
                quantity: "",
                condition: "",
                observation: "",
              })
            }
          >
            Añadir registro
          </Button>
        </Stack>
        {entryFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay registros de higiene y seguridad.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {entryFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  {(() => {
                    const entry = watchedEntries?.[index];
                    const kind = (entry?.kind as HygieneEntryKind) || "BASIC_SERVICE";
                    const response = entry?.response || EMPTY_RESPONSE;
                    const detailEnabled =
                      kind === "THREAT" ||
                      (response !== "NO" && response !== "NO_APLICA");
                    const scopeEnabled = [
                      "BASIC_SERVICE",
                      "HEALTH",
                      "COMMUNICATION",
                    ].includes(kind);
                    return (
                      <>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                          <FormControl fullWidth disabled={!canEdit}>
                            <InputLabel id={`hygiene-kind-${index}`}>
                              Tipo de registro
                            </InputLabel>
                            <Select
                              labelId={`hygiene-kind-${index}`}
                              label="Tipo de registro"
                              defaultValue="BASIC_SERVICE"
                              {...register(`hygieneEntries.${index}.kind`)}
                            >
                              {HYGIENE_ENTRY_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                          <FormControl fullWidth disabled={!canEdit}>
                            <InputLabel id={`hygiene-scope-${index}`}>Ámbito</InputLabel>
                            <Select
                              labelId={`hygiene-scope-${index}`}
                              label="Ámbito"
                              defaultValue="EN_ATRACTIVO"
                              disabled={!canEdit || !scopeEnabled}
                              {...register(`hygieneEntries.${index}.scope`)}
                            >
                              <MenuItem value="">No aplica</MenuItem>
                              <MenuItem value="EN_ATRACTIVO">En el atractivo</MenuItem>
                              <MenuItem value="EN_POBLADO_CERCANO">
                                En poblado cercano
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                          <FormControl
                            fullWidth
                            disabled={
                              !canEdit ||
                              typeOptions(
                                (watchedEntries?.[index]?.kind as HygieneEntryKind) ||
                                  "BASIC_SERVICE",
                              ).length === 0
                            }
                          >
                            <InputLabel id={`hygiene-type-${index}`}>
                              Tipo catalogado
                            </InputLabel>
                            <Select
                              labelId={`hygiene-type-${index}`}
                              label="Tipo catalogado"
                              defaultValue=""
                              {...register(`hygieneEntries.${index}.typeId`)}
                            >
                              <MenuItem value="">Sin seleccionar</MenuItem>
                              {typeOptions(
                                (watchedEntries?.[index]?.kind as HygieneEntryKind) ||
                                  "BASIC_SERVICE",
                              ).map((option) => (
                                <MenuItem key={option.id} value={String(option.id)}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                          <Tooltip title="Eliminar registro">
                            <IconButton
                              type="button"
                              aria-label={`Eliminar registro ${index + 1}`}
                              disabled={!canEdit}
                              onClick={() => removeEntry(index)}
                              sx={{ mt: { md: 1 } }}
                            >
                              <DeleteOutlineRounded />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            label="Nombre alternativo (otro)"
                            fullWidth
                            disabled={!canEdit || !detailEnabled}
                            {...register(`hygieneEntries.${index}.name`, {
                              maxLength: { value: 180, message: "Máximo 180 caracteres" },
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            label="Proveedor"
                            fullWidth
                            disabled={!canEdit || !detailEnabled}
                            {...register(`hygieneEntries.${index}.provider`, {
                              maxLength: { value: 180, message: "Máximo 180 caracteres" },
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            label="Especificación o detalle"
                            fullWidth
                            disabled={!canEdit || !detailEnabled}
                            {...register(`hygieneEntries.${index}.secondary`, {
                              maxLength: { value: 250, message: "Máximo 250 caracteres" },
                            })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <FormControl fullWidth disabled={!canEdit}>
                            <InputLabel id={`hygiene-response-${index}`}>
                              Respuesta
                            </InputLabel>
                            <Select
                              labelId={`hygiene-response-${index}`}
                              label="Respuesta"
                              defaultValue={EMPTY_RESPONSE}
                              {...register(`hygieneEntries.${index}.response`)}
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
                            disabled={!canEdit || !detailEnabled}
                            slotProps={{ htmlInput: { min: 0, step: 1 } }}
                            {...register(`hygieneEntries.${index}.quantity`, {
                              validate: (value) =>
                                !value.trim() ||
                                (Number.isInteger(Number(value)) && Number(value) >= 0)
                                  ? true
                                  : "Usa un entero no negativo",
                            })}
                          />
                        </Grid>
                        {((watchedEntries?.[index]?.kind as HygieneEntryKind) ||
                          "BASIC_SERVICE") === "SIGNAGE" ? (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl
                              fullWidth
                              disabled={
                                !canEdit ||
                                (catalogs?.signageMaterials.length ?? 0) === 0 ||
                                response !== "SI"
                              }
                            >
                              <InputLabel id={`hygiene-material-${index}`}>
                                Material de señalética
                              </InputLabel>
                              <Select
                                labelId={`hygiene-material-${index}`}
                                label="Material de señalética"
                                defaultValue=""
                                {...register(`hygieneEntries.${index}.secondaryId`)}
                              >
                                <MenuItem value="">Sin seleccionar</MenuItem>
                                {(catalogs?.signageMaterials ?? []).map((option) => (
                                  <MenuItem key={option.id} value={String(option.id)}>
                                    {option.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        ) : null}
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                          <FormControl fullWidth disabled={!canEdit || !detailEnabled}>
                            <InputLabel id={`hygiene-condition-${index}`}>
                              Condición
                            </InputLabel>
                            <Select
                              labelId={`hygiene-condition-${index}`}
                              label="Condición"
                              defaultValue=""
                              {...register(`hygieneEntries.${index}.condition`)}
                            >
                              <MenuItem value="">Sin registrar</MenuItem>
                              <MenuItem value="BUENO">Bueno</MenuItem>
                              <MenuItem value="REGULAR">Regular</MenuItem>
                              <MenuItem value="MALO">Malo</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={12}>
                          <TextField
                            label="Observación"
                            fullWidth
                            disabled={!canEdit}
                            {...register(`hygieneEntries.${index}.observation`, {
                              maxLength: {
                                value: 1_000,
                                message: "Máximo 1.000 caracteres",
                              },
                            })}
                          />
                        </Grid>
                      </>
                    );
                  })()}
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Radios portátiles</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            {(
              [
                ["available", "¿Hay radios disponibles?"],
                ["visitorUse", "Uso para visitantes"],
                ["internalUse", "Uso interno"],
                ["emergencyUse", "Uso en emergencias"],
              ] as const
            ).map(([key, label]) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl
                  fullWidth
                  disabled={
                    !canEdit || (key !== "available" && watchedRadios?.available !== "SI")
                  }
                >
                  <InputLabel id={`radios-${key}`}>{label}</InputLabel>
                  <Select
                    labelId={`radios-${key}`}
                    label={label}
                    defaultValue={EMPTY_RESPONSE}
                    {...register(`hygieneRadios.${key}`)}
                  >
                    {SECTION_RESPONSE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Cantidad de radios"
                type="number"
                fullWidth
                disabled={!canEdit || watchedRadios?.available !== "SI"}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("hygieneRadios.quantity", {
                  validate: (value) =>
                    !value.trim() ||
                    (Number.isInteger(Number(value)) && Number(value) >= 0)
                      ? true
                      : "Usa un entero no negativo",
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Observación de radios"
                fullWidth
                disabled={!canEdit || watchedRadios?.available !== "SI"}
                {...register("hygieneRadios.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Plan de contingencia</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="contingency-exists">¿Existe un plan?</InputLabel>
                <Select
                  labelId="contingency-exists"
                  label="¿Existe un plan?"
                  defaultValue={EMPTY_RESPONSE}
                  {...register("hygieneContingency.exists")}
                >
                  {SECTION_RESPONSE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Institución responsable"
                fullWidth
                disabled={!canEdit || watchedContingency?.exists !== "SI"}
                {...register("hygieneContingency.institution", {
                  maxLength: { value: 180, message: "Máximo 180 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Año"
                type="number"
                fullWidth
                disabled={!canEdit || watchedContingency?.exists !== "SI"}
                slotProps={{ htmlInput: { min: 1900, max: 2200, step: 1 } }}
                {...register("hygieneContingency.year", {
                  validate: (value) =>
                    !value.trim() ||
                    (Number.isInteger(Number(value)) &&
                      Number(value) >= 1900 &&
                      Number(value) <= 2200)
                      ? true
                      : "Usa un año entre 1900 y 2200",
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Año
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Nombre del documento u observación"
                fullWidth
                disabled={!canEdit || watchedContingency?.exists !== "SI"}
                {...register("hygieneContingency.document", {
                  maxLength: { value: 250, message: "Máximo 250 caracteres" },
                })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observación del plan"
                fullWidth
                multiline
                minRows={2}
                disabled={!canEdit}
                {...register("hygieneContingency.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>
    </Stack>
  );
}

const POLICY_DEFINITIONS = [
  {
    code: "PLAN_DESARROLLO_GAD",
    question: "¿El atractivo está incluido en el plan de desarrollo turístico del GAD?",
  },
  {
    code: "PLANIFICACION_TERRITORIAL",
    question: "¿El atractivo está incluido en la planificación territorial?",
  },
  {
    code: "REGULACIONES_APLICABLES",
    question: "¿Existen regulaciones específicas aplicables al atractivo?",
  },
  {
    code: "ORDENANZAS_APLICABLES",
    question: "¿Existen ordenanzas aplicables al atractivo?",
  },
] as const;

function PoliciesSectionFields({
  canEdit,
  register,
  fields,
}: {
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
  fields: Array<{ id: string }>;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Box>
        <Typography variant="subtitle1">Políticas institucionales</Typography>
        <Typography variant="body2" color="text.secondary">
          Responde las cuatro preguntas de la ficha y conserva año, especificación y
          observación sin convertir una ausencia de dato en una respuesta negativa.
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {fields.map((field, index) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ pt: 1 }}>
                  {POLICY_DEFINITIONS[index]?.question ?? "Pregunta institucional"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`policy-response-${index}`}>Respuesta</InputLabel>
                  <Select
                    labelId={`policy-response-${index}`}
                    label="Respuesta"
                    defaultValue={EMPTY_RESPONSE}
                    {...register(`policies.${index}.response`)}
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
                  label="Año"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 1900, max: 2200, step: 1 } }}
                  {...register(`policies.${index}.year`, {
                    validate: (value) =>
                      !value.trim() ||
                      (Number.isInteger(Number(value)) &&
                        Number(value) >= 1900 &&
                        Number(value) <= 2200)
                        ? true
                        : "Usa un año entre 1900 y 2200",
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  label="Especificación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`policies.${index}.specification`, {
                    maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                  })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`policies.${index}.observation`, {
                    maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                  })}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        ))}
      </Stack>
    </Stack>
  );
}

function PromotionSectionFields({
  catalogs,
  canEdit,
  control,
  register,
  mediaFields,
  appendMedia,
  removeMedia,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  control: Control<SectionFormValues>;
  register: UseFormRegister<SectionFormValues>;
  mediaFields: Array<{ id: string }>;
  appendMedia: (value: PromotionMediaForm) => void;
  removeMedia: (index: number) => void;
}) {
  const mediaTypes = catalogs?.promotionMediaTypes ?? [];
  const promotion = useWatch({ control, name: "promotion" });
  const watchedMedia = useWatch({ control, name: "promotionMedia" });
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Promoción y comercialización</Typography>
        <Typography variant="body2" color="text.secondary">
          Separa la existencia del plan, su inclusión institucional, los paquetes y los
          medios de promoción utilizados.
        </Typography>
      </Box>
      <FlatSurface padding="compact" tone="subtle">
        <Grid container spacing={webTokens.spacing.control}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth disabled={!canEdit}>
              <InputLabel id="promotion-has-plan">¿Tiene plan?</InputLabel>
              <Select
                labelId="promotion-has-plan"
                label="¿Tiene plan?"
                defaultValue={EMPTY_RESPONSE}
                {...register("promotion.hasPlan")}
              >
                {SECTION_RESPONSE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Nombre del plan"
              fullWidth
              disabled={!canEdit || promotion?.hasPlan !== "SI"}
              {...register("promotion.planName", {
                maxLength: { value: 250, message: "Máximo 250 caracteres" },
              })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth disabled={!canEdit || promotion?.hasPlan !== "SI"}>
              <InputLabel id="promotion-included">¿Está incluido en un plan?</InputLabel>
              <Select
                labelId="promotion-included"
                label="¿Está incluido en un plan?"
                defaultValue={EMPTY_RESPONSE}
                {...register("promotion.includedInPlan")}
              >
                {SECTION_RESPONSE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </FlatSurface>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Medios de promoción</Typography>
            <Typography variant="body2" color="text.secondary">
              Registra página, red social, feria u otro medio con nombre, URL y
              periodicidad.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendMedia({
                response: EMPTY_RESPONSE,
                typeId: "",
                name: "",
                url: "",
                periodicity: "",
                detailOther: "",
                observation: "",
              })
            }
          >
            Añadir medio
          </Button>
        </Stack>
        {mediaFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay medios registrados.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {mediaFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`promotion-media-response-${index}`}>
                        Utilizado
                      </InputLabel>
                      <Select
                        labelId={`promotion-media-response-${index}`}
                        label="Utilizado"
                        defaultValue={EMPTY_RESPONSE}
                        {...register(`promotionMedia.${index}.response`)}
                      >
                        {SECTION_RESPONSE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl
                      fullWidth
                      disabled={
                        !canEdit ||
                        mediaTypes.length === 0 ||
                        watchedMedia?.[index]?.response !== "SI"
                      }
                    >
                      <InputLabel id={`promotion-media-type-${index}`}>
                        Tipo de medio
                      </InputLabel>
                      <Select
                        labelId={`promotion-media-type-${index}`}
                        label="Tipo de medio"
                        defaultValue=""
                        {...register(`promotionMedia.${index}.typeId`)}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {mediaTypes.map((type) => (
                          <MenuItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Nombre o cuenta"
                      fullWidth
                      disabled={!canEdit || watchedMedia?.[index]?.response !== "SI"}
                      {...register(`promotionMedia.${index}.name`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="URL"
                      type="url"
                      fullWidth
                      disabled={!canEdit || watchedMedia?.[index]?.response !== "SI"}
                      {...register(`promotionMedia.${index}.url`, {
                        maxLength: { value: 500, message: "Máximo 500 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                    <Tooltip title="Eliminar medio">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar medio ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeMedia(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Periodicidad"
                      fullWidth
                      disabled={!canEdit || watchedMedia?.[index]?.response !== "SI"}
                      {...register(`promotionMedia.${index}.periodicity`, {
                        maxLength: { value: 100, message: "Máximo 100 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Detalle de otro medio"
                      fullWidth
                      disabled={!canEdit || watchedMedia?.[index]?.response !== "SI"}
                      {...register(`promotionMedia.${index}.detailOther`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Observación del medio"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`promotionMedia.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>

      <FlatSurface padding="compact" tone="subtle">
        <Grid container spacing={webTokens.spacing.control}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth disabled={!canEdit}>
              <InputLabel id="promotion-package">¿Forma parte de un paquete?</InputLabel>
              <Select
                labelId="promotion-package"
                label="¿Forma parte de un paquete?"
                defaultValue={EMPTY_RESPONSE}
                {...register("promotion.partOfPackage")}
              >
                {SECTION_RESPONSE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <TextField
              label="Detalle del paquete"
              fullWidth
              multiline
              minRows={2}
              disabled={!canEdit || promotion?.partOfPackage !== "SI"}
              {...register("promotion.packageDetail", {
                maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
              })}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Observación de promoción"
              fullWidth
              multiline
              minRows={2}
              disabled={!canEdit}
              {...register("promotion.observation", {
                maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
              })}
            />
          </Grid>
        </Grid>
      </FlatSurface>
    </Stack>
  );
}

function VisitorsSectionFields({
  canEdit,
  control,
  register,
  seasonFields,
  originFields,
  informantFields,
  appendSeason,
  removeSeason,
  appendOrigin,
  removeOrigin,
  appendInformant,
  removeInformant,
}: {
  canEdit: boolean;
  control: Control<SectionFormValues>;
  register: UseFormRegister<SectionFormValues>;
  seasonFields: Array<{ id: string }>;
  originFields: Array<{ id: string }>;
  informantFields: Array<{ id: string }>;
  appendSeason: (value: VisitorSeasonForm) => void;
  removeSeason: (index: number) => void;
  appendOrigin: (value: VisitorOriginForm) => void;
  removeOrigin: (index: number) => void;
  appendInformant: (value: VisitorInformantForm) => void;
  removeInformant: (index: number) => void;
}) {
  const registry = useWatch({ control, name: "visitorRegistry" });
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Visitantes y afluencia</Typography>
        <Typography variant="body2" color="text.secondary">
          Conserva registro, temporadas, procedencias, informantes y afluencia como datos
          separados; una cantidad cero no se confunde con ausencia de información.
        </Typography>
      </Box>

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Registro de visitantes</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="visitor-registry-exists">¿Existe registro?</InputLabel>
                <Select
                  labelId="visitor-registry-exists"
                  label="¿Existe registro?"
                  defaultValue={EMPTY_RESPONSE}
                  {...register("visitorRegistry.exists")}
                >
                  {SECTION_RESPONSE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="visitor-registry-type">Tipo de registro</InputLabel>
                <Select
                  labelId="visitor-registry-type"
                  label="Tipo de registro"
                  defaultValue=""
                  disabled={!canEdit || registry?.exists !== "SI"}
                  {...register("visitorRegistry.type")}
                >
                  <MenuItem value="">Sin seleccionar</MenuItem>
                  <MenuItem value="DIGITAL">Digital</MenuItem>
                  <MenuItem value="PAPEL">Papel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Años de registro"
                type="number"
                fullWidth
                disabled={!canEdit || registry?.exists !== "SI"}
                slotProps={{ htmlInput: { min: 0, max: 200, step: 1 } }}
                {...register("visitorRegistry.years", {
                  validate: (value) =>
                    !value.trim() ||
                    (Number.isInteger(Number(value)) &&
                      Number(value) >= 0 &&
                      Number(value) <= 200)
                      ? true
                      : "Usa un entero entre 0 y 200",
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="visitor-registry-reports">¿Genera reportes?</InputLabel>
                <Select
                  labelId="visitor-registry-reports"
                  label="¿Genera reportes?"
                  defaultValue={EMPTY_RESPONSE}
                  disabled={!canEdit || registry?.exists !== "SI"}
                  {...register("visitorRegistry.reports")}
                >
                  {SECTION_RESPONSE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Frecuencia de reportes"
                fullWidth
                disabled={!canEdit || registry?.reports !== "SI"}
                {...register("visitorRegistry.frequency", {
                  maxLength: { value: 80, message: "Máximo 80 caracteres" },
                })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observación del registro"
                fullWidth
                disabled={!canEdit}
                {...register("visitorRegistry.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <VisitorRepeatableBlock
        title="Temporadas de visitación"
        description="Registra temporadas altas o bajas, cantidad, año y meses separados por coma."
        emptyLabel="No hay temporadas registradas."
        addLabel="Añadir temporada"
        canEdit={canEdit}
        fields={seasonFields}
        onAdd={() =>
          appendSeason({
            type: "ALTA",
            quantity: "",
            year: "",
            months: "",
            observation: "",
          })
        }
        render={(index, field) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`season-type-${index}`}>Temporada</InputLabel>
                  <Select
                    labelId={`season-type-${index}`}
                    label="Temporada"
                    defaultValue="ALTA"
                    {...register(`visitorSeasons.${index}.type`)}
                  >
                    <MenuItem value="ALTA">Alta</MenuItem>
                    <MenuItem value="BAJA">Baja</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Cantidad"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  {...register(`visitorSeasons.${index}.quantity`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  label="Año"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 1900, max: 2200, step: 1 } }}
                  {...register(`visitorSeasons.${index}.year`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Meses (1,2,…)"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorSeasons.${index}.months`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }}>
                <Tooltip title="Eliminar temporada">
                  <IconButton
                    type="button"
                    aria-label={`Eliminar temporada ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeSeason(index)}
                    sx={{ mt: { md: 1 } }}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorSeasons.${index}.observation`)}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        )}
      />

      <VisitorRepeatableBlock
        title="Procedencias"
        description="Para procedencia nacional indica la ciudad; para extranjera, el país."
        emptyLabel="No hay procedencias registradas."
        addLabel="Añadir procedencia"
        canEdit={canEdit}
        fields={originFields}
        onAdd={() =>
          appendOrigin({
            type: "NACIONAL",
            place: "",
            month: "",
            year: "",
            quantity: "",
            observation: "",
          })
        }
        render={(index, field) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel id={`origin-type-${index}`}>Procedencia</InputLabel>
                  <Select
                    labelId={`origin-type-${index}`}
                    label="Procedencia"
                    defaultValue="NACIONAL"
                    {...register(`visitorOrigins.${index}.type`)}
                  >
                    <MenuItem value="NACIONAL">Nacional</MenuItem>
                    <MenuItem value="EXTRANJERA">Extranjera</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ciudad o país"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorOrigins.${index}.place`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1.5 }}>
                <TextField
                  label="Mes"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 1, max: 12, step: 1 } }}
                  {...register(`visitorOrigins.${index}.month`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1.5 }}>
                <TextField
                  label="Año"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 1900, max: 2200, step: 1 } }}
                  {...register(`visitorOrigins.${index}.year`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1.5 }}>
                <TextField
                  label="Cantidad"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  {...register(`visitorOrigins.${index}.quantity`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 0.5 }}>
                <Tooltip title="Eliminar procedencia">
                  <IconButton
                    type="button"
                    aria-label={`Eliminar procedencia ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeOrigin(index)}
                    sx={{ mt: { md: 1 } }}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorOrigins.${index}.observation`)}
                />
              </Grid>
            </Grid>
          </FlatSurface>
        )}
      />

      <VisitorRepeatableBlock
        title="Informantes clave"
        description="Registra la persona que aportó la información y un contacto opcional."
        emptyLabel="No hay informantes registrados."
        addLabel="Añadir informante"
        canEdit={canEdit}
        fields={informantFields}
        onAdd={() => appendInformant({ name: "", contact: "", observation: "" })}
        render={(index, field) => (
          <FlatSurface key={field.id} padding="compact" tone="subtle">
            <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Nombre"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorInformants.${index}.name`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Contacto"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorInformants.${index}.contact`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Observación"
                  fullWidth
                  disabled={!canEdit}
                  {...register(`visitorInformants.${index}.observation`)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Tooltip title="Eliminar informante">
                  <IconButton
                    type="button"
                    aria-label={`Eliminar informante ${index + 1}`}
                    disabled={!canEdit}
                    onClick={() => removeInformant(index)}
                    sx={{ mt: { md: 1 } }}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </FlatSurface>
        )}
      />

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Afluencia habitual</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Entre semana"
                type="number"
                fullWidth
                disabled={!canEdit}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("visitorInflux.weekday")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Fin de semana"
                type="number"
                fullWidth
                disabled={!canEdit}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("visitorInflux.weekend")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Feriados"
                type="number"
                fullWidth
                disabled={!canEdit}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("visitorInflux.holidays")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="visitor-influx-frequency">Frecuencia</InputLabel>
                <Select
                  labelId="visitor-influx-frequency"
                  label="Frecuencia"
                  defaultValue=""
                  {...register("visitorInflux.frequency")}
                >
                  <MenuItem value="">Sin seleccionar</MenuItem>
                  <MenuItem value="PERMANENTE">Permanente</MenuItem>
                  <MenuItem value="ESTACIONAL">Estacional</MenuItem>
                  <MenuItem value="ESPORADICA">Esporádica</MenuItem>
                  <MenuItem value="INEXISTENTE">Inexistente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observación de afluencia"
                fullWidth
                disabled={!canEdit}
                {...register("visitorInflux.observation")}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>
    </Stack>
  );
}

function VisitorRepeatableBlock({
  title,
  description,
  emptyLabel,
  addLabel,
  canEdit,
  fields,
  onAdd,
  render,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  addLabel: string;
  canEdit: boolean;
  fields: Array<{ id: string }>;
  onAdd: () => void;
  render: (index: number, field: { id: string }) => React.ReactNode;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={1}
      >
        <Box>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<AddRounded />}
          disabled={!canEdit}
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </Stack>
      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      ) : (
        <Stack spacing={1.5}>{fields.map((field, index) => render(index, field))}</Stack>
      )}
    </Stack>
  );
}

function HumanResourcesSectionFields({
  catalogs,
  canEdit,
  register,
  trainingFields,
  appendTraining,
  removeTraining,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
  trainingFields: Array<{ id: string }>;
  appendTraining: (value: HumanResourceTrainingForm) => void;
  removeTraining: (index: number) => void;
}) {
  const trainingTypes = catalogs?.trainingTypes ?? [];
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Recurso humano</Typography>
        <Typography variant="body2" color="text.secondary">
          Registra el resumen del personal y la formación, capacitación e idiomas
          disponibles en el mismo centro turístico.
        </Typography>
      </Box>
      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Resumen del personal</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Administración y operación"
                type="number"
                fullWidth
                disabled={!canEdit}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("humanResourceSummary.administrationOperation", {
                  validate: (value) =>
                    !value.trim() ||
                    (Number.isInteger(Number(value)) && Number(value) >= 0)
                      ? true
                      : "Usa un entero no negativo",
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Personal especializado en turismo"
                type="number"
                fullWidth
                disabled={!canEdit}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register("humanResourceSummary.specializedTourism", {
                  validate: (value) =>
                    !value.trim() ||
                    (Number.isInteger(Number(value)) && Number(value) >= 0)
                      ? true
                      : "Usa un entero no negativo",
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Observación"
                fullWidth
                disabled={!canEdit}
                {...register("humanResourceSummary.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Formación y capacidades</Typography>
            <Typography variant="body2" color="text.secondary">
              Agrupa educación, capacitación e idiomas y conserva la cantidad de personas.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendTraining({
                group: "EDUCACION",
                typeId: "",
                name: "",
                quantity: "",
                detailOther: "",
                observation: "",
              })
            }
          >
            Añadir formación
          </Button>
        </Stack>
        {trainingFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay formación registrada.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {trainingFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`human-resource-group-${index}`}>Grupo</InputLabel>
                      <Select
                        labelId={`human-resource-group-${index}`}
                        label="Grupo"
                        defaultValue="EDUCACION"
                        {...register(`humanResourceTraining.${index}.group`)}
                      >
                        <MenuItem value="EDUCACION">Educación</MenuItem>
                        <MenuItem value="CAPACITACION">Capacitación</MenuItem>
                        <MenuItem value="IDIOMA">Idioma</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl
                      fullWidth
                      disabled={!canEdit || trainingTypes.length === 0}
                    >
                      <InputLabel id={`human-resource-type-${index}`}>
                        Tipo de formación
                      </InputLabel>
                      <Select
                        labelId={`human-resource-type-${index}`}
                        label="Tipo de formación"
                        defaultValue=""
                        {...register(`humanResourceTraining.${index}.typeId`)}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {trainingTypes.map((type) => (
                          <MenuItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Formación, curso o idioma"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`humanResourceTraining.${index}.name`, {
                        maxLength: { value: 140, message: "Máximo 140 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                    <TextField
                      label="Personas"
                      type="number"
                      fullWidth
                      disabled={!canEdit}
                      slotProps={{ htmlInput: { min: 0, step: 1 } }}
                      {...register(`humanResourceTraining.${index}.quantity`, {
                        validate: (value) =>
                          !value.trim() ||
                          (Number.isInteger(Number(value)) && Number(value) >= 0)
                            ? true
                            : "Usa un entero no negativo",
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                    <Tooltip title="Eliminar formación">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar formación ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeTraining(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Detalle de otro"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`humanResourceTraining.${index}.detailOther`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Observación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`humanResourceTraining.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

function AnnexesSectionFields({
  catalogs,
  canEdit,
  register,
  mediaItems,
  documentFields,
  responsibleFields,
  appendDocument,
  removeDocument,
  appendResponsible,
  removeResponsible,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
  mediaItems: AdminMediaItem[];
  documentFields: Array<{ id: string }>;
  responsibleFields: Array<{ id: string }>;
  appendDocument: (value: AnnexDocumentForm) => void;
  removeDocument: (index: number) => void;
  appendResponsible: (value: AnnexResponsibleForm) => void;
  removeResponsible: (index: number) => void;
}) {
  const responsibilityTypes = catalogs?.responsibilityTypes ?? [];
  const documentMedia = mediaItems.filter((item) =>
    ["MAPA", "PLAN_CONTINGENCIA", "OTRO"].includes(item.typeCode),
  );
  return (
    <Stack spacing={webTokens.spacing.section}>
      <Box>
        <Typography variant="subtitle1">Anexos y responsabilidades</Typography>
        <Typography variant="body2" color="text.secondary">
          Los anexos conservan una visibilidad explícita. Los archivos binarios se
          gestionan en el módulo multimedia; aquí se registra su contexto institucional.
        </Typography>
      </Box>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Anexos documentales</Typography>
            <Typography variant="body2" color="text.secondary">
              No mezcles documentos restringidos con material que pueda publicarse.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendDocument({
                fileId: "",
                type: "",
                source: "",
                author: "",
                description: "",
                visibility: "ADMINISTRATIVA",
                observation: "",
              })
            }
          >
            Añadir anexo
          </Button>
        </Stack>
        {documentFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay anexos registrados.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {documentFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl
                      fullWidth
                      disabled={!canEdit || documentMedia.length === 0}
                    >
                      <InputLabel id={`annex-file-${index}`}>Archivo cargado</InputLabel>
                      <Select
                        labelId={`annex-file-${index}`}
                        label="Archivo cargado"
                        defaultValue=""
                        {...register(`annexDocuments.${index}.fileId`)}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {documentMedia.map((item) => (
                          <MenuItem key={item.id} value={String(item.id)}>
                            {item.typeName} · {item.originalName}
                            {item.state === "PENDIENTE" ? " (pendiente)" : ""}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label="Tipo de anexo"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexDocuments.${index}.type`, {
                        required: "Indica el tipo",
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label="Fuente"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexDocuments.${index}.source`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label="Autor"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexDocuments.${index}.author`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControl fullWidth disabled={!canEdit}>
                      <InputLabel id={`annex-visibility-${index}`}>
                        Visibilidad
                      </InputLabel>
                      <Select
                        labelId={`annex-visibility-${index}`}
                        label="Visibilidad"
                        defaultValue="ADMINISTRATIVA"
                        {...register(`annexDocuments.${index}.visibility`)}
                      >
                        <MenuItem value="PUBLICA">Pública</MenuItem>
                        <MenuItem value="ADMINISTRATIVA">Administrativa</MenuItem>
                        <MenuItem value="RESTRINGIDA">Restringida</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                    <Tooltip title="Eliminar anexo">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar anexo ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeDocument(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      label="Descripción"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexDocuments.${index}.description`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Observación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexDocuments.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>

      <Stack spacing={webTokens.spacing.control}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1">Responsables de la ficha</Typography>
            <Typography variant="body2" color="text.secondary">
              Estos contactos son administrativos y no se muestran en la ficha pública.
            </Typography>
          </Box>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<AddRounded />}
            disabled={!canEdit}
            onClick={() =>
              appendResponsible({
                typeId: "",
                name: "",
                role: "",
                institution: "",
                phone: "",
                email: "",
                observation: "",
              })
            }
          >
            Añadir responsable
          </Button>
        </Stack>
        {responsibleFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay responsables registrados.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {responsibleFields.map((field, index) => (
              <FlatSurface key={field.id} padding="compact" tone="subtle">
                <Grid
                  container
                  spacing={webTokens.spacing.control}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl
                      fullWidth
                      disabled={!canEdit || responsibilityTypes.length === 0}
                    >
                      <InputLabel id={`annex-responsibility-type-${index}`}>
                        Responsabilidad
                      </InputLabel>
                      <Select
                        labelId={`annex-responsibility-type-${index}`}
                        label="Responsabilidad"
                        defaultValue=""
                        {...register(`annexResponsibles.${index}.typeId`)}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {responsibilityTypes.map((type) => (
                          <MenuItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label="Nombre"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.name`, {
                        required: "Indica el nombre",
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <TextField
                      label="Cargo"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.role`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label="Institución"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.institution`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={12} />
                  <Grid size={{ xs: 12, sm: 5, md: 2 }}>
                    <TextField
                      label="Teléfono"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.phone`, {
                        maxLength: { value: 180, message: "Máximo 180 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 10, sm: 6, md: 1.5 }}>
                    <TextField
                      label="Correo"
                      type="email"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.email`, {
                        maxLength: { value: 254, message: "Máximo 254 caracteres" },
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1, md: 0.5 }}>
                    <Tooltip title="Eliminar responsable">
                      <IconButton
                        type="button"
                        aria-label={`Eliminar responsable ${index + 1}`}
                        disabled={!canEdit}
                        onClick={() => removeResponsible(index)}
                        sx={{ mt: { md: 1 } }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Observación"
                      fullWidth
                      disabled={!canEdit}
                      {...register(`annexResponsibles.${index}.observation`, {
                        maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                      })}
                    />
                  </Grid>
                </Grid>
              </FlatSurface>
            ))}
          </Stack>
        )}
      </Stack>

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Levantamiento de accesibilidad</Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                disabled={!canEdit}
                InputLabelProps={{ shrink: true }}
                {...register("accessibilitySurvey.date")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Responsable del levantamiento"
                fullWidth
                disabled={!canEdit}
                {...register("accessibilitySurvey.responsible", {
                  maxLength: { value: 250, message: "Máximo 250 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Ámbito"
                fullWidth
                disabled={!canEdit}
                {...register("accessibilitySurvey.scope", {
                  maxLength: { value: 250, message: "Máximo 250 caracteres" },
                })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observación"
                fullWidth
                disabled={!canEdit}
                {...register("accessibilitySurvey.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <FlatSurface padding="compact" tone="subtle">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="subtitle1">Validación del GAD</Typography>
          <Typography variant="body2" color="text.secondary">
            Esta validación es institucional y permanece administrativa hasta una
            publicación aprobada.
          </Typography>
          <Grid container spacing={webTokens.spacing.control}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel id="gad-acceptance">¿Acepta publicación?</InputLabel>
                <Select
                  labelId="gad-acceptance"
                  label="¿Acepta publicación?"
                  defaultValue={EMPTY_RESPONSE}
                  {...register("gadValidation.acceptance")}
                >
                  {SECTION_RESPONSE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Nombre del validador"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.name", {
                  maxLength: { value: 180, message: "Máximo 180 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Institución"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.institution", {
                  maxLength: { value: 180, message: "Máximo 180 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Cargo"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.position", {
                  maxLength: { value: 180, message: "Máximo 180 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Teléfono"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.phone", {
                  maxLength: { value: 180, message: "Máximo 180 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Correo"
                type="email"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.email", {
                  maxLength: { value: 254, message: "Máximo 254 caracteres" },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                disabled={!canEdit}
                InputLabelProps={{ shrink: true }}
                {...register("gadValidation.date")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Observación"
                fullWidth
                disabled={!canEdit}
                {...register("gadValidation.observation", {
                  maxLength: { value: 1_000, message: "Máximo 1.000 caracteres" },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>
    </Stack>
  );
}

function CharacteristicsSectionFields({
  catalogs,
  canEdit,
  register,
}: {
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Typography variant="subtitle1">Clima y rangos observados</Typography>
      <Grid container spacing={webTokens.spacing.control}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth disabled={!canEdit}>
            <InputLabel id="section-climate-label">Tipo de clima</InputLabel>
            <Select
              labelId="section-climate-label"
              label="Tipo de clima"
              defaultValue=""
              {...register("climateId")}
            >
              <MenuItem value="">Sin seleccionar</MenuItem>
              {(catalogs?.climates ?? []).map((climate) => (
                <MenuItem key={climate.id} value={String(climate.id)}>
                  {climate.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Temperatura mínima (°C)"
            type="number"
            fullWidth
            disabled={!canEdit}
            slotProps={{ htmlInput: { step: 0.1 } }}
            {...register("minTemperature", { valueAsNumber: false })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Temperatura máxima (°C)"
            type="number"
            fullWidth
            disabled={!canEdit}
            slotProps={{ htmlInput: { step: 0.1 } }}
            {...register("maxTemperature", { valueAsNumber: false })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Precipitación mínima (mm)"
            type="number"
            fullWidth
            disabled={!canEdit}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            {...register("minRainfall", { valueAsNumber: false })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Precipitación máxima (mm)"
            type="number"
            fullWidth
            disabled={!canEdit}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            {...register("maxRainfall", { valueAsNumber: false })}
          />
        </Grid>
      </Grid>
    </Stack>
  );
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
    localityId:
      typeof record?.localityId === "number" || typeof record?.localityId === "string"
        ? String(record.localityId)
        : "",
    distanceKm:
      typeof record?.distanceKm === "number" || typeof record?.distanceKm === "string"
        ? String(record.distanceKm)
        : "",
    accessibilityRoads: readAccessibilityRoads(record?.accessibilityDetails),
    accessibilityAquatic: readAccessibilityAquatic(record?.accessibilityDetails),
    accessibilityAerial: readAccessibilityAerial(record?.accessibilityDetails),
    accessibilityTransportTypes: readAccessibilityTransportTypes(
      record?.accessibilityDetails,
    ),
    accessibilityTransportDetails: readAccessibilityTransportDetails(
      record?.accessibilityDetails,
    ),
    accessibilityCriteria: readAccessibilityCriteria(record?.accessibilityDetails),
    accessibilitySignage: readAccessibilitySignage(record?.accessibilityDetails),
    plant: readPlant(record?.plant),
    facilityDetails: readFacilityDetails(record?.facilitiesDetails),
    complementaryServices: readComplementaryServices(record?.complementaryServices),
    climateId: readNestedValue(record?.climate, "climateId"),
    minTemperature: readNestedValue(record?.climate, "minTemperature"),
    maxTemperature: readNestedValue(record?.climate, "maxTemperature"),
    minRainfall: readNestedValue(record?.climate, "minRainfall"),
    maxRainfall: readNestedValue(record?.climate, "maxRainfall"),
    rows,
    conservation: {
      attraction: readConservationComponent(record?.conservation, "attraction"),
      environment: readConservationComponent(record?.conservation, "environment"),
    },
    conservationFactors: readConservationFactors(record?.conservation),
    declarations: readDeclarations(record?.declarations),
    hygieneEntries: readHygieneEntries(record?.hygieneSafety),
    hygieneRadios: readHygieneRadios(record?.hygieneSafety),
    hygieneContingency: readHygieneContingency(record?.hygieneSafety),
    policies: readPolicies(record?.policies),
    promotion: readPromotion(record?.promotion),
    promotionMedia: readPromotionMedia(record?.promotion),
    visitorRegistry: readVisitorRegistry(record?.visitors),
    visitorSeasons: readVisitorSeasons(record?.visitors),
    visitorOrigins: readVisitorOrigins(record?.visitors),
    visitorInformants: readVisitorInformants(record?.visitors),
    visitorInflux: readVisitorInflux(record?.visitors),
    humanResourceSummary: readHumanResourceSummary(record?.humanResources),
    humanResourceTraining: readHumanResourceTraining(record?.humanResources),
    annexDocuments: readAnnexDocuments(record?.annexes),
    annexResponsibles: readAnnexResponsibles(record?.annexes),
    accessibilitySurvey: readAccessibilitySurvey(record?.annexes),
    gadValidation: readGadValidation(record?.annexes),
  };
}

function toSectionContent(
  sectionCode: AdminCenterSectionCode,
  values: SectionFormValues,
) {
  return {
    schemaVersion: 1,
    response: values.response,
    observation: values.observation.trim(),
    ...(sectionCode === "accesibilidad"
      ? {
          localityId: values.localityId.trim() ? Number(values.localityId) : null,
          distanceKm: values.distanceKm.trim() ? Number(values.distanceKm) : null,
          accessibilityDetails: {
            roads: values.accessibilityRoads.map((road) => ({
              roadTypeId: toNullableInteger(road.roadTypeId),
              typeLabel: road.typeLabel.trim(),
              startLatitude: toNullableNumber(road.startLatitude),
              startLongitude: toNullableNumber(road.startLongitude),
              endLatitude: toNullableNumber(road.endLatitude),
              endLongitude: toNullableNumber(road.endLongitude),
              distanceKm: toNullableNumber(road.distanceKm),
              materialId: toNullableInteger(road.materialId),
              conditionId: toNullableInteger(road.conditionId),
              observation: road.observation.trim(),
            })),
            aquatic: values.accessibilityAquatic.map((access) => ({
              modalityId: toNullableInteger(access.modalityId),
              modalityLabel: access.modalityLabel.trim(),
              departure: access.departure.trim(),
              departureConditionId: toNullableInteger(access.departureConditionId),
              arrival: access.arrival.trim(),
              arrivalConditionId: toNullableInteger(access.arrivalConditionId),
              observation: access.observation.trim(),
            })),
            aerial: values.accessibilityAerial.map((access) => ({
              coverageId: toNullableInteger(access.coverageId),
              coverageLabel: access.coverageLabel.trim(),
              observation: access.observation.trim(),
            })),
            transportTypes: values.accessibilityTransportTypes.map((transport) => ({
              typeId: toNullableInteger(transport.typeId),
              label: transport.label.trim(),
              applies: transport.applies === "SI",
              detailOther: transport.detailOther.trim(),
              observation: transport.observation.trim(),
            })),
            transportDetails: values.accessibilityTransportDetails.map((detail) => ({
              operator: detail.operator.trim(),
              terminal: detail.terminal.trim(),
              frequencyId: toNullableInteger(detail.frequencyId),
              frequencyLabel: detail.frequencyLabel.trim(),
              transferDetail: detail.transferDetail.trim(),
              observation: detail.observation.trim(),
            })),
            criteria: values.accessibilityCriteria.map((criterion) => ({
              accessibilityTypeId: toNullableInteger(criterion.accessibilityTypeId),
              criterionId: toNullableInteger(criterion.criterionId),
              label: criterion.label.trim(),
              response: criterion.response,
              detail: criterion.detail.trim(),
              observation: criterion.observation.trim(),
            })),
            signage: {
              available: values.accessibilitySignage.available,
              conditionId: toNullableInteger(values.accessibilitySignage.conditionId),
              observation: values.accessibilitySignage.observation.trim(),
            },
          },
        }
      : {}),
    ...(sectionCode === "caracteristicas"
      ? {
          climate: {
            climateId: values.climateId.trim() ? Number(values.climateId) : null,
            minTemperature: toNullableNumber(values.minTemperature),
            maxTemperature: toNullableNumber(values.maxTemperature),
            minRainfall: toNullableNumber(values.minRainfall),
            maxRainfall: toNullableNumber(values.maxRainfall),
          },
        }
      : {}),
    ...(sectionCode === "planta"
      ? {
          plant: values.plant.map((item) => ({
            scope: item.scope,
            typeId: toNullableInteger(item.typeId),
            typeLabel: item.typeLabel.trim(),
            group: item.group.trim(),
            quantity1: toNullableInteger(item.quantity1),
            quantity2: toNullableInteger(item.quantity2),
            quantity3: toNullableInteger(item.quantity3),
            observation: item.observation.trim(),
          })),
          facilitiesDetails: values.facilityDetails.map((item) => ({
            categoryId: toNullableInteger(item.categoryId),
            typeId: toNullableInteger(item.typeId),
            typeLabel: item.typeLabel.trim(),
            quantity: toNullableInteger(item.quantity),
            latitude: toNullableNumber(item.latitude),
            longitude: toNullableNumber(item.longitude),
            administrator: item.administrator.trim(),
            universalAccessibility: item.universalAccessibility,
            conditionId: toNullableInteger(item.conditionId),
            detailOther: item.detailOther.trim(),
            observation: item.observation.trim(),
          })),
          complementaryServices: values.complementaryServices.map((item) => ({
            scope: item.scope,
            typeId: toNullableInteger(item.typeId),
            typeLabel: item.typeLabel.trim(),
            specification: item.specification.trim(),
            observation: item.observation.trim(),
          })),
        }
      : {}),
    ...(sectionCode === "conservacion"
      ? {
          conservation: {
            attraction: {
              state: values.conservation.attraction.state.trim() || null,
              observation: values.conservation.attraction.observation.trim(),
            },
            environment: {
              state: values.conservation.environment.state.trim() || null,
              observation: values.conservation.environment.observation.trim(),
            },
            factors: values.conservationFactors.map((factor) => ({
              component: factor.component,
              factorId: toNullableInteger(factor.factorId),
              origin: factor.origin,
              name: factor.name.trim(),
              response: factor.response,
              detailOther: factor.detailOther.trim(),
              observation: factor.observation.trim(),
            })),
          },
          declarations: values.declarations.map((declaration) => ({
            entity: declaration.entity.trim(),
            denomination: declaration.denomination.trim(),
            date: declaration.date.trim() || null,
            scope: declaration.scope.trim(),
            observation: declaration.observation.trim(),
          })),
        }
      : {}),
    ...(sectionCode === "higiene-seguridad"
      ? {
          hygieneSafety: {
            entries: values.hygieneEntries.map((entry) => ({
              kind: entry.kind,
              scope: entry.scope || null,
              typeId: toNullableInteger(entry.typeId),
              name: entry.name.trim(),
              provider: entry.provider.trim(),
              secondaryId: toNullableInteger(entry.secondaryId),
              secondary: entry.secondary.trim(),
              response: entry.response,
              quantity: entry.quantity.trim() === "" ? null : Number(entry.quantity),
              condition: entry.condition || null,
              observation: entry.observation.trim(),
            })),
            radios: {
              available: values.hygieneRadios.available,
              visitorUse: values.hygieneRadios.visitorUse,
              internalUse: values.hygieneRadios.internalUse,
              emergencyUse: values.hygieneRadios.emergencyUse,
              quantity: toNullableInteger(values.hygieneRadios.quantity),
              observation: values.hygieneRadios.observation.trim(),
            },
            contingency: {
              exists: values.hygieneContingency.exists,
              institution: values.hygieneContingency.institution.trim(),
              document: values.hygieneContingency.document.trim(),
              year: toNullableInteger(values.hygieneContingency.year),
              observation: values.hygieneContingency.observation.trim(),
            },
          },
        }
      : {}),
    ...(sectionCode === "politicas"
      ? {
          policies: values.policies.map((policy, index) => ({
            code: policy.code || POLICY_DEFINITIONS[index]?.code,
            question: policy.question || POLICY_DEFINITIONS[index]?.question,
            response: policy.response,
            year: toNullableInteger(policy.year),
            specification: policy.specification.trim(),
            observation: policy.observation.trim(),
          })),
        }
      : {}),
    ...(sectionCode === "promocion"
      ? {
          promotion: {
            hasPlan: values.promotion.hasPlan,
            planName: values.promotion.planName.trim(),
            includedInPlan: values.promotion.includedInPlan,
            partOfPackage: values.promotion.partOfPackage,
            packageDetail: values.promotion.packageDetail.trim(),
            observation: values.promotion.observation.trim(),
            media: values.promotionMedia.map((media) => ({
              response: media.response,
              typeId: toNullableInteger(media.typeId),
              name: media.name.trim(),
              url: media.url.trim(),
              periodicity: media.periodicity.trim(),
              detailOther: media.detailOther.trim(),
              observation: media.observation.trim(),
            })),
          },
        }
      : {}),
    ...(sectionCode === "visitantes"
      ? {
          visitors: {
            registry: {
              exists: values.visitorRegistry.exists,
              type: values.visitorRegistry.type || null,
              years: toNullableInteger(values.visitorRegistry.years),
              reports: values.visitorRegistry.reports,
              frequency: values.visitorRegistry.frequency.trim(),
              observation: values.visitorRegistry.observation.trim(),
            },
            seasons: values.visitorSeasons.map((season) => ({
              type: season.type,
              quantity: toNullableInteger(season.quantity),
              year: toNullableInteger(season.year),
              months: parseMonths(season.months),
              observation: season.observation.trim(),
            })),
            origins: values.visitorOrigins.map((origin) => ({
              type: origin.type,
              place: origin.place.trim(),
              month: toNullableInteger(origin.month),
              year: toNullableInteger(origin.year),
              quantity: toNullableInteger(origin.quantity),
              observation: origin.observation.trim(),
            })),
            informants: values.visitorInformants.map((informant) => ({
              name: informant.name.trim(),
              contact: informant.contact.trim(),
              observation: informant.observation.trim(),
            })),
            influx: {
              weekday: toNullableInteger(values.visitorInflux.weekday),
              weekend: toNullableInteger(values.visitorInflux.weekend),
              holidays: toNullableInteger(values.visitorInflux.holidays),
              frequency: values.visitorInflux.frequency || null,
              observation: values.visitorInflux.observation.trim(),
            },
          },
        }
      : {}),
    ...(sectionCode === "recurso-humano"
      ? {
          humanResources: {
            summary: {
              administrationOperation: toNullableInteger(
                values.humanResourceSummary.administrationOperation,
              ),
              specializedTourism: toNullableInteger(
                values.humanResourceSummary.specializedTourism,
              ),
              observation: values.humanResourceSummary.observation.trim(),
            },
            training: values.humanResourceTraining.map((training) => ({
              group: training.group,
              typeId: toNullableInteger(training.typeId),
              name: training.name.trim(),
              quantity: toNullableInteger(training.quantity),
              detailOther: training.detailOther.trim(),
              observation: training.observation.trim(),
            })),
          },
        }
      : {}),
    ...(sectionCode === "anexos"
      ? {
          annexes: {
            documents: values.annexDocuments.map((document) => ({
              fileId: toNullableInteger(document.fileId),
              type: document.type.trim(),
              source: document.source.trim(),
              author: document.author.trim(),
              description: document.description.trim(),
              visibility: document.visibility,
              observation: document.observation.trim(),
            })),
            responsibles: values.annexResponsibles.map((responsible) => ({
              typeId: toNullableInteger(responsible.typeId),
              name: responsible.name.trim(),
              role: responsible.role.trim(),
              institution: responsible.institution.trim(),
              phone: responsible.phone.trim(),
              email: responsible.email.trim(),
              observation: responsible.observation.trim(),
            })),
            accessibilitySurvey: {
              date: values.accessibilitySurvey.date.trim() || null,
              responsible: values.accessibilitySurvey.responsible.trim(),
              scope: values.accessibilitySurvey.scope.trim(),
              observation: values.accessibilitySurvey.observation.trim(),
            },
            gadValidation: {
              acceptance: values.gadValidation.acceptance,
              name: values.gadValidation.name.trim(),
              institution: values.gadValidation.institution.trim(),
              position: values.gadValidation.position.trim(),
              phone: values.gadValidation.phone.trim(),
              email: values.gadValidation.email.trim(),
              date: values.gadValidation.date.trim() || null,
              observation: values.gadValidation.observation.trim(),
            },
          },
        }
      : {}),
    rows: values.rows.map((row) => ({
      label: row.label.trim(),
      response: row.response,
      quantity: row.quantity.trim() === "" ? null : Number(row.quantity),
      observation: row.observation.trim(),
    })),
  };
}

function readNestedValue(value: unknown, key: string): string {
  if (!isRecord(value)) return "";
  const nested = value[key];
  return typeof nested === "number" || typeof nested === "string" ? String(nested) : "";
}

function readAccessibilityDetails(value: unknown): Record<string, unknown> | null {
  return isRecord(value) && isRecord(value.accessibilityDetails)
    ? value.accessibilityDetails
    : null;
}

function readAccessibilityRoads(value: unknown): AccessibilityRoadForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.roads)) return [];
  return details.roads.map((road) => {
    const item = isRecord(road) ? road : {};
    return {
      roadTypeId: toFormNumber(item.roadTypeId),
      typeLabel: typeof item.typeLabel === "string" ? item.typeLabel : "",
      startLatitude: toFormNumber(item.startLatitude),
      startLongitude: toFormNumber(item.startLongitude),
      endLatitude: toFormNumber(item.endLatitude),
      endLongitude: toFormNumber(item.endLongitude),
      distanceKm: toFormNumber(item.distanceKm),
      materialId: toFormNumber(item.materialId),
      conditionId: toFormNumber(item.conditionId),
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilityAquatic(value: unknown): AccessibilityAquaticForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.aquatic)) return [];
  return details.aquatic.map((access) => {
    const item = isRecord(access) ? access : {};
    return {
      modalityId: toFormNumber(item.modalityId),
      modalityLabel: typeof item.modalityLabel === "string" ? item.modalityLabel : "",
      departure: typeof item.departure === "string" ? item.departure : "",
      departureConditionId: toFormNumber(item.departureConditionId),
      arrival: typeof item.arrival === "string" ? item.arrival : "",
      arrivalConditionId: toFormNumber(item.arrivalConditionId),
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilityAerial(value: unknown): AccessibilityAerialForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.aerial)) return [];
  return details.aerial.map((access) => {
    const item = isRecord(access) ? access : {};
    return {
      coverageId: toFormNumber(item.coverageId),
      coverageLabel: typeof item.coverageLabel === "string" ? item.coverageLabel : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilityTransportTypes(
  value: unknown,
): AccessibilityTransportTypeForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.transportTypes)) return [];
  return details.transportTypes.map((transport) => {
    const item = isRecord(transport) ? transport : {};
    return {
      typeId: toFormNumber(item.typeId),
      label: typeof item.label === "string" ? item.label : "",
      applies: item.applies === false ? "NO" : "SI",
      detailOther: typeof item.detailOther === "string" ? item.detailOther : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilityTransportDetails(
  value: unknown,
): AccessibilityTransportDetailForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.transportDetails)) return [];
  return details.transportDetails.map((detail) => {
    const item = isRecord(detail) ? detail : {};
    return {
      operator: typeof item.operator === "string" ? item.operator : "",
      terminal: typeof item.terminal === "string" ? item.terminal : "",
      frequencyId: toFormNumber(item.frequencyId),
      frequencyLabel: typeof item.frequencyLabel === "string" ? item.frequencyLabel : "",
      transferDetail: typeof item.transferDetail === "string" ? item.transferDetail : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilityCriteria(value: unknown): AccessibilityCriterionForm[] {
  const details = readAccessibilityDetails(value);
  if (!details || !Array.isArray(details.criteria)) return [];
  return details.criteria.map((criterion) => {
    const item = isRecord(criterion) ? criterion : {};
    return {
      accessibilityTypeId: toFormNumber(item.accessibilityTypeId),
      criterionId: toFormNumber(item.criterionId),
      label: typeof item.label === "string" ? item.label : "",
      response: isSectionResponse(item.response) ? item.response : EMPTY_RESPONSE,
      detail: typeof item.detail === "string" ? item.detail : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilitySignage(value: unknown): AccessibilitySignageForm {
  const details = readAccessibilityDetails(value);
  const signage = details && isRecord(details.signage) ? details.signage : {};
  return {
    available: isSectionResponse(signage.available) ? signage.available : EMPTY_RESPONSE,
    conditionId: toFormNumber(signage.conditionId),
    observation: typeof signage.observation === "string" ? signage.observation : "",
  };
}

function readPlant(value: unknown): PlantForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      scope:
        record.scope === "EN_POBLADO_CERCANO" ? "EN_POBLADO_CERCANO" : "EN_ATRACTIVO",
      typeId: toFormNumber(record.typeId),
      typeLabel: typeof record.typeLabel === "string" ? record.typeLabel : "",
      group: typeof record.group === "string" ? record.group : "",
      quantity1: toFormNumber(record.quantity1),
      quantity2: toFormNumber(record.quantity2),
      quantity3: toFormNumber(record.quantity3),
      observation: typeof record.observation === "string" ? record.observation : "",
    };
  });
}

function readFacilityDetails(value: unknown): FacilityDetailForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      categoryId: toFormNumber(record.categoryId),
      typeId: toFormNumber(record.typeId),
      typeLabel: typeof record.typeLabel === "string" ? record.typeLabel : "",
      quantity: toFormNumber(record.quantity) || "0",
      latitude: toFormNumber(record.latitude),
      longitude: toFormNumber(record.longitude),
      administrator: typeof record.administrator === "string" ? record.administrator : "",
      universalAccessibility: isSectionResponse(record.universalAccessibility)
        ? record.universalAccessibility
        : EMPTY_RESPONSE,
      conditionId: toFormNumber(record.conditionId),
      detailOther: typeof record.detailOther === "string" ? record.detailOther : "",
      observation: typeof record.observation === "string" ? record.observation : "",
    };
  });
}

function readComplementaryServices(value: unknown): ComplementaryServiceForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      scope:
        record.scope === "EN_POBLADO_CERCANO" ? "EN_POBLADO_CERCANO" : "EN_ATRACTIVO",
      typeId: toFormNumber(record.typeId),
      typeLabel: typeof record.typeLabel === "string" ? record.typeLabel : "",
      specification: typeof record.specification === "string" ? record.specification : "",
      observation: typeof record.observation === "string" ? record.observation : "",
    };
  });
}

function readConservationComponent(
  value: unknown,
  key: "attraction" | "environment",
): ConservationComponentForm {
  const component = isRecord(value) && isRecord(value[key]) ? value[key] : null;
  return {
    state: typeof component?.state === "string" ? component.state : "",
    observation: typeof component?.observation === "string" ? component.observation : "",
  };
}

function readConservationFactors(value: unknown): ConservationFactorForm[] {
  if (!isRecord(value) || !Array.isArray(value.factors)) return [];
  return value.factors.map((factor) => toConservationFactorForm(factor));
}

function readDeclarations(value: unknown): ConservationDeclarationForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((declaration) => toDeclarationForm(declaration));
}

function readHygieneEntries(value: unknown): HygieneEntryForm[] {
  if (!isRecord(value) || !Array.isArray(value.entries)) return [];
  return value.entries.map((entry) => {
    const item = isRecord(entry) ? entry : {};
    const kind = HYGIENE_ENTRY_OPTIONS.some((option) => option.value === item.kind)
      ? (item.kind as HygieneEntryKind)
      : "BASIC_SERVICE";
    const scope =
      item.scope === "EN_POBLADO_CERCANO" || item.scope === "EN_ATRACTIVO"
        ? item.scope
        : "";
    const condition =
      item.condition === "BUENO" ||
      item.condition === "REGULAR" ||
      item.condition === "MALO"
        ? item.condition
        : "";
    return {
      kind,
      scope,
      typeId: toFormNumber(item.typeId),
      name: typeof item.name === "string" ? item.name : "",
      provider: typeof item.provider === "string" ? item.provider : "",
      secondaryId: toFormNumber(item.secondaryId),
      secondary: typeof item.secondary === "string" ? item.secondary : "",
      response: isSectionResponse(item.response) ? item.response : EMPTY_RESPONSE,
      quantity:
        typeof item.quantity === "number" || typeof item.quantity === "string"
          ? String(item.quantity)
          : "",
      condition,
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readHygieneRadios(value: unknown): HygieneRadiosForm {
  const radios = isRecord(value) && isRecord(value.radios) ? value.radios : {};
  return {
    available: isSectionResponse(radios.available) ? radios.available : EMPTY_RESPONSE,
    visitorUse: isSectionResponse(radios.visitorUse) ? radios.visitorUse : EMPTY_RESPONSE,
    internalUse: isSectionResponse(radios.internalUse)
      ? radios.internalUse
      : EMPTY_RESPONSE,
    emergencyUse: isSectionResponse(radios.emergencyUse)
      ? radios.emergencyUse
      : EMPTY_RESPONSE,
    quantity:
      typeof radios.quantity === "number" || typeof radios.quantity === "string"
        ? String(radios.quantity)
        : "",
    observation: typeof radios.observation === "string" ? radios.observation : "",
  };
}

function readHygieneContingency(value: unknown): HygieneContingencyForm {
  const contingency =
    isRecord(value) && isRecord(value.contingency) ? value.contingency : {};
  return {
    exists: isSectionResponse(contingency.exists) ? contingency.exists : EMPTY_RESPONSE,
    institution:
      typeof contingency.institution === "string" ? contingency.institution : "",
    document: typeof contingency.document === "string" ? contingency.document : "",
    year:
      typeof contingency.year === "number" || typeof contingency.year === "string"
        ? String(contingency.year)
        : "",
    observation:
      typeof contingency.observation === "string" ? contingency.observation : "",
  };
}

function readPolicies(value: unknown): PolicyForm[] {
  const entries = Array.isArray(value) ? value : [];
  return POLICY_DEFINITIONS.map((definition) => {
    const raw = entries.find(
      (entry) => isRecord(entry) && entry.code === definition.code,
    );
    const item = isRecord(raw) ? raw : {};
    return {
      code: definition.code,
      question: definition.question,
      response: isSectionResponse(item.response) ? item.response : EMPTY_RESPONSE,
      year:
        typeof item.year === "number" || typeof item.year === "string"
          ? String(item.year)
          : "",
      specification: typeof item.specification === "string" ? item.specification : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readPromotion(value: unknown): SectionFormValues["promotion"] {
  const promotion = isRecord(value) ? value : {};
  return {
    hasPlan: isSectionResponse(promotion.hasPlan) ? promotion.hasPlan : EMPTY_RESPONSE,
    planName: typeof promotion.planName === "string" ? promotion.planName : "",
    includedInPlan: isSectionResponse(promotion.includedInPlan)
      ? promotion.includedInPlan
      : EMPTY_RESPONSE,
    partOfPackage: isSectionResponse(promotion.partOfPackage)
      ? promotion.partOfPackage
      : EMPTY_RESPONSE,
    packageDetail:
      typeof promotion.packageDetail === "string" ? promotion.packageDetail : "",
    observation: typeof promotion.observation === "string" ? promotion.observation : "",
  };
}

function readPromotionMedia(value: unknown): PromotionMediaForm[] {
  if (!isRecord(value) || !Array.isArray(value.media)) return [];
  return value.media.map((media) => {
    const item = isRecord(media) ? media : {};
    return {
      response: isSectionResponse(item.response) ? item.response : EMPTY_RESPONSE,
      typeId: toFormNumber(item.typeId),
      name: typeof item.name === "string" ? item.name : "",
      url: typeof item.url === "string" ? item.url : "",
      periodicity: typeof item.periodicity === "string" ? item.periodicity : "",
      detailOther: typeof item.detailOther === "string" ? item.detailOther : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readVisitorRegistry(value: unknown): VisitorRegistryForm {
  const visitors = isRecord(value) && isRecord(value.registry) ? value.registry : {};
  return {
    exists: isSectionResponse(visitors.exists) ? visitors.exists : EMPTY_RESPONSE,
    type: visitors.type === "DIGITAL" || visitors.type === "PAPEL" ? visitors.type : "",
    years:
      typeof visitors.years === "number" || typeof visitors.years === "string"
        ? String(visitors.years)
        : "",
    reports: isSectionResponse(visitors.reports) ? visitors.reports : EMPTY_RESPONSE,
    frequency: typeof visitors.frequency === "string" ? visitors.frequency : "",
    observation: typeof visitors.observation === "string" ? visitors.observation : "",
  };
}

function readVisitorSeasons(value: unknown): VisitorSeasonForm[] {
  if (!isRecord(value) || !Array.isArray(value.seasons)) return [];
  return value.seasons.map((season) => {
    const item = isRecord(season) ? season : {};
    return {
      type: item.type === "BAJA" ? "BAJA" : "ALTA",
      quantity: toFormNumber(item.quantity),
      year: toFormNumber(item.year),
      months: Array.isArray(item.months) ? item.months.join(", ") : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readVisitorOrigins(value: unknown): VisitorOriginForm[] {
  if (!isRecord(value) || !Array.isArray(value.origins)) return [];
  return value.origins.map((origin) => {
    const item = isRecord(origin) ? origin : {};
    return {
      type: item.type === "EXTRANJERA" ? "EXTRANJERA" : "NACIONAL",
      place: typeof item.place === "string" ? item.place : "",
      month: toFormNumber(item.month),
      year: toFormNumber(item.year),
      quantity: toFormNumber(item.quantity),
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readVisitorInformants(value: unknown): VisitorInformantForm[] {
  if (!isRecord(value) || !Array.isArray(value.informants)) return [];
  return value.informants.map((informant) => {
    const item = isRecord(informant) ? informant : {};
    return {
      name: typeof item.name === "string" ? item.name : "",
      contact: typeof item.contact === "string" ? item.contact : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readVisitorInflux(value: unknown): VisitorInfluxForm {
  const visitors = isRecord(value) && isRecord(value.influx) ? value.influx : {};
  const frequencies = new Set(["PERMANENTE", "ESTACIONAL", "ESPORADICA", "INEXISTENTE"]);
  return {
    weekday: toFormNumber(visitors.weekday),
    weekend: toFormNumber(visitors.weekend),
    holidays: toFormNumber(visitors.holidays),
    frequency: frequencies.has(String(visitors.frequency))
      ? (visitors.frequency as VisitorInfluxForm["frequency"])
      : "",
    observation: typeof visitors.observation === "string" ? visitors.observation : "",
  };
}

function readHumanResourceSummary(
  value: unknown,
): SectionFormValues["humanResourceSummary"] {
  const resources = isRecord(value) && isRecord(value.summary) ? value.summary : {};
  return {
    administrationOperation: toFormNumber(resources.administrationOperation),
    specializedTourism: toFormNumber(resources.specializedTourism),
    observation: typeof resources.observation === "string" ? resources.observation : "",
  };
}

function readHumanResourceTraining(value: unknown): HumanResourceTrainingForm[] {
  if (!isRecord(value) || !Array.isArray(value.training)) return [];
  return value.training.map((training) => {
    const item = isRecord(training) ? training : {};
    const group = new Set(["EDUCACION", "CAPACITACION", "IDIOMA"]);
    return {
      group: group.has(String(item.group))
        ? (item.group as HumanResourceTrainingForm["group"])
        : "EDUCACION",
      typeId: toFormNumber(item.typeId),
      name: typeof item.name === "string" ? item.name : "",
      quantity: toFormNumber(item.quantity),
      detailOther: typeof item.detailOther === "string" ? item.detailOther : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAnnexDocuments(value: unknown): AnnexDocumentForm[] {
  if (!isRecord(value) || !Array.isArray(value.documents)) return [];
  return value.documents.map((document) => {
    const item = isRecord(document) ? document : {};
    const visibility = new Set(["PUBLICA", "ADMINISTRATIVA", "RESTRINGIDA"]);
    return {
      fileId: toFormNumber(item.fileId),
      type: typeof item.type === "string" ? item.type : "",
      source: typeof item.source === "string" ? item.source : "",
      author: typeof item.author === "string" ? item.author : "",
      description: typeof item.description === "string" ? item.description : "",
      visibility: visibility.has(String(item.visibility))
        ? (item.visibility as AnnexDocumentForm["visibility"])
        : "ADMINISTRATIVA",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAnnexResponsibles(value: unknown): AnnexResponsibleForm[] {
  if (!isRecord(value) || !Array.isArray(value.responsibles)) return [];
  return value.responsibles.map((responsible) => {
    const item = isRecord(responsible) ? responsible : {};
    return {
      typeId: toFormNumber(item.typeId),
      name: typeof item.name === "string" ? item.name : "",
      role: typeof item.role === "string" ? item.role : "",
      institution: typeof item.institution === "string" ? item.institution : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      email: typeof item.email === "string" ? item.email : "",
      observation: typeof item.observation === "string" ? item.observation : "",
    };
  });
}

function readAccessibilitySurvey(
  value: unknown,
): SectionFormValues["accessibilitySurvey"] {
  const survey =
    isRecord(value) && isRecord(value.accessibilitySurvey)
      ? value.accessibilitySurvey
      : {};
  return {
    date: typeof survey.date === "string" ? survey.date : "",
    responsible: typeof survey.responsible === "string" ? survey.responsible : "",
    scope: typeof survey.scope === "string" ? survey.scope : "",
    observation: typeof survey.observation === "string" ? survey.observation : "",
  };
}

function readGadValidation(value: unknown): SectionFormValues["gadValidation"] {
  const validation =
    isRecord(value) && isRecord(value.gadValidation) ? value.gadValidation : {};
  return {
    acceptance: isSectionResponse(validation.acceptance)
      ? validation.acceptance
      : EMPTY_RESPONSE,
    name: typeof validation.name === "string" ? validation.name : "",
    institution: typeof validation.institution === "string" ? validation.institution : "",
    position: typeof validation.position === "string" ? validation.position : "",
    phone: typeof validation.phone === "string" ? validation.phone : "",
    email: typeof validation.email === "string" ? validation.email : "",
    date: typeof validation.date === "string" ? validation.date : "",
    observation: typeof validation.observation === "string" ? validation.observation : "",
  };
}

function parseMonths(value: string): number[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
}

function toFormNumber(value: unknown): string {
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function toConservationFactorForm(value: unknown): ConservationFactorForm {
  const factor = isRecord(value) ? value : {};
  return {
    component: factor.component === "ENTORNO" ? "ENTORNO" : "ATRACTIVO",
    factorId: toFormNumber(factor.factorId),
    origin: factor.origin === "ANTROPICO" ? "ANTROPICO" : "NATURAL",
    name: typeof factor.name === "string" ? factor.name : "",
    response: isSectionResponse(factor.response) ? factor.response : EMPTY_RESPONSE,
    detailOther: typeof factor.detailOther === "string" ? factor.detailOther : "",
    observation: typeof factor.observation === "string" ? factor.observation : "",
  };
}

function toDeclarationForm(value: unknown): ConservationDeclarationForm {
  const declaration = isRecord(value) ? value : {};
  return {
    entity: typeof declaration.entity === "string" ? declaration.entity : "",
    denomination:
      typeof declaration.denomination === "string" ? declaration.denomination : "",
    date: typeof declaration.date === "string" ? declaration.date : "",
    scope: typeof declaration.scope === "string" ? declaration.scope : "",
    observation:
      typeof declaration.observation === "string" ? declaration.observation : "",
  };
}

function toNullableNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function toNullableInteger(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
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

/**
 * Wizard-backed version of the section editor.
 *
 * Every section keeps its own react-hook-form state mounted while the parent
 * shows one step at a time. This preserves pending edits when the operator
 * navigates and keeps the API contract and per-section persistence unchanged.
 */
export function ContinuousCenterSectionWorkflow({
  token,
  code,
  detail,
  catalogs,
  canEdit,
  activeSectionCode,
  visible,
  showOverview,
  onDetailChanged,
  onError,
}: {
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  activeSectionCode: AdminCenterSectionCode | null;
  visible: boolean;
  showOverview: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
}) {
  const sectionsQuery = useQuery({
    queryKey: ["admin", "center", code, "sections"],
    queryFn: () => getAdminCenterSections(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 10_000,
  });
  const valuationQuery = useQuery<AdminCenterValuation>({
    queryKey: ["admin", "center", code, "valuation"],
    queryFn: () => getAdminCenterValuation(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 10_000,
  });
  const mediaQuery = useQuery<{ items: AdminMediaItem[] }>({
    queryKey: ["admin", "media", code],
    queryFn: () => getAdminCenterMedia(token, code as string),
    enabled: Boolean(token && code),
    staleTime: 5_000,
  });
  const mediaItems = useMemo(
    () => mediaQuery.data?.items ?? [],
    [mediaQuery.data?.items],
  );
  useEffect(() => {
    if (sectionsQuery.error) {
      onError(
        sectionsQuery.error instanceof Error
          ? sectionsQuery.error.message
          : "No se pudieron cargar las secciones de la ficha.",
      );
    }
  }, [onError, sectionsQuery.error]);
  const sectionData = sectionsQuery.data;
  const sections = useMemo(
    () => sectionData?.sections ?? detail?.draft?.sections ?? {},
    [detail?.draft?.sections, sectionData?.sections],
  );
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

  if (code && sectionsQuery.isLoading) {
    return (
      <Box sx={{ display: visible ? "block" : "none" }}>
        <ContentState status="loading" label="Cargando secciones de la ficha" />
      </Box>
    );
  }

  if (sectionsQuery.error) {
    return (
      <Box sx={{ display: visible ? "block" : "none" }}>
        <ContentState
          status="empty"
          message="No se pudieron cargar las secciones de la ficha."
        />
      </Box>
    );
  }

  return (
    <Stack
      spacing={webTokens.spacing.section}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          (event.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          event.preventDefault();
        }
      }}
      sx={{ display: visible ? "flex" : "none" }}
    >
      {showOverview ? (
        <FlatSurface padding="default">
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<FactCheckRounded />}
              title="Ficha integral por secciones"
              description="Completa la ficha en un solo recorrido. Cada apartado conserva su avance para la revisión."
            />
            <InstitutionalCodeCard
              code={detail?.code ?? null}
              valuation={valuationQuery.data ?? null}
            />
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
          </Stack>
        </FlatSurface>
      ) : null}

      {centerSectionDefinitions.map((definition) => (
        <ContinuousSectionCard
          key={definition.code}
          active={definition.code === activeSectionCode}
          definition={definition}
          token={token}
          code={code}
          detail={detail}
          catalogs={catalogs}
          canEdit={canEdit}
          rawSection={sections[definition.code]}
          mediaItems={mediaItems}
          onDetailChanged={onDetailChanged}
          onError={onError}
        />
      ))}
    </Stack>
  );
}

const ContinuousSectionCard = memo(function ContinuousSectionCard({
  active,
  definition,
  token,
  code,
  detail,
  catalogs,
  canEdit,
  rawSection,
  mediaItems,
  onDetailChanged,
  onError,
}: {
  active: boolean;
  definition: SectionDefinition;
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  rawSection: unknown;
  mediaItems: AdminMediaItem[];
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
}) {
  const form = useForm<SectionFormValues>({
    defaultValues: createSectionValues(definition, rawSection),
    mode: "onBlur",
  });
  const { control, register, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "rows" });
  const {
    fields: conservationFactorFields,
    append: appendConservationFactor,
    remove: removeConservationFactor,
  } = useFieldArray({ control, name: "conservationFactors" });
  const {
    fields: declarationFields,
    append: appendDeclaration,
    remove: removeDeclaration,
  } = useFieldArray({ control, name: "declarations" });
  const {
    fields: hygieneEntryFields,
    append: appendHygieneEntry,
    remove: removeHygieneEntry,
  } = useFieldArray({ control, name: "hygieneEntries" });
  const { fields: policyFields } = useFieldArray({ control, name: "policies" });
  const {
    fields: promotionMediaFields,
    append: appendPromotionMedia,
    remove: removePromotionMedia,
  } = useFieldArray({ control, name: "promotionMedia" });
  const {
    fields: visitorSeasonFields,
    append: appendVisitorSeason,
    remove: removeVisitorSeason,
  } = useFieldArray({ control, name: "visitorSeasons" });
  const {
    fields: visitorOriginFields,
    append: appendVisitorOrigin,
    remove: removeVisitorOrigin,
  } = useFieldArray({ control, name: "visitorOrigins" });
  const {
    fields: visitorInformantFields,
    append: appendVisitorInformant,
    remove: removeVisitorInformant,
  } = useFieldArray({ control, name: "visitorInformants" });
  const {
    fields: humanResourceTrainingFields,
    append: appendHumanResourceTraining,
    remove: removeHumanResourceTraining,
  } = useFieldArray({ control, name: "humanResourceTraining" });
  const {
    fields: annexDocumentFields,
    append: appendAnnexDocument,
    remove: removeAnnexDocument,
  } = useFieldArray({ control, name: "annexDocuments" });
  const {
    fields: annexResponsibleFields,
    append: appendAnnexResponsible,
    remove: removeAnnexResponsible,
  } = useFieldArray({ control, name: "annexResponsibles" });
  useSectionAutosave({
    form,
    token,
    code,
    detail,
    definition,
    rawSection,
    canEdit,
    onDetailChanged,
    onError,
  });

  const responseLabelId = `section-response-label-${definition.code}`;
  const sectionResponse = useWatch({ control, name: "response" }) ?? EMPTY_RESPONSE;
  const showSectionDetails = sectionResponse !== "NO" && sectionResponse !== "NO_APLICA";
  const hasSectionFields = [
    "accesibilidad",
    "caracteristicas",
    "planta",
    "conservacion",
    "higiene-seguridad",
    "politicas",
    "promocion",
    "visitantes",
    "recurso-humano",
    "anexos",
  ].includes(definition.code);
  const hasGenericRows = definition.suggestedRows.length > 0 || fields.length > 0;

  return (
    <FlatSurface
      id={`center-detail-section-${definition.code}`}
      padding="default"
      sx={{ display: active ? "block" : "none" }}
    >
      <Stack spacing={webTokens.spacing.section}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "flex-start" }}
          gap={webTokens.spacing.control}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SectionHeader
              icon={<FactCheckRounded />}
              title={definition.title}
              description={definition.description}
            />
          </Box>
        </Stack>
        <SectionResponseControl
          labelId={responseLabelId}
          canEdit={canEdit}
          register={register}
        />
        {hasSectionFields ? (
          <Box sx={{ display: showSectionDetails ? "block" : "none" }}>
            {definition.code === "accesibilidad" ? (
              <AccessibilitySectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                control={control}
                register={register}
                setValue={setValue}
              />
            ) : null}
            {definition.code === "caracteristicas" ? (
              <CharacteristicsSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                register={register}
              />
            ) : null}
            {definition.code === "planta" ? (
              <PlantSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                control={control}
                register={register}
                setValue={setValue}
              />
            ) : null}
            {definition.code === "conservacion" ? (
              <ConservationSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                register={register}
                factorFields={conservationFactorFields}
                declarationFields={declarationFields}
                appendFactor={appendConservationFactor}
                removeFactor={removeConservationFactor}
                appendDeclaration={appendDeclaration}
                removeDeclaration={removeDeclaration}
              />
            ) : null}
            {definition.code === "higiene-seguridad" ? (
              <HygieneSafetySectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                control={control}
                register={register}
                entryFields={hygieneEntryFields}
                appendEntry={appendHygieneEntry}
                removeEntry={removeHygieneEntry}
              />
            ) : null}
            {definition.code === "politicas" ? (
              <PoliciesSectionFields
                canEdit={canEdit}
                register={register}
                fields={policyFields}
              />
            ) : null}
            {definition.code === "promocion" ? (
              <PromotionSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                control={control}
                register={register}
                mediaFields={promotionMediaFields}
                appendMedia={appendPromotionMedia}
                removeMedia={removePromotionMedia}
              />
            ) : null}
            {definition.code === "visitantes" ? (
              <VisitorsSectionFields
                canEdit={canEdit}
                control={control}
                register={register}
                seasonFields={visitorSeasonFields}
                originFields={visitorOriginFields}
                informantFields={visitorInformantFields}
                appendSeason={appendVisitorSeason}
                removeSeason={removeVisitorSeason}
                appendOrigin={appendVisitorOrigin}
                removeOrigin={removeVisitorOrigin}
                appendInformant={appendVisitorInformant}
                removeInformant={removeVisitorInformant}
              />
            ) : null}
            {definition.code === "recurso-humano" ? (
              <HumanResourcesSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                register={register}
                trainingFields={humanResourceTrainingFields}
                appendTraining={appendHumanResourceTraining}
                removeTraining={removeHumanResourceTraining}
              />
            ) : null}
            {definition.code === "anexos" ? (
              <AnnexesSectionFields
                catalogs={catalogs}
                canEdit={canEdit}
                register={register}
                mediaItems={mediaItems}
                documentFields={annexDocumentFields}
                responsibleFields={annexResponsibleFields}
                appendDocument={appendAnnexDocument}
                removeDocument={removeAnnexDocument}
                appendResponsible={appendAnnexResponsible}
                removeResponsible={removeAnnexResponsible}
              />
            ) : null}
          </Box>
        ) : null}
        {hasSectionFields ? (
          <Divider sx={{ display: showSectionDetails ? "block" : "none" }} />
        ) : null}
        <Stack spacing={webTokens.spacing.control}>
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
          {hasGenericRows ? (
            <Box sx={{ display: showSectionDetails ? "block" : "none" }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ sm: "center" }}
                  gap={2}
                >
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
                {fields.length > 0 ? (
                  <Stack spacing={1.5}>
                    {fields.map((field, rowIndex) => (
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
                              {...register(`rows.${rowIndex}.label`, {
                                required: "Indica el elemento o indicador",
                                maxLength: {
                                  value: 180,
                                  message: "Máximo 180 caracteres",
                                },
                              })}
                              error={Boolean(formState.errors.rows?.[rowIndex]?.label)}
                              helperText={
                                formState.errors.rows?.[rowIndex]?.label?.message
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth disabled={!canEdit}>
                              <InputLabel
                                id={`row-response-${definition.code}-${rowIndex}`}
                              >
                                Respuesta
                              </InputLabel>
                              <Select
                                labelId={`row-response-${definition.code}-${rowIndex}`}
                                label="Respuesta"
                                defaultValue={EMPTY_RESPONSE}
                                {...register(`rows.${rowIndex}.response`)}
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
                              {...register(`rows.${rowIndex}.quantity`, {
                                validate: (value) =>
                                  !value.trim() ||
                                  (Number.isInteger(Number(value)) && Number(value) >= 0)
                                    ? true
                                    : "Usa un entero igual o mayor que cero",
                              })}
                              error={Boolean(formState.errors.rows?.[rowIndex]?.quantity)}
                              helperText={
                                formState.errors.rows?.[rowIndex]?.quantity?.message
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2 }}>
                            <Tooltip title="Eliminar fila">
                              <IconButton
                                type="button"
                                aria-label={`Eliminar fila ${rowIndex + 1}`}
                                disabled={!canEdit}
                                onClick={() => remove(rowIndex)}
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
                              {...register(`rows.${rowIndex}.observation`, {
                                maxLength: {
                                  value: 1_000,
                                  message: "Máximo 1.000 caracteres",
                                },
                              })}
                              error={Boolean(
                                formState.errors.rows?.[rowIndex]?.observation,
                              )}
                              helperText={
                                formState.errors.rows?.[rowIndex]?.observation?.message
                              }
                            />
                          </Grid>
                        </Grid>
                      </FlatSurface>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Stack>
    </FlatSurface>
  );
});

function SectionResponseControl({
  labelId,
  canEdit,
  register,
}: {
  labelId: string;
  canEdit: boolean;
  register: UseFormRegister<SectionFormValues>;
}) {
  return (
    <FormControl fullWidth disabled={!canEdit}>
      <InputLabel id={labelId}>Resultado de la sección</InputLabel>
      <Select
        labelId={labelId}
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
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
