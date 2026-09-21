"use client";

import BusinessCenterRounded from "@mui/icons-material/BusinessCenterRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import HotelRounded from "@mui/icons-material/HotelRounded";
import LocalActivityRounded from "@mui/icons-material/LocalActivityRounded";
import LocalCafeRounded from "@mui/icons-material/LocalCafeRounded";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Button,
  ButtonBase,
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
  { key: "ESTABLISHMENT_CATEGORY", label: "Categorías de catastro" },
];

const defaultCategoryIcon = "hotel";
const defaultCategoryColor = "#2563eb";
const catalogIconOptions = [
  { value: "hotel", label: "Hotel", Icon: HotelRounded },
  { value: "restaurant", label: "Restaurante", Icon: RestaurantRounded },
  { value: "coffee", label: "Cafetería", Icon: LocalCafeRounded },
  { value: "store", label: "Comercio", Icon: StorefrontRounded },
  { value: "bus", label: "Transporte", Icon: DirectionsBusRounded },
  { value: "ticket", label: "Actividad", Icon: LocalActivityRounded },
  { value: "briefcase", label: "Agencia", Icon: BusinessCenterRounded },
] as const;
const categoryColorOptions = [
  { value: "#2563eb", label: "Azul", foreground: "#ffffff" },
  { value: "#0891b2", label: "Cian", foreground: "#ffffff" },
  { value: "#7c3aed", label: "Violeta", foreground: "#ffffff" },
  { value: "#c026d3", label: "Fucsia", foreground: "#ffffff" },
  { value: "#ea580c", label: "Naranja", foreground: "#ffffff" },
  { value: "#d97706", label: "Ámbar", foreground: "#111827" },
  { value: "#dc2626", label: "Rojo", foreground: "#ffffff" },
  { value: "#4f46e5", label: "Índigo", foreground: "#ffffff" },
] as const;

function normalizeCategoryIcon(value?: string) {
  return catalogIconOptions.some((option) => option.value === value)
    ? value!
    : defaultCategoryIcon;
}

function normalizeCategoryColor(value?: string) {
  return categoryColorOptions.some((option) => option.value === value)
    ? value!
    : defaultCategoryColor;
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
  const [color, setColor] = useState(defaultCategoryColor);
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
    setColor(normalizeCategoryColor(option.color));
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
        ...(selected === "ESTABLISHMENT_CATEGORY" ? { icon, color } : {}),
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
                <TableCell>Clasificación</TableCell>
              </>
            ) : null}
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleOptions.map((option) => (
            <TableRow key={option.id} hover>
              <TableCell component="th" scope="row">
                {option.name}
              </TableCell>
              {selected === "ESTABLISHMENT_CATEGORY" ? (
                <>
                  <TableCell>{option.activityName ?? "—"}</TableCell>
                  <TableCell>{option.classificationName ?? "—"}</TableCell>
                </>
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
        <DialogTitle>Editar opción de catálogo</DialogTitle>
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
            {selected === "ESTABLISHMENT_CATEGORY" ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <CatalogIconSelect
                  id="catalog-marker-icon"
                  label="Icono del marcador"
                  value={icon}
                  options={catalogIconOptions}
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
                    Color del marcador
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {categoryColorOptions.map((option) => {
                      const selectedColor = color === option.value;
                      return (
                        <ButtonBase
                          aria-label={`Seleccionar color ${option.label}`}
                          aria-pressed={selectedColor}
                          disabled={working}
                          key={option.value}
                          onClick={() => setColor(option.value)}
                          sx={{
                            alignItems: "center",
                            backgroundColor: option.value,
                            border: "2px solid",
                            borderColor: selectedColor ? "text.primary" : "divider",
                            borderRadius: "50%",
                            display: "inline-flex",
                            height: 34,
                            justifyContent: "center",
                            transition: "transform 120ms ease, border-color 120ms ease",
                            width: 34,
                            "&:hover": {
                              backgroundColor: option.value,
                              opacity: 0.86,
                              transform: "scale(1.08)",
                            },
                            "&:focus-visible": {
                              outline: "3px solid",
                              outlineColor: "primary.main",
                              outlineOffset: 2,
                            },
                          }}
                        >
                          {selectedColor ? (
                            <CheckRounded
                              sx={{ color: option.foreground, fontSize: 20 }}
                            />
                          ) : null}
                        </ButtonBase>
                      );
                    })}
                  </Stack>
                  <Typography
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                    variant="caption"
                  >
                    {color}
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
