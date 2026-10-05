import type { AdminCatalogs, CatalogOption } from "@/lib/admin-api";
import { createSectionValues } from "@/lib/center-sections/create-section-values";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import {
  emptyComplementaryService,
  emptyConservationFactor,
  emptyCriterion,
  emptyFacilityDetail,
  emptyHygieneEntry,
  emptyPlant,
  emptyPromotionMedia,
  emptyRoad,
  emptyTraining,
  emptyTransportDetail,
  emptyTransportType,
  emptyVisitorOrigin,
} from "@/lib/center-sections/form-defaults";
import type {
  HygieneEntryForm,
  PlantForm,
  SectionFormValues,
} from "@/lib/center-sections/form-types";
import {
  EMPTY_RESPONSE,
  type SectionResponse,
  type ServiceScope,
} from "@/lib/center-sections/options";
import {
  toSectionContent,
  type SectionContent,
} from "@/lib/center-sections/to-section-content";

import type { CatalogosResueltos } from "./catalogos";
import {
  normalizarTextoCatalogo,
  parsearCoordenada,
  RANGO_LATITUD_ECUADOR,
  RANGO_LONGITUD_ECUADOR,
} from "./normalizacion";
import type { FichaExtraida } from "./tipos";

/** Contenido listo para `PATCH /admin/centers/:code/sections/:section`. */
export type SeccionesImportadas = Partial<Record<CenterSectionCode, SectionContent>>;

type Ficha = FichaExtraida;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function base(code: CenterSectionCode): SectionFormValues {
  const definition = centerSectionDefinitions.find((item) => item.code === code);
  if (!definition) throw new Error(`Apartado desconocido: ${code}`);
  // Sin filas genéricas: lo importado va en los bloques propios del apartado.
  return { ...createSectionValues(definition, { rows: [] }), response: "SI" };
}

/** Opción del catálogo cuyo nombre coincide (sin tildes ni mayúsculas). */
function buscar(
  opciones: readonly CatalogOption[] | undefined,
  nombre: string | null | undefined,
  filtro: (opcion: CatalogOption) => boolean = () => true,
): CatalogOption | undefined {
  const buscado = normalizarTextoCatalogo(nombre);
  if (!buscado) return undefined;
  return (opciones ?? []).find(
    (opcion) => filtro(opcion) && normalizarTextoCatalogo(opcion.name) === buscado,
  );
}

function idDe(opcion: CatalogOption | undefined): string {
  return opcion ? String(opcion.id) : "";
}

function texto(valor: string | null | undefined): string {
  return valor?.trim() ?? "";
}

function numero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

function respuesta(valor: string | boolean | null | undefined): SectionResponse {
  if (valor === true || valor === "SI") return "SI";
  if (valor === false || valor === "NO") return "NO";
  return EMPTY_RESPONSE;
}

function unir(...partes: Array<string | null | undefined>): string {
  return partes
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join("\n");
}

/** Observación general del apartado (la API admite hasta 2000 caracteres). */
function observacionGeneral(...partes: Array<string | null | undefined>): string {
  return unir(...partes).slice(0, 2_000);
}

/**
 * Agrega una observación de la ficha al primer registro del bloque (máx.
 * 1000 caracteres por registro); si el bloque está vacío, la devuelve para
 * que vaya a la observación general del apartado.
 */
function observacionEnPrimero<T extends { observation: string }>(
  registros: T[],
  observacion: string | null | undefined,
): string | null {
  const extra = texto(observacion);
  if (!extra) return null;
  const primero = registros[0];
  if (!primero) return extra;
  primero.observation = unir(primero.observation, extra).slice(0, 1_000);
  return null;
}

/** "-1.59 -79.00" (o con comas decimales / salto de línea) → [lat, lon]. */
function coordenadas(crudo: string | null | undefined): [string, string] {
  const partes = (crudo ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length !== 2) return ["", ""];
  const lat = parsearCoordenada(partes[0], RANGO_LATITUD_ECUADOR, "lat");
  const lon = parsearCoordenada(partes[1], RANGO_LONGITUD_ECUADOR, "lon");
  return lat.ok && lon.ok ? [String(lat.valor), String(lon.valor)] : ["", ""];
}

