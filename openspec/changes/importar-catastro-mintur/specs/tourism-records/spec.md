## ADDED Requirements

### Requirement: Importación del catastro nacional MINTUR

La administración SHALL poder importar el consolidado nacional del MINTUR
(.xlsx) desde Establecimientos. La importación SHALL leer toda hoja cuyos
encabezados correspondan al catastro, crear o actualizar por número de registro,
conservar la fila original completa y el estado del registro, y mostrar el avance
y un resumen con los motivos de cada fila omitida. Los agentes turísticos no
SHALL ver ni usar esta importación.

#### Scenario: Consolidado con activos, suspendidos e inactivos

- **WHEN** la administración importa el consolidado con las hojas Consolidado, Suspensión e Inactivo
- **THEN** se guardan los registros con su estado MINTUR
- **AND** solo los ratificados o pendientes de inspección quedan activos y visibles en la app

#### Scenario: Registro existente

- **WHEN** un número de registro ya existe
- **THEN** se actualizan sus datos sin cambiar su responsable ni su revisión
- **AND** no se restaura si fue eliminado en el panel
- **AND** sus coordenadas exactas no se reemplazan por una ubicación aproximada

#### Scenario: Fila sin coordenadas válidas

- **WHEN** una fila no trae coordenadas dentro del Ecuador
- **THEN** se ubica en el centro de los registros de su parroquia o cantón y se marca como aproximada
- **AND** si no hay referencia cercana se omite con ese motivo
