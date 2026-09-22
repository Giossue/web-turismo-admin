"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import PowerSettingsNewRounded from "@mui/icons-material/PowerSettingsNewRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  AdminTable,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
import { CatalogSelect } from "@/components/ui/catalog-select";
import { CoordinatePickerDialog } from "@/components/admin/coordinate-picker-dialog";
import { RhfCatalogSelect } from "@/components/ui/form/rhf-select";
import { SelectField } from "@/components/ui/form/select-field";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminEstablishment,
  getAdminEstablishments,
  saveAdminEstablishment,
  setAdminEstablishmentActive,
  submitAdminEstablishmentReview,
  type AdminCatalogs,
  type AdminEstablishment,
  type AdminEstablishmentsOptions,
  type SaveEstablishmentInput,
} from "@/lib/admin-api";
import {
  establishmentReviewStatusLabel,
  establishmentReviewStatusTone,
} from "@/lib/admin-labels";
import { adminKeys, catalogsQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { findCatalogIdByName } from "@/lib/values";
import { webTokens } from "@/theme/tokens";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/use-debounced-value";

type EstablishmentFormValues = {
  localityId: string;
  numeroRegistro: string;
  ruc: string;
  nombreComercial: string;
  razonSocial: string;
  activityId: string;
  classificationId: string;
  categoryId: string;
  actividad: string;
  clasificacion: string;
  categoria: string;
  direccion: string;
  telefono: string;
  latitude: string;
  longitude: string;
};

const emptyValues: EstablishmentFormValues = {
  localityId: "",
  numeroRegistro: "",
  ruc: "",
  nombreComercial: "",
  razonSocial: "",
  activityId: "",
  classificationId: "",
  categoryId: "",
  actividad: "",
  clasificacion: "",
  categoria: "",
  direccion: "",
  telefono: "",
  latitude: "",
  longitude: "",
};

const pageSize = ADMIN_TABLE_PAGE_SIZE;

const ACTIVE_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
];

function toFilterOption(option: { id: number; name: string }) {
  return { value: String(option.id), label: option.name };
}

export type EstablishmentManagementRef = {
  openCreate: () => void;
};

export const EstablishmentManagement = forwardRef<
  EstablishmentManagementRef,
  {
    token: string;
    onNotice: (message: string) => void;
    onError: (message: string | null) => void;
    canManageStatus: boolean;
  }
