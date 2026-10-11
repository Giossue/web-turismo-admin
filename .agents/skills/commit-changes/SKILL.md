---
name: commit-changes
description: Prepara commits, push o PR de este repositorio cuando el usuario solicita la entrega, con alcance coherente y revisión del diff.
---

# Entregar cambios autorizados

Leer [versionado](../../../docs/quality/version-control.md) y estado Git.

Revisar el diff completo, rama y remoto; identificar trabajo propio y ajeno.
Preparar una unidad coherente con sus docs y evidencia, sin incluir secretos,
archivos privados de entorno, dependencias ni outputs de build.

Usar asunto corto en español con type/scope. Ejecutar las comprobaciones
solicitadas y declarar las pendientes. Hacer commit cuando se pida y push cuando
se pida; no extender una autorización de entrega anterior a trabajo nuevo.

Antes del push, incorporar cambios remotos de forma normal cuando haga falta.
No reescribir historial publicado ni forzar sin solicitud explícita. Confirmar
hash remoto y estado local antes de informar que se subió.
