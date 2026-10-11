# ADR 0001: adoptar CognitiveStack y conservar el stack del portal

## Estado

Aceptada el 10 de octubre de 2026 por la solicitud de adaptar el knowledge de
CognitiveStack `dev` conservando el stack, salvo necesidad de seguridad demostrada.

## Contexto

La documentación del portal estaba distribuida entre README, una guía breve de
agentes, planes antiguos y dos documentos operativos. CognitiveStack aporta un
mapa mantenible, criterios cognitivos, controles de fronteras y procedimientos.
Su stack de referencia y sus ejemplos de tenants no describen este repositorio.

## Decisión

Adoptar sus áreas de documentación y ciclo OpenSpec. Redactar los documentos
locales en español con evidencia del código, y mantener una única guía de agentes.

Conservar Next.js App Router, React, TypeScript, MUI v7/MUI X Community,
TanStack Query, React Hook Form, Zod, `fetch`, Bun y el despliegue Docker/Dokploy.
La API externa continúa en NestJS; identidad, persistencia y auditoría siguen
siendo responsabilidad de esa API. OpenSpec es una herramienta de desarrollo.

No hay contrato de tenants en la web. Las reglas de aislamiento se aplican al
alcance real de cada rol, usuario y registro; incorporar organizaciones sería un
cambio de producto y API con su propio diseño.

Los criterios de UI se adaptan a los componentes actuales. El grid conserva
menú de tres puntos, indicador circular y tarjetas móviles. Las pestañas de
catálogos y revisión se documentan como excepciones existentes; cambiarlas exige
un cambio de comportamiento, no una sustitución automática del knowledge.

## Consecuencias

- El proyecto gana un índice, specs y procedimientos compartidos entre agentes.
- No se crean proveedores de auth, ORMs, bases ni sistemas de UI adicionales.
- La planificación usa exclusivamente OpenSpec. Los documentos anteriores conservan
  su contenido en el historial Git, con inventario de recuperación.
- Las integraciones OpenSpec se regeneran con versión y perfil reproducibles,
  sin modificar la configuración personal de los agentes.
- Un cambio posterior del stack por seguridad necesita vulnerabilidad o limitación
  concreta, alternativa evaluada y plan de compatibilidad; la plantilla no lo justifica.

## Evidencia

[Análisis y correspondencia de fuentes](../cognitivestack-adoption.md).
La base de código revisada es `368498451d50a13471256fd8043a5850ef01c598`.
