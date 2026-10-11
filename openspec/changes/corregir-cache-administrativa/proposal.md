# Proposal

## Why

Administradores y agentes pueden seguir viendo datos anteriores al cambiar filtros o volver al portal. La recuperación de un conflicto puede reutilizar una ficha antigua y el reintento de importación puede escribir sobre un apartado incorporado por otra persona.

## What Changes

- Forzar la lectura vigente de la ficha después de un conflicto, aunque la caché aún se considere fresca.
- Serializar los apartados importados con los demás guardados de la ficha y comprobar de nuevo su existencia antes de reintentar un conflicto.
- Propagar la cancelación de consultas administrativas al transporte HTTP.
- Compartir frescura y actualización al recuperar foco en los listados y ofrecer actualización manual.
- Mostrar la actualización de páginas y filtros conservando las filas previas, con sus acciones bloqueadas durante la transición.
- Añadir cobertura de regresión y documentar las políticas de caché y sus límites.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `operational-interface`: frescura, cancelación, actualización explícita y estados de transición de listados institucionales.
- `tourism-records`: lectura efectiva de la versión vigente tras un conflicto y serialización de los guardados importados.
- `mintur-import`: reevaluación de apartados existentes tras una lectura vigente y un conflicto.

## Impact

Cliente administrativo, opciones de TanStack Query, editor/importación y tablas/tarjetas MUI; pruebas de Bun y Playwright y fuentes de arquitectura. Se mantienen sesión, roles, URLs, stack y contratos HTTP actuales. No se modifican API, base de datos, despliegue ni dependencias; la API continúa autorizando y validando versiones de cada escritura.
