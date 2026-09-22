export type FichaPlantaConteo = {
  nombre: string;
  establecimientosAtractivo: number | null;
  segundaMetricaAtractivo: number | null;
  terceraMetricaAtractivo: number | null;
  establecimientosCiudad: number | null;
  segundaMetricaCiudad: number | null;
  terceraMetricaCiudad: number | null;
};

export type FichaGuiaTuristica = {
  local: { atractivo: number | null; ciudad: number | null };
  nacional: { atractivo: number | null; ciudad: number | null };
  nacionalEspecializado: { atractivo: number | null; ciudad: number | null };
  cultura: { atractivo: number | null; ciudad: number | null };
  aventura: { atractivo: number | null; ciudad: number | null };
};

export type FichaFacilidadEntorno = {
  categoria: string;
  nombre: string;
  cantidad: number | null;
  coordenadas: { crudo: string; advertencia: string | null } | null;
  administrador: string | null;
  accesibilidadUniversal: boolean | null;
  estado: "BUENO" | "REGULAR" | "MALO" | null;
};

export type FichaServicioComplementario = {
  nombre: string;
  enAtractivo: boolean;
  enCiudad: boolean;
};

export type FichaPlanta = {
  alojamiento: FichaPlantaConteo[];
  alimentosBebidas: FichaPlantaConteo[];
  agenciasViaje: FichaPlantaConteo[];
  guia: FichaGuiaTuristica;
  observacionPlantaAtractivo: string | null;
  observacionPlantaCiudad: string | null;
  facilidadesEntorno: FichaFacilidadEntorno[];
  observacionFacilidades: string | null;
  complementarios: FichaServicioComplementario[];
  observacionComplementarios: string | null;
};
