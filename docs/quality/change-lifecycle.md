# Ciclo de cambios

CognitiveStack aporta criterios de ingeniería; OpenSpec registra el cambio.
El [índice de knowledge](../README.md) asigna una fuente a cada tipo de información.

## Cuándo usarlo

Un comportamiento nuevo, una pantalla, un permiso o un contrato de API no trivial
se especifica en `openspec/changes/<nombre>/`. Una corrección documental, formato
o ajuste que no cambia comportamiento puede resolverse directamente. Un refactor
grande puede usar un cambio con `skip_specs: true` y tareas proporcionales.

La planificación se mantiene exclusivamente en OpenSpec. Los ocho documentos
anteriores se retiraron del árbol de trabajo y conservan su contenido en Git;
su [inventario](../../openspec/changes/archive/2026-10-10-remove-obsolete-planning/retired-documents.json)
registra commit, rutas y hashes para recuperarlos. Al retomar un pendiente, contrastar
el código y proponer un cambio actual; una spec nueva no certifica su resolución.

## Flujo

Explorar → proponer → revisar → aplicar → comprobar → archivar.

| Fase      | Resultado                                                      |
| --------- | -------------------------------------------------------------- |
| Explorar  | Problema, alcance, evidencia y opciones                        |
| Proponer  | Motivo, capacidades, escenarios, diseño y tareas               |
| Revisar   | Coherencia con producto, fronteras y autorización de la sesión |
| Aplicar   | Unidades coherentes con los componentes y skills locales       |
| Comprobar | Evidencia de criterios y reporte explícito de lo no comprobado |
| Archivar  | Deltas integrados en specs y registro de lo completado         |

Actualizar artifacts cuando una decisión cambie. Sincronizar permite incorporar
deltas sin archivar; no hacerlo para presentar trabajo pendiente como vigente.

## Autorización

Las instrucciones del usuario prevalecen sobre recomendaciones de las skills.
Conservar el alcance ya autorizado. Una petición de análisis/propuesta autoriza
ese resultado; una petición explícita de implementación permite completar la
implementación y preparar sus artifacts sin pedir otra confirmación rutinaria.

Los workflows generados son herramientas opcionales para ejecutar cada fase.
Cuando se pide únicamente `propose` o `explore`, respetar ese alcance de planificación.
No interponerlos como una nueva barrera ante una tarea ya autorizada. No realizar
commit, push, despliegue ni cambios de otro repositorio sin el alcance correspondiente.

## CLI reproducible

```bash
bun run openspec list --json
bun run openspec new change documentar-capacidad
bun run openspec status --change documentar-capacidad --json
bun run openspec instructions design --change documentar-capacidad --json
bun run openspec validate --all --strict
bun run knowledge:update
```

`openspec` en un ejemplo generado significa `bun run openspec` en este proyecto.
La versión 1.14.1 está fijada en desarrollo tras instalar la guía oficial.
El wrapper aísla el perfil personal, fija los doce workflows de `openspec/tooling.json` y desactiva telemetría
y actualización automática. Usar el wrapper también al regenerar.

| Workflow    | Codex                      | Claude          |
| ----------- | -------------------------- | --------------- |
| Explorar    | `$openspec-explore`        | `/opsx:explore` |
| Proponer    | `$openspec-propose`        | `/opsx:propose` |
| Actualizar  | `$openspec-update-change`  | `/opsx:update`  |
| Aplicar     | `$openspec-apply-change`   | `/opsx:apply`   |
| Comprobar   | `$openspec-verify-change`  | `/opsx:verify`  |
| Sincronizar | `$openspec-sync-specs`     | `/opsx:sync`    |
| Archivar    | `$openspec-archive-change` | `/opsx:archive` |

Los nombres concretos de artifacts y salidas se obtienen del CLI. Usar la raíz
local; no registrar stores compartidos o remotos como efecto secundario.

Los opcionales restantes son `new`, `continue`, `ff`, `bulk-archive` y `onboard`.
En Codex se invocan `$openspec-new-change`, `$openspec-continue-change`,
`$openspec-ff-change`, `$openspec-bulk-archive-change` y `$openspec-onboard`.
Para Claude, consultar la [instalación](openspec-installation.md).
Se instalan todos, sin ejecutar tutoriales o ampliar el alcance autorizado.

## Redactar specs

Una capacidad describe comportamiento duradero, por ejemplo `institutional-access`.
El cambio expresa intención, por ejemplo `add-session-expiry-notice`.
Cada requirement tiene `### Requirement:`, SHALL o MUST y al menos un escenario
con `#### Scenario:` y condiciones WHEN/THEN. Los deltas usan ADDED, MODIFIED,
REMOVED o RENAMED Requirements; las specs principales contienen Requirements.

Describir resultados observables y rechazos, no nombres de tablas ni detalles
de librería. Conservar el comportamiento previo cuando solo se documenta una base.
No editar `openspec/specs/` para adelantar una propuesta: sincronizar o archivar
el cambio que describe lo implementado.

Las skills `openspec-*`, comandos y prompts se generan con el CLI; las reglas
del proyecto viven en `openspec/config.yaml`, AGENTS y docs. Las skills de
especialidad son authored y enlazan las fuentes relevantes.
