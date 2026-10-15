import type { CenterSectionCode } from "@/lib/center-sections/definitions";

/**
 * Dónde está en el formulario el campo al que se refiere un aviso: el paso
 * (apartado), el campo y cuál de los dos formularios lo contiene (el principal
 * del editor o el propio del apartado).
 */
export type IssueTarget = {
  sectionCode: CenterSectionCode;
  field: string;
  form: "main" | "section";
};

type Rule = { pattern: RegExp; target: IssueTarget };

const main = (sectionCode: CenterSectionCode, field: string): IssueTarget => ({
  sectionCode,
  field,
  form: "main",
});
const section = (sectionCode: CenterSectionCode, field: string): IssueTarget => ({
  sectionCode,
  field,
  form: "section",
});

/** Avisos de la importación y errores de la API que apuntan a un campo concreto. */
const RULES: Rule[] = [
  { pattern: /^Provincia\b/, target: main("identificacion", "provinceId") },
  { pattern: /^Cantón\b/, target: main("identificacion", "cantonId") },
  { pattern: /^Parroquia\b/, target: main("identificacion", "parishId") },
  { pattern: /^Categoría\b/, target: main("identificacion", "categoryId") },
  { pattern: /^Tipo:/, target: main("identificacion", "typeId") },
  { pattern: /^Subtipo\b/, target: main("identificacion", "subtypeId") },
  { pattern: /^Línea de producto\b/, target: main("identificacion", "productLineId") },
  { pattern: /^Escenario\b/, target: main("identificacion", "scenarioId") },
  {
    pattern: /^Tipo de ingreso\b/,
    target: main("caracteristicas", "admission.incomeTypeId"),
  },
  {
    pattern: /^Atención\b/,
    target: main("caracteristicas", "admission.attentionModeId"),
  },
  { pattern: /^Actividad\b/, target: main("actividades", "activityIds") },
  { pattern: /^Clima\b/, target: section("caracteristicas", "climateId") },
  { pattern: /^Localidad cercana\b/, target: section("accesibilidad", "localityId") },
  {
    pattern: /^Coordenadas ciudad más cercana\b/,
    target: section("accesibilidad", "localityId"),
  },
  {
    pattern: /^Vía \w+ - coordenada de fin\b/,
    target: section("accesibilidad", "accessibilityRoads.0.endLatitude"),
  },
  {
    pattern: /^Vía \w+/,
    target: section("accesibilidad", "accessibilityRoads.0.startLatitude"),
  },
  { pattern: /^Facilidad\b/, target: main("planta", "facilityIds") },
  {
    pattern: /validación del GAD requiere una aceptación/i,
    target: section("anexos", "gadValidation.acceptance"),
  },
  {
    pattern: /validación del GAD requiere nombre/i,
    target: section("anexos", "gadValidation.name"),
  },
  {
    pattern: /responsables requieren un tipo de responsabilidad/i,
    target: section("anexos", "annexResponsibles.0.typeId"),
  },
];

/** Campo al que apunta el mensaje, o `null` si no se puede ubicar uno concreto. */
export function ubicarAviso(mensaje: string): IssueTarget | null {
  const texto = mensaje.trim();
  return RULES.find(({ pattern }) => pattern.test(texto))?.target ?? null;
}
