import type ExcelJS from "exceljs";

/**
 * Títulos únicos de la columna B de la plantilla MINTUR (fila, texto
 * normalizado). Sirven para detectar filas añadidas o borradas por quien llenó
 * la ficha: el importador lee posiciones fijas y, sin este ajuste, una sola
 * fila borrada corre todo lo que sigue.
 */
export const TITULOS_PLANTILLA: ReadonlyArray<readonly [number, string]> = [
  [1, "ficha para el levantamiento y jerarquización de atractivos turísticos"],
  [2, "código del atractivo:"],
  [4, "1. datos generales"],
  [5, "1.1 nombre del atractivo turístico"],
  [7, "1.2 categoría"],
  [9, "2. ubicación del atractivo"],
  [10, "2.1 provincia"],
  [12, "2.4 barrio, sector o comuna"],
  [14, "2.8 latitud (grados decimales)"],
  [16, "2.11 información del administrador"],
  [17, "a. tipo de administrador:"],
  [18, "c. nombre del administrador:"],
  [19, "e. teléfono / celular:"],
  [21, "3. caracteristicas del atractivo"],
  [22, "3.1 características climatológicas"],
  [24, "3.2 línea de producto al que pertenece el atractivo (u)"],
  [25, "a. cultura"],
  [26, "3.3 escenario donde se localiza el atractivo turístico"],
  [27, "a. prístino"],
  [28, "3.4 ingreso al atractivo (u)"],
  [29, "a. tipo de ingreso"],
  [32, "restringido"],
  [34, "d. maneja un sistema de reservas:"],
  [35, "e. precio:"],
  [36, "g. meses recomendables de visita:"],
  [38, "4. accesibilidad y conectividad al atractivo"],
  [
    39,
    "a. nombre de la ciudad o poblado más cercano (que presente condiciones mínimas de servicios):",
  ],
  [40, "b. distancia desde la ciudad o poblado más cercano:"],
  [42, "4.2 vías de acceso (m)"],
  [43, "a. terrestre (m)"],
  [48, "b. acuático (u)"],
  [52, "c. aéreo (u)"],
  [54, "4.3 servicio de transporte (m)"],
  [57, "m. helicóptero"],
  [59, "4.3.1 detalle de transporte hacia el atractivo (m)"],
  [60, "a. nombre de la cooperativa o asociación que presta el servicio"],
  [
    67,
    "4.4 condiciones de accesibilidad del atractivo turístico al medio físico para personas con discapacidad (m)",
  ],
  [70, "4.5 señalización"],
  [71, "a. señalización de aproximación al atractivo"],
  [73, "5. planta turística / complementarios"],
  [74, "5.1 planta turística (m)"],
  [76, "alojamiento"],
  [80, "hacienda turística"],
  [84, "campamento turístico"],
  [85, "casa de huéspedes"],
  [87, "alimentos y bebidas"],
  [88, "restaurantes"],
  [89, "cafeterías"],
  [91, "fuentes de soda"],
  [93, "agencias de viaje"],
  [94, "mayoristas"],
  [95, "internacionales"],
  [96, "operadoras"],
  [101, "5.2 facilidades en el entorno al atractivo"],
  [102, "categoría (m)"],
  [104, "a. de apoyo a la gestión turística"],
  [109, "b. de observación y vigilancia"],
  [113, "c. de recorrido y descanso"],
  [117, "d. de servicio"],
  [121, "5.3 complementarios a la actividad turística (m)"],
  [123, "alquiler y venta de equipo especializado"],
  [124, "casa de cambio"],
  [127, "6. estado de conservación e integración atractivo / entorno"],
  [128, "6.1 atractivo (u)"],
  [131, "6.1.1 factores de alteración y deterioro (m)"],
  [132, "6.1.1.1 naturales (m)"],
  [140, "6.2 entorno (u)"],
  [143, "6.2.1 factores de alteración y deterioro (m)"],
  [144, "6.2.1.1 naturales (m)"],
  [152, "6.3. declaratoria del espacio turístico asociado al atractivo"],
  [153, "a. declarante:"],
  [155, "7. higiene y seguridad turística"],
  [156, "7.1 servicios básicos"],
  [160, "energía eléctrica:"],
  [162, "saneamiento:"],
  [164, "disposición de desechos"],
  [167, "7.2 señalética en el atractivo"],
  [168, "7.2.1 ambiente"],
  [170, "en áreas urbanas"],
  [178, "en áreas naturales"],
  [190, "letreros informativos"],
  [192, "señalética interna de seguridad"],
  [195, "7.3 salud (más cercano) (m)"],
  [197, "hospital o clínica"],
  [198, "puesto / centro de salud"],
  [199, "dispensario médico"],
  [200, "botiquín de primeros auxilios"],
  [203, "7.4 seguridad (m)"],
  [204, "a. privada"],
  [205, "b. policía nacional"],
  [206, "c. policía metropolitana / municipal"],
  [209, "7.5 servicio de comunicación de uso público (m)"],
  [211, "telefonía (m)"],
  [216, "radio portátil (u)"],
  [217, "de uso exclusivo para el visitante"],
  [219, "7.6 multiamenzazas (m)"],
  [222, "¿existe un plan de contingencia en caso de catástrofes?"],
  [224, "8. políticas y regulaciones"],
  [225, "a. ¿el gad cuenta con el plan de desarrollo turístico territorial?"],
  [
    226,
    "b. ¿el atractivo se encuentra dentro de la planificación turística territorial (gad´s)?",
  ],
  [
    228,
    "c. ¿existen normativas que se apliquen para el desarrollo de la actividad turística en el atractivo?",
  ],
  [
    230,
    "d. ¿existen ordenanzas que se apliquen para el desarrollo de la actividad turística en el atractivo?",
  ],
  [233, "9. actividades que se practican (u)"],
  [234, "9.1 atractivos naturales (m)"],
  [235, "9.1.1 en el agua (m)"],
  [237, "f. kite surf"],
  [238, "k. paseo en panga"],
  [239, "p. esquí acuático"],
  [241, "9.1.2 en el aire (m)"],
  [242, "a. alas delta"],
  [244, "9.1.3 en superficie terrestre (m)"],
  [245, "a. montañismo"],
  [246, "f. exploración de cuevas"],
  [249, "9.2 atractivos culturales (u)"],
  [250, "9.2.1 tangibles e intangibles"],
  [251, "a. recorridos guiados"],
  [252, "h. participación en talleres artísticos"],
  [253, "e. exposiciones temáticas permanentes, temporales y eventuales"],
  [254, "g. presentaciones o representaciones en vivo"],
  [255, "j. degustación de platos tradicionales"],
  [256, "n. convivencia"],
  [258, "10. promoción y comercialización del atractivo"],
  [259, "10.1. medios de promoción del atractivo (m)"],
  [260, "¿existe un plan de promoción turística cantonal?"],
  [
    261,
    "¿el atractivo se encuentra incluido en el plan de promoción turístico cantonal?",
  ],
  [262, "medio promocional"],
  [263, "a. página web"],
  [264, "b. red social"],
  [265, "c. revistas especializadas"],
  [266, "d. material pop"],
  [267, "e. oficina de información turística"],
  [268, "f. medios de comunicación (radio, tv, prensa)"],
  [269, "g. asistencia a ferias turísticas"],
  [272, "10.2. el atractivo forma parte de una oferta establecida (paquete turístico)"],
  [274, "11. registro de visitantes y afluencia (m)"],
  [275, "11.1. frecuencia de visita según datos estadísticos"],
  [276, "a. ¿posee un sistema de registro de visitantes?"],
  [277, "b. ¿se genera reporte de estadísticas de visita al atractivo?"],
  [278, "c. temporalidad de visita al atractivo"],
  [279, "alta (meses)"],
  [280, "baja (meses)"],
  [281, "d. llegada de turistas"],
  [282, "turista nacional"],
  [283, "ciudades de origen"],
  [287, "11.2. frecuencia de visita según informantes clave"],
  [288, "nombre del informante clave:"],
  [289, "demanda según días de visita"],
  [290, "lunes a viernes"],
  [292, "12. recurso humano"],
  [293, "a. número de personas a cargo de la administración y operación del atractivo"],
  [294, "e. número de personas con nivel de instrucción (m):"],
  [296, "tercer nivel"],
  [299, "13. descripcion del atractivo (500 caracteres)"],
  [303, "14. anexos"],
  [304, "a. archivo fotográfico (dos) (hd)"],
  [312, "b. ubicación gráfica del atractivo"],
  [323, "firmas de responsabilidad (obligatorio)"],
  [324, "elaborado por:"],
  [325, "apellido y nombre"],
  [326, "institución"],
  [328, "correo electrónico"],
];

