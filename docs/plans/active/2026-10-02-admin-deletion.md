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
- Manejar estado pendiente, errores recuperables, actualización de las consultas y
  retirada del último registro de una página.
- Añadir una migración aditiva en el monorepo de la API y desplegarla antes de la API/web.

## Verificación

- Formato, lint, TypeScript, pruebas y build de la web y API.
- Migración repetible y conservación de datos en PostgreSQL/PostGIS temporal local.
- Operaciones reales de los servicios contra esa base aislada y pruebas negativas por rol.
