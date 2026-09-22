import { getApiUrl } from "./config";

/** Sobre JSON que devuelve la API NestJS (y las rutas internas de este portal). */
type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

type ApiResult<T> = { response: Response; body: ApiEnvelope<T> | null };

/** Error de una respuesta HTTP no exitosa; conserva el estado (por ejemplo 409). */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;

/**
 * Serializa parámetros de consulta en orden de declaración. Omite valores
 * `null`/`undefined`, textos vacíos (se recortan) y números no finitos.
 * Devuelve la cadena con `?` inicial, o `""` si no queda ningún parámetro.
 */
export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    const text = typeof value === "string" ? value.trim() : String(value);
    if (!text) continue;
    search.set(key, text);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** URL absoluta de un recurso de la API para el entorno actual. */
export function apiEndpoint(path: string): string {
  return `${getApiUrl()}${path}`;
}

function networkErrorMessage(): string {
  const variable =
    typeof window === "undefined" ? "TURISMO_API_URL" : "NEXT_PUBLIC_TURISMO_API_URL";
  return `No se pudo conectar con la API institucional. Verifica que el servicio esté iniciado y que ${variable} sea correcto.`;
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === "AbortError";
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const body = init.body;
  if (body === null || body === undefined) {
    // Sin cuerpo no se declara Content-Type: en un GET provocaría un preflight CORS.
    headers.delete("Content-Type");
  } else if (
    !(typeof FormData !== "undefined" && body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

/**
 * Ejecuta `fetch` con los encabezados comunes y lee el sobre JSON. Los fallos
 * de red se traducen a un mensaje en español en lugar de "Failed to fetch".
 * No interpreta el estado HTTP: cada cliente decide cómo tratarlo.
 */
export async function sendApiRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: buildHeaders(init) });
  } catch (cause) {
    if (isAbortError(cause)) throw cause;
    throw new Error(networkErrorMessage());
  }
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return { response, body };
}

/** Error para una respuesta no exitosa, con el mensaje de la API o el de respaldo. */
export function toApiError(result: ApiResult<unknown>, fallback: string): ApiError {
  return new ApiError(result.body?.error?.message ?? fallback, result.response.status);
}
