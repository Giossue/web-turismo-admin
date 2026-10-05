import ExcelJS from "exceljs";

import { cargarCasillasFormulario } from "./controles-formulario";
import {
  leerMarcaDirecta,
  leerMarcaJuntoAEtiqueta,
  leerSeleccionUnica,
} from "./checkbox";
import {
  leerActividades,
  leerPoliticas,
  leerPromocion,
  leerRecursoHumano,
  leerVisitantes,
} from "./parser-adicional";
import { leerConservacion } from "./parser-conservacion";
import { parsearCoordenadaPar } from "./parser-comun";
import { leerHigieneSeguridad } from "./parser-higiene";
import { leerPlanta } from "./parser-planta";
import {
  fechaDesdeSerial,
  horaDesdeFraccionDia,
  leerCelda,
  leerPositivoOpcional,
  leerTexto,
  leerTextoOpcional,
} from "./xlsx-utils";
import {
  RANGO_LATITUD_ECUADOR,
  RANGO_LONGITUD_ECUADOR,
  parsearAltitud,
  parsearCoordenada,
} from "./normalizacion";
import type {
  FichaAccesibilidadDetalleItem,
  FichaAccesoConectividad,
  FichaCaracteristicas,
  FichaCooperativaTransporte,
  FichaExtraida,
  FichaIdentificacion,
  FichaImagenAnexo,
  FichaImagenAdjunta,
  FichaIngreso,
  FichaResponsableFirma,
  FichaResumenValoracion,
  FichaUbicacion,
  FichaViaTerrestre,
  ResultadoParseoFicha,
} from "./tipos";

const EXTENSIONES_PERMITIDAS = new Set(["xlsx", "xlsm"]);
export const TAMANO_MAXIMO_BYTES = 20 * 1024 * 1024;
const TAMANO_MAXIMO_IMAGEN_BYTES = 10 * 1024 * 1024;

export class FichaInvalidaError extends Error {}

const HOJA_PRINCIPAL = "Ficha_Jerarquia";
const HOJA_ACCESIBILIDAD = "ficha_Accesibilidad";
const HOJA_RESUMEN = "RESUMEN DE RESULTADOS";

const CODIGOS_COLUMNAS = [
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
] as const;

/**
 * Valida extensión y tamaño antes de leer el contenido del archivo. Lanza
 * `FichaInvalidaError` con un mensaje para la persona usuaria.
 */
export function validarArchivoFicha(nombreArchivo: string, tamanoBytes: number): void {
  validarExtension(nombreArchivo);
  if (tamanoBytes > TAMANO_MAXIMO_BYTES) {
    throw new FichaInvalidaError(
      `El archivo pesa más de ${TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB.`,
    );
  }
}

function validarExtension(nombreArchivo: string): void {
  const extension = nombreArchivo.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "xls" || extension === "ods") {
    throw new FichaInvalidaError(
      `Formato "${extension}" no soportado. Guárdalo como .xlsx e inténtalo de nuevo.`,
    );
  }
  if (!EXTENSIONES_PERMITIDAS.has(extension)) {
    throw new FichaInvalidaError(
      `Formato "${extension || "desconocido"}" no soportado. Solo se aceptan archivos .xlsx o .xlsm.`,
    );
  }
}

async function abrirLibro(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
    await cargarCasillasFormulario(buffer, workbook);
  } catch {
    throw new FichaInvalidaError(
      "El archivo está vacío, corrupto, o no es un Excel válido (OOXML).",
    );
  }
  return workbook;
}

function validarPlantilla(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const worksheet = workbook.getWorksheet(HOJA_PRINCIPAL);
  if (!worksheet) {
    throw new FichaInvalidaError(
      `El archivo no tiene una hoja "${HOJA_PRINCIPAL}" — no parece ser la ficha MINTUR.`,
    );
  }
  const b1 = leerTexto(worksheet, "B1").toUpperCase();
  if (!b1.includes("JERARQUIZACIÓN") && !b1.includes("JERARQUIZACION")) {
    throw new FichaInvalidaError(
      'La celda B1 no contiene "JERARQUIZACIÓN" — no parece ser la plantilla MINTUR esperada.',
    );
  }
  const b5 = leerTexto(worksheet, "B5");
  if (!b5.toLowerCase().includes("nombre del atractivo")) {
    throw new FichaInvalidaError(
      'La celda B5 no coincide con "1.1 Nombre del Atractivo Turístico" — podría ser una ' +
        "versión distinta de la plantilla.",
    );
  }
  return worksheet;
}

