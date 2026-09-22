import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parsearFicha } from "@/lib/ficha/parser";

const RUTA_FIXTURE = path.join(import.meta.dir, "fixtures", "santuario-del-guayco.xlsm");

async function parsearFixture() {
  const buffer = await readFile(RUTA_FIXTURE);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  return parsearFicha(arrayBuffer, "santuario-del-guayco.xlsm");
}

describe("políticas y regulaciones", () => {
  test("4 preguntas con los códigos confirmados en el frontend", async () => {
    const { datos } = await parsearFixture();
    expect(datos.politicas).toHaveLength(4);
    expect(datos.politicas.map((p) => p.codigo)).toEqual([
      "PLAN_DESARROLLO_GAD",
      "PLANIFICACION_TERRITORIAL",
      "REGULACIONES_APLICABLES",
      "ORDENANZAS_APLICABLES",
    ]);
    // Ninguna de las 4 tiene una casilla SI/NO marcada en esta fixture.
    expect(datos.politicas.every((p) => p.respuesta === null)).toBe(true);
  });
});

describe("recurso humano", () => {
  test("conteos de la sección 12", async () => {
    const { datos } = await parsearFixture();
    expect(datos.recursoHumano.personasAdministracionOperacion).toBe(7);
    expect(datos.recursoHumano.personasEspecializadasTurismo).toBe(0);
    expect(datos.recursoHumano.observacion).toContain("colaboradores");
    const hospitalidad = datos.recursoHumano.formacion.find(
      (f) => f.nombre === "Hospitalidad",
    );
    expect(hospitalidad?.grupo).toBe("CAPACITACION");
    expect(hospitalidad?.cantidad).toBe(4);
  });
});

describe("promoción y comercialización", () => {
  test("solo se incluyen los medios con dato real, no los placeholders", async () => {
    const { datos } = await parsearFixture();
    expect(datos.promocion.medios).toHaveLength(2);
    expect(datos.promocion.medios.map((m) => m.nombre)).toEqual([
      "Red social",
      "Medios de comunicación (radio, tv, prensa)",
    ]);
    expect(datos.promocion.observacion).toContain("no forma parte");
  });
});

describe("actividades que se practican", () => {
  test("56 actividades listadas (9.1 + 9.2 completas), ninguna marcada en esta fixture", async () => {
    const { datos } = await parsearFixture();
    expect(datos.actividades).toHaveLength(56);
    expect(datos.actividades.every((a) => a.marcada === false)).toBe(true);
  });
});

describe("registro de visitantes y afluencia", () => {
  test("temporada alta/baja y llegadas (placeholders filtrados)", async () => {
    const { datos } = await parsearFixture();
    expect(datos.visitantes.temporadaAlta.meses).toBe("Septiembre - Agosto");
    expect(datos.visitantes.temporadaAlta.visitantes).toBe(150000);
    expect(datos.visitantes.llegadaNacional).toHaveLength(0);
    expect(datos.visitantes.llegadaExtranjera).toHaveLength(0);
    expect(datos.visitantes.informanteClave.nombre).toBe("Washintong Camacho");
  });
});
