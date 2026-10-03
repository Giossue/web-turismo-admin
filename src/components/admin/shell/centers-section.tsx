"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { DeleteRecordAction } from "@/components/admin/delete-record-action";
import { pageAfterRemoval } from "./pagination";

import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import {
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { SelectField } from "@/components/ui/form/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteAdminCenter, type AdminCenter, type ReviewAction } from "@/lib/admin-api";
import {
  activeLabel,
  activeTone,
  centerStatusLabel,
  centerStatusTone,
} from "@/lib/admin-labels";
import { adminKeys, centersPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import {
  CENTER_ACTIVE_FILTER_OPTIONS,
  CENTER_STATUS_FILTER_OPTIONS,
  type CenterActiveFilter,
  type CenterStatusFilter,
} from "./admin-nav-state";

const pageSize = ADMIN_TABLE_PAGE_SIZE;
const getCenterRowId = (center: AdminCenter) => center.code;

export function CentersSection({
  token,
  status,
  active,
  query,
  appliedQuery,
  page,
  onQueryChange,
  onStatusChange,
  onActiveChange,
  onPageChange,
  onOpen,
  canDelete,
}: {
  token: string;
  status: CenterStatusFilter;
  active: CenterActiveFilter;
  /** Texto del campo de búsqueda. */
  query: string;
  /** Búsqueda ya aplicada a la consulta (tras el retardo). */
  appliedQuery: string;
  page: number;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: CenterStatusFilter) => void;
  onActiveChange: (value: CenterActiveFilter) => void;
  onPageChange: (page: number) => void;
  onOpen: (code: string) => void;
  canDelete: boolean;
}) {
  const centersQuery = useQuery(
    centersPageQueryOptions(token, {
      status,
      active: active === "ALL" ? undefined : active === "ACTIVE",
      q: appliedQuery,
      limit: pageSize,
      offset: page * pageSize,
    }),
  );
  const itemsOnPage = centersQuery.data?.items.length ?? 0;
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
        field: "active",
        headerName: "Activación",
        width: 125,
        filterable: false,
        renderCell: ({ row }) => (
          <StatusBadge label={activeLabel(row.active)} tone={activeTone(row.active)} />
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
        width: canDelete ? 145 : 95,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, tabIndex }) => (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            sx={{ height: "100%" }}
          >
            <Tooltip title="Editar" disableInteractive>
              <IconButton
                aria-label={`Editar ${row.name}`}
                tabIndex={tabIndex}
                onClick={() => onOpen(row.code)}
              >
                <EditRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDelete ? (
              <DeleteRecordAction
                subject={row.name}
                title="Eliminar centro turístico"
                description="Se retirará del panel y de la aplicación. La ficha, sus archivos y el historial se conservan."
                tabIndex={tabIndex}
                onDelete={() => deleteAdminCenter(token, row.code)}
                queryKeys={[
                  adminKeys.allCenters(),
                  adminKeys.summary(),
                  adminKeys.center(row.code),
                  adminKeys.media(row.code),
                ]}
                onDeleted={() => onPageChange(pageAfterRemoval(page, itemsOnPage))}
              />
            ) : null}
          </Stack>
        ),
      },
    ],
    [onOpen, canDelete, token, page, onPageChange, itemsOnPage],
  );
  const filterCount = Number(status !== "ALL") + Number(active !== "ALL");

  return (
    <AdminDataGrid
      ariaLabel="Centros turísticos"
      rows={centersQuery.data?.items ?? []}
      columns={columns}
      getRowId={getCenterRowId}
      loading={centersQuery.isLoading}
      error={
        centersQuery.error
          ? errorMessage(centersQuery.error, "No se pudieron cargar las fichas.")
          : null
      }
      emptyMessage="No hay fichas para mostrar."
      pagination={{ page, total: centersQuery.data?.total ?? 0, onPageChange }}
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
          onClear={() => {
            onStatusChange("ALL");
            onActiveChange("ALL");
          }}
        >
          <SelectField
            id="center-status"
            label="Estado de la ficha"
            value={status}
            options={CENTER_STATUS_FILTER_OPTIONS}
            onChange={(value) => onStatusChange(value || "ALL")}
          />
          <SelectField
            id="center-active"
            label="Activación"
            value={active}
            options={CENTER_ACTIVE_FILTER_OPTIONS}
            onChange={(value) => onActiveChange(value || "ALL")}
          />
        </AdminGridFilterPanel>
      }
    />
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
        width: hasReview ? 155 : 95,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, hasFocus }) =>
          !hasReview ? (
            <Tooltip title="Editar" disableInteractive>
              <IconButton
                aria-label={`Editar ${row.name}`}
                tabIndex={hasFocus ? 0 : -1}
                onClick={() => onOpen(row.code)}
              >
                <EditRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : row.status.code === "EN_REVISION" ? (
            <Stack direction="row" alignItems="center" justifyContent="flex-end">
              <Tooltip title="Ver ficha" disableInteractive>
                <IconButton
                  aria-label={`Ver ficha ${row.name}`}
                  tabIndex={hasFocus ? 0 : -1}
                  onClick={() => onOpen(row.code)}
                >
                  <VisibilityRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Aprobar y publicar" disableInteractive>
                <span>
                  <IconButton
                    color="success"
                    aria-label={`Aprobar y publicar ficha ${row.name}`}
                    tabIndex={hasFocus ? 0 : -1}
                    disabled={reviewPending}
                    onClick={() => onReview?.(row, "APPROVE")}
                  >
                    <CheckRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Devolver para corregir" disableInteractive>
                <span>
                  <IconButton
                    color="error"
                    aria-label={`Devolver para corregir ficha ${row.name}`}
                    tabIndex={hasFocus ? 0 : -1}
                    disabled={reviewPending}
                    onClick={() => onReview?.(row, "REJECT")}
                  >
                    <CloseRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : (
            <Tooltip title="Ver ficha" disableInteractive>
              <IconButton
                aria-label={`Ver ficha ${row.name}`}
                tabIndex={hasFocus ? 0 : -1}
                onClick={() => onOpen(row.code)}
              >
                <VisibilityRounded fontSize="small" />
              </IconButton>
            </Tooltip>
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
    />
  );
}
