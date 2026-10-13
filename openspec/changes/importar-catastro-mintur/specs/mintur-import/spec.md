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

## ADDED Requirements

### Requirement: Meses recomendables y tiempo de desplazamiento importados

El importador SHALL llevar los meses recomendables de visita a su selector de
meses en Características y el tiempo de desplazamiento en auto a su campo en
Accesibilidad, sin copiarlos en las observaciones. Si el texto de meses no
contiene meses reconocibles, SHALL advertirlo para seleccionarlos a mano.

#### Scenario: Meses y tiempo de la ficha

- **WHEN** el Excel indica «Febrero, Marzo y Noviembre» y un tiempo de 00:02
- **THEN** el editor muestra esos tres meses seleccionados y el tiempo 00:02
- **AND** ninguna observación repite esos datos
