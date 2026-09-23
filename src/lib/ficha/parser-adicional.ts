import type ExcelJS from "exceljs";

import { POLICY_DEFINITIONS, type PolicyCode } from "@/lib/center-sections/options";

import { leerMarcaDirecta, leerMarcaJuntoAEtiqueta } from "./checkbox";
import { leerNumeroOpcional, leerTextoOpcional } from "./xlsx-utils";
import type {
  FichaActividad,
  FichaFormacionPersonal,
  FichaPolitica,
  FichaPromocion,
  FichaRecursoHumano,
  FichaVisitantes,
} from "./tipos";

/** SI/NO de una pregunta cuyas dos etiquetas ("SI"/"NO") son celdas simples adyacentes. */
function leerSiNoDirecto(
  worksheet: ExcelJS.Worksheet,
  refSi: string,
  refNo: string,
): "SI" | "NO" | null {
  if (leerMarcaJuntoAEtiqueta(worksheet, refSi)) return "SI";
  if (leerMarcaJuntoAEtiqueta(worksheet, refNo)) return "NO";
  return null;
}

// --- 8. Políticas y regulaciones (filas 224-232) ---
// Celdas de cada pregunta de `POLICY_DEFINITIONS` (mismos códigos que valida
// la API), en el mismo orden a/b/c/d de la ficha.
const CELDAS_POLITICA: Record<
  PolicyCode,
  {
    fila: number;
    refSi: string;
    refNo: string;
    refEspecifique: string | null;
    refAnio: string | null;
  }
> = {
  PLAN_DESARROLLO_GAD: {
    fila: 225,
    refSi: "L225",
    refNo: "N225",
    refEspecifique: null,
    refAnio: "U225:V225",
  },
  PLANIFICACION_TERRITORIAL: {
    fila: 226,
    refSi: "O226",
    refNo: "Q226",
    refEspecifique: "B227:V227",
    refAnio: null,
  },
  REGULACIONES_APLICABLES: {
    fila: 228,
    refSi: "O228",
    refNo: "Q228",
    refEspecifique: "B229:V229",
    refAnio: null,
  },
  ORDENANZAS_APLICABLES: {
    fila: 230,
    refSi: "O230",
    refNo: "Q230",
    refEspecifique: "B231:V231",
    refAnio: null,
  },
};

export function leerPoliticas(worksheet: ExcelJS.Worksheet): FichaPolitica[] {
  return POLICY_DEFINITIONS.map(({ code }) => {
    const celdas = CELDAS_POLITICA[code];
    return {
      codigo: code,
      pregunta: leerTextoOpcional(worksheet, `B${celdas.fila}`) ?? "",
      respuesta: leerSiNoDirecto(worksheet, celdas.refSi, celdas.refNo),
      anioElaboracion: celdas.refAnio ? leerNumeroOpcional(worksheet, celdas.refAnio) : null,
      especifique: celdas.refEspecifique
        ? leerTextoOpcional(worksheet, celdas.refEspecifique)
        : null,
    };
  });
}

// --- 12. Recurso humano (filas 293-298) ---
const FORMACION_EDUCACION: Array<{
  nombre: string;
  refCantidad: string | null;
  refTexto?: string;
}> = [
  { nombre: "Primaria", refCantidad: "D295" },
  { nombre: "Secundaria", refCantidad: "G295" },
  { nombre: "Tercer nivel", refCantidad: "D296" },
  { nombre: "Cuarto nivel", refCantidad: "G296" },
  { nombre: "Otro", refCantidad: null, refTexto: "D297:G297" },
];
const FORMACION_CAPACITACION: Array<{
  nombre: string;
  refCantidad: string | null;
  refTexto?: string;
}> = [
  { nombre: "Primeros auxilios", refCantidad: "K295" },
  { nombre: "Hospitalidad", refCantidad: "N295" },
  { nombre: "Atención al cliente", refCantidad: "K296" },
  { nombre: "Guianza", refCantidad: "N296" },
  { nombre: "Sensibilización de discapacidades", refCantidad: "K297" },
  { nombre: "Otro", refCantidad: null, refTexto: "N297" },
];
const FORMACION_IDIOMA: Array<{
  nombre: string;
  refCantidad: string | null;
  refTexto?: string;
}> = [
  { nombre: "Inglés", refCantidad: "R295" },
  { nombre: "Alemán", refCantidad: "U295" },
  { nombre: "Francés", refCantidad: "R296" },
  { nombre: "Italiano", refCantidad: "U296" },
  { nombre: "Chino", refCantidad: "R297" },
  { nombre: "Otro", refCantidad: null, refTexto: "U297" },
];

function leerFormacion(
  worksheet: ExcelJS.Worksheet,
  grupo: FichaFormacionPersonal["grupo"],
  items: Array<{ nombre: string; refCantidad: string | null; refTexto?: string }>,
): FichaFormacionPersonal[] {
  return items.map((item) => ({
    grupo,
    nombre: item.nombre,
    cantidad: item.refCantidad ? leerNumeroOpcional(worksheet, item.refCantidad) : null,
    detalleOtro: item.refTexto ? leerTextoOpcional(worksheet, item.refTexto) : null,
  }));
}

