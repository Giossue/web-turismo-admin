# Design

## Context

La rama CognitiveStack `dev` se revisó en `0eaedfd`. Sus documentos se adaptan
al portal, usando `3684984` como evidencia local. El análisis completo y la
correspondencia están en `docs/architecture/cognitivestack-adoption.md`.

## Goals / Non-Goals

Fuentes únicas, stack conservado, procedimientos útiles y comportamiento
documentado. No rediseñar pantallas, introducir tenants/ORM/auth ni ejecutar
mutaciones remotas. No convertir pendientes históricos en garantías nuevas.

## Decisions

- Producto y vocabulario en docs/product; decisiones y patrones en arquitectura.
- Specs obtenidas de un cambio de inicialización documental, integradas por el
  archivador del CLI. Las specs no se rellenan editando sus salidas a mano.
- Controles de seguridad existentes enlazados, sin duplicar sus números por todas
  las instrucciones.
- Skills de especialidad locales y workflows generados con OpenSpec 1.14.0.
- Perfil temporal que preserva los siete workflows y desactiva telemetría.
- Planes movidos con contenido intacto a legacy y un índice que explica su estado.
- Excepciones reales de UI documentadas; ninguna regla de plantilla borra un flujo.

ADR: `docs/architecture/adr/0001-adopt-cognitivestack-preserve-stack.md`.

## Risks / Trade-offs

Más documentos requieren índice y mantenimiento por fuente. La plantilla puede
cambiar: registrar commit y revisar diferencias, sin copiar sobre archivos locales.
Las specs son evidencia documental de código, no una comprobación de producción.
Las dependencias OpenSpec siguen usando el parche Bun de braces vigente.

## Migration Plan

Conservar README, guía MINTUR, atribución MUI y controles. Actualizar enlaces a
planes históricos. Crear fuentes y entrypoints; capturar escenarios existentes;
validar estructura/enlaces/frontmatter/formato y revisar lockfile; archivar la base.

## Verification

Comprobación documental, CLI, configuración, regeneración y revisión del diff.
No ejecutar nuevas pruebas de producto, build o acciones en la API remota para
esta adopción. La suite de la entrega de seguridad anterior no se declara una
ejecución de este cambio.

## Open Questions

La solicitud se aplica al portal actual. Extender el knowledge al monorepo vecino
es un alcance separado; su API/móvil conservan instrucciones y stack propios.
