const DEFAULT_API_URL = "http://localhost:3000/api/v1";

/**
 * URL de la API visible desde el navegador. Next.js incorpora
 * `NEXT_PUBLIC_TURISMO_API_URL` al bundle durante el build, por eso es la única
 * que debe usarse para construir enlaces que se renderizan en la interfaz
 * (por ejemplo, descargas de multimedia): es idéntica en servidor y cliente.
 */
export const publicApiUrl = process.env.NEXT_PUBLIC_TURISMO_API_URL ?? DEFAULT_API_URL;

/**
 * URL base de la API NestJS para el entorno que ejecuta la solicitud: en el
 * servidor prioriza `TURISMO_API_URL` (red interna del despliegue) y en el
 * navegador usa `NEXT_PUBLIC_TURISMO_API_URL`. Se evalúa en cada llamada para
 * leer las variables de runtime del servidor.
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.TURISMO_API_URL ?? publicApiUrl;
  }
  return publicApiUrl;
}
