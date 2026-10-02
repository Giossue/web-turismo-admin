"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useGridApiContext } from "@mui/x-data-grid";

import {
  establishmentFilterFields,
  establishmentFilterOptions,
  isEstablishmentFilterAvailable,
  type EstablishmentFilterField,
  type EstablishmentFilterRow,
  type EstablishmentFilterValues,
} from "@/components/admin/establishment-grid-filter-state";
import { SelectField } from "@/components/ui/form/select-field";
import type { AdminCatalogs } from "@/lib/admin-api";

/** Panel del Data Grid con los siete criterios admitidos por el catastro. */
export function EstablishmentGridFilters({
  rows,
  values,
  catalogs,
  onChange,
  onFieldChange,
  onAdd,
  onRemove,
  onClear,
}: {
  rows: EstablishmentFilterRow[];
  values: EstablishmentFilterValues;
  catalogs: AdminCatalogs | undefined;
  onChange: (field: EstablishmentFilterField, value: string) => void;
  onFieldChange: (id: number, field: EstablishmentFilterField) => void;
  onAdd: (field: EstablishmentFilterField) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  const apiRef = useGridApiContext();
  const availableFields = establishmentFilterFields.filter(
    (option) =>
      !rows.some((row) => row.field === option.value) &&
      isEstablishmentFilterAvailable(option.value, values),
  );
  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <Stack spacing={2} sx={{ width: 600, maxWidth: "calc(100vw - 32px)", p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="subtitle1" fontWeight={600}>
          Filtros
        </Typography>
        <IconButton
          aria-label="Cerrar filtros"
          size="small"
          onClick={() => apiRef.current.hideFilterPanel()}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </Stack>
      {rows.length > 1 ? (
        <Typography variant="caption" color="text.secondary">
          Mostrar establecimientos que cumplan todos los filtros.
        </Typography>
      ) : null}
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Añade un filtro para acotar los resultados.
        </Typography>
      ) : null}
      <Stack
        spacing={2}
        sx={{ maxHeight: "min(55vh, 420px)", overflowY: "auto", p: 0.5 }}
      >
        {rows.map((row, index) => {
          const field = establishmentFilterFields.find(
            (option) => option.value === row.field,
          )!;
          const fields = establishmentFilterFields.filter(
            (option) =>
              option.value === row.field ||
              (!rows.some((item) => item.field === option.value) &&
                isEstablishmentFilterAvailable(option.value, values)),
          );
          const available = isEstablishmentFilterAvailable(row.field, values);
          const prerequisite =
            row.field === "cantonId"
              ? "Selecciona primero una provincia."
              : row.field === "classification"
                ? "Selecciona primero una actividad."
                : "Selecciona primero una clasificación.";

          return (
            <Box key={row.id}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Tooltip title={`Quitar filtro de ${field.label.toLowerCase()}`}>
                  <IconButton
                    aria-label={`Quitar filtro de ${field.label.toLowerCase()}`}
                    onClick={() => onRemove(row.id)}
                    sx={{ mt: 0.5 }}
                  >
                    <CloseRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1.2fr 0.8fr 1.5fr" },
                    gap: 1.5,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <SelectField
                    id={`establishment-filter-${row.id}-column`}
                    label={`Columna ${index + 1}`}
                    value={row.field}
                    options={fields}
                    onChange={(value) => {
                      if (value) onFieldChange(row.id, value);
                    }}
                  />
                  <SelectField
                    id={`establishment-filter-${row.id}-operator`}
                    label={`Operador ${index + 1}`}
                    value={field.operator}
                    options={[{ value: field.operator, label: field.operator }]}
                    onChange={() => {}}
                  />
                  <SelectField
                    id={`establishment-${row.field}-filter`}
                    label={`${field.label}: valor`}
                    value={values[row.field]}
                    options={establishmentFilterOptions(row.field, values, catalogs)}
                    emptyLabel="Cualquier valor"
                    disabled={!available}
                    onChange={(value) => onChange(row.field, value)}
                  />
                </Box>
              </Stack>
              {!available ? (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 6 }}>
                  {prerequisite}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={1}
        sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}
      >
        <Button
          startIcon={<AddRounded />}
          disabled={availableFields.length === 0}
          onClick={() => {
            if (availableFields[0]) onAdd(availableFields[0].value);
          }}
        >
          Añadir filtro
        </Button>
        <Button
          startIcon={<DeleteOutlineRounded />}
          disabled={activeCount === 0 && rows.length <= 1}
          onClick={onClear}
        >
          Limpiar filtros
        </Button>
      </Stack>
    </Stack>
  );
}