/** "Febrero a Octubre" o "enero, marzo" → ["2", …, "10"]. */
function meses(textoMeses: string | null | undefined): string[] {
  const encontrados = normalizarTextoCatalogo(textoMeses)
    .toLowerCase()
    .split(/[^a-z]+/)
    .map((palabra) => MESES.indexOf(palabra))
    .filter((indice) => indice >= 0);
  if (encontrados.length === 2 && /\ba\b|\bhasta\b|-/i.test(textoMeses ?? "")) {
    const [inicio, fin] = encontrados;
    const rango: number[] = [];
    for (let mes = inicio; ; mes = (mes + 1) % 12) {
      rango.push(mes + 1);
      if (mes === fin) break;
    }
    return rango.map(String);
  }
  return [...new Set(encontrados.map((indice) => String(indice + 1)))];
}

function accesibilidad(
  ficha: Ficha,
  catalogos: AdminCatalogs,
  resueltos: CatalogosResueltos,
): SectionFormValues {
  const valores = base("accesibilidad");
  const acceso = ficha.accesoConectividad;
  valores.localityId = resueltos.localidadId.id ? String(resueltos.localidadId.id) : "";
  valores.distanceKm = numero(acceso.distanciaKm);

  valores.accessibilityRoads = acceso.viasTerrestres
    .filter((via) => via.distanciaKm !== null || via.tipoMaterial || via.estado)
    .map((via) => {
      const [startLatitude, startLongitude] = coordenadas(via.coordenadaInicio.crudo);
      const [endLatitude, endLongitude] = coordenadas(via.coordenadaFin.crudo);
      const etiqueta = via.orden
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());
      const material = buscar(catalogos.roadMaterials, via.tipoMaterial);
      const estado = buscar(catalogos.conditionStates, via.estado);
      return {
        ...emptyRoad(),
        roadTypeId: idDe(buscar(catalogos.roadTypes, etiqueta)),
        typeLabel: etiqueta,
        startLatitude,
        startLongitude,
        endLatitude,
        endLongitude,
        distanceKm: numero(via.distanciaKm),
        materialId: idDe(material),
        conditionId: idDe(estado),
        observation: unir(
          !material && via.tipoMaterial ? `Material: ${via.tipoMaterial}` : null,
          !estado && via.estado ? `Estado: ${via.estado}` : null,
        ),
      };
    });

  valores.accessibilityTransportTypes = acceso.transporteTipos.map((nombre) => ({
    ...emptyTransportType(),
    typeId: idDe(buscar(catalogos.transportTypes, nombre)),
    label: nombre,
    applies: "SI",
  }));

  valores.accessibilityTransportDetails = acceso.transporteDetalle.map((detalle) => {
    const frecuencia = buscar(catalogos.serviceFrequencies, detalle.frecuencia);
    return {
      ...emptyTransportDetail(),
      operator: texto(detalle.nombre),
      terminal: texto(detalle.estacionTerminal),
      frequencyId: idDe(frecuencia),
      frequencyLabel: frecuencia ? "" : texto(detalle.frecuencia),
      transferDetail: texto(detalle.detalleTraslado),
    };
  });

  valores.accessibilityCriteria = ficha.accesibilidadDetalle
    // Las filas de firma del pie de la hoja no son criterios.
    .filter((item) => !/^nombres? del responsable/i.test(item.criterio.trim()))
    .filter((item) => item.respuesta !== null || item.observacion)
    .map((item) => {
      const grupo = normalizarTextoCatalogo(item.grupo);
      // "General" en la ficha es "Accesibilidad general" en el catálogo.
      const tipo = (catalogos.accessibilityTypes ?? []).find((opcion) => {
        const nombre = normalizarTextoCatalogo(opcion.name);
        return nombre === grupo || nombre.endsWith(` ${grupo}`);
      });
      const criterio = buscar(
        catalogos.accessibilityCriteria,
        item.criterio,
        (opcion) => !tipo || opcion.typeId === tipo.id,
      );
      return {
        ...emptyCriterion(),
        accessibilityTypeId: idDe(tipo),
        criterionId: idDe(criterio),
        label: item.criterio,
        response: respuesta(item.respuesta),
        observation: texto(item.observacion).slice(0, 1_000),
      };
    });
  return valores;
}