export function leerRecursoHumano(worksheet: ExcelJS.Worksheet): FichaRecursoHumano {
  return {
    personasAdministracionOperacion: leerNumeroOpcional(worksheet, "L293"),
    personasEspecializadasTurismo: leerNumeroOpcional(worksheet, "U293"),
    formacion: [
      ...leerFormacion(worksheet, "EDUCACION", FORMACION_EDUCACION),
      ...leerFormacion(worksheet, "CAPACITACION", FORMACION_CAPACITACION),
      ...leerFormacion(worksheet, "IDIOMA", FORMACION_IDIOMA),
    ],
    observacion: leerTextoOpcional(worksheet, "E298"),
  };
}

// --- 10. Promoción y comercialización (filas 258-273) ---
const MEDIOS_PROMOCION: Array<{ nombre: string; fila: number; refValor: string }> = [
  { nombre: "Página WEB", fila: 263, refValor: "J263" },
  { nombre: "Red social", fila: 264, refValor: "K264" },
  { nombre: "Revistas especializadas", fila: 265, refValor: "K265" },
  { nombre: "Material POP", fila: 266, refValor: "K266" },
  { nombre: "Oficina de información turística", fila: 267, refValor: "K267" },
  { nombre: "Medios de comunicación (radio, tv, prensa)", fila: 268, refValor: "K268" },
  { nombre: "Asistencia a ferias turísticas", fila: 269, refValor: "K269" },
  { nombre: "Otro", fila: 270, refValor: "K270" },
];

export function leerPromocion(worksheet: ExcelJS.Worksheet): FichaPromocion {
  const medios = MEDIOS_PROMOCION.map((medio) => ({
    nombre: medio.nombre,
    valor: leerTextoOpcional(worksheet, medio.refValor),
    periodicidad: leerTextoOpcional(worksheet, `R${medio.fila}`),
  })).filter((medio) => medio.valor !== null);

  return {
    tienePlanPromocionCantonal: leerSiNoDirecto(worksheet, "K260", "M260"),
    incluidoEnPlan: leerSiNoDirecto(worksheet, "M261", "O261"),
    medios,
    observacionMedios: leerTextoOpcional(worksheet, "E271"),
    formaPartePaquete: leerSiNoDirecto(worksheet, "M272", "O272"),
    detallePaquete: leerTextoOpcional(worksheet, "S272"),
    observacion: leerTextoOpcional(worksheet, "E273"),
  };
}

// --- 9. Actividades que se practican (filas 236-256) ---
const ACTIVIDADES: Array<{ nombre: string; refEtiqueta: string }> = [
  // 9.1.1 En el agua
  { nombre: "Buceo", refEtiqueta: "B236:D236" },
  { nombre: "Kayak de mar", refEtiqueta: "F236:H236" },
  { nombre: "Kayak lacustre", refEtiqueta: "J236:L236" },
  { nombre: "Kayak de río", refEtiqueta: "N236:P236" },
  { nombre: "Surf", refEtiqueta: "R236:T236" },
  { nombre: "Kite surf", refEtiqueta: "B237:D237" },
  { nombre: "Rafting", refEtiqueta: "F237:H237" },
  { nombre: "Snorkel", refEtiqueta: "J237:L237" },
  { nombre: "Tubing", refEtiqueta: "N237:P237" },
  { nombre: "Regata", refEtiqueta: "R237:T237" },
  { nombre: "Paseo en panga", refEtiqueta: "B238:D238" },
  { nombre: "Paseo en bote", refEtiqueta: "F238:H238" },
  { nombre: "Paseo en lancha", refEtiqueta: "J238:L238" },
  { nombre: "Paseo en moto acuática", refEtiqueta: "N238:P238" },
  { nombre: "Parasailing", refEtiqueta: "R238:T238" },
  { nombre: "Esquí acuático", refEtiqueta: "B239:D239" },
  { nombre: "Banana flotante", refEtiqueta: "F239:H239" },
  { nombre: "Boya", refEtiqueta: "J239:L239" },
  { nombre: "Pesca deportiva", refEtiqueta: "N239:P239" },
  { nombre: "Otro (en el agua)", refEtiqueta: "R239" },
  // 9.1.2 En el aire
  { nombre: "Alas Delta", refEtiqueta: "B242:D242" },
  { nombre: "Canopy", refEtiqueta: "F242:H242" },
  { nombre: "Parapente", refEtiqueta: "J242:L242" },
  { nombre: "Otro (en el aire)", refEtiqueta: "N242:O242" },
  // 9.1.3 En superficie terrestre
  { nombre: "Montañismo", refEtiqueta: "B245:D245" },
  { nombre: "Escalada", refEtiqueta: "F245:H245" },
  { nombre: "Senderismo", refEtiqueta: "J245:L245" },
  { nombre: "Cicloturismo", refEtiqueta: "N245:P245" },
  { nombre: "Canyoning", refEtiqueta: "R245:T245" },
  { nombre: "Exploración de cuevas", refEtiqueta: "B246:D246" },
  { nombre: "Actividades recreativas", refEtiqueta: "F246:H246" },
  { nombre: "Cabalgata", refEtiqueta: "J246:L246" },
  { nombre: "Caminata", refEtiqueta: "N246:P246" },
  { nombre: "Camping", refEtiqueta: "R246:T246" },
  { nombre: "Picnic", refEtiqueta: "B247:D247" },
  { nombre: "Observación de flora y fauna", refEtiqueta: "F247:H247" },
  { nombre: "Observación de astros", refEtiqueta: "J247:L247" },
  { nombre: "Otro (en superficie terrestre)", refEtiqueta: "N247:O247" },
  // 9.2 Atractivos culturales — tangibles e intangibles
  { nombre: "Recorridos guiados", refEtiqueta: "B251:G251" },
  { nombre: "Recorrido autoguiados", refEtiqueta: "I251:N251" },
  { nombre: "Visita a talleres artísticos", refEtiqueta: "P251:U251" },
  { nombre: "Participación en talleres artísticos", refEtiqueta: "B252:G252" },
  { nombre: "Visita a talleres artesanales", refEtiqueta: "I252:N252" },
  { nombre: "Participación en talleres artesanales", refEtiqueta: "P252:U252" },
  {
    nombre: "Exposiciones temáticas permanentes, temporales y eventuales",
    refEtiqueta: "B253:G253",
  },
  {
    nombre: "Exhibición de piezas, muestras, obras originales",
    refEtiqueta: "I253:N253",
  },
  { nombre: "Actividades vivenciales y/o lúdicas", refEtiqueta: "P253:U253" },
  { nombre: "Presentaciones o representaciones en vivo", refEtiqueta: "B254:G254" },
  { nombre: "Muestras audiovisuales", refEtiqueta: "I254:N254" },
  { nombre: "Fotografía", refEtiqueta: "P254:U254" },
  { nombre: "Degustación de platos tradicionales", refEtiqueta: "B255:G255" },
  { nombre: "Participación de la celebración", refEtiqueta: "I255:N255" },
  { nombre: "Compra de artesanías", refEtiqueta: "P255:U255" },
  { nombre: "Convivencia", refEtiqueta: "B256:G256" },
  { nombre: "Medicina ancestral", refEtiqueta: "I256:N256" },
  { nombre: "Otro (cultural)", refEtiqueta: "P256" },
];

