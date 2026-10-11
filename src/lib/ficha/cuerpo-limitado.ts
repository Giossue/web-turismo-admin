import { ApiError } from "../http";

export async function leerCuerpoLimitado(
  request: Request,
  limite: number,
  signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer> | null> {
  signal.throwIfAborted();
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  let cancelar!: () => void;
  const interrumpida = new Promise<never>((_, reject) => {
    cancelar = () => {
      reject(new ApiError("La carga del archivo fue cancelada o tardó demasiado.", 408));
      void reader.cancel().catch(() => undefined);
    };
    signal.addEventListener("abort", cancelar, { once: true });
  });
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    if (signal.aborted) cancelar();
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), interrumpida]);
      if (done) break;
      total += value.byteLength;
      if (total > limite) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      partes.push(value);
    }
    const cuerpo = new Uint8Array(total);
    let desplazamiento = 0;
    for (const parte of partes) {
      cuerpo.set(parte, desplazamiento);
      desplazamiento += parte.byteLength;
    }
    return cuerpo;
  } finally {
    signal.removeEventListener("abort", cancelar);
    reader.releaseLock();
  }
}
