export type PublishedCenter = {
  code: string;
  name: string;
  category?: string | null;
  province?: string | null;
};

type ApiResponse<T> = { data: T };

const apiUrl = process.env.TURISMO_API_URL ?? "http://localhost:3000/api/v1";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar el servicio turístico (${response.status}).`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
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
