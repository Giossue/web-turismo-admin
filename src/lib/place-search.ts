import { apiEndpoint, sendApiRequest, toApiError, toQueryString } from "./http";

export type PlaceResult = {
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

/** Lugares de Ecuador (calles, ciudades y referencias) de la búsqueda pública de la API. */
export async function searchPlaces(query: string, signal?: AbortSignal) {
  const result = await sendApiRequest<{ items?: PlaceResult[] }>(
    apiEndpoint(`/search${toQueryString({ q: query, kind: "geographic" })}`),
    { cache: "no-store", signal },
  );
  if (!result.response.ok) {
    throw toApiError(result, "No se pudo buscar el lugar. Intenta de nuevo.");
  }
  return Array.isArray(result.body?.data?.items) ? result.body.data.items : [];
}
