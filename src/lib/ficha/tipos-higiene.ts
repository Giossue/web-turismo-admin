import type { z } from "zod";

import type {
  fichaAmenazaSchema,
  fichaHigieneSeguridadSchema,
  fichaRadioPortatilSchema,
  fichaSenaleticaItemSchema,
  fichaServicioBasicoSchema,
  fichaServicioSaludSchema,
  fichaServicioSeguridadSchema,
  fichaTelefoniaInternetSchema,
} from "./validacion";

export type FichaServicioBasico = z.infer<typeof fichaServicioBasicoSchema>;
export type FichaSenaleticaItem = z.infer<typeof fichaSenaleticaItemSchema>;
export type FichaServicioSalud = z.infer<typeof fichaServicioSaludSchema>;
export type FichaServicioSeguridad = z.infer<typeof fichaServicioSeguridadSchema>;
export type FichaTelefoniaInternet = z.infer<typeof fichaTelefoniaInternetSchema>;
export type FichaRadioPortatil = z.infer<typeof fichaRadioPortatilSchema>;
export type FichaAmenaza = z.infer<typeof fichaAmenazaSchema>;
export type FichaHigieneSeguridad = z.infer<typeof fichaHigieneSeguridadSchema>;
