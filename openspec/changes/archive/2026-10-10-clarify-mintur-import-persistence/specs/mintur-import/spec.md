## ADDED Requirements

### Requirement: Editor persistence of imported data

El editor SHALL mantener el formulario principal importado como cambios locales
y activar el guardado de apartados pendientes y la carga de fotos cuando la ficha
tiene código. Los apartados que ya aparecen en el detalle consultado por el
cliente se omiten; la API decide las escrituras efectivas.

#### Scenario: Ficha nueva sin código

- **WHEN** termina la importación en una ficha que todavía no tiene código
- **THEN** los apartados y las fotos permanecen pendientes
- **AND** su envío se activa cuando la creación de la ficha proporciona un código

#### Scenario: Importación sobre una ficha existente

- **WHEN** termina la importación en el editor de una ficha con código
- **THEN** se activa el guardado de apartados pendientes y la carga de fotos
- **AND** esa activación no requiere una confirmación adicional de importación
- **AND** no publica la ficha

#### Scenario: Apartado presente en el detalle consultado

- **WHEN** el editor encuentra un apartado importado en el detalle consultado
- **THEN** omite ese apartado en el guardado de los pendientes

#### Scenario: Error parcial de carga de fotos

- **WHEN** no se pueden subir algunas de las fotos importadas
- **THEN** se conservan esas fotos pendientes y se ofrece reintento
- **AND** el error no se presenta como fallo de la creación ya completada de la ficha
