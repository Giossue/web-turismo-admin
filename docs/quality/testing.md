# Estrategia y evidencia de comprobación

## Alcance de ejecución

Añadir o ejecutar pruebas cuando el usuario lo solicite. Una revisión del
knowledge comprueba fuentes, enlaces, frontmatter, formato y configuración;
no necesita arrancar la aplicación ni repetir la suite de producto.
No declarar validada una implementación mediante pruebas que no se ejecutaron.

## Comandos existentes

| Comando                                    | Qué comprueba                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `bun run format`                           | Formato de archivos authored; excluye artifacts generados de OpenSpec |
| `bun run lint`                             | ESLint de código y scripts                                            |
| `bun run typecheck`                        | Tipos del proyecto                                                    |
| `bun run test`                             | Worker precompilado y pruebas de Bun                                  |
| `bun run build`                            | Build Next y preparación de standalone                                |
| `bun run verify`                           | Formato, lint, tipos, pruebas y build                                 |
| `bun run test:browser`                     | Playwright contra standalone y API simulada local                     |
| `bun audit --json`                         | Metadatos de dependencias; revisar la excepción parcheada de braces   |
| `bun run openspec validate --all --strict` | Estructura normativa de specs y cambios                               |

Playwright requiere Chromium, build previo y puertos 4317/4318 libres. No usa
la API remota. Una validación de OpenSpec comprueba forma y escenarios escritos;
no demuestra que el código cumple cada escenario.

## Cobertura de riesgo

Las pruebas existentes cubren mappers, formularios, API cliente, sesión, cierre,
generaciones, CSP, importación y límites, entre otros módulos. Preferir escenarios
observables y rechazos a pruebas que solo comparan el texto de una instrucción.

Para cambios sensibles, considerar según el alcance: rol insuficiente,
identificadores ajenos, campos privilegiados, archivo malicioso, timeout,
cancelación, repetición, conflicto y cambio de identidad durante una petición.
El portal no tiene fixtures de tenants porque su contrato no los incorpora.

Mocks sirven para el comportamiento del cliente. Aislamiento y carreras en la
base se verifican en el backend con usuarios y registros de alcance distinto.
No ajustar permisos ni reducir un caso adversario para hacer pasar una prueba.

La cobertura de caché incluye `tests/admin-query-cache.test.ts` para cancelación
de transporte, cambios de filtro/página y recuperación de foco;
`tests/center-cache.test.ts` para lectura vigente y respuestas anteriores;
`tests/imported-center-sections.test.ts` para preservación tras 409, reintento
limitado y serialización; y `tests/admin-data-grid.test.tsx` para estados de
tarjetas y bloqueo de acciones. `e2e/cache.pw.ts` comprueba las transiciones
reales del navegador en escritorio/móvil y la actualización manual/de foco
contra respuestas simuladas.

## Informe

Nombrar comandos y resultado real, entorno usado y límites. Distinguir validación
documental, checks estáticos, pruebas automatizadas, revisión visual y operación
real. Los conteos de una entrega anterior son evidencia histórica, no el resultado
de una ejecución nueva.
