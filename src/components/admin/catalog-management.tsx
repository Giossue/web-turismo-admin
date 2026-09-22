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
import { useEffect, useMemo, useState } from "react";

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
  type CatalogOption,
} from "@/lib/admin-api";
import { activeLabel, activeTone } from "@/lib/admin-labels";
import { adminKeys, catalogsQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/use-debounced-value";

const catalogMeta: Array<{ key: AdminCatalogKey; label: string }> = [
  { key: "ACCESSIBILITY", label: "Accesibilidad" },
  { key: "ACTIVITY", label: "Actividades" },
  { key: "FACILITY", label: "Facilidades" },
  { key: "ESTABLISHMENT_CLASSIFICATION", label: "Tipos de establecimiento" },
  { key: "ESTABLISHMENT_CATEGORY", label: "Categorías de catastro" },
];

const defaultCategoryIcon = "shop-supermarket";
const catalogIconOptions = [
  {
    value: "accommodation-hotel",
    label: "Hotel",
    color: "#7a5c3e",
  },
  { value: "amenity-cinema", label: "Cine", color: "#7e22ce" },
  { value: "amenity-library", label: "Biblioteca", color: "#334155" },
  { value: "amenity-toilets", label: "Baños", color: "#64748b" },
  { value: "eat-drink-cafe", label: "Cafetería", color: "#8b5e34" },
  {
    value: "eat-drink-restaurant",
    label: "Restaurante",
    color: "#b45309",
  },
  { value: "health-hospital", label: "Salud", color: "#9f1239" },
  { value: "money-atm", label: "Cajero", color: "#475569" },
  { value: "money-bank", label: "Banco", color: "#374151" },
  { value: "outdoor-camping", label: "Camping", color: "#3f6212" },
  {
    value: "outdoor-drinking-water",
    label: "Agua potable",
    color: "#0f766e",
  },
  {
    value: "religious-place-of-worship",
    label: "Lugar de culto",
    color: "#6d28d9",
  },
  { value: "shop-supermarket", label: "Supermercado", color: "#be123c" },
  {
    value: "tourism-information",
    label: "Información turística",
    color: "#0369a1",
  },
  { value: "tourism-museum", label: "Museo", color: "#5b21b6" },
  { value: "tourism-viewpoint", label: "Mirador", color: "#a16207" },
  { value: "transport-bus-stop", label: "Parada de bus", color: "#155e75" },
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
function normalizeCategoryIcon(value?: string) {
  return catalogIconOptions.some((option) => option.value === value)
    ? value!
    : defaultCategoryIcon;
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
  const debouncedSearch = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const catalogsQuery = useQuery(catalogsQueryOptions(token, true));

  useEffect(() => {
    if (catalogsQuery.error) {
      onError(errorMessage(catalogsQuery.error, "No se pudieron cargar los catálogos."));
    }
  }, [catalogsQuery.error, onError]);

  const options = useMemo(() => {
    if (!catalogsQuery.data) return [];
    const source =
      selected === "ACCESSIBILITY"
        ? catalogsQuery.data.accessibilityTypes
        : selected === "ACTIVITY"
          ? catalogsQuery.data.activities
          : selected === "FACILITY"
            ? catalogsQuery.data.facilities
            : selected === "ESTABLISHMENT_CLASSIFICATION"
              ? catalogsQuery.data.establishmentClassifications
              : catalogsQuery.data.establishmentCategories;
    const normalized = (search.trim() ? debouncedSearch : "").toLocaleLowerCase();
    return normalized
      ? source.filter((item) =>
          [item.name, item.activityName, item.classificationName]
            .filter(Boolean)
            .some((value) => value?.toLocaleLowerCase().includes(normalized)),
        )
      : source;
  }, [catalogsQuery.data, debouncedSearch, search, selected]);
  const lastPage = Math.max(Math.ceil(options.length / ADMIN_TABLE_PAGE_SIZE) - 1, 0);
  const visiblePage = Math.min(page, lastPage);
  const visibleOptions = options.slice(
    visiblePage * ADMIN_TABLE_PAGE_SIZE,
    (visiblePage + 1) * ADMIN_TABLE_PAGE_SIZE,
  );

  const requiresParent = selected !== "ACCESSIBILITY";
  const parentLabel =
    selected === "ACTIVITY"
      ? "Grupo de actividad"
      : selected === "FACILITY"
        ? "Categoría de facilidad"
        : selected === "ESTABLISHMENT_CLASSIFICATION"
          ? "Actividad del catastro"
          : "Tipo de establecimiento";
  const parentOptions =
    selected === "ACTIVITY"
      ? (catalogsQuery.data?.activityGroups ?? [])
      : selected === "FACILITY"
        ? (catalogsQuery.data?.facilityCategories ?? [])
        : selected === "ESTABLISHMENT_CLASSIFICATION"
          ? (catalogsQuery.data?.establishmentActivities ?? [])
          : (catalogsQuery.data?.establishmentClassifications ?? []);

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
    setParentId(
      String(
        selected === "ACTIVITY"
          ? (option.groupId ?? "")
          : selected === "FACILITY"
            ? (option.categoryId ?? "")
            : selected === "ESTABLISHMENT_CLASSIFICATION"
              ? (option.activityId ?? "")
              : (option.classificationId ?? ""),
      ),
    );
    setScheme(option.scheme ?? "OTRA");
    setNumericValue(option.numericValue == null ? "" : String(option.numericValue));
    onError(null);
  }

  async function save() {
    if ((!editing && !creating) || name.trim().length < 2) {
      onError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (creating && requiresParent && !parentId) {
      onError(`Selecciona ${parentLabel.toLocaleLowerCase()}.`);
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
          ...(requiresParent ? { parentId: Number(parentId) } : {}),
          ...(selected === "ESTABLISHMENT_CATEGORY"
            ? {
                scheme,
                ...(parsedNumericValue !== undefined
                  ? { numericValue: parsedNumericValue }
                  : {}),
              }
            : {}),
        });
      } else {
        await updateAdminCatalog(token, selected, editing!.id, {
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
            aria-label={`Agregar opción de ${catalogMeta.find((item) => item.key === selected)?.label ?? "catálogo"}`}
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
            {catalogMeta.map((item) => (
              <Tab key={item.key} value={item.key} label={item.label} />
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
          {creating
            ? `Agregar ${selected === "ESTABLISHMENT_CLASSIFICATION" ? "tipo de establecimiento" : selected === "ESTABLISHMENT_CATEGORY" ? "categoría de catastro" : "opción de catálogo"}`
            : selected === "ESTABLISHMENT_CLASSIFICATION"
              ? "Editar tipo de establecimiento"
              : "Editar opción de catálogo"}
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
            {creating && requiresParent ? (
              <TextField
                select
                label={parentLabel}
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
