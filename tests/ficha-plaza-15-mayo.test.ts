import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AdminCatalogs } from "@/lib/admin-api";
import { resolverCatalogosFicha } from "@/lib/ficha/catalogos";
import { mapearFichaAFormulario } from "@/lib/ficha/mapear-formulario";
import {
  contarApartadosImportados,
  mapearSeccionesImportadas,
} from "@/lib/ficha/mapear-secciones";
import { parsearFicha, parsearRango } from "@/lib/ficha/parser";
import { horaDesdeFraccionDia } from "@/lib/ficha/xlsx-utils";

const ARCHIVO = path.join(import.meta.dir, "..", "temp", "Plaza 15 de mayo.xlsm");

async function parsear() {
  const archivo = await readFile(ARCHIVO);
  const buffer = archivo.buffer.slice(
    archivo.byteOffset,
    archivo.byteOffset + archivo.byteLength,
  ) as ArrayBuffer;
  return parsearFicha(buffer, "Plaza 15 de mayo.xlsm");
}

const catalogos = new Proxy(
  {
    climates: [{ id: 3, name: "Templado" }],
    attentionModes: [
      { id: 1, name: "Todos los días" },
      { id: 2, name: "Fines de semana y feriados" },
    ],
    facilityCategories: [{ id: 4, name: "De servicio" }],
    facilities: [
      { id: 40, name: "Baterías sanitarias", categoryId: 4 },
      { id: 41, name: "Estacionamientos", categoryId: 4 },
    ],
    healthServiceTypes: [{ id: 7, name: "Botiquín de primeros auxilios" }],
    responsibilityTypes: [{ id: 1, name: "Elaboró", code: "ELABORO" }],
  } as unknown as Partial<AdminCatalogs>,
  { get: (target, key: string) => target[key as keyof AdminCatalogs] ?? [] },
) as AdminCatalogs;

describe("utilidades de celdas", () => {
  test("parsearRango acepta guion, 'a', raya y 'hasta'", () => {
    expect(parsearRango("10 a 18")).toEqual({ min: 10, max: 18 });
    expect(parsearRango("500 – 1500")).toEqual({ min: 500, max: 1500 });
    expect(parsearRango("14 - 16")).toEqual({ min: 14, max: 16 });
    expect(parsearRango("12,5 hasta 20")).toEqual({ min: 12.5, max: 20 });
    expect(parsearRango("texto")).toEqual({ min: null, max: null });
  });

  test("horaDesdeFraccionDia admite fracción, Date e ISO de exceljs", () => {
    expect(horaDesdeFraccionDia(0.5)).toBe("12:00");
    expect(horaDesdeFraccionDia("1899-12-30T08:30:00.000Z")).toBe("08:30");
    expect(horaDesdeFraccionDia(new Date(Date.UTC(1899, 11, 30, 17, 15)))).toBe("17:15");
    expect(horaDesdeFraccionDia("1899-12-30T00:00:00.000Z")).toBeNull();
  });
});

describe("ficha Plaza 15 de mayo", () => {
  test("lee clima, atención, tiempo y observaciones antes ignoradas", async () => {
    const { datos, imagenesAdjuntas } = await parsear();
    expect(datos.caracteristicas.clima).toMatchObject({
      texto: "Templado",
      temperaturaMinC: 10,
      temperaturaMaxC: 18,
      precipitacionMinMm: 500,
      precipitacionMaxMm: 1500,
    });
    expect(datos.caracteristicas.ingreso.atencion).toBe("TODOS_DIAS");
    expect(datos.accesoConectividad.tiempoAutoHoras).toBe("00:02");
    expect(datos.accesoConectividad.observacionUbicacion).toContain("Parque Central");
    expect(datos.accesoConectividad.observacionAccesibilidad).toContain("rampas");
    expect(datos.planta.observacionAlimentosCiudad).toContain("alimentos y bebidas");
    expect(datos.planta.observacionAgenciasCiudad).toContain("operación turística");
    expect(datos.planta.observacionGuiasCiudad).toContain("guianza");
    expect(datos.anexos.fuenteFotografias).toBe("Municipio de Guaranda");
    expect(datos.anexos.ubicacionGrafica).toStartWith("https://www.google.com/maps/");
    expect(datos.responsables.elaborado.fecha).toBe("2025-12-19");
    for (const foto of imagenesAdjuntas) expect(foto.fuente).toBe("Municipio de Guaranda");
  });

  test("lleva los datos al formulario y a los apartados", async () => {
    const { datos } = await parsear();
    const resueltos = resolverCatalogosFicha(datos, catalogos);
    const formulario = mapearFichaAFormulario(datos, resueltos);
    expect(formulario.admission?.attentionModeId).toBe("1");
    expect(formulario.admission?.observation).toContain(
      "Meses recomendables de visita: Febrero, Marzo y Noviembre",
    );

    const { secciones } = mapearSeccionesImportadas(datos, catalogos, resueltos);
    expect(secciones.caracteristicas).toMatchObject({
      climate: {
        climateId: 3,
        minTemperature: 10,
        maxTemperature: 18,
        minRainfall: 500,
        maxRainfall: 1500,
      },
    });
    expect(String(secciones.accesibilidad?.observation)).toContain("00:02");
    expect(String(secciones.accesibilidad?.observation)).toContain("rampas");
    expect(String(secciones.planta?.observation)).toContain("guianza");

    const facilidades = secciones.planta?.facilitiesDetails as Array<{
      typeId: number;
      quantity: number | null;
      latitude: number | null;
    }>;
    expect(facilidades.filter((f) => f.typeId === 40 || f.typeId === 41)).toEqual([
      expect.objectContaining({ typeId: 40, quantity: null, latitude: -1.58905 }),
      expect.objectContaining({ typeId: 41, quantity: null, latitude: -1.58905 }),
    ]);

    const higiene = secciones["higiene-seguridad"] as {
      hygieneSafety: {
        entries: Array<{ kind: string; typeId: number; scope: string }>;
        contingency: { observation: string };
      };
    };
    expect(higiene.hygieneSafety.entries).toContainEqual(
      expect.objectContaining({ kind: "HEALTH", typeId: 7, scope: "EN_POBLADO_CERCANO" }),
    );
    expect(higiene.hygieneSafety.contingency.observation).toContain("Unidad de Riesgos");

    const anexos = secciones.anexos as {
      observation: string;
      annexes: { responsibles: Array<{ date: string | null }> };
    };
    expect(anexos.observation).toContain("Fuente de las fotografías: Municipio de Guaranda");
    expect(anexos.observation).toContain("https://www.google.com/maps/");
    expect(anexos.annexes.responsibles[0]?.date).toBe("2025-12-19");

    const total = contarApartadosImportados(formulario, secciones);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(14);
  });
});