function planta(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("planta");
  const datos = ficha.planta;
  const registros: PlantForm[] = [];
  const agregar = (
    grupo: string,
    nombre: string,
    scope: ServiceScope,
    cantidades: Array<number | null>,
  ) => {
    if (!cantidades.some((cantidad) => cantidad !== null && cantidad > 0)) return;
    const tipo = buscar(catalogos.plantTypes, nombre);
    registros.push({
      ...emptyPlant(),
      scope,
      typeId: idDe(tipo),
      typeLabel: tipo ? "" : nombre,
      group: grupo,
      quantity1: numero(cantidades[0]),
      quantity2: numero(cantidades[1]),
      quantity3: numero(cantidades[2]),
    });
  };
  for (const [grupo, filas] of [
    ["Alojamiento", datos.alojamiento],
    ["Alimentos y bebidas", datos.alimentosBebidas],
    ["Agencias de viaje", datos.agenciasViaje],
  ] as const) {
    for (const fila of filas) {
      agregar(grupo, fila.nombre, "EN_ATRACTIVO", [
        fila.establecimientosAtractivo,
        fila.segundaMetricaAtractivo,
        fila.terceraMetricaAtractivo,
      ]);
      agregar(grupo, fila.nombre, "EN_POBLADO_CERCANO", [
        fila.establecimientosCiudad,
        fila.segundaMetricaCiudad,
        fila.terceraMetricaCiudad,
      ]);
    }
  }
  const guias = [
    ["Local", datos.guia.local],
    ["Nacional", datos.guia.nacional],
    ["Nacional especializado", datos.guia.nacionalEspecializado],
    ["Nacional especializado en cultura", datos.guia.cultura],
    ["Nacional especializado en aventura", datos.guia.aventura],
  ] as const;
  for (const [nombre, guia] of guias) {
    agregar("Guías", nombre, "EN_ATRACTIVO", [guia.atractivo, null, null]);
    agregar("Guías", nombre, "EN_POBLADO_CERCANO", [guia.ciudad, null, null]);
  }
  valores.plant = registros;

  valores.facilityDetails = datos.facilidadesEntorno
    .filter((facilidad) => (facilidad.cantidad ?? 0) > 0)
    .map((facilidad) => {
      const categoria = buscar(catalogos.facilityCategories, facilidad.categoria);
      const tipo = buscar(
        catalogos.facilities,
        facilidad.nombre,
        (opcion) => !categoria || opcion.categoryId === categoria.id,
      );
      const [latitude, longitude] = coordenadas(facilidad.coordenadas?.crudo);
      const estado = buscar(catalogos.conditionStates, facilidad.estado);
      return {
        ...emptyFacilityDetail(),
        categoryId: idDe(categoria),
        typeId: idDe(tipo),
        typeLabel: tipo ? "" : facilidad.nombre,
        quantity: numero(facilidad.cantidad),
        latitude,
        longitude,
        administrator: texto(facilidad.administrador),
        universalAccessibility: respuesta(facilidad.accesibilidadUniversal),
        conditionId: idDe(estado),
        observation: !estado && facilidad.estado ? `Estado: ${facilidad.estado}` : "",
      };
    });

  valores.complementaryServices = datos.complementarios.flatMap((servicio) => {
    const tipo = buscar(catalogos.complementaryServiceTypes, servicio.nombre);
    const ambitos: ServiceScope[] = [
      ...(servicio.enAtractivo ? (["EN_ATRACTIVO"] as const) : []),
      ...(servicio.enCiudad ? (["EN_POBLADO_CERCANO"] as const) : []),
    ];
    return ambitos.map((scope) => ({
      ...emptyComplementaryService(),
      scope,
      typeId: idDe(tipo),
      typeLabel: tipo ? "" : servicio.nombre,
    }));
  });

  valores.observation = observacionGeneral(
    datos.observacionPlantaAtractivo,
    datos.observacionPlantaCiudad,
    observacionEnPrimero(valores.facilityDetails, datos.observacionFacilidades),
    observacionEnPrimero(valores.complementaryServices, datos.observacionComplementarios),
  );
  return valores;
}

