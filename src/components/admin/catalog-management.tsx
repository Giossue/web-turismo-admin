"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import {
  Box,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import { ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { RecordActionsMenu } from "@/components/admin/record-actions-menu";
import { CatalogIconSelect } from "@/components/ui/catalog-icon-select";
import { CatalogSelect } from "@/components/ui/catalog-select";
import { ContentState } from "@/components/ui/content-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminCatalog,
  deleteAdminCatalog,
  updateAdminCatalog,
  type AdminCatalogKey,
  type AdminCatalogs,
  type CatalogOption,
} from "@/lib/admin-api";
import { activeLabel, activeTone } from "@/lib/admin-labels";
import { adminKeys, catalogsQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { findCatalogOption } from "@/lib/values";
import { webTokens } from "@/theme/tokens";

type CatalogListKey = {
  [K in keyof AdminCatalogs]: AdminCatalogs[K] extends CatalogOption[] ? K : never;
}[keyof AdminCatalogs];

type CatalogConfig = {
  label: string;
  /** Lista de `AdminCatalogs` con las opciones del catálogo. */
  source: CatalogListKey;
  /** Catálogo superior obligatorio al crear una opción. */
  parent?: {
    label: string;
    source: CatalogListKey;
    idOf: (option: CatalogOption) => number | undefined;
  };
  createTitle: string;
  editTitle: string;
};

const CATALOG_CONFIG: Record<AdminCatalogKey, CatalogConfig> = {
  ACCESSIBILITY: {
    label: "Accesibilidad",
    source: "accessibilityTypes",
    createTitle: "Agregar opción de catálogo",
    editTitle: "Editar opción de catálogo",
  },
  ACTIVITY: {
    label: "Actividades de fichas",
    source: "activities",
    parent: {
      label: "Grupo de actividad",
      source: "activityGroups",
      idOf: (option) => option.groupId,
    },
    createTitle: "Agregar opción de catálogo",
    editTitle: "Editar opción de catálogo",
  },
  FACILITY: {
    label: "Facilidades",
    source: "facilities",
    parent: {
      label: "Categoría de facilidad",
      source: "facilityCategories",
      idOf: (option) => option.categoryId,
    },
    createTitle: "Agregar opción de catálogo",
    editTitle: "Editar opción de catálogo",
  },
  ESTABLISHMENT_CLASSIFICATION: {
    label: "Tipos de establecimiento",
    source: "establishmentClassifications",
    parent: {
      label: "Actividad del catastro",
      source: "establishmentActivities",
      idOf: (option) => option.activityId,
    },
    createTitle: "Agregar tipo de establecimiento",
    editTitle: "Editar tipo de establecimiento",
  },
  ESTABLISHMENT_CATEGORY: {
    label: "Categorías por tipo",
    source: "establishmentCategories",
    parent: {
      label: "Tipo de establecimiento",
      source: "establishmentClassifications",
      idOf: (option) => option.classificationId,
    },
    createTitle: "Agregar categoría",
    editTitle: "Editar categoría",
  },
};

type CatalogTabKey = "ACCESSIBILITY" | "ACTIVITY" | "FACILITY" | "ESTABLISHMENTS";

const CATALOG_TABS: { key: CatalogTabKey; label: string; description: string }[] = [
  {
    key: "ACCESSIBILITY",
    label: CATALOG_CONFIG.ACCESSIBILITY.label,
    description:
      "Condiciones de accesibilidad para personas con discapacidad o movilidad reducida que se registran en las fichas.",
  },
  {
    key: "ACTIVITY",
    label: CATALOG_CONFIG.ACTIVITY.label,
    description: "Actividades que se realizan en centros y atractivos turísticos.",
  },
  {
    key: "FACILITY",
    label: CATALOG_CONFIG.FACILITY.label,
    description:
      "Servicios e instalaciones disponibles en los centros, como baños, parqueadero o información turística.",
  },
  {
    key: "ESTABLISHMENTS",
    label: "Tipos y categorías",
    description:
      "Tipos de establecimiento del catastro turístico y las categorías que puede tener cada uno.",
  },
];

const defaultCategoryIcon = "shop-supermarket";
const catalogIconOptions = [
  { value: "accommodation-hotel", label: "Hotel" },
  { value: "amenity-cinema", label: "Cine" },
  { value: "amenity-library", label: "Biblioteca" },
  { value: "amenity-toilets", label: "Baños" },
  { value: "eat-drink-cafe", label: "Cafetería" },
  { value: "eat-drink-restaurant", label: "Restaurante" },
  { value: "health-hospital", label: "Salud" },
  { value: "money-atm", label: "Cajero" },
  { value: "money-bank", label: "Banco" },
  { value: "outdoor-camping", label: "Camping" },
  { value: "outdoor-drinking-water", label: "Agua potable" },
  { value: "religious-place-of-worship", label: "Lugar de culto" },
  { value: "shop-supermarket", label: "Supermercado" },
  { value: "tourism-information", label: "Información turística" },
  { value: "tourism-museum", label: "Museo" },
  { value: "tourism-viewpoint", label: "Mirador" },
  { value: "transport-bus-stop", label: "Parada de bus" },
] as const;
const catalogIconOptionsWithImages = catalogIconOptions.map((option) => ({
  ...option,
  imageSrc: `/assets/establishment-pins/${option.value}.svg`,
}));

const categorySchemeLabels: Record<string, string> = {
  ESTRELLAS: "Estrellas",
  TENEDORES: "Tenedores",
  TAZAS: "Tazas",
  COPAS: "Copas",
  UNICA: "Única",
  CATEGORIA_OFICIAL: "Categoría oficial",
  CLASE: "Clase",
  MODALIDAD: "Modalidad",
  OTRA: "Otra",
};
type CatalogIcon = (typeof catalogIconOptions)[number]["value"];

function isCatalogIcon(value: string | undefined): value is CatalogIcon {
  return catalogIconOptions.some((option) => option.value === value);
}

function normalizeCategoryIcon(value?: string): string {
  return isCatalogIcon(value) ? value : defaultCategoryIcon;
}

export function CatalogManagement({
  token,
  onNotice,
  onError,
}: {
  token: string;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CatalogTabKey>("ACCESSIBILITY");
  const [activityId, setActivityId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CatalogOption | null>(null);
  const [editorCatalog, setEditorCatalog] = useState<AdminCatalogKey | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [icon, setIcon] = useState(defaultCategoryIcon);
  const [parentId, setParentId] = useState("");
  const [scheme, setScheme] = useState("OTRA");
  const [numericValue, setNumericValue] = useState("");
  const [working, setWorking] = useState(false);
  const [page, setPage] = useState(0);
  // El filtro es local: basta con diferir el render de la tabla, sin debounce.
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());
  const catalogsQuery = useQuery(catalogsQueryOptions(token, true));
  const catalogs = catalogsQuery.data;
  const establishmentActivities = catalogs?.establishmentActivities;
  const selectedActivity = findCatalogOption(establishmentActivities, activityId);
  const establishmentTypes = useMemo(
    () =>
      (catalogs?.establishmentClassifications ?? []).filter(
        (option) => !selectedActivity || option.activityId === selectedActivity.id,
      ),
    [catalogs?.establishmentClassifications, selectedActivity],
  );
  const selectedType = findCatalogOption(catalogs?.establishmentClassifications, typeId);
  const typeCategories = (catalogs?.establishmentCategories ?? []).filter(
    (option) => option.classificationId === selectedType?.id,
  );
  const isEstablishments = selected === "ESTABLISHMENTS";
  const visibleCatalog: AdminCatalogKey = isEstablishments
    ? "ESTABLISHMENT_CLASSIFICATION"
    : selected;
  // El diálogo conserva su catálogo aunque una recarga cambie el nivel visible.
  const config = CATALOG_CONFIG[editorCatalog ?? visibleCatalog];
  const parent = config.parent;
  const creating = editorCatalog !== null && editing === null;

  useEffect(() => {
    if (catalogsQuery.error) {
      onError(errorMessage(catalogsQuery.error, "No se pudieron cargar los catálogos."));
    }
  }, [catalogsQuery.error, onError]);

  const options = useMemo(() => {
    const source =
      visibleCatalog === "ESTABLISHMENT_CLASSIFICATION"
        ? establishmentTypes
        : (catalogs?.[CATALOG_CONFIG[visibleCatalog].source] ?? []);
    return deferredSearch
      ? source.filter((item) =>
          [
            item.name,
            item.activityName ??
              findCatalogOption(catalogs?.establishmentActivities, item.activityId)?.name,
            item.classificationName,
          ].some((value) => value?.toLocaleLowerCase().includes(deferredSearch)),
        )
      : source;
  }, [catalogs, visibleCatalog, establishmentTypes, deferredSearch]);
  const lastPage = Math.max(Math.ceil(options.length / ADMIN_TABLE_PAGE_SIZE) - 1, 0);
  const visiblePage = Math.min(page, lastPage);
  const visibleOptions = useMemo(
    () =>
      options.slice(
        visiblePage * ADMIN_TABLE_PAGE_SIZE,
        (visiblePage + 1) * ADMIN_TABLE_PAGE_SIZE,
      ),
    [options, visiblePage],
  );

  const parentOptions = parent ? (catalogs?.[parent.source] ?? []) : [];
  /** La API solo envía `activityId` en los tipos de establecimiento; el nombre se resuelve aquí. */
  const activityNameOf = useCallback(
    (option: CatalogOption) =>
      option.activityName ??
      findCatalogOption(establishmentActivities, option.activityId)?.name,
    [establishmentActivities],
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const category of catalogs?.establishmentCategories ?? []) {
      if (category.classificationId !== undefined) {
        counts.set(
          category.classificationId,
          (counts.get(category.classificationId) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [catalogs?.establishmentCategories]);

  function resetEditor() {
    setEditing(null);
    setEditorCatalog(null);
    setEditorError(null);
    setName("");
    setActive(true);
    setIcon(defaultCategoryIcon);
    setParentId("");
    setScheme("OTRA");
    setNumericValue("");
  }

  function openCreate(catalog: AdminCatalogKey = visibleCatalog) {
    resetEditor();
    setEditorCatalog(catalog);
    setParentId(
      catalog === "ESTABLISHMENT_CLASSIFICATION" && selectedActivity?.active !== false
        ? String(selectedActivity?.id ?? "")
        : catalog === "ESTABLISHMENT_CATEGORY"
          ? String(selectedType?.id ?? "")
          : "",
    );
    onError(null);
  }

  const openEdit = useCallback(
    (option: CatalogOption, catalog: AdminCatalogKey = visibleCatalog) => {
      setEditorCatalog(catalog);
      setEditing(option);
      setEditorError(null);
      setName(option.name);
      setActive(option.active !== false);
      setIcon(normalizeCategoryIcon(option.icon));
      setParentId(String(CATALOG_CONFIG[catalog].parent?.idOf(option) ?? ""));
      setScheme(option.scheme ?? "OTRA");
      setNumericValue(option.numericValue == null ? "" : String(option.numericValue));
      onError(null);
    },
    [onError, visibleCatalog],
  );

  const columns = useMemo<GridColDef<CatalogOption>[]>(
    () => [
      {
        field: "name",
        headerName: isEstablishments ? "Tipo" : "Nombre",
        minWidth: 240,
        flex: 1.5,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack
            justifyContent="center"
            spacing={0.5}
            sx={{ height: "100%", width: "100%", minWidth: 0 }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                title={isEstablishments ? row.name : (row.displayName ?? row.name)}
                sx={{ minWidth: 0 }}
              >
                {isEstablishments ? row.name : (row.displayName ?? row.name)}
              </Typography>
              {isEstablishments && row.active === false ? (
                <Box sx={{ display: "flex", flexShrink: 0 }}>
                  <StatusBadge label="Inactivo" tone={activeTone(false)} />
                </Box>
              ) : null}
            </Stack>
            {isEstablishments && !selectedActivity ? (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                title={activityNameOf(row)}
              >
                {activityNameOf(row) ?? "—"}
              </Typography>
            ) : null}
          </Stack>
        ),
      },
      isEstablishments
        ? {
            field: "categories",
            headerName: "Categorías",
            width: 145,
            filterable: false,
            valueGetter: (_value, row) => categoryCounts.get(row.id) ?? 0,
          }
        : {
            field: "active",
            headerName: "Estado",
            width: 145,
            filterable: false,
            renderCell: ({ row }) => (
              <StatusBadge
                label={activeLabel(row.active !== false)}
                tone={activeTone(row.active !== false)}
              />
            ),
          },
      {
        field: "actions",
        headerName: "Acciones",
        width: 96,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, hasFocus }) => (
          <RecordActionsMenu
            subject={row.displayName ?? row.name}
            tabIndex={hasFocus ? 0 : -1}
            actions={[
              ...(isEstablishments
                ? [
                    {
                      label: "Ver categorías",
                      icon: <VisibilityRounded fontSize="small" />,
                      onClick: () => setTypeId(String(row.id)),
                    },
                  ]
                : []),
              {
                label: "Editar",
                icon: <EditRounded fontSize="small" />,
                onClick: () => openEdit(row),
              },
            ]}
            deletion={{
              subject: row.displayName ?? row.name,
              title: "Eliminar opción de catálogo",
              description:
                "Dejará de aparecer en el catálogo. Las fichas existentes y el historial se conservan.",
              onDelete: () => deleteAdminCatalog(token, visibleCatalog, row.id),
              queryKeys: [adminKeys.allCatalogs(), adminKeys.allNavigationSummaries()],
            }}
          />
        ),
      },
    ],
    [
      isEstablishments,
      selectedActivity,
      activityNameOf,
      categoryCounts,
      openEdit,
      token,
      visibleCatalog,
    ],
  );

  async function save() {
    if (working || !editorCatalog) return;
    if (name.trim().length < 2) {
      setEditorError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (creating && parent && !parentId) {
      setEditorError(`Selecciona ${parent.label.toLocaleLowerCase()}.`);
      return;
    }
    const parsedNumericValue = numericValue.trim() ? Number(numericValue) : undefined;
    if (
      creating &&
      editorCatalog === "ESTABLISHMENT_CATEGORY" &&
      parsedNumericValue !== undefined &&
      (!Number.isInteger(parsedNumericValue) ||
        parsedNumericValue < 1 ||
        parsedNumericValue > 99)
    ) {
      setEditorError("El valor numérico debe ser un entero entre 1 y 99.");
      return;
    }
    setWorking(true);
    setEditorError(null);
    onError(null);
    try {
      if (creating) {
        await createAdminCatalog(token, editorCatalog, {
          name: name.trim(),
          active,
          ...(editorCatalog === "ESTABLISHMENT_CLASSIFICATION" ? { icon } : {}),
          ...(parent ? { parentId: Number(parentId) } : {}),
          ...(editorCatalog === "ESTABLISHMENT_CATEGORY"
            ? {
                scheme,
                ...(parsedNumericValue !== undefined
                  ? { numericValue: parsedNumericValue }
                  : {}),
              }
            : {}),
        });
      } else if (editing) {
        await updateAdminCatalog(token, editorCatalog, editing.id, {
          name: name.trim(),
          active,
          ...(editorCatalog === "ESTABLISHMENT_CLASSIFICATION" ? { icon } : {}),
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.allCatalogs() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
      ]);
      if (creating && editorCatalog !== "ESTABLISHMENT_CATEGORY") {
        setSearch("");
        setPage(0);
        if (editorCatalog === "ESTABLISHMENT_CLASSIFICATION") {
          setActivityId(parentId);
          setTypeId("");
        }
      }
      resetEditor();
      onNotice(
        creating ? "Opción creada y auditada." : "Catálogo actualizado y auditado.",
      );
    } catch (cause) {
      setEditorError(errorMessage(cause, "No se pudo actualizar el catálogo."));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <Tabs
        value={selected}
        onChange={(_, value: CatalogTabKey) => {
          setSelected(value);
          setSearch("");
          setTypeId("");
          setPage(0);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Tipo de catálogo"
      >
        {CATALOG_TABS.map(({ key, label }) => (
          <Tab
            key={key}
            value={key}
            label={label}
            id={`catalog-tab-${key}`}
            aria-controls="catalog-panel"
          />
        ))}
      </Tabs>

      <Stack
        id="catalog-panel"
        role="tabpanel"
        aria-labelledby={`catalog-tab-${selected}`}
        spacing={webTokens.spacing.control}
      >
        <Typography variant="body2" color="text.secondary">
          {CATALOG_TABS.find(({ key }) => key === selected)?.description}
        </Typography>

        <AdminDataGrid
          key={visibleCatalog}
          ariaLabel={
            isEstablishments ? "Tipos de establecimiento" : "Opciones del catálogo"
          }
          rows={visibleOptions}
          columns={columns}
          loading={catalogsQuery.isLoading}
          error={catalogsQuery.error ? "No se pudieron cargar los catálogos." : null}
          emptyMessage={
            deferredSearch
              ? "No hay opciones que coincidan con la búsqueda."
              : isEstablishments
                ? "No hay tipos de establecimiento para esta actividad."
                : "No hay opciones en este catálogo."
          }
          pagination={{ page: visiblePage, total: options.length, onPageChange: setPage }}
          hideFooter={isEstablishments && options.length <= ADMIN_TABLE_PAGE_SIZE}
          search={
            isEstablishments
              ? undefined
              : {
                  label: "Buscar opción",
                  value: search,
                  onChange: (value) => {
                    setSearch(value);
                    setPage(0);
                  },
                }
          }
          toolbarContent={
            isEstablishments ? (
              <Box sx={{ width: "100%", maxWidth: 360 }}>
                <CatalogSelect
                  id="catalog-establishment-activity"
                  label="Actividad"
                  size="small"
                  value={activityId}
                  options={(establishmentActivities ?? []).map((option) => ({
                    ...option,
                    displayName:
                      option.active === false ? `${option.name} (inactiva)` : option.name,
                  }))}
                  emptyLabel="Todas las actividades"
                  displayEmpty
                  disabled={catalogsQuery.isLoading || Boolean(catalogsQuery.error)}
                  onChange={(value) => {
                    setActivityId(value);
                    setSearch("");
                    setPage(0);
                  }}
                />
              </Box>
            ) : undefined
          }
          toolbarActions={
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => openCreate()}
              disabled={
                catalogsQuery.isLoading ||
                Boolean(catalogsQuery.error) ||
                (isEstablishments &&
                  !establishmentActivities?.some((option) => option.active !== false))
              }
            >
              {isEstablishments ? "Agregar tipo" : "Agregar opción"}
            </Button>
          }
        />
      </Stack>

      <Dialog
        open={isEstablishments && Boolean(selectedType)}
        onClose={() => !editorCatalog && setTypeId("")}
        fullWidth
        maxWidth="sm"
        aria-labelledby="catalog-categories-title"
      >
        <DialogTitle id="catalog-categories-title">
          Categorías de {selectedType?.name}
        </DialogTitle>
        <DialogContent>
          {catalogsQuery.error ? (
            <ContentState
              status="error"
              message="No se pudieron cargar las categorías."
            />
          ) : typeCategories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Este tipo aún no tiene categorías.
            </Typography>
          ) : (
            <List disablePadding aria-label={`Categorías de ${selectedType?.name}`}>
              {typeCategories.map((option, index) => (
                <ListItem
                  key={`ESTABLISHMENT_CATEGORY:${option.id}`}
                  disableGutters
                  divider={index < typeCategories.length - 1}
                  sx={{ gap: webTokens.spacing.inline, py: 1.5 }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {categorySchemeLabels[option.scheme ?? ""] ?? option.scheme ?? ""}
                    </Typography>
                    {option.active === false ? (
                      <Box sx={{ mt: 0.5 }}>
                        <StatusBadge label="Inactiva" tone={activeTone(false)} />
                      </Box>
                    ) : null}
                  </Box>
                  <RecordActionsMenu
                    subject={option.displayName ?? option.name}
                    actions={[
                      {
                        label: "Editar",
                        icon: <EditRounded fontSize="small" />,
                        onClick: () => openEdit(option, "ESTABLISHMENT_CATEGORY"),
                      },
                    ]}
                    deletion={{
                      subject: option.displayName ?? option.name,
                      title: "Eliminar categoría",
                      description:
                        "Dejará de estar disponible para nuevos establecimientos. El historial se conserva.",
                      onDelete: () =>
                        deleteAdminCatalog(token, "ESTABLISHMENT_CATEGORY", option.id),
                      queryKeys: [
                        adminKeys.allCatalogs(),
                        adminKeys.allNavigationSummaries(),
                      ],
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {selectedType?.active === false ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Este tipo está inactivo. Actívalo desde Editar para agregar categorías.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeId("")}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => openCreate("ESTABLISHMENT_CATEGORY")}
            disabled={
              catalogsQuery.isLoading ||
              Boolean(catalogsQuery.error) ||
              selectedType?.active === false
            }
          >
            Agregar categoría
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editing !== null || creating}
        onClose={() => !working && resetEditor()}
        fullWidth
        maxWidth="sm"
        aria-labelledby="catalog-editor-title"
      >
        <DialogTitle id="catalog-editor-title">
          {editorCatalog === "ESTABLISHMENT_CATEGORY"
            ? `${creating ? "Agregar" : "Editar"} categoría para ${findCatalogOption(parentOptions, parentId)?.name ?? "este tipo"}`
            : creating
              ? config.createTitle
              : config.editTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
            {editorError ? <Alert severity="error">{editorError}</Alert> : null}
            <TextField
              label={
                editorCatalog === "ESTABLISHMENT_CATEGORY"
                  ? "Nombre de categoría"
                  : editorCatalog === "ESTABLISHMENT_CLASSIFICATION"
                    ? "Nombre del tipo de establecimiento"
                    : "Nombre"
              }
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              autoFocus
              disabled={working}
            />
            {creating && parent && editorCatalog !== "ESTABLISHMENT_CATEGORY" ? (
              <TextField
                select
                label={parent.label}
                value={parentId}
                onChange={(event) => setParentId(String(event.target.value))}
                fullWidth
                disabled={working}
                required
                helperText="La opción quedará vinculada a este catálogo superior."
              >
                {parentOptions
                  .filter((option) => option.active !== false)
                  .map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </MenuItem>
                  ))}
              </TextField>
            ) : parent && editorCatalog && editorCatalog !== "ESTABLISHMENT_CATEGORY" ? (
              <TextField
                label={parent.label}
                value={findCatalogOption(parentOptions, parentId)?.name ?? "—"}
                fullWidth
                disabled
                helperText={
                  creating
                    ? "La categoría se creará dentro de este tipo de establecimiento."
                    : "El catálogo superior no se puede cambiar después de crear la opción."
                }
              />
            ) : null}
            {editorCatalog === "ESTABLISHMENT_CLASSIFICATION" ? (
              <CatalogIconSelect
                id="catalog-marker-icon"
                label="Icono del marcador"
                value={icon}
                options={catalogIconOptionsWithImages}
                onChange={setIcon}
                disabled={working}
              />
            ) : null}
            {creating && editorCatalog === "ESTABLISHMENT_CATEGORY" ? (
              <>
                <TextField
                  select
                  label="Sistema de categoría"
                  value={scheme}
                  onChange={(event) => setScheme(event.target.value)}
                  fullWidth
                  disabled={working}
                >
                  {Object.entries(categorySchemeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Valor numérico (opcional)"
                  type="number"
                  value={numericValue}
                  onChange={(event) => setNumericValue(event.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: 99, step: 1 } }}
                  fullWidth
                  disabled={working}
                />
              </>
            ) : null}
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                  disabled={working}
                />
              }
              label={
                active
                  ? editorCatalog?.startsWith("ESTABLISHMENT_")
                    ? "Disponible para nuevos establecimientos"
                    : "Disponible para nuevas fichas"
                  : editorCatalog?.startsWith("ESTABLISHMENT_")
                    ? "No disponible para nuevos establecimientos"
                    : "No disponible para nuevas fichas"
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetEditor} disabled={working}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={working}>
            {working ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
