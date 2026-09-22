/**
 * Fuente única de los apartados de la ficha turística: código (el mismo que
 * usa la API en `/admin/centers/:code/sections/:section`), título,
 * descripción y filas sugeridas. El editor, la revisión por diferencias y el
 * cliente de la API derivan sus listas de aquí.
 */
const definitions = [
  {
    code: "identificacion",
    title: "Datos generales y clasificación",
    description: "Nombre, clasificación, territorio y código institucional.",
    coreAnchor: "center-section-identificacion",
    suggestedRows: [],
  },
  {
    code: "ubicacion-admin",
    title: "Ubicación y administración",
    description: "Coordenadas, dirección y responsable institucional.",
    coreAnchor: "center-section-ubicacion-admin",
    suggestedRows: [],
  },
  {
    code: "caracteristicas",
    title: "Características e ingreso",
    description: "Clima, línea de producto, escenario, horarios y tarifas.",
    coreAnchor: "center-section-caracteristicas",
    suggestedRows: [
      "Clima y condiciones habituales",
      "Formas de pago",
      "Meses recomendados",
    ],
  },
  {
    code: "accesibilidad",
    title: "Accesibilidad y conectividad",
    description: "Localidad cercana, vías, transporte, accesibilidad y señalización.",
    coreAnchor: "center-section-accesibilidad",
    suggestedRows: [],
  },
  {
    code: "planta",
    title: "Planta y complementarios",
    description: "Agregados del atractivo, localidad cercana, facilidades y servicios.",
    coreAnchor: "center-section-planta",
    suggestedRows: [
      "Planta turística en el atractivo",
      "Planta turística en la localidad cercana",
      "Facilidades",
      "Servicios complementarios",
    ],
  },
  {
    code: "conservacion",
    title: "Conservación",
    description: "Estado de conservación, alteraciones y declaratorias.",
    suggestedRows: ["Estado de conservación", "Factores de alteración", "Declaratorias"],
  },
  {
    code: "higiene-seguridad",
    title: "Higiene y seguridad",
    description: "Servicios básicos, salud, seguridad, comunicación y contingencia.",
    suggestedRows: [
      "Servicios básicos",
      "Señalética",
      "Servicios de salud",
      "Servicios de seguridad",
      "Comunicación y radios",
      "Amenazas y plan de contingencia",
    ],
  },
  {
    code: "politicas",
    title: "Políticas y regulaciones",
    description: "Políticas institucionales, restricciones y regulaciones aplicables.",
    suggestedRows: [
      "Políticas del atractivo",
      "Regulaciones aplicables",
      "Plan de contingencia",
    ],
  },
  {
    code: "actividades",
    title: "Actividades",
    description: "Actividades compatibles con la categoría y sus condiciones.",
    coreAnchor: "center-section-actividades",
    suggestedRows: [],
  },
  {
    code: "promocion",
    title: "Promoción y comercialización",
    description: "Difusión, comercialización y medios utilizados.",
    suggestedRows: ["Promoción institucional", "Comercialización", "Medios de promoción"],
  },
  {
    code: "visitantes",
    title: "Visitantes y afluencia",
    description: "Temporadas, procedencias, informantes y registros de visitantes.",
    suggestedRows: [
      "Registro de visitantes",
      "Temporadas de visitación",
      "Procedencias",
      "Informantes clave",
      "Afluencia",
    ],
  },
  {
    code: "recurso-humano",
    title: "Recurso humano",
    description: "Personal, formación, idiomas y capacidades disponibles.",
    suggestedRows: ["Resumen de recurso humano", "Formación del personal", "Idiomas"],
  },
  {
    code: "descripcion",
    title: "Descripción",
    description: "Descripción narrativa y observaciones públicas del centro.",
    coreAnchor: "center-section-descripcion",
    suggestedRows: [],
  },
  {
    code: "anexos",
    title: "Anexos y responsabilidades",
    description: "Archivos, responsables, levantamiento y validación del GAD.",
    suggestedRows: [
      "Anexos documentales",
      "Responsables de la ficha",
      "Levantamiento de accesibilidad",
      "Validación del GAD",
    ],
  },
] as const;

export type CenterSectionCode = (typeof definitions)[number]["code"];

export type SectionDefinition = {
  code: CenterSectionCode;
  title: string;
  description: string;
  /** Ancla del bloque del formulario principal que cubre este apartado. */
  coreAnchor?: string;
  suggestedRows: readonly string[];
};

/** Estado de avance de un apartado, tal como lo calcula la API. */
export type SectionProgress =
  "SIN_INICIAR" | "INCOMPLETA" | "COMPLETA" | "CON_ERRORES" | "NO_APLICA";

export const centerSectionDefinitions: readonly SectionDefinition[] = definitions;

const sectionTitles = new Map<string, string>(
  definitions.map((definition) => [definition.code, definition.title]),
);

/** Título visible de un apartado; devuelve el código si no es un apartado conocido. */
export function sectionTitle(code: string): string {
  return sectionTitles.get(code) ?? code;
}
