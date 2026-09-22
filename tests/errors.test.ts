import { describe, expect, test } from "bun:test";

import { errorMessage } from "@/lib/errors";
import { ApiError } from "@/lib/http";

describe("errorMessage", () => {
  test("usa el mensaje de un Error", () => {
    expect(errorMessage(new Error("Falló la API."), "Respaldo")).toBe("Falló la API.");
  });

  test("conserva el mensaje de un ApiError", () => {
    expect(errorMessage(new ApiError("Versión desactualizada.", 409), "Respaldo")).toBe(
      "Versión desactualizada.",
    );
  });

  test("usa el respaldo para valores que no son Error", () => {
    expect(errorMessage("texto", "Respaldo")).toBe("Respaldo");
    expect(errorMessage(null, "Respaldo")).toBe("Respaldo");
    expect(errorMessage(undefined, "Respaldo")).toBe("Respaldo");
    expect(errorMessage({ message: "no es Error" }, "Respaldo")).toBe("Respaldo");
  });

  test("usa el respaldo para un Error sin mensaje", () => {
    expect(errorMessage(new Error(""), "Respaldo")).toBe("Respaldo");
    expect(errorMessage(new Error("   "), "Respaldo")).toBe("Respaldo");
  });
});
