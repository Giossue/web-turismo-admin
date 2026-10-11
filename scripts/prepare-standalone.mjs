import { cp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const standalone = join(process.cwd(), ".next/standalone");
// Next puede copiar archivos de entorno cargados en un build local.
// Las variables del servidor se inyectan desde el gestor de despliegue.
for (const entry of await readdir(standalone, { withFileTypes: true })) {
  if (/^\.env(?:\.|$)/.test(entry.name) && (entry.isFile() || entry.isSymbolicLink())) {
    await rm(join(standalone, entry.name));
  }
}
await cp("public", join(standalone, "public"), { recursive: true });
await cp(".next/static", join(standalone, ".next/static"), { recursive: true });
