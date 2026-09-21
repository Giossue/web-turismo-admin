"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import {
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

import { AdminTable, AdminTableToolbar } from "@/components/ui/admin-table";
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
];

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
  const [working, setWorking] = useState(false);
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
          : catalogsQuery.data.facilities;
    const normalized = (search.trim() ? debouncedSearch : "").toLocaleLowerCase();
    return normalized
      ? source.filter((item) => item.name.toLocaleLowerCase().includes(normalized))
      : source;
  }, [catalogsQuery.data, debouncedSearch, search, selected]);

  function openEdit(option: CatalogOption) {
    setEditing(option);
    setName(option.name);
    setActive(option.active !== false);
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
            onChange={(event) => setSearch(event.target.value)}
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
      >
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {options.map((option) => (
            <TableRow key={option.id} hover>
              <TableCell component="th" scope="row">
                {option.name}
              </TableCell>
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
