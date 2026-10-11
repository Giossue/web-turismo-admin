# Design

## Context

Ver [proposal.md](proposal.md). TanStack Query mantiene datos privados en memoria; `AdminSession` vacía las consultas al cambiar identidad y el cliente comprueba generación. Los listados comparten claves pero gestión de catastro omite sus opciones canónicas. Las lecturas no consumen el signal de consulta. La ficha usa un scope de guardado; la importación guarda directamente fuera de ese scope.

## Goals / Non-Goals

**Goals:** lecturas cancelables, recuperación efectiva del detalle vigente, importación que conserve apartados existentes y transiciones comprensibles en las superficies actuales.

**Non-Goals:** persistir caché privada, cambiar contratos o permisos, añadir servicios de caché, migrar dependencias, operar producción o desplegar.

## Decisions

- Mantener claves y límites de sesión. Las funciones de lectura aceptarán un `AbortSignal` opcional y cada query lo transmitirá hasta `fetch`. El timeout y la exclusión de caché HTTP permanecen.
- Centralizar la lectura forzada y el almacenamiento confirmado del detalle. Cancelar una lectura previa del detalle y consultar con frescura cero tras un 409 evita reutilizar una respuesta local considerada fresca. Un fallo de recuperación se comunica sin reiniciar el formulario.
- Guardar cada apartado importado mediante el mismo scope de mutación de la ficha. Leer su versión al ejecutar, consultar si falta detalle y reevaluar la existencia del apartado después de un 409 antes del único reintento. El scope espera la actualización confirmada de caché antes de continuar.
- Mantener 10 segundos de frescura para listados/resumen y actualización al recuperar foco/conexión. Catálogos, detalle e historial conservan 60 segundos y los formularios mantienen sus ediciones. No activar recargas globales de formularios ni polling de todas las pantallas.
- Ampliar `AdminDataGrid` con estado de actualización, bloqueo de acciones y actualización manual. Un contexto compartido bloquea menús de fila también si estaban abiertos; las acciones primarias de tarjetas respetan el mismo bloqueo. Mantener filas y total durante cambios de página/filtro; diferenciar carga inicial y actualización.

Brief de interfaz: usuario administrador/agente; objetivo encontrar y operar registros vigentes; decisión seleccionar un registro con resultados del filtro actual; información mínima filas, filtros, total y estado de actualización; acción principal propia del módulo y acción secundaria Actualizar. P0 son registros y acciones disponibles, P1 filtros/paginación y estado de carga; no se añaden P2/P3 ni detalles técnicos al flujo.

Frontera sensible: API autoriza por acción/registro y valida payload/versiones; el cliente limita reintentos, serializa sus guardados y descarta respuestas de otra generación. Auditoría y atomicidad siguen en la API. Los mocks comprueban el contrato del cliente, no certifican la API desplegada.

## Risks / Trade-offs

- Más lecturas al recuperar foco → solo consultas antiguas de listados/resumen; se preserva la frescura y se cancela el transporte abandonado.
- Otro escritor puede actuar después de la consulta de importación → reenviar la versión consultada y conservar el rechazo de la API; no añadir una garantía atómica de backend que la web no posee.
- Conservar filas anteriores puede confundir → estado accesible de actualización y bloqueo de sus acciones hasta recibir el resultado actual.
- Cancelar un transporte no revierte una escritura → solo las lecturas usan el signal de consultas; las mutaciones conservan el tratamiento de resultado desconocido.

## Migration Plan

Cambio local del portal compatible con los endpoints actuales, sin migraciones ni orden de despliegue entre repositorios. Comprobar formato, lint, tipos, suite y build; comprobar transiciones de escritorio/móvil y foco con Playwright y API simulada. La publicación queda fuera de esta solicitud.
