## ADDED Requirements

### Requirement: Captura territorial sin zona interna

El editor SHALL permitir identificar y guardar la ubicación del atractivo con
provincia, cantón, parroquia y coordenadas sin mostrar ni solicitar una zona
turística interna en el formulario, resumen o diferencias de identificación.

#### Scenario: Ficha nueva o importada

- **WHEN** se prepara una ficha nueva o se importa la plantilla MINTUR
- **THEN** no aparece un selector de zona ni se asigna una opción de demostración
- **AND** la ausencia de zona no bloquea el avance ni la creación de la ficha

#### Scenario: Ficha anterior con zona

- **WHEN** se abre o guarda una ficha que conserva una referencia compatible de zona
- **THEN** se conserva esa referencia interna al editar otros datos, sin pedir elegirla

#### Scenario: Resumen y comparación

- **WHEN** se consulta el resumen o se comparan los datos de identificación
- **THEN** se muestran los datos de la ficha sin presentar la zona como campo institucional
