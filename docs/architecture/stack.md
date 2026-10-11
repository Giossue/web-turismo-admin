# Stack conservado

Esta decisión describe el portal existente y reemplaza el stack de referencia de
CognitiveStack. El [ADR 0001](adr/0001-adopt-cognitivestack-preserve-stack.md)
explica la adaptación.

| Área                 | Elección vigente                                                | Fuente de versión                                                 |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Runtime              | Node.js 24 o superior; imagen Node 24 bookworm slim             | `package.json`, `Dockerfile`                                      |
| Gestor               | Bun 1.3.14 declarado; Bun 1.3 o superior admitido               | `packageManager`, `engines`, `bun.lock`                           |
| Web                  | Next.js App Router, React y TypeScript                          | `package.json`, `bun.lock`                                        |
| UI                   | MUI v7, MUI X Community v8, iconos MUI                          | `package.json`, `src/theme.ts`                                    |
| SSR                  | `AppRouterCacheProvider`, CSS variables y nonce CSP             | `src/app/layout.tsx`                                              |
| Datos del cliente    | TanStack Query                                                  | `src/lib/admin-queries.ts`                                        |
| Formularios          | React Hook Form y validaciones compartidas; Zod disponible      | `src/lib/center-form.ts`, `src/components/ui/form/`               |
| HTTP                 | `fetch` encapsulado en `src/lib/http.ts`                        | Cliente existente                                                 |
| Mapas                | MapLibre GL y worker servido por la propia web                  | Selector de coordenadas y script de build                         |
| Excel                | ExcelJS, ZIP validado con yauzl, XML con saxes y worker de Node | `src/lib/ficha/`                                                  |
| Preparación de fotos | Sharp en el worker; bitmap/canvas en la subida manual           | `src/lib/ficha/preparar-foto.ts`, `src/lib/prepare-photo-file.ts` |
| Pruebas existentes   | Bun y Playwright                                                | `tests/`, `e2e/`, `playwright.config.ts`                          |
| Empaquetado          | Next standalone, Docker y Dokploy                               | `next.config.ts`, `Dockerfile`                                    |
| Knowledge            | OpenSpec 1.14.1, dependencia de desarrollo                      | `scripts/openspec.mjs`, `bun.lock`                                |

La API externa usa NestJS. Sus tecnologías de persistencia no se instalan en esta
web. El portal conserva su proveedor institucional de sesión y no añade Better Auth.
MUI reemplaza las referencias de shadcn/Tailwind/Lucide de la plantilla; Query
gestiona datos, mientras DataGrid gestiona tablas. Son responsabilidades distintas.

## Cambios de dependencias

Usar Bun y versionar el lockfile. Documentar propósito, mantenimiento, licencia,
riesgos y compatibilidad de una incorporación. Mantener `patchedDependencies`
para `braces` hasta disponer de una corrección oficial compatible.

Sharp 0.35.5 pasa de dependencia transitiva de Next a dependencia directa para
preparar fotografías de anexos. Se conserva la versión ya fijada por el override;
no cambia el stack ni se añade un proveedor. Sharp tiene licencia Apache-2.0 y
libvips LGPL-3.0-or-later; el proyecto publica documentación, mantenimiento y
[releases oficiales](https://sharp.pixelplumbing.com/changelog/). Sus riesgos de
decodificación y consumo nativo se acotan con firma, límite de píxeles, caché,
procesamiento secuencial y plazo. El worker deja el módulo externo y Next incluye
sus dependencias y binarios en standalone, compatible con Node 24/bookworm.

Un riesgo comprobado puede justificar un cambio de tecnología. Antes de sustituir
el stack, identificar el defecto, evaluar un parche o actualización y registrar
la decisión y sus consecuencias en un ADR.
