import { apiEndpoint, sendApiRequest } from "./http";

export type PublishedCenter = {
  code: string;
  name: string;
  category?: string | null;
  province?: string | null;
};

async function get<T>(path: string): Promise<T> {
  const { response, body } = await sendApiRequest<T>(apiEndpoint(path), {
    next: { revalidate: 60 },
  });

  if (!response.ok || body === null) {
    throw new Error(`No se pudo consultar el servicio turístico (${response.status}).`);
  }

  return body.data as T;
}

export async function getPublishedCenters(): Promise<PublishedCenter[]> {
  const result = await get<{ items?: PublishedCenter[] } | PublishedCenter[]>(
    "/centers?limit=6",
  );
  return Array.isArray(result) ? result : (result.items ?? []);
}

export async function getApiHealth(): Promise<boolean> {
  try {
    await get<{ status: "ok" }>("/health");
    return true;
  } catch {
    return false;
  }
}
