## MODIFIED Requirements

### Requirement: Extracted photo boundary

La importación SHALL extraer únicamente fotos PNG/JPEG con firma válida, hasta veinte fotografías y 5 MiB por imagen, sin imponer un límite adicional a la suma de sus bytes; SHALL conservar los límites seguros del libro y su expansión.

#### Scenario: Foto de formato o tamaño no admitido

- **WHEN** se detecta una imagen que no cumple esas condiciones
- **THEN** no se entrega como una foto válida para el flujo de subida

#### Scenario: Foto excesiva

- **WHEN** una fotografía supera 5 MiB
- **THEN** se omite esa fotografía y se informa su número, tamaño y límite individual
- **AND** las otras fotografías admitidas siguen disponibles

#### Scenario: Suma superior al antiguo límite

- **WHEN** las fotos cumplen el límite individual y su suma supera 20 MiB dentro de un libro admitido
- **THEN** no se omiten por el tamaño agregado de las fotografías

## ADDED Requirements

### Requirement: Referencia de valoración del Excel

El panel SHALL presentar el puntaje extraído como información del Excel con su máximo, separado de las advertencias y sin sustituir la valoración calculada por la API.

#### Scenario: Puntaje presente

- **WHEN** el Excel contiene un resumen de valoración
- **THEN** se muestra su puntaje y máximo como referencia informativa

### Requirement: Conteos generales y detalle de guías

El importador SHALL conservar el conteo general de guías especializados, evitar duplicarlo como otro tipo cuando coincide con su desglose y comunicar discrepancias sin atribuir especializaciones ausentes.

#### Scenario: Conteo coincidente con cultura y aventura

- **WHEN** el conteo general positivo coincide con la suma del desglose
- **THEN** se importan los tipos del desglose y se conserva el conteo general en observaciones, sin un aviso de tipo genérico inexistente

#### Scenario: Conteo discrepante sin tipo genérico

- **WHEN** el conteo general difiere del desglose y no tiene opción equivalente
- **THEN** se conserva el dato original en observaciones y se indica revisar los conteos en el apartado Planta turística

### Requirement: Revisión de respuestas de promoción importadas

El importador SHALL señalar preguntas obligatorias sin respuesta única y contradicciones entre plan e inclusión, conservando las respuestas originales sin deducir No de una casilla vacía.

#### Scenario: Paquete sin selección

- **WHEN** el Excel no marca una respuesta única sobre pertenencia a un paquete turístico
- **THEN** se solicita seleccionar Sí o No en el paso 10 antes de publicar

#### Scenario: Plan e inclusión contradictorios

- **WHEN** el Excel marca que no existe plan y que el atractivo está incluido en él
- **THEN** ambas respuestas se conservan y se indica revisarlas en Promoción y comercialización
