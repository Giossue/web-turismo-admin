import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

await mkdir(resolve(".runtime"), { recursive: true });
const resultado = await Bun.build({
  entrypoints: [resolve("src/workers/ficha-import.ts")],
  outdir: resolve(".runtime"),
  naming: "ficha-import.cjs",
  target: "node",
  format: "cjs",
});
if (!resultado.success)
  throw new AggregateError(
    resultado.logs,
    "No se pudo compilar el worker de importación.",
  );
