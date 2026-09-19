# Plan activo: acción superior para nueva ficha

## Objetivo

Ubicar la acción "Nueva ficha" en el área de acciones del encabezado de "Centros
turísticos", alineada arriba a la derecha.

## Implementación

- Mantener una única acción "Nueva ficha" en `PageHeader` cuando la sección activa sea
  `centers`.
- Usar un botón contenido de MUI con icono, etiqueta visible y acción accesible.

## Verificación

- `git diff --check`.
- Revisar que el botón conserve la acción existente y que no quede un botón duplicado.
