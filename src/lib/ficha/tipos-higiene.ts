export type FichaServicioBasico = {
  tipo: "AGUA" | "ENERGIA_ELECTRICA" | "SANEAMIENTO" | "DISPOSICION_DESECHOS";
  valorAtractivo: string | null;
  proveedorAtractivo: string | null;
  valorCiudad: string | null;
  proveedorCiudad: string | null;
};

export type FichaSenaleticaItem = {
  ambiente:
    | "AREAS_URBANAS"
    | "AREAS_NATURALES"
    | "LETREROS_INFORMATIVOS"
    | "SENALETICA_SEGURIDAD";
  nombre: string;
  cantidadMadera: number | null;
  cantidadAluminio: number | null;
  cantidadOtro: number | null;
  especifiqueOtro: string | null;
  estado: "BUENO" | "REGULAR" | "MALO" | null;
};

export type FichaServicioSalud = {
  nombre: string;
  cantidadAtractivo: number | null;
  cantidadCiudad: number | null;
};

export type FichaServicioSeguridad = {
  nombre: string;
  detalle: string | null;
};

export type FichaTelefoniaInternet = {
  scope: "ATRACTIVO" | "CIUDAD";
  fija: boolean;
  movil: boolean;
  satelital: boolean;
  lineaTelefonica: boolean;
  satelite: boolean;
  telefoniaMovil: boolean;
  fibraOptica: boolean;
  redesInalambricas: boolean;
};

export type FichaRadioPortatil = {
  usoVisitante: boolean;
  usoInterno: boolean;
  usoEmergencia: boolean;
};

export type FichaAmenaza = { nombre: string; marcada: boolean };

export type FichaContingencia = {
  existe: boolean;
  institucion: string | null;
  nombreDocumento: string | null;
  anioElaboracion: number | null;
};

export type FichaHigieneSeguridad = {
  serviciosBasicos: FichaServicioBasico[];
  observacionServiciosBasicos: string | null;
  senaletica: FichaSenaleticaItem[];
  observacionSenaletica: string | null;
  salud: FichaServicioSalud[];
  observacionSalud: string | null;
  seguridad: FichaServicioSeguridad[];
  observacionSeguridad: string | null;
  telefoniaInternet: FichaTelefoniaInternet[];
  observacionComunicacion: string | null;
  radioPortatil: FichaRadioPortatil;
  observacionRadioPortatil: string | null;
  amenazas: FichaAmenaza[];
  contingencia: FichaContingencia;
  observacionMultiamenazas: string | null;
};
