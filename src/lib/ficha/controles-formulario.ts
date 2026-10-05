import type ExcelJS from "exceljs";
import JSZip from "jszip";

import { numeroAColumna } from "./xlsx-utils";

/**
 * Casillas de formulario (form controls "Check Box") por hoja: celda de
 * anclaje → marcada. La plantilla MINTUR .xlsm marca las opciones con estos
 * controles, no escribiendo "x" en la celda, y exceljs no los expone.
 */
const casillasPorHoja = new WeakMap<ExcelJS.Worksheet, Map<string, boolean>>();

function rutaRelativa(base: string, destino: string): string {
  if (destino.startsWith("/")) return destino.slice(1);
  const partes = base.split("/").slice(0, -1);
  for (const segmento of destino.split("/")) {
    if (segmento === "..") partes.pop();
    else if (segmento !== ".") partes.push(segmento);
  }
  return partes.join("/");
}

function relaciones(xml: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const [rel] of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(rel)?.[1];
    const destino = /\bTarget="([^"]+)"/.exec(rel)?.[1];
    if (id && destino) mapa.set(id, destino);
  }
  return mapa;
}

async function leerXml(zip: JSZip, ruta: string): Promise<string | null> {
  return (await zip.file(ruta)?.async("string")) ?? null;
}

/**
 * Lee las casillas de formulario del paquete OOXML y las asocia a las hojas
 * del libro ya cargado. Un archivo sin controles (o con XML inesperado)
 * simplemente no aporta casillas: la lectura cae al texto de la celda.
 */
export async function cargarCasillasFormulario(
  buffer: ArrayBuffer,
  workbook: ExcelJS.Workbook,
): Promise<void> {
  const zip = await JSZip.loadAsync(buffer);
  const libroXml = await leerXml(zip, "xl/workbook.xml");
  const libroRels = await leerXml(zip, "xl/_rels/workbook.xml.rels");
  if (!libroXml || !libroRels) return;
  const destinosLibro = relaciones(libroRels);

  for (const [hojaTag] of libroXml.matchAll(/<sheet\b[^>]*>/g)) {
    const nombre = /\bname="([^"]+)"/.exec(hojaTag)?.[1];
    const relId = /\br:id="([^"]+)"/.exec(hojaTag)?.[1];
    const destino = relId ? destinosLibro.get(relId) : undefined;
    const worksheet = nombre ? workbook.getWorksheet(decodificarXml(nombre)) : undefined;
    if (!destino || !worksheet) continue;

    const rutaHoja = rutaRelativa("xl/workbook.xml", destino);
    const hojaXml = await leerXml(zip, rutaHoja);
    const nombreArchivo = rutaHoja.split("/").pop();
    const hojaRels = await leerXml(
      zip,
      rutaHoja.replace(/[^/]+$/, `_rels/${nombreArchivo}.rels`),
    );
    if (!hojaXml || !hojaRels) continue;
    const destinosHoja = relaciones(hojaRels);

    const casillas = new Map<string, boolean>();
    for (const control of hojaXml.matchAll(
      /<control\b[^>]*\br:id="([^"]+)"[^>]*>[\s\S]*?<from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/g,
    )) {
      const [, controlRelId, col, row] = control;
      const destinoControl = destinosHoja.get(controlRelId);
      if (!destinoControl) continue;
      const propiedades = await leerXml(zip, rutaRelativa(rutaHoja, destinoControl));
      if (!propiedades || !/objectType="CheckBox"/.test(propiedades)) continue;
      const celda = `${numeroAColumna(Number(col) + 1)}${Number(row) + 1}`;
      casillas.set(celda, /\bchecked="Checked"/.test(propiedades));
    }
    if (casillas.size > 0) casillasPorHoja.set(worksheet, casillas);
  }
}

function decodificarXml(texto: string): string {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** `true` si hay una casilla de formulario marcada anclada en la celda. */
export function casillaFormularioMarcada(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): boolean {
  return casillasPorHoja.get(worksheet)?.get(ref) === true;
}
