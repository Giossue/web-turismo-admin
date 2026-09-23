import type { z } from "zod";

import type {
  fichaComponenteConservacionSchema,
  fichaConservacionSchema,
  fichaEstadoConservacionSchema,
  fichaFactorAlteracionSchema,
} from "./validacion";

/** Mismos códigos que valida la API para `conservation.*.state` (`ConservationState`). */
export type FichaEstadoConservacion = z.infer<typeof fichaEstadoConservacionSchema>;
export type FichaFactorAlteracion = z.infer<typeof fichaFactorAlteracionSchema>;
export type FichaComponenteConservacion = z.infer<
  typeof fichaComponenteConservacionSchema
>;
export type FichaConservacion = z.infer<typeof fichaConservacionSchema>;
