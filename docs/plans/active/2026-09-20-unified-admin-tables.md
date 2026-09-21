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
- Aplicar búsqueda automática a todos los filtros: los selectores consultan al cambiar y
  los campos de texto usan un debounce compartido de 1.5 segundos.
- Retirar el botón manual de búsqueda de Catastro.
- Ubicar las acciones principales de creación en el encabezado de cada módulo, alineadas
  con el título y reutilizando el mismo patrón de `PageHeader`.
- Mantener las pestañas de Catálogos separadas del buscador, con la búsqueda debajo y
  antes de la tabla.
- Presentar los avisos globales centrados, sin cierre manual y con desaparición automática
  a los 3 segundos.

## Verificación

- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- Revisar el diff y el comportamiento responsive de las tres tablas.

## Estado

Implementado el 20 de septiembre de 2026. Las tablas de Centros turísticos, Catastro y
Catálogos comparten superficie, densidad, estados, acciones, overflow y pie de paginación;
el filtro de Catastro dejó de usar el panel sobredimensionado de la captura. La búsqueda
ahora es automática y reutiliza un debounce de 1.5 segundos para los campos de texto.
Las acciones principales de Centros turísticos y Catastro también quedan junto al título,
fuera de las barras de filtros.
En Catálogos, las pestañas y la búsqueda quedan en filas separadas para facilitar el
escaneo antes de la tabla.
Los avisos globales del panel quedan centrados, sin borde ni botón de cierre, y se ocultan
automáticamente después de 3 segundos.
