# Plan activo: acción flotante para nueva ficha

## Objetivo

Convertir la acción "Nueva ficha" del inventario en un botón flotante fijo en la esquina
inferior derecha, visible al inicio y al subir, y oculto al desplazarse hacia abajo.

## Implementación

- Mantener una única acción "Nueva ficha" dentro de `CentersSection`.
- Usar un `Fab` extendido de MUI con etiqueta visible, icono y nombre accesible.
- Detectar la dirección del scroll con estado local y limpiar el listener al desmontar.
- Respetar `prefers-reduced-motion` y evitar interacción cuando el FAB está oculto.

## Verificación

- `git diff --check`.
- Revisar que el botón conserve la acción existente y que no quede un botón duplicado.
