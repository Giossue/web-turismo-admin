import { z } from "zod";

import {
  CONSERVATION_STATE_OPTIONS,
  SECTION_RESPONSE_OPTIONS,
} from "@/lib/center-sections/options";

/**
 * Esquemas del resultado del parser de fichas MINTUR. Son la fuente única de
 * los tipos (`tipos*.ts` los derivan con `z.infer`) y, en el Route Handler,
 * una red de seguridad de serialización: si algún día el parser devuelve algo
 * con una forma distinta por un bug, la ruta responde un 500 explícito en vez
 * de enviar datos silenciosamente malformados.
 */

const texto = z.string().nullable();
const numero = z.number().nullable();
const siNo = z.enum(["SI", "NO"]).nullable();
const estadoFisico = z.enum(["BUENO", "REGULAR", "MALO"]).nullable();
const conSeleccion = <T extends z.ZodType>(valor: T) =>
  z.object({ valor: valor.nullable(), advertencia: texto });

const respuestaSeccionSchema = z.enum(
  SECTION_RESPONSE_OPTIONS.map((option) => option.value),
);

const coordenadaCruda = z.object({ crudo: z.string(), advertencia: texto });
const coordenadaParseada = z.object({
  crudo: z.string(),
  valor: numero,
  advertencia: texto,
});
const valorCrudo = z.object({ texto });

// --- Identificación y ubicación ---

export const fichaIdentificacionSchema = z.object({
  nombre: texto,
  categoria: valorCrudo,
  tipo: valorCrudo,
  subtipo: valorCrudo,
  codigoAtractivo: texto,
});

export const fichaUbicacionSchema = z.object({
  provincia: valorCrudo,
  canton: valorCrudo,
  parroquia: valorCrudo,
  barrioSectorComuna: texto,
  callePrincipal: texto,
  numero: texto,
  calleTransversal: texto,
  latitud: coordenadaParseada,
  longitud: coordenadaParseada,
  altitudMsnm: numero,
  administracion: z.object({
    tipo: texto,
    institucion: texto,
    nombre: texto,
    cargo: texto,
    telefono: texto,
    email: texto,
    observacion: texto,
  }),
});

// --- Características e ingreso ---

const tipoIngreso = z.enum(["LIBRE", "RESTRINGIDO", "PAGADO"]);

export const fichaIngresoSchema = z.object({
  tipoSeleccionado: conSeleccion(tipoIngreso),
  horarios: z.array(
    z.object({ tipo: tipoIngreso, horaIngreso: texto, horaSalida: texto }),
  ),
  manejaReservas: z.boolean().nullable(),
  formasPago: z.array(z.string()),
  precioDesde: numero,
  precioHasta: numero,
  mesesRecomendados: texto,
  observacion: texto,
});

export const fichaCaracteristicasSchema = z.object({
  clima: z.object({
    texto,
    temperaturaMinC: numero,
    temperaturaMaxC: numero,
    precipitacionMinMm: numero,
    precipitacionMaxMm: numero,
  }),
  lineaProducto: conSeleccion(z.enum(["CULTURA", "NATURALEZA", "AVENTURA"])),
  escenario: conSeleccion(
    z.enum(["PRISTINO", "PRIMITIVO", "RUSTICO_NATURAL", "RURAL", "URBANO"]),
  ),
  ingreso: fichaIngresoSchema,
});

// --- Acceso y conectividad ---

export const fichaCooperativaTransporteSchema = z.object({
  nombre: z.string(),
  estacionTerminal: texto,
  frecuencia: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "EVENTUAL"]).nullable(),
  detalleTraslado: texto,
});

export const fichaViaTerrestreSchema = z.object({
  orden: z.enum(["PRIMER_ORDEN", "SEGUNDO_ORDEN", "TERCER_ORDEN"]),
  coordenadaInicio: coordenadaCruda,
  coordenadaFin: coordenadaCruda,
  distanciaKm: numero,
  tipoMaterial: texto,
  estado: texto,
});

export const fichaAccesoConectividadSchema = z.object({
  ciudadPobladoCercano: texto,
  distanciaKm: numero,
  tiempoAutoHoras: texto,
  coordenadas: coordenadaCruda.nullable(),
  viasTerrestres: z.array(fichaViaTerrestreSchema),
  transporteTipos: z.array(z.string()),
  transporteDetalle: z.array(fichaCooperativaTransporteSchema),
  accesibilidadGeneral: z.record(z.string(), respuestaSeccionSchema.nullable()),
  senalizacionAproximacionEstado: estadoFisico,
});

// --- Responsables, valoración, accesibilidad detallada e imágenes ---

export const fichaResponsableFirmaSchema = z.object({
  nombre: texto,
  institucion: texto,
  cargo: texto,
  email: texto,
  telefono: texto,
  fecha: texto,
});

export const fichaResumenValoracionSchema = z.object({
  criterios: z.array(
    z.object({
      codigo: z.string(),
      nombre: z.string(),
      puntajeMaximo: z.number(),
      resultado: numero,
    }),
  ),
  /** Solo informativo — nunca se persiste. El API recalcula el puntaje real. */
  totalInformativo: numero,
});

