import type { AdminCatalogs, AdminEstablishmentsOptions } from "@/lib/admin-api";

export const establishmentFilterFields = [
  { value: "provinceId", label: "Provincia", operator: "es" },
  { value: "cantonId", label: "Cantón", operator: "es" },
  { value: "localityId", label: "Localidad", operator: "es" },
  { value: "activity", label: "Actividad", operator: "contiene" },
  { value: "classification", label: "Clasificación", operator: "contiene" },
  { value: "category", label: "Categoría", operator: "contiene" },
  { value: "active", label: "Estado", operator: "es" },
] as const;

export type EstablishmentFilterField =
  (typeof establishmentFilterFields)[number]["value"];
export type EstablishmentFilterValues = Record<EstablishmentFilterField, string>;
export type EstablishmentFilterRow = { id: number; field: EstablishmentFilterField };

export const emptyEstablishmentFilters: EstablishmentFilterValues = {
  provinceId: "",
  cantonId: "",
  localityId: "",
  activity: "",
  classification: "",
  category: "",
  active: "",
};

/** Los descendientes se reinician junto al padre en una sola actualización. */
export function changeEstablishmentFilter(
  filters: EstablishmentFilterValues,
  field: EstablishmentFilterField,
  value: string,
): EstablishmentFilterValues {
  if (filters[field] === value) return filters;

  const next = { ...filters, [field]: value };
  if (field === "provinceId") {
    next.cantonId = "";
    next.localityId = "";
  }
  if (field === "cantonId") next.localityId = "";
  if (field === "activity") {
    next.classification = "";
    next.category = "";
  }
  if (field === "classification") next.category = "";
  return next;
}

export function establishmentFiltersToQuery(
  filters: EstablishmentFilterValues,
): AdminEstablishmentsOptions {
  return {
    provinceId: filters.provinceId ? Number(filters.provinceId) : undefined,
    cantonId: filters.cantonId ? Number(filters.cantonId) : undefined,
    localityId: filters.localityId ? Number(filters.localityId) : undefined,
    activity: filters.activity || undefined,
    classification: filters.classification || undefined,
    category: filters.category || undefined,
    active: filters.active === "" ? undefined : filters.active === "true",
  };
}

export function isEstablishmentFilterAvailable(
  field: EstablishmentFilterField,
  filters: EstablishmentFilterValues,
) {
  if (field === "cantonId") return Boolean(filters.provinceId);
  if (field === "classification") return Boolean(filters.activity);
  if (field === "category") return Boolean(filters.classification);
  return true;
}

export function establishmentFilterOptions(
  field: EstablishmentFilterField,
  filters: EstablishmentFilterValues,
  catalogs: AdminCatalogs | undefined,
) {
  if (field === "active") {
    return [
      { value: "true", label: "Activos" },
      { value: "false", label: "Inactivos" },
    ];
  }

  const activityId = catalogs?.establishmentActivities.find(
    (option) => option.name === filters.activity,
  )?.id;
  const classificationId = catalogs?.establishmentClassifications.find(
    (option) =>
      option.name === filters.classification &&
      (!activityId || option.activityId === activityId),
  )?.id;
  const options =
    field === "provinceId"
      ? catalogs?.provinces
      : field === "cantonId"
        ? catalogs?.cantons.filter(
            (option) => String(option.provinceId) === filters.provinceId,
          )
        : field === "localityId"
          ? catalogs?.localities.filter(
              (option) =>
                (!filters.provinceId ||
                  String(option.provinceId) === filters.provinceId) &&
                (!filters.cantonId || String(option.cantonId) === filters.cantonId),
            )
          : field === "activity"
            ? catalogs?.establishmentActivities
            : field === "classification"
              ? catalogs?.establishmentClassifications.filter(
                  (option) => option.activityId === activityId,
                )
              : catalogs?.establishmentCategories.filter(
                  (option) => option.classificationId === classificationId,
                );

  const usesIds =
    field === "provinceId" || field === "cantonId" || field === "localityId";
  return (options ?? []).map((option) => ({
    value: usesIds ? String(option.id) : option.name,
    label: option.name,
  }));
}
