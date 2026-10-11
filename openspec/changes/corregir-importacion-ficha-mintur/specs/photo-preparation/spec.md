## ADDED Requirements

### Requirement: Preparación automática antes de subir

El panel SHALL preparar automáticamente las fotos manuales PNG/JPEG antes de enviarlas a la API, reduciendo su peso y resolución dentro de límites seguros, conservando una imagen legible y el máximo de subida de 5 MiB por foto.

#### Scenario: Foto de origen superior al máximo de subida

- **WHEN** se selecciona una fotografía válida y procesable que supera 5 MiB
- **THEN** el panel muestra su preparación y envía una versión admitida sin pedir reducirla manualmente

#### Scenario: Imagen pequeña

- **WHEN** se prepara una foto cuya resolución ya es pequeña
- **THEN** no se amplía ni se conserva una recodificación que ocupa más que el original admitido

#### Scenario: Fallo de preparación

- **WHEN** una imagen no se puede preparar de forma segura
- **THEN** se informa el fallo para esa foto y se mantiene la posibilidad de subir las otras

#### Scenario: Envío repetido durante la preparación

- **WHEN** se intenta iniciar otra vez la tanda mientras se prepara o sube
- **THEN** no se inicia una segunda tanda ni una segunda petición para la misma acción
