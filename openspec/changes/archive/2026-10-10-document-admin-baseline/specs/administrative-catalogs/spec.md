## Purpose

Mantener catálogos institucionales con relaciones y labels reconocibles,
preservando las referencias existentes a opciones que ya no se ofrecen.

## ADDED Requirements

### Requirement: Catalog management

El portal SHALL ofrecer al administrador las acciones de catálogo soportadas
por la API, con estados pendientes y resultado visible.

#### Scenario: Crear una opción

- **WHEN** el administrador inicia una creación del catálogo seleccionado
- **THEN** el formulario identifica ese catálogo y envía sus campos permitidos
- **AND** actualiza la consulta correspondiente después del éxito

### Requirement: Dependent classification

El portal SHALL conservar la relación actividad de catastro → tipo → categoría,
sin permitir nuevas selecciones incompatibles con el padre elegido.

#### Scenario: Categorías de un tipo

- **WHEN** se abre la gestión de categorías desde un tipo
- **THEN** el formulario conserva identificado su tipo padre
- **AND** volver al listado conserva el contexto del flujo

### Requirement: Retired catalog references

El portal SHALL mostrar referencias retiradas en registros que ya las usan,
permitiendo conservarlas sin ofrecerlas como nuevas asignaciones.

#### Scenario: Editar otros campos de una ficha

- **WHEN** una ficha contiene una opción que ya no está disponible
- **THEN** la opción se identifica como retirada
- **AND** editar otros campos no exige sustituir esa referencia histórica

### Requirement: Relationship deletion errors

El portal SHALL comunicar el rechazo de eliminación que devuelve la API cuando
un tipo de establecimiento aún conserva categorías.

#### Scenario: Tipo con categorías

- **WHEN** la API rechaza eliminar ese tipo por sus categorías relacionadas
- **THEN** la operación no se comunica como exitosa
- **AND** el error permite corregir la condición antes de reintentar
