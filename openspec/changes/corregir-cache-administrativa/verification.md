# Evidencia de corrección de caché

Comprobación local del 10 de octubre de 2026 sobre la base `70f68f3`, con Bun
1.3.14 y las dependencias instaladas del repositorio. La implementación corrige
los seis hallazgos de la revisión: recuperación de conflictos, preservación de
apartados importados, transiciones de listados, cancelación del transporte,
actualización de datos antiguos y configuración compartida de catastro.

## Comprobaciones realizadas

| Comprobación                                                  | Resultado                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `bun run verify`                                              | Formato, lint, tipos, 293 pruebas de Bun sin fallos y build de producción completos       |
| `bun run test:browser`                                        | 13 pruebas aprobadas en Chromium sobre el servidor standalone                             |
| `bun run typecheck` y ESLint de `e2e/cache.pw.ts`             | Aprobados después de ajustar los selectores de las pruebas de navegador                   |
| `bun run openspec validate --specs --strict --no-interactive` | Siete especificaciones vigentes válidas                                                   |
| `bun run openspec validate --all --strict --no-interactive`   | Siete especificaciones y este cambio válidos, sin fallos                                  |
| Revisión de diff y `git diff --check`                         | Sin cambios ajenos ni errores de espacios; contratos, dependencias y lockfile conservados |

La primera ejecución de Playwright detectó tres fallos en selectores: el
contador también coincidía con la vista oculta y la paginación de escritorio
tenía un nombre accesible distinto. Se corrigieron los selectores para buscar
el contador visible y el nombre de cada vista, conservando todas las
comprobaciones de comportamiento. La ejecución completa posterior pasó.

## Cobertura de los hallazgos

- Las consultas consumen el signal y cancelan el transporte de las 14 variantes
  administrativas comprobadas. Cambiar filtros interrumpe la consulta anterior;
  se conserva la protección de sesión y respuestas tardías.
- Una ficha recién guardada en caché no evita la lectura vigente tras un 409.
  Se comprueban el fallo de recuperación y el descarte de una respuesta antigua
  posterior al guardado confirmado.
- La importación omite apartados existentes, consulta cuando no hay detalle,
  preserva un apartado aparecido después del conflicto y solo permite un
  reintento si sigue ausente. Comparte la cola de guardados y usa la versión
  confirmada por el anterior; los rechazos de permisos no reintentan escrituras.
- Las pruebas de navegador retienen filas y total, bloquean acciones durante
  cambios de filtro y página en escritorio/móvil y vuelven a habilitarlas con
  los resultados actuales. La recarga del mismo filtro conserva sus acciones.
- Actualizar conserva una búsqueda, un estado y una página distintos de los
  valores iniciales. Recuperar foco consulta un listado que supera su frescura.
  Gestión y revisión de catastro utilizan las mismas opciones compartidas.
- Las suites existentes de importación, sesión entre pestañas, cierre fallido,
  CSP, nonces y mapa completan la comprobación de integración.

Las specs de `operational-interface`, `tourism-records` y `mintur-import`
incorporan los deltas del cambio conservando los requisitos y escenarios previos.
La arquitectura documenta frescura, retención, estados y recuperación de
conflictos; la estrategia de pruebas identifica la cobertura añadida.

## Límites

Las respuestas privadas de las pruebas de caché están simuladas. Las pruebas
de navegador usan Chromium y el servidor standalone local; no certifican
otros navegadores, permisos o atomicidad de la API desplegada ni carreras
entre sus réplicas. No se operó la API real ni producción. Estas comprobaciones
se realizaron antes de la entrega Git y no incluyen un despliegue.