export function leerActividades(worksheet: ExcelJS.Worksheet): FichaActividad[] {
  return ACTIVIDADES.map((actividad) => ({
    nombre: actividad.nombre,
    marcada: leerMarcaJuntoAEtiqueta(worksheet, actividad.refEtiqueta) === true,
  }));
}

// --- 11. Registro de visitantes y afluencia (filas 274-291) ---
function leerLlegadas<T extends "ciudad" | "pais">(
  worksheet: ExcelJS.Worksheet,
  campo: T,
  filas: number[],
  colEtiqueta: string,
  colMensual: string,
  colAnual: string,
) {
  return filas
    .map((fila) => ({
      [campo]: leerTextoOpcional(worksheet, `${colEtiqueta}${fila}`),
      llegadasMensuales: leerNumeroOpcional(worksheet, `${colMensual}${fila}`),
      totalAnual: leerNumeroOpcional(worksheet, `${colAnual}${fila}`),
    }))
    .filter((item) => item[campo] !== null) as Array<
    {
      [K in T]: string;
    } & { llegadasMensuales: number | null; totalAnual: number | null }
  >;
}

export function leerVisitantes(worksheet: ExcelJS.Worksheet): FichaVisitantes {
  return {
    poseeRegistro: leerSiNoDirecto(worksheet, "H276", "J276"),
    tipoRegistro: leerMarcaJuntoAEtiqueta(worksheet, "M276")
      ? "DIGITAL"
      : leerMarcaJuntoAEtiqueta(worksheet, "O276")
        ? "PAPEL"
        : null,
    aniosRegistro: leerNumeroOpcional(worksheet, "T276"),
    generaReportes: leerSiNoDirecto(worksheet, "J277", "L277"),
    frecuenciaReportes: leerTextoOpcional(worksheet, "R277"),
    temporadaAlta: {
      marcada: leerMarcaDirecta(worksheet, "E279") === true,
      meses: leerTextoOpcional(worksheet, "G279"),
      visitantes: leerNumeroOpcional(worksheet, "S279"),
    },
    temporadaBaja: {
      marcada: leerMarcaDirecta(worksheet, "E280") === true,
      meses: leerTextoOpcional(worksheet, "G280"),
      visitantes: leerNumeroOpcional(worksheet, "S280"),
    },
    llegadaNacional: leerLlegadas(worksheet, "ciudad", [283, 284, 285], "E", "G", "J"),
    llegadaExtranjera: leerLlegadas(worksheet, "pais", [283, 284, 285], "O", "Q", "T"),
    observacionLlegadas: leerTextoOpcional(worksheet, "E286"),
    informanteClave: {
      nombre: leerTextoOpcional(worksheet, "F288"),
      contacto: leerTextoOpcional(worksheet, "P288"),
    },
    observacion: leerTextoOpcional(worksheet, "E291"),
  };
}
