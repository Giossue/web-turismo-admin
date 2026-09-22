import type { CatalogosResueltos } from "./catalogos";
import type { FichaExtraida } from "./tipos";

/**
 * Sugerencias para las secciones del asistente que todavía no se guardan
 * automáticamente al importar (ver docs/importar-ficha-mintur.md). El
 * usuario decide si las aplica con el botón "Cargar desde la ficha" de cada
 * paso — nunca se escriben solas.
 *
 * Por ahora solo cubre "Accesibilidad y conectividad" (localidad cercana +
 * distancia, que alimentan `centro_localidad_cercana` para cruzar con el
 * catastro de esa localidad). El resto de las secciones ya extraídas
 * (políticas, promoción, visitantes, recurso humano, planta, conservación,
 * higiene-seguridad) quedan pendientes de este mismo tratamiento.
 */
export type SugerenciasSecciones = {
  accesibilidad: {
    localityId: number | null;
    distanceKm: number | null;
  };
};

export function mapearSugerenciasSecciones(
  datos: FichaExtraida,
  catalogos: CatalogosResueltos,
): SugerenciasSecciones {
  return {
    accesibilidad: {
      localityId: catalogos.localidadId.id,
      distanceKm: datos.accesoConectividad.distanciaKm,
    },
  };
}
