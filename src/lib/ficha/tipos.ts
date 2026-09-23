import type { z } from "zod";

import type {
  fichaAccesibilidadDetalleItemSchema,
  fichaAccesoConectividadSchema,
  fichaActividadSchema,
  fichaCaracteristicasSchema,
  fichaCooperativaTransporteSchema,
  fichaExtraidaSchema,
  fichaFormacionPersonalSchema,
  fichaIdentificacionSchema,
  fichaImagenAnexoSchema,
  fichaIngresoSchema,
  fichaPoliticaSchema,
  fichaPromocionSchema,
  fichaRecursoHumanoSchema,
  fichaResponsableFirmaSchema,
  fichaResumenValoracionSchema,
  fichaUbicacionSchema,
  fichaViaTerrestreSchema,
  fichaVisitantesSchema,
  resultadoParseoFichaSchema,
} from "./validacion";

// Los tipos de la ficha se derivan de los esquemas de `validacion.ts`, que
// son la fuente única de su forma.

export type FichaIdentificacion = z.infer<typeof fichaIdentificacionSchema>;
export type FichaUbicacion = z.infer<typeof fichaUbicacionSchema>;
export type FichaIngreso = z.infer<typeof fichaIngresoSchema>;
export type FichaCaracteristicas = z.infer<typeof fichaCaracteristicasSchema>;
export type FichaCooperativaTransporte = z.infer<typeof fichaCooperativaTransporteSchema>;
export type FichaViaTerrestre = z.infer<typeof fichaViaTerrestreSchema>;
export type FichaAccesoConectividad = z.infer<typeof fichaAccesoConectividadSchema>;
export type FichaResponsableFirma = z.infer<typeof fichaResponsableFirmaSchema>;
export type FichaResumenValoracion = z.infer<typeof fichaResumenValoracionSchema>;
export type FichaAccesibilidadDetalleItem = z.infer<
  typeof fichaAccesibilidadDetalleItemSchema
>;
export type FichaImagenAnexo = z.infer<typeof fichaImagenAnexoSchema>;
export type FichaPolitica = z.infer<typeof fichaPoliticaSchema>;
export type FichaFormacionPersonal = z.infer<typeof fichaFormacionPersonalSchema>;
export type FichaRecursoHumano = z.infer<typeof fichaRecursoHumanoSchema>;
export type FichaPromocion = z.infer<typeof fichaPromocionSchema>;
export type FichaActividad = z.infer<typeof fichaActividadSchema>;
export type FichaVisitantes = z.infer<typeof fichaVisitantesSchema>;
export type FichaExtraida = z.infer<typeof fichaExtraidaSchema>;
export type ResultadoParseoFicha = z.infer<typeof resultadoParseoFichaSchema>;
