"use client";

import BusinessCenterRounded from "@mui/icons-material/BusinessCenterRounded";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import HotelRounded from "@mui/icons-material/HotelRounded";
import LocalActivityRounded from "@mui/icons-material/LocalActivityRounded";
import LocalCafeRounded from "@mui/icons-material/LocalCafeRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
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
  Stack,
  Switch,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
  AdminTableFooter,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
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

const defaultCategoryIcon = "mapPin";
const defaultCategoryColor = "#2563eb";
const catalogIconOptions = [
  { value: "mapPin", label: "Lugar", Icon: PlaceRounded },
  { value: "hotel", label: "Hotel", Icon: HotelRounded },
  { value: "restaurant", label: "Restaurante", Icon: RestaurantRounded },
  { value: "coffee", label: "Cafetería", Icon: LocalCafeRounded },
  { value: "store", label: "Comercio", Icon: StorefrontRounded },
  { value: "bus", label: "Transporte", Icon: DirectionsBusRounded },
  { value: "ticket", label: "Actividad", Icon: LocalActivityRounded },
  { value: "briefcase", label: "Agencia", Icon: BusinessCenterRounded },
] as const;

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
    setIcon(option.icon ?? defaultCategoryIcon);
    setColor(option.color ?? defaultCategoryColor);
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
              <Stack spacing={1}>
                <Typography variant="body2">Icono del marcador</Typography>
                <ToggleButtonGroup
                  aria-label="Icono del marcador"
                  exclusive
                  value={icon}
                  onChange={(_, value: string | null) => {
                    if (value) setIcon(value);
                  }}
                  sx={{ flexWrap: "wrap", gap: 1 }}
                >
                  {catalogIconOptions.map(({ value, label, Icon }) => (
                    <ToggleButton
                      aria-label={label}
                      key={value}
                      value={value}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        gap: 0.75,
                        minHeight: 42,
                        textTransform: "none",
                      }}
                    >
                      <Icon fontSize="small" />
                      <Box
                        component="span"
                        sx={{ display: { xs: "none", sm: "inline" } }}
                      >
                        {label}
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <TextField
                  label="Color del marcador"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  fullWidth
                  disabled={working}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
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
