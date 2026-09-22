import type ExcelJS from "exceljs";

import { leerMarcaDirecta, leerMarcaJuntoAEtiqueta } from "./checkbox";
import { leerTexto, leerTextoOpcional } from "./xlsx-utils";
import type {
  FichaAmenaza,
  FichaHigieneSeguridad,
  FichaRadioPortatil,
  FichaSenaleticaItem,
  FichaServicioBasico,
  FichaServicioSalud,
  FichaServicioSeguridad,
  FichaTelefoniaInternet,
} from "./tipos-higiene";

function numeroOpcional(worksheet: ExcelJS.Worksheet, ref: string): number | null {
  const texto = leerTexto(worksheet, ref);
  if (texto === "" || texto.toLowerCase() === "texto") return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : null;
}

// --- 7.1 Servicios básicos (filas 158-166) — valores de texto, no checkboxes ---
const SERVICIOS_BASICOS: Array<{
  tipo: FichaServicioBasico["tipo"];
  filaValor: number;
  filaEspecifique: number;
}> = [
  { tipo: "AGUA", filaValor: 158, filaEspecifique: 159 },
  { tipo: "ENERGIA_ELECTRICA", filaValor: 160, filaEspecifique: 161 },
  { tipo: "SANEAMIENTO", filaValor: 162, filaEspecifique: 163 },
  { tipo: "DISPOSICION_DESECHOS", filaValor: 164, filaEspecifique: 165 },
];

function leerServiciosBasicos(worksheet: ExcelJS.Worksheet): FichaServicioBasico[] {
  return SERVICIOS_BASICOS.map((item) => ({
    tipo: item.tipo,
    valorAtractivo: leerTextoOpcional(worksheet, `F${item.filaValor}`),
    proveedorAtractivo: leerTextoOpcional(worksheet, `D${item.filaEspecifique}`),
    valorCiudad: leerTextoOpcional(worksheet, `Q${item.filaValor}`),
    proveedorCiudad: leerTextoOpcional(worksheet, `O${item.filaEspecifique}`),
  }));
}

// --- 7.2 Señalética (filas 170-193) ---
const SENALETICA: Array<{
  ambiente: FichaSenaleticaItem["ambiente"];
  nombre: string;
  fila: number;
}> = [
  { ambiente: "AREAS_URBANAS", nombre: "Pictograma de atractivos naturales", fila: 170 },
  { ambiente: "AREAS_URBANAS", nombre: "Pictograma de atractivos culturales", fila: 171 },
  {
    ambiente: "AREAS_URBANAS",
    nombre: "Pictograma de actividades turísticas",
    fila: 172,
  },
  { ambiente: "AREAS_URBANAS", nombre: "Pictograma de servicios de apoyo", fila: 173 },
  { ambiente: "AREAS_URBANAS", nombre: "Pictogramas de restricción", fila: 174 },
  { ambiente: "AREAS_URBANAS", nombre: "Tótems de atractivos turísticos", fila: 175 },
  { ambiente: "AREAS_URBANAS", nombre: "Tótems de sitio", fila: 176 },
  { ambiente: "AREAS_URBANAS", nombre: "Tótems direccionales", fila: 177 },
  {
    ambiente: "AREAS_NATURALES",
    nombre: "Pictograma de atractivos naturales",
    fila: 178,
  },
  {
    ambiente: "AREAS_NATURALES",
    nombre: "Pictograma de atractivos culturales",
    fila: 179,
  },
  {
    ambiente: "AREAS_NATURALES",
    nombre: "Pictograma de actividades turísticas",
    fila: 180,
  },
  { ambiente: "AREAS_NATURALES", nombre: "Pictograma de servicios de apoyo", fila: 181 },
  { ambiente: "AREAS_NATURALES", nombre: "Pictogramas de restricción", fila: 182 },
  {
    ambiente: "AREAS_NATURALES",
    nombre: "Señales turísticas de aproximación",
    fila: 183,
  },
  {
    ambiente: "AREAS_NATURALES",
    nombre: "Paneles de direccionamiento hacia atractivos",
    fila: 184,
  },
  { ambiente: "AREAS_NATURALES", nombre: "Panel informativo de atractivos", fila: 185 },
  {
    ambiente: "AREAS_NATURALES",
    nombre:
      "Panel informativo de direccionamiento hacia atractivos, servicios y actividades",
    fila: 186,
  },
  { ambiente: "AREAS_NATURALES", nombre: "Mesas interpretativas", fila: 187 },
  { ambiente: "AREAS_NATURALES", nombre: "Tótem de sitio", fila: 188 },
  { ambiente: "AREAS_NATURALES", nombre: "Tótem de direccionamiento", fila: 189 },
  { ambiente: "LETREROS_INFORMATIVOS", nombre: "De información botánica", fila: 190 },
  {
    ambiente: "LETREROS_INFORMATIVOS",
    nombre: "Normativos de concienciación",
    fila: 191,
  },
  {
    ambiente: "SENALETICA_SEGURIDAD",
    nombre: "Protección de los elementos del atractivo",
    fila: 192,
  },
];

