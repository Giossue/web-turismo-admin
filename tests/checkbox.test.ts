import { describe, expect, test } from "bun:test";
import ExcelJS from "exceljs";
import path from "node:path";

import { leerMarcaDirecta, leerMarcaJuntoAEtiqueta } from "@/lib/ficha/checkbox";
import { leerTexto } from "@/lib/ficha/xlsx-utils";

const FIXTURE = path.join(import.meta.dir, "fixtures", "santuario-del-guayco.xlsm");

async function cargarHojaFicha() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FIXTURE);
  const worksheet = workbook.getWorksheet("Ficha_Jerarquia");
  if (!worksheet) throw new Error("No se encontró la hoja Ficha_Jerarquia en la fixture");
  return worksheet;
}

async function cargarHojaAccesibilidad() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FIXTURE);
  const worksheet = workbook.getWorksheet("ficha_Accesibilidad");
  if (!worksheet)
    throw new Error("No se encontró la hoja ficha_Accesibilidad en la fixture");
  return worksheet;
}

describe("leerMarcaDirecta", () => {
  test("lee 'x' real de la columna Estado (Bueno) de señalética", async () => {
    const worksheet = await cargarHojaFicha();
    expect(leerMarcaDirecta(worksheet, "T171")).toBe(true);
    expect(leerMarcaDirecta(worksheet, "T177")).toBe(true);
  });

  test("celdas vacías de la misma columna dan null, no false", async () => {
    const worksheet = await cargarHojaFicha();
    expect(leerMarcaDirecta(worksheet, "T170")).toBeNull();
  });

  test("columna K/L de ficha_Accesibilidad: SI marcado en la fila 8", async () => {
    const worksheet = await cargarHojaAccesibilidad();
    expect(leerMarcaDirecta(worksheet, "K8")).toBe(true);
    expect(leerMarcaDirecta(worksheet, "L8")).toBeNull();
  });

  test("columna K/L de ficha_Accesibilidad: NO marcado en la fila 9", async () => {
    const worksheet = await cargarHojaAccesibilidad();
    expect(leerMarcaDirecta(worksheet, "L9")).toBe(true);
    expect(leerMarcaDirecta(worksheet, "K9")).toBeNull();
  });
});

describe("leerMarcaJuntoAEtiqueta", () => {
  test("la casilla de 'a. Cultura' (B25:G25 -> H25) existe pero está vacía en esta fixture", async () => {
    const worksheet = await cargarHojaFicha();
    // Documentado en el plan como "sin verificar": esta ficha real no tiene
    // esta marca, aunque por la categoría/descripción debería tenerla.
    expect(leerMarcaJuntoAEtiqueta(worksheet, "B25:G25")).toBeNull();
  });

  test("funciona igual si se pasa solo la celda superior izquierda del merge", async () => {
    const worksheet = await cargarHojaFicha();
    expect(leerMarcaJuntoAEtiqueta(worksheet, "B25")).toBeNull();
  });
});

describe("lectura de datos base de la fixture (control de regresión del parser)", () => {
  test("nombre y ubicación coinciden con el archivo real", async () => {
    const worksheet = await cargarHojaFicha();
    expect(leerTexto(worksheet, "B6")).toBe("Santuario del Guayco");
    expect(leerTexto(worksheet, "B11")).toBe("BOLIVAR");
    expect(leerTexto(worksheet, "I11")).toBe("CHIMBO");
  });
});
