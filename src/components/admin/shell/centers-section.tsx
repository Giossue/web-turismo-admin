"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";
import { type ReactNode, useMemo } from "react";
import { RecordActionsMenu } from "@/components/admin/record-actions-menu";
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
    <AdminDataGrid
      ariaLabel="Centros turísticos"
      rows={centersQuery.data?.items ?? []}
      columns={columns}
      getRowId={getCenterRowId}
      loading={centersQuery.isLoading}
      error={error}
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
      mobileCard={(center) => {
        const isReview = center.status.code === "EN_REVISION";
        return {
          title: center.name,
          subtitle: center.code,
          status: (
            <StatusBadge
              label={centerStatusLabel(center.status)}
              tone={centerStatusTone(center.status.code)}
            />
          ),
          fields: [
            { label: "Solicitó", value: center.requestedBy ?? "—" },
            { label: "Actualizada", value: formatDate(center.updatedAt) },
          ],
          primaryAction: {
            label: isReview
              ? onGoToReview
                ? "Ir a revisión"
                : "Ver ficha"
              : "Editar ficha",
            onClick: isReview && onGoToReview ? onGoToReview : () => onOpen(center.code),
          },
          actions: (
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
          ),
        };
      }}
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
      mobileCard={(center) => ({
        title: center.name,
        subtitle: center.code,
        status: (
          <StatusBadge
            label={centerStatusLabel(center.status)}
            tone={centerStatusTone(center.status.code)}
          />
        ),
        fields: [
          { label: "Solicitó", value: center.requestedBy ?? "—" },
          { label: "Actualizada", value: formatDate(center.updatedAt) },
        ],
        primaryAction: {
          label: hasReview ? "Ver ficha" : "Editar ficha",
          onClick: () => onOpen(center.code),
        },
        actions: (
          <RecordActionsMenu
            subject={center.name}
            actions={
              !hasReview
                ? [
                    {
                      label: "Editar",
                      icon: <EditRounded fontSize="small" />,
                      onClick: () => onOpen(center.code),
                    },
                  ]
                : [
                    {
                      label: "Ver ficha",
                      icon: <VisibilityRounded fontSize="small" />,
                      onClick: () => onOpen(center.code),
                    },
                    ...(center.status.code === "EN_REVISION"
                      ? [
                          {
                            label: "Aprobar y publicar",
                            icon: <CheckRounded fontSize="small" />,
                            color: "success" as const,
                            disabled: reviewPending,
                            onClick: () => onReview?.(center, "APPROVE"),
                          },
                          {
                            label: "Devolver para corregir",
                            icon: <CloseRounded fontSize="small" />,
                            color: "error" as const,
                            disabled: reviewPending,
                            onClick: () => onReview?.(center, "REJECT"),
                          },
                        ]
                      : []),
                  ]
            }
          />
        ),
      })}
    />
  );
}