const VENTANA_BUSQUEDA = 8;
/** Columna vacía donde caen las filas lógicas que en este archivo no existen. */
const COLUMNA_VACIA = "ZZ";

type Alineacion = {
  original: ExcelJS.Worksheet;
  fisica: (fila: number) => number | null;
};
const alineaciones = new WeakMap<object, Alineacion>();

function normalizar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto =
    typeof valor === "object" && "richText" in (valor as object)
      ? (valor as ExcelJS.CellRichTextValue).richText.map((parte) => parte.text).join("")
      : typeof valor === "object" && "text" in (valor as object)
        ? String((valor as { text: unknown }).text ?? "")
        : String(valor);
  return texto.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Fila física de cada fila de la plantilla. `null` = la fila no existe en el
 * archivo (se borró) y no debe leerse otra en su lugar. Devuelve `null` si el
 * archivo coincide con la plantilla.
 */
export type MapaDeFilas = {
  /** Fila física de una fila de la plantilla (`null` si no existe en el archivo). */
  fisica: (fila: number) => number | null;
  /** Fila de la plantilla que corresponde a una fila física. */
  logica: (fila: number) => number;
};

export function mapaDeFilas(worksheet: ExcelJS.Worksheet): MapaDeFilas | null {
  const maxima = Math.max(worksheet.rowCount, 1);
  const porTexto = new Map<string, number[]>();
  for (let fila = 1; fila <= maxima; fila += 1) {
    const texto = normalizar(worksheet.getCell(`B${fila}`).value);
    if (texto.length < 10) continue;
    porTexto.set(texto, [...(porTexto.get(texto) ?? []), fila]);
  }

  const anclas: Array<{ logica: number; fisica: number }> = [];
  for (const [logica, texto] of TITULOS_PLANTILLA) {
    const candidatas = (porTexto.get(texto) ?? []).filter(
      (fila) => Math.abs(fila - logica) <= VENTANA_BUSQUEDA,
    );
    if (candidatas.length === 0) continue;
    const fisica = candidatas.reduce((mejor, fila) =>
      Math.abs(fila - logica) < Math.abs(mejor - logica) ? fila : mejor,
    );
    // Se descartan coincidencias que rompen el orden de la hoja.
    const anterior = anclas[anclas.length - 1];
    if (anterior && fisica <= anterior.fisica) continue;
    anclas.push({ logica, fisica });
  }
  if (anclas.every((ancla) => ancla.logica === ancla.fisica)) return null;

  const fisica = (fila: number) => {
    let indice = -1;
    for (let i = 0; i < anclas.length; i += 1) {
      if (anclas[i].logica <= fila) indice = i;
      else break;
    }
    if (indice < 0) return fila;
    const desfase = anclas[indice].fisica - anclas[indice].logica;
    const real = fila + desfase;
    const siguiente = anclas[indice + 1];
    // Un hueco de la plantilla (tabla con filas libres) que en el archivo se
    // acortó no debe leer el título de la sección siguiente.
    if (siguiente && fila < siguiente.logica && real >= siguiente.fisica) return null;
    return real;
  };
  const logica = (fila: number) => {
    let indice = -1;
    for (let i = 0; i < anclas.length; i += 1) {
      if (anclas[i].fisica <= fila) indice = i;
      else break;
    }
    return indice < 0 ? fila : fila - (anclas[indice].fisica - anclas[indice].logica);
  };
  return { fisica, logica };
}