function conservacion(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("conservacion");
  const datos = ficha.conservacion;
  for (const [clave, componente, codigo] of [
    ["attraction", datos.atractivo, "ATRACTIVO"],
    ["environment", datos.entorno, "ENTORNO"],
  ] as const) {
    valores.conservation[clave] = {
      state: componente.estado ?? "",
      observation: unir(
        componente.observacionEstado,
        componente.observacionFactores,
      ).slice(0, 2_000),
    };
    for (const factor of componente.factores.filter((item) => item.marcado)) {
      const tipo = buscar(
        catalogos.conservationFactors,
        factor.nombre,
        (opcion) => opcion.origin === factor.origen,
      );
      valores.conservationFactors.push({
        ...emptyConservationFactor(),
        component: codigo,
        factorId: idDe(tipo),
        origin: factor.origen,
        name: factor.nombre,
        response: "SI",
        detailOther:
          normalizarTextoCatalogo(factor.nombre) === "OTRO"
            ? texto(componente.otroDetalle)
            : "",
      });
    }
  }
  const declaratoria = datos.declaratoria;
  if (declaratoria && (declaratoria.declarante || declaratoria.denominacion)) {
    valores.declarations = [
      {
        entity: texto(declaratoria.declarante),
        denomination: texto(declaratoria.denominacion),
        // La ficha trae la fecha en texto libre ("27 de septiembre del 2023").
        date: "",
        scope: texto(declaratoria.alcance),
        observation: unir(
          declaratoria.fechaDeclaracion
            ? `Fecha: ${declaratoria.fechaDeclaracion}`
            : null,
          declaratoria.observacion,
        ).slice(0, 1_000),
      },
    ];
  }
  return valores;
}

const CATEGORIA_SERVICIO_BASICO: Record<string, string> = {
  AGUA: "AGUA",
  ENERGIA_ELECTRICA: "ENERGIA",
  SANEAMIENTO: "SANEAMIENTO",
  DISPOSICION_DESECHOS: "DESECHOS",
};

/** Columnas de telefonía/internet de la ficha y su nombre en el catálogo. */
const COMUNICACION: Array<[string, string]> = [
  ["fija", "Fija"],
  ["movil", "Móvil"],
  ["satelital", "Satelital"],
  ["lineaTelefonica", "Línea telefónica"],
  ["fibraOptica", "Fibra óptica"],
  ["satelite", "Satélite"],
  ["redesInalambricas", "Redes inalámbricas"],
  ["telefoniaMovil", "Telefonía móvil"],
];