function leerSenaletica(worksheet: ExcelJS.Worksheet): FichaSenaleticaItem[] {
  return SENALETICA.map((item) => {
    let estado: FichaSenaleticaItem["estado"] = null;
    if (leerMarcaDirecta(worksheet, `T${item.fila}`)) estado = "BUENO";
    else if (leerMarcaDirecta(worksheet, `U${item.fila}`)) estado = "REGULAR";
    else if (leerMarcaDirecta(worksheet, `V${item.fila}`)) estado = "MALO";

    return {
      ambiente: item.ambiente,
      nombre: item.nombre,
      cantidadMadera: numeroOpcional(worksheet, `J${item.fila}`),
      cantidadAluminio: numeroOpcional(worksheet, `L${item.fila}`),
      cantidadOtro: numeroOpcional(worksheet, `N${item.fila}`),
      especifiqueOtro: leerTextoOpcional(worksheet, `P${item.fila}`),
      estado,
    };
  });
}

// --- 7.3 Salud (filas 197-201) ---
const SALUD = [
  "Hospital o Clínica",
  "Puesto / Centro de salud",
  "Dispensario médico",
  "Botiquín de primeros auxilios",
  "Otros",
];

function leerSalud(worksheet: ExcelJS.Worksheet): FichaServicioSalud[] {
  return SALUD.map((nombre, i) => {
    const fila = 197 + i;
    return {
      nombre,
      cantidadAtractivo: numeroOpcional(worksheet, `G${fila}`),
      cantidadCiudad: numeroOpcional(worksheet, `R${fila}`),
    };
  });
}

// --- 7.4 Seguridad (filas 204-207) — valores de texto directos ---
const SEGURIDAD = [
  "Privada",
  "Policía nacional",
  "Policía metropolitana / Municipal",
  "Otra",
];

function leerSeguridad(worksheet: ExcelJS.Worksheet): FichaServicioSeguridad[] {
  return SEGURIDAD.map((nombre, i) => ({
    nombre,
    detalle: leerTextoOpcional(worksheet, `I${204 + i}`),
  }));
}

