# Evidencia de retirada de la planificación anterior

Fecha: 10 de octubre de 2026. Cambio documental solicitado por el usuario.

## Fuente y recuperación

- `git fetch --depth 1 origin dev` confirmó el commit remoto de CognitiveStack
  `0eaedfdca6feb08929711869982740e7b0de3fe1`.
- El árbol de esa rama contiene `openspec/changes/` y `openspec/specs/`, sin
  `docs/plans/`. El árbol local del portal también queda sin esa carpeta.
- Los ocho documentos retirados coincidían byte por byte con sus originales
  versionados en `368498451d50a13471256fd8043a5850ef01c598`.
- El [inventario](retired-documents.json) conserva las rutas originales, SHA-256,
  títulos y estados declarados. Recuperación: `git show <sourceCommit>:<path>`.
  Esos estados históricos no certifican implementación ni despliegue.

## Comprobaciones

- Routing, índices y skill de documentación usan OpenSpec para planificar.
  Los comentarios del importador enlazan su spec vigente. La integración MINTUR
  se documenta en `docs/architecture/integrations.md`; su guía independiente se retira.
- Los hashes de las siete specs, 36 archivos generados para Codex y Claude,
  wrapper, manifiesto, tooling y lockfile coinciden con los anteriores a esta retirada.
- Inventario de integración: dos herramientas, doce workflows, 24 skills y doce
  comandos locales. No hay integraciones OpenSpec adicionales.
- Las siete skills authored superan la comprobación de frontmatter.
- OpenSpec estricto acepta las siete specs y este cambio sin deltas, conforme a
  `skip_specs: true`. `git diff --check` pasa.
- El bloque generado por Next.js permanece idéntico al original. Los cambios
  de `src/` respecto al commit base están limitados a comentarios.
- Formato correcto mediante `bun run format`. Los 134 enlaces locales revisados
  resuelven en el árbol final, incluido este archivo.
- El CLI archivó el cambio como `2026-10-10-remove-obsolete-planning`, con
  `specsUpdated: false`. La validación estricta posterior acepta las siete specs.

## Límites

No se ejecutaron suites de producto, builds, migraciones ni operaciones de producción.
Esta retirada conserva el stack y los contratos; no cierra pendientes funcionales
de los documentos anteriores. Estas comprobaciones preceden al commit y push de la entrega.
