import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AdminCatalogs } from "@/lib/admin-api";
import type { CatalogosResueltos } from "@/lib/ficha/catalogos";
import { mapearSeccionesImportadas } from "@/lib/ficha/mapear-secciones";
import { parsearFicha } from "@/lib/ficha/parser";

const FIXTURE = path.join(import.meta.dir, "fixtures", "santuario-del-guayco.xlsm");

async function datosFixture() {
  const archivo = await readFile(FIXTURE);
  const buffer = archivo.buffer.slice(
    archivo.byteOffset,
    archivo.byteOffset + archivo.byteLength,
  ) as ArrayBuffer;
  return (await parsearFicha(buffer, "santuario-del-guayco.xlsm")).datos;
}

const catalogos = new Proxy(
  {
    promotionMediaTypes: [{ id: 41, name: "Página WEB" }],
    trainingTypes: [{ id: 51, name: "Primaria", group: "EDUCACION" }],
  } as Partial<AdminCatalogs>,
  { get: (target, key: string) => target[key as keyof AdminCatalogs] ?? [] },
) as AdminCatalogs;

const resueltos = { localidadId: { id: 9, advertencia: null } } as CatalogosResueltos;

describe("mapearSeccionesImportadas", () => {
  test("genera los nueve apartados que la importación antes dejaba vacíos", async () => {
    const { secciones } = mapearSeccionesImportadas(
      await datosFixture(),
      catalogos,
      resueltos,
    );
    expect(Object.keys(secciones).sort()).toEqual(
      [
        "accesibilidad",
        "anexos",
        "conservacion",
        "higiene-seguridad",
        "planta",
        "politicas",
        "promocion",
        "recurso-humano",
        "visitantes",
      ].sort(),
    );
    for (const contenido of Object.values(secciones)) {
      expect(contenido).toMatchObject({ schemaVersion: 1, response: "SI", rows: [] });
    }
  });

  test("usa la localidad resuelta y conserva las políticas en el orden de la ficha", async () => {
    const { secciones } = mapearSeccionesImportadas(
      await datosFixture(),
      catalogos,
      resueltos,
    );
    expect(secciones.accesibilidad).toMatchObject({ localityId: 9 });
    const politicas = secciones.politicas?.policies as Array<{ code: string }>;
    expect(politicas.map((politica) => politica.code)).toEqual([
      "PLAN_DESARROLLO_GAD",
      "PLANIFICACION_TERRITORIAL",
      "REGULACIONES_APLICABLES",
      "ORDENANZAS_APLICABLES",
    ]);
  });

  test("descarta con aviso lo que publicar exige catalogado", async () => {
    const { secciones, advertencias } = mapearSeccionesImportadas(
      await datosFixture(),
      catalogos,
      resueltos,
    );
    const planta = secciones.planta?.plant as Array<{ typeId: number | null }>;
    expect(planta.every((registro) => registro.typeId !== null)).toBe(true);
    expect(advertencias.some((aviso) => aviso.startsWith("Planta turística:"))).toBe(
      true,
    );
  });
});
