## ADDED Requirements

### Requirement: Place search in map selector

El selector SHALL permitir buscar un lugar de Ecuador por nombre y, al elegir un
resultado, centrar el mapa y colocar el punto sin confirmar el formulario.

#### Scenario: Elegir un resultado

- **WHEN** se escribe al menos dos caracteres y se elige un resultado
- **THEN** el mapa se centra en él y el punto queda marcado
- **AND** latitud y longitud del formulario cambian solo al confirmar Usar esta ubicación

#### Scenario: Búsqueda sin resultado o con error

- **WHEN** la búsqueda no devuelve resultados o el servicio falla
- **THEN** se comunica sin bloquear la selección manual en el mapa