function higiene(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("higiene-seguridad");
  const datos = ficha.higieneSeguridad;
  const entradas: HygieneEntryForm[] = [];

  for (const servicio of datos.serviciosBasicos) {
    const categoria = (catalogos.basicServiceCategories ?? []).find(
      (opcion) => opcion.code === CATEGORIA_SERVICIO_BASICO[servicio.tipo],
    );
    for (const [scope, valor, proveedor] of [
      ["EN_ATRACTIVO", servicio.valorAtractivo, servicio.proveedorAtractivo],
      ["EN_POBLADO_CERCANO", servicio.valorCiudad, servicio.proveedorCiudad],
    ] as const) {
      if (!valor) continue;
      const tipo = buscar(
        catalogos.basicServiceTypes,
        valor,
        (opcion) => !categoria || opcion.categoryId === categoria.id,
      );
      entradas.push({
        ...emptyHygieneEntry(),
        kind: "BASIC_SERVICE",
        scope,
        typeId: idDe(tipo),
        name: tipo ? "" : `${categoria?.name ?? servicio.tipo}: ${valor}`.slice(0, 180),
        provider: texto(proveedor).slice(0, 180),
        response: "SI",
      });
    }
  }

  for (const senal of datos.senaletica) {
    const cantidad =
      (senal.cantidadMadera ?? 0) +
      (senal.cantidadAluminio ?? 0) +
      (senal.cantidadOtro ?? 0);
    if (cantidad === 0 && !senal.estado) continue;
    const tipo = buscar(
      catalogos.signageTypes,
      senal.nombre,
      (opcion) => !opcion.group || opcion.group === senal.ambiente,
    );
    entradas.push({
      ...emptyHygieneEntry(),
      kind: "SIGNAGE",
      typeId: idDe(tipo),
      name: tipo ? "" : senal.nombre,
      response: "SI",
      quantity: cantidad > 0 ? String(cantidad) : "",
      condition: senal.estado ?? "",
      secondary: texto(senal.especifiqueOtro),
    });
  }

  for (const salud of datos.salud) {
    const tipo = buscar(catalogos.healthServiceTypes, salud.nombre);
    for (const [scope, cantidad] of [
      ["EN_ATRACTIVO", salud.cantidadAtractivo],
      ["EN_POBLADO_CERCANO", salud.cantidadCiudad],
    ] as const) {
      if (!cantidad) continue;
      entradas.push({
        ...emptyHygieneEntry(),
        kind: "HEALTH",
        scope,
        typeId: idDe(tipo),
        name: tipo ? "" : salud.nombre,
        response: "SI",
        quantity: String(cantidad),
      });
    }
  }

  for (const seguridad of datos.seguridad.filter((item) => item.detalle)) {
    const tipo = buscar(catalogos.securityServiceTypes, seguridad.nombre);
    entradas.push({
      ...emptyHygieneEntry(),
      kind: "SECURITY",
      typeId: idDe(tipo),
      name: tipo ? "" : seguridad.nombre,
      response: "SI",
      secondary: texto(seguridad.detalle).slice(0, 250),
    });
  }

  for (const comunicacion of datos.telefoniaInternet) {
    const scope =
      comunicacion.scope === "ATRACTIVO" ? "EN_ATRACTIVO" : "EN_POBLADO_CERCANO";
    for (const [clave, nombre] of COMUNICACION) {
      if (!(comunicacion as Record<string, unknown>)[clave]) continue;
      const tipo = buscar(catalogos.communicationTypes, nombre);
      entradas.push({
        ...emptyHygieneEntry(),
        kind: "COMMUNICATION",
        scope,
        typeId: idDe(tipo),
        name: tipo ? "" : nombre,
        response: "SI",
      });
    }
  }

  for (const amenaza of datos.amenazas.filter((item) => item.marcada)) {
    const tipo = buscar(catalogos.threatTypes, amenaza.nombre);
    entradas.push({
      ...emptyHygieneEntry(),
      kind: "THREAT",
      typeId: idDe(tipo),
      name: tipo ? "" : amenaza.nombre,
      response: "SI",
    });
  }
  valores.hygieneEntries = entradas;

  const radio = datos.radioPortatil;
  const algunaRadio = radio.usoVisitante || radio.usoInterno || radio.usoEmergencia;
  // Casillas de la ficha: sin marcar es "No" (publicar exige SI o NO).
  valores.hygieneRadios = {
    available: algunaRadio ? "SI" : "NO",
    visitorUse: radio.usoVisitante ? "SI" : "NO",
    internalUse: radio.usoInterno ? "SI" : "NO",
    emergencyUse: radio.usoEmergencia ? "SI" : "NO",
    quantity: "",
    observation: texto(datos.observacionRadioPortatil).slice(0, 1_000),
  };

  const contingencia = datos.contingencia;
  valores.hygieneContingency = {
    exists: respuesta(contingencia.existe),
    institution: texto(contingencia.institucion),
    document: texto(contingencia.nombreDocumento).slice(0, 250),
    year: numero(contingencia.anioElaboracion),
    observation: "",
  };

  const porTipo = (kind: HygieneEntryForm["kind"]) =>
    entradas.filter((entrada) => entrada.kind === kind);
  valores.observation = observacionGeneral(
    observacionEnPrimero(porTipo("BASIC_SERVICE"), datos.observacionServiciosBasicos),
    observacionEnPrimero(porTipo("SIGNAGE"), datos.observacionSenaletica),
    observacionEnPrimero(porTipo("HEALTH"), datos.observacionSalud),
    observacionEnPrimero(porTipo("SECURITY"), datos.observacionSeguridad),
    observacionEnPrimero(porTipo("COMMUNICATION"), datos.observacionComunicacion),
  );
  return valores;
}