export const fichaAccesibilidadDetalleItemSchema = z.object({
  grupo: z.string(),
  criterio: z.string(),
  respuesta: siNo,
  observacion: texto,
});

export const fichaImagenAnexoSchema = z.object({
  archivo: z.string(),
  extension: z.string(),
  tamanoBytes: z.number(),
});

export const fichaImagenAdjuntaSchema = z.object({
  nombre: z.string(),
  extension: z.enum(["png", "jpeg"]),
  mimeType: z.enum(["image/png", "image/jpeg"]),
  tamanoBytes: z.number().int().positive(),
  contenidoBase64: z.string().min(1),
});

// --- Políticas, actividades, promoción, visitantes y recurso humano ---

export const fichaPoliticaSchema = z.object({
  codigo: z.string(),
  pregunta: z.string(),
  respuesta: siNo,
  anioElaboracion: numero,
  especifique: texto,
});

export const fichaActividadSchema = z.object({
  nombre: z.string(),
  marcada: z.boolean(),
});

export const fichaPromocionSchema = z.object({
  tienePlanPromocionCantonal: siNo,
  incluidoEnPlan: siNo,
  medios: z.array(z.object({ nombre: z.string(), valor: texto, periodicidad: texto })),
  observacionMedios: texto,
  formaPartePaquete: siNo,
  detallePaquete: texto,
  observacion: texto,
});

const temporada = z.object({ marcada: z.boolean(), meses: texto, visitantes: numero });

export const fichaVisitantesSchema = z.object({
  poseeRegistro: siNo,
  tipoRegistro: z.enum(["DIGITAL", "PAPEL"]).nullable(),
  aniosRegistro: numero,
  generaReportes: siNo,
  frecuenciaReportes: texto,
  temporadaAlta: temporada,
  temporadaBaja: temporada,
  llegadaNacional: z.array(
    z.object({ ciudad: z.string(), llegadasMensuales: numero, totalAnual: numero }),
  ),
  llegadaExtranjera: z.array(
    z.object({ pais: z.string(), llegadasMensuales: numero, totalAnual: numero }),
  ),
  observacionLlegadas: texto,
  informanteClave: z.object({ nombre: texto, contacto: texto }),
  observacion: texto,
});

export const fichaFormacionPersonalSchema = z.object({
  grupo: z.enum(["EDUCACION", "CAPACITACION", "IDIOMA"]),
  nombre: z.string(),
  cantidad: numero,
  detalleOtro: texto,
});

export const fichaRecursoHumanoSchema = z.object({
  personasAdministracionOperacion: numero,
  personasEspecializadasTurismo: numero,
  formacion: z.array(fichaFormacionPersonalSchema),
  observacion: texto,
});

// --- Planta turística ---

export const fichaPlantaConteoSchema = z.object({
  nombre: z.string(),
  establecimientosAtractivo: numero,
  segundaMetricaAtractivo: numero,
  terceraMetricaAtractivo: numero,
  establecimientosCiudad: numero,
  segundaMetricaCiudad: numero,
  terceraMetricaCiudad: numero,
});

const guiaMetrica = z.object({ atractivo: numero, ciudad: numero });

export const fichaGuiaTuristicaSchema = z.object({
  local: guiaMetrica,
  nacional: guiaMetrica,
  nacionalEspecializado: guiaMetrica,
  cultura: guiaMetrica,
  aventura: guiaMetrica,
});

export const fichaFacilidadEntornoSchema = z.object({
  categoria: z.string(),
  nombre: z.string(),
  cantidad: numero,
  coordenadas: coordenadaCruda.nullable(),
  administrador: texto,
  accesibilidadUniversal: z.boolean().nullable(),
  estado: estadoFisico,
});

export const fichaServicioComplementarioSchema = z.object({
  nombre: z.string(),
  enAtractivo: z.boolean(),
  enCiudad: z.boolean(),
});

export const fichaPlantaSchema = z.object({
  alojamiento: z.array(fichaPlantaConteoSchema),
  alimentosBebidas: z.array(fichaPlantaConteoSchema),
  agenciasViaje: z.array(fichaPlantaConteoSchema),
  guia: fichaGuiaTuristicaSchema,
  observacionPlantaAtractivo: texto,
  observacionPlantaCiudad: texto,
  facilidadesEntorno: z.array(fichaFacilidadEntornoSchema),
  observacionFacilidades: texto,
  complementarios: z.array(fichaServicioComplementarioSchema),
  observacionComplementarios: texto,
});

// --- Conservación ---

/** Mismos códigos que valida la API para `conservation.*.state`. */
export const fichaEstadoConservacionSchema = z.enum(
  CONSERVATION_STATE_OPTIONS.map((option) => option.value),
);

export const fichaFactorAlteracionSchema = z.object({
  origen: z.enum(["NATURAL", "ANTROPICO"]),
  nombre: z.string(),
  marcado: z.boolean(),
});

