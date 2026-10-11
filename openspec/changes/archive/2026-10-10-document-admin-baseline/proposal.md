# Proposal

## Why

La documentación anterior mezclaba contratos vigentes y planes históricos.
Se solicita adoptar CognitiveStack `dev` para que los agentes trabajen con fuentes
actuales y navegables, conservando el stack del portal.

## What Changes

- Crear el mapa de knowledge, docs de producto/arquitectura/calidad/seguridad y ADR.
- Adaptar especialistas y generar integraciones OpenSpec para los tres agentes.
- Capturar una base documental del comportamiento existente, contrastada con código.
- Conservar los ocho planes como historia y enlazar documentación específica vigente.
- Fijar CLI y perfil OpenSpec como tooling de desarrollo.

No se cambia comportamiento de producto, API, UI, roles o despliegue. Las capacidades
siguientes son nuevas fuentes de especificación de funciones que ya existen.

## Capabilities

### New Capabilities

- `institutional-access`: acceso, sesión, cierre y protección de identidad.
- `tourism-records`: fichas, apartados, guardado, catastro y ciclo editorial.
- `administrative-catalogs`: relaciones, opciones y referencias retiradas.
- `review-and-moderation`: revisión de propuestas y opiniones.
- `operational-interface`: navegación, listados, filtros, feedback y consultas administrativas.
- `mintur-import`: análisis autorizado y acotado de fichas Excel para el editor.
- `location-capture`: selección y confirmación de coordenadas.

### Modified Capabilities

Ninguna. No había specs principales antes de la adopción.

## Impact

Documentos, instrucciones, configuración de agentes y herramienta de desarrollo.
La base es el código `3684984`, sin certificación del entorno remoto.
En `src/` solo se corrigen referencias documentales de comentarios. No se cambia
lógica de producto, pruebas, contratos NestJS ni datos.
