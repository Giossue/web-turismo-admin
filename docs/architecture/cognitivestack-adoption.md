# Análisis y adaptación de CognitiveStack dev

## Fuente revisada

- Repositorio: [Elvis-WDev/CognitiveStack](https://github.com/Elvis-WDev/CognitiveStack/tree/dev).
- Rama solicitada: `dev`.
- Commit analizado: [`0eaedfdca6feb08929711869982740e7b0de3fe1`](https://github.com/Elvis-WDev/CognitiveStack/tree/0eaedfdca6feb08929711869982740e7b0de3fe1).
- Fecha del commit: 1 de octubre de 2026; revisión local: 10 de octubre de 2026.
- Base del portal: `368498451d50a13471256fd8043a5850ef01c598`.
- Alcance inicial: `web-turismo-admin`. Por solicitud posterior se instala y adapta
  también en `app-turismo-vinculacion`, conservando su stack y fuentes propios.

La rama tiene 94 archivos: 38 documentos en `docs/`, 14 skills canónicas
—siete especialistas y siete de OpenSpec— y sus integraciones para agentes.
Se revisaron las áreas authored, configuración, entrypoints y reglas de los
workflows. No se ejecutaron comandos de bootstrap encontrados en la plantilla.

## Qué aporta

La separación entre producto, comportamiento, arquitectura, seguridad y calidad
evita usar planes antiguos como instrucciones actuales. El brief de pantalla,
los niveles P0–P3 y el presupuesto de acciones aportan criterios útiles para
trabajo administrativo. Los briefs sensibles hacen explícitos acceso por
registro, repetición, concurrencia y fugas. Las skills cargan solo las fuentes
que necesitan y OpenSpec conserva la historia de cambios.

## Supuestos que requirieron adaptación

| Referencia de dev                              | Resolución local                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Express/Prisma/PostgreSQL en el proyecto       | Web Next.js y API NestJS externa; ninguna conexión de datos nueva                        |
| Better Auth                                    | Proveedor institucional existente; no se añaden hashes, tablas ni cookies propias        |
| pnpm/Corepack                                  | Bun declarado y `bun.lock` vigente                                                       |
| Tailwind/shadcn/Lucide                         | MUI v7, MUI X Community e iconos MUI                                                     |
| TanStack Table                                 | DataGrid existente; TanStack Query conserva el estado remoto                             |
| Toast/wrapper de mutación universal            | Snackbar compartido y mutaciones actuales; no se afirma un wrapper inexistente           |
| Tenants en todas las consultas                 | Alcance real de rol/usuario/registro; el contrato web no contiene tenant                 |
| Idempotency-Key y constraints                  | Criterios para coordinar la API; la web actual serializa y envía versión                 |
| Jobs duraderos y webhooks                      | Capacidades futuras de API; el worker Excel es local y cancelable                        |
| Skeletons en tablas                            | Indicador circular compartido del panel                                                  |
| Submódulos en lugar de toda pestaña            | Criterio para nuevas áreas; excepciones actuales de catálogos/revisión conservadas       |
| Confirmación escrita de borrados irreversibles | Eliminación lógica actual con registro/consecuencia; borrado físico exigiría otro diseño |
| Tema inicial según sistema                     | Claro inicial y preferencia explícita existentes                                         |
| Presupuestos numéricos universales             | Objetivos de UX y medición local; sin afirmar que la app ya alcanza esos valores         |
| CLI/profile global por máquina                 | Dependencia fijada y wrapper con perfil temporal, sin modificar configuración personal   |
| Pausas genéricas de skills                     | Alcance y autorización de la sesión prevalecen; no se repite aprobación ya dada          |
| Suites obligatorias para todo cambio           | Evidencia proporcional y pruebas cuando el usuario las solicite                          |

El análisis no identificó una necesidad de cambiar tecnologías del producto.
No constituye una auditoría nueva de la API ni de su despliegue.
La decisión de conservación está en [ADR 0001](adr/0001-adopt-cognitivestack-preserve-stack.md).

## Correspondencia de documentos

Se conserva la estructura de las áreas de dev. Los textos locales describen
el portal y enlazan sus fuentes; no son una copia literal de la plantilla.

| Fuentes de CognitiveStack dev                                                                    | Destino y adaptación                                                                |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `AGENTS.md`, `ARCHITECTURE.md`, `docs/README.md`                                                 | Guía breve, mapa real y rutas por tarea                                             |
| `docs/product/overview.md`, `domain-model.md`, `glossary.md`                                     | Usuarios institucionales y vocabulario turístico                                    |
| `docs/architecture/index.md`, `stack.md`, `bootstrap.md`                                         | Índice, stack conservado y arranque existente                                       |
| `backend.md`, `database.md`, `authentication.md`                                                 | Endpoint local, frontera de API y sesión institucional                              |
| `frontend.md`, `cognitive-architecture.md`, `interface-design.md`                                | Estado, brief de pantalla, jerarquía y superficies                                  |
| `design-foundations.md`, `component-selection.md`, `component-system.md`                         | Tokens y componentes MUI reales                                                     |
| `data-tables.md`, `forms-and-workflows.md`, `feedback-and-states.md`, `navigation-responsive.md` | Grid/tarjetas, editor, Snackbar, URL y excepciones actuales                         |
| `idempotency.md`, `integrations.md`, `deployment.md`                                             | Versión/concurrencia, servicios existentes y Docker/Dokploy                         |
| `adr/0000-template.md`                                                                           | Plantilla local de decisión con evidencia                                           |
| `docs/quality/change-lifecycle.md`, `definition-of-done.md`, `version-control.md`                | Flujo OpenSpec, aceptación y autorización de entrega                                |
| `code-review.md`, `frontend-checklist.md`, `testing.md`                                          | Revisión y evidencia con límites explícitos                                         |
| `performance.md`, `observability.md`, `technical-debt.md`                                        | Medición, responsabilidades remotas y pendientes reales                             |
| `docs/security/principles.md`, `access-control.md`, `hardening.md`, `threat-model.md`            | Fronteras y amenazas del portal, enlazadas a controles vigentes                     |
| `docs/generated/README.md`                                                                       | Referencias futuras solo desde generadores documentados                             |
| `.agents/skills/`                                                                                | Especialistas adaptados y workflows generados; extensión actual con OpenSpec 1.14.1 |
| `AGENTS.md`, `.agents/skills/`, `.claude/`, `CLAUDE.md`                                          | Integraciones de Codex y Claude que remiten a las mismas fuentes                    |
| `openspec/config.yaml`                                                                           | Contexto y reglas locales, sin instrucciones de otro stack                          |

`docs/security/controles.md` y la atribución MUI se conservan como fuentes
específicas del portal. El contrato MINTUR vive en OpenSpec y su integración en
`docs/architecture/integrations.md`: nueve apartados ya se mapean y, junto con las fotos, se envían a la
API cuando la ficha tiene código. El endpoint de análisis no realiza esas escrituras.
La rama `dev` no incluye `docs/plans/`. Se retira esa carpeta de la adaptación;
sus ocho documentos originales se conservan en Git, con commit, rutas y hashes
en el [inventario de retirada](../../openspec/changes/archive/2026-10-10-remove-obsolete-planning/retired-documents.json).
La planificación queda exclusivamente en OpenSpec; no se certifican pendientes
históricos como completados.

## Procedencia y mantenimiento

La rama revisada no incluye `LICENSE`/`COPYING` general para sus textos.
Se conserva la atribución y se redacta una adaptación propia; no se atribuye
una licencia MIT a todo CognitiveStack. OpenSpec declara MIT y sus integraciones
se generan desde su CLI con esa metadata.

La extensión solicitada instala el CLI global 1.14.1 y fija esa versión local en
ambos repositorios. Se amplía de siete a doce workflows para Codex y Claude, con detalle en [instalación](../quality/openspec-installation.md).
El análisis inicial y sus comprobaciones de paridad corresponden al perfil 1.14.0
original; la extensión se mantiene con el CLI 1.14.1, sin editar sus templates.

Para actualizar: fijar el commit nuevo de `dev`, revisar diferencias por área,
adaptar documentos afectados y conservar el ADR del stack. No sincronizar
automáticamente archivos originales sobre fuentes locales. Los workflows se
regeneran con `bun run knowledge:update`, sin edición manual.

La evidencia de adopción es documental: enlaces, formato, frontmatter, config,
validación OpenSpec y revisión del diff/lockfile. No se repite la suite de producto
ni se prueban mutaciones contra producción para cambiar el knowledge.
La base inicial está en su [registro de comprobaciones](../../openspec/changes/archive/2026-10-10-document-admin-baseline/verification.md).
La instalación actual para Codex y Claude está en la
[evidencia de la ampliación](../../openspec/changes/archive/2026-10-10-install-complete-openspec-profile/verification.md).
La corrección de la estructura está en la
[evidencia de retirada](../../openspec/changes/archive/2026-10-10-remove-obsolete-planning/verification.md).
