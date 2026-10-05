import ExcelJS from "exceljs";

/**
 * Lee el valor "visible" de una celda resolviendo celdas combinadas (el valor
 * vive en la celda superior izquierda del rango) y el resultado en caché de
 * fórmulas. exceljs no persiste `result` cuando una fórmula da 0 en algunos
 * archivos; por eso una fórmula sin `result` se trata como 0, no como vacío.
 */
export function leerCelda(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): string | number | boolean | null {
  const cell = worksheet.getCell(ref);
  const value = cell.value;
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    // Una celda con fórmula siempre tiene la clave "formula". exceljs a veces
    // omite la clave "result" por completo cuando el resultado calculado es
    // 0 (no la deja en `undefined`, la deja *ausente*) — sin este caso, el
    // código del atractivo (F2:V2) sale con dígitos faltantes en vez de "0".
    if ("formula" in value) {
      const formulaValue = (value as ExcelJS.CellFormulaValue).result;
      if (formulaValue === undefined) return 0;
      return normalizarValorCelda(formulaValue);
    }
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText
        .map((part) => part.text)
        .join("");
    }
    if (value instanceof Date) return value.toISOString();
    if ("text" in value) {
      const text = (value as { text: unknown }).text;
      return text === null || text === undefined ? null : String(text);
    }
    return null;
  }
  return normalizarValorCelda(value);
}

function normalizarValorCelda(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return null;
}

/** Texto de una celda, con espacios sobrantes recortados. `null`/`undefined` → `""`. */
export function leerTexto(worksheet: ExcelJS.Worksheet, ref: string): string {
  const value = leerCelda(worksheet, ref);
  if (value === null) return "";
  return String(value).trim();
}

/** Texto de ejemplo que trae la plantilla en las celdas sin llenar. */
const PLACEHOLDER_TEXTO = "texto";

/** Vacío o el texto de ejemplo de la plantilla ("texto", sin distinguir mayúsculas). */
export function esTextoVacio(texto: string): boolean {
  return texto === "" || texto.toLowerCase() === PLACEHOLDER_TEXTO;
}

/** Texto útil para un campo de texto libre: placeholders ("texto", "0") y vacío → `null`. */
export function leerTextoOpcional(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): string | null {
  const texto = leerTexto(worksheet, ref);
  if (esTextoVacio(texto) || texto === "0") return null;
  return texto;
}

/** Número de una celda; vacío, placeholder o texto no numérico → `null` (0 se conserva). */
export function leerNumeroOpcional(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): number | null {
  const texto = leerTexto(worksheet, ref);
  if (esTextoVacio(texto)) return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Número de una celda donde la plantilla usa 0 como "sin dato" (precios,
 * distancias): 0, vacío o texto no numérico → `null`.
 */
export function leerPositivoOpcional(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): number | null {
  return Number(leerTexto(worksheet, ref)) || null;
}

export function separarColumnaFila(ref: string): [string, number] {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) throw new Error(`Referencia de celda inválida: ${ref}`);
  return [match[1], Number(match[2])];
}

export function columnaANumero(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

export function numeroAColumna(n: number): string {
  let col = "";
  let value = n;
  while (value > 0) {
    const resto = (value - 1) % 26;
    col = String.fromCharCode(65 + resto) + col;
    value = Math.floor((value - 1) / 26);
  }
  return col;
}

/**
 * Encuentra el rango combinado cuya celda superior izquierda es `ref`, si existe.
 * exceljs expone las celdas combinadas como `worksheet.model.merges` (lista de
 * strings "A1:B2").
 */
export function encontrarMerge(worksheet: ExcelJS.Worksheet, ref: string): string | null {
  const merges = (worksheet.model.merges ?? []) as string[];
  const [col, row] = separarColumnaFila(ref);
  for (const merge of merges) {
    const [inicio] = merge.split(":");
    const [colInicio, rowInicio] = separarColumnaFila(inicio);
    if (colInicio === col && rowInicio === row) return merge;
  }
  return null;
}

/**
 * Excel guarda horas como fracción de un día de 24h (ej. 0.333... = 08:00).
 * Devuelve "HH:MM" o `null` si no hay valor / es el placeholder "0".
 */
export function horaDesdeFraccionDia(
  valor: string | number | boolean | null,
): string | null {
  if (valor === null || valor === "" || valor === 0 || valor === "0") return null;
  const fraccion = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(fraccion) || fraccion < 0 || fraccion >= 1) return null;
  const minutosTotales = Math.round(fraccion * 24 * 60);
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

/**
 * Fecha serial de Excel (días desde 1899-12-30, incluye el bug del año
 * bisiesto 1900 que Excel mantiene por compatibilidad) → "YYYY-MM-DD".
 */
export function fechaDesdeSerial(valor: string | number | boolean | null): string | null {
  if (valor === null || valor === "") return null;
  const serial = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const epoch = Date.UTC(1899, 11, 30);
  const fecha = new Date(epoch + serial * 86400000);
  return fecha.toISOString().slice(0, 10);
}
