import { describe, expect, test } from "bun:test";

import { ApiError, toQueryString } from "@/lib/http";

describe("toQueryString", () => {
  test("devuelve cadena vacía sin parámetros", () => {
    expect(toQueryString({})).toBe("");
    expect(toQueryString({ q: undefined, status: null, category: "  " })).toBe("");
  });

  test("antepone '?' y conserva el orden de declaración", () => {
    expect(
      toQueryString({ status: "BORRADOR", q: "cascada", limit: 25, offset: 0 }),
    ).toBe("?status=BORRADOR&q=cascada&limit=25&offset=0");
  });

  test("recorta textos y omite los vacíos", () => {
    expect(toQueryString({ q: "  laguna  ", activity: "" })).toBe("?q=laguna");
  });

  test("serializa booleanos, incluido false", () => {
    expect(toQueryString({ active: false, includeInactive: true })).toBe(
      "?active=false&includeInactive=true",
    );
  });

  test("conserva el cero y omite números no finitos", () => {
    expect(toQueryString({ offset: 0, provinceId: Number.NaN, limit: Infinity })).toBe(
      "?offset=0",
    );
  });

  test("codifica caracteres especiales", () => {
    expect(toQueryString({ q: "Río & Cía" })).toBe("?q=R%C3%ADo+%26+C%C3%ADa");
  });
});

describe("ApiError", () => {
  test("conserva el estado HTTP y es un Error", () => {
    const error = new ApiError("Conflicto de versión.", 409);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(409);
    expect(error.message).toBe("Conflicto de versión.");
  });
});
