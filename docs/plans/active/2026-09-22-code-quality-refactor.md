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

Implementado el 22 de septiembre de 2026; falta la prueba manual en navegador.

- Ola 1 y ola 2 completadas: `admin-shell.tsx` (1.4k → 256 líneas), `center-editor.tsx`
  (1.7k → ~320) y `center-section-workflow.tsx` (6.9k → 126 más módulos por apartado).
- Corregidos: lectura de accesibilidad (pérdida de datos), `Select` que no mostraban el
  valor guardado, carreras y 409 del autoguardado (guardados en serie por ficha), mapa
  del selector de coordenadas, alta bloqueada en el paso 1, reinicio tras el primer
  guardado, autenticación antes de leer el archivo en la importación, caché al cerrar
  sesión, paginación de revisión, `version: 0` en fichas publicadas sin borrador.
- Tras una revisión independiente se corrigieron además: ediciones revertidas durante
  un guardado, validación de pasos no montados, adopción de datos del servidor tras
  guardar o ante un 409, importación que borraba planta y modalidad, guardado pendiente
  al salir del editor, coordenadas `null` en catastro y altitud entera.
- Pendiente conocido: los cambios de un apartado con guardado programado (menos de 2 s)
  no se envían si la ficha pasa a revisión en ese instante.
