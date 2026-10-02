"use client";

import { Box, Stack, Typography } from "@mui/material";

import {
  establishmentFilterFields,
  establishmentFilterOptions,
  isEstablishmentFilterAvailable,
  type EstablishmentFilterField,
  type EstablishmentFilterValues,
} from "@/components/admin/establishment-grid-filter-state";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import { SelectField } from "@/components/ui/form/select-field";
import type { AdminCatalogs } from "@/lib/admin-api";

const groups: { title: string; fields: EstablishmentFilterField[] }[] = [
  { title: "Ubicación", fields: ["provinceId", "cantonId", "localityId"] },
  {
    title: "Tipo de establecimiento",
    fields: ["activity", "classification", "category"],
  },
];

export function EstablishmentGridFilters({
  values,
  catalogs,
  onChange,
  onClear,
}: {
  values: EstablishmentFilterValues;
  catalogs: AdminCatalogs | undefined;
  onChange: (field: EstablishmentFilterField, value: string) => void;
  onClear: () => void;
}) {
  function renderField(field: EstablishmentFilterField) {
    const label = establishmentFilterFields.find(
      (option) => option.value === field,
    )!.label;
    return (
      <SelectField
        key={field}
        id={`establishment-${field}-filter`}
        label={label}
        value={values[field]}
        options={establishmentFilterOptions(field, values, catalogs)}
        emptyLabel={
          field === "cantonId" || field === "classification" || field === "active"
            ? "Todos"
            : "Todas"
        }
        disabled={!isEstablishmentFilterAvailable(field, values)}
        onChange={(value) => onChange(field, value)}
      />
    );
  }

  return (
    <AdminGridFilterPanel
      activeCount={Object.values(values).filter(Boolean).length}
      onClear={onClear}
    >
      <Stack spacing={2.5}>
        {groups.map((group) => (
          <Stack key={group.title} spacing={1.5}>
            <Typography variant="body2" fontWeight={600}>
              {group.title}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {group.fields.map(renderField)}
            </Box>
          </Stack>
        ))}
        {renderField("active")}
      </Stack>
    </AdminGridFilterPanel>
  );
}
