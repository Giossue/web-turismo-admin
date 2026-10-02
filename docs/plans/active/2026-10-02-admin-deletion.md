# Eliminación administrativa

## Objetivo

Permitir que el administrador elimine centros turísticos, registros de Catastro,
opiniones y las cinco opciones de catálogo administrables desde sus tablas.

## Implementación

- Añadir una acción Eliminar con confirmación que identifica el registro y explica que
  se conserva el historial.
- Usar rutas DELETE protegidas en la API NestJS, sin acceso directo a la base desde la web.
- Aplicar eliminación lógica diferenciada de la desactivación: los registros eliminados
  salen de los listados y no pueden reactivarse ni modificarse.
- Preservar relaciones, versiones y auditoría; bloquear la eliminación de un tipo de
  establecimiento mientras conserve categorías.
- Mantener visibles las referencias a catálogos retirados en las fichas que ya los usan,
  permitiendo conservarlas en una edición sin admitir nuevas asignaciones.
- Manejar estado pendiente, errores recuperables, actualización de las consultas y
  retirada del último registro de una página.
- Añadir una migración aditiva en el monorepo de la API y desplegarla antes de la API/web.

## Verificación

- Web: `bun run verify` y las 175 pruebas de `bun test` aprobadas.
- API: formato, lint, TypeScript, 327 pruebas unitarias y build aprobados;
  rutas protegidas por rol.
- 20 pruebas reales contra PostgreSQL/PostGIS desde cero: conservación de datos y
  auditoría, referencias retiradas, reintentos, rollback y operaciones simultáneas.
- Migración repetida con datos históricos; arranque local sin repetir migraciones
  antiguas ni reactivar registros eliminados.

## Estado

Implementación local completa. Para habilitarla en un entorno desplegado, aplicar la
migración nueva y actualizar API y web; no se modificó la base desplegada.
