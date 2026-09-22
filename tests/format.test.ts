import { describe, expect, test } from "bun:test";

import { formatDate, formatDateTime } from "@/lib/format";

// Mediodía UTC: la fecha local es la misma en cualquier zona horaria de ±11 h.
const ISO = "2026-09-22T12:00:00Z";

describe("formatDate", () => {
  test("formatea en es-EC", () => {
    expect(formatDate(ISO)).toBe(new Date(ISO).toLocaleDateString("es-EC"));
    expect(formatDate(ISO)).toContain("2026");
  });

  test("devuelve '—' para valores ausentes o inválidos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("no es fecha")).toBe("—");
  });
});

describe("formatDateTime", () => {
  test("incluye fecha y hora en es-EC", () => {
    expect(formatDateTime(ISO)).toBe(
      new Date(ISO).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" }),
    );
  });

  test("devuelve '—' para valores ausentes o inválidos", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("2026-99-99")).toBe("—");
  });
});
