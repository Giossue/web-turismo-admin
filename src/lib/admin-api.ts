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
  typeCode: "FOTOGRAFIA" | "VIDEO" | "AUDIO";
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
  groupId?: number;
};
export type AdminCatalogKey = "ACCESSIBILITY" | "ACTIVITY" | "FACILITY";
export type AdminCatalogs = {
  categories: CatalogOption[];
  types: CatalogOption[];
  subtypes: CatalogOption[];
  provinces: CatalogOption[];
  cantons: CatalogOption[];
  parishes: CatalogOption[];
  zones: CatalogOption[];
  lines: CatalogOption[];
  scenarios: CatalogOption[];
  hierarchies: CatalogOption[];
  climates: CatalogOption[];
  incomeTypes: CatalogOption[];
  attentionModes: CatalogOption[];
  accessibilityTypes: CatalogOption[];
  activityGroups: CatalogOption[];
  activities: CatalogOption[];
  facilityCategories: CatalogOption[];
  facilities: CatalogOption[];
};

export type SaveCenterInput = Partial<CenterDraft> & { version?: number };

export type AdminCentersOptions = {
  status?: string;
  q?: string;
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

type ApiBody<T> = { data: T; error?: { message?: string } };

export const apiUrl =
  process.env.NEXT_PUBLIC_TURISMO_API_URL ?? "http://localhost:3000/api/v1";

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
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
  const body = (await response.json()) as ApiBody<T>;
  if (!response.ok) {
    throw new Error(body.error?.message ?? "No se pudo consultar la API administrativa.");
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

export async function getAdminCatalogs(token: string, includeInactive = false) {
  const query = includeInactive ? "?includeInactive=true" : "";
  return request<AdminCatalogs>(`/admin/catalogs${query}`, token, { cache: "no-store" });
}

export async function updateAdminCatalog(
  token: string,
  catalog: AdminCatalogKey,
  id: number,
  input: { name?: string; active?: boolean },
) {
  return request<{
    catalog: AdminCatalogKey;
    id: number;
    code: string;
    name: string;
    active: boolean;
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
  metadata: { description?: string; sourceAuthor?: string } = {},
) {
  const body = new FormData();
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