function trasladarReferencia(
  ref: string,
  fisica: (fila: number) => number | null,
): string {
  const partes = /^([A-Za-z]+)(\d+)$/.exec(ref);
  if (!partes) return ref;
  const destino = fisica(Number(partes[2]));
  return destino === null ? `${COLUMNA_VACIA}${partes[2]}` : `${partes[1]}${destino}`;
}

/**
 * Devuelve la hoja tal cual si sus filas coinciden con la plantilla; si no,
 * una vista que traduce cada referencia de la plantilla a su fila real.
 */
export function alinearFilas(worksheet: ExcelJS.Worksheet): ExcelJS.Worksheet {
  const mapa = mapaDeFilas(worksheet);
  if (!mapa) return worksheet;
  const { fisica } = mapa;
  let modeloLogico: unknown;
  const vista = new Proxy(worksheet, {
    get(objetivo, propiedad) {
      if (propiedad === "model") {
        // Las celdas combinadas se consultan con filas de la plantilla.
        modeloLogico ??= {
          ...objetivo.model,
          merges: ((objetivo.model.merges ?? []) as string[]).map((combinada) =>
            combinada.replace(
              /([A-Za-z]+)(\d+)/g,
              (_, col: string, fila: string) => `${col}${mapa.logica(Number(fila))}`,
            ),
          ),
        };
        return modeloLogico;
      }
      if (propiedad === "getCell") {
        return (...args: [string | number, number?]) =>
          typeof args[0] === "string"
            ? objetivo.getCell(trasladarReferencia(args[0], fisica))
            : objetivo.getCell(...(args as [number, number]));
      }
      const valor = Reflect.get(objetivo, propiedad, objetivo);
      return typeof valor === "function" ? valor.bind(objetivo) : valor;
    },
  });
  alineaciones.set(vista, { original: worksheet, fisica });
  return vista;
}

/** Hoja original y referencia real para consultar datos anclados a la posición física. */
export function referenciaFisica(
  worksheet: ExcelJS.Worksheet,
  ref: string,
): { hoja: ExcelJS.Worksheet; ref: string } {
  const alineacion = alineaciones.get(worksheet);
  if (!alineacion) return { hoja: worksheet, ref };
  return {
    hoja: alineacion.original,
    ref: trasladarReferencia(ref, alineacion.fisica),
  };
}