>(function EstablishmentManagement({ token, onNotice, onError, canManageStatus }, ref) {
  const queryClient = useQueryClient();
  const [queryDraft, setQueryDraft] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cantonId, setCantonId] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [activity, setActivity] = useState("");
  const [classification, setClassification] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState("ALL");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<AdminEstablishment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coordinatePickerOpen, setCoordinatePickerOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(queryDraft.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const debouncedActivity = useDebouncedValue(activity.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const debouncedClassification = useDebouncedValue(
    classification.trim(),
    ADMIN_SEARCH_DEBOUNCE_MS,
  );
  const debouncedCategory = useDebouncedValue(category.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const { control, register, reset, setValue, handleSubmit, formState } =
    useForm<EstablishmentFormValues>({ defaultValues: emptyValues });
  const formActivityId = useWatch({ control, name: "activityId" });
  const formClassificationId = useWatch({ control, name: "classificationId" });
  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });

  const catalogsQuery = useQuery(catalogsQueryOptions(token));
  const establishmentFilters: AdminEstablishmentsOptions = {
    q: debouncedQuery || undefined,
    activity: debouncedActivity || undefined,
    classification: debouncedClassification || undefined,
    category: debouncedCategory || undefined,
    provinceId: provinceId ? Number(provinceId) : undefined,
    cantonId: cantonId ? Number(cantonId) : undefined,
    localityId: localityId ? Number(localityId) : undefined,
    active: active === "ALL" ? undefined : active === "true",
    limit: pageSize,
    offset: page * pageSize,
  };
  const establishmentsQuery = useQuery({
    queryKey: adminKeys.establishments(establishmentFilters),
    queryFn: () => getAdminEstablishments(token, establishmentFilters),
    enabled: token.length > 0,
  });

  useEffect(() => {
    if (catalogsQuery.error) {
      onError(errorMessage(catalogsQuery.error, "No se pudieron cargar los catálogos."));
    }
  }, [catalogsQuery.error, onError]);

  useEffect(() => {
    if (establishmentsQuery.error) {
      onError(errorMessage(establishmentsQuery.error, "No se pudo cargar el catastro."));
    }
  }, [establishmentsQuery.error, onError]);

  const saveMutation = useMutation({
    mutationFn: async (input: SaveEstablishmentInput) =>
      editing
        ? saveAdminEstablishment(token, editing.id, input)
        : createAdminEstablishment(token, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.allEstablishments() });
      setDialogOpen(false);
      setEditing(null);
      onNotice(
        editing
          ? canManageStatus
            ? "El establecimiento fue actualizado."
            : "El catastro fue guardado como borrador."
          : canManageStatus
            ? "El establecimiento fue creado."
            : "El catastro fue creado como borrador.",
      );
    },
    onError: (cause) =>
      onError(errorMessage(cause, "No se pudo guardar el establecimiento.")),
  });

  const submitReviewMutation = useMutation({
    mutationFn: (id: number) => submitAdminEstablishmentReview(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.allEstablishments() });
      onNotice("El catastro fue enviado a revisión.");
    },
    onError: (cause) =>
      onError(errorMessage(cause, "No se pudo enviar el catastro a revisión.")),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: boolean }) =>
      setAdminEstablishmentActive(token, id, next),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.allEstablishments() });
      onNotice(
        variables.next
          ? "El establecimiento fue reactivado."
          : "El establecimiento fue desactivado.",
      );
    },
    onError: (cause) => onError(errorMessage(cause, "No se pudo cambiar el estado.")),
  });

  const data = establishmentsQuery.data;
  const catalogs = catalogsQuery.data;
  const establishmentActivities = catalogs?.establishmentActivities ?? [];
  const establishmentClassifications = useMemo(
    () =>
      (catalogs?.establishmentClassifications ?? []).filter(
        (option) =>
          !formActivityId || String(option.activityId) === String(formActivityId),
      ),
    [catalogs?.establishmentClassifications, formActivityId],
  );
  const establishmentCategories = useMemo(
    () =>
      (catalogs?.establishmentCategories ?? []).filter(
        (option) =>
          !formClassificationId ||
          String(option.classificationId) === String(formClassificationId),
      ),
    [catalogs?.establishmentCategories, formClassificationId],
  );
  const filterActivityId = establishmentActivities.find(
    (option) => option.name === activity,
  )?.id;
  const filterClassifications = useMemo(
    () =>
      (catalogs?.establishmentClassifications ?? []).filter(
        (option) =>
          !filterActivityId || String(option.activityId) === String(filterActivityId),
      ),
    [catalogs?.establishmentClassifications, filterActivityId],
  );
  const filterClassificationId = filterClassifications.find(
    (option) => option.name === classification,
  )?.id;
  const filterCategories = useMemo(
    () =>
      (catalogs?.establishmentCategories ?? []).filter(
        (option) =>
          !filterClassificationId ||
          String(option.classificationId) === String(filterClassificationId),
      ),
    [catalogs?.establishmentCategories, filterClassificationId],
  );
  const provinces = catalogs?.provinces ?? [];
  const cantons = (catalogs?.cantons ?? []).filter(
    (option) => !provinceId || String(option.provinceId) === provinceId,
  );
  const localities = (catalogs?.localities ?? []).filter(
    (option) =>
      (!provinceId || String(option.provinceId) === provinceId) &&
      (!cantonId || String(option.cantonId) === cantonId),
  );
  const openCreate = useCallback(() => {
    setEditing(null);
    reset(emptyValues);
    setDialogOpen(true);
  }, [reset]);

  useImperativeHandle(ref, () => ({ openCreate }), [openCreate]);

  function openEdit(item: AdminEstablishment) {
    setEditing(item);
    reset(toFormValues(item, catalogs));
    setDialogOpen(true);
  }

  function submitForm(values: EstablishmentFormValues) {
    const latitudeText = values.latitude.trim();
    const longitudeText = values.longitude.trim();
    if (!latitudeText || !longitudeText) {
      onError("La latitud y la longitud son obligatorias.");
      return;
    }
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      onError("La latitud o la longitud no están dentro de un rango válido.");
      return;
    }
    if (values.ruc.trim() && !/^\d{13}$/.test(values.ruc.trim())) {
      onError("El RUC debe contener 13 dígitos.");
      return;
    }
    onError(null);
    const activityOption = establishmentActivities.find(
      (option) => String(option.id) === values.activityId,
    );
    const classificationOption = establishmentClassifications.find(
      (option) => String(option.id) === values.classificationId,
    );
    const categoryOption = establishmentCategories.find(
      (option) => String(option.id) === values.categoryId,
    );
    saveMutation.mutate({
      localityId: Number(values.localityId),
      numeroRegistro: values.numeroRegistro.trim() || undefined,
      ruc: values.ruc.trim() || undefined,
      nombreComercial: values.nombreComercial.trim(),
      razonSocial: values.razonSocial.trim() || undefined,
      activityId: activityOption?.id,
      classificationId: classificationOption?.id,
      categoryId: categoryOption?.id,
      actividad: activityOption?.name ?? values.actividad.trim(),
      clasificacion:
        classificationOption?.name ?? (values.clasificacion.trim() || undefined),
      categoria: categoryOption?.name ?? (values.categoria.trim() || undefined),
      direccion: values.direccion.trim() || undefined,
      telefono: values.telefono.trim() || undefined,
      latitude,
      longitude,
    });
  }

  return (
    <Stack spacing={webTokens.spacing.section}>
      <AdminTableToolbar>
        <Grid container spacing={webTokens.spacing.control}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <SearchField
              label="Buscar por nombre, actividad o registro"
              value={queryDraft}
              onChange={(event) => {
                setQueryDraft(event.target.value);
                setPage(0);
              }}
              slotProps={{ htmlInput: { "aria-label": "Buscar establecimientos" } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <SelectField
              id="establishment-province-filter"
              label="Provincia"
              value={provinceId}
              emptyLabel="Todas"
              options={provinces.map(toFilterOption)}
              onChange={(value) => {
                setProvinceId(value);
                setCantonId("");
                setLocalityId("");
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <SelectField
              id="establishment-canton-filter"
              label="Cantón"
              value={cantonId}
              emptyLabel="Todos"
              options={cantons.map(toFilterOption)}
              disabled={!provinceId}
              onChange={(value) => {
                setCantonId(value);
                setLocalityId("");
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <SelectField
              id="establishment-locality-filter"
              label="Localidad"
              value={localityId}
              emptyLabel="Todas"
              options={localities.map(toFilterOption)}
              onChange={(value) => {
                setLocalityId(value);
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <CatalogSelect
              id="establishment-activity-filter"
              label="Actividad"
              value={filterActivityId ? String(filterActivityId) : ""}
              options={establishmentActivities}
              onChange={(value) => {
                const option = establishmentActivities.find(
                  (candidate) => String(candidate.id) === value,
                );
                setActivity(option?.name ?? "");
                setClassification("");
                setCategory("");
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <CatalogSelect
              id="establishment-classification-filter"
              label="Clasificación"
              value={filterClassificationId ? String(filterClassificationId) : ""}
              options={filterClassifications}
              disabled={!activity}
              onChange={(value) => {
                const option = filterClassifications.find(
                  (candidate) => String(candidate.id) === value,
                );
                setClassification(option?.name ?? "");
                setCategory("");
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <CatalogSelect
              id="establishment-category-filter"
              label="Categoría"
              value={
                filterCategories.find((option) => option.name === category)
                  ? String(
                      filterCategories.find((option) => option.name === category)?.id,
                    )
                  : ""
              }
              options={filterCategories}
              disabled={!classification}
              onChange={(value) => {
                const option = filterCategories.find(
                  (candidate) => String(candidate.id) === value,
                );
                setCategory(option?.name ?? "");
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <SelectField
              id="establishment-status-filter"
              label="Estado"
              value={active}
              options={ACTIVE_FILTER_OPTIONS}
              onChange={(value) => {
                setActive(value || "ALL");
                setPage(0);
              }}
            />
          </Grid>
        </Grid>
      </AdminTableToolbar>

      <AdminTable
        ariaLabel="Catastro de establecimientos"
        minWidth={760}
        loading={establishmentsQuery.isLoading}
        empty={!data?.items.length}
        emptyMessage="No hay establecimientos para los filtros seleccionados."
        pagination={{ page, total: data?.total ?? 0, pageSize, onPageChange: setPage }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Establecimiento</TableCell>
            <TableCell>Localidad</TableCell>
            <TableCell>Actividad</TableCell>
            <TableCell>Registro</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.items ?? []).map((item) => (
            <TableRow key={item.id} hover>
              <TableCell component="th" scope="row">
                <Typography fontWeight={600}>{item.nombreComercial}</Typography>
                {item.categoria ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.categoriaEtiqueta ?? item.categoria}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>{item.localityName}</TableCell>
              <TableCell>{item.actividad}</TableCell>
              <TableCell>{item.numeroRegistro ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge
                  label={establishmentReviewStatusLabel(item.reviewStatus)}
                  tone={establishmentReviewStatusTone(item.reviewStatus)}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar establecimiento">
                  <span>
                    <IconButton
                      aria-label={`Editar ${item.nombreComercial}`}
                      onClick={() => openEdit(item)}
                      disabled={
                        !canManageStatus &&
                        !["BORRADOR", "RECHAZADO"].includes(item.reviewStatus)
                      }
                    >
                      <EditRounded />
                    </IconButton>
                  </span>
                </Tooltip>
                {!canManageStatus &&
                ["BORRADOR", "RECHAZADO"].includes(item.reviewStatus) ? (
                  <Tooltip title="Enviar a revisión">
                    <span>
                      <IconButton
                        aria-label={`Enviar a revisión ${item.nombreComercial}`}
                        onClick={() => submitReviewMutation.mutate(item.id)}
                        disabled={submitReviewMutation.isPending}
                      >
                        <SendRounded />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
                {canManageStatus ? (
                  <Tooltip title={item.active ? "Desactivar" : "Reactivar"}>
                    <span>
                      <IconButton
                        aria-label={`${item.active ? "Desactivar" : "Reactivar"} ${item.nombreComercial}`}
                        onClick={() =>
                          activeMutation.mutate({ id: item.id, next: !item.active })
                        }
                        disabled={activeMutation.isPending}
                      >
                        <PowerSettingsNewRounded />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>

      <Dialog
        open={dialogOpen}
        onClose={() => !saveMutation.isPending && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editing ? "Editar establecimiento" : "Nuevo establecimiento"}
        </DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            id="establishment-form"
            onSubmit={handleSubmit(submitForm)}
            spacing={webTokens.spacing.control}
            sx={{ pt: 1 }}
          >
            <input type="hidden" {...register("actividad")} />
            <input type="hidden" {...register("clasificacion")} />
            <input type="hidden" {...register("categoria")} />
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfCatalogSelect
                  id="establishment-locality"
                  control={control}
                  name="localityId"
                  label="Localidad"
                  options={catalogs?.localities ?? []}
                  rules={{ required: "Selecciona una localidad." }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Número de registro"
                  fullWidth
                  {...register("numeroRegistro", { maxLength: 40 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Nombre comercial"
                  fullWidth
                  required
                  error={Boolean(formState.errors.nombreComercial)}
                  helperText={formState.errors.nombreComercial?.message}
                  {...register("nombreComercial", {
                    required: "Ingresa el nombre comercial.",
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfCatalogSelect
                  id="establishment-activity"
                  control={control}
                  name="activityId"
                  label="Actividad"
                  options={establishmentActivities}
                  required
                  rules={{ required: "Selecciona una actividad." }}
                  onValueChange={(value) => {
                    setValue("classificationId", "");
                    setValue("categoryId", "");
                    const option = establishmentActivities.find(
                      (candidate) => String(candidate.id) === value,
                    );
                    setValue("actividad", option?.name ?? "");
                    setValue("clasificacion", "");
                    setValue("categoria", "");
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfCatalogSelect
                  id="establishment-classification"
                  control={control}
                  name="classificationId"
                  label="Clasificación"
                  options={establishmentClassifications}
                  disabled={!formActivityId}
                  onValueChange={(value) => {
                    setValue("categoryId", "");
                    const option = establishmentClassifications.find(
                      (candidate) => String(candidate.id) === value,
                    );
                    setValue("clasificacion", option?.name ?? "");
                    setValue("categoria", "");
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfCatalogSelect
                  id="establishment-category"
                  control={control}
                  name="categoryId"
                  label="Categoría"
                  options={establishmentCategories}
                  disabled={!formClassificationId}
                  onValueChange={(value) => {
                    const option = establishmentCategories.find(
                      (candidate) => String(candidate.id) === value,
                    );
                    setValue("categoria", option?.name ?? "");
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Razón social" fullWidth {...register("razonSocial")} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="RUC"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 13 } }}
                  {...register("ruc")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="Dirección" fullWidth {...register("direccion")} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Teléfono" fullWidth {...register("telefono")} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Latitud"
                  fullWidth
                  required
                  type="number"
                  error={Boolean(formState.errors.latitude)}
                  helperText={formState.errors.latitude?.message}
                  slotProps={{ htmlInput: { step: "any", min: -90, max: 90 } }}
                  {...register("latitude", {
                    required: "Ingresa la latitud.",
                    validate: (value) => {
                      const number = Number(value);
                      return value.trim() !== "" &&
                        Number.isFinite(number) &&
                        number >= -90 &&
                        number <= 90
                        ? true
                        : "La latitud debe estar entre -90 y 90.";
                    },
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Longitud"
                  fullWidth
                  required
                  type="number"
                  error={Boolean(formState.errors.longitude)}
                  helperText={formState.errors.longitude?.message}
                  slotProps={{ htmlInput: { step: "any", min: -180, max: 180 } }}
                  {...register("longitude", {
                    required: "Ingresa la longitud.",
                    validate: (value) => {
                      const number = Number(value);
                      return value.trim() !== "" &&
                        Number.isFinite(number) &&
                        number >= -180 &&
                        number <= 180
                        ? true
                        : "La longitud debe estar entre -180 y 180.";
                    },
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  onClick={() => setCoordinatePickerOpen(true)}
                  startIcon={<LocationOnRounded />}
                  type="button"
                  variant="outlined"
                >
                  Seleccionar coordenadas en el mapa
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button
            form="establishment-form"
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            startIcon={
              saveMutation.isPending ? <CircularProgress size={16} /> : undefined
            }
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
      <CoordinatePickerDialog
        key={coordinatePickerOpen ? "coordinate-picker-open" : "coordinate-picker-closed"}
        initialLatitude={latitude}
        initialLongitude={longitude}
        onClose={() => setCoordinatePickerOpen(false)}
        onConfirm={({ latitude: nextLatitude, longitude: nextLongitude }) => {
          setValue("latitude", String(nextLatitude), { shouldDirty: true });
          setValue("longitude", String(nextLongitude), { shouldDirty: true });
          setCoordinatePickerOpen(false);
          onNotice("Coordenadas seleccionadas en el mapa.");
        }}
        open={coordinatePickerOpen}
      />
    </Stack>
  );
});

function toFormValues(
  item: AdminEstablishment,
  catalogs?: AdminCatalogs,
): EstablishmentFormValues {
  const activityId =
    item.activityId ??
    findCatalogIdByName(catalogs?.establishmentActivities, item.actividad);
  const classificationId =
    item.classificationId ??
    findCatalogIdByName(
      catalogs?.establishmentClassifications?.filter(
        (option) => !activityId || String(option.activityId) === String(activityId),
      ),
      item.clasificacion,
    );
  const categoryId =
    item.categoryId ??
    findCatalogIdByName(
      catalogs?.establishmentCategories?.filter(
        (option) =>
          !classificationId ||
          String(option.classificationId) === String(classificationId),
      ),
      item.categoria,
    );
  return {
    localityId: String(item.localityId),
    numeroRegistro: item.numeroRegistro ?? "",
    ruc: item.ruc ?? "",
    nombreComercial: item.nombreComercial,
    razonSocial: item.razonSocial ?? "",
    activityId: activityId === null ? "" : String(activityId ?? ""),
    classificationId: classificationId === null ? "" : String(classificationId ?? ""),
    categoryId: categoryId === null ? "" : String(categoryId ?? ""),
    actividad: item.actividad,
    clasificacion: item.clasificacion ?? "",
    categoria: item.categoria ?? "",
    direccion: item.direccion ?? "",
    telefono: item.telefono ?? "",
    latitude: item.latitude === null ? "" : String(item.latitude),
    longitude: item.longitude === null ? "" : String(item.longitude),
  };
}
