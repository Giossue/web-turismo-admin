import { describe, expect, test } from "bun:test";
import ExcelJS from "exceljs";
import JSZip from "jszip";

import { leerMarcaJuntoAEtiqueta } from "@/lib/ficha/checkbox";
import { cargarCasillasFormulario } from "@/lib/ficha/controles-formulario";

/**
 * Libro mínimo con dos casillas de formulario ancladas en H25 (marcada) y O25
 * (sin marcar), como las que usa la plantilla MINTUR .xlsm.
 */
async function libroConCasillas(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Ficha_Jerarquia");
  hoja.mergeCells("B25:G25");
  hoja.getCell("B25").value = "a. Cultura";
  hoja.mergeCells("I25:N25");
  hoja.getCell("I25").value = "b. Naturaleza";
  const zip = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());

  const control = (relId: string, col: number) =>
    `<control shapeId="1" r:id="${relId}" name="Check Box"><controlPr><anchor>` +
    `<from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>24</xdr:row>` +
    `<xdr:rowOff>0</xdr:rowOff></from></anchor></controlPr></control>`;
  const rutaHoja = "xl/worksheets/sheet1.xml";
  const hojaXml = (await zip.file(rutaHoja)!.async("string")).replace(
    "</worksheet>",
    `<controls>${control("rIdC1", 7)}${control("rIdC2", 14)}</controls></worksheet>`,
  );
  zip.file(rutaHoja, hojaXml);
  zip.file(
    "xl/worksheets/_rels/sheet1.xml.rels",
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdC1" Type="ctrlProp" Target="../ctrlProps/ctrlProp1.xml"/>' +
      '<Relationship Id="rIdC2" Type="ctrlProp" Target="../ctrlProps/ctrlProp2.xml"/>' +
      "</Relationships>",
  );
  zip.file(
    "xl/ctrlProps/ctrlProp1.xml",
    '<formControlPr objectType="CheckBox" checked="Checked"/>',
  );
  zip.file("xl/ctrlProps/ctrlProp2.xml", '<formControlPr objectType="CheckBox"/>');
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("cargarCasillasFormulario", () => {
  test("una casilla de formulario marcada cuenta como marca junto a la etiqueta", async () => {
    const buffer = await libroConCasillas();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    await cargarCasillasFormulario(buffer, workbook);
    const hoja = workbook.getWorksheet("Ficha_Jerarquia")!;

    expect(leerMarcaJuntoAEtiqueta(hoja, "B25:G25")).toBe(true);
    expect(leerMarcaJuntoAEtiqueta(hoja, "I25:N25")).toBeNull();
  });
});
