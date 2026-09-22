import type ExcelJS from "exceljs";

import { leerMarcaJuntoAEtiqueta, leerSeleccionUnica } from "./checkbox";
import { leerTextoOpcional } from "./xlsx-utils";
import type {
  FichaComponenteConservacion,
  FichaConservacion,
  FichaEstadoConservacion,
  FichaFactorAlteracion,
} from "./tipos-conservacion";

const OPCIONES_ESTADO: Array<{ valor: FichaEstadoConservacion; refEtiqueta: string }> = [
  { valor: "CONSERVADO", refEtiqueta: "B{f}:D{f}" },
  { valor: "ALTERADO", refEtiqueta: "G{f}:I{f}" },
  { valor: "EN_PROCESO_DETERIORO", refEtiqueta: "L{f}:O{f}" },
  { valor: "DETERIORADO", refEtiqueta: "R{f}:T{f}" },
];

function conRef(refEtiqueta: string, fila: number): string {
  return refEtiqueta.replace(/\{f\}/g, String(fila));
}

// 6.1.1 / 6.2.1: 5 factores naturales (uno por fila) + 15 antrópicos (3 por
// fila), en las mismas filas para atractivo y entorno (solo cambia el bloque
// de filas: 133-138 para el atractivo, 145-150 para el entorno).
const FACTORES_NATURALES = [
  "Erosión",
  "Humedad",
  "Desastres naturales",
  "Flora/Fauna",
  "Clima",
];
const FACTORES_ANTROPICOS = [
  [
    "Actividades agrícolas y ganaderas",
    "Actividades forestales",
    "Actividades extractivas / minería",
  ],
  ["Actividades industriales", "Negligencia / abandono", "Huaquería"],
  ["Conflicto de tenencia", "Condiciones de uso y exposición", "Falta de mantenimiento"],
  ["Contaminación del ambiente", "Generación de residuos", "Expansión urbana"],
  ["Conflicto político / social", "Desarrollo industrial / comercial", "Vandalismo"],
];

function leerComponente(
  worksheet: ExcelJS.Worksheet,
  filaEstado: number,
  filaFactoresInicio: number,
  filaOtro: number,
  filaObservacionEstado: number,
  filaObservacionFactores: number,
): FichaComponenteConservacion {
  const estado = leerSeleccionUnica(
    worksheet,
    OPCIONES_ESTADO.map((o) => ({
      valor: o.valor,
      refEtiqueta: conRef(o.refEtiqueta, filaEstado),
    })),
  );

  const factores: FichaFactorAlteracion[] = [];
  FACTORES_NATURALES.forEach((nombre, i) => {
    const fila = filaFactoresInicio + i;
    factores.push({
      origen: "NATURAL",
      nombre,
      marcado: leerMarcaJuntoAEtiqueta(worksheet, `B${fila}:E${fila}`) === true,
    });
  });
  const RANGOS_ANTROPICOS = ["H{f}:K{f}", "M{f}:P{f}", "R{f}:U{f}"];
  FACTORES_ANTROPICOS.forEach((nombres, i) => {
    const fila = filaFactoresInicio + i;
    nombres.forEach((nombre, j) => {
      factores.push({
        origen: "ANTROPICO",
        nombre,
        marcado:
          leerMarcaJuntoAEtiqueta(worksheet, conRef(RANGOS_ANTROPICOS[j], fila)) === true,
      });
    });
  });
  factores.push({
    origen: "NATURAL",
    nombre: "Otro",
    marcado: leerMarcaJuntoAEtiqueta(worksheet, `B${filaOtro}:E${filaOtro}`) === true,
  });

  return {
    estado: estado.valor,
    observacionEstado: leerTextoOpcional(worksheet, `E${filaObservacionEstado}`),
    factores,
    otroDetalle: leerTextoOpcional(worksheet, `J${filaOtro}`),
    observacionFactores: leerTextoOpcional(worksheet, `E${filaObservacionFactores}`),
  };
}

export function leerConservacion(worksheet: ExcelJS.Worksheet): FichaConservacion {
  const atractivo = leerComponente(worksheet, 129, 133, 138, 130, 139);
  const entorno = leerComponente(worksheet, 141, 145, 150, 142, 151);

  return {
    atractivo,
    entorno,
    declaratoria: {
      declarante: leerTextoOpcional(worksheet, "E153"),
      denominacion: leerTextoOpcional(worksheet, "K153"),
      fechaDeclaracion: leerTextoOpcional(worksheet, "P153"),
      alcance: leerTextoOpcional(worksheet, "U153"),
      observacion: leerTextoOpcional(worksheet, "E154"),
    },
  };
}
