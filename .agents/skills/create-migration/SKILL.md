---
name: create-migration
description: Coordina dependencias de esquema y migraciones de la API cuando un cambio del portal requiere persistencia nueva; la web no administra bases.
---

# Coordinar una evolución de datos

Leer [frontera de datos](../../../docs/architecture/database.md), el contrato
actual y el diseño del cambio.

Identificar endpoint, datos, compatibilidad y orden de despliegue que necesita
la web. Registrar la migración como tarea del repositorio de la API. Si el alcance
autoriza trabajar allí, leer sus AGENTS y procedimiento antes de cambiar archivos.

No instalar Prisma, añadir DATABASE_URL ni escribir una migración en el portal.
Las credenciales locales se consumen solo en memoria, sin mostrarlas ni copiarlas.
Antes de una operación de producción autorizada, verificar destino, respaldo,
propietario y permisos. No ejecutar borrados, seeders demo ni rollbacks automáticos.

Confirmar resultados de esquema e historial en el entorno real cuando se solicite;
un cliente actualizado no prueba que la migración remota esté aplicada.