function leerCodigoAtractivo(worksheet: ExcelJS.Worksheet): string | null {
  // Las fórmulas de la plantilla sin nombre pueden no traer resultado en caché;
  // `leerCelda` las representa como 0 para preservar dígitos válidos en fichas llenas.
  if (leerTextoOpcional(worksheet, "B6") === null) return null;

  const partes = CODIGOS_COLUMNAS.map((col) => {
    const valor = leerCelda(worksheet, `${col}2`);
    return valor === null ? "" : String(valor);
  });
  const codigo = partes.join("");
  return codigo.trim() === "" ? null : codigo;
}

function leerIdentificacion(worksheet: ExcelJS.Worksheet): FichaIdentificacion {
  return {
    nombre: leerTextoOpcional(worksheet, "B6"),
    categoria: { texto: leerTextoOpcional(worksheet, "B8") },
    tipo: { texto: leerTextoOpcional(worksheet, "I8") },
    subtipo: { texto: leerTextoOpcional(worksheet, "P8") },
    codigoAtractivo: leerCodigoAtractivo(worksheet),
  };
}

function leerUbicacion(
  worksheet: ExcelJS.Worksheet,
  advertencias: string[],
): FichaUbicacion {
  const latCrudo = leerTexto(worksheet, "B15");
  const lonCrudo = leerTexto(worksheet, "I15");
  const lat = parsearCoordenada(latCrudo, RANGO_LATITUD_ECUADOR, "Latitud (B15)");
  const lon = parsearCoordenada(lonCrudo, RANGO_LONGITUD_ECUADOR, "Longitud (I15)");
  if (!lat.ok) advertencias.push(lat.advertencia);
  if (!lon.ok) advertencias.push(lon.advertencia);

  return {
    provincia: { texto: leerTextoOpcional(worksheet, "B11") },
    canton: { texto: leerTextoOpcional(worksheet, "I11") },
    parroquia: { texto: leerTextoOpcional(worksheet, "P11") },
    barrioSectorComuna: leerTextoOpcional(worksheet, "B13"),
    callePrincipal: leerTextoOpcional(worksheet, "I13"),
    numero: leerTextoOpcional(worksheet, "N13"),
    calleTransversal: leerTextoOpcional(worksheet, "R13"),
    latitud: {
      crudo: latCrudo,
      valor: lat.ok ? lat.valor : null,
      advertencia: lat.ok ? null : lat.advertencia,
    },
    longitud: {
      crudo: lonCrudo,
      valor: lon.ok ? lon.valor : null,
      advertencia: lon.ok ? null : lon.advertencia,
    },
    altitudMsnm: parsearAltitud(leerCelda(worksheet, "P15")),
    administracion: {
      tipo: leerTextoOpcional(worksheet, "F17"),
      institucion: leerTextoOpcional(worksheet, "P17"),
      nombre: leerTextoOpcional(worksheet, "F18"),
      cargo: leerTextoOpcional(worksheet, "P18"),
      telefono: leerTextoOpcional(worksheet, "F19"),
      email: leerTextoOpcional(worksheet, "P19"),
      observacion: leerTextoOpcional(worksheet, "E20"),
    },
  };
}

const TIPOS_INGRESO = [
  { valor: "LIBRE" as const, fila: 31 },
  { valor: "RESTRINGIDO" as const, fila: 32 },
  { valor: "PAGADO" as const, fila: 33 },
];

