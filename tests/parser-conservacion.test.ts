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

describe("estado de conservación", () => {
  test("21 factores por componente (5 naturales + 15 antrópicos + Otro), ninguno marcado", async () => {
    const { datos } = await parsearFixture();
    expect(datos.conservacion.atractivo.factores).toHaveLength(21);
    expect(datos.conservacion.entorno.factores).toHaveLength(21);
    expect(datos.conservacion.atractivo.factores.every((f) => f.marcado === false)).toBe(
      true,
    );
    expect(
      datos.conservacion.atractivo.factores.filter((f) => f.origen === "ANTROPICO"),
    ).toHaveLength(15);
  });

  test("estado sin marcar queda null, no se adivina", async () => {
    const { datos } = await parsearFixture();
    expect(datos.conservacion.atractivo.estado).toBeNull();
    expect(datos.conservacion.entorno.estado).toBeNull();
  });

  test("observaciones reales del atractivo y del entorno", async () => {
    const { datos } = await parsearFixture();
    expect(datos.conservacion.atractivo.observacionEstado).toContain("mantenimiento");
    expect(datos.conservacion.entorno.observacionEstado).toContain("alterado el entorno");
  });

  test("declaratoria: placeholders filtrados, observación real conservada", async () => {
    const { datos } = await parsearFixture();
    expect(datos.conservacion.declaratoria.declarante).toBeNull();
    expect(datos.conservacion.declaratoria.observacion).toContain(
      "No existe declaratoria",
    );
  });
});
