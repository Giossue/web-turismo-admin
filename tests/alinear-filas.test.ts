import { describe, expect, test } from "bun:test";
import ExcelJS from "exceljs";

import { TITULOS_PLANTILLA, alinearFilas, mapaDeFilas } from "@/lib/ficha/alinear-filas";

/** Hoja con los títulos de la plantilla; `borrada` quita una fila vacía de la plantilla. */
function hoja(borrada?: number) {
  const libro = new ExcelJS.Workbook();
  const ws = libro.addWorksheet("Ficha_Jerarquia");
  for (const [fila, texto] of TITULOS_PLANTILLA) {
    const destino = borrada !== undefined && fila > borrada ? fila - 1 : fila;
    ws.getCell(`B${destino}`).value = texto;
    ws.getCell(`C${destino}`).value = `dato de ${texto}`;
  }
  return ws;
}

describe("alinearFilas", () => {
  test("una ficha igual a la plantilla se devuelve sin cambios", () => {
    const ws = hoja();
    expect(mapaDeFilas(ws)).toBeNull();
    expect(alinearFilas(ws)).toBe(ws);
  });

  test("una fila borrada no corre las lecturas de las secciones siguientes", () => {
    // Fila vacía de la tabla de transporte (entre 4.3.1 y 4.4).
    const ws = hoja(66);
    expect(mapaDeFilas(ws)).not.toBeNull();
    const vista = alinearFilas(ws);
    const siguientes = TITULOS_PLANTILLA.filter(([fila]) => fila > 66);
    expect(siguientes.length).toBeGreaterThan(50);
    for (const [fila, texto] of siguientes) {
      expect(String(vista.getCell(`B${fila}`).value)).toBe(texto);
      expect(String(vista.getCell(`C${fila}`).value)).toBe(`dato de ${texto}`);
    }
  });

  test("las celdas combinadas se consultan con las filas de la plantilla", () => {
    const ws = hoja(66);
    ws.mergeCells("B67:D67");
    const vista = alinearFilas(ws);
    // La combinada física B67:D67 es la de la fila 68 de la plantilla.
    expect(vista.model.merges).toContain("B68:D68");
  });

  test("las filas anteriores a la borrada no cambian", () => {
    const vista = alinearFilas(hoja(66));
    for (const [fila, texto] of TITULOS_PLANTILLA.filter(([f]) => f < 60)) {
      expect(String(vista.getCell(`B${fila}`).value)).toBe(texto);
    }
  });

  test("la fila que ya no existe se lee vacía, no como el título siguiente", () => {
    const ws = hoja(66);
    // Fila 66 de la plantilla se borró: no debe devolver el título de la sección 4.4.
    const vista = alinearFilas(ws);
    expect(vista.getCell("B66").value ?? null).toBeNull();
  });
});