function politicas(ficha: Ficha): SectionFormValues {
  const valores = base("politicas");
  valores.policies = valores.policies.map((politica) => {
    const dato = ficha.politicas.find((item) => item.codigo === politica.code);
    return dato
      ? {
          ...politica,
          response: respuesta(dato.respuesta),
          year: numero(dato.anioElaboracion),
          specification: texto(dato.especifique),
        }
      : politica;
  });
  return valores;
}

/** Primer enlace http(s) del texto; el resto queda como observación. */
function primerEnlace(valor: string | null | undefined): { url: string; resto: string } {
  const textoValor = texto(valor);
  const enlace = textoValor.match(/https?:\/\/\S+/)?.[0] ?? "";
  try {
    if (enlace) new URL(enlace);
  } catch {
    return { url: "", resto: textoValor };
  }
  return { url: enlace.slice(0, 500), resto: textoValor.replace(enlace, "").trim() };
}

function promocion(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("promocion");
  const datos = ficha.promocion;
  valores.promotion = {
    hasPlan: respuesta(datos.tienePlanPromocionCantonal),
    planName: "",
    includedInPlan: respuesta(datos.incluidoEnPlan),
    partOfPackage: respuesta(datos.formaPartePaquete),
    packageDetail: texto(datos.detallePaquete),
    observation: unir(datos.observacion).slice(0, 1_000),
  };
  valores.promotionMedia = datos.medios.map((medio) => {
    const tipo = buscar(catalogos.promotionMediaTypes, medio.nombre);
    const { url, resto } = primerEnlace(medio.valor);
    return {
      ...emptyPromotionMedia(),
      response: "SI",
      typeId: idDe(tipo),
      name: tipo ? "" : texto(medio.nombre).slice(0, 180),
      url,
      periodicity: texto(medio.periodicidad).slice(0, 180),
      observation: resto.slice(0, 1_000),
    };
  });
  valores.observation = observacionGeneral(datos.observacionMedios);
  return valores;
}

function visitantes(ficha: Ficha): SectionFormValues {
  const valores = base("visitantes");
  const datos = ficha.visitantes;
  valores.visitorRegistry = {
    exists: respuesta(datos.poseeRegistro),
    type: datos.tipoRegistro ?? "",
    years: numero(datos.aniosRegistro),
    reports: respuesta(datos.generaReportes),
    frequency: texto(datos.frecuenciaReportes).slice(0, 80),
    observation: "",
  };
  valores.visitorSeasons = (
    [
      ["ALTA", datos.temporadaAlta],
      ["BAJA", datos.temporadaBaja],
    ] as const
  )
    .filter(([, temporada]) => temporada.marcada)
    .map(([type, temporada]) => ({
      type,
      quantity: numero(temporada.visitantes),
      year: "",
      months: meses(temporada.meses),
      observation: meses(temporada.meses).length === 0 ? texto(temporada.meses) : "",
    }));
  valores.visitorOrigins = [
    ...datos.llegadaNacional.map((llegada) => ({
      ...emptyVisitorOrigin(),
      type: "NACIONAL" as const,
      place: texto(llegada.ciudad).slice(0, 150),
      quantity: numero(llegada.totalAnual),
      observation:
        llegada.llegadasMensuales !== null
          ? `Llegadas mensuales: ${llegada.llegadasMensuales}`
          : "",
    })),
    ...datos.llegadaExtranjera.map((llegada) => ({
      ...emptyVisitorOrigin(),
      type: "EXTRANJERA" as const,
      place: texto(llegada.pais).slice(0, 150),
      quantity: numero(llegada.totalAnual),
      observation:
        llegada.llegadasMensuales !== null
          ? `Llegadas mensuales: ${llegada.llegadasMensuales}`
          : "",
    })),
  ].filter((origen) => origen.place);
  if (datos.informanteClave?.nombre) {
    valores.visitorInformants = [
      {
        name: texto(datos.informanteClave.nombre).slice(0, 180),
        contact: texto(datos.informanteClave.contacto).slice(0, 120),
        observation: "",
      },
    ];
  }
  valores.observation = observacionGeneral(datos.observacionLlegadas, datos.observacion);
  return valores;
}

