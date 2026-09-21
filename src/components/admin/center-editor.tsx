"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import AccessibleRounded from "@mui/icons-material/AccessibleRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import DirectionsWalkRounded from "@mui/icons-material/DirectionsWalkRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import MiscellaneousServicesRounded from "@mui/icons-material/MiscellaneousServicesRounded";
import PublishRounded from "@mui/icons-material/PublishRounded";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { MediaManager } from "@/components/admin/media-manager";
import { CenterReviewDiff } from "@/components/admin/center-review-diff";
import {
  centerSectionDefinitions,
  ContinuousCenterSectionWorkflow,
} from "@/components/admin/center-section-workflow";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import {
  createAdminCenter,
  getAdminCatalogs,
  getAdminCenter,
  publishAdminCenter,
  saveAdminCenter,
  submitAdminCenterReview,
  type AdminCenterDetail,
  type AdminCatalogs,
  type CenterDraft,
  type SaveCenterInput,
} from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

type FormValues = {
  name: string;
  categoryId: string;
  typeId: string;
  subtypeId: string;
  touristZoneId: string;
  provinceId: string;
  cantonId: string;
  parishId: string;
  productLineId: string;
  scenarioId: string;
  hierarchyId: string;
  latitude: string;
  longitude: string;
  altitudeMeters: string;
  description: string;
  address: {
    barrio: string;
    street: string;
    number: string;
    crossStreet: string;
  };
  administration: {
    type: string;
    institution: string;
    name: string;
    position: string;
    phone: string;
    email: string;
    observation: string;
  };
  admission: {
    incomeTypeId: string;
    attentionModeId: string;
    opensAt: string;
    closesAt: string;
    otherAttention: string;
    reservations: boolean;
    priceFrom: string;
    priceTo: string;
    observation: string;
  };
  activityIds: string[];
  accessibilityIds: string[];
  facilityIds: string[];
  facilityQuantities: Record<string, string>;
  facilityObservations: Record<string, string>;
};

const emptyValues: FormValues = {
  name: "",
  categoryId: "",
  typeId: "",
  subtypeId: "",
  touristZoneId: "",
  provinceId: "",
  cantonId: "",
  parishId: "",
  productLineId: "",
  scenarioId: "",
  hierarchyId: "",
  latitude: "",
  longitude: "",
  altitudeMeters: "",
  description: "",
  address: { barrio: "", street: "", number: "", crossStreet: "" },
  administration: {
    type: "",
    institution: "",
    name: "",
    position: "",
    phone: "",
    email: "",
    observation: "",
  },
  admission: {
    incomeTypeId: "",
    attentionModeId: "",
    opensAt: "",
    closesAt: "",
    otherAttention: "",
    reservations: false,
    priceFrom: "",
    priceTo: "",
    observation: "",
  },
  activityIds: [],
  accessibilityIds: [],
  facilityIds: [],
  facilityQuantities: {},
  facilityObservations: {},
};

const centerWizardSteps = centerSectionDefinitions.map((section) => ({
  key: section.code,
  title: section.title,
  description: section.description,
}));

