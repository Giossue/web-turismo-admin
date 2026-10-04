"use client";

import { Chip, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import type { AdminAccount } from "@/lib/admin-api";
import { usersPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";

const roleLabels: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  AGENTE_TURISTICO: "Agente turístico",
  TURISTA: "Turista",
};

const getUserRowId = (user: AdminAccount) => user.id;

export function UsersSection({
  token,
  query,
  appliedQuery,
  page,
  onQueryChange,
  onPageChange,
}: {
  token: string;
  query: string;
  appliedQuery: string;
  page: number;
  onQueryChange: (value: string) => void;
  onPageChange: (page: number) => void;
}) {
  const usersQuery = useQuery(
    usersPageQueryOptions(token, {
      q: appliedQuery,
      limit: ADMIN_TABLE_PAGE_SIZE,
      offset: page * ADMIN_TABLE_PAGE_SIZE,
    }),
  );
  const columns = useMemo<GridColDef<AdminAccount>[]>(
    () => [
      {
        field: "name",
        headerName: "Usuario",
        minWidth: 220,
        flex: 1,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap title={row.name}>
              {row.name || "Sin nombre"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap title={row.email}>
              {row.email}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "roles",
        headerName: "Roles",
        minWidth: 200,
        flex: 0.8,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            {row.roles.length ? (
              row.roles.map((role) => (
                <Chip key={role} label={roleLabels[role] ?? role} size="small" />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Sin rol asignado
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        field: "active",
        headerName: "Estado",
        width: 120,
        filterable: false,
        valueFormatter: (value: boolean) => (value ? "Activa" : "Inactiva"),
        renderCell: ({ row }) => (
          <StatusBadge
            label={row.active ? "Activa" : "Inactiva"}
            tone={row.active ? "success" : "default"}
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "Registrado",
        width: 145,
        filterable: false,
        valueFormatter: (value: string) => formatDate(value),
      },
    ],
    [],
  );

  return (
    <AdminDataGrid
      ariaLabel="Usuarios registrados"
      rows={usersQuery.data?.items ?? []}
      columns={columns}
      getRowId={getUserRowId}
      loading={usersQuery.isLoading}
      error={
        usersQuery.error
          ? errorMessage(usersQuery.error, "No se pudieron cargar los usuarios.")
          : null
      }
      emptyMessage="No hay usuarios para mostrar."
      pagination={{ page, total: usersQuery.data?.total ?? 0, onPageChange }}
      search={{
        label: "Buscar por nombre, correo o rol",
        value: query,
        onChange: onQueryChange,
      }}
    />
  );
}
