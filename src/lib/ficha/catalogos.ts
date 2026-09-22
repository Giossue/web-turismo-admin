import type { AdminCatalogs, CatalogOption } from "@/lib/admin-api";

import { normalizarTextoCatalogo } from "./normalizacion";
import type { FichaExtraida } from "./tipos";

export type ResolucionCatalogo = { id: number | null; advertencia: string | null };

function resolverPorNombre(
  opciones: CatalogOption[],
  textoBuscado: string | null,
  etiqueta: string,
): ResolucionCatalogo {
  if (!textoBuscado) {
    return { id: null, advertencia: `${etiqueta}: la ficha no tiene este dato.` };
  }
  const normalizado = normalizarTextoCatalogo(textoBuscado);
  const coincidencias = opciones.filter(
    (opcion) => normalizarTextoCatalogo(opcion.name) === normalizado,
  );
  if (coincidencias.length === 0) {
    return {
      id: null,
      advertencia: `${etiqueta}: "${textoBuscado}" no coincide con ningún valor activo del catálogo. Selecciónalo manualmente.`,
    };
  }
  if (coincidencias.length > 1) {
    return {
      id: null,
      advertencia: `${etiqueta}: "${textoBuscado}" coincide con más de un valor del catálogo (ambiguo). Selecciónalo manualmente.`,
    };
  }
  return { id: coincidencias[0].id, advertencia: null };
}

export type CatalogosResueltos = {
  provinciaId: ResolucionCatalogo;
  cantonId: ResolucionCatalogo;
  parroquiaId: ResolucionCatalogo;
  categoriaId: ResolucionCatalogo;
  tipoId: ResolucionCatalogo;
  subtipoId: ResolucionCatalogo;
  lineaProductoId: ResolucionCatalogo;
  escenarioId: ResolucionCatalogo;
  climaId: ResolucionCatalogo;
  tipoIngresoId: ResolucionCatalogo;
  /** Un id de `accessibilityTypes` por cada item marcado "SI" en 4.4. */
  accesibilidadTipoIds: number[];
  /** Un id de `activities` (acotado por categoría) por cada actividad marcada en la sección 9. */
  actividadIds: number[];
};

const NOMBRES_TIPO_INGRESO: Record<string, string> = {
  LIBRE: "Libre",
  RESTRINGIDO: "Restringido",
  PAGADO: "Pagado",
};

const NOMBRES_LINEA_PRODUCTO: Record<string, string> = {
  CULTURA: "Cultura",
  NATURALEZA: "Naturaleza",
  AVENTURA: "Aventura",
};

const NOMBRES_ESCENARIO: Record<string, string> = {
  PRISTINO: "Prístino",
  PRIMITIVO: "Primitivo",
  RUSTICO_NATURAL: "Rústico natural",
  RURAL: "Rural",
  URBANO: "Urbano",
};

/**
 * Resuelve los textos crudos de la ficha contra los catálogos reales de la
 * API (`getAdminCatalogs`), aplicando el orden de acotado obligatorio
 * provincia → cantón → parroquia y categoría → tipo → subtipo — ver
 * docs/plans/active/importar-ficha-mintur.md sección 4: buscar parroquia por
 * nombre sin acotar por cantón puede confundir registros homónimos en
 * cantones distintos (caso real encontrado: "Magdalena (chapacoto)" en
 * Chimbo vs. "La Magdalena" en Quito).
 *
 * Nunca inventa un id cuando hay ambigüedad o falta de coincidencia: deja el
 * campo sin resolver con una advertencia para que el usuario lo complete a
 * mano en el formulario.
 */