function leerIngreso(worksheet: ExcelJS.Worksheet): FichaIngreso {
  const tipoSeleccionado = leerSeleccionUnica(
    worksheet,
    TIPOS_INGRESO.map((t) => ({ valor: t.valor, refEtiqueta: `B${t.fila}:C${t.fila}` })),
  );

  const horarios = TIPOS_INGRESO.map((t) => ({
    tipo: t.valor,
    horaIngreso: horaDesdeFraccionDia(leerCelda(worksheet, `E${t.fila}`)),
    horaSalida: horaDesdeFraccionDia(leerCelda(worksheet, `G${t.fila}`)),
  }));

  const formasPagoOpciones: Array<{ nombre: string; refEtiqueta: string }> = [
    { nombre: "Efectivo", refEtiqueta: "J34:K34" },
    { nombre: "Dinero electrónico", refEtiqueta: "M34:N34" },
    { nombre: "Depósito bancario", refEtiqueta: "P34:Q34" },
    { nombre: "Tarjeta de débito", refEtiqueta: "S34:U34" },
    { nombre: "Tarjeta de crédito", refEtiqueta: "J35:L35" },
    { nombre: "Transferencia bancaria", refEtiqueta: "N35:Q35" },
    { nombre: "Cheque", refEtiqueta: "S35:U35" },
  ];
  const formasPago = formasPagoOpciones
    .filter((opcion) => leerMarcaJuntoAEtiqueta(worksheet, opcion.refEtiqueta) === true)
    .map((opcion) => opcion.nombre);

  return {
    tipoSeleccionado: {
      valor: tipoSeleccionado.valor,
      advertencia: tipoSeleccionado.advertencia,
    },
    horarios,
    // "d. Maneja un sistema de reservas" (B34:G34) no tiene una casilla adyacente
    // identificable en el layout de esta fila — coexiste con la etiqueta "f. Forma
    // de Pago:" en las mismas columnas. Sin coordenada confirmada, se deja sin dato
    // en vez de adivinar.
    manejaReservas: null,
    formasPago,
    precioDesde: leerPositivoOpcional(worksheet, "E35"),
    precioHasta: leerPositivoOpcional(worksheet, "G35"),
    mesesRecomendados: leerTextoOpcional(worksheet, "H36"),
    observacion: leerTextoOpcional(worksheet, "E37"),
  };
}

function leerCaracteristicas(worksheet: ExcelJS.Worksheet): FichaCaracteristicas {
  const lineaProducto = leerSeleccionUnica(worksheet, [
    { valor: "CULTURA" as const, refEtiqueta: "B25:G25" },
    { valor: "NATURALEZA" as const, refEtiqueta: "I25:N25" },
    { valor: "AVENTURA" as const, refEtiqueta: "P25:U25" },
  ]);
  const escenario = leerSeleccionUnica(worksheet, [
    { valor: "PRISTINO" as const, refEtiqueta: "B27:C27" },
    { valor: "PRIMITIVO" as const, refEtiqueta: "F27:G27" },
    { valor: "RUSTICO_NATURAL" as const, refEtiqueta: "J27:L27" },
    { valor: "RURAL" as const, refEtiqueta: "O27:P27" },
    { valor: "URBANO" as const, refEtiqueta: "S27:T27" },
  ]);

  const temperatura = parsearRango(leerTextoOpcional(worksheet, "N23"));
  const precipitacion = parsearRango(leerTextoOpcional(worksheet, "U23"));

  return {
    clima: {
      texto: leerTextoOpcional(worksheet, "D23"),
      temperaturaMinC: temperatura.min,
      temperaturaMaxC: temperatura.max,
      precipitacionMinMm: precipitacion.min,
      precipitacionMaxMm: precipitacion.max,
    },
    lineaProducto: { valor: lineaProducto.valor, advertencia: lineaProducto.advertencia },
    escenario: { valor: escenario.valor, advertencia: escenario.advertencia },
    ingreso: leerIngreso(worksheet),
  };
}

