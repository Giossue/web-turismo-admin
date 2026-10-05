"use client";

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import { ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import { SelectField } from "@/components/ui/form/select-field";
import type { AdminActivityItem, AdminActivityType } from "@/lib/admin-api";
import { activityPageQueryOptions } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { webTokens } from "@/theme/tokens";

const activityTypeOptions = [
  { value: "CENTRO", label: "Centros turísticos" },
  { value: "ESTABLECIMIENTO", label: "Catastro" },
  { value: "CATALOGO", label: "Catálogos" },
  { value: "OPINION", label: "Opiniones" },
] as const satisfies readonly { value: AdminActivityType; label: string }[];

const typeLabels: Record<AdminActivityType, string> = {
  CENTRO: "Centro turístico",
  ESTABLECIMIENTO: "Catastro",
  CATALOGO: "Catálogo",
  OPINION: "Opinión",
};

const actionLabels: Record<string, string> = {
  CREAR: "Creó",
  MODIFICAR: "Actualizó",
  SOLICITAR_REVISION: "Envió a revisión",
  APROBAR: "Aprobó",
  RECHAZAR: "Rechazó",
  PUBLICAR: "Publicó",
  DESACTIVAR: "Desactivó",
  REACTIVAR: "Reactivó",
  ELIMINAR: "Eliminó",
  ELIMINAR_MULTIMEDIA: "Quitó multimedia",
  PUBLICAR_MULTIMEDIA: "Publicó multimedia",
  ACTIVAR: "Activó",
};

const contextLabels: Record<string, string> = {
  identificacion: "Identificación",
  "ubicacion-admin": "Ubicación",
  caracteristicas: "Características",
  accesibilidad: "Accesibilidad",
  planta: "Planta turística",
  conservacion: "Conservación",
  "higiene-seguridad": "Higiene y seguridad",
  politicas: "Políticas",
  actividades: "Actividades",
  promocion: "Promoción",
  visitantes: "Visitantes",
  "recurso-humano": "Recurso humano",
  descripcion: "Descripción",
  anexos: "Anexos",
  ACCESSIBILITY: "Accesibilidad",
  ACTIVITY: "Actividades",
  FACILITY: "Facilidades",
  ESTABLISHMENT_CATEGORY: "Categorías de catastro",
  ESTABLISHMENT_CLASSIFICATION: "Clasificaciones de catastro",
};

const getActivityRowId = (item: AdminActivityItem) => item.id;

function actionLabel(item: AdminActivityItem): string {
  if (item.action === "RECHAZAR") {
    if (item.type === "CENTRO") return "Devolvió para corregir";
    if (item.type === "ESTABLECIMIENTO") return "Rechazó el envío";
    if (item.type === "OPINION") return "Rechazó la opinión";
  }
  return actionLabels[item.action] ?? "Actualización registrada";
}

export function ActivitySection({
  token,
  query,
  appliedQuery,
  type,
  from,
  to,
  page,
  onQueryChange,
  onTypeChange,
  onFromChange,
  onToChange,
  onPageChange,
}: {
  token: string;
  query: string;
  appliedQuery: string;
  type: AdminActivityType | "";
  from: string;
  to: string;
  page: number;
  onQueryChange: (value: string) => void;
  onTypeChange: (value: AdminActivityType | "") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onPageChange: (page: number) => void;
}) {
  const filters = {
    type: type || undefined,
    from: from || undefined,
    to: to || undefined,
    q: appliedQuery || undefined,
    limit: ADMIN_TABLE_PAGE_SIZE,
    offset: page * ADMIN_TABLE_PAGE_SIZE,
  };
  const activityQuery = useQuery(activityPageQueryOptions(token, filters));
  const activeFilterCount =
    Number(Boolean(type)) + Number(Boolean(from)) + Number(Boolean(to));
  const columns = useMemo<GridColDef<AdminActivityItem>[]>(
    () => [
      {
        field: "action",
        headerName: "Actividad",
        minWidth: 175,
        flex: 0.8,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%" }}>
            <Typography variant="body2" fontWeight={600}>
              {actionLabel(row)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {typeLabels[row.type]}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "subject",
        headerName: "Registro",
        minWidth: 220,
        flex: 1,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography variant="body2" noWrap title={row.subject}>
              {row.subject}
            </Typography>
            {row.context ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {contextLabels[row.context] ?? "Detalle"}
              </Typography>
            ) : null}
          </Stack>
        ),
      },
      {
        field: "actor",
        headerName: "Responsable",
        minWidth: 170,
        flex: 0.7,
        filterable: false,
      },
      {
        field: "createdAt",
        headerName: "Fecha y hora",
        width: 185,
        filterable: false,
        valueFormatter: (value: string) => formatDateTime(value),
      },
    ],
    [],
  );

  return (
    <AdminDataGrid
      ariaLabel="Actividad administrativa reciente"
      rows={activityQuery.data?.items ?? []}
      columns={columns}
      getRowId={getActivityRowId}
      loading={activityQuery.isLoading}
      error={
        activityQuery.error
          ? errorMessage(activityQuery.error, "No se pudo cargar la actividad.")
          : null
      }
      emptyMessage="No hay actividad para los filtros seleccionados."
      pagination={{ page, total: activityQuery.data?.total ?? 0, onPageChange }}
      search={{
        label: "Buscar por responsable o registro",
        value: query,
        onChange: onQueryChange,
      }}
      filterCount={activeFilterCount}
      filterPanel={
        <AdminGridFilterPanel
          width={390}
          activeCount={activeFilterCount}
          onClear={() => {
            onTypeChange("");
            onFromChange("");
            onToChange("");
          }}
        >
          <Stack spacing={webTokens.spacing.control}>
            <SelectField<AdminActivityType>
              id="activity-type"
              label="Tipo de registro"
              value={type}
              options={activityTypeOptions}
              emptyLabel="Todos los tipos"
              onChange={onTypeChange}
            />
            <TextField
              label="Desde"
              type="date"
              value={from}
              onChange={(event) => onFromChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) => onToChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
        </AdminGridFilterPanel>
      }
    />
  );
}
