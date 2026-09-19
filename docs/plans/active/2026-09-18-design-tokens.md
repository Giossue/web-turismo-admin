# Plan activo: tokens y componentes visuales web

## Objetivo

Centralizar espacios, colores, radios y patrones repetidos de la landing pública y del
panel administrativo sin cambiar contratos de API ni comportamiento operativo.

## Implementación

- `src/theme/tokens.ts` contiene los tokens de color, espacio, forma y layout.
- `src/theme.ts` consume los tokens y mantiene los esquemas claro/oscuro de MUI.
- `src/components/ui` contiene superficies, encabezados, estados de contenido, métricas y
  estados reutilizables.
- Landing, autenticación, resumen, tablas, catálogos, multimedia y editor consumen las
  primitivas compartidas.

## Verificación

- Estado: implementado el 18 de septiembre de 2026.
- `bun run format`, `bun run lint`, `bun run typecheck` y `bun run build` pasan.
- La revisión visual debe cubrir landing y panel en claro/oscuro, desktop y móvil.
- Los colores directos quedan limitados a los tokens y al tema.
