import type { AdminUser } from "./auth";

export type AdminCenter = {
  code: string;
  name: string;
  status: { code: string; name: string };
  updatedAt: string;
  submittedAt: string | null;
  requestedBy: string | null;
  observation: string | null;
  active: boolean;
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

export const adminCenterSectionCodes = [
  "identificacion",
  "ubicacion-admin",
  "caracteristicas",
  "accesibilidad",
  "planta",
  "conservacion",
  "higiene-seguridad",
  "politicas",
  "actividades",
  "promocion",
  "visitantes",
  "recurso-humano",
  "descripcion",
  "anexos",
] as const;
export type AdminCenterSectionCode = (typeof adminCenterSectionCodes)[number];

export type AdminCenterSections = {
  code: string;
  version: number;
  sections: Partial<Record<AdminCenterSectionCode, Record<string, unknown>>>;
  progress?: Array<{
    code: AdminCenterSectionCode;
    status: "SIN_INICIAR" | "INCOMPLETA" | "COMPLETA" | "CON_ERRORES" | "NO_APLICA";
  }>;
};

export type AdminCenterValuation = {
  configured: boolean;
  total: number | null;
  hierarchyCode: string;
  hierarchyId: number | null;
  criteria: Array<{
    code: string;
    name: string;
    maximum: number;
    score: number | null;
    appliedMaximum: number | null;
  }>;
};

export type AdminCentersOptions = {
  status?: string;
  q?: string;
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

export type AdminOpinionVersion = {
  rating: number | null;
  comment: string | null;
  version: number;
  submittedAt: string;
};

export type AdminOpinion = {
  reviewCode: string;
  status: "PENDIENTE" | "APROBADA";
  version: number;
  submittedAt: string;
  authorName: string;
  target: {
    type: "CENTRO" | "PUNTO_INTERES";
    code: string | null;
    name: string;
  };
  proposed: AdminOpinionVersion;
  current: AdminOpinionVersion | null;
};

export type AdminOpinionPage = {
  items: AdminOpinion[];
  total: number;
  limit: number;
  offset: number;
};

type ApiBody<T> = { data: T; error?: { message?: string } };

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

export const apiUrl =
  process.env.NEXT_PUBLIC_TURISMO_API_URL ?? "http://localhost:3000/api/v1";

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit,
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const body = (await response.json().catch(() => null)) as ApiBody<T> | null;

  if (response.status === 401 && retryAfterRefresh && adminAccessTokenRefresh) {
    const nextToken = await adminAccessTokenRefresh(token).catch(() => null);
    if (nextToken && nextToken !== token) {
      return request(path, nextToken, init, false);
    }
  }

  if (!response.ok) {
    throw new Error(
      body?.error?.message ?? "No se pudo consultar la API administrativa.",
    );
  }
  if (body?.data === undefined) {
    throw new Error("La API administrativa devolvió una respuesta incompleta.");
  }
  return body.data;
}

export async function getAdminCenters(token: string, options: AdminCentersOptions = {}) {
  const params = new URLSearchParams();
  if (options.status && options.status !== "ALL") params.set("status", options.status);
  if (options.q?.trim()) params.set("q", options.q.trim());
  params.set("limit", String(options.limit ?? 25));
  params.set("offset", String(options.offset ?? 0));
  return request<{ items: AdminCenter[]; total: number; limit: number; offset: number }>(
    `/admin/centers?${params.toString()}`,
    token,
    { cache: "no-store" },
  );
}

export async function getAdminSummary(token: string) {
  return request<AdminSummary>("/admin/summary", token, { cache: "no-store" });
}

export async function getAdminOpinions(
  token: string,
  options: { limit?: number; offset?: number } = {},
) {
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? 20));
  params.set("offset", String(options.offset ?? 0));
  return request<AdminOpinionPage>(`/admin/opinions?${params.toString()}`, token, {
    cache: "no-store",
  });
}

export async function reviewAdminOpinion(
  token: string,
  reviewCode: string,
  action: "APPROVE" | "REJECT",
  reason?: string,
) {
  return request<{ reviewCode: string; status: "APROBADA" | "RECHAZADA" }>(
    `/admin/opinions/${encodeURIComponent(reviewCode)}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ action, reason }),
    },
  );
}

export async function getAdminEstablishments(
  token: string,
  options: AdminEstablishmentsOptions = {},
) {
  const params = new URLSearchParams();
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.activity?.trim()) params.set("activity", options.activity.trim());
  if (options.classification?.trim())
    params.set("classification", options.classification.trim());
  if (options.category?.trim()) params.set("category", options.category.trim());
  if (options.provinceId) params.set("provinceId", String(options.provinceId));
  if (options.cantonId) params.set("cantonId", String(options.cantonId));
  if (options.localityId) params.set("localityId", String(options.localityId));
  if (options.active !== undefined) params.set("active", String(options.active));
  params.set("limit", String(options.limit ?? 20));
  params.set("offset", String(options.offset ?? 0));
  return request<{
    items: AdminEstablishment[];
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/establishments?${params.toString()}`, token, { cache: "no-store" });
}

