export type FichaEstadoConservacion =
  "CONSERVADO" | "ALTERADO" | "EN_PROCESO_DETERIORO" | "DETERIORADO";

export type FichaFactorAlteracion = {
  origen: "NATURAL" | "ANTROPICO";
  nombre: string;
  marcado: boolean;
};

export type FichaComponenteConservacion = {
  estado: FichaEstadoConservacion | null;
  observacionEstado: string | null;
  factores: FichaFactorAlteracion[];
  otroDetalle: string | null;
  observacionFactores: string | null;
};

export type FichaDeclaratoria = {
  declarante: string | null;
  denominacion: string | null;
  fechaDeclaracion: string | null;
  alcance: string | null;
  observacion: string | null;
};

export type FichaConservacion = {
  atractivo: FichaComponenteConservacion;
  entorno: FichaComponenteConservacion;
  declaratoria: FichaDeclaratoria;
};
