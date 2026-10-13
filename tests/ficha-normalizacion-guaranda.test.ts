import { describe, expect, test } from "bun:test";

import { meses } from "@/lib/ficha/mapear-secciones";
import {
  RANGO_LATITUD_ECUADOR,
  normalizarTextoCatalogo,
  parsearCoordenada,
} from "@/lib/ficha/normalizacion";

describe("fichas de Guaranda", () => {
  test("ignora el punto o la coma sobrante al borde de un nombre", () => {
    expect(normalizarTextoCatalogo("SALINAS.")).toBe("SALINAS");
    expect(normalizarTextoCatalogo(" Salinas , ")).toBe("SALINAS");
    expect(normalizarTextoCatalogo("Dr. Pérez")).toBe("DR. PEREZ");
  });

  test("acepta la coma o el grado pegados a una coordenada", () => {
    const lat = (texto: string) => parsearCoordenada(texto, RANGO_LATITUD_ECUADOR, "Lat");
    expect(lat("-1.405760,")).toEqual({ ok: true, valor: -1.40576 });
    expect(lat("-1.592335°")).toEqual({ ok: true, valor: -1.592335 });
    expect(lat("-1,58830")).toEqual({ ok: true, valor: -1.5883 });
    expect(lat("-1678955").ok).toBe(false);
  });

  test("«Todo el año» marca los doce meses", () => {
    const todos = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    expect(meses("Todo el año")).toEqual(todos);
    expect(meses("Todos los meses del año")).toEqual(todos);
    expect(meses("Todos los días del año")).toEqual(todos);
    expect(meses("Febrero, Marzo y Noviembre")).toEqual(["2", "3", "11"]);
    expect(meses("Febrero a abril")).toEqual(["2", "3", "4"]);
  });
});
