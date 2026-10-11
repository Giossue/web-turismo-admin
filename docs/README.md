# Knowledge del proyecto

Entrada común para personas y Codex y Claude. El punto de partida
es [AGENTS.md](../AGENTS.md). Este knowledge adapta CognitiveStack `dev` al portal
administrativo que ya existe.

## Fuentes de verdad

| Pregunta                                          | Fuente                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| ¿Para quién existe el portal?                     | [Producto](product/overview.md)                                                   |
| ¿Qué significan sus registros y estados?          | [Dominio](product/domain-model.md) y [glosario](product/glossary.md)              |
| ¿Qué comportamiento está documentado?             | [Especificaciones](../openspec/specs/)                                            |
| ¿Qué cambio se está haciendo?                     | [Cambios OpenSpec](../openspec/changes/)                                          |
| ¿Cómo se construye?                               | [Arquitectura](../ARCHITECTURE.md) y [índice técnico](architecture/index.md)      |
| ¿Qué decisión reemplaza un valor de la plantilla? | [ADRs](architecture/adr/)                                                         |
| ¿Cuándo está listo?                               | [Definition of Done](quality/definition-of-done.md)                               |
| ¿Qué protege y con qué límites?                   | [Seguridad](security/principles.md) y [controles actuales](security/controles.md) |
| ¿Cómo evolucionan las fuentes?                    | [Ciclo de cambios](quality/change-lifecycle.md)                                   |
| ¿De dónde procede la adaptación?                  | [Análisis de CognitiveStack dev](architecture/cognitivestack-adoption.md)         |

El código es evidencia del comportamiento implementado. Si contradice una spec,
registrar y resolver la diferencia; no asumir que una propuesta está desplegada.
Los documentos técnicos explican decisiones y contratos; las specs describen
resultados observables. Enlazar entre ambos evita mantener el mismo requisito dos veces.

## Lectura por tarea

| Tarea                           | Leer                                                      | Skill local                      |
| ------------------------------- | --------------------------------------------------------- | -------------------------------- |
| Pantalla o flujo administrativo | `frontend.md`, brief cognitivo y patrón de la superficie  | `implement-operational-frontend` |
| Sesión, archivos o autorización | Autenticación, acceso, hardening y controles vigentes     | `harden-security`                |
| Revisión de un cambio           | Guía de revisión, arquitectura afectada y cambio OpenSpec | `review-code`                    |
| Problema de rendimiento         | Presupuestos, síntoma y mediciones                        | `optimize-performance`           |
| Cambio de esquema de la API     | Frontera de datos y reglas del repositorio de la API      | `create-migration`               |
| Actualizar knowledge            | Fuente correspondiente y ciclo de cambios                 | `update-documentation`           |
| Commit o push solicitado        | Guía de versionado y diff completo                        | `commit-changes`                 |

Las rutas cortas de arquitectura se resuelven dentro de `docs/architecture/`.
Las skills están en [.agents/skills](../.agents/skills/). Los procedimientos OpenSpec
generados cubren los doce workflows del [perfil local](../openspec/tooling.json).
La [instalación oficial](quality/openspec-installation.md) explica CLI global,
regeneración y las invocaciones por herramienta.
No es necesario leer toda la base en cada tarea.

## Referencias existentes

- [Importar una ficha MINTUR](../openspec/specs/mintur-import/spec.md).
- [Atribución de las plantillas MUI](third-party-notices/mui-templates.md).
- [Referencias generadas](generated/README.md).
- [Arranque y operación](../README.md).

Al cambiar un contrato, actualizar su fuente y los enlaces afectados. Escribir
estado actual, evidencia y pendientes por separado. Un plan histórico no es una
fuente de instrucciones activas.
