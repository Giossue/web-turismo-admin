import { z } from "zod";

/**
 * Valida la forma del resultado del parser antes de que cruce el límite del
 * Route Handler hacia el cliente. Esto es una red de seguridad de
 * serialización (defensa en profundidad), no un reemplazo de los tipos de
 * TypeScript que ya garantiza `parsearFicha` — si algún día el parser
 * devuelve algo con una forma distinta por un bug, esto lo convierte en un
 * error 500 explícito en vez de sacar datos silenciosamente malformados.
 */
const advertenciaSchema = z.object({
  crudo: z.string(),
  advertencia: z.string().nullable(),
});

const valorCrudoSchema = z.object({ texto: z.string().nullable() });

export const resultadoParseoFichaSchema = z.object({
  datos: z.object({
    identificacion: z.object({
      nombre: z.string().nullable(),
      categoria: valorCrudoSchema,
      tipo: valorCrudoSchema,
      subtipo: valorCrudoSchema,
      codigoAtractivo: z.string().nullable(),
    }),
    ubicacion: z.object({
      provincia: valorCrudoSchema,
      canton: valorCrudoSchema,
      parroquia: valorCrudoSchema,
      barrioSectorComuna: z.string().nullable(),
      callePrincipal: z.string().nullable(),
      numero: z.string().nullable(),
      calleTransversal: z.string().nullable(),
      latitud: z.object({
        crudo: z.string(),
        valor: z.number().nullable(),
        advertencia: z.string().nullable(),
      }),
      longitud: z.object({
        crudo: z.string(),
        valor: z.number().nullable(),
        advertencia: z.string().nullable(),
      }),
      altitudMsnm: z.number().nullable(),
      administracion: z.object({
        tipo: z.string().nullable(),
        institucion: z.string().nullable(),
        nombre: z.string().nullable(),
        cargo: z.string().nullable(),
        telefono: z.string().nullable(),
        email: z.string().nullable(),
        observacion: z.string().nullable(),
      }),
    }),
    caracteristicas: z.object({
      clima: z.object({
        texto: z.string().nullable(),
        temperaturaMinC: z.number().nullable(),
        temperaturaMaxC: z.number().nullable(),
        precipitacionMinMm: z.number().nullable(),
        precipitacionMaxMm: z.number().nullable(),
      }),
      lineaProducto: z.object({
        valor: z.string().nullable(),
        advertencia: z.string().nullable(),
      }),
      escenario: z.object({
        valor: z.string().nullable(),
        advertencia: z.string().nullable(),
      }),
      ingreso: z.object({
        tipoSeleccionado: z.object({
          valor: z.string().nullable(),
          advertencia: z.string().nullable(),
        }),
        horarios: z.array(
          z.object({
            tipo: z.string(),
            horaIngreso: z.string().nullable(),
            horaSalida: z.string().nullable(),
          }),
        ),
        manejaReservas: z.boolean().nullable(),
        formasPago: z.array(z.string()),
        precioDesde: z.number().nullable(),
        precioHasta: z.number().nullable(),
        mesesRecomendados: z.string().nullable(),
        observacion: z.string().nullable(),
      }),
    }),
    accesoConectividad: z.object({
      ciudadPobladoCercano: z.string().nullable(),
      distanciaKm: z.number().nullable(),
      tiempoAutoHoras: z.string().nullable(),
      coordenadas: z
        .object({ crudo: z.string(), advertencia: z.string().nullable() })
        .nullable(),
      viasTerrestres: z.array(
        z.object({
          orden: z.string(),
          coordenadaInicio: advertenciaSchema,
          coordenadaFin: advertenciaSchema,
          distanciaKm: z.number().nullable(),
          tipoMaterial: z.string().nullable(),
          estado: z.string().nullable(),
        }),
      ),
      transporteTipos: z.array(z.string()),
      transporteDetalle: z.array(
        z.object({
          nombre: z.string(),
          estacionTerminal: z.string().nullable(),
          frecuencia: z.string().nullable(),
          detalleTraslado: z.string().nullable(),
        }),
      ),
      accesibilidadGeneral: z.record(z.string(), z.string().nullable()),
      senalizacionAproximacionEstado: z.string().nullable(),
    }),
    descripcion: z.string().nullable(),
    responsables: z.object({
      elaborado: z.object({
        nombre: z.string().nullable(),
        institucion: z.string().nullable(),
        cargo: z.string().nullable(),
        email: z.string().nullable(),
        telefono: z.string().nullable(),
        fecha: z.string().nullable(),
      }),
      validado: z.any(),
      aprobado: z.any(),
    }),
    resumenValoracion: z.object({
      criterios: z.array(
        z.object({
          codigo: z.string(),
          nombre: z.string(),
          puntajeMaximo: z.number(),
          resultado: z.number().nullable(),
        }),
      ),
      totalInformativo: z.number().nullable(),
    }),
    accesibilidadDetalle: z.array(
      z.object({
        grupo: z.string(),
        criterio: z.string(),
        respuesta: z.string().nullable(),
        observacion: z.string().nullable(),
      }),
    ),
    imagenes: z.array(
      z.object({ archivo: z.string(), extension: z.string(), tamanoBytes: z.number() }),
    ),
    politicas: z.array(
      z.object({
        codigo: z.string(),
        pregunta: z.string(),
        respuesta: z.string().nullable(),
        anioElaboracion: z.number().nullable(),
        especifique: z.string().nullable(),
      }),
    ),
    actividades: z.array(z.object({ nombre: z.string(), marcada: z.boolean() })),
    promocion: z.object({
      tienePlanPromocionCantonal: z.string().nullable(),
      incluidoEnPlan: z.string().nullable(),
      medios: z.array(
        z.object({
          nombre: z.string(),
          valor: z.string().nullable(),
          periodicidad: z.string().nullable(),
        }),
      ),
      observacionMedios: z.string().nullable(),
      formaPartePaquete: z.string().nullable(),
      detallePaquete: z.string().nullable(),
      observacion: z.string().nullable(),
    }),
    visitantes: z.object({
      poseeRegistro: z.string().nullable(),
      tipoRegistro: z.string().nullable(),
      aniosRegistro: z.number().nullable(),
      generaReportes: z.string().nullable(),
      frecuenciaReportes: z.string().nullable(),
      temporadaAlta: z.object({
        marcada: z.boolean(),
        meses: z.string().nullable(),
        visitantes: z.number().nullable(),
      }),
      temporadaBaja: z.object({
        marcada: z.boolean(),
        meses: z.string().nullable(),
        visitantes: z.number().nullable(),
      }),
      llegadaNacional: z.array(
        z.object({
          ciudad: z.string(),
          llegadasMensuales: z.number().nullable(),
          totalAnual: z.number().nullable(),
        }),
      ),
      llegadaExtranjera: z.array(
        z.object({
          pais: z.string(),
          llegadasMensuales: z.number().nullable(),
          totalAnual: z.number().nullable(),
        }),
      ),
      observacionLlegadas: z.string().nullable(),
      informanteClave: z.object({
        nombre: z.string().nullable(),
        contacto: z.string().nullable(),
      }),
      observacion: z.string().nullable(),
    }),
    recursoHumano: z.object({
      personasAdministracionOperacion: z.number().nullable(),
      personasEspecializadasTurismo: z.number().nullable(),
      formacion: z.array(
        z.object({
          grupo: z.string(),
          nombre: z.string(),
          cantidad: z.number().nullable(),
          detalleOtro: z.string().nullable(),
        }),
      ),
      observacion: z.string().nullable(),
    }),
    pendientes: z.record(z.string(), z.null()),
  }),
  advertencias: z.array(z.string()),
  imagenes: z.array(
    z.object({ archivo: z.string(), extension: z.string(), tamanoBytes: z.number() }),
  ),
});

export type ResultadoParseoFichaValidado = z.infer<typeof resultadoParseoFichaSchema>;