/** "14 - 16" → {min:14, max:16}. Usado tanto para temperatura como precipitación. */
function parsearRango(texto: string | null): { min: number | null; max: number | null } {
  if (!texto) return { min: null, max: null };
  const match = /(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/.exec(texto);
  if (!match) return { min: null, max: null };
  return { min: Number(match[1]), max: Number(match[2]) };
}

const ORDENES_VIA = [
  { orden: "PRIMER_ORDEN" as const, fila: 44 },
  { orden: "SEGUNDO_ORDEN" as const, fila: 45 },
  { orden: "TERCER_ORDEN" as const, fila: 46 },
];

function leerViasTerrestres(
  worksheet: ExcelJS.Worksheet,
  advertencias: string[],
): FichaViaTerrestre[] {
  const vias: FichaViaTerrestre[] = [];
  for (const { orden, fila } of ORDENES_VIA) {
    const inicioCrudo = leerTexto(worksheet, `J${fila}`);
    const finCrudo = leerTexto(worksheet, `M${fila}`);
    if (inicioCrudo === "" && finCrudo === "") continue;
    if (inicioCrudo === "0" && finCrudo === "0") continue;

    const inicio = parsearCoordenadaPar(
      inicioCrudo,
      `Vía ${orden} - coordenada de inicio`,
    );
    const fin = parsearCoordenadaPar(finCrudo, `Vía ${orden} - coordenada de fin`);
    if (inicio.advertencia) advertencias.push(inicio.advertencia);
    if (fin.advertencia) advertencias.push(fin.advertencia);

    vias.push({
      orden,
      coordenadaInicio: { crudo: inicioCrudo, advertencia: inicio.advertencia },
      coordenadaFin: { crudo: finCrudo, advertencia: fin.advertencia },
      distanciaKm: leerPositivoOpcional(worksheet, `P${fila}`),
      tipoMaterial: leerTextoOpcional(worksheet, `R${fila}`),
      estado: leerTextoOpcional(worksheet, `U${fila}`),
    });
  }
  return vias;
}

const TIPOS_TRANSPORTE: Array<{ nombre: string; refEtiqueta: string }> = [
  { nombre: "Bus", refEtiqueta: "B55:C55" },
  { nombre: "Buseta", refEtiqueta: "E55:F55" },
  { nombre: "Transporte 4x4", refEtiqueta: "H55:J55" },
  { nombre: "Taxi", refEtiqueta: "L55:M55" },
  { nombre: "Moto taxi", refEtiqueta: "P55:Q55" },
  { nombre: "Teleférico", refEtiqueta: "S55:T55" },
  { nombre: "Lancha", refEtiqueta: "B56:C56" },
  { nombre: "Bote", refEtiqueta: "E56:F56" },
  { nombre: "Barco", refEtiqueta: "H56:J56" },
  { nombre: "Canoa", refEtiqueta: "L56:M56" },
  { nombre: "Avión", refEtiqueta: "P56:Q56" },
  { nombre: "Avioneta", refEtiqueta: "S56:T56" },
  { nombre: "Helicóptero", refEtiqueta: "B57:C57" },
  { nombre: "Otro", refEtiqueta: "E57:F57" },
];

function leerTransporteDetalle(
  worksheet: ExcelJS.Worksheet,
): FichaCooperativaTransporte[] {
  const cooperativas: FichaCooperativaTransporte[] = [];
  for (let fila = 62; fila <= 66; fila += 1) {
    const nombre = leerTextoOpcional(worksheet, `B${fila}`);
    if (!nombre) continue;

    let frecuencia: FichaCooperativaTransporte["frecuencia"] = null;
    if (leerMarcaDirecta(worksheet, `K${fila}`)) frecuencia = "DIARIA";
    else if (leerMarcaDirecta(worksheet, `L${fila}`)) frecuencia = "SEMANAL";
    else if (leerMarcaDirecta(worksheet, `M${fila}`)) frecuencia = "MENSUAL";
    else if (leerMarcaDirecta(worksheet, `N${fila}`)) frecuencia = "EVENTUAL";

    cooperativas.push({
      nombre,
      estacionTerminal: leerTextoOpcional(worksheet, `H${fila}`),
      frecuencia,
      detalleTraslado: leerTextoOpcional(worksheet, `O${fila}`),
    });
  }
  return cooperativas;
}

const TIPOS_ACCESIBILIDAD_GENERAL: Array<{ nombre: string; refEtiqueta: string }> = [
  { nombre: "General", refEtiqueta: "B68:C68" },
  { nombre: "Discapacidad física", refEtiqueta: "E68:F68" },
  { nombre: "Discapacidad visual", refEtiqueta: "H68:I68" },
  { nombre: "Discapacidad auditiva", refEtiqueta: "K68:L68" },
  { nombre: "Discapacidad intelectual o psicosocial", refEtiqueta: "N68:R68" },
  { nombre: "No es accesible", refEtiqueta: "T68:U68" },
];

function leerAccesoConectividad(
  worksheet: ExcelJS.Worksheet,
  advertencias: string[],
): FichaAccesoConectividad {
  const coordenadasCrudo =
    `${leerTexto(worksheet, "R40")} ${leerTexto(worksheet, "U40")}`.trim();
  let coordenadas: FichaAccesoConectividad["coordenadas"] = null;
  if (coordenadasCrudo !== "") {
    const par = parsearCoordenadaPar(coordenadasCrudo, "Coordenadas ciudad más cercana");
    coordenadas = { crudo: coordenadasCrudo, advertencia: par.advertencia };
    if (par.advertencia) advertencias.push(par.advertencia);
  }

  const accesibilidadGeneral: FichaAccesoConectividad["accesibilidadGeneral"] = {};
  for (const opcion of TIPOS_ACCESIBILIDAD_GENERAL) {
    const marcado = leerMarcaJuntoAEtiqueta(worksheet, opcion.refEtiqueta);
    accesibilidadGeneral[opcion.nombre] =
      marcado === true ? "SI" : marcado === false ? "NO" : null;
  }

  let senalizacionEstado: FichaAccesoConectividad["senalizacionAproximacionEstado"] =
    null;
  if (leerMarcaDirecta(worksheet, "M71")) senalizacionEstado = "BUENO";
  else if (leerMarcaDirecta(worksheet, "Q71")) senalizacionEstado = "REGULAR";
  else if (leerMarcaDirecta(worksheet, "U71")) senalizacionEstado = "MALO";

  return {
    ciudadPobladoCercano: leerTextoOpcional(worksheet, "P39"),
    distanciaKm: leerPositivoOpcional(worksheet, "F40"),
    tiempoAutoHoras: horaDesdeFraccionDia(leerCelda(worksheet, "L40")),
    coordenadas,
    viasTerrestres: leerViasTerrestres(worksheet, advertencias),
    transporteTipos: TIPOS_TRANSPORTE.filter(
      (t) => leerMarcaJuntoAEtiqueta(worksheet, t.refEtiqueta) === true,
    ).map((t) => t.nombre),
    transporteDetalle: leerTransporteDetalle(worksheet),
    accesibilidadGeneral,
    senalizacionAproximacionEstado: senalizacionEstado,
  };
}

function leerResponsable(
  worksheet: ExcelJS.Worksheet,
  columnas: {
    nombre: string;
    institucion: string;
    cargo: string;
    email: string;
    telefono: string;
    fecha: string;
  },
): FichaResponsableFirma {
  return {
    nombre: leerTextoOpcional(worksheet, columnas.nombre),
    institucion: leerTextoOpcional(worksheet, columnas.institucion),
    cargo: leerTextoOpcional(worksheet, columnas.cargo),
    email: leerTextoOpcional(worksheet, columnas.email),
    telefono: leerTextoOpcional(worksheet, columnas.telefono),
    fecha: fechaDesdeSerial(leerCelda(worksheet, columnas.fecha)),
  };
}

function leerResumenValoracion(workbook: ExcelJS.Workbook): FichaResumenValoracion {
  const worksheet = workbook.getWorksheet(HOJA_RESUMEN);
  if (!worksheet) return { criterios: [], totalInformativo: null };

  const criterios = [];
  for (let fila = 3; fila <= 11; fila += 1) {
    const codigo = leerTextoOpcional(worksheet, `A${fila}`);
    if (!codigo) continue;
    const nombre = leerTextoOpcional(worksheet, `B${fila}`) ?? "";
    const puntajeMaximo = Number(leerTexto(worksheet, `D${fila}`)) || 0;
    const resultadoTexto = leerTexto(worksheet, `E${fila}`);
    criterios.push({
      codigo,
      nombre,
      puntajeMaximo,
      resultado: resultadoTexto === "" ? null : Number(resultadoTexto),
    });
  }
  const totalTexto = leerTexto(worksheet, "E12");
  return {
    criterios,
    totalInformativo: totalTexto === "" ? null : Number(totalTexto),
  };
}

function leerAccesibilidadDetalle(
  workbook: ExcelJS.Workbook,
): FichaAccesibilidadDetalleItem[] {
  const worksheet = workbook.getWorksheet(HOJA_ACCESIBILIDAD);
  if (!worksheet) return [];

  const items: FichaAccesibilidadDetalleItem[] = [];
  let grupoActual = "";
  const filaMaxima = worksheet.rowCount || 100;
  for (let fila = 1; fila <= filaMaxima; fila += 1) {
    const textoA = leerTextoOpcional(worksheet, `A${fila}`);
    if (!textoA) continue;
    const k = leerTexto(worksheet, `K${fila}`).toUpperCase();
    const l = leerTexto(worksheet, `L${fila}`).toUpperCase();
    const esEncabezadoDeGrupo = k === "SI" && l === "NO";
    if (esEncabezadoDeGrupo) {
      grupoActual = textoA;
      continue;
    }
    if (!grupoActual) continue;

    const marcaSi = leerMarcaDirecta(worksheet, `K${fila}`);
    const marcaNo = leerMarcaDirecta(worksheet, `L${fila}`);
    items.push({
      grupo: grupoActual,
      criterio: textoA,
      respuesta: marcaSi ? "SI" : marcaNo ? "NO" : null,
      observacion: leerTextoOpcional(worksheet, `M${fila}`),
    });
  }
  return items;
}

function leerImagenesAnexos(
  workbook: ExcelJS.Workbook,
  advertencias: string[],
): { metadata: FichaImagenAnexo[]; adjuntas: FichaImagenAdjunta[] } {
  const worksheet = workbook.getWorksheet(HOJA_PRINCIPAL);
  if (!worksheet) return { metadata: [], adjuntas: [] };

  const media =
    (
      workbook.model as unknown as {
        media?: Array<{ type: string; extension: string; buffer?: Buffer }>;
      }
    ).media ?? [];
  const metadata: FichaImagenAnexo[] = [];
  const adjuntas: FichaImagenAdjunta[] = [];

  for (const imagen of worksheet.getImages()) {
    const row = imagen.range.tl.nativeRow;
    const column = imagen.range.tl.nativeCol;
    // La hoja usa las filas 304–320 como espacio de fotografías de anexos.
    // Se ignoran logos y firmas colocados en otras hojas o secciones.
    if (row < 303 || row > 319 || column < 1 || column > 21) continue;

    const archivo = media[Number(imagen.imageId)];
    if (!archivo || archivo.type !== "image") {
      advertencias.push(
        "No se pudo extraer una imagen ubicada en los anexos de la ficha.",
      );
      continue;
    }

    const nombre = `foto-${metadata.length + 1}.${archivo.extension}`;
    const tamanoBytes = archivo.buffer?.length ?? 0;
    metadata.push({ archivo: nombre, extension: archivo.extension, tamanoBytes });

    const mimeType =
      archivo.extension === "png"
        ? "image/png"
        : archivo.extension === "jpeg"
          ? "image/jpeg"
          : archivo.extension === "webp"
            ? "image/webp"
            : null;
    if (!mimeType) {
      advertencias.push(
        `La imagen ${metadata.length} de los anexos tiene un formato no compatible; no se adjuntó.`,
      );
      continue;
    }
    if (tamanoBytes === 0 || tamanoBytes > TAMANO_MAXIMO_IMAGEN_BYTES) {
      advertencias.push(
        tamanoBytes === 0
          ? `No se pudo extraer la imagen ${metadata.length} de los anexos.`
          : `La imagen ${metadata.length} de los anexos supera el límite de 10 MB y no se adjuntó.`,
      );
      continue;
    }

    adjuntas.push({
      nombre,
      extension: archivo.extension as FichaImagenAdjunta["extension"],
      mimeType,
      tamanoBytes,
      contenidoBase64: archivo.buffer!.toString("base64"),
    });
  }

  return { metadata, adjuntas };
}

/**
 * Lee y valida la ficha MINTUR (`.xlsx`/`.xlsm`). No escribe nada en ninguna
 * base de datos ni resuelve catálogos — eso lo hace `resolverCatalogosFicha`
 * (`catalogos.ts`) con el resultado de esta función. Ver
 * docs/plans/active/importar-ficha-mintur.md.
 */
export async function parsearFicha(
  buffer: ArrayBuffer,
  nombreArchivo: string,
): Promise<ResultadoParseoFicha> {
  validarArchivoFicha(nombreArchivo, buffer.byteLength);

  const workbook = await abrirLibro(buffer);
  const worksheet = validarPlantilla(workbook);

  const advertencias: string[] = [];
  const imagenesAnexos = leerImagenesAnexos(workbook, advertencias);
  const identificacion = leerIdentificacion(worksheet);
  const ubicacion = leerUbicacion(worksheet, advertencias);
  const caracteristicas = leerCaracteristicas(worksheet);
  const accesoConectividad = leerAccesoConectividad(worksheet, advertencias);

  if (caracteristicas.lineaProducto.advertencia) {
    advertencias.push(`Línea de producto: ${caracteristicas.lineaProducto.advertencia}`);
  }
  if (caracteristicas.escenario.advertencia) {
    advertencias.push(`Escenario: ${caracteristicas.escenario.advertencia}`);
  }
  if (caracteristicas.ingreso.tipoSeleccionado.advertencia) {
    advertencias.push(
      `Tipo de ingreso: ${caracteristicas.ingreso.tipoSeleccionado.advertencia}`,
    );
  }

  const datos: FichaExtraida = {
    identificacion,
    ubicacion,
    caracteristicas,
    accesoConectividad,
    descripcion: leerTextoOpcional(worksheet, "B300"),
    responsables: {
      elaborado: leerResponsable(worksheet, {
        nombre: "E325",
        institucion: "E326",
        cargo: "E327",
        email: "E328",
        telefono: "E329",
        fecha: "E331",
      }),
      validado: leerResponsable(worksheet, {
        nombre: "L325",
        institucion: "L326",
        cargo: "L327",
        email: "L328",
        telefono: "L329",
        fecha: "L331",
      }),
      aprobado: leerResponsable(worksheet, {
        nombre: "S325",
        institucion: "S326",
        cargo: "S327",
        email: "S328",
        telefono: "S329",
        fecha: "S331",
      }),
    },
    resumenValoracion: leerResumenValoracion(workbook),
    accesibilidadDetalle: leerAccesibilidadDetalle(workbook),
    imagenes: imagenesAnexos.metadata,
    politicas: leerPoliticas(worksheet),
    actividades: leerActividades(worksheet),
    promocion: leerPromocion(worksheet),
    visitantes: leerVisitantes(worksheet),
    recursoHumano: leerRecursoHumano(worksheet),
    planta: leerPlanta(worksheet),
    conservacion: leerConservacion(worksheet),
    higieneSeguridad: leerHigieneSeguridad(worksheet),
  };

  if (datos.resumenValoracion.totalInformativo !== null) {
    advertencias.push(
      `El Excel reporta un puntaje total de ${datos.resumenValoracion.totalInformativo} ` +
        "(solo informativo — verifica que el panel calcule un valor similar tras revisar la ficha).",
    );
  }

  return { datos, advertencias, imagenesAdjuntas: imagenesAnexos.adjuntas };
}
