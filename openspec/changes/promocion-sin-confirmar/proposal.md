# Proposal

## Why

La hoja oculta `Jerarquia` calcula Promoción con las casillas afirmativas y
continúa aunque no haya una respuesta marcada. El importador conserva esa
ausencia, pero la API obliga a completarla con Sí o No para publicar. Esto pide
inventar o investigar un dato que el archivo no confirma.

## What Changes

- Presentar Sí, No y Sin confirmar en las tres preguntas de Promoción.
- Importar las casillas sin respuesta única como Sin confirmar, sin un aviso que
  exija completarlas para publicar.
- Conservar y explicar las contradicciones del archivo sin corregir respuestas
  automáticamente ni bloquear la publicación por ellas.
- Coordinar con la API la publicación y lectura de respuestas desconocidas,
  conservando cero puntos para las preguntas no afirmativas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `mintur-import`: respuestas desconocidas de Promoción sin corrección obligatoria.

## Impact

Importador, preguntas de Promoción y referencia del puntaje. Requiere migración y
API compatible en el repositorio hermano antes de desplegar el panel. La sesión
autoriza implementación, aplicación de la migración, commit y push en ambos
repositorios. No incluye despliegue manual ni suites de pruebas.
