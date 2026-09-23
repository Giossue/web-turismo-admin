import { afterEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/admin/ficha/import/route";
import { TAMANO_MAXIMO_BYTES } from "@/lib/ficha/parser";

const URL_IMPORTACION = "http://localhost/api/admin/ficha/import";
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockApi(status: number, body: unknown) {
  const fetchMock = mock(async () => Response.json(body, { status }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function solicitudConArchivo(nombre: string, token = "token-valido") {
  const body = new FormData();
  body.append("file", new File(["contenido"], nombre));
  return new NextRequest(URL_IMPORTACION, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body,
  });
}

async function mensajeDe(response: Response) {
  const body = (await response.json()) as { error?: { message?: string } };
  return body.error?.message;
}

describe("POST /api/admin/ficha/import", () => {
  test("sin token responde 401 sin consultar la API", async () => {
    const fetchMock = mockApi(200, { data: {} });
    const response = await POST(new NextRequest(URL_IMPORTACION, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rechaza un Content-Length excesivo antes de validar la sesión", async () => {
    const fetchMock = mockApi(200, { data: {} });
    const response = await POST(
      new NextRequest(URL_IMPORTACION, {
        method: "POST",
        headers: {
          authorization: "Bearer token-valido",
          "content-length": String(TAMANO_MAXIMO_BYTES * 2),
        },
      }),
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("propaga el 401 de la API sin leer el archivo", async () => {
    mockApi(401, { error: { message: "La sesión expiró." } });
    const request = solicitudConArchivo("ficha.xlsx", "token-vencido");
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await mensajeDe(response)).toBe("La sesión expiró.");
    expect(request.bodyUsed).toBe(false);
  });

  test("propaga el 403 de una cuenta sin rol administrativo", async () => {
    mockApi(403, { error: { message: "No tienes permisos." } });
    const response = await POST(solicitudConArchivo("ficha.xlsx"));
    expect(response.status).toBe(403);
  });

  test("valida la extensión antes de abrir el libro", async () => {
    mockApi(200, { data: {} });
    const response = await POST(solicitudConArchivo("ficha.pdf"));
    expect(response.status).toBe(422);
    expect(await mensajeDe(response)).toContain("Solo se aceptan archivos .xlsx o .xlsm");
  });

  test("corta un cuerpo sin Content-Length que supera el límite", async () => {
    mockApi(200, { data: {} });
    const chunk = new Uint8Array(1024 * 1024);
    let enviados = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (enviados > TAMANO_MAXIMO_BYTES + 2 * chunk.byteLength) {
          controller.close();
          return;
        }
        enviados += chunk.byteLength;
        controller.enqueue(chunk);
      },
    });
    const response = await POST(
      new NextRequest(URL_IMPORTACION, {
        method: "POST",
        headers: {
          authorization: "Bearer token-valido",
          "content-type": "multipart/form-data; boundary=x",
        },
        body: stream,
        duplex: "half",
      }),
    );
    expect(response.status).toBe(413);
    expect(enviados).toBeLessThan(TAMANO_MAXIMO_BYTES + 3 * chunk.byteLength);
  });
});