export const fichaComponenteConservacionSchema = z.object({
  estado: fichaEstadoConservacionSchema.nullable(),
  observacionEstado: texto,
  factores: z.array(fichaFactorAlteracionSchema),
  otroDetalle: texto,
  observacionFactores: texto,
});

export const fichaConservacionSchema = z.object({
  atractivo: fichaComponenteConservacionSchema,
  entorno: fichaComponenteConservacionSchema,
  declaratoria: z.object({
    declarante: texto,
    denominacion: texto,
    fechaDeclaracion: texto,
    alcance: texto,
    observacion: texto,
  }),
});

// --- Higiene y seguridad ---

export const fichaServicioBasicoSchema = z.object({
  tipo: z.enum(["AGUA", "ENERGIA_ELECTRICA", "SANEAMIENTO", "DISPOSICION_DESECHOS"]),
  valorAtractivo: texto,
  proveedorAtractivo: texto,
  valorCiudad: texto,
  proveedorCiudad: texto,
});

export const fichaSenaleticaItemSchema = z.object({
  ambiente: z.enum([
    "AREAS_URBANAS",
    "AREAS_NATURALES",
    "LETREROS_INFORMATIVOS",
    "SENALETICA_SEGURIDAD",
  ]),
  nombre: z.string(),
  cantidadMadera: numero,
  cantidadAluminio: numero,
  cantidadOtro: numero,
  especifiqueOtro: texto,
  estado: estadoFisico,
});

export const fichaServicioSaludSchema = z.object({
  nombre: z.string(),
  cantidadAtractivo: numero,
  cantidadCiudad: numero,
});

export const fichaServicioSeguridadSchema = z.object({
  nombre: z.string(),
  detalle: texto,
});

export const fichaTelefoniaInternetSchema = z.object({
  scope: z.enum(["ATRACTIVO", "CIUDAD"]),
  fija: z.boolean(),
  movil: z.boolean(),
  satelital: z.boolean(),
  lineaTelefonica: z.boolean(),
  satelite: z.boolean(),
  telefoniaMovil: z.boolean(),
  fibraOptica: z.boolean(),
  redesInalambricas: z.boolean(),
});

export const fichaRadioPortatilSchema = z.object({
  usoVisitante: z.boolean(),
  usoInterno: z.boolean(),
  usoEmergencia: z.boolean(),
});

export const fichaAmenazaSchema = z.object({ nombre: z.string(), marcada: z.boolean() });

export const fichaHigieneSeguridadSchema = z.object({
  serviciosBasicos: z.array(fichaServicioBasicoSchema),
  observacionServiciosBasicos: texto,
  senaletica: z.array(fichaSenaleticaItemSchema),
  observacionSenaletica: texto,
  salud: z.array(fichaServicioSaludSchema),
  observacionSalud: texto,
  seguridad: z.array(fichaServicioSeguridadSchema),
  observacionSeguridad: texto,
  telefoniaInternet: z.array(fichaTelefoniaInternetSchema),
  observacionComunicacion: texto,
  radioPortatil: fichaRadioPortatilSchema,
  observacionRadioPortatil: texto,
  amenazas: z.array(fichaAmenazaSchema),
  contingencia: z.object({
    existe: z.boolean(),
    institucion: texto,
    nombreDocumento: texto,
    anioElaboracion: numero,
  }),
  observacionMultiamenazas: texto,
});

// --- Ficha completa ---

/**
 * Secciones extraídas con el mismo rigor de verificación que el resto del
 * parser (coordenadas confirmadas contra el archivo real, con pruebas).
 */
export const fichaExtraidaSchema = z.object({
  identificacion: fichaIdentificacionSchema,
  ubicacion: fichaUbicacionSchema,
  caracteristicas: fichaCaracteristicasSchema,
  accesoConectividad: fichaAccesoConectividadSchema,
  descripcion: texto,
  responsables: z.object({
    elaborado: fichaResponsableFirmaSchema,
    validado: fichaResponsableFirmaSchema,
    aprobado: fichaResponsableFirmaSchema,
  }),
  resumenValoracion: fichaResumenValoracionSchema,
  accesibilidadDetalle: z.array(fichaAccesibilidadDetalleItemSchema),
  imagenes: z.array(fichaImagenAnexoSchema),
  politicas: z.array(fichaPoliticaSchema),
  actividades: z.array(fichaActividadSchema),
  promocion: fichaPromocionSchema,
  visitantes: fichaVisitantesSchema,
  recursoHumano: fichaRecursoHumanoSchema,
  planta: fichaPlantaSchema,
  conservacion: fichaConservacionSchema,
  higieneSeguridad: fichaHigieneSeguridadSchema,
});

export const resultadoParseoFichaSchema = z.object({
  datos: fichaExtraidaSchema,
  advertencias: z.array(z.string()),
  imagenesAdjuntas: z.array(fichaImagenAdjuntaSchema),
});
