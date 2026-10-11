import JSZip from "jszip";
import { SaxesParser } from "saxes";
import { fromBufferPromise, type ZipFile } from "yauzl";
import { FichaInvalidaError } from "./archivo";

export const LIMITES_EXCEL = Object.freeze({
  entradas: 2048,
  porEntrada: 16 * 1024 * 1024,
  expandido: 64 * 1024 * 1024,
  relacionCompresion: 200,
  nodosXml: 500_000,
  profundidadXml: 64,
  filas: 4096,
  columnas: 256,
  celdas: 300_000,
  celdasCombinadas: 200_000,
});
const mensajeLimite =
  "El Excel supera los límites seguros de contenido o complejidad. Reduce su tamaño y vuelve a intentarlo.";
function rechazar(): never {
  throw new FichaInvalidaError(mensajeLimite);
}
type Presupuesto = { nodos: number; celdas: number; combinadas: number };

function celda(ref: string): [number, number] {
  const match = /^([A-Z]{1,3})([1-9]\d{0,6})$/.exec(ref);
  if (!match) rechazar();
  let columna = 0;
  for (const letra of match[1]) columna = columna * 26 + letra.charCodeAt(0) - 64;
  const fila = Number(match[2]);
  if (fila > LIMITES_EXCEL.filas || columna > LIMITES_EXCEL.columnas) rechazar();
  return [fila, columna];
}
function rango(ref: string): number {
  const partes = ref.split(":");
  if (partes.length > 2) rechazar();
  const [f1, c1] = celda(partes[0]);
  const [f2, c2] = partes.length === 2 ? celda(partes[1]) : [f1, c1];
  if (f2 < f1 || c2 < c1) rechazar();
  return (f2 - f1 + 1) * (c2 - c1 + 1);
}
function validarXml(nombre: string, contenido: Buffer, presupuesto: Presupuesto) {
  const parser = new SaxesParser({ xmlns: true });
  const hoja = /^xl\/worksheets\/[^/]+\.xml$/.test(nombre);
  let profundidad = 0;
  parser.on("doctype", rechazar);
  parser.on("opentag", (tag) => {
    if (
      ++profundidad > LIMITES_EXCEL.profundidadXml ||
      ++presupuesto.nodos > LIMITES_EXCEL.nodosXml
    )
      rechazar();
    if (!hoja || tag.name !== tag.local) return;
    const atributo = (key: string) =>
      Object.values(tag.attributes).find((a) => a.local === key)?.value;
    if (tag.local === "row") {
      const fila = Number(atributo("r"));
      if (!Number.isSafeInteger(fila) || fila < 1 || fila > LIMITES_EXCEL.filas)
        rechazar();
    } else if (tag.local === "c") {
      celda(atributo("r") ?? "");
      if (++presupuesto.celdas > LIMITES_EXCEL.celdas) rechazar();
    } else if (tag.local === "dimension") {
      rango(atributo("ref") ?? "");
    } else if (tag.local === "mergeCell") {
      presupuesto.combinadas += rango(atributo("ref") ?? "");
      if (presupuesto.combinadas > LIMITES_EXCEL.celdasCombinadas) rechazar();
    } else if (tag.local === "col") {
      // La plantilla oficial aplica estilos hasta XFD; se permite el rango
      // nativo de Excel, aunque las celdas y dimensiones quedan limitadas.
      const min = Number(atributo("min")),
        max = Number(atributo("max"));
      if (
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min < 1 ||
        max < min ||
        max > 16384
      )
        rechazar();
    }
  });
  parser.on("closetag", () => {
    profundidad--;
  });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let inicio = 0; inicio < contenido.length; inicio += 16 * 1024) {
    parser.write(
      decoder.decode(contenido.subarray(inicio, inicio + 16 * 1024), { stream: true }),
    );
  }
  parser.write(decoder.decode()).close();
}

/** Cuenta bytes reales en streaming y reconstruye un ZIP sin datos comprimidos
 * sin verificar. ExcelJS y los controles reciben exclusivamente este contenido. */
export async function prepararExcelSeguro(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  let zip: ZipFile | undefined;
  try {
    zip = await fromBufferPromise(Buffer.from(buffer), {
      validateEntrySizes: true,
      strictFileNames: true,
    });
    if (zip.entryCount > LIMITES_EXCEL.entradas) rechazar();
    const limpio = new JSZip();
    const nombres = new Set<string>();
    const presupuesto: Presupuesto = { nodos: 0, celdas: 0, combinadas: 0 };
    let total = 0;
    for await (const entrada of zip.eachEntry()) {
      const nombre = entrada.fileName;
      if (
        nombres.has(nombre) ||
        nombre.length > 512 ||
        nombre.includes("\0") ||
        entrada.isEncrypted() ||
        ![0, 8].includes(entrada.compressionMethod)
      )
        rechazar();
      nombres.add(nombre);
      if (
        entrada.uncompressedSize > LIMITES_EXCEL.porEntrada ||
        total + entrada.uncompressedSize > LIMITES_EXCEL.expandido ||
        entrada.uncompressedSize >
          Math.max(1, entrada.compressedSize) * LIMITES_EXCEL.relacionCompresion
      )
        rechazar();
      if (nombre.endsWith("/")) {
        if (entrada.uncompressedSize !== 0) rechazar();
        continue;
      }
      const stream = await zip.openReadStreamPromise(entrada);
      const partes: Buffer[] = [];
      let bytes = 0;
      try {
        for await (const parte of stream) {
          const chunk = Buffer.from(parte);
          bytes += chunk.length;
          total += chunk.length;
          if (
            bytes > LIMITES_EXCEL.porEntrada ||
            total > LIMITES_EXCEL.expandido ||
            bytes > Math.max(1, entrada.compressedSize) * LIMITES_EXCEL.relacionCompresion
          )
            rechazar();
          partes.push(chunk);
        }
      } finally {
        stream.destroy();
      }
      const contenido = Buffer.concat(partes, bytes);
      if (/\.(xml|rels|vml)$/i.test(nombre)) validarXml(nombre, contenido, presupuesto);
      limpio.file(nombre, contenido, { createFolders: false });
    }
    if (!nombres.has("[Content_Types].xml") || !nombres.has("xl/workbook.xml"))
      throw new FichaInvalidaError("El archivo no es un Excel válido (OOXML).");
    return await limpio.generateAsync({ type: "arraybuffer", compression: "STORE" });
  } catch (error) {
    if (error instanceof FichaInvalidaError) throw error;
    throw new FichaInvalidaError(
      "El archivo está corrupto o contiene una estructura Excel no válida.",
    );
  } finally {
    zip?.close();
  }
}
