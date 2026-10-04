import type { CenterSectionCode, SectionProgress } from "./center-sections/definitions";
import type { mapearFichaAFormulario } from "./ficha/mapear-formulario";
import type { SugerenciasSecciones } from "./ficha/sugerencias-secciones";
import { errorMessage } from "./errors";
import { ApiError, apiEndpoint, sendApiRequest, toApiError, toQueryString } from "./http";

/** Página de resultados de un listado administrativo. */
export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
};

export type AdminUsersOptions = { q?: string; limit?: number; offset?: number };

export const notificationSections = [
  "review",
  "opinions",
  "centers",
  "establishments",
  "catalogs",
] as const;

export type NotificationSection = (typeof notificationSections)[number];
export type AdminNavigationSummary = Record<
  NotificationSection,
  { pending: number; latestChange: string | null }
>;

export type EditorialAssistance = {
  suggestion: string | null;
  observations: string[];
  requiresReview: true;
};

export function assistCenterDescription(
  token: string,
  code: string,
  input: { description: string; mode: "rewrite" | "review" },
): Promise<EditorialAssistance> {
  return post<EditorialAssistance>(
    `/admin/ai/centers/${encodeURIComponent(code)}/description`,
    token,
    input,
  );
}

/** Acción de revisión para fichas, catastros y opiniones. */
export type ReviewAction = "APPROVE" | "REJECT";

export type CenterStatus = "BORRADOR" | "EN_REVISION" | "PUBLICADO";

export type EstablishmentReviewStatus =
  "BORRADOR" | "EN_REVISION" | "PUBLICADO" | "RECHAZADO";

export type OpinionStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "REEMPLAZADA";

export type OpinionTargetType = "CENTRO" | "PUNTO_INTERES";

export type AdminCenter = {
  code: string;
  name: string;
  status: { code: string; name: string };
  updatedAt: string;
  submittedAt: string | null;
  requestedBy: string | null;
  observation: string | null;
  active: boolean;
  responsibleId?: number | null;
  baseStatus?: string;
  hasDraft?: boolean;
};

export type CenterDraft = {
  name: string;
  subtypeId: number;
  touristZoneId: number;
  parishId: number;
  productLineId: number;
  scenarioId: number;
  hierarchyId: number;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  description?: string;
  address?: {
    barrio?: string;
    street?: string;
    number?: string;
    crossStreet?: string;
  };
  administration?: {
    type: string;
    institution?: string;
    name: string;
    position?: string;
    phone?: string;
    email?: string;
    observation?: string;
  };
  climate?: {
    climateId: number;
    minTemperature?: number;
    maxTemperature?: number;
    minRainfall?: number;
    maxRainfall?: number;
    observation?: string;
  };
  admission?: {
    incomeTypeId: number;
    attentionModeId: number;
    opensAt?: string;
    closesAt?: string;
    otherAttention?: string;
    reservations?: boolean;
    priceFrom?: number;
    priceTo?: number;
    observation?: string;
  };
  activities?: Array<{
    activityId: number;
    active: boolean;
    detailOther?: string;
    observation?: string;
  }>;
  accessibility?: Array<{
    typeId: number;
    applies: boolean;
    observation?: string;
  }>;
  facilities?: Array<{
    typeId: number;
    quantity?: number;
    detailOther?: string;
    observation?: string;
  }>;
  sections?: Record<string, unknown>;
};

export type AdminCenterDetail = {
  code: string;
  status: { code: string; name: string };
  baseStatus: { code: string; name: string };
  active: boolean;
  publishedAt: string | null;
  version: number;
  published: CenterDraft;
  draft: CenterDraft | null;
  retainedCatalogOptions?: Partial<
    Pick<
      AdminCatalogs,
      "activities" | "accessibilityTypes" | "accessibilityCriteria" | "facilities"
    >
  >;
  review: {
    status: { code: string; name: string };
    observation: string | null;
    requestedAt: string;
    reviewedAt: string | null;
  } | null;
};

export type AdminMediaItem = {
  id: number;
  name: string;
  typeCode: "FOTOGRAFIA" | "VIDEO" | "AUDIO" | "MAPA" | "PLAN_CONTINGENCIA" | "OTRO";
  typeName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number | null;
  description: string | null;
  sourceAuthor: string | null;
  order: number | null;
  state: "PENDIENTE" | "PUBLICADO" | "ELIMINADO";
  createdAt: string;
  downloadUrl: string | null;
};

/** Fotografía de un establecimiento del catastro. */
export type AdminEstablishmentMediaItem = Omit<
  AdminMediaItem,
  "name" | "typeCode" | "typeName"
