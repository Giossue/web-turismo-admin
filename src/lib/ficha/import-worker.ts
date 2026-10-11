import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { FichaInvalidaError } from "./archivo";
import type { ResultadoParseoFicha } from "./tipos";

export const TIEMPO_MAXIMO_PARSEAR_MS = 15_000;
type WorkerReply =
  { ok: true; resultado: ResultadoParseoFicha } | { ok: false; message: string };

export function parsearFichaAislada(
  buffer: ArrayBuffer,
  nombre: string,
  signal: AbortSignal,
): Promise<ResultadoParseoFicha> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    // El bundle es autónomo y se incluye explícitamente en next.config.ts.
    // Evita trazar las funciones de disco no utilizadas de ExcelJS y copiar el repositorio.
    const worker = new Worker(
      join(/* turbopackIgnore: true */ process.cwd(), ".runtime/ficha-import.cjs"),
      {
        workerData: { buffer, nombre },
        transferList: [buffer],
        resourceLimits: {
          maxOldGenerationSizeMb: 192,
          maxYoungGenerationSizeMb: 32,
          stackSizeMb: 4,
        },
      },
    );
    let completo = false;
    const terminar = (error?: Error, resultado?: ResultadoParseoFicha) => {
      if (completo) return;
      completo = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancelar);
      void worker.terminate().then(() => {
        if (error) reject(error);
        else resolve(resultado!);
      }, reject);
    };
    const cancelar = () =>
      terminar(new FichaInvalidaError("La importación fue cancelada."));
    const timer = setTimeout(
      () =>
        terminar(
          new FichaInvalidaError(
            "El Excel tardó demasiado en procesarse. Reduce su complejidad e intenta de nuevo.",
          ),
        ),
      TIEMPO_MAXIMO_PARSEAR_MS,
    );
    signal.addEventListener("abort", cancelar, { once: true });
    if (signal.aborted) cancelar();
    worker.once("message", (reply: WorkerReply) =>
      reply.ok
        ? terminar(undefined, reply.resultado)
        : terminar(new FichaInvalidaError(reply.message)),
    );
    worker.once("error", () =>
      terminar(
        new FichaInvalidaError(
          "El Excel supera los recursos disponibles para una importación segura.",
        ),
      ),
    );
    worker.once("exit", () =>
      terminar(new FichaInvalidaError("No se pudo completar la importación del Excel.")),
    );
  });
}
