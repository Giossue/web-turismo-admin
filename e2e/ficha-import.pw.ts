import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

const endpoint = "/api/admin/ficha/import";
const headers = { Authorization: "Bearer security-test-token" };
test("standalone: rechaza sesiones ausentes, expiradas y cuentas sin rol", async ({
  request,
}) => {
  expect((await request.post(endpoint)).status()).toBe(401);
  expect(
    (
      await request.post(endpoint, {
        headers: { Authorization: "Bearer expired-test-token" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post(endpoint, {
        headers: { Authorization: "Bearer tourist-test-token" },
      })
    ).status(),
  ).toBe(403);
});
test("standalone: el worker importa la plantilla completa sin persistir datos", async ({
  request,
}) => {
  const response = await request.post(endpoint, {
    headers,
    multipart: {
      file: {
        name: "ficha.xlsm",
        mimeType: "application/vnd.ms-excel.sheet.macroEnabled.12",
        buffer: await readFile("public/templates/ficha-mintur-vacia.xlsm"),
      },
    },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body = await response.json();
  expect(body.data.formulario).toBeDefined();
  expect(body.data.fotos).toEqual([]);
});
test("standalone: un archivo comprimido malicioso se rechaza con 422", async ({
  request,
}) => {
  const zip = new JSZip().file("xl/bomba.bin", Buffer.alloc(1024 * 1024, 65));
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const response = await request.post(endpoint, {
    headers,
    multipart: {
      file: {
        name: "bomba.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer,
      },
    },
  });
  expect(response.status()).toBe(422);
  expect((await response.json()).error.message).toContain("límites seguros");
});
