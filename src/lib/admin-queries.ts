import {
  keepPreviousData,
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query";

import {
  getAdminCatalogs,
  getAdminActivity,
  getAdminCenter,
  getAdminCenterMedia,
  getAdminCenterSections,
  getAdminCenters,
  getAdminEstablishmentMedia,
  getAdminEstablishments,
  getAdminNavigationSummary,
  getAdminOpinionHistory,
  getAdminOpinions,
  getAdminSummary,
  getAdminUsers,
  type AdminCenterDetail,
  type AdminActivityOptions,
  type AdminCentersOptions,
  type AdminEstablishmentsOptions,
  type AdminOpinionsOptions,
  type AdminUsersOptions,
} from "./admin-api";

/**
 * Claves de TanStack Query del panel. Todas comparten el prefijo `["admin"]`
 * y las jerarquías permiten invalidar por prefijo (por ejemplo,
 * `adminKeys.allCatalogs()` invalida los catálogos activos y los completos, y
 * `adminKeys.center(code)` incluye las secciones de esa ficha).
 */
export const adminKeys = {
  all: ["admin"] as const,
  allCatalogs: () => [...adminKeys.all, "catalogs"] as const,
  catalogs: (includeInactive: boolean) =>
    [...adminKeys.allCatalogs(), includeInactive ? "with-inactive" : "active"] as const,
  center: (code: string | null) => [...adminKeys.all, "center", code] as const,
  centerSections: (code: string | null) =>
    [...adminKeys.center(code), "sections"] as const,
  media: (code: string | null) => [...adminKeys.all, "media", code] as const,
  establishmentMedia: (id: number | null) =>
    [...adminKeys.all, "establishment-media", id] as const,
  allEstablishments: () => [...adminKeys.all, "establishments"] as const,
  establishments: (filters: AdminEstablishmentsOptions) =>
    [...adminKeys.allEstablishments(), filters] as const,
  opinionHistory: (reviewCode: string | null) =>
    [...adminKeys.all, "opinion-history", reviewCode] as const,
  summary: () => [...adminKeys.all, "summary"] as const,
  allNavigationSummaries: () => [...adminKeys.all, "navigation-summary"] as const,
  navigationSummary: (userId: number) =>
    [...adminKeys.allNavigationSummaries(), userId] as const,
  allCenters: () => [...adminKeys.all, "centers"] as const,
  centers: (filters: AdminCentersOptions) =>
    [...adminKeys.allCenters(), filters] as const,
  allOpinions: () => [...adminKeys.all, "opinions"] as const,
  opinions: (filters: AdminOpinionsOptions) =>
    [...adminKeys.allOpinions(), filters] as const,
  allUsers: () => [...adminKeys.all, "users"] as const,
  users: (filters: AdminUsersOptions) => [...adminKeys.allUsers(), filters] as const,
  allActivity: () => [...adminKeys.all, "activity"] as const,
  activity: (filters: AdminActivityOptions) =>
    [...adminKeys.allActivity(), filters] as const,
};

export function catalogsQueryOptions(token: string, includeInactive = false) {
  return queryOptions({
    queryKey: adminKeys.catalogs(includeInactive),
    queryFn: ({ signal }) => getAdminCatalogs(token, includeInactive, signal),
    enabled: token.length > 0,
  });
}

export function centerQueryOptions(token: string, code: string | null) {
  return queryOptions({
    queryKey: adminKeys.center(code),
    queryFn: code ? ({ signal }) => getAdminCenter(token, code, signal) : skipToken,
    enabled: token.length > 0,
  });
}

export function centerSectionsQueryOptions(token: string, code: string | null) {
  return queryOptions({
    queryKey: adminKeys.centerSections(code),
    queryFn: code
      ? ({ signal }) => getAdminCenterSections(token, code, signal)
      : skipToken,
    enabled: token.length > 0,
    staleTime: 10_000,
  });
}

export function centerMediaQueryOptions(token: string, code: string | null) {
  return queryOptions({
    queryKey: adminKeys.media(code),
    queryFn: code ? ({ signal }) => getAdminCenterMedia(token, code, signal) : skipToken,
    enabled: token.length > 0,
    staleTime: 5_000,
  });
}

export function establishmentMediaQueryOptions(token: string, id: number | null) {
  return queryOptions({
    queryKey: adminKeys.establishmentMedia(id),
    queryFn: id
      ? ({ signal }) => getAdminEstablishmentMedia(token, id, signal)
      : skipToken,
    enabled: token.length > 0,
    staleTime: 5_000,
  });
}

/** Frescura de los listados y colas de revisión del panel. */
const LIST_STALE_TIME = 10_000;
const listFreshness = {
  staleTime: LIST_STALE_TIME,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export function summaryQueryOptions(token: string) {
  return queryOptions({
    queryKey: adminKeys.summary(),
    queryFn: ({ signal }) => getAdminSummary(token, signal),
    enabled: token.length > 0,
    ...listFreshness,
  });
}

export function navigationSummaryQueryOptions(token: string, userId: number) {
  return queryOptions({
    queryKey: adminKeys.navigationSummary(userId),
    queryFn: ({ signal }) => getAdminNavigationSummary(token, signal),
    enabled: token.length > 0,
    ...listFreshness,
    refetchInterval: 30_000,
  });
}

/**
 * Página de fichas. Los listados paginados conservan la página anterior
 * (`keepPreviousData`) mientras llega la siguiente.
 */
export function centersPageQueryOptions(token: string, filters: AdminCentersOptions) {
  return queryOptions({
    queryKey: adminKeys.centers(filters),
    queryFn: ({ signal }) => getAdminCenters(token, filters, signal),
    enabled: token.length > 0,
    ...listFreshness,
    placeholderData: keepPreviousData,
  });
}

export function establishmentsPageQueryOptions(
  token: string,
  filters: AdminEstablishmentsOptions,
) {
  return queryOptions({
    queryKey: adminKeys.establishments(filters),
    queryFn: ({ signal }) => getAdminEstablishments(token, filters, signal),
    enabled: token.length > 0,
    ...listFreshness,
    placeholderData: keepPreviousData,
  });
}

export function opinionsPageQueryOptions(token: string, filters: AdminOpinionsOptions) {
  return queryOptions({
    queryKey: adminKeys.opinions(filters),
    queryFn: ({ signal }) => getAdminOpinions(token, filters, signal),
    enabled: token.length > 0,
    ...listFreshness,
    placeholderData: keepPreviousData,
  });
}

export function usersPageQueryOptions(token: string, filters: AdminUsersOptions) {
  return queryOptions({
    queryKey: adminKeys.users(filters),
    queryFn: ({ signal }) => getAdminUsers(token, filters, signal),
    enabled: token.length > 0,
    ...listFreshness,
    placeholderData: keepPreviousData,
  });
}

export function activityPageQueryOptions(token: string, filters: AdminActivityOptions) {
  return queryOptions({
    queryKey: adminKeys.activity(filters),
    queryFn: ({ signal }) => getAdminActivity(token, filters, signal),
    enabled: token.length > 0,
    ...listFreshness,
    placeholderData: keepPreviousData,
  });
}

export function opinionHistoryQueryOptions(token: string, reviewCode: string | null) {
  return queryOptions({
    queryKey: adminKeys.opinionHistory(reviewCode),
    queryFn: reviewCode
      ? ({ signal }) => getAdminOpinionHistory(token, reviewCode, signal)
      : skipToken,
    enabled: token.length > 0,
  });
}

/**
 * Alcance de mutación para serializar todos los guardados de una ficha
 * (formulario principal y secciones): TanStack ejecuta en serie las
 * mutaciones con el mismo `scope.id`, lo que evita conflictos de versión (409).
 * Uso: `useMutation({ scope: centerSaveScope(code), ... })`.
 */
export function centerSaveScope(code: string): { id: string } {
  return { id: `center:${code}:save` };
}

/** Versión de la ficha en caché (`adminKeys.center(code)`), para enviar en el guardado. */
export function getCachedCenterVersion(
  queryClient: QueryClient,
  code: string,
): number | undefined {
  return queryClient.getQueryData<AdminCenterDetail>(adminKeys.center(code))?.version;
}
