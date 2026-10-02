"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
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

import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import { CoordinateFieldset } from "@/components/admin/coordinate-fieldset";
import {
  changeEstablishmentFilter,
  emptyEstablishmentFilters,
  establishmentFiltersToQuery,
  type EstablishmentFilterField,
} from "@/components/admin/establishment-grid-filter-state";
import { EstablishmentGridFilters } from "@/components/admin/establishment-grid-filters";
import { RhfCatalogSelect } from "@/components/ui/form/rhf-select";
import { RhfTextField } from "@/components/ui/form/rhf-text-field";
import { maxLen, required } from "@/components/ui/form/rules";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminEstablishment,
  getAdminEstablishments,
  saveAdminEstablishment,
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
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { findCatalogIdByName, findCatalogOption } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

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
  active: boolean;
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
  active: true,
};

const pageSize = ADMIN_TABLE_PAGE_SIZE;

const RUC_RULES = {
  validate: (value: string) =>
    !value.trim() || /^\d{13}$/.test(value.trim()) || "El RUC debe contener 13 dígitos.",
};

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
  const [filters, setFilters] = useState(emptyEstablishmentFilters);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<AdminEstablishment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Solo el texto libre espera al debounce; los selectores consultan al cambiar.
  const debouncedQuery = useDebouncedValue(queryDraft.trim());
  const { control, reset, setValue, handleSubmit } = useForm<EstablishmentFormValues>({
    defaultValues: emptyValues,
  });
  const formActivityId = useWatch({ control, name: "activityId" });
  const formClassificationId = useWatch({ control, name: "classificationId" });

  const catalogsQuery = useQuery(catalogsQueryOptions(token));
  const establishmentFilters: AdminEstablishmentsOptions = {
    ...establishmentFiltersToQuery(filters),
    q: debouncedQuery || undefined,
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
    mutationFn: async ({
      input,
      active,
    }: {
      input: SaveEstablishmentInput;
      active: boolean;
    }) =>
      editing
        ? saveAdminEstablishment(
            token,
            editing.id,
            input,
            canManageStatus ? active : undefined,
          )
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
    onError: async (cause) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.allEstablishments() });
      onError(errorMessage(cause, "No se pudo guardar el establecimiento."));
    },
  });

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (id: number) => submitAdminEstablishmentReview(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.allEstablishments() });
      onNotice("El catastro fue enviado a revisión.");
    },
    onError: (cause) =>
      onError(errorMessage(cause, "No se pudo enviar el catastro a revisión.")),
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
  const openCreate = useCallback(() => {
    setEditing(null);
    reset(emptyValues);
    setDialogOpen(true);
  }, [reset]);

  useImperativeHandle(ref, () => ({ openCreate }), [openCreate]);

  const openEdit = useCallback(
    (item: AdminEstablishment) => {
      setEditing(item);
      reset(toFormValues(item, catalogs));
      setDialogOpen(true);
    },
    [catalogs, reset],
  );

  function changeFilter(field: EstablishmentFilterField, value: string) {
    setFilters((current) => changeEstablishmentFilter(current, field, value));
    setPage(0);
  }

  const columns = useMemo<GridColDef<AdminEstablishment>[]>(
    () => [
      {
        field: "nombreComercial",
        headerName: "Establecimiento",
        minWidth: 240,
        flex: 1.5,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack sx={{ justifyContent: "center", height: "100%", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {row.nombreComercial}
            </Typography>
            {row.categoria ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.categoriaEtiqueta ?? row.categoria}
              </Typography>
            ) : null}
          </Stack>
        ),
      },
      {
        field: "localityName",
        headerName: "Localidad",
        minWidth: 150,
        flex: 1,
        filterable: false,
      },
      {
        field: "actividad",
        headerName: "Actividad",
        minWidth: 160,
        flex: 1,
        filterable: false,
      },
      {
        field: "numeroRegistro",
        headerName: "Registro",
        minWidth: 135,
        flex: 0.7,
        filterable: false,
        valueFormatter: (value: string | null) => value ?? "—",
      },
      {
        field: "reviewStatus",
        headerName: "Estado",
        minWidth: 160,
        filterable: false,
        renderCell: ({ row }) => (
          <StatusBadge
            label={establishmentReviewStatusLabel(row.reviewStatus)}
            tone={establishmentReviewStatusTone(row.reviewStatus)}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: canManageStatus ? 100 : 145,
        align: "right",
        headerAlign: "right",
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row: item, hasFocus }) => (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            sx={{ height: "100%" }}
          >
            <Tooltip title="Editar establecimiento" disableInteractive>
              <span>
                <IconButton
                  aria-label={`Editar ${item.nombreComercial}`}
                  tabIndex={hasFocus ? 0 : -1}
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
            {!canManageStatus && ["BORRADOR", "RECHAZADO"].includes(item.reviewStatus) ? (
              <Tooltip title="Enviar a revisión" disableInteractive>
                <span>
                  <IconButton
                    aria-label={`Enviar a revisión ${item.nombreComercial}`}
                    tabIndex={hasFocus ? 0 : -1}
                    onClick={() => submitReview(item.id)}
                    disabled={isSubmittingReview}
                  >
                    <SendRounded />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [canManageStatus, openEdit, isSubmittingReview, submitReview],
  );

  /** Las reglas de los campos ya validan coordenadas, RUC y obligatorios. */
  function submitForm(values: EstablishmentFormValues) {
    if (saveMutation.isPending) return;
    onError(null);
    const activityOption = findCatalogOption(establishmentActivities, values.activityId);
    const classificationOption = findCatalogOption(
      establishmentClassifications,
      values.classificationId,
    );
    const categoryOption = findCatalogOption(establishmentCategories, values.categoryId);
    saveMutation.mutate({
      active: values.active,
      input: {
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
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      },
    });
  }

  return (
    <Stack spacing={webTokens.spacing.section}>
      <AdminDataGrid
        ariaLabel="Catastro de establecimientos"
        rows={data?.items ?? []}
        columns={columns}
        loading={establishmentsQuery.isLoading}
        error={establishmentsQuery.error ? "No se pudo cargar el catastro." : null}
        emptyMessage="No hay establecimientos para los filtros seleccionados."
        pagination={{ page, total: data?.total ?? 0, pageSize, onPageChange: setPage }}
        search={{
          label: "Buscar por nombre, actividad o registro",
          value: queryDraft,
          onChange: (value) => {
            setQueryDraft(value);
            setPage(0);
          },
        }}
        filterCount={Object.values(filters).filter(Boolean).length}
        filterPanel={
          <EstablishmentGridFilters
            values={filters}
            catalogs={catalogs}
            onChange={changeFilter}
            onClear={() => {
              setFilters({ ...emptyEstablishmentFilters });
              setPage(0);
            }}
          />
        }
      />

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
            <Grid container spacing={webTokens.spacing.control}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfCatalogSelect
                  id="establishment-locality"
                  control={control}
                  name="localityId"
                  label="Localidad"
                  options={catalogs?.localities ?? []}
                  rules={{ required: required("Selecciona una localidad.") }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfTextField
                  control={control}
                  name="numeroRegistro"
                  label="Número de registro"
                  rules={{ maxLength: maxLen(40) }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfTextField
                  control={control}
                  name="nombreComercial"
                  label="Nombre comercial"
                  required
                  rules={{ required: required("Ingresa el nombre comercial.") }}
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
                  rules={{ required: required("Selecciona una actividad.") }}
                  onValueChange={(value) => {
                    setValue("classificationId", "");
                    setValue("categoryId", "");
                    setValue(
                      "actividad",
                      findCatalogOption(establishmentActivities, value)?.name ?? "",
                    );
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
                    setValue(
                      "clasificacion",
                      findCatalogOption(establishmentClassifications, value)?.name ?? "",
                    );
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
                  onValueChange={(value) =>
                    setValue(
                      "categoria",
                      findCatalogOption(establishmentCategories, value)?.name ?? "",
                    )
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfTextField control={control} name="razonSocial" label="Razón social" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RhfTextField
                  control={control}
                  name="ruc"
                  label="RUC"
                  rules={RUC_RULES}
                  slotProps={{ htmlInput: { maxLength: 13 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <RhfTextField control={control} name="direccion" label="Dirección" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RhfTextField control={control} name="telefono" label="Teléfono" />
              </Grid>
              <CoordinateFieldset
                control={control}
                latitudeName="latitude"
                longitudeName="longitude"
                fieldSize={{ xs: 12, md: 6 }}
                onPicked={() => onNotice("Coordenadas seleccionadas en el mapa.")}
              />
            </Grid>
            {editing && canManageStatus ? (
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        name={field.name}
                        checked={field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        disabled={saveMutation.isPending}
                      />
                    }
                    label="Establecimiento activo"
                  />
                )}
              />
            ) : null}
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
    activityId: String(activityId ?? ""),
    classificationId: String(classificationId ?? ""),
    categoryId: String(categoryId ?? ""),
    actividad: item.actividad,
    clasificacion: item.clasificacion ?? "",
    categoria: item.categoria ?? "",
    direccion: item.direccion ?? "",
    telefono: item.telefono ?? "",
    latitude: item.latitude == null ? "" : String(item.latitude),
    longitude: item.longitude == null ? "" : String(item.longitude),
    active: item.active,
  };
}
