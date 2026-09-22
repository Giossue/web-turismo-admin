import type { RespuestaSeccion } from "./checkbox";
import type { FichaConservacion } from "./tipos-conservacion";
import type { FichaPlanta } from "./tipos-planta";

/** Un valor de catálogo leído de la ficha, aún sin resolver contra la base. */
export type ValorCrudo = {
  texto: string | null;
};

export type FichaIdentificacion = {
  nombre: string | null;
  categoria: ValorCrudo;
  tipo: ValorCrudo;
  subtipo: ValorCrudo;
  codigoAtractivo: string | null;
};

export type FichaAdministracion = {
  tipo: string | null;
  institucion: string | null;
  nombre: string | null;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  observacion: string | null;
};

export type FichaUbicacion = {
  provincia: ValorCrudo;
  canton: ValorCrudo;
  parroquia: ValorCrudo;
  barrioSectorComuna: string | null;
  callePrincipal: string | null;
  numero: string | null;
  calleTransversal: string | null;
  latitud: { crudo: string; valor: number | null; advertencia: string | null };
  longitud: { crudo: string; valor: number | null; advertencia: string | null };
  altitudMsnm: number | null;
  administracion: FichaAdministracion;
};

export type FichaClima = {
  texto: string | null;
  temperaturaMinC: number | null;
  temperaturaMaxC: number | null;
  precipitacionMinMm: number | null;
  precipitacionMaxMm: number | null;
};

export type FichaIngresoHorario = {
  tipo: "LIBRE" | "RESTRINGIDO" | "PAGADO";
  horaIngreso: string | null;
  horaSalida: string | null;
};

export type FichaIngreso = {
  tipoSeleccionado: {
    valor: "LIBRE" | "RESTRINGIDO" | "PAGADO" | null;
    advertencia: string | null;
  };
  horarios: FichaIngresoHorario[];
  manejaReservas: boolean | null;
  formasPago: string[];
  precioDesde: number | null;
  precioHasta: number | null;
  mesesRecomendados: string | null;
  observacion: string | null;
};

export type FichaCaracteristicas = {
  clima: FichaClima;
  lineaProducto: {
    valor: "CULTURA" | "NATURALEZA" | "AVENTURA" | null;
    advertencia: string | null;
  };
  escenario: {
    valor: "PRISTINO" | "PRIMITIVO" | "RUSTICO_NATURAL" | "RURAL" | "URBANO" | null;
    advertencia: string | null;
  };
  ingreso: FichaIngreso;
};

export type FichaCooperativaTransporte = {
  nombre: string;
  estacionTerminal: string | null;
  frecuencia: "DIARIA" | "SEMANAL" | "MENSUAL" | "EVENTUAL" | null;
  detalleTraslado: string | null;
};

export type FichaViaTerrestre = {
  orden: "PRIMER_ORDEN" | "SEGUNDO_ORDEN" | "TERCER_ORDEN";
  coordenadaInicio: { crudo: string; advertencia: string | null };
  coordenadaFin: { crudo: string; advertencia: string | null };
  distanciaKm: number | null;
  tipoMaterial: string | null;
  estado: string | null;
};

export type FichaAccesoConectividad = {
  ciudadPobladoCercano: string | null;
  distanciaKm: number | null;
  tiempoAutoHoras: string | null;
  coordenadas: { crudo: string; advertencia: string | null } | null;
  viasTerrestres: FichaViaTerrestre[];
  transporteTipos: string[];
  transporteDetalle: FichaCooperativaTransporte[];
  accesibilidadGeneral: Record<string, RespuestaSeccion | null>;
  senalizacionAproximacionEstado: "BUENO" | "REGULAR" | "MALO" | null;
};

export type FichaResponsableFirma = {
  nombre: string | null;
  institucion: string | null;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
  fecha: string | null;
};

export type FichaCriterioValoracion = {
  codigo: string;
  nombre: string;
  puntajeMaximo: number;
  resultado: number | null;
};

export type FichaResumenValoracion = {
  criterios: FichaCriterioValoracion[];
  /** Solo informativo — nunca se persiste. El API recalcula el puntaje real. */
  totalInformativo: number | null;
};

