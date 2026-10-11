## MODIFIED Requirements

### Requirement: Revisión de respuestas de promoción importadas

El importador SHALL conservar las respuestas originales de Promoción y
representar una pregunta sin respuesta única como Sin confirmar, sin deducir No
ni exigir completarla para publicar. SHALL explicar las contradicciones entre
plan e inclusión sin reemplazar respuestas del archivo.

#### Scenario: Paquete sin selección

- **WHEN** el Excel no marca una respuesta única sobre pertenencia a un paquete turístico
- **THEN** la pregunta se precarga como Sin confirmar
- **AND** no aparece una instrucción obligatoria de completar esa pregunta antes de publicar

#### Scenario: Plan e inclusión contradictorios

- **WHEN** el Excel marca que no existe plan y que el atractivo está incluido en él
- **THEN** ambas respuestas se conservan
- **AND** se informa la contradicción como un dato del archivo que no bloquea por sí solo la publicación
