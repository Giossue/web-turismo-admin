/**
 * Mensaje legible para mostrar un error capturado en la interfaz. Usa el
 * mensaje del `Error` cuando existe y el texto de respaldo en cualquier otro
 * caso (valores que no son `Error` o errores sin mensaje).
 */
export function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message.trim() ? cause.message : fallback;
}
