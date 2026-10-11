import { describe, expect, test } from "bun:test";
import JSZip from "jszip";
import { NextRequest } from "next/server";
import { ImportAdmission } from "@/lib/ficha/admission";
import { FichaInvalidaError } from "@/lib/ficha/archivo";
import { leerCuerpoLimitado } from "@/lib/ficha/cuerpo-limitado";
import { prepararExcelSeguro, LIMITES_EXCEL } from "@/lib/ficha/zip-seguro";
import { parsearFichaAislada } from "@/lib/ficha/import-worker";

function zipMinimo() {
  return new JSZip()
    .file("[Content_Types].xml", "<Types/>")
    .file("xl/workbook.xml", "<workbook/>");
}
const generar = (zip: JSZip) =>
  zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
describe("límites de importación", () => {
  test("rechaza la bomba ZIP reproducida antes de cargar Excel", async () => {
    const zip = zipMinimo().file("xl/bomba.bin", Buffer.alloc(24 * 1024 * 1024, 65));
    const buffer = await generar(zip);
    expect(buffer.byteLength).toBeLessThan(30_000);
    await expect(prepararExcelSeguro(buffer)).rejects.toBeInstanceOf(FichaInvalidaError);
  });
  test("rechaza una entrada pequeña con relación de compresión excesiva", async () => {
    await expect(
      prepararExcelSeguro(
        await generar(zipMinimo().file("xl/repetido.bin", Buffer.alloc(1024 * 1024, 65))),
      ),
    ).rejects.toThrow("límites seguros");
  });
  test("rechaza demasiadas entradas incluso vacías", async () => {
    const zip = zipMinimo();
    for (let i = 0; i <= LIMITES_EXCEL.entradas; i++) zip.file(`extra/${i}`, "");
    await expect(prepararExcelSeguro(await generar(zip))).rejects.toThrow(
      "límites seguros",
    );
  });
  test("un tamaño descomprimido falsificado no elude el contador real", async () => {
    const buffer = Buffer.from(
      await generar(zipMinimo().file("xl/bomba.bin", Buffer.alloc(1024 * 1024, 65))),
    );
    for (let i = 0; i < buffer.length - 46; i++) {
      if (
        buffer.readUInt32LE(i) === 0x02014b50 &&
        buffer.subarray(i + 46, i + 46 + buffer.readUInt16LE(i + 28)).toString() ===
          "xl/bomba.bin"
      )
        buffer.writeUInt32LE(1, i + 24);
    }
    await expect(
      prepararExcelSeguro(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
      ),
    ).rejects.toBeInstanceOf(FichaInvalidaError);
  });
  for (const [caso, xml] of [
    [
      "fila extrema",
      '<worksheet><sheetData><row r="1048576"><c r="A1048576"/></row></sheetData></worksheet>',
    ],
    [
      "columna extrema",
      '<worksheet><sheetData><row r="1"><c r="XFD1"/></row></sheetData></worksheet>',
    ],
    [
      "combinación gigante",
      '<worksheet><mergeCells><mergeCell ref="A1:IV4096"/></mergeCells></worksheet>',
    ],
    ["entidades XML", '<!DOCTYPE worksheet [<!ENTITY x "x">]><worksheet/>'],
    [
      "XML profundo",
      "<worksheet>" + "<x>".repeat(100) + "</x>".repeat(100) + "</worksheet>",
    ],
  ])
    test(`rechaza ${caso}`, async () => {
      const buffer = await generar(zipMinimo().file("xl/worksheets/sheet1.xml", xml));
      await expect(prepararExcelSeguro(buffer)).rejects.toBeInstanceOf(
        FichaInvalidaError,
      );
    });
  test("corta una carga que deja de enviar datos", async () => {
    let canceled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        canceled = true;
      },
    });
    const request = new NextRequest("http://localhost/import", {
      method: "POST",
      body,
      duplex: "half",
    });
    await expect(
      leerCuerpoLimitado(request, 100, AbortSignal.timeout(20)),
    ).rejects.toThrow("tardó demasiado");
    expect(canceled).toBe(true);
  });
  test("admite como máximo dos cargas y libera cada reserva una vez", () => {
    const limits = new ImportAdmission();
    const a = limits.reservar()!,
      b = limits.reservar()!;
    expect(limits.reservar()).toBeNull();
    a();
    a();
    const c = limits.reservar()!;
    expect(limits.reservar()).toBeNull();
    b();
    c();
    expect(limits.reservar()).not.toBeNull();
  });
  test("la cuota depende de la cuenta y se renueva al terminar el minuto", () => {
    const limits = new ImportAdmission();
    for (let i = 0; i < 12; i++) expect(limits.admitirUsuario(1, 0)).toBe(true);
    expect(limits.admitirUsuario(1, 1)).toBe(false);
    expect(limits.admitirUsuario(2, 1)).toBe(true);
    expect(limits.admitirUsuario(1, 60_000)).toBe(true);
  });
  test("el worker importa una plantilla válida y rechaza un ZIP malicioso", async () => {
    const signal = new AbortController().signal;
    const result = await parsearFichaAislada(
      await Bun.file("public/templates/ficha-mintur-vacia.xlsm").arrayBuffer(),
      "ficha.xlsm",
      signal,
    );
    expect(result.datos.identificacion.nombre).toBeNull();
    await expect(
      parsearFichaAislada(
        await generar(zipMinimo().file("xl/bomba.bin", Buffer.alloc(1024 * 1024, 65))),
        "ficha.xlsx",
        signal,
      ),
    ).rejects.toThrow("límites seguros");
  }, 15_000);
  test("una solicitud cancelada no inicia el worker", () => {
    expect(() =>
      parsearFichaAislada(new ArrayBuffer(1), "ficha.xlsx", AbortSignal.abort()),
    ).toThrow();
  });
});
