/**
 * Reglas de validación para react-hook-form con un único mensaje en español
 * por tipo de error. Los campos numéricos del panel guardan texto, por eso las
 * reglas numéricas aceptan cadenas y tratan el texto vacío como "sin dato"
 * (combínalas con `required` si el campo es obligatorio).
 */

const REQUIRED_MESSAGE = "Este campo es obligatorio.";

export function required(message: string = REQUIRED_MESSAGE) {
  return { value: true, message };
}

function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function maxLen(max: number) {
  return { value: max, message: `Máximo ${groupThousands(max)} caracteres` };
}

type NumberLimits = {
  min?: number;
  max?: number;
  integer?: boolean;
};

function rangeMessage({ min, max }: Pick<NumberLimits, "min" | "max">): string {
  if (min !== undefined && max !== undefined)
    return `Usa un valor entre ${min} y ${max}.`;
  if (min !== undefined) return `Usa un valor igual o mayor que ${min}.`;
  if (max !== undefined) return `Usa un valor igual o menor que ${max}.`;
  return "";
}

/** Valida un número opcional (texto) con límites y, si se pide, entero. */
export function numberRule(limits: NumberLimits = {}) {
  return (value: unknown): true | string => {
    const text = value === null || value === undefined ? "" : String(value).trim();
    if (!text) return true;
    const number = Number(text);
    if (!Number.isFinite(number)) return "Ingresa un número válido.";
    if (limits.integer && !Number.isInteger(number)) return "Ingresa un número entero.";
    if (
      (limits.min !== undefined && number < limits.min) ||
      (limits.max !== undefined && number > limits.max)
    ) {
      return rangeMessage(limits);
    }
    return true;
  };
}

/** Atajo de `numberRule` para enteros. */
export function integerRule(limits: Omit<NumberLimits, "integer"> = {}) {
  return numberRule({ ...limits, integer: true });
}
