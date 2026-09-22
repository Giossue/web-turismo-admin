import {
  RANGO_LATITUD_ECUADOR,
  RANGO_LONGITUD_ECUADOR,
  parsearCoordenada,
} from "./normalizacion";

/**
 * Varias tablas de la ficha (vías, facilidades del entorno, ciudad más
 * cercana) guardan un par de coordenadas como un solo texto con lat y long
 * separadas por espacios (ej. "-1.67041   -79.06123"). Se valida como
 * bloque: si el formato es irreconocible, se advierte y no se separan
 * valores.
 */
export function parsearCoordenadaPar(
  crudo: string,
  etiqueta: string,
): { advertencia: string | null } {
  const texto = crudo.trim();
  if (texto === "" || texto === "0") return { advertencia: null };
  const partes = texto.split(/\s+/).filter(Boolean);
  if (partes.length !== 2) {
    return { advertencia: `${etiqueta}: formato irreconocible ("${crudo}")` };
  }
  const lat = parsearCoordenada(partes[0], RANGO_LATITUD_ECUADOR, etiqueta);
  const lon = parsearCoordenada(partes[1], RANGO_LONGITUD_ECUADOR, etiqueta);
  if (!lat.ok) return { advertencia: lat.advertencia };
  if (!lon.ok) return { advertencia: lon.advertencia };
  return { advertencia: null };
}
