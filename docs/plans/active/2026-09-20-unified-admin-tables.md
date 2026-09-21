# Plan activo: tablas administrativas unificadas

## Objetivo

Aplicar a Centros turísticos, Catastro y Catálogos la misma composición visual y los
mismos patrones de tabla que ya usa la vista de Centros turísticos, reduciendo el espacio
vacío del filtro de Catastro y evitando estilos duplicados.

## Implementación

- Crear primitivas compartidas para toolbar de filtros, superficie de tabla y pie de
  paginación.
- Reutilizar esas primitivas en las tres tablas operativas actuales.
- Mantener acciones, estados, filtros, paginación y diálogos existentes.
- Mejorar la semántica de las filas con encabezados de fila y conservar el scroll
  horizontal en pantallas pequeñas.

## Verificación

- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- Revisar el diff y el comportamiento responsive de las tres tablas.

## Estado

Implementado el 20 de septiembre de 2026. Las tablas de Centros turísticos, Catastro y
Catálogos comparten superficie, densidad, estados, acciones, overflow y pie de paginación;
el filtro de Catastro dejó de usar el panel sobredimensionado de la captura.
