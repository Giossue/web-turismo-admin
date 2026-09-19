"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import PublishRounded from "@mui/icons-material/PublishRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Button,
  Checkbox,
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { MediaManager } from "@/components/admin/media-manager";
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
  type CenterDraft,
  type SaveCenterInput,
} from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

type FormValues = {
  name: string;
  subtypeId: string;
  touristZoneId: string;
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
};

const emptyValues: FormValues = {
  name: "",
  subtypeId: "",
  touristZoneId: "",
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
};

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
  const [working, setWorking] = useState<"save" | "review" | "publish" | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
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

  useEffect(() => {
    if (centerQuery.data) {
      reset(toFormValues(centerQuery.data.draft ?? centerQuery.data.published));
    }
  }, [centerQuery.data, reset]);

  const isNew = code === null;
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
  const selectedDraft = detail?.draft ?? detail?.published;
  const parishOptions = catalogs?.parishes ?? [];
  const zoneOptions = catalogs?.zones ?? [];
  const subtypeOptions = catalogs?.subtypes ?? [];
  const canReview = state === "BORRADOR" || state === "RECHAZADO";
  const canPublish = state === "APROBADO";

  async function save(values: FormValues, submitForReview = false) {
    setWorking(submitForReview ? "review" : "save");
    setError(null);
    try {
      const input = toPayload(values, detail?.version);
      let saved = isNew
        ? await createAdminCenter(token, input)
        : await saveAdminCenter(token, code, input);
      if (submitForReview) saved = await submitAdminCenterReview(token, saved.code);
      setDetailOverride(saved);
      queryClient.setQueryData(["admin", "center", saved.code], saved);
      reset(toFormValues(saved.draft ?? saved.published));
      onSaved(saved);
      onNotice(
        submitForReview ? "La ficha fue enviada a revisión." : "Borrador guardado.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la ficha.");
    } finally {
      setWorking(null);
    }
  }

  async function publish() {
    if (!detail) return;
    setWorking("publish");
    setError(null);
    try {
      const published = await publishAdminCenter(token, detail.code);
      setDetailOverride(published);
      queryClient.setQueryData(["admin", "center", published.code], published);
      reset(toFormValues(published.draft ?? published.published));
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
    <Stack
      spacing={webTokens.spacing.control}
      component="form"
      onSubmit={handleSubmit((values) => save(values))}
    >
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
          <Button
            key="save"
            type="submit"
            variant="outlined"
            startIcon={<SaveRounded />}
            disabled={!canEdit || working !== null}
          >
            {working === "save" ? "Guardando…" : "Guardar borrador"}
          </Button>,
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
              color="success"
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

      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
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
                label="Subtipo"
                name="subtypeId"
                options={subtypeOptions}
                register={register}
                disabled={!canEdit}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CatalogSelect
                label="Zona turística"
                name="touristZoneId"
                options={zoneOptions}
                register={register}
                disabled={!canEdit}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CatalogSelect
                label="Parroquia"
                name="parishId"
                options={parishOptions}
                register={register}
                disabled={!canEdit}
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
                label="Jerarquía"
                name="hierarchyId"
                options={catalogs?.hierarchies ?? []}
                register={register}
                disabled={!canEdit}
                required
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
            title="Ubicación y descripción"
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
            <Grid size={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                minRows={4}
                disabled={!canEdit}
                {...register("description", {
                  maxLength: { value: 500, message: "Máximo 500 caracteres" },
                })}
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
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

      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
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
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
            title="Actividades"
            description="Selecciona únicamente las actividades que se practican en el atractivo."
          />
          <OptionGrid
            options={catalogs?.activities ?? []}
            selectedName="activityIds"
            register={register}
            disabled={!canEdit}
          />
        </Stack>
      </FlatSurface>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
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
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.section}>
          <SectionHeader
            title="Facilidades"
            description="Indica los servicios y elementos disponibles en el entorno."
          />
          <OptionGrid
            options={catalogs?.facilities ?? []}
            selectedName="facilityIds"
            register={register}
            disabled={!canEdit}
          />
        </Stack>
      </FlatSurface>
      <MediaManager
        token={token}
        code={detail?.code ?? code}
        canEdit={canEdit || state === "APROBADO"}
        onNotice={onNotice}
      />
      <Typography variant="caption" color="text.secondary">
        {selectedDraft
          ? `Versión de borrador ${detail?.version ?? 0}`
          : "Nueva ficha sin guardar"}
      </Typography>
    </Stack>
  );
}

function CatalogSelect({
  label,
  name,
  options,
  register,
  disabled,
  required,
}: {
  label: string;
  name: keyof FormValues | `administration.${string}` | `admission.${string}`;
  options: Array<{ id: number; name: string }>;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <FormControl fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        defaultValue=""
        disabled={disabled}
        {...register(name as never, {
          required: required ? `${label} es obligatorio` : false,
        })}
      >
        <MenuItem value="">
          <em>Selecciona</em>
        </MenuItem>
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
}: {
  options: Array<{ id: number; name: string; categoryId?: number; groupId?: number }>;
  selectedName: "activityIds" | "accessibilityIds" | "facilityIds";
  register: ReturnType<typeof useForm<FormValues>>["register"];
  disabled: boolean;
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
        </Grid>
      ))}
    </Grid>
  );
}

function toFormValues(data?: CenterDraft | null): FormValues {
  if (!data) return emptyValues;
  return {
    name: data.name ?? "",
    subtypeId: String(data.subtypeId ?? ""),
    touristZoneId: String(data.touristZoneId ?? ""),
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
      quantity: 1,
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
