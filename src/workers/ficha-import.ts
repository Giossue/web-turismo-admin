import { parentPort, workerData } from "node:worker_threads";
import { FichaInvalidaError, parsearFicha } from "../lib/ficha/parser";

async function main() {
  try {
    const resultado = await parsearFicha(workerData.buffer, workerData.nombre);
    parentPort?.postMessage({ ok: true, resultado });
  } catch (error) {
    parentPort?.postMessage({
      ok: false,
      message:
        error instanceof FichaInvalidaError
          ? error.message
          : "No se pudo procesar el Excel de forma segura.",
    });
  }
}
void main();