export async function createAdminEstablishment(
  token: string,
  input: SaveEstablishmentInput,
) {
  return request<AdminEstablishment>("/admin/establishments", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function saveAdminEstablishment(
  token: string,
  id: number,
  input: Partial<SaveEstablishmentInput>,
) {
  return request<AdminEstablishment>(`/admin/establishments/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function setAdminEstablishmentActive(
  token: string,
  id: number,
  active: boolean,
) {
  return request<AdminEstablishment>(
    `/admin/establishments/${id}/${active ? "reactivate" : "deactivate"}`,
    token,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function getAdminCatalogs(token: string, includeInactive = false) {
  const query = includeInactive ? "?includeInactive=true" : "";
  return request<AdminCatalogs>(`/admin/catalogs${query}`, token, { cache: "no-store" });
}

export async function updateAdminCatalog(
  token: string,
  catalog: AdminCatalogKey,
  id: number,
  input: {
    name?: string;
    active?: boolean;
    icon?: string;
    color?: string;
  },
) {
  return request<{
    catalog: AdminCatalogKey;
    id: number;
    code: string;
    name: string;
    active: boolean;
    icon?: string;
    color?: string;
  }>(`/admin/catalogs/${catalog}/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getAdminCenter(token: string, code: string) {
  return request<AdminCenterDetail>(`/admin/centers/${encodeURIComponent(code)}`, token, {
    cache: "no-store",
  });
}

export async function getAdminCenterSections(token: string, code: string) {
  return request<AdminCenterSections>(
    `/admin/centers/${encodeURIComponent(code)}/sections`,
    token,
    { cache: "no-store" },
  );
}

export async function getAdminCenterValuation(token: string, code: string) {
  return request<AdminCenterValuation>(
    `/admin/centers/${encodeURIComponent(code)}/valuation`,
    token,
    { cache: "no-store" },
  );
}

export async function saveAdminCenterSection(
  token: string,
  code: string,
  sectionCode: AdminCenterSectionCode,
  content: Record<string, unknown>,
  version?: number,
) {
  return request<AdminCenterDetail>(
    `/admin/centers/${encodeURIComponent(code)}/sections/${sectionCode}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ content, version }),
    },
  );
}

export async function createAdminCenter(token: string, input: SaveCenterInput) {
  return request<AdminCenterDetail>("/admin/centers", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function saveAdminCenter(
  token: string,
  code: string,
  input: SaveCenterInput,
) {
  return request<AdminCenterDetail>(`/admin/centers/${encodeURIComponent(code)}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function submitAdminCenterReview(token: string, code: string) {
  return request<AdminCenterDetail>(
    `/admin/centers/${encodeURIComponent(code)}/submit-review`,
    token,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function reviewAdminCenter(
  token: string,
  code: string,
  action: "APPROVE" | "REJECT",
  observation?: string,
) {
  return request<AdminCenter>(
    `/admin/centers/${encodeURIComponent(code)}/review`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ action, observation }),
    },
  );
}

export async function publishAdminCenter(token: string, code: string) {
  return request<AdminCenterDetail>(
    `/admin/centers/${encodeURIComponent(code)}/publish`,
    token,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function setAdminCenterActive(token: string, code: string, active: boolean) {
  return request<AdminCenterDetail>(
    `/admin/centers/${encodeURIComponent(code)}/${active ? "reactivate" : "deactivate"}`,
    token,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function getAdminCenterAudit(token: string, code: string) {
  return request<{ items: Array<Record<string, unknown>> }>(
    `/admin/centers/${encodeURIComponent(code)}/audit`,
    token,
    { cache: "no-store" },
  );
}

export async function getAdminCenterMedia(token: string, code: string) {
  return request<{ items: AdminMediaItem[] }>(
    `/admin/centers/${encodeURIComponent(code)}/media`,
    token,
    { cache: "no-store" },
  );
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
  const body = new FormData();
  if (metadata.typeCode) body.append("typeCode", metadata.typeCode);
  if (metadata.description?.trim())
    body.append("description", metadata.description.trim());
  if (metadata.sourceAuthor?.trim())
    body.append("sourceAuthor", metadata.sourceAuthor.trim());
  body.append("file", file, file.name);
  return request<AdminMediaItem>(
    `/admin/centers/${encodeURIComponent(code)}/media`,
    token,
    { method: "POST", body },
  );
}

export async function deleteAdminCenterMedia(token: string, code: string, id: number) {
  return request<{ id: number; state: "ELIMINADO" }>(
    `/admin/centers/${encodeURIComponent(code)}/media/${id}`,
    token,
    { method: "DELETE" },
  );
}

export type { AdminUser };