>;

export type CatalogOption = {
  id: number;
  code?: string;
  name: string;
  active?: boolean;
  categoryId?: number;
  typeId?: number;
  provinceId?: number;
  cantonId?: number;
  localityId?: number;
  activityId?: number;
  classificationId?: number;
  activityName?: string;
  classificationName?: string;
  groupId?: number;
  group?: string;
  origin?: string;
  order?: number;
  unit1?: string;
  unit2?: string;
  unit3?: string;
  icon?: string;
  color?: string;
  displayName?: string;
  scheme?: string;
  numericValue?: number | null;
  requiresReview?: boolean;
};
export type AdminCatalogKey =
  | "ACCESSIBILITY"
  | "ACTIVITY"
  | "FACILITY"
  | "ESTABLISHMENT_CLASSIFICATION"
  | "ESTABLISHMENT_CATEGORY";
export type AdminCatalogs = {
  establishmentActivities: CatalogOption[];
  establishmentClassifications: CatalogOption[];
  establishmentCategories: CatalogOption[];
  categories: CatalogOption[];
  types: CatalogOption[];
  subtypes: CatalogOption[];
  provinces: CatalogOption[];
  cantons: CatalogOption[];
  parishes: CatalogOption[];
  localities: CatalogOption[];
  zones: CatalogOption[];
  lines: CatalogOption[];
  scenarios: CatalogOption[];
  hierarchies: CatalogOption[];
  climates: CatalogOption[];
  incomeTypes: CatalogOption[];
  attentionModes: CatalogOption[];
  accessibilityTypes: CatalogOption[];
  accessibilityCriteria: CatalogOption[];
  conditionStates: CatalogOption[];
  roadTypes: CatalogOption[];
  roadMaterials: CatalogOption[];
  aquaticAccessModes: CatalogOption[];
  aerialAccessCoverages: CatalogOption[];
  transportTypes: CatalogOption[];
  serviceFrequencies: CatalogOption[];
  serviceScopes: CatalogOption[];
  conservationStates: CatalogOption[];
  conservationFactors: CatalogOption[];
  basicServiceCategories: CatalogOption[];
  basicServiceTypes: CatalogOption[];
  signageTypes: CatalogOption[];
  signageMaterials: CatalogOption[];
  healthServiceTypes: CatalogOption[];
  securityServiceTypes: CatalogOption[];
  communicationTypes: CatalogOption[];
  threatTypes: CatalogOption[];
  policyQuestions: CatalogOption[];
  promotionMediaTypes: CatalogOption[];
  trainingTypes: CatalogOption[];
  responsibilityTypes: CatalogOption[];
  months: CatalogOption[];
  plantTypes: CatalogOption[];
  complementaryServiceTypes: CatalogOption[];
  activityGroups: CatalogOption[];
  activities: CatalogOption[];
  facilityCategories: CatalogOption[];
  facilities: CatalogOption[];
};

export type SaveCenterInput = Partial<CenterDraft> & { version?: number };

export type AdminCenterSections = {
  code: string;
  version: number;
  sections: Partial<Record<CenterSectionCode, Record<string, unknown>>>;
  progress?: Array<{ code: CenterSectionCode; status: SectionProgress }>;
};

export type AdminCentersOptions = {
  status?: string;
  q?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
};

