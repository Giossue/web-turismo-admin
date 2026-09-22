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

describe("planta turística y complementarios", () => {
  test("alojamiento: conteos por establecimiento (atractivo vacío, ciudad con dato real)", async () => {
    const { datos } = await parsearFixture();
    const hostal = datos.planta.alojamiento.find((a) => a.nombre === "Hostal");
    expect(hostal?.establecimientosAtractivo).toBe(0);
    expect(hostal?.establecimientosCiudad).toBe(2);
    expect(hostal?.segundaMetricaCiudad).toBe(34);
    expect(hostal?.terceraMetricaCiudad).toBe(62);
  });

  test("alimentos y bebidas: Restaurantes", async () => {
    const { datos } = await parsearFixture();
    const restaurantes = datos.planta.alimentosBebidas.find(
      (a) => a.nombre === "Restaurantes",
    );
    expect(restaurantes?.establecimientosCiudad).toBe(3);
    expect(restaurantes?.segundaMetricaCiudad).toBe(31);
    expect(restaurantes?.terceraMetricaCiudad).toBe(134);
  });

  test("guía turística: todos los conteos en cero en esta fixture", async () => {
    const { datos } = await parsearFixture();
    expect(datos.planta.guia.cultura.atractivo).toBe(0);
    expect(datos.planta.guia.aventura.ciudad).toBe(0);
    expect(datos.planta.guia.local.ciudad).toBe(0);
  });

  test("facilidades del entorno: Miradores con cantidad y coordenada rota (advertencia)", async () => {
    const { datos } = await parsearFixture();
    const miradores = datos.planta.facilidadesEntorno.find(
      (f) => f.nombre === "Miradores",
    );
    expect(miradores?.cantidad).toBe(2);
    expect(miradores?.administrador).toBe("Público");
    expect(miradores?.coordenadas?.advertencia).not.toBeNull();
  });

  test("observaciones: se filtra el placeholder del lado atractivo, se conserva el dato real de ciudad", async () => {
    const { datos } = await parsearFixture();
    expect(datos.planta.observacionPlantaAtractivo).toBeNull();
    expect(datos.planta.observacionPlantaCiudad).toContain("hostales");
    expect(datos.planta.observacionFacilidades).toContain("baterias sanitarias");
    expect(datos.planta.observacionComplementarios).toContain("cajeros automáticos");
  });
});
