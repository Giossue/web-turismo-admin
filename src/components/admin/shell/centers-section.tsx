"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import {
  Button,
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { DeleteRecordAction } from "@/components/admin/delete-record-action";
import { pageAfterRemoval } from "./pagination";

import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import {
  AdminTable,
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { SelectField } from "@/components/ui/form/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteAdminCenter, type AdminCenter, type ReviewAction } from "@/lib/admin-api";
import { activeLabel, centerStatusTone } from "@/lib/admin-labels";
import { adminKeys, centersPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { webTokens } from "@/theme/tokens";
import { CENTER_STATUS_FILTER_OPTIONS, type CenterStatusFilter } from "./admin-nav-state";

const pageSize = ADMIN_TABLE_PAGE_SIZE;
const getCenterRowId = (center: AdminCenter) => center.code;

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
            <Typography variant="body2" fontWeight={700} noWrap title={row.name}>
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
        headerName: "Estado",
        width: 160,
        filterable: false,
        valueGetter: (_value, row) => row.status.code,
        renderCell: ({ row }) => (
          <StatusBadge label={row.status.name} tone={centerStatusTone(row.status.code)} />
        ),
      },
      {
        field: "active",
        headerName: "Estado operativo",
        width: 165,
        filterable: false,
        valueFormatter: (value: boolean) => activeLabel(value),
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
                onDeleted={() =>
                  onPageChange(
                    pageAfterRemoval(page, centersQuery.data?.items.length ?? 0),
                  )
                }
              />
            ) : null}
          </Stack>
        ),
      },
    ],
    [onOpen, canDelete, token, page, onPageChange, centersQuery.data?.items.length],
  );

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
      filterCount={status === "ALL" ? 0 : 1}
      filterPanel={
        <AdminGridFilterPanel
          width={360}
          activeCount={status === "ALL" ? 0 : 1}
          onClear={() => onStatusChange("ALL")}
        >
          <SelectField
            id="center-status"
            label="Estado"
            value={status}
            options={CENTER_STATUS_FILTER_OPTIONS}
            onChange={(value) => onStatusChange(value || "ALL")}
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
  return (
    <AdminTable
      ariaLabel="Centros turísticos"
      minWidth={review ? 860 : 760}
      loading={loading}
      error={error}
      empty={centers.length === 0}
      emptyMessage="No hay fichas para mostrar."
      pagination={pagination}
    >
      <TableHead>
        <TableRow>
          <TableCell>Ficha</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Estado operativo</TableCell>
          <TableCell>Solicitó</TableCell>
          <TableCell>Actualizada</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {centers.map((center) => (
          <TableRow key={center.code} hover>
            <TableCell component="th" scope="row">
              <Typography fontWeight={700}>{center.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {center.code}
              </Typography>
            </TableCell>
            <TableCell>
              <StatusBadge
                label={center.status.name}
                tone={centerStatusTone(center.status.code)}
              />
            </TableCell>
            <TableCell>{activeLabel(center.active)}</TableCell>
            <TableCell>{center.requestedBy ?? "—"}</TableCell>
            <TableCell>{formatDate(center.updatedAt)}</TableCell>
            <TableCell align="right">
              {!review ? (
                <Tooltip title="Editar">
                  <IconButton
                    aria-label={`Editar ${center.name}`}
                    onClick={() => onOpen(center.code)}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : center.status.code === "EN_REVISION" ? (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={webTokens.spacing.inline}
                  justifyContent="flex-end"
                >
                  <Button size="small" variant="text" onClick={() => onOpen(center.code)}>
                    Ver ficha
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={review.pending}
                    onClick={() => review.onReview(center, "APPROVE")}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    disabled={review.pending}
                    onClick={() => review.onReview(center, "REJECT")}
                  >
                    Rechazar
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aprobada
                </Typography>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminTable>
  );
}
