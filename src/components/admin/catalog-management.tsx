"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Tooltip,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  AdminTable,
  AdminTableFooter,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
import { CatalogIconSelect } from "@/components/ui/catalog-icon-select";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAdminCatalogs,
  updateAdminCatalog,
  type AdminCatalogKey,
  type CatalogOption,
} from "@/lib/admin-api";
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
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [icon, setIcon] = useState(defaultCategoryIcon);
  const [working, setWorking] = useState(false);
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const catalogsQuery = useQuery({
    queryKey: ["admin", "catalogs", "management"],
    queryFn: () => getAdminCatalogs(token, true),
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

  function openEdit(option: CatalogOption) {
    setEditing(option);
    setName(option.name);
    setActive(option.active !== false);
    setIcon(normalizeCategoryIcon(option.icon));
    onError(null);
  }

  async function save() {
    if (!editing || name.trim().length < 2) {
      onError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setWorking(true);
    onError(null);
    try {
      await updateAdminCatalog(token, selected, editing.id, {
        name: name.trim(),
        active,
        ...(selected === "ESTABLISHMENT_CLASSIFICATION" ? { icon } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "catalogs"] });
      setEditing(null);
      onNotice("Catálogo actualizado y auditado.");
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "No se pudo actualizar el catálogo.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTableToolbar>
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
        empty={
          Boolean(catalogsQuery.error) ||
          (!catalogsQuery.isLoading && options.length === 0)
        }
        emptyMessage={
          catalogsQuery.error
            ? "No se pudieron cargar los catálogos."
            : "No hay opciones que coincidan con la búsqueda."
        }
        footer={
          <AdminTableFooter
            total={options.length}
            page={visiblePage}
            pageSize={ADMIN_TABLE_PAGE_SIZE}
            onPageChange={setPage}
          />
        }
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
                  code={option.active === false ? "INACTIVA" : "ACTIVA"}
                  label={option.active === false ? "Inactiva" : "Activa"}
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
        open={editing !== null}
        onClose={() => !working && setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selected === "ESTABLISHMENT_CLASSIFICATION"
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
            {selected === "ESTABLISHMENT_CLASSIFICATION" ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <CatalogIconSelect
                  id="catalog-marker-icon"
                  label="Icono del marcador"
                  value={icon}
                  options={catalogIconOptionsWithImages}
                  onChange={setIcon}
                  disabled={working}
                />
                <Box
                  component="fieldset"
                  sx={{
                    border: 0,
                    flex: { sm: "0 0 200px" },
                    m: 0,
                    minWidth: 0,
                    p: 0,
                  }}
                >
                  <Typography
                    component="legend"
                    sx={{ color: "text.secondary", fontSize: "0.75rem", mb: 1 }}
                  >
                    Color automático
                  </Typography>
                  <Stack alignItems="center" direction="row" spacing={1.25}>
                    <Box
                      aria-hidden
                      sx={{
                        backgroundColor:
                          catalogIconOptions.find((option) => option.value === icon)
                            ?.color ?? "#be123c",
                        border: "2px solid",
                        borderColor: "divider",
                        borderRadius: "50%",
                        height: 30,
                        width: 30,
                      }}
                    />
                    <Typography variant="body2">
                      {catalogIconOptions.find((option) => option.value === icon)
                        ?.color ?? "#be123c"}
                    </Typography>
                  </Stack>
                  <Typography
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                    variant="caption"
                  >
                    Se asigna según el pin y se aplica a todas las categorías de este
                    tipo.
                  </Typography>
                </Box>
              </Stack>
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
          <Button onClick={() => setEditing(null)} disabled={working}>
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
