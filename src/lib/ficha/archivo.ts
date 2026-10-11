export const TAMANO_MAXIMO_BYTES = 20 * 1024 * 1024;
export class FichaInvalidaError extends Error {}

export function validarArchivoFicha(nombre: string, tamano: number): void {
  const extension = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "xls" || extension === "ods") {
    throw new FichaInvalidaError(
      `Formato "${extension}" no soportado. Guárdalo como .xlsx e inténtalo de nuevo.`,
    );
  }
  if (extension !== "xlsx" && extension !== "xlsm") {
    throw new FichaInvalidaError(
      `Formato "${extension || "desconocido"}" no soportado. Solo se aceptan archivos .xlsx o .xlsm.`,
    );
  }
  if (!Number.isSafeInteger(tamano) || tamano <= 0)
    throw new FichaInvalidaError("El archivo está vacío o tiene un tamaño inválido.");
  if (tamano > TAMANO_MAXIMO_BYTES)
    throw new FichaInvalidaError(
      `El archivo pesa más de ${TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB.`,
    );
}