// --- 7.5 Comunicación (filas 212-217) ---
function leerTelefoniaInternet(worksheet: ExcelJS.Worksheet): FichaTelefoniaInternet[] {
  function leer(
    scope: "ATRACTIVO" | "CIUDAD",
    cols: Record<string, string>,
  ): FichaTelefoniaInternet {
    return {
      scope,
      fija: leerMarcaJuntoAEtiqueta(worksheet, cols.fija) === true,
      movil: leerMarcaJuntoAEtiqueta(worksheet, cols.movil) === true,
      satelital: leerMarcaJuntoAEtiqueta(worksheet, cols.satelital) === true,
      lineaTelefonica: leerMarcaJuntoAEtiqueta(worksheet, cols.lineaTelefonica) === true,
      satelite: leerMarcaJuntoAEtiqueta(worksheet, cols.satelite) === true,
      telefoniaMovil: leerMarcaJuntoAEtiqueta(worksheet, cols.telefoniaMovil) === true,
      fibraOptica: leerMarcaJuntoAEtiqueta(worksheet, cols.fibraOptica) === true,
      redesInalambricas:
        leerMarcaJuntoAEtiqueta(worksheet, cols.redesInalambricas) === true,
    };
  }

  const atractivo = leer("ATRACTIVO", {
    fija: "B212:C212",
    movil: "B213:C213",
    satelital: "B214:C214",
    lineaTelefonica: "E212:G212",
    satelite: "E213:G213",
    telefoniaMovil: "E214:K214",
    fibraOptica: "I212:K212",
    redesInalambricas: "I213:K213",
  });
  const ciudad = leer("CIUDAD", {
    fija: "M212:N212",
    movil: "M213:N213",
    satelital: "M214:N214",
    lineaTelefonica: "P212:Q212",
    satelite: "P213:Q213",
    telefoniaMovil: "P214:U214",
    fibraOptica: "S212:U212",
    redesInalambricas: "S213:U213",
  });
  return [atractivo, ciudad];
}

function leerRadioPortatil(worksheet: ExcelJS.Worksheet): FichaRadioPortatil {
  return {
    usoVisitante: leerMarcaJuntoAEtiqueta(worksheet, "B217:G217") === true,
    usoInterno: leerMarcaJuntoAEtiqueta(worksheet, "I217:N217") === true,
    usoEmergencia: leerMarcaJuntoAEtiqueta(worksheet, "P217:U217") === true,
  };
}

// --- 7.6 Multiamenazas (filas 220-223) ---
const AMENAZAS: Array<{ nombre: string; refEtiqueta: string }> = [
  { nombre: "Deslaves", refEtiqueta: "B220:E220" },
  { nombre: "Sismos", refEtiqueta: "G220:K220" },
  { nombre: "Erupciones volcánicas", refEtiqueta: "M220:P220" },
  { nombre: "Incendios forestales", refEtiqueta: "R220:U220" },
  { nombre: "Sequía", refEtiqueta: "B221:E221" },
  { nombre: "Inundaciones", refEtiqueta: "G221:K221" },
  { nombre: "Aguajes", refEtiqueta: "M221:P221" },
  { nombre: "Tsunami", refEtiqueta: "R221:U221" },
];

function leerAmenazas(worksheet: ExcelJS.Worksheet): FichaAmenaza[] {
  return AMENAZAS.map((item) => ({
    nombre: item.nombre,
    marcada: leerMarcaJuntoAEtiqueta(worksheet, item.refEtiqueta) === true,
  }));
}

export function leerHigieneSeguridad(
  worksheet: ExcelJS.Worksheet,
): FichaHigieneSeguridad {
  return {
    serviciosBasicos: leerServiciosBasicos(worksheet),
    observacionServiciosBasicos: leerTextoOpcional(worksheet, "E166"),
    senaletica: leerSenaletica(worksheet),
    observacionSenaletica: leerTextoOpcional(worksheet, "E194"),
    salud: leerSalud(worksheet),
    observacionSalud: leerTextoOpcional(worksheet, "E202"),
    seguridad: leerSeguridad(worksheet),
    observacionSeguridad: leerTextoOpcional(worksheet, "E208"),
    telefoniaInternet: leerTelefoniaInternet(worksheet),
    observacionComunicacion: leerTextoOpcional(worksheet, "E215"),
    radioPortatil: leerRadioPortatil(worksheet),
    observacionRadioPortatil: leerTextoOpcional(worksheet, "E218"),
    amenazas: leerAmenazas(worksheet),
    contingencia: {
      existe: leerMarcaJuntoAEtiqueta(worksheet, "B222:F222") === true,
      institucion: leerTextoOpcional(worksheet, "K222"),
      nombreDocumento: leerTextoOpcional(worksheet, "P222"),
      anioElaboracion: numeroOpcional(worksheet, "U222"),
    },
    observacionMultiamenazas: leerTextoOpcional(worksheet, "E223"),
  };
}
