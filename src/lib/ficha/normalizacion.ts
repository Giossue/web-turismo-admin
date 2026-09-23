import { esTextoVacio } from "./xlsx-utils";

/**
 * Normaliza texto de catálogo para comparar valores de la ficha ("BOLIVAR",
 * "MANIFESTACIONES_CULTURALES") contra los nombres reales de la base
 * ("Bolívar", "Manifestaciones culturales"): mayúsculas, sin tildes, guiones
 * bajos como espacios, espacios repetidos colapsados.
 * Ver docs/plans/active/importar-ficha-mintur.md sección 4.
 *
 * Defensivo ante `null`/`undefined`: la API real puede traer catálogos con
 * algún elemento sin `name` (visto en producción — un `TypeError` al llamar
 * `.normalize()` sobre `undefined` tumbaba todo el endpoint). Un nombre
 * ausente simplemente no puede coincidir con nada, así que se normaliza a
 * cadena vacía en vez de lanzar.
 */
export function normalizarTextoCatalogo(valor: string | null | undefined): string {
  if (!valor) return "";
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export type CoordenadaResultado =
  { ok: true; valor: number } | { ok: false; advertencia: string };

/**
 * Acepta "-1.67041", "  -79.06123", "-1,58830" (coma decimal). Rechaza con
 * advertencia formatos rotos como ".1.68050   -79. 02921" o "-1678955"
 * (sin separador decimal, claramente mal tecleado).
 */
export function parsearCoordenada(
  crudo: string,
  rango: { min: number; max: number },
  etiqueta: string,
): CoordenadaResultado {
  const texto = crudo.trim();
  if (texto === "") return { ok: false, advertencia: `${etiqueta}: vacío` };

  const limpio = texto.replace(/,/g, ".");
  // Un valor válido tiene como mucho un signo inicial y un único punto decimal.
  const formatoValido = /^-?\d{1,3}(\.\d+)?$/.test(limpio);
  if (!formatoValido) {
    return {
      ok: false,
      advertencia: `${etiqueta}: formato de coordenada irreconocible ("${crudo}")`,
    };
  }

  const valor = Number(limpio);
  if (!Number.isFinite(valor)) {
    return { ok: false, advertencia: `${etiqueta}: no es un número ("${crudo}")` };
  }
  if (valor < rango.min || valor > rango.max) {
    return {
      ok: false,
      advertencia: `${etiqueta}: fuera del rango de Ecuador (${rango.min}..${rango.max}): ${valor}`,
    };
  }
  return { ok: true, valor };
}

export const RANGO_LATITUD_ECUADOR = { min: -5.1, max: 1.7 };
export const RANGO_LONGITUD_ECUADOR = { min: -92.1, max: -75.1 };

/**
 * La altura a veces viene como texto con el punto usado como separador de
 * miles ("2.679" = 2679 msnm), no como decimal. Si el valor ya es numérico
 * (exceljs lo tipó como número), se usa tal cual.
 */
export function parsearAltitud(valor: string | number | boolean | null): number | null {
  if (valor === null || valor === "") return null;
  if (typeof valor === "number") return Math.round(valor);
  const texto = String(valor).trim();
  if (esTextoVacio(texto)) return null;

  const soloPuntoMiles = /^\d{1,3}\.\d{3}$/.test(texto);
  if (soloPuntoMiles) return Number(texto.replace(".", ""));

  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? Math.round(numero) : null;
}