function recursoHumano(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("recurso-humano");
  const datos = ficha.recursoHumano;
  valores.humanResourceSummary = {
    administrationOperation: numero(datos.personasAdministracionOperacion),
    specializedTourism: numero(datos.personasEspecializadasTurismo),
    observation: texto(datos.observacion).slice(0, 1_000),
  };
  const grupos: Record<string, string> = {
    EDUCACION: "EDUCACION",
    CAPACITACION: "CAPACITACION",
    IDIOMA: "IDIOMA",
  };
  valores.humanResourceTraining = datos.formacion
    .filter((formacion) => (formacion.cantidad ?? 0) > 0)
    .map((formacion) => {
      const tipo = buscar(
        catalogos.trainingTypes,
        formacion.nombre,
        (opcion) => !opcion.group || opcion.group === grupos[formacion.grupo],
      );
      return {
        ...emptyTraining(),
        group: formacion.grupo,
        typeId: idDe(tipo),
        name: tipo ? "" : formacion.nombre,
        quantity: numero(formacion.cantidad),
        detailOther: texto(formacion.detalleOtro),
      };
    });
  return valores;
}

function anexos(ficha: Ficha, catalogos: AdminCatalogs): SectionFormValues {
  const valores = base("anexos");
  const responsables = [
    ["ELABORO", "Elaboró", ficha.responsables.elaborado],
    ["VALIDO", "Validó", ficha.responsables.validado],
    ["APROBO", "Aprobó", ficha.responsables.aprobado],
  ] as const;
  valores.annexResponsibles = responsables
    .filter(([, , persona]) => persona?.nombre)
    .map(([codigo, rol, persona]) => {
      const tipo = (catalogos.responsibilityTypes ?? []).find(
        (opcion) => opcion.code === codigo,
      );
      const email = texto(persona?.email);
      return {
        typeId: idDe(tipo),
        name: texto(persona?.nombre).slice(0, 180),
        role: unir(rol, persona?.cargo).replace("\n", " · ").slice(0, 180),
        institution: texto(persona?.institucion).slice(0, 180),
        phone: texto(persona?.telefono).slice(0, 180),
        email: /^\S+@\S+\.\S+$/.test(email) ? email : "",
        observation: "",
      };
    });
  const gad = ficha.validacionGad;
  if (gad?.nombre) {
    const email = texto(gad.email);
    // La hoja trae la declaración "He revisado y estoy de acuerdo…" firmada.
    valores.gadValidation = {
      acceptance: "SI",
      name: texto(gad.nombre).slice(0, 180),
      institution: texto(gad.institucion).slice(0, 180),
      position: texto(gad.cargo).slice(0, 180),
      phone: texto(gad.telefono).slice(0, 180),
      email: /^\S+@\S+\.\S+$/.test(email) ? email : "",
      date: gad.fecha ?? "",
      observation: "",
    };
  }
  return valores;
}

/**
 * Publicar exige tipos del catálogo en estos bloques: lo que no se pudo
 * catalogar se quita (con aviso) para que no bloquee la publicación, y se
 * descartan duplicados del mismo tipo y ámbito.
 */