export function resolverCatalogosFicha(
  datos: FichaExtraida,
  catalogos: AdminCatalogs,
): CatalogosResueltos {
  const provinciaId = resolverPorNombre(
    catalogos.provinces,
    datos.ubicacion.provincia.texto,
    "Provincia",
  );

  const cantonesDeProvincia = provinciaId.id
    ? catalogos.cantons.filter((c) => c.provinceId === provinciaId.id)
    : catalogos.cantons;
  const cantonId = provinciaId.id
    ? resolverPorNombre(cantonesDeProvincia, datos.ubicacion.canton.texto, "Cantón")
    : {
        id: null,
        advertencia: "Cantón: no se pudo acotar por provincia, resuélvelo manualmente.",
      };

  const parroquiasDeCanton = cantonId.id
    ? catalogos.parishes.filter((p) => p.cantonId === cantonId.id)
    : catalogos.parishes;
  const parroquiaId = cantonId.id
    ? resolverPorNombre(parroquiasDeCanton, datos.ubicacion.parroquia.texto, "Parroquia")
    : {
        id: null,
        advertencia: "Parroquia: no se pudo acotar por cantón, resuélvelo manualmente.",
      };

  const categoriaId = resolverPorNombre(
    catalogos.categories,
    datos.identificacion.categoria.texto,
    "Categoría",
  );
  const tiposDeCategoria = categoriaId.id
    ? catalogos.types.filter((t) => t.categoryId === categoriaId.id)
    : catalogos.types;
  const tipoId = categoriaId.id
    ? resolverPorNombre(tiposDeCategoria, datos.identificacion.tipo.texto, "Tipo")
    : {
        id: null,
        advertencia: "Tipo: no se pudo acotar por categoría, resuélvelo manualmente.",
      };

  const subtiposDeTipo = tipoId.id
    ? catalogos.subtypes.filter((s) => s.typeId === tipoId.id)
    : catalogos.subtypes;
  const subtipoId = tipoId.id
    ? resolverPorNombre(subtiposDeTipo, datos.identificacion.subtipo.texto, "Subtipo")
    : {
        id: null,
        advertencia: "Subtipo: no se pudo acotar por tipo, resuélvelo manualmente.",
      };

  const lineaProductoTexto = datos.caracteristicas.lineaProducto.valor
    ? NOMBRES_LINEA_PRODUCTO[datos.caracteristicas.lineaProducto.valor]
    : null;
  const lineaProductoId = resolverPorNombre(
    catalogos.lines,
    lineaProductoTexto,
    "Línea de producto",
  );

  const escenarioTexto = datos.caracteristicas.escenario.valor
    ? NOMBRES_ESCENARIO[datos.caracteristicas.escenario.valor]
    : null;
  const escenarioId = resolverPorNombre(catalogos.scenarios, escenarioTexto, "Escenario");

  const climaId = resolverPorNombre(
    catalogos.climates,
    datos.caracteristicas.clima.texto,
    "Clima",
  );

  const tipoIngresoTexto = datos.caracteristicas.ingreso.tipoSeleccionado.valor
    ? NOMBRES_TIPO_INGRESO[datos.caracteristicas.ingreso.tipoSeleccionado.valor]
    : null;
  const tipoIngresoId = resolverPorNombre(
    catalogos.incomeTypes,
    tipoIngresoTexto,
    "Tipo de ingreso",
  );

  const accesibilidadTipoIds = Object.entries(
    datos.accesoConectividad.accesibilidadGeneral,
  )
    .filter(([, respuesta]) => respuesta === "SI")
    .map(
      ([nombre]) =>
        resolverPorNombre(
          catalogos.accessibilityTypes,
          nombre,
          `Accesibilidad: ${nombre}`,
        ).id,
    )
    .filter((id): id is number => id !== null);

  const actividadesDeCategoria = categoriaId.id
    ? catalogos.activities.filter((a) => a.categoryId === categoriaId.id)
    : catalogos.activities;
  const actividadIds = datos.actividades
    .filter((a) => a.marcada)
    .map(
      (a) =>
        resolverPorNombre(actividadesDeCategoria, a.nombre, `Actividad: ${a.nombre}`).id,
    )
    .filter((id): id is number => id !== null);

  return {
    provinciaId,
    cantonId,
    parroquiaId,
    categoriaId,
    tipoId,
    subtipoId,
    lineaProductoId,
    escenarioId,
    climaId,
    tipoIngresoId,
    accesibilidadTipoIds,
    actividadIds,
  };
}

/** Junta todas las advertencias de resolución de catálogo en un solo arreglo plano. */
export function advertenciasDeCatalogos(resueltos: CatalogosResueltos): string[] {
  const resoluciones: ResolucionCatalogo[] = [
    resueltos.provinciaId,
    resueltos.cantonId,
    resueltos.parroquiaId,
    resueltos.categoriaId,
    resueltos.tipoId,
    resueltos.subtipoId,
    resueltos.lineaProductoId,
    resueltos.escenarioId,
    resueltos.climaId,
    resueltos.tipoIngresoId,
  ];
  return resoluciones.map((r) => r.advertencia).filter((a): a is string => a !== null);
}
