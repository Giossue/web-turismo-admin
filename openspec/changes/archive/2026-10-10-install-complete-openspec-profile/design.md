# Design

## Context

La primera adopción conservó Next/MUI/Bun y generó el perfil presente en CognitiveStack.
La guía actual instala CLI global y por proyecto; la versión 1.14.1 admite cincuenta
herramientas y doce workflows. La nueva solicitud incluye también API y móvil.

## Goals / Non-Goals

**Goals:** instalación completa, regeneración reproducible y coordinación documental
entre repositorios conservando sus gestores.

**Non-Goals:** incorporar otros clientes de IA, activar un cloud coding agent,
modificar runtime, ejecutar suites del producto o publicar cambios remotos.

## Decisions

- Fijar 1.14.1 en dependencia y manifiesto; comprobar versión en el wrapper.
- Usar configuración temporal del CLI para conservar el perfil personal del usuario.
- Generar archivos mediante init/update y mantener las reglas propias en AGENTS/docs/config.
- Excluir las raíces generadas del contexto Docker y de Prettier.
- Conservar los destinos oficiales de Codex y Claude en ambos repositorios.
- Conservar el resultado de la primera adopción como evidencia histórica; registrar
  esta ampliación por separado para distinguir versiones y perfiles.

## Risks / Trade-offs

- Muchos archivos generados → hashes de inventario y regeneración, sin edición manual.
- Perfil global reducido → scripts locales con workflows fijados en tooling.json.
- Confundir instalación con implementación → specs de producto sin cambios y evidencia
  que declara suites, despliegue y producción no comprobados.

## Migration Plan

Instalar global y local sin scripts de terceros; generar Codex y Claude;
actualizar docs; comprobar lockfile, inventario, formato y regeneración. No hay
migración ni cambio de datos. Reiniciar el cliente para redescubrir los workflows.
