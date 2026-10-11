# Spec Delta

## MODIFIED Requirements

### Requirement: Versioned center writes

El portal SHALL enviar la versión vigente al guardar una ficha y serializar los guardados de la misma ficha dentro del flujo del cliente, incluidos los apartados importados. La recuperación de un conflicto SHALL consultar la API aunque el dato local se considere fresco.

#### Scenario: Guardados de apartados próximos

- **WHEN** el flujo programa varios guardados de la misma ficha
- **THEN** los envía en serie usando la versión disponible tras el anterior

#### Scenario: Conflicto informado por la API

- **WHEN** la API responde que la versión entra en conflicto
- **THEN** el flujo recupera o comunica el estado vigente según la operación
- **AND** no informa un guardado exitoso que la API rechazó

#### Scenario: Conflicto con detalle local reciente

- **WHEN** la API informa un conflicto y el detalle local todavía se considera fresco
- **THEN** la recuperación consulta la API y adopta el detalle vigente solo si la lectura termina correctamente
- **AND** un fallo de recuperación conserva los valores locales y comunica que no se pudo recargar

#### Scenario: Importación y autoguardado de la misma ficha

- **WHEN** la importación y un formulario programan guardados sobre la misma ficha
- **THEN** se ejecutan en serie y la respuesta confirmada actualiza la versión antes de la siguiente escritura
