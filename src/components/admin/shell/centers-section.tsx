"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";
import { type ReactNode, useMemo, useState } from "react";
import { RecordActionsMenu } from "@/components/admin/record-actions-menu";
import { pageAfterRemoval } from "./pagination";

import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import {
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { SearchField } from "@/components/ui/search-field";
import { SelectField } from "@/components/ui/form/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteAdminCenter, type AdminCenter, type ReviewAction } from "@/lib/admin-api";
import { centerStatusLabel, centerStatusTone } from "@/lib/admin-labels";
import { adminKeys, centersPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { CENTER_STATUS_FILTER_OPTIONS, type CenterStatusFilter } from "./admin-nav-state";

const pageSize = ADMIN_TABLE_PAGE_SIZE;
const getCenterRowId = (center: AdminCenter) => center.code;

function CenterInventoryActions({
  center,
  token,
  canDelete,
  tabIndex,
  onGoToReview,
  onOpen,
  onPageChange,
  page,
  itemsOnPage,
}: {
  center: AdminCenter;
  token: string;
  canDelete: boolean;
  tabIndex?: number;
  onGoToReview?: () => void;
  onOpen: (code: string) => void;
  onPageChange: (page: number) => void;
  page: number;
  itemsOnPage: number;
}) {
  return (
    <RecordActionsMenu
      subject={center.name}
      tabIndex={tabIndex}
      actions={
        center.status.code === "EN_REVISION"
          ? [
              onGoToReview
                ? {
                    label: "Ir a revisión",
                    icon: <FactCheckRounded fontSize="small" />,
                    onClick: onGoToReview,
                  }
                : {
                    label: "Ver ficha",
                    icon: <VisibilityRounded fontSize="small" />,
                    onClick: () => onOpen(center.code),
                  },
            ]
          : [
              {
                label: "Editar",
                icon: <EditRounded fontSize="small" />,
                onClick: () => onOpen(center.code),
              },
            ]
      }
      deletion={
        canDelete && center.status.code !== "EN_REVISION"
          ? {
              subject: center.name,
              title: "Eliminar centro turístico",
              description:
                "Se retirará del panel y de la aplicación. La ficha, sus archivos y el historial se conservan.",
              onDelete: () => deleteAdminCenter(token, center.code),
              queryKeys: [
                adminKeys.allCenters(),
                adminKeys.summary(),
                adminKeys.center(center.code),
                adminKeys.media(center.code),
                adminKeys.allNavigationSummaries(),
              ],
              onDeleted: () => onPageChange(pageAfterRemoval(page, itemsOnPage)),
            }
          : undefined
      }
    />
  );
}

function CenterMobileCard({
  center,
  onOpen,
  onGoToReview,
  actions,
}: {
  center: AdminCenter;
  onOpen: (code: string) => void;
  onGoToReview?: () => void;
  actions: ReactNode;
}) {
  const isReview = center.status.code === "EN_REVISION";
  const openCenter = isReview && onGoToReview ? onGoToReview : () => onOpen(center.code);

  return (
    <Card component="article" variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Button
              onClick={openCenter}
              variant="text"
              color="inherit"
              sx={{
                flex: 1,
                minWidth: 0,
                p: 0,
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
              }}
              aria-label={`${isReview && onGoToReview ? "Ir a revisión de" : "Abrir ficha de"} ${center.name}`}
            >
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {center.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {center.code}
                </Typography>
              </Stack>
            </Button>
            <Box sx={{ mt: -0.75, mr: -1 }}>{actions}</Box>
          </Stack>
          <Box>
            <StatusBadge
              label={centerStatusLabel(center.status)}
              tone={centerStatusTone(center.status.code)}
            />
          </Box>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 1,
            }}
          >
            <Box>
              <Typography component="dt" variant="caption" color="text.secondary">
                Solicitó
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ m: 0, overflowWrap: "anywhere" }}
              >
                {center.requestedBy ?? "—"}
              </Typography>
            </Box>
            <Box>
              <Typography component="dt" variant="caption" color="text.secondary">
                Actualizada
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                {formatDate(center.updatedAt)}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function CentersSection({
  token,
  status,
  query,
  appliedQuery,
  page,
  onQueryChange,
  onStatusChange,
  onPageChange,
  onOpen,
  onGoToReview,
  canDelete,
}: {
  token: string;
  status: CenterStatusFilter;
  /** Texto del campo de búsqueda. */
  query: string;
  /** Búsqueda ya aplicada a la consulta (tras el retardo). */
  appliedQuery: string;
  page: number;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: CenterStatusFilter) => void;
  onPageChange: (page: number) => void;
  onOpen: (code: string) => void;
  /** Disponible sólo para cuentas que pueden entrar a la cola de revisión. */
  onGoToReview?: () => void;
  canDelete: boolean;
}) {
  const centersQuery = useQuery(
    centersPageQueryOptions(token, {
      status,
      q: appliedQuery,
      limit: pageSize,
      offset: page * pageSize,
    }),
  );
  const itemsOnPage = centersQuery.data?.items.length ?? 0;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const centers = centersQuery.data?.items ?? [];
  const total = centersQuery.data?.total ?? 0;
  const firstResult = total === 0 ? 0 : page * pageSize + 1;
  const lastResult = Math.min((page + 1) * pageSize, total);
  const lastPage = Math.max(Math.ceil(total / pageSize) - 1, 0);
  const columns = useMemo<GridColDef<AdminCenter>[]>(
    () => [
      {
        field: "name",
        headerName: "Ficha",
        minWidth: 230,
        flex: 1,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap title={row.name}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.code}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "status",
        headerName: "Estado de la ficha",
        width: 180,
        filterable: false,
        valueGetter: (_value, row) => row.status.code,
        renderCell: ({ row }) => (
          <StatusBadge
            label={centerStatusLabel(row.status)}
            tone={centerStatusTone(row.status.code)}
          />
        ),
      },
      {
        field: "requestedBy",
        headerName: "Solicitó",
        minWidth: 140,
        flex: 0.5,
        filterable: false,
        valueFormatter: (value: string | null) => value ?? "—",
      },
      {
        field: "updatedAt",
        headerName: "Actualizada",
        width: 150,
        filterable: false,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 96,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, hasFocus }) => (
          <CenterInventoryActions
            center={row}
            token={token}
            canDelete={canDelete}
            tabIndex={hasFocus ? 0 : -1}
            onGoToReview={onGoToReview}
            onOpen={onOpen}
            onPageChange={onPageChange}
            page={page}
            itemsOnPage={itemsOnPage}
          />
        ),
      },
    ],
    [onOpen, onGoToReview, canDelete, token, page, onPageChange, itemsOnPage],
  );
  const filterCount = Number(status !== "ALL");
  const error = centersQuery.error
    ? errorMessage(centersQuery.error, "No se pudieron cargar las fichas.")
    : null;

  return (
    <>
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <AdminDataGrid
          ariaLabel="Centros turísticos"
          rows={centers}
          columns={columns}
          getRowId={getCenterRowId}
          loading={centersQuery.isLoading}
          error={error}
          emptyMessage="No hay fichas para mostrar."
          pagination={{ page, total, onPageChange }}
          search={{
            label: "Buscar por nombre o código",
            value: query,
            onChange: onQueryChange,
          }}
          filterCount={filterCount}
          filterPanel={
            <AdminGridFilterPanel
              width={360}
              activeCount={filterCount}
              onClear={() => onStatusChange("ALL")}
            >
              <SelectField
                id="center-status"
                label="Estado de la ficha"
                value={status}
                options={CENTER_STATUS_FILTER_OPTIONS}
                onChange={(value) => onStatusChange(value || "ALL")}
              />
            </AdminGridFilterPanel>
          }
        />
      </Box>

      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SearchField
                size="small"
                label="Buscar por nombre o código"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<FilterListRounded />}
              onClick={() => setMobileFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              Filtros{filterCount > 0 ? ` (${filterCount})` : ""}
            </Button>
          </Stack>

          <Dialog
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            fullWidth
            maxWidth="xs"
            aria-labelledby="center-mobile-filter-title"
          >
            <DialogTitle id="center-mobile-filter-title">
              Filtrar centros turísticos
            </DialogTitle>
            <DialogContent>
              <SelectField
                id="center-status-mobile"
                label="Estado de la ficha"
                value={status}
                options={CENTER_STATUS_FILTER_OPTIONS}
                onChange={(value) => onStatusChange(value || "ALL")}
              />
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
              <Button onClick={() => onStatusChange("ALL")} disabled={filterCount === 0}>
                Limpiar filtros
              </Button>
              <Button variant="contained" onClick={() => setMobileFiltersOpen(false)}>
                Ver resultados
              </Button>
            </DialogActions>
          </Dialog>

          {centersQuery.isLoading ? (
            <FlatSurface padding="default">
              <ContentState status="loading" label="Cargando fichas" />
            </FlatSurface>
          ) : error ? (
            <FlatSurface>
              <ContentState status="error" message={error} />
            </FlatSurface>
          ) : centers.length === 0 ? (
            <FlatSurface>
              <ContentState status="empty" message="No hay fichas para mostrar." />
            </FlatSurface>
          ) : (
            <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
              {centers.map((center) => (
                <Box component="li" key={center.code}>
                  <CenterMobileCard
                    center={center}
                    onOpen={onOpen}
                    onGoToReview={onGoToReview}
                    actions={
                      <CenterInventoryActions
                        center={center}
                        token={token}
                        canDelete={canDelete}
                        onGoToReview={onGoToReview}
                        onOpen={onOpen}
                        onPageChange={onPageChange}
                        page={page}
                        itemsOnPage={itemsOnPage}
                      />
                    }
                  />
                </Box>
              ))}
            </Stack>
          )}

          <FlatSurface padding="compact">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {total === 0
                  ? "0 resultados"
                  : `${firstResult}–${lastResult} de ${total}`}
              </Typography>
              <Stack direction="row">
                <IconButton
                  aria-label="Página anterior"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 0}
                  size="small"
                >
                  <ChevronLeftRounded fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Página siguiente"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= lastPage}
                  size="small"
                >
                  <ChevronRightRounded fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </FlatSurface>
        </Stack>
      </Box>
    </>
  );
}

