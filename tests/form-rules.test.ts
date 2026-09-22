import { describe, expect, test } from "bun:test";

import { integerRule, maxLen, numberRule, required } from "@/components/ui/form/rules";

describe("reglas de formulario", () => {
  test("required usa un mensaje por defecto o el indicado", () => {
    expect(required()).toEqual({ value: true, message: "Este campo es obligatorio." });
    expect(required("Ingresa la latitud.").message).toBe("Ingresa la latitud.");
  });

  test("maxLen agrupa miles con punto", () => {
    expect(maxLen(180)).toEqual({ value: 180, message: "Máximo 180 caracteres" });
    expect(maxLen(2_000).message).toBe("Máximo 2.000 caracteres");
  });

  test("numberRule acepta vacío y valida número y rango", () => {
    const validate = numberRule({ min: -90, max: 90 });
    expect(validate("")).toBe(true);
    expect(validate("-1.25")).toBe(true);
    expect(validate("abc")).toBe("Ingresa un número válido.");
    expect(validate("91")).toBe("Usa un valor entre -90 y 90.");
  });

  test("integerRule exige enteros y respeta límites abiertos", () => {
    const validate = integerRule({ min: 0 });
    expect(validate("3")).toBe(true);
    expect(validate("2.5")).toBe("Ingresa un número entero.");
    expect(validate("-1")).toBe("Usa un valor igual o mayor que 0.");
  });
});
