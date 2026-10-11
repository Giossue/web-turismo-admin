## Purpose

Permitir al administrador decidir sobre propuestas y opiniones mediante
los estados y operaciones de revisión definidos por la API institucional.

## ADDED Requirements

### Requirement: Center review decisions

El portal SHALL ofrecer Aprobar y publicar o Devolver para corregir en la
revisión de fichas, mostrando el resultado confirmado por la API.

#### Scenario: Aprobación aceptada

- **WHEN** la API acepta aprobar y publicar una propuesta
- **THEN** se actualizan los datos y la cola de revisión

#### Scenario: Devolución para corregir

- **WHEN** se devuelve una propuesta con un motivo y la API acepta la acción
- **THEN** la ficha vuelve al estado de borrador que devuelve la API
- **AND** el motivo se conserva en el flujo de corrección

### Requirement: Distinct establishment review

El portal SHALL conservar el flujo de revisión de catastro y sus estados,
incluido Rechazado, sin reemplazarlos por los de las fichas.

#### Scenario: Decisión sobre un catastro

- **WHEN** se revisa una propuesta de establecimiento
- **THEN** las acciones y el estado mostrado corresponden a su contrato de catastro

### Requirement: Opinion moderation

El portal SHALL permitir consultar y moderar opiniones con sus versiones y
estados de la API, sin tratar una edición pendiente como ya publicada.

#### Scenario: Edición de una opinión publicada

- **WHEN** la API devuelve una versión publicada y una edición pendiente
- **THEN** el panel las distingue al revisar
- **AND** la nueva versión requiere una decisión de moderación

### Requirement: Review access rejection

El portal SHALL reflejar acceso administrativo en navegación y acciones y
respetar el rechazo de una operación que la API no autoriza.

#### Scenario: Cuenta de agente intenta revisión administrativa

- **WHEN** una cuenta sin rol de administrador navega a revisión
- **THEN** el shell resuelve un destino institucional permitido

#### Scenario: La API deniega una decisión

- **WHEN** la API rechaza una petición de revisión por permisos
- **THEN** el portal muestra el error
- **AND** no actualiza el registro como si la decisión hubiera ocurrido