export function CenterEditor({
  token,
  code,
  onClose,
  onSaved,
  onNotice,
}: {
  token: string;
  code: string | null;
  onClose: () => void;
  onSaved: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
}) {
  const [detailOverride, setDetailOverride] = useState<AdminCenterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<"auto" | "review" | "publish" | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const {
    control,
    register,
    reset,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: emptyValues,
  });
  const queryClient = useQueryClient();
  const catalogsQuery = useQuery({
    queryKey: ["admin", "catalogs"],
    queryFn: () => getAdminCatalogs(token),
    enabled: token.length > 0,
  });
  const centerQuery = useQuery({
    queryKey: ["admin", "center", code],
    queryFn: () => getAdminCenter(token, code as string),
    enabled: token.length > 0 && code !== null,
  });
  const catalogs = catalogsQuery.data ?? null;
  const detail = detailOverride ?? centerQuery.data ?? null;
  const loading = catalogsQuery.isLoading || centerQuery.isLoading;
  const effectiveCode = detail?.code ?? code;
  const isNew = effectiveCode === null;

  useEffect(() => {
    if (centerQuery.data && catalogs && !isDirty) {
      reset(toFormValues(centerQuery.data.draft ?? centerQuery.data.published, catalogs));
    }
  }, [centerQuery.data, catalogs, isDirty, reset]);

  const queryError = catalogsQuery.error ?? centerQuery.error;
  const displayError =
    error ??
    (queryError instanceof Error
      ? queryError.message
      : queryError
        ? "No se pudo cargar la ficha."
        : null);
  const state = detail?.status.code ?? "BORRADOR";
  const canEdit =
    isNew || state === "BORRADOR" || state === "RECHAZADO" || state === "PUBLICADO";
  const categoryId = useWatch({ control, name: "categoryId" });
  const typeId = useWatch({ control, name: "typeId" });
  const provinceId = useWatch({ control, name: "provinceId" });
  const cantonId = useWatch({ control, name: "cantonId" });
  const parishId = useWatch({ control, name: "parishId" });
  const activityIds = useWatch({ control, name: "activityIds" });
  const selectedFacilityIds = useWatch({ control, name: "facilityIds" }) ?? [];
  const typeOptions = (catalogs?.types ?? []).filter(
    (option) => Boolean(categoryId) && Number(option.categoryId) === Number(categoryId),
  );
  const subtypeOptions = (catalogs?.subtypes ?? []).filter(
    (option) => Boolean(typeId) && Number(option.typeId) === Number(typeId),
  );
  const cantonOptions = (catalogs?.cantons ?? []).filter(
    (option) => Boolean(provinceId) && Number(option.provinceId) === Number(provinceId),
  );
  const parishOptions = (catalogs?.parishes ?? []).filter(
    (option) => Boolean(cantonId) && Number(option.cantonId) === Number(cantonId),
  );
  const localityOptions = (catalogs?.localities ?? []).filter(
    (option) =>
      (!provinceId || Number(option.provinceId) === Number(provinceId)) &&
      (!cantonId || Number(option.cantonId) === Number(cantonId)),
  );
  const zoneOptions = (catalogs?.zones ?? []).filter((option) => {
    if (!cantonId) return false;
    if (option.localityId === undefined) return false;
    return localityOptions.some(
      (locality) => Number(locality.id) === Number(option.localityId),
    );
  });
  const activityOptions = (catalogs?.activities ?? []).filter(
    (option) => Boolean(categoryId) && Number(option.categoryId) === Number(categoryId),
  );
  const canReview = state === "BORRADOR" || state === "RECHAZADO";
  const canPublish = state === "APROBADO";
  const watchedValues = useWatch({ control });
  const watchedSignature = useMemo(() => JSON.stringify(watchedValues), [watchedValues]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSaveRef = useRef(false);
  const lastAttemptedSignatureRef = useRef<string | null>(null);
  const summaryStepIndex = centerSectionDefinitions.length;
  const isSectionStep = activeStep >= 0 && activeStep < summaryStepIndex;
  const isSummaryStep = activeStep === summaryStepIndex;
  const activeSectionCode = isSectionStep
    ? (centerSectionDefinitions[activeStep]?.code ?? null)
    : null;

  useEffect(() => {
    if (typeId && !typeOptions.some((option) => Number(option.id) === Number(typeId))) {
      setValue("typeId", "");
      setValue("subtypeId", "");
    }
  }, [setValue, typeId, typeOptions]);

  useEffect(() => {
    const subtype = getValues("subtypeId");
    if (
      subtype &&
      !subtypeOptions.some((option) => Number(option.id) === Number(subtype))
    ) {
      setValue("subtypeId", "");
    }
  }, [getValues, setValue, subtypeOptions]);

  useEffect(() => {
    if (
      cantonId &&
      !cantonOptions.some((option) => Number(option.id) === Number(cantonId))
    ) {
      setValue("cantonId", "");
      setValue("parishId", "");
    }
  }, [cantonId, cantonOptions, setValue]);

  useEffect(() => {
    if (
      parishId &&
      !parishOptions.some((option) => Number(option.id) === Number(parishId))
    ) {
      setValue("parishId", "");
    }
  }, [parishId, parishOptions, setValue]);

  useEffect(() => {
    const touristZoneId = getValues("touristZoneId");
    if (
      touristZoneId &&
      !zoneOptions.some((option) => Number(option.id) === Number(touristZoneId))
    ) {
      setValue("touristZoneId", "");
    }
  }, [getValues, setValue, zoneOptions]);

  useEffect(() => {
    const currentActivityIds = activityIds ?? [];
    const validActivityIds = new Set(activityOptions.map((option) => String(option.id)));
    const nextActivityIds = currentActivityIds.filter((id) =>
      validActivityIds.has(String(id)),
    );
    if (nextActivityIds.length !== currentActivityIds.length) {
      setValue("activityIds", nextActivityIds);
    }
  }, [activityIds, activityOptions, setValue]);

  const save = useCallback(
    async (values: FormValues, submitForReview = false, silent = false) => {
      const submittedSignature = JSON.stringify(values);
      setWorking(submitForReview ? "review" : "auto");
      setError(null);
      try {
        const input = toPayload(values, detail?.version);
        let saved = isNew
          ? await createAdminCenter(token, input)
          : await saveAdminCenter(token, effectiveCode as string, input);
        if (submitForReview) saved = await submitAdminCenterReview(token, saved.code);
        const latestSignature = JSON.stringify(getValues());
        setDetailOverride(saved);
        queryClient.setQueryData(["admin", "center", saved.code], saved);
        if (catalogs && latestSignature === submittedSignature) {
          skipNextAutoSaveRef.current = true;
          reset(toFormValues(saved.draft ?? saved.published, catalogs));
        }
        onSaved(saved);
        if (!silent) {
          onNotice(
            submitForReview
              ? "La ficha fue enviada a revisión."
              : "La ficha fue actualizada.",
          );
        }
        return true;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "No se pudo actualizar la ficha.",
        );
        return false;
      } finally {
        setWorking(null);
      }
    },
    [
      catalogs,
      detail,
      effectiveCode,
      getValues,
      isNew,
      onNotice,
      onSaved,
      queryClient,
      reset,
      token,
    ],
  );

  useEffect(() => {
    if (
      !canEdit ||
      !isDirty ||
      working !== null ||
      skipNextAutoSaveRef.current ||
      lastAttemptedSignatureRef.current === watchedSignature
    ) {
      if (!isDirty) skipNextAutoSaveRef.current = false;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      lastAttemptedSignatureRef.current = watchedSignature;
      void handleSubmit(
        (values) => save(values, false, true),
        () => {
          setError(null);
        },
      )();
    }, 2_000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [canEdit, handleSubmit, isDirty, save, watchedSignature, working]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    },
    [],
  );

  async function goNext() {
    if (activeStep >= summaryStepIndex) return;
    const nextStep = activeStep + 1;
    if (activeStep === 0) {
      await handleSubmit(
        async (values) => {
          const persisted = isDirty || isNew ? await save(values, false, true) : true;
          if (persisted) setActiveStep(nextStep);
        },
        () => setError("Completa los campos obligatorios para continuar."),
      )();
      return;
    }
    setActiveStep(nextStep);
  }

  function goPrevious() {
    setActiveStep((current) => Math.max(0, current - 1));
  }

  function selectStep(step: number) {
    if (step > 0 && !effectiveCode) return;
    setActiveStep(step);
  }

  async function publish() {
    if (!detail) return;
    setWorking("publish");
    setError(null);
    try {
      const published = await publishAdminCenter(token, detail.code);
      setDetailOverride(published);
      queryClient.setQueryData(["admin", "center", published.code], published);
      if (catalogs) reset(toFormValues(published.draft ?? published.published, catalogs));
      onSaved(published);
      onNotice("La ficha fue publicada en la aplicación móvil.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar la ficha.");
    } finally {
      setWorking(null);
    }
  }

  if (loading) {
    return <ContentState status="loading" label="Cargando ficha" />;
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <PageHeader
        title={isNew ? "Nueva ficha turística" : `Editar ficha ${detail?.code ?? code}`}
        description="Completa la información institucional y adjunta fotos verificadas antes de publicar."
        titleVariant="h5"
        headingComponent="h2"
        backAction={
          <Button startIcon={<ArrowBackRounded />} onClick={onClose} sx={{ mb: 1 }}>
            Volver al inventario
          </Button>
        }
        actions={[
          canReview && !isNew ? (
            <Button
              key="review"
              type="button"
              variant="contained"
              startIcon={<CloudUploadRounded />}
              onClick={() => void handleSubmit((values) => save(values, true))()}
              disabled={working !== null}
            >
              {working === "review" ? "Enviando…" : "Enviar a revisión"}
            </Button>
          ) : null,
          canPublish ? (
            <Button
              key="publish"
              type="button"
              variant="contained"
              startIcon={<PublishRounded />}
              onClick={() => void publish()}
              disabled={working !== null}
            >
              {working === "publish" ? "Publicando…" : "Publicar"}
            </Button>
          ) : null,
        ]}
      />
      {displayError ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {displayError}
        </Alert>
      ) : null}
      {detail?.review?.observation ? (
        <Alert severity={state === "RECHAZADO" ? "warning" : "info"}>
          Observación: {detail.review.observation}
        </Alert>
      ) : null}
      {!canEdit && state !== "APROBADO" ? (
        <Alert severity="info">
          La ficha está en revisión. Puedes consultar la propuesta, pero no modificarla.
        </Alert>
      ) : null}

      <CenterWizardStepper
        steps={centerWizardSteps}
        activeStep={activeStep}
        canNavigate={Boolean(effectiveCode)}
        onSelect={selectStep}
      />

      <ContinuousCenterSectionWorkflow
        token={token}
        code={effectiveCode}
        detail={detail}
        catalogs={catalogs}
        canEdit={canEdit}
        activeSectionCode={activeSectionCode}
        visible={isSectionStep}
        showOverview={false}
        onDetailChanged={(saved) => {
          setDetailOverride(saved);
          queryClient.setQueryData(["admin", "center", saved.code], saved);
          onSaved(saved);
        }}
        onError={setError}
      />

      <Box sx={{ display: isSectionStep ? "block" : "none" }}>
        <FlatSurface
          id="center-section-identificacion"
          padding="default"
          sx={{ display: activeSectionCode === "identificacion" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<CategoryRounded />}
              title="Identificación y clasificación"
              description="Estos campos determinan el código institucional y la ubicación territorial."
            />
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Nombre del atractivo"
                  fullWidth
                  required
                  disabled={!canEdit}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register("name", {
                    required: "El nombre es obligatorio",
                    maxLength: { value: 180, message: "Máximo 180 caracteres" },
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Categoría"
                  name="categoryId"
                  options={catalogs?.categories ?? []}
                  register={register}
                  disabled={!canEdit}
                  required
                  onValueChange={() => {
                    setValue("typeId", "");
                    setValue("subtypeId", "");
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Tipo"
                  name="typeId"
                  options={typeOptions}
                  register={register}
                  disabled={!canEdit || !categoryId}
                  required
                  onValueChange={() => setValue("subtypeId", "")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Subtipo"
                  name="subtypeId"
                  options={subtypeOptions}
                  register={register}
                  disabled={!canEdit || !typeId}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Zona turística"
                  name="touristZoneId"
                  options={zoneOptions}
                  register={register}
                  disabled={!canEdit || !cantonId}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Provincia"
                  name="provinceId"
                  options={catalogs?.provinces ?? []}
                  register={register}
                  disabled={!canEdit}
                  required
                  onValueChange={() => {
                    setValue("cantonId", "");
                    setValue("parishId", "");
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Cantón"
                  name="cantonId"
                  options={cantonOptions}
                  register={register}
                  disabled={!canEdit || !provinceId}
                  required
                  onValueChange={() => setValue("parishId", "")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Parroquia"
                  name="parishId"
                  options={parishOptions}
                  register={register}
                  disabled={!canEdit || !cantonId}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Línea de producto"
                  name="productLineId"
                  options={catalogs?.lines ?? []}
                  register={register}
                  disabled={!canEdit}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Escenario"
                  name="scenarioId"
                  options={catalogs?.scenarios ?? []}
                  register={register}
                  disabled={!canEdit}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CatalogSelect
                  label="Jerarquía calculada"
                  name="hierarchyId"
                  options={catalogs?.hierarchies ?? []}
                  register={register}
                  disabled
                />
              </Grid>
            </Grid>
          </Stack>
        </FlatSurface>

        <FlatSurface
          id="center-section-ubicacion-admin"
          padding="default"
          sx={{ display: activeSectionCode === "ubicacion-admin" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<MapRounded />}
              title="Ubicación"
              description="La API sincroniza las coordenadas con PostGIS."
            />
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Latitud"
                  type="number"
                  fullWidth
                  required
                  disabled={!canEdit}
                  {...register("latitude", { required: "La latitud es obligatoria" })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Longitud"
                  type="number"
                  fullWidth
                  required
                  disabled={!canEdit}
                  {...register("longitude", { required: "La longitud es obligatoria" })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Altitud (msnm)"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  {...register("altitudeMeters")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Barrio, sector o comuna"
                  fullWidth
                  disabled={!canEdit}
                  {...register("address.barrio")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Calle principal"
                  fullWidth
                  disabled={!canEdit}
                  {...register("address.street")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Número"
                  fullWidth
                  disabled={!canEdit}
                  {...register("address.number")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Calle transversal"
                  fullWidth
                  disabled={!canEdit}
                  {...register("address.crossStreet")}
                />
              </Grid>
            </Grid>
          </Stack>
        </FlatSurface>

        <FlatSurface
          padding="default"
          sx={{ display: activeSectionCode === "ubicacion-admin" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<BusinessRounded />}
              title="Administración"
              description="Contacto institucional responsable del atractivo."
            />
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Tipo de administrador"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.type")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Institución"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.institution")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nombre del responsable"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.name")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Cargo"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.position")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.phone")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Correo"
                  type="email"
                  fullWidth
                  disabled={!canEdit}
                  {...register("administration.email")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Observación"
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={!canEdit}
                  {...register("administration.observation")}
                />
              </Grid>
            </Grid>
          </Stack>
        </FlatSurface>

        <FlatSurface
          id="center-section-descripcion"
          padding="default"
          sx={{ display: activeSectionCode === "descripcion" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<FactCheckRounded />}
              title="Descripción del atractivo"
              description="Redacta la descripción pública de la ficha, con un máximo de 500 caracteres."
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={6}
              disabled={!canEdit}
              {...register("description", {
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              })}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
            />
          </Stack>
        </FlatSurface>

        <FlatSurface
          id="center-section-caracteristicas"
          padding="default"
          sx={{ display: activeSectionCode === "caracteristicas" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<AccessTimeRounded />}
              title="Ingreso y atención"
              description="Información que se mostrará en la ficha pública cuando se publique."
            />
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CatalogSelect
                  label="Tipo de ingreso"
                  name="admission.incomeTypeId"
                  options={catalogs?.incomeTypes ?? []}
                  register={register}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CatalogSelect
                  label="Modalidad de atención"
                  name="admission.attentionModeId"
                  options={catalogs?.attentionModes ?? []}
                  register={register}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Hora de ingreso"
                  type="time"
                  fullWidth
                  disabled={!canEdit}
                  InputLabelProps={{ shrink: true }}
                  {...register("admission.opensAt")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Hora de salida"
                  type="time"
                  fullWidth
                  disabled={!canEdit}
                  InputLabelProps={{ shrink: true }}
                  {...register("admission.closesAt")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Precio desde"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  {...register("admission.priceFrom")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Precio hasta"
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  {...register("admission.priceTo")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Otra modalidad o detalle"
                  fullWidth
                  disabled={!canEdit}
                  {...register("admission.otherAttention")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Observación"
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={!canEdit}
                  {...register("admission.observation")}
                />
              </Grid>
            </Grid>
          </Stack>
        </FlatSurface>
        <FlatSurface
          id="center-section-actividades"
          padding="default"
          sx={{ display: activeSectionCode === "actividades" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<DirectionsWalkRounded />}
              title="Actividades"
              description="Selecciona únicamente las actividades que se practican en el atractivo."
            />
            <OptionGrid
              options={activityOptions}
              selectedName="activityIds"
              register={register}
              disabled={!canEdit || !categoryId}
            />
          </Stack>
        </FlatSurface>
        <FlatSurface
          id="center-section-accesibilidad"
          padding="default"
          sx={{ display: activeSectionCode === "accesibilidad" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<AccessibleRounded />}
              title="Accesibilidad"
              description="Registra las condiciones verificadas para orientar a turistas."
            />
            <OptionGrid
              options={catalogs?.accessibilityTypes ?? []}
              selectedName="accessibilityIds"
              register={register}
              disabled={!canEdit}
            />
          </Stack>
        </FlatSurface>
        <FlatSurface
          id="center-section-planta"
          padding="default"
          sx={{ display: activeSectionCode === "planta" ? "block" : "none" }}
        >
          <Stack spacing={webTokens.spacing.section}>
            <SectionHeader
              icon={<MiscellaneousServicesRounded />}
              title="Facilidades"
              description="Indica los servicios y elementos disponibles en el entorno."
            />
            <OptionGrid
              options={catalogs?.facilities ?? []}
              selectedName="facilityIds"
              register={register}
              disabled={!canEdit}
              selectedIds={selectedFacilityIds}
            />
          </Stack>
        </FlatSurface>
        <Box sx={{ display: activeSectionCode === "anexos" ? "block" : "none" }}>
          <MediaManager
            token={token}
            code={effectiveCode}
            canEdit={canEdit || state === "APROBADO"}
            onNotice={onNotice}
          />
        </Box>
      </Box>

      {isSummaryStep ? <CenterSummaryStep detail={detail} catalogs={catalogs} /> : null}

      <CenterWizardNavigation
        activeStep={activeStep}
        lastStep={summaryStepIndex}
        working={working !== null}
        onPrevious={goPrevious}
        onNext={() => void goNext()}
      />
    </Stack>
  );
}

function CenterWizardStepper({
  steps,
  activeStep,
  canNavigate,
  onSelect,
}: {
  steps: ReadonlyArray<{ key: string; title: string; description: string }>;
  activeStep: number;
  canNavigate: boolean;
  onSelect: (step: number) => void;
}) {
  const isSummary = activeStep >= steps.length;
  const active = steps[activeStep];
  return (
    <FlatSurface padding="compact">
      <Stack spacing={webTokens.spacing.control}>
        <Box
          component="nav"
          aria-label="Secciones de la ficha turística"
          role="tablist"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
              md: "repeat(7, minmax(0, 1fr))",
            },
            gap: { xs: 1, sm: 1.25 },
          }}
        >
          {steps.map((step, index) => {
            const completed = isSummary || index < activeStep;
            const selected = !isSummary && index === activeStep;
            return (
              <ButtonBase
                key={step.key}
                component="button"
                type="button"
                role="tab"
                aria-label={`Sección ${index + 1}: ${step.title}`}
                aria-selected={selected}
                aria-current={selected ? "step" : undefined}
                disabled={index > 0 && !canNavigate}
                onClick={() => onSelect(index)}
                title={step.title}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  minWidth: 0,
                  minHeight: { xs: 64, sm: 78 },
                  p: { xs: 1, sm: 1.25 },
                  border: 1,
                  borderColor: selected ? "primary.main" : "divider",
                  borderRadius: 1.5,
                  bgcolor: selected ? "action.selected" : "transparent",
                  textAlign: "left",
                  transition: "border-color 120ms ease, background-color 120ms ease",
                  "&:hover": {
                    borderColor: selected ? "primary.main" : "text.secondary",
                    bgcolor: selected ? "action.selected" : "action.hover",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.55,
                  },
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                  <Box
                    component="span"
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      width: { xs: 24, sm: 28 },
                      height: { xs: 24, sm: 28 },
                      borderRadius: "50%",
                      bgcolor:
                        selected || completed
                          ? "primary.main"
                          : "action.disabledBackground",
                      color:
                        selected || completed ? "primary.contrastText" : "text.secondary",
                      fontSize: { xs: "0.72rem", sm: "0.78rem" },
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ minWidth: 0, textOverflow: "ellipsis", overflow: "hidden" }}
                  >
                    {completed ? "Completada" : selected ? "Actual" : "Pendiente"}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.75,
                    minWidth: 0,
                    fontWeight: selected ? 700 : 500,
                    lineHeight: 1.2,
                    display: "-webkit-box",
                    overflow: "hidden",
                    overflowWrap: "anywhere",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                  }}
                >
                  {step.title}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          gap={1}
        >
          <Typography variant="body2" color="text.secondary">
            {isSummary ? "Resumen final" : `Sección ${activeStep + 1} de ${steps.length}`}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign={{ xs: "left", sm: "right" }}
          >
            {isSummary
              ? "Revisa la ficha completa antes de enviarla a revisión."
              : active?.description}
          </Typography>
        </Stack>
      </Stack>
    </FlatSurface>
  );
}

function CenterWizardNavigation({
  activeStep,
  lastStep,
  working,
  onPrevious,
  onNext,
}: {
  activeStep: number;
  lastStep: number;
  working: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Stack
      direction={{ xs: "column-reverse", sm: "row" }}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      gap={webTokens.spacing.control}
    >
      <Button
        type="button"
        variant="outlined"
        onClick={onPrevious}
        disabled={activeStep === 0 || working}
        startIcon={<ArrowBackRounded />}
      >
        Anterior
      </Button>
      {activeStep < lastStep ? (
        <Button
          type="button"
          variant="contained"
          onClick={onNext}
          disabled={working}
          endIcon={<ArrowForwardRounded />}
        >
          Siguiente
        </Button>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Revisión final de la ficha
        </Typography>
      )}
    </Stack>
  );
}

function CenterSummaryStep({
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
    ["Nombre", draft?.name ?? "Pendiente"],
    ["Subtipo", findCatalogName(catalogs?.subtypes, draft?.subtypeId)],
    ["Zona turística", findCatalogName(catalogs?.zones, draft?.touristZoneId)],
    ["Parroquia", findCatalogName(catalogs?.parishes, draft?.parishId)],
    ["Coordenadas", formatCoordinates(draft?.latitude, draft?.longitude)],
    ["Estado", detail?.status.name ?? "Pendiente"],
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
                    border: 1,
                    borderColor: "divider",
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

function findCatalogName(
  options: Array<{ id: number; name: string }> | undefined,
  id: number | undefined,
) {
  if (id === undefined) return "Pendiente";
  return options?.find((option) => Number(option.id) === Number(id))?.name ?? "Pendiente";
}

function formatCoordinates(latitude: number | undefined, longitude: number | undefined) {
  if (latitude === undefined || longitude === undefined) return "Pendiente";
  return `${latitude}, ${longitude}`;
}

function CatalogSelect({
  label,
  name,
  options,
  register,
  disabled,
  required,
  onValueChange,
}: {
  label: string;
  name: keyof FormValues | `administration.${string}` | `admission.${string}`;
  options: Array<{ id: number; name: string }>;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  disabled: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const field = register(name as never, {
    required: required ? `${label} es obligatorio` : false,
  });
  return (
    <FormControl fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        defaultValue=""
        disabled={disabled}
        {...field}
        onChange={(event) => {
          field.onChange(event);
          onValueChange?.(String(event.target.value));
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function OptionGrid({
  options,
  selectedName,
  register,
  disabled,
  selectedIds = [],
}: {
  options: Array<{ id: number; name: string; categoryId?: number; groupId?: number }>;
  selectedName: "activityIds" | "accessibilityIds" | "facilityIds";
  register: ReturnType<typeof useForm<FormValues>>["register"];
  disabled: boolean;
  selectedIds?: string[];
}) {
  if (options.length === 0) {
    return <Typography color="text.secondary">No hay opciones configuradas.</Typography>;
  }
  return (
    <Grid container spacing={webTokens.spacing.inline}>
      {options.map((option) => (
        <Grid key={option.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                value={String(option.id)}
                disabled={disabled}
                {...register(selectedName)}
              />
            }
            label={option.name}
          />
          {selectedName === "facilityIds" && selectedIds.includes(String(option.id)) ? (
            <Stack spacing={1} sx={{ pl: 4, pr: 1, pb: 1 }}>
              <TextField
                label="Cantidad"
                type="number"
                size="small"
                fullWidth
                disabled={disabled}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                {...register(`facilityQuantities.${option.id}` as never)}
              />
              <TextField
                label="Observación de la facilidad"
                size="small"
                fullWidth
                disabled={disabled}
                {...register(`facilityObservations.${option.id}` as never)}
              />
            </Stack>
          ) : null}
        </Grid>
      ))}
    </Grid>
  );
}

function toFormValues(
  data: CenterDraft | null | undefined,
  catalogs: AdminCatalogs,
): FormValues {
  if (!data) return emptyValues;
  const subtype = catalogs.subtypes.find(
    (option) => Number(option.id) === Number(data.subtypeId),
  );
  const type = catalogs.types.find(
    (option) => Number(option.id) === Number(subtype?.typeId),
  );
  const parish = catalogs.parishes.find(
    (option) => Number(option.id) === Number(data.parishId),
  );
  const canton = catalogs.cantons.find(
    (option) => Number(option.id) === Number(parish?.cantonId),
  );
  return {
    name: data.name ?? "",
    categoryId: String(type?.categoryId ?? ""),
    typeId: String(subtype?.typeId ?? ""),
    subtypeId: String(data.subtypeId ?? ""),
    touristZoneId: String(data.touristZoneId ?? ""),
    provinceId: String(canton?.provinceId ?? ""),
    cantonId: String(parish?.cantonId ?? ""),
    parishId: String(data.parishId ?? ""),
    productLineId: String(data.productLineId ?? ""),
    scenarioId: String(data.scenarioId ?? ""),
    hierarchyId: String(data.hierarchyId ?? ""),
    latitude: String(data.latitude ?? ""),
    longitude: String(data.longitude ?? ""),
    altitudeMeters: data.altitudeMeters == null ? "" : String(data.altitudeMeters),
    description: data.description ?? "",
    address: {
      barrio: data.address?.barrio ?? "",
      street: data.address?.street ?? "",
      number: data.address?.number ?? "",
      crossStreet: data.address?.crossStreet ?? "",
    },
    administration: {
      type: data.administration?.type ?? "",
      institution: data.administration?.institution ?? "",
      name: data.administration?.name ?? "",
      position: data.administration?.position ?? "",
      phone: data.administration?.phone ?? "",
      email: data.administration?.email ?? "",
      observation: data.administration?.observation ?? "",
    },
    admission: {
      incomeTypeId: String(data.admission?.incomeTypeId ?? ""),
      attentionModeId: String(data.admission?.attentionModeId ?? ""),
      opensAt: data.admission?.opensAt ?? "",
      closesAt: data.admission?.closesAt ?? "",
      otherAttention: data.admission?.otherAttention ?? "",
      reservations: data.admission?.reservations ?? false,
      priceFrom:
        data.admission?.priceFrom == null ? "" : String(data.admission.priceFrom),
      priceTo: data.admission?.priceTo == null ? "" : String(data.admission.priceTo),
      observation: data.admission?.observation ?? "",
    },
    activityIds: (data.activities ?? [])
      .filter((item) => item.active)
      .map((item) => String(item.activityId)),
    accessibilityIds: (data.accessibility ?? [])
      .filter((item) => item.applies)
      .map((item) => String(item.typeId)),
    facilityIds: (data.facilities ?? []).map((item) => String(item.typeId)),
    facilityQuantities: Object.fromEntries(
      (data.facilities ?? []).map((item) => [
        String(item.typeId),
        item.quantity == null ? "" : String(item.quantity),
      ]),
    ),
    facilityObservations: Object.fromEntries(
      (data.facilities ?? []).map((item) => [
        String(item.typeId),
        item.observation ?? "",
      ]),
    ),
  };
}

function toPayload(values: FormValues, version?: number): SaveCenterInput {
  const payload: SaveCenterInput = {
    name: values.name.trim(),
    subtypeId: numberOrUndefined(values.subtypeId),
    touristZoneId: numberOrUndefined(values.touristZoneId),
    parishId: numberOrUndefined(values.parishId),
    productLineId: numberOrUndefined(values.productLineId),
    scenarioId: numberOrUndefined(values.scenarioId),
    hierarchyId: numberOrUndefined(values.hierarchyId),
    latitude: numberOrUndefined(values.latitude),
    longitude: numberOrUndefined(values.longitude),
    altitudeMeters: numberOrUndefined(values.altitudeMeters),
    description: values.description.trim() || undefined,
    address: {
      barrio: values.address.barrio.trim() || undefined,
      street: values.address.street.trim() || undefined,
      number: values.address.number.trim() || undefined,
      crossStreet: values.address.crossStreet.trim() || undefined,
    },
    administration: values.administration.name.trim()
      ? {
          type: values.administration.type.trim() || "OTRO",
          institution: values.administration.institution.trim() || undefined,
          name: values.administration.name.trim(),
          position: values.administration.position.trim() || undefined,
          phone: values.administration.phone.trim() || undefined,
          email: values.administration.email.trim() || undefined,
          observation: values.administration.observation.trim() || undefined,
        }
      : undefined,
    admission:
      numberOrUndefined(values.admission.incomeTypeId) &&
      numberOrUndefined(values.admission.attentionModeId)
        ? {
            incomeTypeId: numberOrUndefined(values.admission.incomeTypeId) as number,
            attentionModeId: numberOrUndefined(
              values.admission.attentionModeId,
            ) as number,
            opensAt: values.admission.opensAt || undefined,
            closesAt: values.admission.closesAt || undefined,
            otherAttention: values.admission.otherAttention.trim() || undefined,
            priceFrom: numberOrUndefined(values.admission.priceFrom),
            priceTo: numberOrUndefined(values.admission.priceTo),
            reservations: values.admission.reservations,
            observation: values.admission.observation.trim() || undefined,
          }
        : undefined,
    activities: values.activityIds.map((id) => ({
      activityId: Number(id),
      active: true,
    })),
    accessibility: values.accessibilityIds.map((id) => ({
      typeId: Number(id),
      applies: true,
    })),
    facilities: values.facilityIds.map((id) => ({
      typeId: Number(id),
      quantity: numberOrUndefined(values.facilityQuantities[id]) ?? 1,
      observation: (values.facilityObservations[id] ?? "").trim() || undefined,
    })),
    version,
  };
  return payload;
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
