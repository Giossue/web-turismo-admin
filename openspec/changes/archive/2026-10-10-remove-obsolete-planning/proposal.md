# Proposal

## Why

La adaptación de CognitiveStack `dev` dejó una carpeta de planificación anterior que
la rama de referencia ya no usa. El usuario pide que el portal use la estructura
actual de esa rama, con OpenSpec como única fuente de planificación.

## What Changes

- Retirar `docs/plans/` del árbol de trabajo; conservar sus ocho documentos originales
  mediante el historial Git y un inventario con commit, rutas y hashes.
- Corregir índices, instrucciones y comentarios para que apunten a fuentes vigentes.
- Registrar la corrección en OpenSpec y mantener los estados declarados de los documentos
  retirados como antecedentes, sin certificar la implementación de sus pendientes.

## Capabilities

### New Capabilities

Ninguna. Es una corrección documental con `skip_specs: true`.

### Modified Capabilities

Ninguna. Se mantienen las specs de comportamiento existentes.

## Impact

Documentación, una skill authored y comentarios del importador MINTUR.
La estructura de planificación queda en `openspec/changes/` y `openspec/specs/`.
Las integraciones instaladas siguen siendo Codex y Claude; el runtime, los contratos,
las dependencias del producto y el stack se conservan.
