# Frontera de datos y migraciones

Este repositorio no tiene ORM, modelos persistentes, conexión PostgreSQL,
PostGIS, Redis ni MinIO. Todos los datos de negocio se leen y escriben por la
API. No añadir Prisma o variables de conexión para cumplir la plantilla.

## Responsabilidad de la API

Esquema, restricciones, transacciones, eliminación lógica, historial y auditoría
se mantienen en el repositorio del backend. Una evolución de datos necesita
migración versionada allí y compatibilidad con los clientes existentes.

El cliente web no demuestra aislamiento de registros, atomicidad o idempotencia
en la base. Los controles de versión que envía y los rechazos que maneja son
parte del contrato, cuya implementación debe comprobarse en el backend.

## Coordinación de cambios

Documentar la migración y el endpoint requeridos por una nueva función. Cuando
un despliegue depende de ellos, establecer el orden API/datos → web. Los ejemplos
de constraints, RLS o tenants de CognitiveStack son criterios para un backend
que los necesite; no describen controles instalados en este portal.

## Operación autorizada

Antes de una modificación de producción, verificar conexión, respaldo,
propietario y permisos de aplicación. Consumir credenciales locales solo en
memoria; nunca copiarlas a argumentos, archivos, logs ni commits. No ejecutar
borrados, seeders de demostración ni rollbacks automáticos en producción.

Las reglas de la sesión sobre `.pgpass` se conservan. Los comandos de Laravel
no aplican a esta web Next.js ni a su API NestJS. Entrar en el repositorio
responsable y seguir su procedimiento cuando se solicite una migración.
