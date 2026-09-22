import type ExcelJS from "exceljs";

import { leerMarcaDirecta, leerMarcaJuntoAEtiqueta } from "./checkbox";
import { parsearCoordenadaPar } from "./parser-comun";
import { leerTexto, leerTextoOpcional } from "./xlsx-utils";
import type {
  FichaFacilidadEntorno,
  FichaGuiaTuristica,
  FichaPlanta,
  FichaPlantaConteo,
  FichaServicioComplementario,
} from "./tipos-planta";

function numeroOpcional(worksheet: ExcelJS.Worksheet, ref: string): number | null {
  const texto = leerTexto(worksheet, ref);
  if (texto === "" || texto.toLowerCase() === "texto") return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Lee una fila de la tabla de planta turística (5.1): un nombre fijo (ej.
 * "Hotel") con hasta 3 métricas numéricas en el lado "atractivo" y otras
 * tantas en el lado "ciudad o poblado cercano". Las columnas difieren entre
 * alojamiento (F/I/K y Q/S/U), alimentos y bebidas (F/I/K y P/S/U) y agencias
 * de viaje (solo H y S) — por eso se reciben explícitas, no se asumen.
 */
function leerFilaConteo(
  worksheet: ExcelJS.Worksheet,
  nombre: string,
  fila: number,
  colsAtractivo: string[],
  colsCiudad: string[],
): FichaPlantaConteo {
  const [a1, a2, a3] = colsAtractivo;
  const [c1, c2, c3] = colsCiudad;
  return {
    nombre,
    establecimientosAtractivo: a1 ? numeroOpcional(worksheet, `${a1}${fila}`) : null,
    segundaMetricaAtractivo: a2 ? numeroOpcional(worksheet, `${a2}${fila}`) : null,
    terceraMetricaAtractivo: a3 ? numeroOpcional(worksheet, `${a3}${fila}`) : null,
    establecimientosCiudad: c1 ? numeroOpcional(worksheet, `${c1}${fila}`) : null,
    segundaMetricaCiudad: c2 ? numeroOpcional(worksheet, `${c2}${fila}`) : null,
    terceraMetricaCiudad: c3 ? numeroOpcional(worksheet, `${c3}${fila}`) : null,
  };
}

const ALOJAMIENTO = [
  "Hotel",
  "Hostal",
  "Hostería",
  "Hacienda Turística",
  "Lodge",
  "Resort",
  "Refugio",
  "Campamento Turístico",
  "Casa de Huéspedes",
];
const ALIMENTOS_BEBIDAS = ["Restaurantes", "Cafeterías", "Bares", "Fuentes de soda"];
const AGENCIAS_VIAJE = ["Mayoristas", "Internacionales", "Operadoras"];

function leerPlantaTuristica(worksheet: ExcelJS.Worksheet): {
  alojamiento: FichaPlantaConteo[];
  alimentosBebidas: FichaPlantaConteo[];
  agenciasViaje: FichaPlantaConteo[];
  guia: FichaGuiaTuristica;
} {
  const alojamiento = ALOJAMIENTO.map((nombre, i) =>
    leerFilaConteo(worksheet, nombre, 77 + i, ["F", "I", "K"], ["Q", "S", "U"]),
  );
  const alimentosBebidas = ALIMENTOS_BEBIDAS.map((nombre, i) =>
    leerFilaConteo(worksheet, nombre, 88 + i, ["F", "I", "K"], ["P", "S", "U"]),
  );
  const agenciasViaje = AGENCIAS_VIAJE.map((nombre, i) =>
    leerFilaConteo(worksheet, nombre, 94 + i, ["H"], ["S"]),
  );

  // 5.1 "Guía" (filas 98-99): tabla irregular de la plantilla — Local/
  // Nacional/Nacional Especializado tienen su conteo en la fila 99 (debajo
  // de su propio encabezado en la fila 98); Cultura/Aventura tienen su
  // conteo en la columna K/V de su propia fila (98 y 99 respectivamente).
  const guia: FichaGuiaTuristica = {
    local: {
      atractivo: numeroOpcional(worksheet, "D99"),
      ciudad: numeroOpcional(worksheet, "O99"),
    },
    nacional: {
      atractivo: numeroOpcional(worksheet, "E99"),
      ciudad: numeroOpcional(worksheet, "P99"),
    },
    nacionalEspecializado: {
      atractivo: numeroOpcional(worksheet, "G99"),
      ciudad: numeroOpcional(worksheet, "R99"),
    },
    cultura: {
      atractivo: numeroOpcional(worksheet, "K98"),
      ciudad: numeroOpcional(worksheet, "V98"),
    },
    aventura: {
      atractivo: numeroOpcional(worksheet, "K99"),
      ciudad: numeroOpcional(worksheet, "V99"),
    },
  };

  return { alojamiento, alimentosBebidas, agenciasViaje, guia };
}

const FACILIDADES: Array<{ categoria: string; nombre: string; fila: number }> = [
  {
    categoria: "De apoyo a la gestión turística",
    nombre: "Punto de Información",
    fila: 104,
  },
  { categoria: "De apoyo a la gestión turística", nombre: "I-Tur", fila: 105 },
  {
    categoria: "De apoyo a la gestión turística",
    nombre: "Centro de interpretación",
    fila: 106,
  },
  {
    categoria: "De apoyo a la gestión turística",
    nombre: "Centro de facilitación turística",
    fila: 107,
  },
  {
    categoria: "De apoyo a la gestión turística",
    nombre: "Centro de recepción de visitantes",
    fila: 108,
  },
  {
    categoria: "De observación y vigilancia",
    nombre: "Garitas de guardianía",
    fila: 109,
  },
  { categoria: "De observación y vigilancia", nombre: "Miradores", fila: 110 },
  {
    categoria: "De observación y vigilancia",
    nombre: "Torres de avistamiento de aves",
    fila: 111,
  },
  {
    categoria: "De observación y vigilancia",
    nombre: "Torres de vigilancia para salvavidas",
    fila: 112,
  },
  { categoria: "De recorrido y descanso", nombre: "Senderos", fila: 113 },
  {
    categoria: "De recorrido y descanso",
    nombre: "Estaciones de sombra y descanso",
    fila: 114,
  },
  { categoria: "De recorrido y descanso", nombre: "Áreas de acampar", fila: 115 },
  { categoria: "De recorrido y descanso", nombre: "Refugio de alta montaña", fila: 116 },
  { categoria: "De servicio", nombre: "Baterías sanitarias", fila: 117 },
  { categoria: "De servicio", nombre: "Estacionamientos", fila: 118 },
];

function leerFacilidadesEntorno(worksheet: ExcelJS.Worksheet): FichaFacilidadEntorno[] {
  return FACILIDADES.map((item) => {
    const coordenadasCrudo = leerTexto(worksheet, `L${item.fila}`);
    let coordenadas: FichaFacilidadEntorno["coordenadas"] = null;
    if (coordenadasCrudo !== "" && coordenadasCrudo !== "0") {
      coordenadas = {
        crudo: coordenadasCrudo,
        advertencia: parsearCoordenadaPar(coordenadasCrudo, `Facilidad "${item.nombre}"`)
          .advertencia,
      };
    }
    let estado: FichaFacilidadEntorno["estado"] = null;
    if (leerMarcaDirecta(worksheet, `T${item.fila}`)) estado = "BUENO";
    else if (leerMarcaDirecta(worksheet, `U${item.fila}`)) estado = "REGULAR";
    else if (leerMarcaDirecta(worksheet, `V${item.fila}`)) estado = "MALO";

    return {
      categoria: item.categoria,
      nombre: item.nombre,
      cantidad: numeroOpcional(worksheet, `J${item.fila}`),
      coordenadas,
      administrador: leerTextoOpcional(worksheet, `O${item.fila}`),
      accesibilidadUniversal: leerMarcaDirecta(worksheet, `R${item.fila}`),
      estado,
    };
  });
}

const COMPLEMENTARIOS: Array<{
  nombre: string;
  refAtractivo: string;
  refCiudad: string | null;
}> = [
  {
    nombre: "Alquiler y venta de equipo especializado",
    refAtractivo: "B123:E123",
    refCiudad: "M123:P123",
  },
  {
    nombre: "Venta de artesanías y merchandising",
    refAtractivo: "H123:K123",
    refCiudad: "R123:U123",
  },
  { nombre: "Casa de cambio", refAtractivo: "B124:D124", refCiudad: "M124:O124" },
  { nombre: "Cajero automático", refAtractivo: "F124:H124", refCiudad: "Q124:S124" },
];

function leerComplementarios(
  worksheet: ExcelJS.Worksheet,
): FichaServicioComplementario[] {
  return COMPLEMENTARIOS.map((item) => ({
    nombre: item.nombre,
    enAtractivo: leerMarcaJuntoAEtiqueta(worksheet, item.refAtractivo) === true,
    enCiudad: item.refCiudad
      ? leerMarcaJuntoAEtiqueta(worksheet, item.refCiudad) === true
      : false,
  }));
}

export function leerPlanta(worksheet: ExcelJS.Worksheet): FichaPlanta {
  const { alojamiento, alimentosBebidas, agenciasViaje, guia } =
    leerPlantaTuristica(worksheet);
  return {
    alojamiento,
    alimentosBebidas,
    agenciasViaje,
    guia,
    observacionPlantaAtractivo: leerTextoOpcional(worksheet, "E86"),
    observacionPlantaCiudad: leerTextoOpcional(worksheet, "P86"),
    facilidadesEntorno: leerFacilidadesEntorno(worksheet),
    observacionFacilidades: leerTextoOpcional(worksheet, "E120"),
    complementarios: leerComplementarios(worksheet),
    observacionComplementarios: leerTextoOpcional(worksheet, "E126"),
  };
}
