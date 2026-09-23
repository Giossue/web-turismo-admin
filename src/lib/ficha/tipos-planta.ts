import type { z } from "zod";

import type {
  fichaFacilidadEntornoSchema,
  fichaGuiaTuristicaSchema,
  fichaPlantaConteoSchema,
  fichaPlantaSchema,
  fichaServicioComplementarioSchema,
} from "./validacion";

export type FichaPlantaConteo = z.infer<typeof fichaPlantaConteoSchema>;
export type FichaGuiaTuristica = z.infer<typeof fichaGuiaTuristicaSchema>;
export type FichaFacilidadEntorno = z.infer<typeof fichaFacilidadEntornoSchema>;
export type FichaServicioComplementario = z.infer<
  typeof fichaServicioComplementarioSchema
>;
export type FichaPlanta = z.infer<typeof fichaPlantaSchema>;
