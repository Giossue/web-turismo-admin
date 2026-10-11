# tourism-records Specification

## Purpose

Operar fichas turísticas y catastros mediante la API institucional, conservando
sus apartados, borradores, datos publicados y conflictos de guardado.

## Requirements

### Requirement: Center editing workflow

El portal SHALL organizar la ficha en sus 14 apartados y un resumen final,
permitiendo recorrerlos sin perder los valores capturados.

#### Scenario: Regreso a un apartado

- **WHEN** una persona vuelve a un paso de la ficha durante la edición
- **THEN** conserva los valores del formulario y el contexto de la ficha actual

### Requirement: Versioned center writes

El portal SHALL enviar la versión vigente al guardar una ficha y serializar
los guardados de la misma ficha dentro del flujo del cliente.

#### Scenario: Guardados de apartados próximos

- **WHEN** el flujo programa varios guardados de la misma ficha
- **THEN** los envía en serie usando la versión disponible tras el anterior

#### Scenario: Conflicto informado por la API

- **WHEN** la API responde que la versión entra en conflicto
- **THEN** el flujo recupera o comunica el estado vigente según la operación
- **AND** no informa un guardado exitoso que la API rechazó

### Requirement: Editorial lifecycle

El portal SHALL distinguir Borrador, En revisión y Publicado para fichas,
y mostrar las acciones de revisión que el contrato permite al usuario.

#### Scenario: Propuesta sobre una ficha publicada

- **WHEN** se trabaja una propuesta de edición y la API conserva versión publicada
- **THEN** el portal trata la propuesta y la versión publicada como versiones distintas
- **AND** la captura por sí sola no informa que reemplazó la versión pública

### Requirement: Establishment classification

El portal SHALL permitir operar catastros por localidad con clasificación
actividad, tipo y categoría, usando opciones relacionadas de la API.

#### Scenario: Localidades con nombre repetido

- **WHEN** se busca una localidad para un establecimiento
- **THEN** las opciones muestran contexto territorial para distinguirlas
- **AND** el guardado requiere una opción del catálogo

### Requirement: Record deletion confirmation

El portal SHALL ofrecer eliminación administrativa autorizada con el nombre
del registro y sus consecuencias, mostrando éxito o error según la API.

#### Scenario: Eliminación aceptada

- **WHEN** la API confirma la eliminación lógica solicitada
- **THEN** se actualizan los listados afectados
- **AND** se comunica que el historial se conserva

#### Scenario: Eliminación rechazada

- **WHEN** la API rechaza la acción por acceso, estado o relaciones
- **THEN** la confirmación conserva un error recuperable
- **AND** el portal no presenta la operación como completada

### Requirement: Human review of editorial assistance

El portal SHALL tratar la asistencia editorial como una sugerencia que requiere
revisión humana, sin publicarla automáticamente.

#### Scenario: Texto sugerido

- **WHEN** la API devuelve asistencia sobre la descripción
- **THEN** el resultado se utiliza en el flujo de revisión de la ficha
- **AND** no sustituye la decisión institucional de publicación
