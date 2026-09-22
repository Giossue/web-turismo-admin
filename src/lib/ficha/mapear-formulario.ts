import type { FormValues } from "@/components/admin/center-editor";

import type { CatalogosResueltos } from "./catalogos";
import type { FichaExtraida } from "./tipos";

function idATexto(id: number | null): string {
  return id === null ? "" : String(id);
}

/**
 * Convierte la ficha ya extraída + los catálogos ya resueltos a la forma
 * exacta de `FormValues` de `center-editor.tsx`, para usar con
 * `reset(mapearFichaAFormulario(...))`. Solo cubre los campos que el parser
 * puede llenar con confianza (ver docs/plans/active/importar-ficha-mintur.md
 * sección 3): identificación, ubicación, administración, clima/ingreso y
 * accesibilidad general. `touristZoneId` y `hierarchyId` se dejan vacíos a
 * propósito — no tienen fuente en la ficha (zona turística) o se calculan
 * después (jerarquía) — y `activityIds`/`facilityIds` quedan vacíos porque
 * esas secciones todavía no están implementadas en el parser.
 */
export function mapearFichaAFormulario(
  datos: FichaExtraida,
  catalogos: CatalogosResueltos,
): Partial<FormValues> {
  const horarioSeleccionado = datos.caracteristicas.ingreso.tipoSeleccionado.valor
    ? datos.caracteristicas.ingreso.horarios.find(
        (h) => h.tipo === datos.caracteristicas.ingreso.tipoSeleccionado.valor,
      )
    : undefined;

  return {
    name: datos.identificacion.nombre ?? "",
    categoryId: idATexto(catalogos.categoriaId.id),
    typeId: idATexto(catalogos.tipoId.id),
    subtypeId: idATexto(catalogos.subtipoId.id),
    // touristZoneId: sin fuente en la ficha — el usuario lo elige a mano.
    provinceId: idATexto(catalogos.provinciaId.id),
    cantonId: idATexto(catalogos.cantonId.id),
    parishId: idATexto(catalogos.parroquiaId.id),
    productLineId: idATexto(catalogos.lineaProductoId.id),
    scenarioId: idATexto(catalogos.escenarioId.id),
    // hierarchyId: se calcula del lado de la API, no se importa.
    latitude:
      datos.ubicacion.latitud.valor !== null ? String(datos.ubicacion.latitud.valor) : "",
    longitude:
      datos.ubicacion.longitud.valor !== null
        ? String(datos.ubicacion.longitud.valor)
        : "",
    altitudeMeters:
      datos.ubicacion.altitudMsnm !== null ? String(datos.ubicacion.altitudMsnm) : "",
    description: datos.descripcion ?? "",
    address: {
      barrio: datos.ubicacion.barrioSectorComuna ?? "",
      street: datos.ubicacion.callePrincipal ?? "",
      number: datos.ubicacion.numero ?? "",
      crossStreet: datos.ubicacion.calleTransversal ?? "",
    },
    administration: {
      type: datos.ubicacion.administracion.tipo ?? "",
      institution: datos.ubicacion.administracion.institucion ?? "",
      name: datos.ubicacion.administracion.nombre ?? "",
      position: datos.ubicacion.administracion.cargo ?? "",
      phone: datos.ubicacion.administracion.telefono ?? "",
      email: datos.ubicacion.administracion.email ?? "",
      observation: datos.ubicacion.administracion.observacion ?? "",
    },
    admission: {
      incomeTypeId: idATexto(catalogos.tipoIngresoId.id),
      attentionModeId: "",
      opensAt: horarioSeleccionado?.horaIngreso ?? "",
      closesAt: horarioSeleccionado?.horaSalida ?? "",
      otherAttention: "",
      reservations: false,
      priceFrom:
        datos.caracteristicas.ingreso.precioDesde !== null
          ? String(datos.caracteristicas.ingreso.precioDesde)
          : "",
      priceTo:
        datos.caracteristicas.ingreso.precioHasta !== null
          ? String(datos.caracteristicas.ingreso.precioHasta)
          : "",
      observation: datos.caracteristicas.ingreso.observacion ?? "",
    },
    activityIds: [],
    accessibilityIds: catalogos.accesibilidadTipoIds.map(String),
    facilityIds: [],
    facilityQuantities: {},
    facilityObservations: {},
  };
}
