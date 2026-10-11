## ADDED Requirements

### Requirement: Conservación importada sin estado confirmado

El panel SHALL conservar un estado de conservación sin selección única como
Sin confirmar, junto con los factores y observaciones del componente, sin
deducir un estado de ellos ni exigir completarlo para una API compatible.

#### Scenario: Entorno sin selección y con factores

- **WHEN** la ficha marca Alterado para el atractivo y deja vacío el estado del entorno con factores registrados
- **THEN** se conserva Alterado y el entorno se muestra como Sin confirmar
- **AND** sus factores se envían junto con un estado nulo al guardar

#### Scenario: Estado elegido posteriormente

- **WHEN** la persona selecciona uno de los cuatro estados de conservación
- **THEN** se guarda ese estado conocido sin cambiar los factores ni el otro componente
