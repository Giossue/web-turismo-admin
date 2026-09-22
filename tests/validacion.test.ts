import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parsearFicha } from "@/lib/ficha/parser";
import { resultadoParseoFichaSchema } from "@/lib/ficha/validacion";

const RUTA_FIXTURE = path.join(import.meta.dir, "fixtures", "santuario-del-guayco.xlsm");

test("el resultado real del parser cumple el schema de validación", async () => {
  const buffer = await readFile(RUTA_FIXTURE);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const resultado = await parsearFicha(arrayBuffer, "santuario-del-guayco.xlsm");
  const validacion = resultadoParseoFichaSchema.safeParse(resultado);
  if (!validacion.success) {
    console.error(validacion.error.issues);
  }
  expect(validacion.success).toBe(true);
});