/** Tabla de fichas; con `review` muestra las acciones de aprobación. */
export function CenterTable({
  centers,
  loading,
  error,
  review,
  onOpen,
  pagination,
  search,
  filterCount,
  filterPanel,
}: {
  centers: AdminCenter[];
  loading: boolean;
  error: string | null;
  review?: {
    /** Deshabilita las acciones mientras se guarda una revisión. */
    pending: boolean;
    onReview: (center: AdminCenter, action: ReviewAction) => void;
  };
  onOpen: (code: string) => void;
  pagination: AdminTablePagination;
  search?: { label: string; value: string; onChange: (value: string) => void };
  filterCount?: number;
  filterPanel?: ReactNode;
}) {
  const hasReview = Boolean(review);
  const reviewPending = review?.pending ?? false;
  const onReview = review?.onReview;
  const columns = useMemo<GridColDef<AdminCenter>[]>(
    () => [
      {
        field: "name",
        headerName: "Ficha",
        minWidth: 230,
        flex: 1,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap title={row.name}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.code}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "status",
        headerName: "Estado de la ficha",
        width: 180,
        filterable: false,
        valueGetter: (_value, row) => row.status.code,
        renderCell: ({ row }) => (
          <StatusBadge
            label={centerStatusLabel(row.status)}
            tone={centerStatusTone(row.status.code)}
          />
        ),
      },
      {
        field: "requestedBy",
        headerName: "Solicitó",
        minWidth: 140,
        flex: 0.5,
        filterable: false,
        valueFormatter: (value: string | null) => value ?? "—",
      },
      {
        field: "updatedAt",
        headerName: "Actualizada",
        width: 150,
        filterable: false,
        valueFormatter: (value: string) => formatDate(value),
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
            subject={row.name}
            tabIndex={hasFocus ? 0 : -1}
            actions={
              !hasReview
                ? [
                    {
                      label: "Editar",
                      icon: <EditRounded fontSize="small" />,
                      onClick: () => onOpen(row.code),
                    },
                  ]
                : [
                    {
                      label: "Ver ficha",
                      icon: <VisibilityRounded fontSize="small" />,
                      onClick: () => onOpen(row.code),
                    },
                    ...(row.status.code === "EN_REVISION"
                      ? [
                          {
                            label: "Aprobar y publicar",
                            icon: <CheckRounded fontSize="small" />,
                            color: "success" as const,
                            disabled: reviewPending,
                            onClick: () => onReview?.(row, "APPROVE"),
                          },
                          {
                            label: "Devolver para corregir",
                            icon: <CloseRounded fontSize="small" />,
                            color: "error" as const,
                            disabled: reviewPending,
                            onClick: () => onReview?.(row, "REJECT"),
                          },
                        ]
                      : []),
                  ]
            }
          />
        ),
      },
    ],
    [hasReview, onOpen, onReview, reviewPending],
  );

  return (
    <AdminDataGrid
      ariaLabel="Centros turísticos"
      rows={centers}
      columns={columns}
      getRowId={getCenterRowId}
      loading={loading}
      error={error}
      emptyMessage="No hay fichas para mostrar."
      pagination={pagination}
      search={search}
      filterCount={filterCount}
      filterPanel={filterPanel}
    />
  );
}
