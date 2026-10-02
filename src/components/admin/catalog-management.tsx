"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  AdminTable,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
import { DeleteRecordAction } from "@/components/admin/delete-record-action";
import { CatalogIconSelect } from "@/components/ui/catalog-icon-select";
import { CatalogSelect } from "@/components/ui/catalog-select";
import { SearchField } from "@/components/ui/search-field";
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

const CATALOG_TABS: { key: CatalogTabKey; label: string }[] = [
  { key: "ACCESSIBILITY", label: CATALOG_CONFIG.ACCESSIBILITY.label },
  { key: "ACTIVITY", label: CATALOG_CONFIG.ACTIVITY.label },
  { key: "FACILITY", label: CATALOG_CONFIG.FACILITY.label },
  { key: "ESTABLISHMENTS", label: "Tipos y categorías" },
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
  const selectedType = findCatalogOption(establishmentTypes, typeId);
  const isEstablishments = selected === "ESTABLISHMENTS";
  const visibleCatalog: AdminCatalogKey = isEstablishments
    ? selectedType
      ? "ESTABLISHMENT_CATEGORY"
      : "ESTABLISHMENT_CLASSIFICATION"
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
        : visibleCatalog === "ESTABLISHMENT_CATEGORY"
          ? (catalogs?.establishmentCategories ?? []).filter(
              (option) => option.classificationId === selectedType?.id,
            )
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
  }, [catalogs, visibleCatalog, establishmentTypes, selectedType, deferredSearch]);
  const lastPage = Math.max(Math.ceil(options.length / ADMIN_TABLE_PAGE_SIZE) - 1, 0);
  const visiblePage = Math.min(page, lastPage);
  const visibleOptions = options.slice(
    visiblePage * ADMIN_TABLE_PAGE_SIZE,
    (visiblePage + 1) * ADMIN_TABLE_PAGE_SIZE,
  );

  const parentOptions = parent ? (catalogs?.[parent.source] ?? []) : [];
  /** La API solo envía `activityId` en los tipos de establecimiento; el nombre se resuelve aquí. */
  const activityNameOf = (option: CatalogOption) =>
    option.activityName ??
    findCatalogOption(establishmentActivities, option.activityId)?.name;

  function selectType(value: string) {
    const option = findCatalogOption(catalogs?.establishmentClassifications, value);
    setTypeId(value);
    if (option?.activityId) setActivityId(String(option.activityId));
    setSearch("");
    setPage(0);
  }

  function resetEditor() {
    setEditing(null);
    setEditorCatalog(null);
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

  function openEdit(option: CatalogOption, catalog: AdminCatalogKey = visibleCatalog) {
    setEditorCatalog(catalog);
    setEditing(option);
    setName(option.name);
    setActive(option.active !== false);
    setIcon(normalizeCategoryIcon(option.icon));
    setParentId(String(CATALOG_CONFIG[catalog].parent?.idOf(option) ?? ""));
    setScheme(option.scheme ?? "OTRA");
    setNumericValue(option.numericValue == null ? "" : String(option.numericValue));
    onError(null);
  }

  async function save() {
    if (working || !editorCatalog) return;
    if (name.trim().length < 2) {
      onError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (creating && parent && !parentId) {
      onError(`Selecciona ${parent.label.toLocaleLowerCase()}.`);
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
      onError("El valor numérico debe ser un entero entre 1 y 99.");
      return;
    }
    setWorking(true);
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
      await queryClient.invalidateQueries({ queryKey: adminKeys.allCatalogs() });
      if (creating) {
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
      onError(errorMessage(cause, "No se pudo actualizar el catálogo."));
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
        {isEstablishments ? (
          <>
            <Typography variant="body2" color="text.secondary">
              El tipo identifica el negocio, como Hotel o Restaurante. Cada tipo tiene sus
              propias categorías, como 3 Estrellas o 3 Tenedores.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={webTokens.spacing.control}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CatalogSelect
                  id="catalog-establishment-activity"
                  label="Actividad del catastro"
                  value={activityId}
                  options={(establishmentActivities ?? []).map((option) => ({
                    ...option,
                    displayName:
                      option.active === false ? `${option.name} (inactiva)` : option.name,
                  }))}
                  emptyLabel="Todas las actividades"
                  disabled={catalogsQuery.isLoading || Boolean(catalogsQuery.error)}
                  onChange={(value) => {
                    setActivityId(value);
                    setTypeId("");
                    setSearch("");
                    setPage(0);
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CatalogSelect
                  id="catalog-establishment-type"
                  label="Tipo de establecimiento"
                  value={typeId}
                  options={establishmentTypes.map((option) => ({
                    ...option,
                    displayName: [
                      option.name,
                      !selectedActivity ? activityNameOf(option) : undefined,
                      option.active === false ? "inactivo" : undefined,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }))}
                  emptyLabel="Ver tipos de establecimiento"
                  disabled={catalogsQuery.isLoading || Boolean(catalogsQuery.error)}
                  onChange={selectType}
                />
              </Box>
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              gap={webTokens.spacing.inline}
            >
              {selectedType ? (
                <Button
                  startIcon={<ArrowBackRounded />}
                  onClick={() => selectType("")}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Ver tipos
                </Button>
              ) : null}
              <Typography variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
                {selectedType
                  ? `Categorías de ${selectedType.name}`
                  : "Tipos de establecimiento"}
              </Typography>
              {selectedType ? (
                <Tooltip title="Editar tipo de establecimiento">
                  <IconButton
                    aria-label={`Editar tipo de establecimiento ${selectedType.name}`}
                    onClick={() => openEdit(selectedType, "ESTABLISHMENT_CLASSIFICATION")}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
            {selectedType?.active === false ? (
              <Typography variant="body2" color="text.secondary">
                Este tipo está inactivo. Puedes editar sus categorías existentes; activa
                el tipo para agregar nuevas categorías.
              </Typography>
            ) : null}
          </>
        ) : selected === "ACTIVITY" ? (
          <Typography variant="body2" color="text.secondary">
            Actividades que se realizan en centros y atractivos turísticos. Las
            actividades del catastro se consultan en Tipos y categorías.
          </Typography>
        ) : null}

        <AdminTableToolbar
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} gap={webTokens.spacing.inline}>
              {isEstablishments && selectedType ? (
                <Button
                  variant="outlined"
                  startIcon={<AddRounded />}
                  onClick={() => openCreate("ESTABLISHMENT_CLASSIFICATION")}
                  disabled={
                    catalogsQuery.isLoading ||
                    Boolean(catalogsQuery.error) ||
                    !establishmentActivities?.some((option) => option.active !== false)
                  }
                >
                  Agregar tipo
                </Button>
              ) : null}
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => openCreate()}
                disabled={
                  catalogsQuery.isLoading ||
                  Boolean(catalogsQuery.error) ||
                  (visibleCatalog === "ESTABLISHMENT_CATEGORY" &&
                    selectedType?.active === false) ||
                  (visibleCatalog === "ESTABLISHMENT_CLASSIFICATION" &&
                    !establishmentActivities?.some((option) => option.active !== false))
                }
              >
                {isEstablishments
                  ? selectedType
                    ? `Agregar categoría para ${selectedType.name}`
                    : "Agregar tipo de establecimiento"
                  : "Agregar opción"}
              </Button>
            </Stack>
          }
        >
          <SearchField
            label={
              isEstablishments
                ? selectedType
                  ? "Buscar categoría"
                  : "Buscar tipo de establecimiento"
                : "Buscar opción"
            }
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 360 } }}
          />
        </AdminTableToolbar>

        <AdminTable
          ariaLabel={
            isEstablishments
              ? selectedType
                ? `Categorías de ${selectedType.name}`
                : "Tipos de establecimiento"
              : "Opciones del catálogo"
          }
          minWidth={560}
          loading={catalogsQuery.isLoading}
          error={catalogsQuery.error ? "No se pudieron cargar los catálogos." : null}
          empty={options.length === 0}
          emptyMessage={
            deferredSearch
              ? "No hay opciones que coincidan con la búsqueda."
              : selectedType && isEstablishments
                ? "Este tipo de establecimiento aún no tiene categorías."
                : isEstablishments
                  ? "No hay tipos de establecimiento para esta actividad."
                  : "No hay opciones en este catálogo."
          }
          pagination={{ page: visiblePage, total: options.length, onPageChange: setPage }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                {visibleCatalog === "ESTABLISHMENT_CATEGORY"
                  ? "Categoría"
                  : visibleCatalog === "ESTABLISHMENT_CLASSIFICATION"
                    ? "Tipo de establecimiento"
                    : "Nombre"}
              </TableCell>
              {visibleCatalog === "ESTABLISHMENT_CATEGORY" ? (
                <TableCell>Sistema de categoría</TableCell>
              ) : visibleCatalog === "ESTABLISHMENT_CLASSIFICATION" ? (
                <TableCell>Actividad</TableCell>
              ) : null}
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleOptions.map((option) => (
              <TableRow key={option.id} hover>
                <TableCell component="th" scope="row">
                  {isEstablishments ? option.name : (option.displayName ?? option.name)}
                </TableCell>
                {visibleCatalog === "ESTABLISHMENT_CATEGORY" ? (
                  <TableCell>
                    {categorySchemeLabels[option.scheme ?? ""] ?? option.scheme ?? "—"}
                  </TableCell>
                ) : visibleCatalog === "ESTABLISHMENT_CLASSIFICATION" ? (
                  <TableCell>{activityNameOf(option) ?? "—"}</TableCell>
                ) : null}
                <TableCell>
                  <StatusBadge
                    label={activeLabel(option.active !== false)}
                    tone={activeTone(option.active !== false)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" alignItems="center">
                    {visibleCatalog === "ESTABLISHMENT_CLASSIFICATION" ? (
                      <Button
                        size="small"
                        endIcon={<ArrowForwardRounded />}
                        aria-label={`Ver categorías de ${option.name}`}
                        onClick={() => selectType(String(option.id))}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Ver categorías
                      </Button>
                    ) : null}
                    <Tooltip title="Editar">
                      <IconButton
                        aria-label={`Editar ${option.name}`}
                        onClick={() => openEdit(option)}
                      >
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <DeleteRecordAction
                      subject={option.displayName ?? option.name}
                      title="Eliminar opción de catálogo"
                      description="Dejará de aparecer en el catálogo. Las fichas existentes y el historial se conservan."
                      onDelete={() =>
                        deleteAdminCatalog(token, visibleCatalog, option.id)
                      }
                      queryKeys={[adminKeys.allCatalogs()]}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
      </Stack>

      <Dialog
        open={editing !== null || creating}
        onClose={() => !working && resetEditor()}
        fullWidth
        maxWidth="sm"
        aria-labelledby="catalog-editor-title"
      >
        <DialogTitle id="catalog-editor-title">
          {creating && editorCatalog === "ESTABLISHMENT_CATEGORY"
            ? `Agregar categoría para ${findCatalogOption(parentOptions, parentId)?.name ?? "este tipo"}`
            : creating
              ? config.createTitle
              : config.editTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
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
                onChange={(event) => setParentId(event.target.value)}
                fullWidth
                disabled={working}
                required
                helperText="La opción quedará vinculada a este catálogo superior."
              >
                {parentOptions
                  .filter((option) => option.active !== false)
                  .map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
              </TextField>
            ) : parent && editorCatalog ? (
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
