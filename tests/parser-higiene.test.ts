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

describe("higiene y seguridad", () => {
  test("servicios básicos: valores descriptivos y proveedor (texto, no checkbox)", async () => {
    const { datos } = await parsearFixture();
    const agua = datos.higieneSeguridad.serviciosBasicos.find((s) => s.tipo === "AGUA");
    expect(agua?.valorAtractivo).toBe("Entubada");
    expect(agua?.valorCiudad).toBe("Potable");
    expect(agua?.proveedorCiudad).toContain("Agua Potable y Alcantarillado");
  });

  test("señalética: las dos marcas reales de la fixture (T171 y T177) se leen como BUENO", async () => {
    const { datos } = await parsearFixture();
    const culturales = datos.higieneSeguridad.senaletica.find(
      (s) =>
        s.nombre === "Pictograma de atractivos culturales" &&
        s.ambiente === "AREAS_URBANAS",
    );
    const direccionales = datos.higieneSeguridad.senaletica.find(
      (s) => s.nombre === "Tótems direccionales",
    );
    expect(culturales?.estado).toBe("BUENO");
    expect(culturales?.cantidadAluminio).toBe(1);
    expect(direccionales?.estado).toBe("BUENO");
    expect(direccionales?.cantidadMadera).toBe(1);
    expect(direccionales?.especifiqueOtro).toBe("Direccionamiento a los miradores");
  });

  test("señalética: el resto de los 23 items no tiene estado (sin marca)", async () => {
    const { datos } = await parsearFixture();
    const sinEstado = datos.higieneSeguridad.senaletica.filter((s) => s.estado === null);
    expect(datos.higieneSeguridad.senaletica).toHaveLength(23);
    expect(sinEstado).toHaveLength(21);
  });

  test("salud: conteos por tipo, atractivo y ciudad", async () => {
    const { datos } = await parsearFixture();
    const dispensario = datos.higieneSeguridad.salud.find(
      (s) => s.nombre === "Dispensario médico",
    );
    expect(dispensario?.cantidadCiudad).toBe(2);
    const botiquin = datos.higieneSeguridad.salud.find(
      (s) => s.nombre === "Botiquín de primeros auxilios",
    );
    expect(botiquin?.cantidadAtractivo).toBe(1);
  });

  test("seguridad: detalle como texto directo, sin checkbox", async () => {
    const { datos } = await parsearFixture();
    const policiaNacional = datos.higieneSeguridad.seguridad.find(
      (s) => s.nombre === "Policía nacional",
    );
    expect(policiaNacional?.detalle).toBe("ECU 911");
  });

  test("comunicación y radio portátil: ninguna casilla marcada en esta fixture", async () => {
    const { datos } = await parsearFixture();
    expect(
      datos.higieneSeguridad.telefoniaInternet.every((t) => !t.fija && !t.movil),
    ).toBe(true);
    expect(datos.higieneSeguridad.radioPortatil.usoVisitante).toBe(false);
    expect(datos.higieneSeguridad.observacionRadioPortatil).toContain("No cuenta con");
  });

  test("multiamenazas: 8 amenazas, ninguna marcada; sin plan de contingencia", async () => {
    const { datos } = await parsearFixture();
    expect(datos.higieneSeguridad.amenazas).toHaveLength(8);
    expect(datos.higieneSeguridad.amenazas.every((a) => a.marcada === false)).toBe(true);
    expect(datos.higieneSeguridad.contingencia.existe).toBe(false);
  });
});
