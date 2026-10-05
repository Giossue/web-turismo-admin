import type ExcelJS from "exceljs";

import { casillaFormularioMarcada } from "./controles-formulario";
import {
  columnaANumero,
  encontrarMerge,
  leerTexto,
  numeroAColumna,
  separarColumnaFila,
} from "./xlsx-utils";

/**
 * Interpreta el texto crudo de una celda-casilla: `true` si es exactamente
 * "x" (sin importar mayúsculas ni espacios alrededor), `false` si tiene
 * cualquier otro contenido no vacío, `null` si está vacía (sin dato — nunca
 * se asume "no").
 */
function interpretarMarca(textoCrudo: string): boolean | null {
  if (textoCrudo === "") return null;
  return textoCrudo.toLowerCase() === "x";
}

/**
 * Lee la marca de una celda cuya posición ya se conoce exactamente (por
 * ejemplo las columnas fijas "Estado: B/R/M" de las tablas de señalética,
 * vías y facilidades, o las columnas K="SI"/L="NO" de la hoja
 * `ficha_Accesibilidad`). Los dos únicos ejemplos de "x" real que aparecieron
 * en el archivo de referencia (`T171`, `T177`) son de este tipo.
 */
export function leerMarcaDirecta(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): boolean | null {
  if (casillaFormularioMarcada(worksheet, ref)) return true;
  return interpretarMarca(leerTexto(worksheet, ref));
}

/**
 * Lee la marca de una opción cuya etiqueta ocupa una celda combinada (ej.
 * "a. Cultura" en `B25:G25`): la casilla es la celda inmediatamente a la
 * derecha del rango combinado (o de la celda sola, si la etiqueta no está
 * combinada).
 *
 * Ver docs/plans/active/importar-ficha-mintur.md sección 2.4: esta posición
 * es una hipótesis estructural verificada (la celda vacía existe exactamente
 * ahí) pero **no** contra un ejemplo real marcado — en el archivo de
 * referencia esas casillas estaban vacías, incluida una que lógicamente
 * debería estar marcada. Queda "sin verificar" hasta probar con una segunda
 * ficha real. Igual que `leerMarcaDirecta`, nunca asume "no": vacío es "sin
 * dato".
 */
export function leerMarcaJuntoAEtiqueta(
  worksheet: ExcelJS.Worksheet,
  refEtiqueta: string,
): boolean | null {
  // Admite tanto la celda superior izquierda sola ("B25") como el rango
  // combinado completo ("B25:G25"), para que el llamador pueda pasar
  // cualquiera de los dos sin tener que saber de antemano si está combinada.
  const celdaInicio = refEtiqueta.split(":")[0];
  const merge = encontrarMerge(worksheet, celdaInicio);
  const [col, row] = separarColumnaFila(merge ? merge.split(":")[1] : celdaInicio);
  const colCasilla = numeroAColumna(columnaANumero(col) + 1);
  return leerMarcaDirecta(worksheet, `${colCasilla}${row}`);
}

/**
 * Grupo de selección única (ej. línea de producto Cultura/Naturaleza/Aventura,
 * o escenario Prístino/Primitivo/.../Urbano): (U) en la ficha significa que se
 * espera una sola casilla marcada. Si 0 o más de 1 están marcadas, se
 * devuelve la advertencia correspondiente en vez de adivinar.
 */
export function leerSeleccionUnica<T extends string>(
  worksheet: ExcelJS.Worksheet,
  opciones: Array<{ valor: T; refEtiqueta: string }>,
): { valor: T | null; advertencia: string | null } {
  const marcadas = opciones.filter(
    (opcion) => leerMarcaJuntoAEtiqueta(worksheet, opcion.refEtiqueta) === true,
  );
  if (marcadas.length === 1) return { valor: marcadas[0].valor, advertencia: null };
  if (marcadas.length === 0) {
    return {
      valor: null,
      advertencia: "Ninguna opción marcada; se requiere selección manual.",
    };
  }
  return {
    valor: null,
    advertencia: `Más de una opción marcada (${marcadas.map((m) => m.valor).join(", ")}); se requiere selección manual.`,
  };
}
