"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import PowerSettingsNewRounded from "@mui/icons-material/PowerSettingsNewRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  AdminTable,
  AdminTableFooter,
  AdminTableToolbar,
} from "@/components/ui/admin-table";
import { CatalogSelect } from "@/components/ui/catalog-select";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminEstablishment,
  getAdminCatalogs,
  getAdminEstablishments,
  saveAdminEstablishment,
  setAdminEstablishmentActive,
  type AdminCatalogs,
  type AdminEstablishment,
  type SaveEstablishmentInput,
} from "@/lib/admin-api";
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

const pageSize = 20;

export type EstablishmentManagementRef = {
  openCreate: () => void;
};

export const EstablishmentManagement = forwardRef<
  EstablishmentManagementRef,
  {
    token: string;
    onNotice: (message: string) => void;
    onError: (message: string | null) => void;
  }
>(function EstablishmentManagement({ token, onNotice, onError }, ref) {
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

  const catalogsQuery = useQuery({
    queryKey: ["admin", "catalogs"],
    queryFn: () => getAdminCatalogs(token),
    enabled: token.length > 0,
  });
  const establishmentsQuery = useQuery({
    queryKey: [
      "admin",
      "establishments",
      debouncedQuery,
      provinceId,
      cantonId,
      localityId,
      debouncedActivity,
      debouncedClassification,
      debouncedCategory,
      active,
      page,
    ],
    queryFn: () =>
      getAdminEstablishments(token, {
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
      }),
    enabled: token.length > 0,
  });

  useEffect(() => {
    if (catalogsQuery.error) {
      onError(
        catalogsQuery.error instanceof Error
          ? catalogsQuery.error.message
          : "No se pudieron cargar los catálogos.",
      );
    }
  }, [catalogsQuery.error, onError]);

  useEffect(() => {
    if (establishmentsQuery.error) {
      onError(
        establishmentsQuery.error instanceof Error
          ? establishmentsQuery.error.message
          : "No se pudo cargar el catastro.",
      );
    }
  }, [establishmentsQuery.error, onError]);

  const saveMutation = useMutation({
    mutationFn: async (input: SaveEstablishmentInput) =>
      editing
        ? saveAdminEstablishment(token, editing.id, input)
        : createAdminEstablishment(token, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "establishments"] });
      setDialogOpen(false);
      setEditing(null);
      onNotice(
        editing
          ? "El establecimiento fue actualizado."
          : "El establecimiento fue creado.",
      );
    },
    onError: (cause) =>
      onError(
        cause instanceof Error ? cause.message : "No se pudo guardar el establecimiento.",
      ),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: boolean }) =>
      setAdminEstablishmentActive(token, id, next),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "establishments"] });
      onNotice(
        variables.next
          ? "El establecimiento fue reactivado."
          : "El establecimiento fue desactivado.",
      );
    },
    onError: (cause) =>
      onError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado."),
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
    const latitude = values.latitude.trim() ? Number(values.latitude) : undefined;
    const longitude = values.longitude.trim() ? Number(values.longitude) : undefined;
    if ((latitude === undefined) !== (longitude === undefined)) {
      onError("La latitud y la longitud deben enviarse juntas.");
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
              inputProps={{ "aria-label": "Buscar establecimientos" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="establishment-province-filter-label">Provincia</InputLabel>
              <Select
                labelId="establishment-province-filter-label"
                label="Provincia"
                value={provinceId}
                onChange={(event) => {
                  setProvinceId(event.target.value);
                  setCantonId("");
                  setLocalityId("");
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {provinces.map((province) => (
                  <MenuItem key={province.id} value={String(province.id)}>
                    {province.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <FormControl fullWidth disabled={!provinceId}>
              <InputLabel id="establishment-canton-filter-label">Cantón</InputLabel>
              <Select
                labelId="establishment-canton-filter-label"
                label="Cantón"
                value={cantonId}
                onChange={(event) => {
                  setCantonId(event.target.value);
                  setLocalityId("");
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {cantons.map((canton) => (
                  <MenuItem key={canton.id} value={String(canton.id)}>
                    {canton.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="establishment-locality-filter-label">Localidad</InputLabel>
              <Select
                labelId="establishment-locality-filter-label"
                label="Localidad"
                value={localityId}
                onChange={(event) => {
                  setLocalityId(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {localities.map((locality) => (
                  <MenuItem key={locality.id} value={String(locality.id)}>
                    {locality.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <FormControl fullWidth>
              <InputLabel id="establishment-status-filter-label">Estado</InputLabel>
              <Select
                labelId="establishment-status-filter-label"
                label="Estado"
                value={active}
                onChange={(event) => {
                  setActive(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </AdminTableToolbar>

      <AdminTable
        ariaLabel="Catastro de establecimientos"
        minWidth={760}
        loading={establishmentsQuery.isLoading}
        empty={!establishmentsQuery.isLoading && !data?.items.length}
        emptyMessage="No hay establecimientos para los filtros seleccionados."
        footer={
          <AdminTableFooter
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        }
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
                    {item.categoria}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>{item.localityName}</TableCell>
              <TableCell>{item.actividad}</TableCell>
              <TableCell>{item.numeroRegistro ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge
                  code={item.active ? "ACTIVA" : "INACTIVA"}
                  label={item.active ? "Activo" : "Inactivo"}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar establecimiento">
                  <IconButton
                    aria-label={`Editar ${item.nombreComercial}`}
                    onClick={() => openEdit(item)}
                  >
                    <EditRounded />
                  </IconButton>
                </Tooltip>
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
                <Controller
                  name="localityId"
                  control={control}
                  rules={{ required: "Selecciona una localidad." }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={Boolean(fieldState.error)}>
                      <InputLabel id="establishment-locality-label">Localidad</InputLabel>
                      <Select
                        {...field}
                        labelId="establishment-locality-label"
                        label="Localidad"
                      >
                        {(catalogs?.localities ?? []).map((locality) => (
                          <MenuItem key={locality.id} value={String(locality.id)}>
                            {locality.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{fieldState.error?.message}</FormHelperText>
                    </FormControl>
                  )}
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
                <Controller
                  name="activityId"
                  control={control}
                  rules={{ required: "Selecciona una actividad." }}
                  render={({ field, fieldState }) => (
                    <CatalogSelect
                      id="establishment-activity"
                      label="Actividad"
                      value={field.value}
                      options={establishmentActivities}
                      required
                      helperText={fieldState.error?.message}
                      onChange={(value) => {
                        field.onChange(value);
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
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="classificationId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CatalogSelect
                      id="establishment-classification"
                      label="Clasificación"
                      value={field.value}
                      options={establishmentClassifications}
                      disabled={!formActivityId}
                      helperText={fieldState.error?.message}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("categoryId", "");
                        const option = establishmentClassifications.find(
                          (candidate) => String(candidate.id) === value,
                        );
                        setValue("clasificacion", option?.name ?? "");
                        setValue("categoria", "");
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CatalogSelect
                      id="establishment-category"
                      label="Categoría"
                      value={field.value}
                      options={establishmentCategories}
                      disabled={!formClassificationId}
                      helperText={fieldState.error?.message}
                      onChange={(value) => {
                        field.onChange(value);
                        const option = establishmentCategories.find(
                          (candidate) => String(candidate.id) === value,
                        );
                        setValue("categoria", option?.name ?? "");
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Razón social" fullWidth {...register("razonSocial")} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="RUC"
                  fullWidth
                  inputProps={{ maxLength: 13 }}
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
                  type="number"
                  inputProps={{ step: "any", min: -90, max: 90 }}
                  {...register("latitude")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Longitud"
                  fullWidth
                  type="number"
                  inputProps={{ step: "any", min: -180, max: 180 }}
                  {...register("longitude")}
                />
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
    </Stack>
  );
});

function toFormValues(
  item: AdminEstablishment,
  catalogs?: AdminCatalogs,
): EstablishmentFormValues {
  const activityId =
    item.activityId ?? findCatalogId(catalogs?.establishmentActivities, item.actividad);
  const classificationId =
    item.classificationId ??
    findCatalogId(
      catalogs?.establishmentClassifications?.filter(
        (option) => !activityId || String(option.activityId) === String(activityId),
      ),
      item.clasificacion,
    );
  const categoryId =
    item.categoryId ??
    findCatalogId(
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

function findCatalogId(
  options: Array<{ id: number; name: string }> | undefined,
  name: string | null,
) {
  if (!name) return null;
  return options?.find((option) => option.name === name)?.id ?? null;
}
