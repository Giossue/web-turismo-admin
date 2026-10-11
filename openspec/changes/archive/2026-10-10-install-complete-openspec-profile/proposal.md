# Proposal

## Why

El usuario amplía la adopción a ambos repositorios y solicita instalar OpenSpec
según su guía oficial con todos los workflows e integraciones. La instalación
inicial del panel cubría siete workflows de tres herramientas.

## What Changes

- Actualizar CLI local de 1.14.0 a 1.14.1 e instalar esa versión global.
- Fijar perfil local con doce workflows y delivery both; generar las integraciones de Codex y Claude.
- Retirar las integraciones no utilizadas y sus registros globales.
- Documentar comandos reproducibles y adaptar CognitiveStack también al monorepo.

## Capabilities

### New Capabilities

Ninguna. Tooling y documentación; `skip_specs: true`.

### Modified Capabilities

Ninguna. Las siete specs vigentes conservan sus contratos.

## Impact

Dependencia de desarrollo, lockfile, wrapper, manifiesto, generados, exclusiones
Docker/formato y documentación. No cambia el stack ni el comportamiento del panel.
La adaptación del monorepo se registra en su cambio document-platform-baseline.