export type FichaAccesibilidadDetalleItem = {
  grupo: string;
  criterio: string;
  respuesta: "SI" | "NO" | null;
  observacion: string | null;
};

export type FichaImagenAnexo = {
  archivo: string;
  extension: string;
  tamanoBytes: number;
};

export type FichaPolitica = {
  codigo: string;
  pregunta: string;
  respuesta: "SI" | "NO" | null;
  anioElaboracion: number | null;
  especifique: string | null;
};

export type FichaFormacionPersonal = {
  grupo: "EDUCACION" | "CAPACITACION" | "IDIOMA";
  nombre: string;
  cantidad: number | null;
  detalleOtro: string | null;
};

export type FichaRecursoHumano = {
  personasAdministracionOperacion: number | null;
  personasEspecializadasTurismo: number | null;
  formacion: FichaFormacionPersonal[];
  observacion: string | null;
};

export type FichaMedioPromocion = {
  nombre: string;
  valor: string | null;
  periodicidad: string | null;
};

export type FichaPromocion = {
  tienePlanPromocionCantonal: "SI" | "NO" | null;
  incluidoEnPlan: "SI" | "NO" | null;
  medios: FichaMedioPromocion[];
  observacionMedios: string | null;
  formaPartePaquete: "SI" | "NO" | null;
  detallePaquete: string | null;
  observacion: string | null;
};

export type FichaActividad = {
  nombre: string;
  marcada: boolean;
};

export type FichaVisitantes = {
  poseeRegistro: "SI" | "NO" | null;
  tipoRegistro: "DIGITAL" | "PAPEL" | null;
  aniosRegistro: number | null;
  generaReportes: "SI" | "NO" | null;
  frecuenciaReportes: string | null;
  temporadaAlta: { marcada: boolean; meses: string | null; visitantes: number | null };
  temporadaBaja: { marcada: boolean; meses: string | null; visitantes: number | null };
  llegadaNacional: Array<{
    ciudad: string;
    llegadasMensuales: number | null;
    totalAnual: number | null;
  }>;
  llegadaExtranjera: Array<{
    pais: string;
    llegadasMensuales: number | null;
    totalAnual: number | null;
  }>;
  observacionLlegadas: string | null;
  informanteClave: { nombre: string | null; contacto: string | null };
  observacion: string | null;
};

/**
 * Secciones extraídas con el mismo rigor de verificación que el resto del
 * parser (coordenadas confirmadas contra el archivo real, con pruebas).
 */
export type FichaExtraida = {
  identificacion: FichaIdentificacion;
  ubicacion: FichaUbicacion;
  caracteristicas: FichaCaracteristicas;
  accesoConectividad: FichaAccesoConectividad;
  descripcion: string | null;
  responsables: {
    elaborado: FichaResponsableFirma;
    validado: FichaResponsableFirma;
    aprobado: FichaResponsableFirma;
  };
  resumenValoracion: FichaResumenValoracion;
  accesibilidadDetalle: FichaAccesibilidadDetalleItem[];
  imagenes: FichaImagenAnexo[];
  politicas: FichaPolitica[];
  actividades: FichaActividad[];
  promocion: FichaPromocion;
  visitantes: FichaVisitantes;
  recursoHumano: FichaRecursoHumano;
  planta: FichaPlanta;
  conservacion: FichaConservacion;
  /**
   * Secciones cuyo mapeo de celdas ya está documentado en
   * docs/plans/active/importar-ficha-mintur.md (sección 3) pero cuya
   * extracción todavía no se implementó con el mismo nivel de verificación
   * que las de arriba — higiene-seguridad. Queda en `null` intencionalmente;
   * no se debe inferir "vacío en la ficha" de un `null` aquí, sino "todavía
   * no implementado".
   */
  pendientes: {
    higieneSeguridad: null;
  };
};

export type ResultadoParseoFicha = {
  datos: FichaExtraida;
  advertencias: string[];
  imagenes: FichaImagenAnexo[];
};