function depurarParaPublicar(
  valores: Partial<Record<CenterSectionCode, SectionFormValues>>,
  advertencias: string[],
) {
  const filtrar = <T>(
    registros: T[],
    catalogado: (registro: T) => boolean,
    nombre: (registro: T) => string,
    bloque: string,
    clave?: (registro: T) => string,
  ): T[] => {
    const descartados: string[] = [];
    const vistos = new Set<string>();
    const resultado = registros.filter((registro) => {
      if (!catalogado(registro)) {
        descartados.push(nombre(registro));
        return false;
      }
      const llave = clave?.(registro);
      if (llave === undefined) return true;
      if (vistos.has(llave)) return false;
      vistos.add(llave);
      return true;
    });
    if (descartados.length > 0) {
      advertencias.push(
        `${bloque}: no se importó ${[...new Set(descartados)].map((item) => `«${item}»`).join(", ")} porque no existe en el catálogo. Agrégalo a mano si corresponde.`,
      );
    }
    return resultado;
  };

  const acceso = valores.accesibilidad;
  if (acceso) {
    acceso.accessibilityRoads = filtrar(
      acceso.accessibilityRoads,
      (via) => via.roadTypeId !== "",
      (via) => via.typeLabel,
      "Vías de acceso",
    );
    acceso.accessibilityTransportTypes = filtrar(
      acceso.accessibilityTransportTypes,
      (transporte) => transporte.typeId !== "",
      (transporte) => transporte.label,
      "Tipos de transporte",
    );
    acceso.accessibilityCriteria = filtrar(
      acceso.accessibilityCriteria,
      (criterio) => criterio.criterionId !== "",
      (criterio) => criterio.label,
      "Criterios de accesibilidad",
    );
  }
  const planta = valores.planta;
  if (planta) {
    planta.plant = filtrar(
      planta.plant,
      (registro) => registro.typeId !== "",
      (registro) => registro.typeLabel,
      "Planta turística",
      (registro) => `${registro.scope}:${registro.typeId}`,
    );
    planta.facilityDetails = filtrar(
      planta.facilityDetails,
      (facilidad) => facilidad.typeId !== "",
      (facilidad) => facilidad.typeLabel,
      "Facilidades",
    );
    planta.complementaryServices = filtrar(
      planta.complementaryServices,
      (servicio) => servicio.typeId !== "",
      (servicio) => servicio.typeLabel,
      "Servicios complementarios",
      (servicio) => `${servicio.scope}:${servicio.typeId}`,
    );
  }
  const conservacion = valores.conservacion;
  if (conservacion) {
    conservacion.conservationFactors = filtrar(
      conservacion.conservationFactors,
      (factor) => factor.factorId !== "",
      (factor) => factor.name,
      "Factores de alteración",
      (factor) => `${factor.component}:${factor.factorId}`,
    );
  }
  const higiene = valores["higiene-seguridad"];
  if (higiene) {
    higiene.hygieneEntries = filtrar(
      higiene.hygieneEntries,
      (entrada) => entrada.typeId !== "",
      (entrada) => entrada.name,
      "Higiene y seguridad",
      (entrada) => `${entrada.kind}:${entrada.scope}:${entrada.typeId}`,
    );
  }
  const anexos = valores.anexos;
  if (anexos) {
    anexos.annexResponsibles = filtrar(
      anexos.annexResponsibles,
      (responsable) => responsable.typeId !== "",
      (responsable) => responsable.name,
      "Responsables de la ficha",
    );
  }
}

/**
 * Convierte los apartados extraídos de la ficha MINTUR en el contenido que
 * guarda la API para cada apartado del asistente. Las opciones se buscan en
 * los catálogos por nombre; lo que no coincide se conserva como texto libre
 * salvo en los bloques que publicar exige catalogados (ver `depurarParaPublicar`)
 * (la API acepta tipo catalogado o descripción manual), nunca se descarta.
 */
export function mapearSeccionesImportadas(
  ficha: Ficha,
  catalogos: AdminCatalogs,
  resueltos: CatalogosResueltos,
): { secciones: SeccionesImportadas; advertencias: string[] } {
  const advertencias: string[] = [];
  const valores: Partial<Record<CenterSectionCode, SectionFormValues>> = {
    accesibilidad: accesibilidad(ficha, catalogos, resueltos),
    planta: planta(ficha, catalogos),
    conservacion: conservacion(ficha, catalogos),
    "higiene-seguridad": higiene(ficha, catalogos),
    politicas: politicas(ficha),
    promocion: promocion(ficha, catalogos),
    visitantes: visitantes(ficha),
    "recurso-humano": recursoHumano(ficha, catalogos),
    anexos: anexos(ficha, catalogos),
  };
  depurarParaPublicar(valores, advertencias);
  const secciones: SeccionesImportadas = Object.fromEntries(
    Object.entries(valores).map(([code, values]) => [
      code,
      toSectionContent(code as CenterSectionCode, values),
    ]),
  );
  return { secciones, advertencias };
}
