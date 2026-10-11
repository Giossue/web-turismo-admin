## MODIFIED Requirements

### Requirement: Extracted photo boundary

La importación SHALL preparar automáticamente fotos PNG/JPEG con firma válida, hasta veinte fotografías, con máximo de salida de 5 MiB por imagen y sin imponer un límite adicional a la suma de sus bytes; SHALL conservar los límites seguros del libro, su expansión, recursos de imagen y worker.

#### Scenario: Foto grande válida

- **WHEN** una fotografía válida supera 5 MiB de origen dentro de los límites seguros
- **THEN** el sistema reduce su resolución y peso automáticamente antes de entregarla para subir
- **AND** no exige que la persona edite la fotografía fuera del panel

#### Scenario: Foto dañada o fuera de recursos

- **WHEN** la fotografía no tiene firma válida, no se puede decodificar o excede los recursos admitidos
- **THEN** se omite con explicación segura y se conservan las otras fotos preparadas

#### Scenario: Suma superior al antiguo límite

- **WHEN** las fotos preparadas cumplen el límite individual dentro de un libro admitido
- **THEN** no se omiten por el tamaño agregado de las fotografías

### Requirement: Referencia de valoración del Excel

El panel SHALL presentar el puntaje extraído como evaluación técnica del Excel, con su máximo y desglose accesible de criterios, separado de advertencias y sin sustituir la valoración calculada por la API.

#### Scenario: Puntaje presente

- **WHEN** el Excel contiene un resumen de valoración
- **THEN** se identifica qué evalúa ese puntaje y se ofrece abrir los puntos y máximo de cada criterio
- **AND** los resultados cero o sin información conservan esa distinción

### Requirement: Revisión de respuestas de promoción importadas

El importador SHALL señalar preguntas obligatorias sin respuesta única y contradicciones entre plan e inclusión, explicando plan municipal y oferta turística organizada y conservando las respuestas originales sin deducir No de una casilla vacía.

#### Scenario: Paquete sin selección

- **WHEN** el Excel no marca una respuesta única sobre pertenencia a un paquete turístico
- **THEN** se explica que se pregunta por una oferta organizada de agencia, operadora o administrador y se identifica el paso 10 antes de publicar

#### Scenario: Plan e inclusión contradictorios

- **WHEN** el Excel marca que no existe plan y que el atractivo está incluido en él
- **THEN** ambas respuestas se conservan y se explica que se refieren al plan municipal de promoción del cantón

## ADDED Requirements

### Requirement: Conteos generales y detalle de guías

El importador SHALL conservar el conteo general de guías especializados, evitar duplicarlo como otro tipo cuando coincide con su desglose y comunicar discrepancias sin atribuir especializaciones ausentes.

#### Scenario: Conteo coincidente con cultura y aventura

- **WHEN** el conteo general positivo coincide con la suma del desglose
- **THEN** se importan los tipos del desglose y se conserva el conteo general en observaciones, sin un aviso de tipo genérico inexistente

#### Scenario: Conteo discrepante sin tipo genérico

- **WHEN** el conteo general difiere del desglose y no tiene opción equivalente
- **THEN** se conserva el dato original en observaciones y se indica revisar los conteos en el apartado Planta turística