export type AdminEstablishment = {
  id: number;
  localityId: number;
  localityName: string;
  localityType: string;
  cantonName: string;
  provinceName: string;
  numeroRegistro: string | null;
  ruc: string | null;
  nombreComercial: string;
  razonSocial: string | null;
  actividad: string;
  activityId: number | null;
  clasificacion: string | null;
  classificationId: number | null;
  categoria: string | null;
  categoriaEtiqueta: string | null;
  esquemaCategoria: string | null;
  valorCategoria: number | null;
  categoriaRequiereRevision: boolean;
  categoryId: number | null;
  direccion: string | null;
  telefono: string | null;
  latitude: number;
  longitude: number;
  active: boolean;
  reviewStatus: EstablishmentReviewStatus;
  reviewObservation: string | null;
  requestedAt: string | null;
  requestedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveEstablishmentInput = {
  localityId: number;
  numeroRegistro?: string;
  ruc?: string;
  nombreComercial: string;
  razonSocial?: string;
  activityId?: number;
  classificationId?: number;
  categoryId?: number;
  actividad: string;
  clasificacion?: string;
  categoria?: string;
  direccion?: string;
  telefono?: string;
  latitude: number;
  longitude: number;
};

export type AdminEstablishmentsOptions = {
  q?: string;
  activity?: string;
  classification?: string;
  category?: string;
  provinceId?: number;
  cantonId?: number;
  localityId?: number;
  active?: boolean;
  reviewStatus?: EstablishmentReviewStatus;
  limit?: number;
  offset?: number;
};

export type AdminSummary = {
  total: number;
  active: number;
  pendingReview: number;
  published: number;
  inactive: number;
  byStatus: Array<{
    code: string;
    name: string;
    total: number;
    active: number;
  }>;
};

type AdminOpinionVersion = {
  rating: number | null;
  comment: string | null;
  version: number;
  submittedAt: string;
};

export type AdminOpinion = {
  reviewCode: string;
  status: Extract<OpinionStatus, "PENDIENTE" | "APROBADA">;
  version: number;
  submittedAt: string;
  authorName: string;
  target: {
    type: OpinionTargetType;
    code: string | null;
    name: string;
  };
  proposed: AdminOpinionVersion;
  current: AdminOpinionVersion | null;
};

export type AdminOpinionHistory = {
  reviewCode: string;
  deletedAt: string | null;
  authorName: string;
  target: AdminOpinion["target"];
  versions: Array<{
    reviewCode: string;
    version: number;
    rating: number | null;
    comment: string | null;
    status: OpinionStatus;
    submittedAt: string;
    reviewedAt: string | null;
    moderations: Array<{
      action: "APROBAR" | "RECHAZAR" | "ELIMINAR";
      moderatorName: string;
      reason: string | null;
      createdAt: string;
    }>;
  }>;
};

export type CatalogMutationResult = {
  catalog: AdminCatalogKey;
  id: number;
  code: string;
  name: string;
  active: boolean;
  icon?: string;
  color?: string;
};

/** Resultado de `/api/admin/ficha/import` (ruta interna de este portal). */
type FichaImportResult = {
  formulario: ReturnType<typeof mapearFichaAFormulario>;
  sugerenciasSecciones: SugerenciasSecciones;
  advertencias: string[];
};

type AdminAccessTokenRefresh = (expiredToken: string) => Promise<string | null>;

let adminAccessTokenRefresh: AdminAccessTokenRefresh | null = null;

export function registerAdminAccessTokenRefresh(
  refresh: AdminAccessTokenRefresh,
): () => void {
  adminAccessTokenRefresh = refresh;
  return () => {
    if (adminAccessTokenRefresh === refresh) {
      adminAccessTokenRefresh = null;
    }
  };
}

const ADMIN_API_FALLBACK_MESSAGE = "No se pudo consultar la API administrativa.";
const FICHA_IMPORT_URL = "/api/admin/ficha/import";

/**
 * Solicitud autenticada con el access token en memoria. Ante un 401 pide un
 * token nuevo al proveedor de sesión y reintenta una sola vez.
 */
async function authorizedRequest<T>(
  url: string,
  token: string,
  init: RequestInit,
  fallbackMessage = ADMIN_API_FALLBACK_MESSAGE,
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const result = await sendApiRequest<T>(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (result.response.status === 401 && retryAfterRefresh && adminAccessTokenRefresh) {
    const nextToken = await adminAccessTokenRefresh(token).catch(() => null);
    if (nextToken && nextToken !== token) {
      return authorizedRequest(url, nextToken, init, fallbackMessage, false);
    }
  }

  if (!result.response.ok) {
    throw toApiError(result, fallbackMessage);
  }
  if (result.body?.data === undefined) {
    throw new ApiError(
      "La API administrativa devolvió una respuesta incompleta.",
      result.response.status,
    );
  }
  return result.body.data;
}

function toRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  return JSON.stringify(body);
}

function get<T>(path: string, token: string): Promise<T> {
  return authorizedRequest<T>(apiEndpoint(path), token, { cache: "no-store" });
}

function post<T>(path: string, token: string, body: unknown = {}): Promise<T> {
  return authorizedRequest<T>(apiEndpoint(path), token, {
    method: "POST",
    body: toRequestBody(body),
  });
}

function patch<T>(path: string, token: string, body: unknown): Promise<T> {
  return authorizedRequest<T>(apiEndpoint(path), token, {
    method: "PATCH",
    body: toRequestBody(body),
  });
}

function del<T>(path: string, token: string): Promise<T> {
  return authorizedRequest<T>(apiEndpoint(path), token, { method: "DELETE" });
}

function centerPath(code: string, suffix?: string): string {
  const base = `/admin/centers/${encodeURIComponent(code)}`;
  return suffix ? `${base}/${suffix}` : base;
}

export function deleteAdminCenter(token: string, code: string) {
  return del<{ deleted: true }>(centerPath(code), token);
}

export function deleteAdminEstablishment(token: string, id: number) {
  return del<{ deleted: true }>(`/admin/establishments/${id}`, token);
}

export function deleteAdminOpinion(token: string, reviewCode: string) {
  return del<{ deleted: true }>(
    `/admin/opinions/${encodeURIComponent(reviewCode)}`,
    token,
  );
}

export function deleteAdminCatalog(token: string, catalog: AdminCatalogKey, id: number) {
  return del<{ deleted: true }>(`/admin/catalogs/${catalog}/${id}`, token);
}

export async function getAdminCenters(token: string, options: AdminCentersOptions = {}) {
  const query = toQueryString({
    status: options.status === "ALL" ? undefined : options.status,
    q: options.q,
    active: options.active,
    limit: options.limit ?? 25,
    offset: options.offset ?? 0,
  });
  return get<Page<AdminCenter>>(`/admin/centers${query}`, token);
}

export async function getAdminUsers(token: string, options: AdminUsersOptions = {}) {
  const query = toQueryString({
    q: options.q,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
  return get<Page<AdminAccount>>(`/admin/users${query}`, token);
}

export async function getAdminSummary(token: string) {
  return get<AdminSummary>("/admin/summary", token);
}

export function getAdminNavigationSummary(token: string) {
  return get<AdminNavigationSummary>("/admin/navigation-summary", token);
}

export type AdminOpinionsOptions = {
  q?: string;
  status?: AdminOpinion["status"];
  targetType?: OpinionTargetType;
  rating?: number;
  limit?: number;
  offset?: number;
};

export async function getAdminOpinions(
  token: string,
  options: AdminOpinionsOptions = {},
) {
  const query = toQueryString({
    q: options.q,
    status: options.status,
    targetType: options.targetType,
    rating: options.rating,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
  return get<Page<AdminOpinion>>(`/admin/opinions${query}`, token);
}

export async function getAdminOpinionHistory(token: string, reviewCode: string) {
  return get<AdminOpinionHistory>(
    `/admin/opinions/${encodeURIComponent(reviewCode)}/history`,
    token,
  );
}

export async function reviewAdminOpinion(
  token: string,
  reviewCode: string,
  action: ReviewAction,
  reason?: string,
) {
  return patch<{
    reviewCode: string;
    status: Extract<OpinionStatus, "APROBADA" | "RECHAZADA">;
  }>(`/admin/opinions/${encodeURIComponent(reviewCode)}`, token, { action, reason });
}

export async function getAdminEstablishments(
  token: string,
  options: AdminEstablishmentsOptions = {},
) {
  const query = toQueryString({
    q: options.q,
    activity: options.activity,
    classification: options.classification,
    category: options.category,
    provinceId: options.provinceId || undefined,
    cantonId: options.cantonId || undefined,
    localityId: options.localityId || undefined,
    active: options.active,
    reviewStatus: options.reviewStatus,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
  return get<Page<AdminEstablishment>>(`/admin/establishments${query}`, token);
}

export async function submitAdminEstablishmentReview(token: string, id: number) {
  return post<AdminEstablishment>(`/admin/establishments/${id}/submit-review`, token);
}

export async function reviewAdminEstablishment(
  token: string,
  id: number,
  action: ReviewAction,
  observation?: string,
) {
  return patch<AdminEstablishment>(`/admin/establishments/${id}/review`, token, {
    action,
    observation,
  });
}

export async function createAdminEstablishment(
  token: string,
  input: SaveEstablishmentInput,
) {
  return post<AdminEstablishment>("/admin/establishments", token, input);
}

export async function saveAdminEstablishment(
  token: string,
  id: number,
  input: Partial<SaveEstablishmentInput>,
  active?: boolean,
) {
  const saved = await patch<AdminEstablishment>(
    `/admin/establishments/${id}`,
    token,
    input,
  );
  if (active === undefined || saved.active === active) return saved;

  try {
    return await setAdminEstablishmentActive(token, id, active);
  } catch (cause) {
    throw new Error(
      `Los datos del establecimiento se guardaron, pero no se pudo cambiar el estado. ${errorMessage(cause, "Intenta guardar de nuevo.")}`,
      { cause },
    );
  }
}

export async function setAdminEstablishmentActive(
  token: string,
  id: number,
  active: boolean,
) {
  return post<AdminEstablishment>(
    `/admin/establishments/${id}/${active ? "reactivate" : "deactivate"}`,
    token,
  );
}

export async function getAdminCatalogs(token: string, includeInactive = false) {
  const query = toQueryString({ includeInactive: includeInactive || undefined });
  return get<AdminCatalogs>(`/admin/catalogs${query}`, token);
}

export async function updateAdminCatalog(
  token: string,
  catalog: AdminCatalogKey,
  id: number,
  input: {
    name?: string;
    active?: boolean;
    icon?: string;
  },
) {
  return patch<CatalogMutationResult>(`/admin/catalogs/${catalog}/${id}`, token, input);
}

export async function createAdminCatalog(
  token: string,
  catalog: AdminCatalogKey,
  input: {
    name: string;
    active?: boolean;
    icon?: string;
    parentId?: number;
    scheme?: string;
    numericValue?: number;
  },
) {
  return post<CatalogMutationResult>(`/admin/catalogs/${catalog}`, token, input);
}

export async function getAdminCenter(token: string, code: string) {
  return get<AdminCenterDetail>(centerPath(code), token);
}

export async function getAdminCenterSections(token: string, code: string) {
  return get<AdminCenterSections>(centerPath(code, "sections"), token);
}

export async function saveAdminCenterSection(
  token: string,
  code: string,
  sectionCode: CenterSectionCode,
  content: Record<string, unknown>,
  version?: number,
) {
  return patch<AdminCenterDetail>(centerPath(code, `sections/${sectionCode}`), token, {
    content,
    version,
  });
}

export async function createAdminCenter(token: string, input: SaveCenterInput) {
  return post<AdminCenterDetail>("/admin/centers", token, input);
}

export async function saveAdminCenter(
  token: string,
  code: string,
  input: SaveCenterInput,
) {
  return patch<AdminCenterDetail>(centerPath(code), token, input);
}

export async function submitAdminCenterReview(token: string, code: string) {
  return post<AdminCenterDetail>(centerPath(code, "submit-review"), token);
}

export async function reviewAdminCenter(
  token: string,
  code: string,
  action: ReviewAction,
  observation?: string,
) {
  return patch<AdminCenter>(centerPath(code, "review"), token, { action, observation });
}

export async function getAdminCenterMedia(token: string, code: string) {
  return get<{ items: AdminMediaItem[] }>(centerPath(code, "media"), token);
}

export async function uploadAdminCenterMedia(
  token: string,
  code: string,
  file: File,
  metadata: {
    typeCode?: AdminMediaItem["typeCode"];
    description?: string;
    sourceAuthor?: string;
  } = {},
) {
  return post<AdminMediaItem>(
    centerPath(code, "media"),
    token,
    mediaFormData(file, metadata),
  );
}

export async function deleteAdminCenterMedia(token: string, code: string, id: number) {
  return del<{ id: number; state: "ELIMINADO" }>(centerPath(code, `media/${id}`), token);
}

function mediaFormData(
  file: File,
  metadata: { typeCode?: string; description?: string; sourceAuthor?: string },
) {
  const body = new FormData();
  if (metadata.typeCode) body.append("typeCode", metadata.typeCode);
  if (metadata.description?.trim())
    body.append("description", metadata.description.trim());
  if (metadata.sourceAuthor?.trim())
    body.append("sourceAuthor", metadata.sourceAuthor.trim());
  body.append("file", file, file.name);
  return body;
}

export async function getAdminEstablishmentMedia(token: string, id: number) {
  return get<{ items: AdminEstablishmentMediaItem[] }>(
    `/admin/establishments/${id}/media`,
    token,
  );
}

export async function uploadAdminEstablishmentMedia(
  token: string,
  id: number,
  file: File,
  metadata: { description?: string; sourceAuthor?: string } = {},
) {
  return post<AdminEstablishmentMediaItem>(
    `/admin/establishments/${id}/media`,
    token,
    mediaFormData(file, metadata),
  );
}

export async function deleteAdminEstablishmentMedia(
  token: string,
  id: number,
  mediaId: number,
) {
  return del<{ id: number; state: "ELIMINADO" }>(
    `/admin/establishments/${id}/media/${mediaId}`,
    token,
  );
}

/**
 * Sube una ficha MINTUR (.xlsx/.xlsm) a la ruta interna del portal para
 * precargar el formulario. Usa la misma sesión y renovación de token que el
 * resto del panel. Solo debe llamarse desde el navegador.
 */
export async function importFichaFile(token: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return authorizedRequest<FichaImportResult>(
    FICHA_IMPORT_URL,
    token,
    { method: "POST", body },
    "No se pudo importar la ficha.",
  );
}
