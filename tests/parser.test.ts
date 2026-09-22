import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { FichaInvalidaError, parsearFicha } from "@/lib/ficha/parser";

const RUTA_FIXTURE = path.join(import.meta.dir, "fixtures", "santuario-del-guayco.xlsm");

async function parsearFixture() {
  const buffer = await readFile(RUTA_FIXTURE);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  return parsearFicha(arrayBuffer, "santuario-del-guayco.xlsm");
}

describe("parsearFicha — casos de la sección 8 del plan", () => {
  test("nombre y código del atractivo", async () => {
    const { datos } = await parsearFixture();
    expect(datos.identificacion.nombre).toBe("Santuario del Guayco");
    expect(datos.identificacion.codigoAtractivo).toBe("020353MC010102001");
  });

  test("latitud, longitud y altitud", async () => {
    const { datos } = await parsearFixture();
    expect(datos.ubicacion.latitud.valor).toBeCloseTo(-1.67041, 5);
    expect(datos.ubicacion.longitud.valor).toBeCloseTo(-79.06123, 5);
    expect(datos.ubicacion.altitudMsnm).toBe(2138);
  });

  test("5 filas de cooperativas de transporte", async () => {
    const { datos } = await parsearFixture();
    expect(datos.accesoConectividad.transporteDetalle).toHaveLength(5);
    expect(datos.accesoConectividad.transporteDetalle[0].nombre).toBe(
      "Cooperativa de camionetas Benalcázar",
    );
  });

  test("total informativo de RESUMEN DE RESULTADOS", async () => {
    const { datos, advertencias } = await parsearFixture();
    expect(datos.resumenValoracion.totalInformativo).toBe(56.2);
    expect(datos.resumenValoracion.criterios).toHaveLength(9);
    expect(advertencias.some((a) => a.includes("56.2"))).toBe(true);
  });

  test("ficha_Accesibilidad: primera fila SI, segunda NO", async () => {
    const { datos } = await parsearFixture();
    const estacionamiento = datos.accesibilidadDetalle.find(
      (i) => i.criterio === "Estacionamiento",
    );
    const estacionamientoDiscapacidad = datos.accesibilidadDetalle.find(
      (i) => i.criterio === "Estacionamiento vehicular para personas con discapacidad",
    );
    expect(estacionamiento?.respuesta).toBe("SI");
    expect(estacionamiento?.grupo).toBe("General");
    expect(estacionamientoDiscapacidad?.respuesta).toBe("NO");
  });
});

describe("parsearFicha — validación de plantilla y formato", () => {
  test("rechaza .xls con mensaje de guardar como .xlsx", async () => {
    const buffer = new ArrayBuffer(10);
    await expect(parsearFicha(buffer, "ficha.xls")).rejects.toThrow(FichaInvalidaError);
    await expect(parsearFicha(buffer, "ficha.xls")).rejects.toThrow(/\.xlsx/);
  });

  test("rechaza .ods", async () => {
    const buffer = new ArrayBuffer(10);
    await expect(parsearFicha(buffer, "ficha.ods")).rejects.toThrow(/\.xlsx/);
  });

  test("rechaza otros formatos no soportados", async () => {
    const buffer = new ArrayBuffer(10);
    await expect(parsearFicha(buffer, "ficha.pdf")).rejects.toThrow(FichaInvalidaError);
  });

  test("rechaza un archivo vacío/corrupto", async () => {
    const buffer = new ArrayBuffer(0);
    await expect(parsearFicha(buffer, "vacio.xlsx")).rejects.toThrow(FichaInvalidaError);
  });

  test("rechaza un .xlsx que no es la ficha MINTUR", async () => {
    // Un libro válido de exceljs pero sin la hoja Ficha_Jerarquia.
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Hoja1").getCell("A1").value = "cualquier cosa";
    const buffer = await workbook.xlsx.writeBuffer();
    await expect(
      parsearFicha(buffer as unknown as ArrayBuffer, "otro.xlsx"),
    ).rejects.toThrow(/Ficha_Jerarquia/);
  });
});

describe("parsearFicha — advertencias esperadas en esta fixture", () => {
  test("línea de producto sin selección (H25 está vacío, ver plan sección 2.4)", async () => {
    const { datos, advertencias } = await parsearFixture();
    expect(datos.caracteristicas.lineaProducto.valor).toBeNull();
    expect(advertencias.some((a) => a.startsWith("Línea de producto"))).toBe(true);
  });

  test("coordenada rota de la vía de primer orden genera advertencia, no excepción", async () => {
    const { datos, advertencias } = await parsearFixture();
    const primerOrden = datos.accesoConectividad.viasTerrestres.find(
      (v) => v.orden === "PRIMER_ORDEN",
    );
    expect(primerOrden?.coordenadaInicio.advertencia).not.toBeNull();
    expect(advertencias.some((a) => a.includes("coordenada de inicio"))).toBe(true);
  });
});
