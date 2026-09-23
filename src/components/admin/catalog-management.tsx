"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import {
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
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  AdminTable,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
import { CatalogIconSelect } from "@/components/ui/catalog-icon-select";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createAdminCatalog,
  updateAdminCatalog,
  type AdminCatalogKey,
  type AdminCatalogs,
  type CatalogOption,
} from "@/lib/admin-api";
import { activeLabel, activeTone } from "@/lib/admin-labels";
import { adminKeys, catalogsQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
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
    label: "Actividades",
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
    label: "Categorías de catastro",
    source: "establishmentCategories",
    parent: {
      label: "Tipo de establecimiento",
      source: "establishmentClassifications",
      idOf: (option) => option.classificationId,
    },
    createTitle: "Agregar categoría de catastro",
    editTitle: "Editar opción de catálogo",
  },
};

const CATALOG_KEYS = Object.keys(CATALOG_CONFIG) as AdminCatalogKey[];

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
  const [selected, setSelected] = useState<AdminCatalogKey>("ACCESSIBILITY");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CatalogOption | null>(null);
  const [creating, setCreating] = useState(false);
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
  const config = CATALOG_CONFIG[selected];
  const parent = config.parent;

  useEffect(() => {
    if (catalogsQuery.error) {
      onError(errorMessage(catalogsQuery.error, "No se pudieron cargar los catálogos."));
    }
  }, [catalogsQuery.error, onError]);

  const options = useMemo(() => {
    const source = catalogsQuery.data?.[config.source] ?? [];
    return deferredSearch
      ? source.filter((item) =>
          [item.name, item.activityName, item.classificationName].some((value) =>
            value?.toLocaleLowerCase().includes(deferredSearch),
          ),
        )
      : source;
  }, [catalogsQuery.data, config.source, deferredSearch]);
  const lastPage = Math.max(Math.ceil(options.length / ADMIN_TABLE_PAGE_SIZE) - 1, 0);
  const visiblePage = Math.min(page, lastPage);
  const visibleOptions = options.slice(
    visiblePage * ADMIN_TABLE_PAGE_SIZE,
    (visiblePage + 1) * ADMIN_TABLE_PAGE_SIZE,
  );

  const parentOptions = parent ? (catalogsQuery.data?.[parent.source] ?? []) : [];

  function resetEditor() {
    setEditing(null);
    setCreating(false);
    setName("");
    setActive(true);
    setIcon(defaultCategoryIcon);
    setParentId("");
    setScheme("OTRA");
    setNumericValue("");
  }

  function openCreate() {
    resetEditor();
    setCreating(true);
    onError(null);
  }

  function openEdit(option: CatalogOption) {
    setCreating(false);
    setEditing(option);
    setName(option.name);
    setActive(option.active !== false);
    setIcon(normalizeCategoryIcon(option.icon));
    setParentId(String(parent?.idOf(option) ?? ""));
    setScheme(option.scheme ?? "OTRA");
    setNumericValue(option.numericValue == null ? "" : String(option.numericValue));
    onError(null);
  }

  async function save() {
    if ((!editing && !creating) || name.trim().length < 2) {
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
      selected === "ESTABLISHMENT_CATEGORY" &&
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
        await createAdminCatalog(token, selected, {
          name: name.trim(),
          active,
          ...(selected === "ESTABLISHMENT_CLASSIFICATION" ? { icon } : {}),
          ...(parent ? { parentId: Number(parentId) } : {}),
          ...(selected === "ESTABLISHMENT_CATEGORY"
            ? {
                scheme,
                ...(parsedNumericValue !== undefined
                  ? { numericValue: parsedNumericValue }
                  : {}),
              }
            : {}),
        });
      } else if (editing) {
        await updateAdminCatalog(token, selected, editing.id, {
          name: name.trim(),
          active,
          ...(selected === "ESTABLISHMENT_CLASSIFICATION" ? { icon } : {}),
        });
      }
      await queryClient.invalidateQueries({ queryKey: adminKeys.allCatalogs() });
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
      <AdminTableToolbar
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={openCreate}
            disabled={catalogsQuery.isLoading}
            aria-label={`Agregar opción de ${config.label}`}
          >
            Agregar
          </Button>
        }
      >
        <Stack spacing={webTokens.spacing.control}>
          <Tabs
            value={selected}
            onChange={(_, value: AdminCatalogKey) => {
              setSelected(value);
              setSearch("");
              setPage(0);
            }}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="Tipo de catálogo"
          >
            {CATALOG_KEYS.map((key) => (
              <Tab key={key} value={key} label={CATALOG_CONFIG[key].label} />
            ))}
          </Tabs>
          <SearchField
            label="Buscar opción"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 360 } }}
          />
        </Stack>
      </AdminTableToolbar>

      <AdminTable
        ariaLabel="Opciones del catálogo"
        minWidth={560}
        loading={catalogsQuery.isLoading}
        error={catalogsQuery.error ? "No se pudieron cargar los catálogos." : null}
        empty={options.length === 0}
        emptyMessage="No hay opciones que coincidan con la búsqueda."
        pagination={{ page: visiblePage, total: options.length, onPageChange: setPage }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            {selected === "ESTABLISHMENT_CATEGORY" ? (
              <>
                <TableCell>Actividad</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Sistema</TableCell>
              </>
            ) : selected === "ESTABLISHMENT_CLASSIFICATION" ? (
              <TableCell>Actividad</TableCell>
            ) : null}
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleOptions.map((option) => (
            <TableRow key={option.id} hover>
              <TableCell component="th" scope="row">
                {option.displayName ?? option.name}
              </TableCell>
              {selected === "ESTABLISHMENT_CATEGORY" ? (
                <>
                  <TableCell>{option.activityName ?? "—"}</TableCell>
                  <TableCell>{option.classificationName ?? "—"}</TableCell>
                  <TableCell>
                    {categorySchemeLabels[option.scheme ?? ""] ?? option.scheme ?? "—"}
                  </TableCell>
                </>
              ) : selected === "ESTABLISHMENT_CLASSIFICATION" ? (
                <TableCell>{option.activityName ?? "—"}</TableCell>
              ) : null}
              <TableCell>
                <StatusBadge
                  label={activeLabel(option.active !== false)}
                  tone={activeTone(option.active !== false)}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton
                    aria-label={`Editar ${option.name}`}
                    onClick={() => openEdit(option)}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>

      <Dialog
        open={editing !== null || creating}
        onClose={() => !working && resetEditor()}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {creating ? config.createTitle : config.editTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
            <TextField
              label="Nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              autoFocus
              disabled={working}
            />
            {creating && parent ? (
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
                {parentOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {selected === "ESTABLISHMENT_CLASSIFICATION" ? (
              <CatalogIconSelect
                id="catalog-marker-icon"
                label="Icono del marcador"
                value={icon}
                options={catalogIconOptionsWithImages}
                onChange={setIcon}
                disabled={working}
              />
            ) : null}
            {creating && selected === "ESTABLISHMENT_CATEGORY" ? (
              <>
                <TextField
                  select
                  label="Sistema de clasificación"
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
                  ? "Disponible para nuevas fichas"
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
