# Plan activo: auditoría y refactor de calidad del panel

## Objetivo

Eliminar código muerto, extraer componentes reutilizables, dividir los archivos gigantes
(`center-section-workflow.tsx`, `admin-shell.tsx`, `center-editor.tsx`) y corregir los
bugs y malas prácticas encontrados en una auditoría del portal.

## Alcance

- Ola 1 (base compartida): capa HTTP única, claves de TanStack Query, utilidades
  (`errors`, `format`, `values`, etiquetas), definición única de las 14 secciones de la
  ficha, campos de formulario conectados a react-hook-form (`src/components/ui/form`),
  mejoras de `StatusBadge`, `AdminTable`, `ContentState` y `SectionHeader`, exports
  muertos y props deprecadas de MUI.
- Ola 2 (en paralelo, archivos disjuntos):
  - Flujo de secciones: corregir la carga de accesibilidad (pérdida de datos), los
    `Select` que no muestran el valor guardado, las carreras del autoguardado; dividir en
    `src/lib/center-sections/*` y `src/components/admin/center-sections/*`.
  - Shell: dividir `admin-shell.tsx`, migrar cargas manuales a `useQuery`, paginación
    independiente en revisión, limpiar la caché al cerrar sesión, opiniones.
  - Editor: selector de coordenadas que no crea el mapa, alta de fichas bloqueada en el
    paso 1, reinicio tras el primer guardado, seguridad del endpoint de importación,
    división de `center-editor.tsx` y utilidades de importación.

## Fuera de alcance

- Cambios en la API NestJS.
- Recuperar borradores de accesibilidad ya sobrescritos (requiere revisar la base).

## Riesgos

- Autoguardado del editor y de las secciones: cambia la serialización de guardados.
- `Select` controlados: cambia lo que ve la persona tras recargar (ahora el valor real).

## Verificación

- `bun run format`, `bun run lint`, `bun run typecheck`, `bun test`, `bun run build`
- Prueba manual: crear ficha, editar secciones, recargar y comprobar valores; selector
  de coordenadas; importar `.xlsm`.

## Estado

En curso (22 de septiembre de 2026).
