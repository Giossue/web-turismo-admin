## ADDED Requirements

### Requirement: Error recuperable de publicación incompleta

El panel SHALL conservar los errores de aprobación dentro del diálogo y ofrecer acceso a revisar la ficha; los errores conocidos de respuestas de Promoción SHALL identificar el apartado y las preguntas que requieren Sí o No, sin alterar la decisión de la API.

#### Scenario: Respuesta obligatoria incompleta

- **WHEN** la API rechaza la publicación por respuestas incompletas de Promoción
- **THEN** el diálogo mantiene el error con las preguntas y el paso 10 y permite abrir la ficha para revisarla

#### Scenario: Nueva revisión o reintento

- **WHEN** se inicia la revisión de otra ficha o se reintenta la decisión
- **THEN** se limpia el error de la revisión anterior
