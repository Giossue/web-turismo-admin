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

import {
  AdminTable,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { SelectField } from "@/components/ui/form/select-field";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminCenter, ReviewAction } from "@/lib/admin-api";
import { activeLabel, centerStatusTone } from "@/lib/admin-labels";
import { centersPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { webTokens } from "@/theme/tokens";
import { CENTER_STATUS_FILTER_OPTIONS, type CenterStatusFilter } from "./admin-nav-state";

const pageSize = ADMIN_TABLE_PAGE_SIZE;

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
}) {
  const centersQuery = useQuery(
    centersPageQueryOptions(token, {
      status,
      q: appliedQuery,
      limit: pageSize,
      offset: page * pageSize,
    }),
  );

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTableToolbar>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={webTokens.spacing.control}
        >
          <SearchField
            label="Buscar por nombre o código"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <SelectField
            id="center-status"
            label="Estado"
            value={status}
            options={CENTER_STATUS_FILTER_OPTIONS}
            onChange={(value) => onStatusChange(value || "ALL")}
            fullWidth={false}
            sx={{ minWidth: { sm: 220 } }}
          />
        </Stack>
      </AdminTableToolbar>
      <CenterTable
        centers={centersQuery.data?.items ?? []}
        loading={centersQuery.isLoading}
        error={
          centersQuery.error
            ? errorMessage(centersQuery.error, "No se pudieron cargar las fichas.")
            : null
        }
        onOpen={onOpen}
        pagination={{ page, total: centersQuery.data?.total ?? 0, onPageChange }}
      />
    </Stack>
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
