## MODIFIED Requirements

### Requirement: Revisión de respuestas de promoción importadas

El importador SHALL conservar las respuestas originales de Promoción y
representar una pregunta sin respuesta única como Sin confirmar, sin deducir No
ni exigir completarla para publicar. El formato oficial admite que el atractivo
figure incluido en un plan aunque el cantón no tenga uno propio; el importador
SHALL conservar ambas respuestas sin advertirlo como contradicción.

#### Scenario: Paquete sin selección

- **WHEN** el Excel no marca una respuesta única sobre pertenencia a un paquete turístico
- **THEN** la pregunta se precarga como Sin confirmar
- **AND** no aparece una instrucción obligatoria de completar esa pregunta antes de publicar

#### Scenario: Plan e inclusión contradictorios

- **WHEN** el Excel marca que no existe plan y que el atractivo está incluido en él
- **THEN** ambas respuestas se conservan
- **AND** la importación no muestra un aviso por esa combinación
