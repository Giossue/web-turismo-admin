"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import PowerSettingsNewRounded from "@mui/icons-material/PowerSettingsNewRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminEstablishment,
  getAdminCatalogs,
  getAdminEstablishments,
  saveAdminEstablishment,
  setAdminEstablishmentActive,
  type AdminEstablishment,
  type SaveEstablishmentInput,
} from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

type EstablishmentFormValues = {
  localityId: string;
  numeroRegistro: string;
  ruc: string;
  nombreComercial: string;
  razonSocial: string;
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
  actividad: "",
  clasificacion: "",
  categoria: "",
  direccion: "",
  telefono: "",
  latitude: "",
  longitude: "",
};

const pageSize = 20;

export function EstablishmentManagement({
  token,
  onNotice,
}: {
  token: string;
  onNotice: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
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
  const [formError, setFormError] = useState<string | null>(null);
  const { control, register, reset, handleSubmit, formState } =
    useForm<EstablishmentFormValues>({ defaultValues: emptyValues });

  const catalogsQuery = useQuery({
    queryKey: ["admin", "catalogs"],
    queryFn: () => getAdminCatalogs(token),
    enabled: token.length > 0,
  });
  const establishmentsQuery = useQuery({
    queryKey: [
      "admin",
      "establishments",
      query,
      provinceId,
      cantonId,
      localityId,
      activity,
      classification,
      category,
      active,
      page,
    ],
    queryFn: () =>
      getAdminEstablishments(token, {
        q: query,
        activity: activity || undefined,
        classification: classification || undefined,
        category: category || undefined,
        provinceId: provinceId ? Number(provinceId) : undefined,
        cantonId: cantonId ? Number(cantonId) : undefined,
        localityId: localityId ? Number(localityId) : undefined,
        active: active === "ALL" ? undefined : active === "true",
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: token.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SaveEstablishmentInput) =>
      editing
        ? saveAdminEstablishment(token, editing.id, input)
        : createAdminEstablishment(token, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "establishments"] });
      setDialogOpen(false);
      setEditing(null);
      setFormError(null);
      onNotice(
        editing
          ? "El establecimiento fue actualizado."
          : "El establecimiento fue creado.",
      );
    },
    onError: (cause) =>
      setFormError(
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
      setFormError(
        cause instanceof Error ? cause.message : "No se pudo cambiar el estado.",
      ),
  });

  const data = establishmentsQuery.data;
  const catalogs = catalogsQuery.data;
  const provinces = catalogs?.provinces ?? [];
  const cantons = (catalogs?.cantons ?? []).filter(
    (option) => !provinceId || String(option.provinceId) === provinceId,
  );
  const localities = (catalogs?.localities ?? []).filter(
    (option) =>
      (!provinceId || String(option.provinceId) === provinceId) &&
      (!cantonId || String(option.cantonId) === cantonId),
  );
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  function openCreate() {
    setEditing(null);
    reset(emptyValues);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(item: AdminEstablishment) {
    setEditing(item);
    reset(toFormValues(item));
    setFormError(null);
    setDialogOpen(true);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setQuery(queryDraft.trim());
  }

  function submitForm(values: EstablishmentFormValues) {
    const latitude = values.latitude.trim() ? Number(values.latitude) : undefined;
    const longitude = values.longitude.trim() ? Number(values.longitude) : undefined;
    if ((latitude === undefined) !== (longitude === undefined)) {
      setFormError("La latitud y la longitud deben enviarse juntas.");
      return;
    }
    if (values.ruc.trim() && !/^\d{13}$/.test(values.ruc.trim())) {
      setFormError("El RUC debe contener 13 dígitos.");
      return;
    }
    setFormError(null);
    saveMutation.mutate({
      localityId: Number(values.localityId),
      numeroRegistro: values.numeroRegistro.trim() || undefined,
      ruc: values.ruc.trim() || undefined,
      nombreComercial: values.nombreComercial.trim(),
      razonSocial: values.razonSocial.trim() || undefined,
      actividad: values.actividad.trim(),
      clasificacion: values.clasificacion.trim() || undefined,
      categoria: values.categoria.trim() || undefined,
      direccion: values.direccion.trim() || undefined,
      telefono: values.telefono.trim() || undefined,
      latitude,
      longitude,
    });
  }

  return (
    <Stack spacing={webTokens.spacing.section}>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.control}>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>
              Nuevo establecimiento
            </Button>
          </Stack>
          <Grid
            component="form"
            container
            spacing={webTokens.spacing.control}
            onSubmit={submitSearch}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <SearchField
                label="Buscar por nombre, actividad o registro"
                value={queryDraft}
                onChange={(event) => setQueryDraft(event.target.value)}
                inputProps={{ "aria-label": "Buscar establecimientos" }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="establishment-province-filter-label">
                  Provincia
                </InputLabel>
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
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="establishment-locality-filter-label">
                  Localidad
                </InputLabel>
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
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Actividad"
                fullWidth
                value={activity}
                onChange={(event) => setActivity(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Clasificación"
                fullWidth
                value={classification}
                onChange={(event) => setClassification(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Categoría"
                fullWidth
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="outlined" startIcon={<SearchRounded />}>
                Buscar
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </FlatSurface>

      {establishmentsQuery.error ? (
        <Alert severity="error">
          {establishmentsQuery.error instanceof Error
            ? establishmentsQuery.error.message
            : "No se pudo cargar el catastro."}
        </Alert>
      ) : null}
      {activeMutation.error ? (
        <Alert severity="error" onClose={() => activeMutation.reset()}>
          {activeMutation.error instanceof Error
            ? activeMutation.error.message
            : "No se pudo cambiar el estado del establecimiento."}
        </Alert>
      ) : null}
      <FlatSurface padding="none">
        {establishmentsQuery.isLoading ? (
          <ContentState status="loading" label="Cargando catastro" />
        ) : !data?.items.length ? (
          <ContentState
            status="empty"
            message="No hay establecimientos para los filtros seleccionados."
          />
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Catastro de establecimientos">
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
                {data.items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
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
            </Table>
          </TableContainer>
        )}
      </FlatSurface>
      {data?.total ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {data.total} establecimientos · página {page + 1} de {totalPages}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <Button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </Stack>
        </Stack>
      ) : null}

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
            {formError ? <Alert severity="error">{formError}</Alert> : null}
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
                <TextField
                  label="Actividad"
                  fullWidth
                  required
                  error={Boolean(formState.errors.actividad)}
                  helperText={formState.errors.actividad?.message}
                  {...register("actividad", { required: "Ingresa la actividad." })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Clasificación"
                  fullWidth
                  {...register("clasificacion")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Categoría" fullWidth {...register("categoria")} />
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
}

function toFormValues(item: AdminEstablishment): EstablishmentFormValues {
  return {
    localityId: String(item.localityId),
    numeroRegistro: item.numeroRegistro ?? "",
    ruc: item.ruc ?? "",
    nombreComercial: item.nombreComercial,
    razonSocial: item.razonSocial ?? "",
    actividad: item.actividad,
    clasificacion: item.clasificacion ?? "",
    categoria: item.categoria ?? "",
    direccion: item.direccion ?? "",
    telefono: item.telefono ?? "",
    latitude: item.latitude === null ? "" : String(item.latitude),
    longitude: item.longitude === null ? "" : String(item.longitude),
  };
}
